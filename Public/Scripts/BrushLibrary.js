// @input Asset.Material diffuseMaterial
// @input Asset.Material diffuseStripesMaterial
// @input Asset.Material metallicMaterial
// @input Asset.Material rainbowMaterial
// @input Asset.Material hotdogBunMaterial
// @input Asset.Material hotdogSausageMaterial
// @input Asset.Material hotdogKetchupMaterial
// @input Asset.Material hotdogMustardMaterial
// @input Asset.Material neonMaterial
// @input Asset.Material iridescentMaterial

var vec2 = MathLib.vec2;

function mix(a, b, t) {
    return (1.0 - t) * a + t * b;
}

// assumes closed polyline
function computePolylineLength(points) {
    var totalLength = 0;
    for (var i = 0; i < points.length; ++i) {
        totalLength += points[i].distance(points[(i + 1) % points.length]);
    }
    return totalLength;
}

function posMod(i, n) {
    return ((i % n) + n) % n;
}

//computes the normal at p1 by averaging the p0-p1 and p1-p2 segment normals
function computeNormal(p0, p1, p2) {
    var leftTangent = p1.sub(p0);
    var rightTangent = p2.sub(p1);

    var leftNormal = new vec2(leftTangent.y, -leftTangent.x);
    var rightNormal = new vec2(rightTangent.y, -rightTangent.x);

    return leftNormal.add(rightNormal).normalize();
}

function smoothPolylineToMesh2D(points) {
    if (!Array.isArray(points)) {
        throw new Error('Invalid polyline');
    }

    var totalLength = computePolylineLength(points);
    var textureVStretch = 1.0 / totalLength;

    var positions = [];
    var normals = [];
    var textureUs = [];
    var textureVStretches = [];

    var currentLength = 0;
    //we add the first point on twice as it has unique UVs
    for (var i = 0; i < points.length + 1; ++i) {
        var normal = computeNormal(
            points[posMod(i - 1, points.length)],
            points[posMod(i, points.length)],
            points[posMod(i + 1, points.length)]
        );

        normals.push(normal);
        positions.push(points[i % points.length]);
        textureVStretches.push(textureVStretch);

        var u = currentLength / totalLength;
        textureUs.push(u);

        if (i < points.length) {
            currentLength += points[i].distance(points[(i + 1) % points.length]);
        }
    }

    var indices = [];
    for (var i = 0; i < points.length; ++i) {
        indices.push(i);
        indices.push(i + 1);
    }

    return new Mesh2D(positions, normals, textureUs, textureVStretches, indices);
}

function hardPolylineToMesh2D(points) {
    if (!Array.isArray(points)) {
        throw new Error('Invalid polyline');
    }

    var totalLength = computePolylineLength(points);
    var textureVStretch = 1.0 / totalLength;

    var positions = [];
    var normals = [];
    var textureUs = [];
    var textureVStretches = [];
    var indices = [];

    var currentLength = 0;
    for (var i = 0; i < points.length; ++i) {
        var segmentPoints = [points[i], points[(i + 1) % points.length]];
        var segmentLength = segmentPoints[0].distance(segmentPoints[1]);

        var tangent = segmentPoints[1].sub(segmentPoints[0]);
        var normal = new vec2(tangent.y, -tangent.x).normalize();

        var nextLength = currentLength + segmentLength;
        var segmentUs = [currentLength / totalLength, nextLength / totalLength];

        for (var j = 0; j < 2; ++j) {
            positions.push(segmentPoints[j]);
            normals.push(normal);
            textureUs.push(segmentUs[j]);
            textureVStretches.push(textureVStretch);

            indices.push(i * 2 + j);
        }

        currentLength = nextLength;
    }

    return new Mesh2D(positions, normals, textureUs, textureVStretches, indices);
}

