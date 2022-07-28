// -----JS CODE-----
//@input SceneObject[] UIoptions;

//@input SceneObject drawing;
//@input SceneObject image;
// @input Component.ScreenTransform screenTransform
//
global.behaviorSystem.addCustomTriggerResponse("photo",photo);
global.behaviorSystem.addCustomTriggerResponse("clone",clone);
global.behaviorSystem.addCustomTriggerResponse("draw",draw);

var offsets = script.screenTransform.offsets;
global.currentSelect = null;


function photo(){
    global.tweenManager.startTween( script.UIoptions[0],"select");
    global.tweenManager.startTween( script.UIoptions[1],"deselect");
    global.tweenManager.startTween( script.UIoptions[2],"deselect");
    global.currentSelect = "photo";
    script.image.enabled = true;
    script.drawing.enabled = false;
    offsets.left = -11;
    offsets.right = -11;
}

function clone(){
    global.tweenManager.startTween( script.UIoptions[1],"select");
    global.tweenManager.startTween( script.UIoptions[0],"deselect");
    global.tweenManager.startTween( script.UIoptions[2],"deselect");
    global.currentSelect = "clone";
    script.drawing.enabled = false;
    offsets.left = -11;
    offsets.right = -11;
}

function draw(){
    global.tweenManager.startTween( script.UIoptions[2],"select");
    global.tweenManager.startTween( script.UIoptions[1],"deselect");
    global.tweenManager.startTween( script.UIoptions[0],"deselect");
    global.currentSelect = "draw";
  
    script.drawing.enabled = true;
    offsets.left = 0;
    offsets.right = 0;
    
}
