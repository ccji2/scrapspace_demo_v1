var vec3 = global.MathLib.vec3;
var vec4 = global.MathLib.vec4;
var quat = global.MathLib.quat;
var mat4 = global.MathLib.mat4;

function mix(a, b, t) {
    return (1.0 - t) * a + t * b;
}

function getAttributesSize(attributes) {
    var size = 0;
    for (var i = 0; i < attributes.length; ++i) {
        size += attributes[i].components;
    }
    return size;
}

function evaluateCubicSpline(t, startPoint, endPoint, startTangent, endTangent) {
    var t2 = t * t;
    var t3 = t2 * t;

    var outPoint = new vec3(0, 0, 0);
    outPoint.x =
        (2 * t3 - 3 * t2 + 1) * startPoint.x +
        (t3 - 2 * t2 + t) * startTangent.x +
        (-2 * t3 + 3 * t2) * endPoint.x +
        (t3 - t2) * endTangent.x;
    outPoint.y =
        (2 * t3 - 3 * t2 + 1) * startPoint.y +
        (t3 - 2 * t2 + t) * startTangent.y +
        (-2 * t3 + 3 * t2) * endPoint.y +
        (t3 - t2) * endTangent.y;
    outPoint.z =
        (2 * t3 - 3 * t2 + 1) * startPoint.z +
        (t3 - 2 * t2 + t) * startTangent.z +
        (-2 * t3 + 3 * t2) * endPoint.z +
        (t3 - t2) * endTangent.z;

    return outPoint;
}

function evaluateCubicSplineTangent(t, startPoint, endPoint, startTangent, endTangent) {
    var t2 = t * t;

    var outPoint = new vec3(0, 0, 0);
    outPoint.x =
        (6 * t2 - 6 * t) * startPoint.x +
        (3 * t2 - 4 * t + 1) * startTangent.x +
        (-6 * t2 + 6 * t) * endPoint.x +
        (3 * t2 - 2 * t) * endTangent.x;
    outPoint.y =
        (6 * t2 - 6 * t) * startPoint.y +
        (3 * t2 - 4 * t + 1) * startTangent.y +
        (-6 * t2 + 6 * t) * endPoint.y +
        (3 * t2 - 2 * t) * endTangent.y;
    outPoint.z =
        (6 * t2 - 6 * t) * startPoint.z +
        (3 * t2 - 4 * t + 1) * startTangent.z +
        (-6 * t2 + 6 * t) * endPoint.z +
        (3 * t2 - 2 * t) * endTangent.z;

    return outPoint;
}

var GAUSS_LEGRENDRE_COEFFICIENTS = [
    { t: 0.0, weight: 0.568889 },
    { t: 0.538469, weight: 0.478629 },
    { t: -0.538469, weight: 0.478629 },
    { t: 0.90618, weight: 0.236927 },
    { t: -0.90618, weight: 0.236927 }
];

//estimate cubic spline length using gauss-legendre quadrature
function estimateCubicSplineLength(startPoint, endPoint, startTangent, endTangent) {
    var estimate = 0.0;
    for (var i = 0; i < GAUSS_LEGRENDRE_COEFFICIENTS.length; ++i) {
        var coefficient = GAUSS_LEGRENDRE_COEFFICIENTS[i];
        var derivative = evaluateCubicSplineTangent(
            coefficient.t * 0.5 + 0.5,
            startPoint,
            endPoint,
            startTangent,
            endTangent
        ).length;
        estimate += derivative * coefficient.weight;
    }
    return estimate * 0.5;
}

function SubMesh(attributes, material, scales, parent) {
    this.visible = true;
    this.builder = new MeshBuilder(attributes);

    this.builder.topology = MeshTopology.Triangles;
    this.builder.indexType = MeshIndexType.UInt16;
    this.builder.meshSerializationEnabled = true;

    function addObject(scale) {
        var object = global.scene.createSceneObject('stroke');
        object.setRenderLayer(3);
        var meshVisual = object.createComponent('Component.MeshVisual');
        meshVisual.setRenderOrder(1000);
        meshVisual.mesh = this.builder.getMesh();
        meshVisual.addMaterial(material);

        object.getTransform().setLocalScale(new global.vec3(scale.x, scale.y, scale.z));

        if (parent) {
            object.setParent(parent);
        }

        this.objects.push(object);
    }
    addObject = addObject.bind(this);

    this.objects = [];
    addObject(new vec3(1, 1, 1));

    for (var i = 0; i < scales.length; ++i) {
        addObject(scales[i]);
    }
}

