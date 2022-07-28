// -----JS CODE-----
// @input SceneObject colorPickerButton
// @input SceneObject brushPickerButton
// @input SceneObject sizePickerButton
// @input SceneObject mirrorButton
// @input SceneObject mirrorButton
// @input SceneObject undoButton
// @input SceneObject brushLabel

// @input SceneObject brushPicker
// @input SceneObject brushStyles
// @input Component.ScriptComponent brushPickerController
// @input SceneObject brushPickerBackButton

// @input SceneObject colorPicker
// @input Component.ScriptComponent colorPickerController
// @input SceneObject colorPickerBackButton
// @input Asset.Texture colorPickerEnabled
// @input Asset.Texture colorPickerDisabled

// @input SceneObject sizePicker
// @input Component.ScriptComponent sizePickerController
// @input SceneObject sizePickerBackButton

// @input Component.ScriptComponent mirrorButtonController
// @input Component.ScriptComponent undoButtonController

// @input Component.ScreenTransform buttonContainer

const PRESS_AND_HOLD_TIME = 0.1;

script.touching = false;
script.time = 0;

script.brushPickerOpened = false;
script.colorPickerOpened = false;
script.sizePickerOpened = false;

script.activeButton = undefined;
script.screenTransforms = [
    script.brushPickerButton.getFirstComponent('Component.ScreenTransform'),
    script.colorPickerButton.getFirstComponent('Component.ScreenTransform'),
    script.sizePickerButton.getFirstComponent('Component.ScreenTransform')
];

script.dock = script.getSceneObject();

script.createEvent('CameraFrontEvent').bind(onCameraFront);
script.createEvent('CameraBackEvent').bind(onCameraBack);

function setRectSize(rect, size) {
    var center = rect.getCenter();
    rect.left = center.x - size.x * 0.5;
    rect.right = center.x + size.x * 0.5;
    rect.top = center.y + size.y * 0.5;
    rect.bottom = center.y - size.y * 0.5;
}

function setRectCenter(rect, center) {
    var size = rect.getSize();
    rect.left = center.x - size.x * 0.5;
    rect.right = center.x + size.x * 0.5;
    rect.top = center.y + size.y * 0.5;
    rect.bottom = center.y - size.y * 0.5;
}

function onCameraFront() {
    script.mirrorButton.enabled = true;
    var newDockSize = 5.87;
    var buttonGroupSize = 0;
    setRectSize(
        script.getSceneObject().getFirstComponent('Component.ScreenTransform').offsets,
        new vec2(newDockSize, 1.5)
    );
    setRectSize(script.buttonContainer.offsets, new vec2(newDockSize, 1.5));
    script.buttonArray = [];

    for (var i = 0; i < script.buttonContainer.getSceneObject().getChildrenCount(); i++) {
        if (script.buttonContainer.getSceneObject().getChild(i).enabled) {
            script.buttonArray.push(script.buttonContainer.getSceneObject().getChild(i));
            script.buttonSize = script.buttonArray[i].getFirstComponent('Component.ScreenTransform').offsets.getSize();
            buttonGroupSize += script.buttonSize.x;
        }
    }
    var space = (newDockSize - buttonGroupSize) / (script.buttonArray.length + 1);
    for (var i = 0; i < script.buttonArray.length; i++) {
        setRectCenter(
            script.buttonArray[i].getFirstComponent('Component.ScreenTransform').offsets,
            new vec2(newDockSize / -2 + (space + script.buttonSize.x / 2) + (space * i + script.buttonSize.x * i), 0)
        );
    }
}

function onCameraBack() {
    var newDockSize = 4.5;
    var buttonGroupSize = 0;
    script.mirrorButton.enabled = false;
    setRectSize(
        script.getSceneObject().getFirstComponent('Component.ScreenTransform').offsets,
        new vec2(newDockSize, 1.5)
    );
    setRectSize(script.buttonContainer.offsets, new vec2(newDockSize, 1.5));
    script.buttonArray = [];

    for (var i = 0; i < script.buttonContainer.getSceneObject().getChildrenCount(); i++) {
        if (script.buttonContainer.getSceneObject().getChild(i).enabled) {
            script.buttonArray.push(script.buttonContainer.getSceneObject().getChild(i));
        }
    }
    for (var i = 0; i < script.buttonArray.length; i++) {
        script.buttonSize = script.buttonArray[i].getFirstComponent('Component.ScreenTransform').offsets.getSize();
        buttonGroupSize += script.buttonSize.x;
        // newDockSize/script.buttonArray.length
    }
    var space = (newDockSize - buttonGroupSize) / (script.buttonArray.length + 1);
    for (var i = 0; i < script.buttonArray.length; i++) {
        setRectCenter(
            script.buttonArray[i].getFirstComponent('Component.ScreenTransform').offsets,
            new vec2(newDockSize / -2 + (space + script.buttonSize.x / 2) + (space * i + script.buttonSize.x * i), 0)
        );
    }
}

