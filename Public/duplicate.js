// -----JS CODE-----
//@input SceneObject copyBase
//@input Asset.ObjectPrefab prefab
//@input SceneObject text

global.touchSystem.touchBlocking = true;
global.touchSystem.enableTouchBlockingException("TouchTypeSwipe", true);
global.touchSystem.enableTouchBlockingException("TouchTypeTap", true);
global.touchSystem.enableTouchBlockingException("TouchTypeDoubleTap", true);
global.newObj;

var count =0;
var tapCount = 0;

function createObject(sceneObj, realName){
    sceneObj.enabled = true;
    var nextCopy = global.scene.createSceneObject(realName);
    nextCopy.copyWholeHierarchy(sceneObj);
    nextCopy.removeParent();
    sceneObj.enabled = true;
    nextCopy.name = realName;
    nextCopy.getTransform().setWorldPosition(new vec3(7,count,count));
    return nextCopy.getChild(0);
}

function duplicate(){
    count++;
    createObject(script.copyBase, "night");
    
}

var event = script.createEvent("TapEvent");
event.bind(function(eventData){
    if(global.currentSelect=="photo"){
        tapCount++;
        if(tapCount == 2){
        //global.newObj = script.prefab.instantiate(null);
        //newObj.getTransform().setWorldPosition(new vec3(10,0,-22));
        duplicate();
        tapCount = 0;
    }
}
    //touch = true;
 
});

var event = script.createEvent("UpdateEvent");
event.bind(function(eventData){
    script.text.getComponent("Component.Text").text = String(tapCount);
  
 
});