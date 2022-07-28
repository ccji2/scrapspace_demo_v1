// -----JS CODE-----
// @input SceneObject indicator
// @input Component.ScreenTransform pickerTransform
// @input Component.ScreenTransform indicatorTransform
// @input SceneObject box
// @input SceneObject undoButton 

const THRESH = 0.8;
var DEFAULT_POS = global.scene.getCameraType() == 'front' ? 0.3 : 0.4;
const MIN_SCALE = 0.5;
const MAX_SCALE = 0.8;
const SCALE_MULT = 4;
const SCALE_POWER = 3.0;

function checkDependencies() {
    if (global.mainInitialized) {
        initialize();
    }
}

script.firstTouch = false;
script.checkDependenciesEvent = script.createEvent('UpdateEvent');
script.checkDependenciesEvent.bind(checkDependencies);

function initialize() {
    setSizeFromTouchPos(new vec2(DEFAULT_POS, 0.0));

    script.touchStartEvent = script.createEvent('TouchStartEvent');
    script.touchStartEvent.bind(touchStart);
    script.touchStartEvent.enabled = false;

    script.touchMoveEvent = script.createEvent('TouchMoveEvent');
    script.touchMoveEvent.bind(touch);
    script.touchMoveEvent.enabled = false;

    script.touchEndEvent = script.createEvent('TouchEndEvent');
    script.touchEndEvent.bind(touchEnd);
    script.checkDependenciesEvent.enabled = false;
}

script.api.enableSizePickerTouchEvents = function(enabled) {
    script.touchStartEvent.enabled = enabled;
    script.touchMoveEvent.enabled = enabled;
};

function touch(eventData) {
    touchPos = eventData.getTouchPosition();
    setSizeFromTouchPos(touchPos);
    if (!script.firstTouch) {
        script.firstTouch = true;
        global.tweenManager.startTween(script.undoButton, 'undoFadeOut')
    }
}

function touchStart(eventData) {
    touchPos = eventData.getTouchPosition();
    setSizeFromTouchPos(touchPos);
    global.tweenManager.startTween(script.undoButton, 'undoFadeOut')
    script.firstTouch = true;
}

function touchEnd(eventData) {
    global.tweenManager.startTween(script.undoButton, 'undoFadeIn')
    script.firstTouch = false;
}

function setSizeFromTouchPos(touchPos) {
    var convertedPos = 0;
    try {
        convertedPos = script.pickerTransform.screenPointToLocalPoint(touchPos).x;
    } catch (error) {
        convertedPos = touchPos.x * 2 - 1;
    }
    convertedPos = clamp(convertedPos, -THRESH, THRESH-0.05);

    var indicatorCenter = script.indicatorTransform.anchors.getCenter();
    setRectCenter(script.indicatorTransform.anchors, new vec2(convertedPos, indicatorCenter.y));
    var sizeFromPos = ((convertedPos + 1) / 2) * (MAX_SCALE - MIN_SCALE) + MIN_SCALE;

    script.indicatorTransform.scale = vec3.one().uniformScale(sizeFromPos);
    global.appSignals.sizeSelected.dispatch(Math.pow(sizeFromPos*1.1, SCALE_POWER) * SCALE_MULT);
}

function setRectCenter(rect, center) {
    var size = rect.getSize();
    rect.left = center.x - size.x * 0.5;
    rect.right = center.x + size.x * 0.5;
    rect.top = center.y + size.y * 0.5;
    rect.bottom = center.y - size.y * 0.5;
}

function clamp(a, min, max) {
    return a < min ? min : a > max ? max : a;
}
