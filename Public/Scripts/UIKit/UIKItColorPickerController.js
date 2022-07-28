// -----JS CODE-----
// @input SceneObject indicator
// @input SceneObject indicatorFill
// @input Component.ScreenTransform pickerTransform
// @input Component.ScreenTransform indicatorTransform
// @input Component.ScreenTransform dropTransform
// @input Component.ScriptComponent brushPickerController
// @input SceneObject undoButton

const THRESH = 0.8;
const PADDING = 1.2;

const BLACK = new vec4(0, 0, 0, 1);
const WHITE = new vec4(1, 1, 1, 1);

const DEFAULT_POS = new vec2(0.5, 0);

function checkDependencies() {
    if (global.mainInitialized) {
        initialize();
    }
}

script.firstTouch = false;
script.checkDependenciesEvent = script.createEvent('UpdateEvent');
script.checkDependenciesEvent.bind(checkDependencies);

function initialize() {
    setColorFromTouchPos(DEFAULT_POS);
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

function clamp(a, min, max) {
    return a < min ? min : a > max ? max : a;
}

function setRectCenter(rect, center) {
    var size = rect.getSize();
    rect.left = center.x - size.x * 0.5;
    rect.right = center.x + size.x * 0.5;
    rect.top = center.y + size.y * 0.5;
    rect.bottom = center.y - size.y * 0.5;
}

function touch(eventData) {
    touchPos = eventData.getTouchPosition();
    setColorFromTouchPos(touchPos);
    script.indicator.getFirstComponent('Component.Image').enabled = false;
    script.indicator.getComponentByIndex('Component.Image', 1).enabled = false;
    script.dropTransform.getSceneObject().getFirstComponent('Component.Image').enabled = true;
    script.dropTransform.getSceneObject().getComponentByIndex('Component.Image', 1).enabled = true;
    if (!script.firstTouch) {
        script.firstTouch = true;
        global.tweenManager.startTween(script.undoButton, 'undoFadeOut');
        global.tweenManager.startTween(script.dropTransform.getSceneObject(), 'DropScaleIn');
    }
}

function touchStart(eventData) {
    touchPos = eventData.getTouchPosition();
    setColorFromTouchPos(touchPos);
    global.tweenManager.startTween(script.undoButton, 'undoFadeOut');
    global.tweenManager.startTween(script.dropTransform.getSceneObject(), 'DropScaleIn');
    script.firstTouch = true;
}

function touchEnd(eventData) {
    global.tweenManager.startTween(script.undoButton, 'undoFadeIn');
    global.tweenManager.startTween(script.dropTransform.getSceneObject(), 'DropScaleOut');
    script.indicator.getFirstComponent('Component.Image').enabled = true;
    script.indicator.getComponentByIndex('Component.Image', 1).enabled = true;
    script.firstTouch = false;
}

function setColorFromTouchPos(touchPos) {
    var convertedPos = 0;
    try {
        convertedPos = script.pickerTransform.screenPointToLocalPoint(touchPos).x;
    } catch (error) {
        convertedPos = touchPos.x * 2 - 1;
    }
    var indicatorCenter = script.indicatorTransform.anchors.getCenter();
    setRectCenter(script.indicatorTransform.anchors, new vec2(convertedPos, indicatorCenter.y));
    if (convertedPos >= THRESH) {
        setColor(WHITE);
    } else if (convertedPos <= -1 * THRESH) {
        setColor(BLACK);
    } else {
        var padded = convertedPos * PADDING;
        var h = (padded + 1) * 360 * 0.5;
        var hsva = new vec4(h, 1.0, 1.0, 1.0);
        var rgba = HSVAtoRGBA(hsva);
        setColor(rgba);
    }
}

function setColor(rgba) {
    // respect alpha of material
    const currentColor = script.indicatorFill.getFirstComponent('Component.Image').mainMaterial.mainPass.baseColor;
    const updatedColor = new vec4(rgba.r, rgba.g, rgba.b, currentColor.a);
    script.indicatorFill.getFirstComponent('Component.Image').mainMaterial.mainPass.baseColor = updatedColor;
    script.dropTransform
        .getSceneObject()
        .getComponentByIndex('Component.Image', 1).mainMaterial.mainPass.baseColor = updatedColor;
    script.brushPickerController.api.updateBrushColors(rgba);
    global.appSignals.colorSelected.dispatch(rgba);
}

script.api.enableColorPickerTouchEvents = function(enabled) {
    script.touchStartEvent.enabled = enabled;
    script.touchMoveEvent.enabled = enabled;
};

function RGBAtoHSVA(rgba) {
    var r = rgba.r;
    var g = rgba.g;
    var b = rgba.b;
    var a = rgba.a;

    (r /= 255.0), (g /= 255.0), (b /= 255.0);

    var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    var h,
        s,
        v = max;

    var d = max - min;
    s = max == 0 ? 0 : d / max;

    if (max == min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return new vec4(h, s, v, a);
}

function HSVAtoRGBA(hsva) {
    var h = hsva.r;
    var s = hsva.g;
    var v = hsva.b;
    var a = hsva.a;

    var r, g, b;

    hprime = h / 60;
    const c = v * s;
    const x = c * (1 - Math.abs((hprime % 2) - 1));
    const m = v - c;

    if (!hprime) {
        r = 0;
        g = 0;
        b = 0;
    }
    if (hprime >= 0 && hprime < 1) {
        r = c;
        g = x;
        b = 0;
    }
    if (hprime >= 1 && hprime < 2) {
        r = x;
        g = c;
        b = 0;
    }
    if (hprime >= 2 && hprime < 3) {
        r = 0;
        g = c;
        b = x;
    }
    if (hprime >= 3 && hprime < 4) {
        r = 0;
        g = x;
        b = c;
    }
    if (hprime >= 4 && hprime < 5) {
        r = x;
        g = 0;
        b = c;
    }
    if (hprime >= 5 && hprime < 6) {
        r = c;
        g = 0;
        b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return new vec4(r / 255.0, g / 255.0, b / 255.0, a);
}
