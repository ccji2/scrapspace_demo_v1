var vec3 = global.MathLib.vec3;
var vec4 = global.MathLib.vec4;
var quat = global.MathLib.quat;
var mat4 = global.MathLib.mat4;

var FRAMES_PER_COMMIT = 2; //the rate at which we commit points to the spline
var MIN_DISTANCE = 1; //the minimum distance before we add a new point to the spline
var MAX_PREVIEW_STEPS = 30; //the maximum number of steps we generate a preview for
var STEPS_PER_PREVIEW_COMMIT = 4; //the rate at which we commit points to the preview spline
var PREVIEW_MIN_DISTANCE = 0.01; //the minimum distance between committed points on the preview spline
var PREVIEW_CUTOFF = 0.1; //the distance from the real cursor at which we end the preview
var TAIL_DOWNSAMPLE = 0.5; //how much we downsample the tail mesh by for performance

function cloneVec3(v) {
    return new vec3(v.x, v.y, v.z);
}

function cloneVec4(v) {
    return new vec4(v.x, v.y, v.z, v.w);
}

function mix(a, b, t) {
    return (1.0 - t) * a + t * b;
}

function clamp(x, min, max) {
    return Math.min(max, Math.max(min, x));
}

function linearstep(left, right, x) {
    return clamp((x - left) / (right - left), 0.0, 1.0);
}

function AABB() {
    this.min = new vec3(999999999.0, 999999999.0, 999999999.0);
    this.max = new vec3(-999999999.0, -999999999.0, -999999999.0);
}

//expand to contain the point
AABB.prototype.addPoint = function(p) {
    this.min.x = Math.min(this.min.x, p.x);
    this.min.y = Math.min(this.min.y, p.y);
    this.min.z = Math.min(this.min.z, p.z);

    this.max.x = Math.max(this.max.x, p.x);
    this.max.y = Math.max(this.max.y, p.y);
    this.max.z = Math.max(this.max.z, p.z);
};

//if inside returns 0, otherwise returns the distance
AABB.prototype.distance = function(p) {
    var closestPoint = new vec3(
        clamp(p.x, this.min.x, this.max.x),
        clamp(p.y, this.min.y, this.max.y),
        clamp(p.z, this.min.z, this.max.z)
    );

    return p.distance(closestPoint);
};

function Path(brush, initialPoint, initialRadius, initialColor, scales, parent) {
    this.frame = 0;
    this.brush = brush;
    this.parent = parent || null;

    this.points = [cloneVec3(initialPoint)]; //committed points - these are now static
    this.radii = [initialRadius]; //committed radii, now fixed forever
    this.colors = [cloneVec4(initialColor)]; //committed colors, now fixed forever
    this.tangents = []; //static tangents, now fixed forever
    this.normals = []; //static normals, now fixed forever
    //we can fully construct the mesh up to and including the penultimate committed point
    //the segment from the penultimate point to the final point and then the extrapolated curve beyond are all part of the live tail
    //we have static tangents and normals for all up to and including the penultimate committed point

    this.previewPoints = [];

    this.committedSplines = [];
    this.tailSplines = [];

    if (this.brush.profiles != undefined) {
        for (var i = 0; i < this.brush.profiles.length; ++i) {
            var profile = this.brush.profiles[i];
            var tailProfile = profile.clone();
            tailProfile.sliceDensity = Math.ceil(tailProfile.sliceDensity * TAIL_DOWNSAMPLE);
            tailProfile.maxSlices = Math.ceil(tailProfile.maxSlices * TAIL_DOWNSAMPLE);

            this.committedSplines.push(new CubicSplineMesh(profile, scales, this.parent));
            this.tailSplines.push(new CubicSplineMesh(tailProfile, scales, this.parent));
        }
    }

    this.headPosition = cloneVec3(initialPoint);
    this.headVelocity = new vec3(0, 0, 0);

    this.framesSinceLastCommit = 0;
    this.aabb = new AABB();

    this.visible = true;
}

/*
computes the tangent at point1
when alpha =
    0: uniform
    0.5: centripetal
    1.0: chordal
*/
function computeTangent(point0, point1, point2, alpha) {
    var t0 = 0,
        t1 = t0 + Math.pow(point0.distance(point1), alpha),
        t2 = t1 + Math.pow(point1.distance(point2), alpha);

    var tangent = new vec3(0, 0, 0);
    tangent.x =
        ((point1.x - point0.x) / (t1 - t0) - (point2.x - point0.x) / (t2 - t0) + (point2.x - point1.x) / (t2 - t1)) *
        (t2 - t1);
    tangent.y =
        ((point1.y - point0.y) / (t1 - t0) - (point2.y - point0.y) / (t2 - t0) + (point2.y - point1.y) / (t2 - t1)) *
        (t2 - t1);
    tangent.z =
        ((point1.z - point0.z) / (t1 - t0) - (point2.z - point0.z) / (t2 - t0) + (point2.z - point1.z) / (t2 - t1)) *
        (t2 - t1);

    return tangent;
}