//GET DELTA TIME
const updateEvent = script.createEvent('UpdateEvent');

updateEvent.bind(function() {
    if (script.touching) {
        script.time += getDeltaTime();
    }
});

//GET ACTIVE BUTTON
const touchStartBrushPickerButtonEvent = script.createEvent('TouchStartEvent');

touchStartBrushPickerButtonEvent.bind(function(event) {
    script.touchPosition = event.getTouchPosition();
    script.activeButton = touchIsInUI(script.touchPosition);
});

//BRUSH PICKER

const moveBrushPickerButtonEvent = script.brushPickerButton
    .getFirstComponent('Component.ScriptComponent')
    .createEvent('TouchMoveEvent');

moveBrushPickerButtonEvent.bind(function() {
    script.touching = true;
    if (script.time > PRESS_AND_HOLD_TIME) {
        if (!script.brushPickerOpened && script.activeButton == 'Brush Button') {
            script.brushPickerOpened = true;
            global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
            global.tweenManager.startTween(script.brushPickerButton, 'BrushButtonBounce');
            global.tweenManager.startTween(script.dock, 'DockAlphaOut');
            enableDockButtons(false);
            // tapBrushPickerBackButtonEvent.enabled = true;
            global.tweenManager.startTween(script.brushPicker, 'BrushPickerAlphaIn');
            global.tweenManager.startTween(script.brushStyles, 'BrushStyleAlphaIn');
            // global.tweenManager.startTween(script.brushPickerBackButton, 'BrushPickerBackAlphaIn');
            script.brushPickerController.api.enableBrushes(true);
            script.brushPickerBackButton.enabled = false;
        }
    }
});

const tapBrushPickerButtonEvent = script.brushPickerButton
    .getFirstComponent('Component.ScriptComponent')
    .createEvent('TapEvent');

tapBrushPickerButtonEvent.bind(function() {
    script.brushPickerBackButton.enabled = true;
    // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
    global.tweenManager.startTween(script.brushPickerButton, 'BrushButtonBounce', function() {
        global.tweenManager.startTween(script.dock, 'DockAlphaOut', function() {
            enableDockButtons(false);
            tapBrushPickerBackButtonEvent.enabled = true;
        });
        global.tweenManager.startTween(script.brushPicker, 'BrushPickerAlphaIn');
        global.tweenManager.startTween(script.brushStyles, 'BrushStyleAlphaIn');
        global.tweenManager.startTween(script.brushPickerBackButton, 'BrushPickerBackAlphaIn');
        script.brushPickerController.api.enableBrushes(true);
    });
});

const tapBrushPickerBackButtonEvent = script.brushPickerBackButton
    .getFirstComponent('Component.ScriptComponent')
    .createEvent('TapEvent');

tapBrushPickerBackButtonEvent.bind(function() {
    // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
    global.tweenManager.startTween(script.brushPickerBackButton, 'BackButtonBounce', function() {
        script.brushPickerController.api.enableBrushes(false);
        global.tweenManager.startTween(script.brushPicker, 'BrushPickerAlphaOut');
        global.tweenManager.startTween(script.brushStyles, 'BrushStyleAlphaOut');
        global.tweenManager.startTween(script.brushPickerBackButton, 'BrushPickerBackAlphaOut');
        global.tweenManager.startTween(script.dock, 'DockAlphaIn', function() {
            enableDockButtons(true);
            enableNavigationButtons(false);
        });
    });
});
tapBrushPickerBackButtonEvent.enabled = false;

//COLOR PICKER

const moveColorPickerButtonEvent = script.colorPickerButton
    .getFirstComponent('Component.ScriptComponent')
    .createEvent('TouchMoveEvent');

moveColorPickerButtonEvent.bind(function() {
    script.touching = true;
    if (script.time > PRESS_AND_HOLD_TIME) {
        if (!script.colorPickerOpened && script.activeButton == 'Color Picker Button') {
            script.colorPickerOpened = true;
            global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
            global.tweenManager.startTween(script.colorPickerButton, 'ColorButtonBounce');
            global.tweenManager.startTween(script.dock, 'DockAlphaOut');
            enableDockButtons(false);
            // tapColorPickerBackButtonEvent.enabled = true;
            global.tweenManager.startTween(script.colorPicker, 'ColorPickerAlphaIn');
            script.colorPickerController.api.enableColorPickerTouchEvents(true);
            script.colorPickerBackButton.enabled = false;
        }
    }
});

