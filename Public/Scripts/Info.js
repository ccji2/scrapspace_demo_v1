// -----JS CODE-----
// @input SceneObject infoButton
// @input SceneObject infoModal
// @input SceneObject frontInfo
// @input SceneObject backInfo
// @input SceneObject dock

// @input SceneObject backButton
// @input SceneObject frontButton

// @input Asset.Texture nextTexture
// @input Asset.Texture doneTexture

const IS_STUDIO = global.deviceInfoSystem.getTargetOS() === 'macos';

var buttonScreenTransform = script.infoButton.getFirstComponent("Component.ScreenTransform")
var modalScreenTransform = script.infoModal.getFirstComponent("Component.ScreenTransform")

var backButtonScreenTransform = script.backButton.getFirstComponent("Component.ScreenTransform")
var frontButtonScreenTransform = script.frontButton.getFirstComponent("Component.ScreenTransform")

script.backButtonDone = undefined;

function onTapped(eventData)
{
	pos = eventData.getTapPosition();

	//TURN ON MODAL
	if (buttonScreenTransform.containsScreenPoint(pos) && script.infoButton.enabled) {
		if (global.scene.getCameraType() === 'front') {
			script.frontInfo.enabled = true;
			script.backInfo.enabled = false;
			script.frontButton.getFirstComponent("Component.Image").mainPass.baseTex = script.nextTexture;
			script.backButton.getFirstComponent("Component.Image").mainPass.baseTex = script.doneTexture;
			script.backButtonDone = true;
		} else {
			script.frontInfo.enabled = false;
			script.backInfo.enabled = true;
			script.backButton.getFirstComponent("Component.Image").mainPass.baseTex = script.nextTexture;
			script.frontButton.getFirstComponent("Component.Image").mainPass.baseTex = script.doneTexture;
			script.backButtonDone = false;
		}
		script.infoModal.enabled = true;
		script.infoButton.enabled = false;
		script.dock.enabled = false;
	}	 
	
	//NEXT AND DONE BUTTONS
	if (script.backButtonDone) {
		if (frontButtonScreenTransform.containsScreenPoint(pos) && script.frontButton.enabled) {
			if (script.frontInfo.enabled) {
				script.frontInfo.enabled = false;
				script.backInfo.enabled = true;
			} else {
				script.frontInfo.enabled = true;
				script.backInfo.enabled = false;
				script.infoModal.enabled = false;
				script.infoButton.enabled = true;
				script.dock.enabled = true;
			}
		}
	} else {
		if (backButtonScreenTransform.containsScreenPoint(pos) && script.backButton.enabled) {
			if (script.frontInfo.enabled) {
				script.frontInfo.enabled = false;
				script.backInfo.enabled = true;
				script.infoModal.enabled = false;
				script.infoButton.enabled = true;
				script.dock.enabled = true;
			} else {
				script.frontInfo.enabled = true;
				script.backInfo.enabled = false;
			}
		}
	}
}
var event = script.createEvent("TapEvent");
event.bind(onTapped);

