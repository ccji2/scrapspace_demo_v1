// -----JS CODE-----
// @input Asset.Texture undoButtonEnabledTexture
// @input Asset.Texture undoButtonDisabledTexture

function checkDependencies() {
    if (global.mainInitialized) {
        initialize();
    }
}

script.checkDependenciesEvent = script.createEvent('UpdateEvent');
script.checkDependenciesEvent.bind(checkDependencies);

function initialize() {
    script.checkDependenciesEvent.enabled = false;
}

script.api.undo = function() {
    if (script.enabled) {
        global.appSignals.undoButtonPressed.dispatch();
    }
};

script.api.setEnabled = function(enabled) {
    script.getSceneObject().getFirstComponent('Component.Image').mainPass.baseTex = enabled
        ? script.undoButtonEnabledTexture
        : script.undoButtonDisabledTexture;
    script.enabled = enabled;
};

script.api.getEnabled = function() {
    return script.enabled;
};
script.api.setEnabled(false);
