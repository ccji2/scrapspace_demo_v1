// -----JS CODE-----
//@input SceneObject cursor;
//@input SceneObject confirmButton;
// @input Asset.Texture imagePickerTexture


var event = script.createEvent("UpdateEvent");
event.bind(function(eventData){
    if(global.currentSelect!="draw"){
        script.cursor.enabled = false;
    }else{
        script.cursor.enabled = true;
    }
    
    if(global.currentSelect=="photo"){
        script.confirmButton.enabled = true;
        //script.imagePickerTexture.control.showImagePicker();
    }else{
        //script.imagePickerTexture.control.hideImagePicker();
        script.confirmButton.enabled = false;
    }
    
    
});