//offset is optional
function generatePolar(pointCount, radiusFunction, offset) {
    offset = typeof offset !== 'undefined' ? offset : new vec2(0, 0);

    var points = [];
    for (var i = 0; i < pointCount; ++i) {
        var angle = (2 * Math.PI * i) / pointCount;
        var radius = radiusFunction(angle);
        points.push(new vec2(Math.cos(angle) * radius + offset.x, Math.sin(angle) * radius + offset.y));
    }

    return points;
}

function generateCircle(pointCount, radius, offset) {
    radius = typeof radius !== 'undefined' ? radius : 1;
    return generatePolar(
        pointCount,
        function() {
            return radius;
        },
        offset
    );
}

global.BrushLibrary = {
    Matte: new Brush({
        name: 'Matte',
        profiles: [
            new Profile({
                material: script.diffuseMaterial,
                mesh: smoothPolylineToMesh2D(generateCircle(10)),
                attributes: ['color', 'texture0', 'texture1']
            })
        ]
    }),
    Metallic: new Brush({
        name: 'Metallic',
        profiles: [
            new Profile({
                material: script.metallicMaterial,
                mesh: smoothPolylineToMesh2D(generateCircle(10)),
                attributes: ['color', 'texture0', 'texture1']
            })
        ]
    }),
    Candy: new Brush({
        name: 'Candy',
        profiles: [
            new Profile({
                material: script.diffuseStripesMaterial,
                mesh: smoothPolylineToMesh2D(generateCircle(10)),
                attributes: ['color', 'texture0', 'texture1'],
                rotationFunction: function(length) {
                    return length;
                }
            })
        ]
    }),
    Hotdog: new Brush({
        name: 'Hotdog',
        profiles: [
            // Bun
            new Profile({
                material: script.hotdogBunMaterial,
                mesh: smoothPolylineToMesh2D(
                    generatePolar(10, function(angle) {
                        return angle < Math.PI * 1.2 ? 1.0 : 0.0;
                    })
                ),
                attributes: ['texture0', 'tangent', 'center', 'length'],
                sliceDensity: 5,
                maxSlices: 15
            }),
            // Sausage
            new Profile({
                material: script.hotdogSausageMaterial,
                mesh: smoothPolylineToMesh2D(generateCircle(5, 0.5)),
                attributes: ['center', 'length'],
                sliceDensity: 5,
                maxSlices: 15
            }),
            // Ketchup
            new Profile({
                material: script.hotdogKetchupMaterial,
                mesh: smoothPolylineToMesh2D(generateCircle(5, 0.1, new vec2(0, 0.55))),
                optionalAttributes: {
                    center: true,
                    length: true
                },
                attributes: ['center', 'length'],
                sliceDensity: 5,
                maxSlices: 15,
                rotationFunction: function(length) {
                    return Math.sin(length * 0.7) * 1.1 + Math.PI;
                }
            }),
            // Mustard
            new Profile({
                material: script.hotdogMustardMaterial,
                mesh: smoothPolylineToMesh2D(generateCircle(5, 0.1, new vec2(0, 0.55))),
                attributes: ['center', 'length'],
                sliceDensity: 5,
                maxSlices: 15,
                rotationFunction: function(length) {
                    return Math.sin(length * 0.7 + Math.PI * 0.5) * 1.1 + Math.PI;
                }
            })
        ]
    }),
    Rainbow: new Brush({
        name: 'Rainbow',
        supportsColor: 'false',
        profiles: [
            new Profile({
                material: script.rainbowMaterial,
                mesh: smoothPolylineToMesh2D(generateCircle(10)),
                attributes: ['color', 'texture0', 'texture1']
            })
        ]
    }),
    Neon: new Brush({
        name: 'Neon',
        profiles: [
            new Profile({
                material: script.neonMaterial,
                mesh: smoothPolylineToMesh2D(generateCircle(10)),
                attributes: ['color', 'texture0', 'texture1']
            })
        ]
    }),
    Iridescent: new Brush({
        name: 'Iridescent',
        profiles: [
            new Profile({
                material: script.iridescentMaterial,
                mesh: smoothPolylineToMesh2D(generateCircle(10)),
                attributes: ['color', 'texture0', 'texture1']
            })
        ]
    })
};
