// ScrollOnTap.js
// by : Azoz Albrek
// @input Component.Image image
// @input Asset.Texture[] textures

// Our starting texture index
var currentItemIndex = 0;

var pass = script.image.mainPass;
// Assign the initial texture to our sprite
pass.baseTex = script.textures[currentItemIndex];

// Define what happens when you tap.
function changeTexture() {

    // Increment the current item index
    currentItemIndex += 1;

    // We need the current item index to wrap around 
    // once it's higher than the number of items we have.
    currentItemIndex = currentItemIndex % script.textures.length;

    // Change the sprite's texture
    pass.baseTex = script.textures[currentItemIndex];
}

// Bind the function to the touch event.
var touchEvent = script.createEvent("TapEvent");
touchEvent.bind(changeTexture);
