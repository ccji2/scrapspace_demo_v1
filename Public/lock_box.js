// -----JS CODE-----
global.behaviorSystem.addCustomTriggerResponse("lock",lock);
global.behaviorSystem.addCustomTriggerResponse("unlock",unlock);

////@input SceneObject box;
////@input Component.BaseMeshVisual mesh;

global.touchSystem.touchBlocking = true;
global.touchSystem.enableTouchBlockingException("TouchTypeSwipe", true);
global.touchSystem.enableTouchBlockingException("TouchTypeTap", true);
global.touchSystem.enableTouchBlockingException("TouchTypeDoubleTap", true);


global.lock = false;
global.touch = false;
var currentPos;

function unlock(){
    global.lock = false;
    //script.box.getTransform().setWorldPosition(currentPos);
    //script.box.getComponent("Component.ManipulateComponent").enabled = true;
    //script.box.getComponent("Component.InteractionComponent").addMeshVisual(script.mesh);
    
}


function lock(){
    //script.Text.getComponent("Component.Text").text = "lock";
    global.lock = true;
    //script.box.getComponent("Component.ManipulateComponent").enabled = false;
}


var event = script.createEvent("UpdateEvent");
event.bind(function(eventData){
    //print(touch);
    //script.Text.getComponent("Component.Text").text = String(touch);
//    if(lock&&touch){
//        var boxPos = script.box.getTransform().getWorldPosition();
//        //script.box.getTransform().setWorldPosition(new vec3(boxPos.x,global.camPosy,boxPos.z));
//    }
    //currentPos = script.box.getTransform().getWorldPosition();
  
 
});


//var event = script.createEvent("TouchStartEvent");
//event.bind(function(eventData){
//    
//    touch = true;
// 
//});
//
//var event = script.createEvent("TouchEndEvent");
//event.bind(function(eventData){
//    touch = false;
// 
//});
//
