// -----JS CODE-----
//@input SceneObject[] panels;
//@input SceneObject menu;
//@input SceneObject hand;
//@input SceneObject textt;
//@input Asset.Material roundd;
//@input Component.MeshVisual image1;
//
//
global.behaviorSystem.addCustomTriggerResponse("open_gesture_trigger",openBox);
global.behaviorSystem.addCustomTriggerResponse("close_gesture_trigger",closeBox);
global.behaviorSystem.addCustomTriggerResponse("victory_gesture_trigger",crop);

var hasOpened = false;
var hasClosed = true;
var firstTime = 0;

function crop(){
    //script.textt.getComponent("Component.Text").text = "crop";
    script.image1.mainMaterial= script.roundd;
}

function openBox(){
    //script.textt.getComponent("Component.Text").text = "open";
    if(hasClosed){
        firstTime++;
        for(var i = 0; i< 5; i++){
            global.tweenManager.startTween( script.panels[i], "open" );
        }
        hasOpened = true;
        hasClosed = false;
    }
    
}

function closeBox(){
    if(hasOpened){
        for(var i = 0; i< 5; i++){
            global.tweenManager.startTween( script.panels[i], "close" );
        }
        hasClosed = true;
        hasOpened = false;
    }
}

var event = script.createEvent("UpdateEvent");
event.bind(function(eventData){
    if(firstTime ==1){
        script.menu.enabled = true;
        script.hand.enabled = false;
    }
     
});