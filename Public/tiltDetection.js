// -----JS CODE-----
//@input SceneObject t
//@input SceneObject camCenter
//@input SceneObject confirmbuttom
//global.behaviorSystem.addCustomTriggerResponse("confirm",confirm);
//global.behaviorSystem.addCustomTriggerResponse("confirm",confirm);

var horizontal = false;
var vertical = true;
var confirm = false;
var confirmTime = 0;

global.camPosy;
global.camPosx;
global.camPosz;

script.api.confirm = function()
{
    confirmTime++;
    if(confirmTime%2 == 1){
        confirm = true;
        global.tweenManager.startTween( script.confirmbuttom, "highlight");
        print("confirm");
    }else{
        confirm = false;
        global.tweenManager.startTween( script.confirmbuttom, "dehighlight");
    }
    
}


function confirm(){
    confirm = true;
    print("confirm");
}

var event = script.createEvent("UpdateEvent")
event.bind(function(eventData){
    var tPos = script.t.getTransform().getWorldPosition();
    var tRot = script.t.getTransform().getLocalRotation();
    
    global.camPosx = script.camCenter.getTransform().getWorldPosition().x;
    global.camPosy = script.camCenter.getTransform().getWorldPosition().y;
    global.camPosz = script.camCenter.getTransform().getWorldPosition().z;
    //script.txt.text = String(tPos);
    if(!confirm){
        if(tPos.z < 13){
        if(vertical&&!horizontal){
            global.tweenManager.startTween( script.getSceneObject(), "go_horizontal" );//play twine go horizontal
            vertical = false;
            horizontal = true;
        }
    }
    
    if(tPos.z > 20){
        if(horizontal&&!vertical){
            global.tweenManager.startTween( script.getSceneObject(), "go_vertical" );//play twine go vertical
            horizontal = false;
            vertical = true;
        }
    }
    }
   
    
    
     
})