global.MathUtils = {};

global.MathUtils.linearStep = function(edge0, edge1, t) {
    // Scale, and clamp x to 0..1 range
    return this.clamp((t - edge0) / (edge1 - edge0), 0.0, 1.0);
};

global.MathUtils.lerp = function(start, stop, frac) {
    return start + (stop - start) * frac;
};

global.MathUtils.clamp = function(value, min, max) {
    return value < min ? min : value > max ? max : value;
};

global.MathUtils.isInsideCircle = function(point, circlePos, circleRadius) {
    const distX = point.x - circlePos.x;
    const distY = point.y - circlePos.y;
    const dist = Math.sqrt(distX * distX + distY * distY);
    return dist < circleRadius;
};

global.MathUtils.mapValue = function(value, inputMin, inputMax, outputMin, outputMax, clamp) {
    if (Math.abs(inputMin - inputMax) < 0.0000001) {
        return outputMin;
    } else {
        var outVal = ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) + outputMin;

        if (clamp) {
            if (outputMax < outputMin) {
                if (outVal < outputMax) {
                    outVal = outputMax;
                } else if (outVal > outputMin) {
                    outVal = outputMin;
                }
            } else {
                if (outVal > outputMax) {
                    outVal = outputMax;
                } else if (outVal < outputMin) {
                    outVal = outputMin;
                }
            }
        }

        return outVal;
    }
};