function parallelTransport(normal, startTangent, endTangent) {
    startTangent = startTangent.normalize();
    endTangent = endTangent.normalize();

    var bitangent = startTangent.cross(endTangent);

    if (bitangent.length < 0.0001) {
        return normal;
    } else {
        var theta = Math.acos(startTangent.dot(endTangent));
        var rotation = quat.angleAxis(theta, bitangent.normalize());

        var newNormal = mat4.fromRotation(rotation).multiplyDirection(normal);
        return newNormal.normalize();
    }
}

function computeOrthogonalVector(v) {
    v = v.normalize();
    var up = Math.abs(v.y) < 0.9 ? new vec3(0, 1, 0) : new vec3(1, 0, 0);
    return v.cross(up).normalize();
}

Path.prototype.commitPoint = function(newPointPosition, newPointRadius, newPointColor) {
    //add the new point to the end
    this.points.push(newPointPosition);
    this.radii.push(newPointRadius);
    this.colors.push(newPointColor);

    if (this.points.length === 2) {
        //if this was the second point that we added
        //we can at least compute a tangent and a normal for the first point

        var firstTangent = this.points[1].sub(this.points[0]);
        var firstNormal = computeOrthogonalVector(firstTangent);

        this.tangents.push(firstTangent);
        this.normals.push(firstNormal);

        for (var i = 0; i < this.committedSplines.length; ++i) {
            this.committedSplines[i].addPoint(this.points[0], firstTangent, firstNormal, this.radii[0], newPointColor);
        }
    } else {
        //add spline segment from 3rd to last point to 2nd to last point to the static mesh (as this segment will no longer change)

        var penultimateTangent = computeTangent(
            this.points[this.points.length - 3],
            this.points[this.points.length - 2],
            this.points[this.points.length - 1],
            1.0
        );
        var penultimateNormal = parallelTransport(
            this.normals[this.normals.length - 1],
            this.tangents[this.tangents.length - 1],
            penultimateTangent
        );

        this.tangents.push(penultimateTangent);
        this.normals.push(penultimateNormal);

        for (var i = 0; i < this.committedSplines.length; ++i) {
            this.committedSplines[i].addPoint(
                this.points[this.points.length - 2],
                penultimateTangent,
                penultimateNormal,
                this.radii[this.points.length - 2],
                newPointColor
            );
        }
    }

    this.aabb.addPoint(newPointPosition);
};

