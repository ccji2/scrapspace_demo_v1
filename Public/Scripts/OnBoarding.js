// -----JS CODE-----
// @input Component.Text hint
// @input SceneObject colorCorrection
// @input Component.ScriptComponent mirrorScriptComponent

// @input Component.AnimationMixer hintAnim
// @input SceneObject dock
// @input SceneObject undoButton
// @input Component.ScriptComponent mainControllerScriptComponent
// @input SceneObject successParticles

// @input Component.AnimationMixer paintAnim
// @input Asset.Material paintMat
// @input Asset.Material handMat

//TEXT HINT LOCALIZATION
script.locale = global.localizationSystem.getLanguage();
if (script.locale == 'en') {
    var PRESS_AND_HOLD = 'PRESS AND HOLD';
    var MOVE_PHONE = 'MOVE PHONE TO PAINT';
    var FACE_PAINT = 'DRAW ON YOUR FACE';
} else {
    var PRESS_AND_HOLD = '';
    var MOVE_PHONE = '';
    var FACE_PAINT = '';
}

//FACE VARIABLES
var paintAlpha = 0.0;
var paintFade = 1;
var handAlpha = 0.0;
var handFade = 0.0;
var frontSuccess = false;

//WORLD VARIABLES
const HOLD_TIME = 0.5;

var time = 0;
var hold = false;
var press = false;
var success = false;
var store = global.persistentStorageSystem.store;
// store.clear();

script.hintAnim.setWeight('press_and_hold', 1);
script.hintAnim.setWeight('move_phone', 0);
script.hintAnim.setWeight('thumbs_up', 0);
script.dock.enabled = false;
script.undoButton.enabled = false;
script.successParticles.enabled = false;

const OVERRIDE_HIDE_ONBOARDING = false;

var lerp = function(a, b, t) {
    return a * (1.0 - t) + b * t;
};

function cameraFront() {
    if (OVERRIDE_HIDE_ONBOARDING) {
        script.dock.enabled = true;
        enableFaceAnim(false);
        enableWorldAnim(false);
        return;
    }

    if (store.has('faceOnboardingComplete')) {
        if (store.getBool('faceOnboardingComplete')) {
            script.dock.enabled = true;
            enableFaceAnim(false);
            enableWorldAnim(false);
            return;
        }
    } else {
        enableWorldAnim(false);
        enableFaceAnim(true);
        script.hint.text = FACE_PAINT;
        script.dock.enabled = false;
        script.undoButton.enabled = false;
    }
}
var event = script.createEvent('CameraFrontEvent');
event.bind(cameraFront);

function cameraBack() {
    if (OVERRIDE_HIDE_ONBOARDING) {
        script.dock.enabled = true;
        enableFaceAnim(false);
        enableWorldAnim(false);
        return;
    }
    if (store.has('worldOnboardingComplete')) {
        if (store.getBool('worldOnboardingComplete')) {
            script.dock.enabled = true;
            enableWorldAnim(false);
            enableFaceAnim(false);
            return;
        }
    } else {
        enableFaceAnim(false);
        enableWorldAnim(true);
        script.hint.text = PRESS_AND_HOLD;
        script.successParticles.enabled = false;
        script.dock.enabled = false;
        script.undoButton.enabled = false;
    }
}
var event = script.createEvent('CameraBackEvent');
event.bind(cameraBack);

