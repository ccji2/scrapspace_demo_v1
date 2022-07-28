// -----JS CODE-----
// @input Asset.Texture mirrorDisabledTexture
// @input Asset.Texture mirrorEnabledTexture
// @input SceneObject mirroringGuide

const DEFAULT_MIRROR_MODE = true;

function checkDependencies() {
    if (global.mainInitialized && !script.initialized) {
        initialize();
    }
}
script.checkDependenciesEvent = script.createEvent('UpdateEvent');
script.checkDependenciesEvent.bind(checkDependencies);

function initialize() {
    enableMirrorMode(DEFAULT_MIRROR_MODE);
    script.checkDependenciesEvent.enabled = false;
    script.initialized = true;
}

var enableMirrorMode = function(enabled) {
    script.mirroringGuide.enabled = enabled;
    script.getSceneObject().getFirstComponent('Component.Image').mainPass.baseTex = enabled
        ? script.mirrorEnabledTexture
        : script.mirrorDisabledTexture;
    script.enabled = enabled;
    global.appSignals.mirrorModePressed.dispatch(enabled);
    return enabled;
};

script.api.toggleMirrorMode = function() {
    return enableMirrorMode(!script.enabled);
};