Path.prototype.update = function(cursorPosition, radius, color) {
    color = cloneVec4(color);

    cursorPosition = cloneVec3(cursorPosition);

    this.headVelocity = this.headVelocity.uniformScale(this.brush.smoothDamping);
    var newHeadPosition = this.headPosition.add(this.headVelocity);
    newHeadPosition = vec3.lerp(newHeadPosition, cursorPosition, this.brush.smoothSpeed);
    this.headVelocity = newHeadPosition.sub(this.headPosition);
    this.headPosition = newHeadPosition;

    var commitThisFrame =
        this.framesSinceLastCommit >= FRAMES_PER_COMMIT &&
        this.headPosition.distance(this.points[this.points.length - 1]) > MIN_DISTANCE;

    if (commitThisFrame) {
        this.commitPoint(this.headPosition, radius, color);
        this.framesSinceLastCommit = 0;
    }

    this.framesSinceLastCommit += 1;

    //the points after the current head position that we render as a preview
    var previewPoints = [];

    if (!commitThisFrame) {
        previewPoints.push(cloneVec3(this.headPosition));
    }

    var previewHeadPosition = cloneVec3(this.headPosition);
    var previewHeadVelocity = cloneVec3(this.headVelocity);

    var stepsSinceLastPreviewCommit = STEPS_PER_PREVIEW_COMMIT;

    for (var i = 0; i < MAX_PREVIEW_STEPS; ++i) {
        previewHeadVelocity = previewHeadVelocity.uniformScale(this.brush.smoothDamping);
        var newHeadPosition = previewHeadPosition.add(previewHeadVelocity);
        newHeadPosition = vec3.lerp(newHeadPosition, cursorPosition, this.brush.smoothSpeed);
        previewHeadVelocity = newHeadPosition.sub(previewHeadPosition);
        previewHeadPosition = newHeadPosition;

        var lastPreviewPosition =
            previewPoints.length === 0 ? this.headPosition : previewPoints[previewPoints.length - 1];
        if (
            stepsSinceLastPreviewCommit >= STEPS_PER_PREVIEW_COMMIT &&
            lastPreviewPosition.distance(previewHeadPosition) > PREVIEW_MIN_DISTANCE
        ) {
            previewPoints.push(cloneVec3(previewHeadPosition));
            stepsSinceLastPreviewCommit = 0;
        }

        stepsSinceLastPreviewCommit += 1;

        if (previewHeadPosition.distance(cursorPosition) < PREVIEW_CUTOFF) {
            break;
        }
    }

    //i == 0 is the first preview point
    //i < 0 indexes back into the committed points
    var points = this.points;
    function sampleCombined(i) {
        if (i < 0) {
            return points[points.length + i];
        } else if (i === previewPoints.length) {
            return sampleCombined(i - 1).add(sampleCombined(i - 1).sub(sampleCombined(i - 2)));
        } else {
            return previewPoints[i];
        }
    }

    for (var i = 0; i < this.tailSplines.length; ++i) {
        this.tailSplines[i].reset(this.committedSplines[0].length);
    }

    var tailRadius = this.radii[this.points.length - 1];

    var lastTangent;
    var lastNormal;
    var startIndex;

    if (this.points.length === 1) {
        lastTangent = previewPoints[0].sub(this.points[this.points.length - 1]);
        lastNormal = computeOrthogonalVector(lastTangent);

        for (var i = 0; i < this.tailSplines.length; ++i) {
            this.tailSplines[i].addPoint(
                this.points[this.points.length - 1],
                lastTangent,
                lastNormal,
                tailRadius,
                color
            );
        }

        startIndex = 0;
    } else {
        lastTangent = this.tangents[this.points.length - 2];
        lastNormal = this.normals[this.points.length - 2];

        for (var i = 0; i < this.tailSplines.length; ++i) {
            this.tailSplines[i].addPoint(
                this.points[this.points.length - 2],
                lastTangent,
                lastNormal,
                tailRadius,
                color
            );
        }

        startIndex = -1;
    }

    for (var i = startIndex; i < previewPoints.length; ++i) {
        var SPLINE_ALPHA = 1.0;

        var newPosition = sampleCombined(i);
        var newTangent = computeTangent(sampleCombined(i - 1), sampleCombined(i), sampleCombined(i + 1), SPLINE_ALPHA);
        var newNormal = parallelTransport(lastNormal, lastTangent, newTangent);

        var thisTailRadius = mix(tailRadius, radius, (i - startIndex) / (previewPoints.length - startIndex));
        for (var j = 0; j < this.tailSplines.length; ++j) {
            this.tailSplines[j].addPoint(newPosition, newTangent, newNormal, tailRadius, color);
        }

        lastTangent = newTangent;
        lastNormal = newNormal;
    }

    this.previewPoints = previewPoints;

    try {
        var totalLength = this.committedSplines[0].length + this.tailSplines[0].length;

        for (var i = 0; i < this.committedSplines.length; ++i) {
            this.committedSplines[i].material.mainPass.totalLength = totalLength;
        }
        for (var i = 0; i < this.tailSplines.length; ++i) {
            this.tailSplines[i].material.mainPass.totalLength = totalLength;
        }
    } catch (error) {
        print(error);
    }
};

//manually add a point
Path.prototype.addPoint = function(pointPosition, pointRadius, pointColor) {
    this.commitPoint(pointPosition, pointRadius, pointColor);
    this.headPosition = cloneVec3(pointPosition);
    this.headVelocity = new vec3(0, 0, 0);
};

/**
 * Call when we're done with a path
 */
Path.prototype.finalize = function() {
    for (var i = 0; i < this.tailSplines.length; ++i) {
        this.tailSplines[i].reset();
    }

    var radius = this.radii[this.points.length - 1];
    var color = this.colors[this.points.length - 1];
    for (var i = 0; i < this.previewPoints.length; ++i) {
        this.commitPoint(this.previewPoints[i], radius, color);
    }

    try {
        var totalLength = this.committedSplines[0].length;
        for (var i = 0; i < this.committedSplines.length; ++i) {
            this.committedSplines[i].material.mainPass.totalLength = totalLength;
        }
    } catch (error) {}
};

Path.prototype.getNumPoints = function() {
    return this.points.length;
};

Path.prototype.setVisible = function(visible) {
    for (var i = 0; i < this.committedSplines.length; ++i) {
        this.committedSplines[i].setVisible(visible);
    }
    for (var i = 0; i < this.tailSplines.length; ++i) {
        this.tailSplines[i].setVisible(visible);
    }
    this.visible = visible;
};

Path.prototype.destroy = function() {
    for (var i = 0; i < this.committedSplines.length; ++i) {
        this.committedSplines[i].destroy();
    }
    for (var i = 0; i < this.tailSplines.length; ++i) {
        this.tailSplines[i].destroy();
    }
};

//returns whether the specified point is closer to the spline than the given distance (approximately)
Path.prototype.isCloserThanDistance = function(point, distance) {
    point = cloneVec3(point);

    if (this.aabb.distance(point) > distance) {
        return false;
    }

    for (var i = 0; i < this.points.length; ++i) {
        if (this.points[i].distance(point) < distance) return true;
    }

    return false;
};

global.Path = Path;
