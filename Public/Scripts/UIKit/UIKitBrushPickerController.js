// -----JS CODE-----
// @input SceneObject[] brushes
// @input Component.MeshVisual box
// @input SceneObject brushLabel
// @input Component.ScreenTransform brushLabelScreenTransform
// @input Component.MeshVisual cursor
// @input Component.MeshVisual brushPreview
// @input SceneObject undoButton
// @input Asset.Material[] brushIconMaterials

// @input Component.ScriptComponent dockScriptController

const DEFAULT_BRUSH = 0;

function checkDependencies() {
    if (global.mainInitialized && global.BrushLibrary) {
        initialize();
    }
}

script.checkDependenciesEvent = script.createEvent('UpdateEvent');
script.checkDependenciesEvent.bind(checkDependencies);

function initialize() {
    brushTrayTouchEvents();
    script.brushList = [
        global.BrushLibrary.Matte,
        global.BrushLibrary.Metallic,
        global.BrushLibrary.Rainbow,
        global.BrushLibrary.Neon,
        global.BrushLibrary.Iridescent
    ];
    for (var i = 0; i < script.brushList.length; i++) {
        const brushScriptComp = script.brushes[i].getFirstComponent('Component.ScriptComponent');
        setUpTouchEvents(brushScriptComp);
    }
    global.selectedBrushIndex = DEFAULT_BRUSH;
    script.setBrush(DEFAULT_BRUSH);
    script.checkDependenciesEvent.enabled = false;
}

script.api.enableBrushes = function(enabled) {
    if (enabled) {
        script.applyTweenToBrushes('BrushFadeIn');
        // global.tweenManager.startTween(script.brushLabel, 'LabelFadeOut');
    } else {
        script.applyTweenToBrushes('BrushFadeOut');
    }
};
script.api.updateBrushColors = function(color) {
    for (var i = 0; i < script.brushes.length; i++) {
        if (script.brushList[i].supportsColor != 'false') {
            const mat = script.brushes[i].getFirstComponent('Component.MeshVisual').mainMaterial;
            const currentColor = mat.mainPass.baseColor;
            const updatedColor = new vec4(color.r, color.g, color.b, currentColor.a);
            mat.mainPass.baseColor = updatedColor;
            script.brushIconMaterials[i].mainPass.baseColor = updatedColor;
        }
    }
};

script.applyTweenToBrushes = function(tweenName) {
    for (var i = 0; i < script.brushes.length; i++) {
        global.tweenManager.startTween(script.brushes[i], tweenName);
    }
};

script.setBrush = function(brushIndex) {
    //STYLE NAME LOCALIZATION 
    script.locale = global.localizationSystem.getLanguage();
    if (script.locale == "en") {
        script.brushLabel.getFirstComponent('Component.Text').text = script.brushList[brushIndex].name;
    } else {
        script.brushLabel.getFirstComponent('Component.Text').text = "";
    }
    const center = script.brushes[brushIndex].getFirstComponent('Component.ScreenTransform').anchors.getCenter();
    setLabelCenter(script.brushLabelScreenTransform.anchors, center);
    global.appSignals.brushSelected.dispatch(script.brushList[brushIndex]);
    var colorPickerSupported = script.brushList[brushIndex].supportsColor != 'false';
    script.dockScriptController.api.brushSupportsColorPicker(colorPickerSupported);
};

function brushTrayTouchEvents() {
    const touchMove = script
        .getSceneObject()
        .getFirstComponent('Component.ScriptComponent')
        .createEvent('TouchMoveEvent');
    touchMove.bind(function(eventData) {
        if (script.touchStart) {
            if (
                script.getSceneObject().getFirstComponent('Component.ScreenTransform').containsScreenPoint != undefined
            ) {
                if (
                    script
                        .getSceneObject()
                        .getFirstComponent('Component.ScreenTransform')
                        .containsScreenPoint(eventData.getTouchPosition())
                ) {
                    script.isTouchingBrushTray = true;
                } else {
                    if (script.isTouchingBrushTray) {
                        script.touchStart = false;
                        script.isTouchingBrushTray = false;
                        global.tweenManager.startTween(script.undoButton, 'undoFadeIn');
                    }
                }
            }
        }
    });
    const touchEnd = script
        .getSceneObject()
        .getFirstComponent('Component.ScriptComponent')
        .createEvent('TouchEndEvent');
    touchEnd.bind(function(eventData) {
        if (script.touchStart) {
            script.isTouchingBrushTray = false;
            script.touchStart = false;
            global.tweenManager.startTween(script.undoButton, 'undoFadeIn');
        }
    });
}

function setUpTouchEvents(scriptComponent) {
    const tap = scriptComponent.createEvent('TapEvent');
    tap.bind(function() {
        // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
        script.brushPreview.enabled = true;
        script.cursor.mainMaterial = tap.getSceneObject().getFirstComponent('Component.MeshVisual').mainMaterial;
        script.brushPreview.mainMaterial = script.brushIconMaterials[tap.getSceneObject().name];

        if (script.brushPreview.getMaterial(0).getPass(0).baseOpacity != undefined) {
            script.brushPreview.getMaterial(0).getPass(0).baseOpacity = 0.0;
        }
        if (script.brushPreview.getMaterial(0).getPass(0).baseColor != undefined) {
            var color = script.brushPreview.getMaterial(0).getPass(0).baseColor;
            script.brushPreview.getMaterial(0).getPass(0).baseColor = new vec4(color.r, color.g, color.b, 0.0);
        }
        script.setBrush(tap.getSceneObject().name);
    });
    const touchStart = scriptComponent.createEvent('TouchStartEvent');
    touchStart.bind(function() {
        script.touchStart = true;
        if (!script.isTouchingBrushTray) {
            global.tweenManager.startTween(script.undoButton, 'undoFadeOut');
        }
        // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
        global.tweenManager.startTween(script.brushLabel, 'LabelFadeIn');
        script.brushPreview.enabled = true;
        script.cursor.mainMaterial = tap.getSceneObject().getFirstComponent('Component.MeshVisual').mainMaterial;
        script.brushPreview.mainMaterial = script.brushIconMaterials[tap.getSceneObject().name];

        if (script.brushPreview.getMaterial(0).getPass(0).baseOpacity != undefined) {
            script.brushPreview.getMaterial(0).getPass(0).baseOpacity = 0.0;
        }
        if (script.brushPreview.getMaterial(0).getPass(0).baseColor != undefined) {
            var color = script.brushPreview.getMaterial(0).getPass(0).baseColor;
            script.brushPreview.getMaterial(0).getPass(0).baseColor = new vec4(color.r, color.g, color.b, 0.0);
        }
        script.setBrush(tap.getSceneObject().name);
    });
    const touchEnd = scriptComponent.createEvent('TouchEndEvent');
    touchEnd.bind(function() {
        if (!script.isTouchingBrushTray) {
            script.touchStart = false;
            global.tweenManager.startTween(script.undoButton, 'undoFadeIn');
        }
        global.tweenManager.startTween(script.brushLabel, 'LabelFadeOut');
    });
}

function setLabelCenter(rect, center) {
    var size = rect.getSize();
    rect.left = center.x - size.x * 0.5;
    rect.right = center.x + size.x * 0.5;
}