SubMesh.prototype.destroy = function() {
    for (var i = 0; i < this.objects.length; ++i) {
        this.objects[i].destroy();
    }
};

SubMesh.prototype.setVisible = function(visible) {
    for (var i = 0; i < this.objects.length; ++i) {
        this.objects[i].enabled = visible;
    }
    this.visible = visible;
};

function CubicSplineMesh(profile, scales, parent, lengthOffset) {
    this.material = profile.material.clone(); //cloned so we can set unique uniforms
    this.mesh2D = profile.mesh2D;
    this.optionalAttributes = profile.optionalAttributes;
    this.sliceDensity = profile.sliceDensity;
    this.maxSlices = profile.maxSlices;
    this.rotationFunction = profile.rotationFunction;
    this.offsetFunction = profile.offsetFunction;
    this.scales = scales;
    this.parent = parent;
    this.lengthOffset = lengthOffset || 0;

    this.pointCount = 0;
    this.lastPosition = null;
    this.lastTangent = null;
    this.lastNormal = null;
    this.lastRadius = 0;
    this.lastColor = new vec4(0, 0, 0, 0);
    this.length = 0;
    this.visible = true;

    this.attributes = [{ name: 'position', components: 3 }, { name: 'normal', components: 3 }];

    if (this.optionalAttributes.texture0) {
        this.attributes.push({ name: 'texture0', components: 2 });
    }
    if (this.optionalAttributes.texture1) {
        this.attributes.push({ name: 'texture1', components: 2 });
    }
    if (this.optionalAttributes.color) {
        this.attributes.push({ name: 'color', components: 4 });
    }
    if (this.optionalAttributes.tangent) {
        this.attributes.push({ name: 'tangent', components: 3 });
    }
    if (this.optionalAttributes.center) {
        this.attributes.push({ name: 'center', components: 3 });
    }
    if (this.optionalAttributes.length) {
        this.attributes.push({ name: 'length', components: 1 });
    }
    if (this.optionalAttributes.creationTime) {
        this.attributes.push({ name: 'creationTime', components: 1 });
    }

    this.subMeshes = []; //we are currently building the last element of this array
    this.subMeshes.push(new SubMesh(this.attributes, this.material, this.scales, this.parent));
}

CubicSplineMesh.prototype.reset = function(lengthOffset) {
    this.lastPosition = null;
    this.lastTangent = null;
    this.lastNormal = null;
    this.lastRadius = 0;
    this.lastColor = new vec4(0, 0, 0, 0);
    this.lengthOffset = lengthOffset || 0;

    //destroy all sub meshes apart from the first one

    for (var i = this.subMeshes.length - 1; i >= 1; --i) {
        this.subMeshes[i].destroy();
        this.subMeshes.pop();
    }

    //reset the first submesh
    var builder = this.subMeshes[0].builder;

    if (builder.getVerticesCount() > 0) {
        builder.eraseVertices(0, builder.getVerticesCount());
    }
    if (builder.getIndicesCount() > 0) {
        builder.eraseIndices(0, builder.getIndicesCount());
    }
    builder.updateMesh();

    this.pointCount = 0;
    this.length = 0; //total (approximate) length of the spline
};

