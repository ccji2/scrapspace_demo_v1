// @input SceneObject rotator {"label" : "Target"}
// @input bool touchBlockSwipe = true



if (script.rotator == undefined) {
    script.rotator = script.getSceneObject();
}

var transform = script.rotator.getTransform();
script.rotatorTransform = transform;
var manipulateTransform = script.rotator.getParent().getTransform();
script.manipulateTransform = manipulateTransform;
var prevTouchPos = null;
var touchIds = [];
var rotationIntensity = 0.03;
var isScale = false;
var touchPos = new vec2(0, 0);
var prevTouchPos = new vec2(0, 0);
var diffTouchPos = new vec2(0, 0);
var accum = quat.quatIdentity();
script.canRotate = true;

var defaultScale = manipulateTransform.getWorldScale();
var speed = 0.2;

if (script.touchBlockSwipe) {
    // Enable full screen touches
    global.touchSystem.touchBlocking = true;
    global.touchSystem.enableTouchBlockingException("TouchTypeDoubleTap", true);
    global.touchSystem.enableTouchBlockingException("TouchTypeNone", true);
    global.touchSystem.enableTouchBlockingException("TouchTypeTouch", true);
    global.touchSystem.enableTouchBlockingException("TouchTypeTap", true);
    global.touchSystem.enableTouchBlockingException("TouchTypeDoubleTap", true);
    global.touchSystem.enableTouchBlockingException("TouchTypeScale", true);
    global.touchSystem.enableTouchBlockingException("TouchTypePan", true);
}

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.enabled = false;

updateEvent.bind(function () {
    var rotation = transform.getLocalRotation();
    var defaultRotation = quat.fromEulerAngles(script.resetRotation.x, script.resetRotation.y, script.resetRotation.z);
    var scale = manipulateTransform.getWorldScale();
    if (toEuler(rotation).distance(script.resetRotation) < 0.01 && scale.distance(defaultScale) < 0.1) {
        updateEvent.enabled = false;
    }
    var newRotation = quat.slerp(rotation, defaultRotation, speed);
    var newScale = vec3.lerp(scale, defaultScale, speed);

    transform.setLocalRotation(newRotation);
    manipulateTransform.setWorldScale(newScale);
})

script.createEvent("TouchStartEvent").bind(function (eventData) {
    prevTouchPos = eventData.getTouchPosition();
    touchIds.push(eventData.getTouchId());
    if (touchIds.length > 1) {
        isScale = true;
    }
})

script.createEvent("TouchMoveEvent").bind(function (eventData) {
    if (touchIds.length > 1 || isScale) {
        return;
    }
    touchPos = eventData.getTouchPosition();
    diffTouchPos = touchPos.sub(prevTouchPos);
    prevTouchPos = touchPos;
})

script.createEvent("TouchEndEvent").bind(function () {
    if (touchIds.length > 0) {
        touchIds.pop();
    }
    if (touchIds.length == 0) {
        isScale = false;
    }
    diffTouchPos = vec2.zero();
})

function rotate(diffTouchPos) {
    var rotation = transform.getLocalRotation();
    var addRot = quat.fromEulerAngles(diffTouchPos.y * rotationIntensity, diffTouchPos.x * rotationIntensity, 0);
    rotation = addRot.multiply(rotation);
    transform.setLocalRotation(rotation);
}

function startReset() {
    updateEvent.enabled = true;
}

function clamp(min, max, num) {
    return Math.min(Math.max(min, num), max)
}

script.createEvent("UpdateEvent").bind(function () {
    if (!script.canRotate) {
        return;
    }
    if(!global.lock){
        testQuat = quat.fromEulerAngles(2 * diffTouchPos.y, 2 * diffTouchPos.x, 0)
        accum = accum.multiply(testQuat);
        accum = quat.slerp(accum, quat.quatIdentity(), 0.1)
        objectRot = script.manipulateTransform.getWorldRotation();
        var newRot = objectRot.multiply(accum);
        script.manipulateTransform.setWorldRotation(newRot);
        var boxRot = script.rotatorTransform.getWorldRotation()
        script.manipulateTransform.setWorldRotation(quat.quatIdentity());
        script.rotatorTransform.setWorldRotation(boxRot);
    }
    
})

script.rotate = rotate;
script.reset = startReset;