const tapColorPickerButtonEvent = script.colorPickerButton
    .getFirstComponent('Component.ScriptComponent')
    .createEvent('TapEvent');

tapColorPickerButtonEvent.bind(function() {
    script.colorPickerBackButton.enabled = true;
    // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
    global.tweenManager.startTween(script.colorPickerButton, 'ColorButtonBounce', function() {
        global.tweenManager.startTween(script.dock, 'DockAlphaOut', function() {
            enableDockButtons(false);
            tapColorPickerBackButtonEvent.enabled = true;
        });
        global.tweenManager.startTween(script.colorPicker, 'ColorPickerAlphaIn');
        script.colorPickerController.api.enableColorPickerTouchEvents(true);
    });
});

const tapColorPickerBackButtonEvent = script.colorPickerBackButton
    .getFirstComponent('Component.ScriptComponent')
    .createEvent('TapEvent');

tapColorPickerBackButtonEvent.bind(function() {
    // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
    global.tweenManager.startTween(script.colorPickerBackButton, 'BackButtonBounce', function() {
        script.colorPickerController.api.enableColorPickerTouchEvents(false);
        global.tweenManager.startTween(script.colorPicker, 'ColorPickerAlphaOut');
        global.tweenManager.startTween(script.dock, 'DockAlphaIn', function() {
            enableDockButtons(true);
            enableNavigationButtons(false);
        });
    });
});
tapColorPickerBackButtonEvent.enabled = false;

//SIZE PICKER

const moveSizePickerButtonEvent = script.sizePickerButton
    .getFirstComponent('Component.ScriptComponent')
    .createEvent('TouchMoveEvent');

moveSizePickerButtonEvent.bind(function() {
    script.touching = true;
    if (script.time > PRESS_AND_HOLD_TIME) {
        if (!script.sizePickerOpened && script.activeButton == 'Size Picker Button') {
            script.sizePickerOpened = true;
            global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
            global.tweenManager.startTween(script.sizePickerButton, 'SizeButtonBounce');
            global.tweenManager.startTween(script.dock, 'DockAlphaOut');
            enableDockButtons(false);
            // tapSizePickerBackButtonEvent.enabled = true;
            global.tweenManager.startTween(script.sizePicker, 'SizePickerAlphaIn');
            script.sizePickerController.api.enableSizePickerTouchEvents(true);
            script.sizePickerBackButton.enabled = false;
        }
    }
});

const tapSizePickerButtonEvent = script.sizePickerButton
    .getFirstComponent('Component.ScriptComponent')
    .createEvent('TapEvent');

tapSizePickerButtonEvent.bind(function() {
    script.sizePickerBackButton.enabled = true;
    // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
    global.tweenManager.startTween(script.sizePickerButton, 'SizeButtonBounce', function() {
        global.tweenManager.startTween(script.dock, 'DockAlphaOut', function() {
            enableDockButtons(false);
            tapSizePickerBackButtonEvent.enabled = true;
        });
        global.tweenManager.startTween(script.sizePicker, 'SizePickerAlphaIn');
        script.sizePickerController.api.enableSizePickerTouchEvents(true);
    });
});

const tapSizePickerBackButtonEvent = script.sizePickerBackButton
    .getFirstComponent('Component.ScriptComponent')
    .createEvent('TapEvent');

tapSizePickerBackButtonEvent.bind(function() {
    // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
    global.tweenManager.startTween(script.sizePickerBackButton, 'BackButtonBounce', function() {
        script.sizePickerController.api.enableSizePickerTouchEvents(false);
        global.tweenManager.startTween(script.sizePicker, 'SizePickerAlphaOut');
        global.tweenManager.startTween(script.dock, 'DockAlphaIn', function() {
            enableDockButtons(true);
            enableNavigationButtons(false);
        });
    });
});
tapSizePickerBackButtonEvent.enabled = false;

//MIRROR BUTTON

const tapMirrorButtonEvent = script.mirrorButton.getFirstComponent('Component.ScriptComponent').createEvent('TapEvent');

tapMirrorButtonEvent.bind(function() {
    global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
    script.mirrorButtonController.api.toggleMirrorMode();
});

//UNDO BUTTON

