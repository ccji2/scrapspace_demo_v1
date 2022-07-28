// @input Component.Camera camera
// @input SceneObject cursorSphere
// @input Asset.Material[] cursorMaterials

// @input SceneObject headPlane
// @input SceneObject headBinding

// @input Component.Image[] visuals
// @input SceneObject dock
// @input Component.ScreenTransform[] screenTransforms
// @input Component.ScriptComponent undoButtonScriptComponent
// @input SceneObject infoButton
// @input SceneObject infoModal

// @input Component.DeviceTracking[] deviceTrackingComponents

// @input SceneObject paintContainer
// @input Component.ScriptComponent lensMetricsManagerScriptComponent

const IS_STUDIO = global.deviceInfoSystem.getTargetOS() === 'macos';
const MIN_PATH_SECTION_LENGTH = IS_STUDIO ? 0.5 : 1.0;
const SCREEN_PADDING_START_DRAWING_TOUCH = 0.2; // Reserve some space on either side of the screen for UI stuff, if you start touching there we don't start drawing
const DISTANCE_THRESHOLD = 2;
const RETICLE_RADIUS = 3;
const CURSOR_DISTANCE_FROM_CAMERA = 30;

const PAINT_KEY = 'paint';

const StrokeType = {
    World: 0,
    Face: 1
};

/**
 *
 * @param {Path} path       The path corresponding to this stroke
 * @param {StrokeType} type The type of the stroke
 * @param {string} owner    The owner of the stroke
 */
function Stroke(path, type, owner) {
    this.path = path;
    this.type = type;
    this.owner = owner;
}

// Wait for dependencies to load
if (!global.Brush || !global.appSignals) {
    print('Dependencies not loaded yet');
} else if (!script.initialized) {
    initialize();
} else {
    update();
}

// Remaining todo items:
//  - More interesting brush examples

function initialize() {
    script.initialized = true;

    script.camera.near = 0.02;
    script.camera.far = 10000;

    script.frameCounter = 0;
    script.undoStack = [];
    script.cursorTransform = script.cursorSphere.getTransform();
    script.cursorPass = script.cursorSphere.getFirstComponent('Component.MeshVisual').mainMaterial.mainPass;
    script.shouldVibrate = false;
    script.hasPainted = false;
    script.shouldMirror = true;

    script.strokes = [];
    script.activeStroke = null;

    script.lensMetricsManager = script.lensMetricsManagerScriptComponent.api.initialization();

    global.appSignals.brushSelected.add(onBrushSelected);
    global.appSignals.colorSelected.add(onColorSelected);
    global.appSignals.sizeSelected.add(onSizeSelected);
    global.appSignals.undoButtonPressed.add(onUndoButtonPressed);
    global.appSignals.mirrorModePressed.add(onMirrorModePressed);

    handleTouch();

    global.touchSystem.touchBlocking = true;
    global.touchSystem.enableTouchBlockingException('TouchTypeDoubleTap', true);

    global.mainInitialized = true;

    script.createEvent('CameraFrontEvent').bind(onCameraFront);
    script.createEvent('CameraBackEvent').bind(onCameraBack);
    script.logUserEvent = function(eventName, eventValue) {
        script.lensMetricsManager.addStateEvent(eventName, eventValue);
    };
}

function getTotalPointsOfType(strokeType) {
    var count = 0;
    for (var i = 0; i < script.strokes.length; ++i) {
        var stroke = script.strokes[i];
        if (stroke.type === strokeType) {
            count += stroke.path.points.length;
        }
    }
    return count;
}

function checkDistanceToPoints(position) {
    for (var i = 0; i < script.strokes.length; ++i) {
        if (script.strokes[i].path.isCloserThanDistance(position, DISTANCE_THRESHOLD)) {
            if (script.shouldVibrate) {
                global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
                script.shouldVibrate = false;
            }
            return;
        }
    }

    script.shouldVibrate = true;
}

function getCursorPosition() {
    var currCursorPosition = script.cursorSphere.getTransform().getWorldPosition();
    return currCursorPosition;
}

function update() {
    if (global.scene.isRecording()) {
        script.cursorSphere.enabled = false;
    }

    var currCursorPosition = getCursorPosition();

    if (script.isTouching && global.currentSelect == "draw") {
        if (script.activeStroke !== null) {
            var position = getCursorPosition();
            if (global.scene.getCameraType() == 'front') {
                position = script.headPlane
                    .getTransform()
                    .getInvertedWorldTransform()
                    .multiplyPoint(position);
            }

            script.activeStroke.path.update(position, script.activeSize, script.activeColor);

            if (global.scene.getCameraType() == 'front') {
                script.hasPainted = getTotalPointsOfType(StrokeType.Face) > 4;
            } else {
                script.hasPainted = getTotalPointsOfType(StrokeType.World) > 10;
            }
        }
    } else {
        if (!script.infoModal.enabled) {
            // checkDistanceToPoints(currCursorPosition);
        }
    }

    script.frameCounter++;
}

