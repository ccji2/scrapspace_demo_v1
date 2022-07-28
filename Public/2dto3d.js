// -----JS CODE-----
//@input SceneObject image;

global.touchSystem.touchBlocking = true;
global.touchSystem.enableTouchBlockingException("TouchTypeSwipe", true);
global.touchSystem.enableTouchBlockingException("TouchTypeTap", true);
global.touchSystem.enableTouchBlockingException("TouchTypeDoubleTap", true);

var touchStartPos;
var currentPos;
var currentImagePosition;


var event = script.createEvent("UpdateEvent");
event.bind(function(eventData){
    
});


var event = script.createEvent("TouchStartEvent");
event.bind(function(eventData){
 touchStartPos = eventData.getTouchPosition();
});

var event = script.createEvent("TouchEndEvent"); 
event.bind(function(eventData){

});
    
var event = script.createEvent("TouchMoveEvent"); 
event.bind(function(eventData){
 if (touchStartPos) {
   currentPos = eventData.getTouchPosition();
   currentImagePosition = script.image.getTransform().getLocalPosition();
   if(global.lock){
        var posX = 4+currentPos.x*-8;
        var posY = 6+currentPos.y*-12;
        if(posX >=2.5) posX = 2.5;
        if(posX <=-2.5) posX = -2.5;
        if(posY >=2.5) posY = 2.5;
        if(posY <=-2.5) posY = -2.5;
        script.image.getTransform().setLocalPosition(new vec3(posX, posY,-10));
            
            
     
   }
        
        print(currentPos);
   }
});