const tapUndoButtonEvent = script.undoButton.getFirstComponent('Component.ScriptComponent').createEvent('TapEvent');

tapUndoButtonEvent.bind(function() {
    if (script.undoButtonController.api.getEnabled()) {
        global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
        script.undoButtonController.api.undo();
        global.tweenManager.startTween(script.undoButton, 'MirrorButtonBounce');
    }
});

//GLOBAL TOUCH END

const touchEndEvent = script.createEvent('TouchEndEvent');

touchEndEvent.bind(function() {
    script.touching = false;
    script.time = 0;
    script.activeButton = undefined;
    if (script.brushPickerOpened) {
        script.brushPickerOpened = false;
        // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
        // global.tweenManager.startTween(script.brushPickerBackButton, 'BackButtonBounce', function() {
        script.brushPickerController.api.enableBrushes(false);
        for (var j = 0; j < script.brushStyles.getChildrenCount(); j++) {
            for (var i = 0; i < script.brushStyles.getChild(j).getComponentCount('ScriptComponent'); i++) {
                script.brushStyles.getChild(j).getComponentByIndex('ScriptComponent', i).enabled = false;
            }
        }
        global.tweenManager.startTween(script.brushLabel, 'LabelFadeOut');
        global.tweenManager.startTween(script.brushPicker, 'BrushPickerAlphaOut');
        global.tweenManager.startTween(script.brushStyles, 'BrushStyleAlphaOut');
        global.tweenManager.startTween(script.brushPickerBackButton, 'BrushPickerBackAlphaOut');
        global.tweenManager.startTween(script.dock, 'DockAlphaIn', function() {
            enableDockButtons(true);
            enableNavigationButtons(false);
            for (var j = 0; j < script.brushStyles.getChildrenCount(); j++) {
                for (var i = 0; i < script.brushStyles.getChild(j).getComponentCount('ScriptComponent'); i++) {
                    script.brushStyles.getChild(j).getComponentByIndex('ScriptComponent', i).enabled = true;
                }
            }
        });
        // });
    } else if (script.colorPickerOpened) {
        script.colorPickerOpened = false;
        // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
        // global.tweenManager.startTween(script.colorPickerBackButton, 'BackButtonBounce', function() {
        script.colorPickerController.api.enableColorPickerTouchEvents(false);
        global.tweenManager.startTween(script.colorPicker, 'ColorPickerAlphaOut');
        global.tweenManager.startTween(script.dock, 'DockAlphaIn', function() {
            enableDockButtons(true);
            enableNavigationButtons(false);
        });
        // });
    } else if (script.sizePickerOpened) {
        script.sizePickerOpened = false;
        // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
        // global.tweenManager.startTween(script.sizePickerBackButton, 'BackButtonBounce', function() {
        script.sizePickerController.api.enableSizePickerTouchEvents(false);
        global.tweenManager.startTween(script.sizePicker, 'SizePickerAlphaOut');
        global.tweenManager.startTween(script.dock, 'DockAlphaIn', function() {
            enableDockButtons(true);
            enableNavigationButtons(false);
        });
        // });
    }
});

function touchIsInUI(pos) {
    for (var i = 0; i < script.screenTransforms.length; i++) {
        var screenTransform = script.screenTransforms[i];
        if (screenTransform.containsScreenPoint != undefined) {
            if (screenTransform.containsScreenPoint(pos)) {
                if (screenTransform.getSceneObject().enabled) {
                    return screenTransform.getSceneObject().name;
                }
            }
        }
    }
    return undefined;
}

const enableDockButtons = function(enabled) {
    if (script.brushSupportsColorPicker) {
        tapColorPickerButtonEvent.enabled = enabled;
        moveColorPickerButtonEvent.enabled = enabled;
    }
    tapSizePickerButtonEvent.enabled = enabled;
    moveSizePickerButtonEvent.enabled = enabled;
    tapBrushPickerButtonEvent.enabled = enabled;
    moveBrushPickerButtonEvent.enabled = enabled;
    tapMirrorButtonEvent.enabled = enabled;
};

const enableNavigationButtons = function(enabled) {
    tapSizePickerBackButtonEvent.enabled = enabled;
    tapColorPickerBackButtonEvent.enabled = enabled;
    tapBrushPickerBackButtonEvent.enabled = enabled;
};

script.api.brushSupportsColorPicker = function(enabled) {
    script.brushSupportsColorPicker = enabled;
    script.colorPickerButton.getFirstComponent('Component.Image').mainPass.baseTex = enabled
        ? script.colorPickerEnabled
        : script.colorPickerDisabled;
};