script.api.hasPainted = function() {
    return script.hasPainted;
};

script.api.logUserEvent = function(eventName, eventValue) {
    return script.logUserEvent(eventName, eventValue);
};

function onBrushSelected(brush) {
    script.logUserEvent('brush_selected', brush.name.toString());
    script.activeBrush = brush;
}

function onColorSelected(color) {
    script.activeColor = color;
    script.cursorPass.baseColor = color;
    script.logUserEvent('color_selected', color.toString());
}

function onSizeSelected(size) {
    script.activeSize = size;
    script.cursorTransform.setLocalScale(new vec3(size * 2, size * 2, size * 2));
    script.logUserEvent('size_selected', size.toString());
}

function onUndoButtonPressed() {
    if (script.undoStack.length > 0) {
        script.undoStack.pop()();
        global.appSignals.undoPerformed.dispatch(script.undoStack.length);
        if (script.undoStack.length == 0) {
            script.undoButtonScriptComponent.api.setEnabled(false);
        }
        script.logUserEvent('undo_pressed', script.undoStack.length.toString());
    }
}

function onMirrorModePressed(enabled) {
    script.shouldMirror = enabled;
    script.logUserEvent('mirror_pressed', enabled.toString());
}

function handle2DTouchInWorld(touchPosition) {
    var transformedX = (touchPosition.x - 0.5) * script.camera.aspect + 0.5;
    var transformedPos = new vec2(transformedX, touchPosition.y);
    var d = transformedPos.distance(new vec2(0.5, 0.5));
    if (d < RETICLE_RADIUS) {
        var touch = script.camera.screenSpaceToWorldSpace(touchPosition, CURSOR_DISTANCE_FROM_CAMERA);
        script.cursorSphere.getTransform().setWorldPosition(touch);
    } else {
        var rad = Math.atan((touchPosition.y - 0.5) / (touchPosition.x - 0.5));
        var x = ((RETICLE_RADIUS * 1.0) / script.camera.aspect) * Math.cos(rad) + 0.5;
        var y = RETICLE_RADIUS * Math.sin(rad) + 0.5;
        if (touchPosition.x < 0.5) {
            x = 1.0 - x;
            y = 1.0 - y;
        }
        var worldPos = script.camera.screenSpaceToWorldSpace(new vec2(x, y), CURSOR_DISTANCE_FROM_CAMERA);
        script.cursorSphere.getTransform().setWorldPosition(worldPos);
    }
}

function resetCursorPosition() {
    var touch = script.camera.screenSpaceToWorldSpace(new vec2(0.5, 0.5), CURSOR_DISTANCE_FROM_CAMERA);
    script.cursorSphere.getTransform().setWorldPosition(touch);
}

function intersectPlane(planePos, planeNormal, rayPos, rayDir) {
    // assuming vectors are all normalized
    var denom = -planeNormal.dot(rayDir);
    if (denom > 1e-6) {
        var offset = planePos.sub(rayPos);
        var dist = -offset.dot(planeNormal) / denom;
        if (dist >= 0) {
            return rayPos.add(rayDir.uniformScale(dist));
        }
    }
    return null;
}

function handle2DTouchOnFace(pos) {
    var worldPos1 = script.camera.screenSpaceToWorldSpace(pos, 0.0);
    var worldPos2 = script.camera.screenSpaceToWorldSpace(pos, 1.0);
    var rayDir = worldPos2.sub(worldPos1).normalize();

    var planeTransform = script.headPlane.getTransform();

    var planePos = planeTransform.getWorldPosition();
    var planeNormal = planeTransform.forward;
    var result = intersectPlane(planePos, planeNormal, worldPos1, rayDir);

    // script.cursorSphere.enabled = !!result;
    if (result) {
        script.cursorSphere.getTransform().setWorldPosition(result);
    }
}

