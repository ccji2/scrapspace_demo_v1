const HIGH_END_DEVICE = global.deviceInfoSystem.getDeviceClass() >= 3;

const LOW_END_DEVICE_SLICE_DENSITY = 1;
const LOW_END_DEVICE_MAX_SLICES = 1;

const HIGH_END_DEVICE_SLICE_DENSITY = 8;
const HIGH_END_DEVICE_MAX_SLICES = 20;
/**
 * @param {vec2[]} positions              Vertex positions
 * @param {vec2[]} normals                Vertex normals
 * @param {float[]} textureUs             Vertex textureUs
 * @param {float[]} textureVStretches     Vertex textureVStrecth: V = length * textureVStretch
 * @param {int[]} indices                 Line segment indices
 */
function Mesh2D(positions, normals, textureUs, textureVStretches, indices) {
    this.positions = positions;
    this.normals = normals;
    this.textureUs = textureUs;
    this.textureVStretches = textureVStretches; //V = length * textureVStretch
    this.indices = indices;

    this.pointCount = this.positions.length;

    //compute tangents
    this.tangents = [];
    for (var i = 0; i < this.positions.length; ++i) {
        this.tangents.push(new vec2(-this.normals[i].y, this.normals[i].x));
    }
}

/** *
 * @param {Object} options                                Options object
 * @param {Asset.Material} options.material               Material to use for the profile
 * @param {Mesh2D} options.mesh                           The Mesh2D to use as the swept profile
 * @param {string[]} [options.attributes]                 A list of requested optional attributes
 * @param {float} [options.sliceDensity]                  Slices per cm
 * @param {float} [options.maxSlices]                     Maximum number of slices. This is so we don't create too many slices for a single spline segment and start lagging.
 * @param {function} [options.rotationFunction]           rotationFunction(length: float) -> rotation: float
 * @param {function} [options.offsetFunction]             offsetFunction(length: float) -> offset: vec2
 */
function Profile(options) {
    if (!options.material) {
        throw new Error('The material option must be provided');
    }
    if (!options.mesh) {
        throw new Error('The mesh option must be provided');
    }

    this.material = options.material;
    this.mesh2D = options.mesh;

    this.optionalAttributes = {
        texture0: false,
        texture1: false,
        color: false,
        tangent: false,
        center: false,
        length: false
    };

    if (options.attributes) {
        for (var i = 0; i < options.attributes.length; ++i) {
            var attributeName = options.attributes[i];
            if (this.optionalAttributes.hasOwnProperty(attributeName)) {
                this.optionalAttributes[attributeName] = true;
            }
        }
    }

    this.sliceDensity =
        options.sliceDensity || (HIGH_END_DEVICE ? HIGH_END_DEVICE_SLICE_DENSITY : LOW_END_DEVICE_SLICE_DENSITY);
    this.maxSlices = options.maxSlices || (HIGH_END_DEVICE ? HIGH_END_DEVICE_MAX_SLICES : LOW_END_DEVICE_MAX_SLICES);
    this.rotationFunction = options.rotationFunction ? options.rotationFunction : null;
    this.offsetFunction = options.offsetFunction ? options.offsetFunction : null;
}

Profile.prototype.clone = function() {
    var attributes = [];
    for (var attributeName in this.optionalAttributes) {
        if (this.optionalAttributes[attributeName]) {
            attributes.push(attributeName);
        }
    }

    return new Profile({
        material: this.material,
        mesh: this.mesh2D,
        attributes: attributes,
        sliceDensity: this.sliceDensity,
        maxSlices: this.maxSlices,
        rotationFunction: this.rotationFunction,
        offsetFunction: this.offsetFunction
    });
};

/**
 * @param {Object} options                        Options object
 * @param {string} options.name                   Name of the Brush
 * @param {Profile[]} options.profiles            The profiles that will be swept
 * @param {float} [options.smoothSpeed]           Speed of the smoothing in [0, 1]
 * @param {float} [options.smoothDamping]         Damping of the smoothing in [0, 1]
 */
function Brush(options) {
    if (!options.name) {
        throw new Error('The name option must be provided');
    }
    if (!options.profiles) {
        throw new Error('The profiles option must be provided');
    }

    this.name = options.name;
    this.profiles = options.profiles;
    this.smoothSpeed = options.smoothSpeed || 0.1;
    this.smoothDamping = options.smoothDamping || 0.5;
    this.supportsColor = options.supportsColor || 'true';
}

global.Mesh2D = Mesh2D;
global.Profile = Profile;
global.Brush = Brush;