function update(eventData) {
    if (global.scene.getCameraType() == 'front') {
        if (!store.getBool('faceOnboardingComplete')) {
            var layerTime = script.paintAnim.getLayerTime('BaseLayer');
            var deltaTime = getDeltaTime();
            //PAINT FADE
            if (layerTime < 1) {
                paintAlpha = 0.0;
                paintFade = 1;
            } else if (layerTime > 2.5) {
                var paintAlphaLerp = lerp(paintFade, 0, 0.2);
                paintFade = paintAlphaLerp;
                paintAlpha = paintAlphaLerp;
            } else {
                paintAlpha = 1.0;
            }
            //HAND FADE
            if (layerTime > 2.5) {
                var handAlphaLerp = lerp(handFade, 0, 0.2);
                handFade = handAlphaLerp;
                handAlpha = handAlphaLerp;
            } else if (layerTime > 0.0) {
                var handAlphaLerp = lerp(handFade, 1, 0.2);
                handFade = handAlphaLerp;
                handAlpha = handAlphaLerp;
            }
            //APPLY FADE
            var paintColor = script.paintMat.mainPass.baseColor;
            script.paintMat.mainPass.baseColor = new vec4(paintColor.r, paintColor.g, paintColor.b, paintAlpha);
            var handColor = script.handMat.mainPass.baseColor;
            script.handMat.mainPass.baseColor = new vec4(handColor.r, handColor.g, handColor.b, handAlpha);

            if (script.mainControllerScriptComponent.api.hasPainted()) {
                if (!frontSuccess) {
                    frontSuccess = true;
                    enableFaceAnim(false);
                    global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
                    script.colorCorrection.getFirstComponent('Component.PostEffectVisual').enabled = true;
                    global.tweenManager.startTween(script.colorCorrection, 'fadeOut', function() {
                        script.colorCorrection.getFirstComponent('Component.PostEffectVisual').enabled = false;
                    });
                    script.mainControllerScriptComponent.api.logUserEvent('face_onboarding_complete', '');
                }
            }
        }
    } else {
        if (!store.getBool('worldOnboardingComplete')) {
            if (press) {
                deltaTime = getDeltaTime();
                time += deltaTime;
                if (time > HOLD_TIME) {
                    script.hint.text = MOVE_PHONE;
                    MOVE_PHONEAnimSwitcher();
                }
                if (script.mainControllerScriptComponent.api.hasPainted()) {
                    if (!success) {
                        success = true;
                        successAnimSwitcher();
                        global.hapticFeedbackSystem.hapticFeedback(HapticFeedbackType.TapticEngine);
                        script.colorCorrection.getFirstComponent('Component.PostEffectVisual').enabled = true;
                        global.tweenManager.startTween(script.colorCorrection, 'fadeOut', function() {
                            script.colorCorrection.getFirstComponent('Component.PostEffectVisual').enabled = false;
                        });
                        script.mainControllerScriptComponent.api.logUserEvent('world_onboarding_complete', '');
                    }
                }
            }
        }
    }
}
var event = script.createEvent('UpdateEvent');
event.bind(update);
event.enabled = !OVERRIDE_HIDE_ONBOARDING;

function touchStart(eventData) {
    if (global.scene.getCameraType() == 'front') {
        if (!store.getBool('faceOnboardingComplete')) {
        }
    } else {
        if (!store.getBool('worldOnboardingComplete')) {
            press = true;
        }
    }
}
var event = script.createEvent('TouchStartEvent');
event.bind(touchStart);

event.enabled = !OVERRIDE_HIDE_ONBOARDING;

function touchEnd(eventData) {
    if (global.scene.getCameraType() == 'front') {
        if (!store.getBool('faceOnboardingComplete')) {
            if (frontSuccess) {
                store.putBool('faceOnboardingComplete', true);
                script.dock.enabled = true;
            } else {
                script.undoButton.enabled = false;
            }
        }
    } else {
        if (!store.getBool('worldOnboardingComplete')) {
            hold = false;
            press = false;
            time = 0;
            script.hint.text = PRESS_AND_HOLD;
            script.hintAnim.setWeight('press_and_hold', 1);
            script.hintAnim.setWeight('move_phone', 0);
            script.hintAnim.start('press_and_hold', 0, -1);
            script.hintAnim.stop('move_phone');

            if (success) {
                store.putBool('worldOnboardingComplete', true);
                enableWorldAnim(false);
                script.successParticles.enabled = false;
                script.dock.enabled = true;
            } else {
                script.hintAnim.setWeight('press_and_hold', 1);
                script.hintAnim.setWeight('move_phone', 0);
                script.hintAnim.setWeight('thumbs_up', 0);
                script.hintAnim.stop('move_phone');
                script.hintAnim.stop('thumbs_up');
                script.hintAnim.start('press_and_hold', 1, -1);
                script.undoButton.enabled = false;
            }
        }
    }
}
var event = script.createEvent('TouchEndEvent');
event.bind(touchEnd);
event.enabled = !OVERRIDE_HIDE_ONBOARDING;

function MOVE_PHONEAnimSwitcher() {
    if (!hold) {
        hold = true;
        script.hintAnim.setWeight('press_and_hold', 0);
        script.hintAnim.setWeight('move_phone', 1);
        script.hintAnim.start('move_phone', 1, -1);
        script.hintAnim.stop('press_and_hold');
    }
}

function successAnimSwitcher() {
    if (success) {
        script.hintAnim.setWeight('move_phone', 0);
        script.hintAnim.stop('move_phone');
        script.hintAnim.setWeight('thumbs_up', 1);
        script.hintAnim.start('thumbs_up', 0, 1);
        script.hint.enabled = false;
        script.successParticles.enabled = true;
        script.undoButton.enabled = true;
    }
}

function enableWorldAnim(set) {
    script.hintAnim.getSceneObject().enabled = set;
    script.hint.enabled = set;
}

function enableFaceAnim(set) {
    script.paintAnim.getSceneObject().getParent().enabled = set;
    script.hint.enabled = set;
}