function handleTouch() {
    script.touchStartEvent = script.createEvent('TouchStartEvent');
    script.touchMoveEvent = script.createEvent('TouchMoveEvent');
    script.touchEndEvent = script.createEvent('TouchEndEvent');

    script.touchStartEvent.bind(function(event) {
        script.touchPosition = event.getTouchPosition();
        if (touchIsInUI(script.touchPosition)) {
            script.isTouchingUI = true;
            return;
        }
        if (script.infoModal.enabled) {
            return;
        }
        script.isTouching = true;
        if (global.scene.getCameraType() == 'front') {
            handle2DTouchOnFace(script.touchPosition);
        } else {
            handle2DTouchInWorld(script.touchPosition);
        }
        addNewPath();
        global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
        var color = script.cursorPass.baseColor;
        script.cursorPass.baseOpacity = 0.0;
        script.cursorSphere.enabled = false;
        global.clientInterfaceSystem.perform(ClientInterfaceElement.All, ClientInterfaceAction.Hide);
        global.clientInterfaceSystem.perform(ClientInterfaceElement.SnapButton, ClientInterfaceAction.Show);
        global.tweenManager.startTween(script.dock, 'dockFadeOut', function() {
            var dockChildrenCount = script.dock.getChildrenCount();
            for (var i = 0; i < dockChildrenCount; i++) {
                script.dock.getChild(i).enabled = false;
            }
            script.undoButtonScriptComponent.getSceneObject().enabled = true;
            script.undoButtonScriptComponent.getSceneObject().getFirstComponent('Component.Image').enabled = false;
        });
        script.infoButton.enabled = false;
    });

    script.touchMoveEvent.bind(function(event) {
        script.touchPosition = event.getTouchPosition();
        if (script.isTouchingUI) {
            return;
        }
        if (script.infoModal.enabled) {
            return;
        }
        if (global.scene.getCameraType() == 'front') {
            handle2DTouchOnFace(script.touchPosition);
        } else {
            handle2DTouchInWorld(script.touchPosition);
        }
    });

    script.touchEndEvent.bind(function(event) {
        script.isTouchingUI = false;
        script.touchPosition = event.getTouchPosition();
        // script.infoButton.enabled = true;
        if (!global.scene.isRecording()) {
            script.cursorSphere.enabled = true;
        }
        script.undoButtonScriptComponent.getSceneObject().getFirstComponent('Component.Image').enabled = true;
        if (script.isTouching) {
            global.tweenManager.startTween(script.dock, 'dockFadeIn', function() {
                var dockChildrenCount = script.dock.getChildrenCount();
                for (var i = 0; i < dockChildrenCount; i++) {
                    script.dock.getChild(i).enabled = true;
                }
                script.undoButtonScriptComponent.getSceneObject().enabled = true;
                script.undoButtonScriptComponent.getSceneObject().getFirstComponent('Component.Image').enabled = true;
            });
            resetCursorPosition();
            finishCurrentStroke();
            script.isTouching = false;
            global.appSignals.pathAdded.dispatch();
            // global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
            var color = script.cursorPass.baseColor;
            script.cursorPass.baseColor = new vec4(color.x, color.y, color.z, 1.0);
            if (!global.scene.isRecording()) {
                global.clientInterfaceSystem.perform(ClientInterfaceElement.All, ClientInterfaceAction.Show);
            }
        }
    });
}

function addNewPath() {
    finishCurrentStroke();

    const brush = script.activeBrush;

    var parent = script.paintContainer;
    var scales = [];
    var position = getCursorPosition();
    var type = StrokeType.World;

    if (global.scene.getCameraType() == 'front') {
        parent = script.headPlane;
        if (script.shouldMirror) {
            scales = [new vec3(-1, 1, 1)];
        }
        position = script.headPlane
            .getTransform()
            .getInvertedWorldTransform()
            .multiplyPoint(position);
        type = StrokeType.Face;
    }

    const path = new Path(brush, position, script.activeSize, script.activeColor, scales, parent);
    const stroke = new Stroke(path, type, '');
    script.activeStroke = stroke;
    script.strokes.push(stroke);

    script.logUserEvent('add_new_stroke', type == 0 ? 'World' : 'Face');

    script.undoStack.push(function() {
        for (var i = 0; i < script.strokes.length; ++i) {
            if (script.strokes[i] === stroke) {
                script.strokes[i].path.destroy();
                script.strokes.splice(i, 1);
                break;
            }
        }
    });
    if (!script.undoButtonScriptComponent.api.getEnabled()) {
        script.undoButtonScriptComponent.api.setEnabled(true);
    }
}

function finishCurrentStroke() {
    if (script.activeStroke !== null) {
        script.activeStroke.path.finalize();
        script.activeStroke = null;
    }
}

function onCameraFront() {
    script.hasPainted = false;
    finishCurrentStroke();

    for (var i = 0; i < script.strokes.length; ++i) {
        script.strokes[i].path.setVisible(script.strokes[i].type === StrokeType.Face);
    }
    // for (var i = 0; i < script.deviceTrackingComponents.length; i++) {
    //     script.deviceTrackingComponents[i].enabled = false;
    // }
    for (var i = 0; i < script.cursorMaterials.length; i++) {
        script.cursorMaterials[i].mainPass.depthTest = false;
    }
    script.logUserEvent('front_cam', '');
}

function onCameraBack() {
    script.hasPainted = false;
    finishCurrentStroke();

    for (var i = 0; i < script.strokes.length; ++i) {
        script.strokes[i].path.setVisible(true);
    }
    for (var i = 0; i < script.deviceTrackingComponents.length; i++) {
        script.deviceTrackingComponents[i].enabled = true;
    }
    for (var i = 0; i < script.cursorMaterials.length; i++) {
        script.cursorMaterials[i].mainPass.depthTest = true;
    }
    script.logUserEvent('back_cam', '');
}

function touchIsInUI(pos) {
    for (var i = 0; i < script.screenTransforms.length; i++) {
        var screenTransform = script.screenTransforms[i];
        if (screenTransform.containsScreenPoint != undefined) {
            if (screenTransform.containsScreenPoint(pos)) {
                if (screenTransform.getSceneObject().enabled) {
                    return true;
                }
            }
        }
    }
    return false;
}