CubicSplineMesh.prototype.addPoint = function(newPosition, newTangent, newNormal, newRadius, newColor) {
    var mesh2D = this.mesh2D;
    var profilePoints = this.mesh2D.positions;
    var pointsPerSlice = profilePoints.length;

    function addSlice(vertexData, dataIndex, framePosition, frameForward, frameRight, frameUp, radius, color, length) {
        var tangent = new vec2(0, 0);

        var positions = mesh2D.positions;
        var normals = mesh2D.normals;
        var tangents = mesh2D.tangents;
        var textureUs = mesh2D.textureUs;
        var textureVStretches = mesh2D.textureVStretches;

        var includeTexture0 = this.optionalAttributes.texture0;
        var includeTexture1 = this.optionalAttributes.texture1;
        var includeColor = this.optionalAttributes.color;
        var includeTangent = this.optionalAttributes.tangent;
        var includeCenter = this.optionalAttributes.center;
        var includeLength = this.optionalAttributes.length;
        var includeCreationTime = this.optionalAttributes.creationTime;

        var offset = this.offsetFunction ? this.offsetFunction(length).uniformScale(radius) : new vec2(0, 0);
        var rotation = this.rotationFunction ? this.rotationFunction(length) : 0;

        var rotatedFrameUp = frameUp;
        var rotatedFrameRight = frameRight;

        if (Math.abs(rotation) > 0) {
            var rotation = mat4.fromRotation(quat.angleAxis(rotation, frameForward.normalize()));
            rotatedFrameUp = rotation.multiplyDirection(frameUp);
            rotatedFrameRight = rotation.multiplyDirection(frameRight);
        }

        for (var i = 0; i < pointsPerSlice; ++i) {
            var point = positions[i];
            var normal = normals[i];
            var tangent = tangents[i];
            var u = textureUs[i];
            var v = length * textureVStretches[i];

            var offsetPointX = point.x + offset.x;
            var offsetPointY = point.y + offset.y;

            //position.xyz
            vertexData[dataIndex++] =
                framePosition.x + (rotatedFrameUp.x * offsetPointX + rotatedFrameRight.x * offsetPointY) * radius;
            vertexData[dataIndex++] =
                framePosition.y + (rotatedFrameUp.y * offsetPointX + rotatedFrameRight.y * offsetPointY) * radius;
            vertexData[dataIndex++] =
                framePosition.z + (rotatedFrameUp.z * offsetPointX + rotatedFrameRight.z * offsetPointY) * radius;

            //normal.xyz
            vertexData[dataIndex++] = rotatedFrameUp.x * normal.x + rotatedFrameRight.x * normal.y;
            vertexData[dataIndex++] = rotatedFrameUp.y * normal.x + rotatedFrameRight.y * normal.y;
            vertexData[dataIndex++] = rotatedFrameUp.z * normal.x + rotatedFrameRight.z * normal.y;

            if (includeTexture0) {
                //uv.xy
                vertexData[dataIndex++] = u;
                vertexData[dataIndex++] = v;
            }

            if (includeTexture1) {
                //uv.xy
                vertexData[dataIndex++] = length;
                vertexData[dataIndex++] = length;
            }

            if (includeColor) {
                //color.xyz
                vertexData[dataIndex++] = color.x;
                vertexData[dataIndex++] = color.y;
                vertexData[dataIndex++] = color.z;
                vertexData[dataIndex++] = color.w;
            }

            if (includeTangent) {
                //tangent.xyz
                vertexData[dataIndex++] = rotatedFrameUp.x * tangent.x + rotatedFrameRight.x * tangent.y;
                vertexData[dataIndex++] = rotatedFrameUp.y * tangent.x + rotatedFrameRight.y * tangent.y;
                vertexData[dataIndex++] = rotatedFrameUp.z * tangent.x + rotatedFrameRight.z * tangent.y;
            }

            if (includeCenter) {
                vertexData[dataIndex++] = framePosition.x;
                vertexData[dataIndex++] = framePosition.y;
                vertexData[dataIndex++] = framePosition.z;
            }

            if (includeLength) {
                vertexData[dataIndex++] = length;
            }

            if (includeCreationTime) {
                vertexData[dataIndex++] = global.creationTime;
            }
        }

        return dataIndex;
    }
    addSlice = addSlice.bind(this);

    if (this.pointCount === 0) {
        this.lastPosition = newPosition;
        this.lastTangent = newTangent;
        this.lastNormal = newNormal;
        this.lastRadius = newRadius;
        this.lastColor = newColor;

        this.pointCount += 1;

        //add initial slice

        var framePosition = this.lastPosition;
        var frameTangent = this.lastTangent;
        var frameNormal = this.lastNormal;

        var frameRight = frameTangent.cross(frameNormal).normalize();
        var frameUp = frameRight.cross(frameTangent).normalize();

        var vertexData = new Float32Array(pointsPerSlice * getAttributesSize(this.attributes));

        var dataIndex = 0;
        dataIndex = addSlice(
            vertexData,
            dataIndex,
            framePosition,
            frameTangent,
            frameRight,
            frameNormal,
            newRadius,
            newColor,
            this.lengthOffset
        );

        this.material.mainPass.brushRadius = newRadius;

        var builder = this.subMeshes[this.subMeshes.length - 1].builder;

        builder.appendVerticesInterleavedFromTypedArray(vertexData, vertexData.length);
        builder.updateMesh();

        return;
    }

    var segmentLength = estimateCubicSplineLength(this.lastPosition, newPosition, this.lastTangent, newTangent);

    //the number of extra slices we're going to add
    //the first slice starts further along from the last added slice
    //the last slice is exactly around newPosition
    var sliceCount = Math.min(this.maxSlices, Math.ceil(segmentLength * this.sliceDensity));

    var currentBuilder = this.subMeshes[this.subMeshes.length - 1].builder;
    var newVertexCount = sliceCount * mesh2D.positions.length;

    //if we've gone over
    var MAX_VERTICES_PER_MESH = 65000;
    if (currentBuilder.getVerticesCount() + newVertexCount > MAX_VERTICES_PER_MESH) {
        this.subMeshes.push(new SubMesh(this.attributes, this.material, this.scales, this.parent));
        var newBuilder = this.subMeshes[this.subMeshes.length - 1].builder;

        //re-add the previous slice

        var framePosition = this.lastPosition;
        var frameTangent = this.lastTangent;
        var frameNormal = this.lastNormal;

        var frameRight = frameTangent.cross(frameNormal).normalize();
        var frameUp = frameRight.cross(frameTangent).normalize();

        var vertexData = new Float32Array(pointsPerSlice * getAttributesSize(this.attributes));

        var dataIndex = 0;
        dataIndex = addSlice(
            vertexData,
            dataIndex,
            framePosition,
            frameTangent,
            frameRight,
            frameNormal,
            this.lastRadius,
            this.lastColor,
            this.length + this.lengthOffset
        );

        newBuilder.appendVerticesInterleavedFromTypedArray(vertexData, vertexData.length);
        newBuilder.updateMesh();
    }

    var builder = this.subMeshes[this.subMeshes.length - 1].builder;

    var baseIndex = builder.getVerticesCount() - pointsPerSlice;

    var vertexData = new Float32Array(sliceCount * pointsPerSlice * getAttributesSize(this.attributes));
    var dataIndex = 0;

    var lastFramePosition = this.lastPosition;

    for (var sliceIndex = 0; sliceIndex < sliceCount; ++sliceIndex) {
        var t = (sliceIndex + 1) / sliceCount;

        var framePosition = evaluateCubicSpline(t, this.lastPosition, newPosition, this.lastTangent, newTangent);
        var frameTangent = evaluateCubicSplineTangent(
            t,
            this.lastPosition,
            newPosition,
            this.lastTangent,
            newTangent
        ).normalize();
        var frameNormal = vec3.slerp(this.lastNormal, newNormal, t).normalize();

        var frameRight = frameTangent.cross(frameNormal).normalize();
        var frameUp = frameRight.cross(frameTangent).normalize();

        this.length += lastFramePosition.distance(framePosition);
        lastFramePosition = framePosition;

        var radius = mix(this.lastRadius, newRadius, t);
        var color = vec4.lerp(this.lastColor, newColor, t);

        dataIndex = addSlice(
            vertexData,
            dataIndex,
            framePosition,
            frameTangent,
            frameRight,
            frameUp,
            radius,
            color,
            this.length + this.lengthOffset
        );
    }

    dataIndex = 0;
    var segmentCount = mesh2D.indices.length / 2;
    var indicesData = new Uint16Array(sliceCount * segmentCount * 6);

    var indices = mesh2D.indices;

    for (var sliceIndex = 0; sliceIndex < sliceCount; ++sliceIndex) {
        for (var i = 0; i < mesh2D.indices.length / 2; ++i) {
            var aIndex = indices[i * 2 + 0];
            var bIndex = indices[i * 2 + 1];

            var bottomLeft = sliceIndex * pointsPerSlice + aIndex;
            var bottomRight = sliceIndex * pointsPerSlice + bIndex;
            var topLeft = bottomLeft + pointsPerSlice;
            var topRight = bottomRight + pointsPerSlice;

            indicesData[dataIndex++] = baseIndex + bottomLeft;
            indicesData[dataIndex++] = baseIndex + bottomRight;
            indicesData[dataIndex++] = baseIndex + topLeft;

            indicesData[dataIndex++] = baseIndex + bottomRight;
            indicesData[dataIndex++] = baseIndex + topRight;
            indicesData[dataIndex++] = baseIndex + topLeft;
        }
    }

    builder.appendVerticesInterleavedFromTypedArray(vertexData, vertexData.length);
    builder.appendIndicesFromTypedArray(indicesData, indicesData.length);
    builder.updateMesh();

    this.lastPosition = newPosition;
    this.lastTangent = newTangent;
    this.lastNormal = newNormal;
    this.lastRadius = newRadius;
    this.lastColor = newColor;

    this.pointCount += 1;
};

CubicSplineMesh.prototype.setVisible = function(visible) {
    for (var i = 0; i < this.subMeshes.length; ++i) {
        this.subMeshes[i].setVisible(visible);
    }
    this.visible = visible;
};

CubicSplineMesh.prototype.destroy = function() {
    for (var i = 0; i < this.subMeshes.length; ++i) {
        this.subMeshes[i].destroy();
    }
};

global.CubicSplineMesh = CubicSplineMesh;
