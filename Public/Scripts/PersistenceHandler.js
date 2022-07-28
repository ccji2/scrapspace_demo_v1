// -----JS CODE-----
// @input SceneObject paintContainer
key = 'PAINT_STROKES_WORLD';
const ENABLE_PERSISTENT_STORAGE = true;

function onGetAssetSuccess(asset) {
    var tempObject = global.scene.createSceneObject('tempObject');
    tempObject.createComponent('Component.PrefabInstantiator').setPrefab(asset);
    var contentRoot = tempObject.getChild(0);
    contentRoot.removeParent();
    contentRoot.enabled = true;
    contentRoot.getTransform().setLocalPosition(new vec3(0.0, 0.0, 0.0));
    print('succeeded getting asset');
}
function onGetAssetFailed(errorNo, errorDescription) {
    print('failed getting asset with ' + errorNo + ' descr: ' + errorDescription);
}

var delayedEventForRetrieving = script.createEvent('DelayedCallbackEvent');
delayedEventForRetrieving.bind(function(eventData) {});

function onSaveAssetSuccess() {
    print('succeeded saving asset');
}
function onSaveAssetFailed(errorNo, errorDescription) {
    print('failed saving asset with led' + errorNo + ' descr: ' + errorDescription);
}

var savePaint = function() {
    try {
        var paintPrefab = global.assetSystem.createPrefabFromSceneObject(script.paintContainer);
        global.persistentStorageSystem.saveAsset(paintPrefab, key, onSaveAssetSuccess, onSaveAssetFailed);
    } catch (error) {
        print(error);
    }
};

var loadPaint = function() {
    try {
        print('On lens turn on');
        var persistentStorageSystem = global.persistentStorageSystem;
        if (persistentStorageSystem.hasAsset(key)) {
            persistentStorageSystem.getAsset(key, onGetAssetSuccess, onGetAssetFailed);
        } else {
            print('Unable to retrieve object');
        }
    } catch (error) {
        print(error);
    }
};
if (ENABLE_PERSISTENT_STORAGE) {
    var checkRecordingStatusEvent = script.createEvent('UpdateEvent');
    checkRecordingStatusEvent.bind(function(eventData) {
        if (global.scene.isRecording()) {
            savePaint();
            checkRecordingStatusEvent.enabled = false;
        }
    });
    var turnOnEvent = script.createEvent('TurnOnEvent');
    turnOnEvent.bind(loadPaint);
}
