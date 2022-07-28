// -----JS CODE-----

//@input Component.MeshVisual mesh1;
//@input Component.MeshVisual mesh2;
//@input Component.MeshVisual mesh3;
//@input Component.MeshVisual mesh4;
//@input Component.MeshVisual mesh5;
//@input Component.MeshVisual mesh6;
//@input SceneObject one;
//@input SceneObject two;
//@input SceneObject three;
//@input SceneObject four;
//@input SceneObject five;
//@input SceneObject six;

//@input SceneObject imageTest;


//@input Component.Text textt;
//@input SceneObject image;
//@input Asset.Material selected;
//@input Asset.Material base;


global.behaviorSystem.addCustomTriggerResponse("selectp1",one);
global.behaviorSystem.addCustomTriggerResponse("selectp2",two);
global.behaviorSystem.addCustomTriggerResponse("selectp3",three);
global.behaviorSystem.addCustomTriggerResponse("selectp4",four);
global.behaviorSystem.addCustomTriggerResponse("selectp5",five);
global.behaviorSystem.addCustomTriggerResponse("selectp6",six);


//global.currentSelect = null; 



function one(){
   
    //global.currentSelect = 1;
    
    script.image.setParent(script.one);
    var newPos = script.two.getTransform().getWorldPosition();
    script.imageTest.getTransform().setWorldPosition(newPos);
    script.mesh1.mainMaterial= script.selected;
    script.mesh2.mainMaterial= script.base;
    script.mesh3.mainMaterial= script.base;
    script.mesh4.mainMaterial= script.base;
    script.mesh5.mainMaterial= script.base;
    script.mesh6.mainMaterial= script.base;
  
}

function two(){
    //global.currentSelect = 2;
    script.image.setParent(script.two);
    var newPos = script.two.getTransform().getWorldPosition();
    script.imageTest.getTransform().setWorldPosition(newPos);
    //script.imageTest.getTransform().setLocalPosition(new vec3(0,0,0));
    script.textt.text = String(newPos);
//    script.image.getTransform().setWorldPosition(script.two.getTransform().getWorldPosition());
//    script.image.getTransform().setWorldRotation(script.two.getTransform().getWorldRotation());
//    script.image.getTransform().setLocalScale(new vec3(10,10,10));
    script.mesh2.mainMaterial= script.selected;
    script.mesh1.mainMaterial= script.base;
    script.mesh3.mainMaterial= script.base;
    script.mesh4.mainMaterial= script.base;
    script.mesh5.mainMaterial= script.base;
    script.mesh6.mainMaterial= script.base;
}


function three(){
    //global.currentSelect = 3;
    
    
    var newPos = script.three.getTransform().getWorldPosition();
    script.imageTest.getTransform().setWorldPosition(newPos);
    script.image.setParent(script.three);
    //script.imageTest.getTransform().setLocalPosition(new vec3(0,0,0));
    script.textt.text = String(newPos);
    //script.imageTest.getTransform().setWorldPosition(new vec3(newPos.x, newPos.y, newPos.z));
//    script.image.getTransform().setWorldPosition(script.three.getTransform().getWorldPosition());
//    script.image.getTransform().setWorldRotation(script.three.getTransform().getWorldRotation());
//    script.image.getTransform().setLocalScale(new vec3(10,10,10));
    script.mesh3.mainMaterial= script.selected;
    script.mesh1.mainMaterial= script.base;
    script.mesh2.mainMaterial= script.base;
    script.mesh4.mainMaterial= script.base;
    script.mesh5.mainMaterial= script.base;
    script.mesh6.mainMaterial= script.base;
}

//
function four(){
    //global.currentSelect = 4;
    script.image.setParent(script.four);
    var newPos = script.four.getTransform().getWorldPosition();
    script.imageTest.getTransform().setWorldPosition(newPos);
    script.image.setParent(script.three);
    //script.imageTest.getTransform().setLocalPosition(new vec3(0,0,0));
    script.textt.text = String(newPos);
//    script.image.getTransform().setWorldPosition(script.four.getTransform().getWorldPosition());
//    script.image.getTransform().setWorldRotation(script.four.getTransform().getWorldRotation());
//    script.image.getTransform().setLocalScale(new vec3(10,10,10));
    script.mesh4.mainMaterial=script.selected;
    script.mesh1.mainMaterial= script.base;
    script.mesh2.mainMaterial= script.base;
    script.mesh3.mainMaterial= script.base;
    script.mesh5.mainMaterial= script.base;
    script.mesh6.mainMaterial= script.base;
}

function five(){
    //global.currentSelect = 5;
    script.image.setParent(script.five);
    
//    script.image.getTransform().setWorldPosition(script.five.getTransform().getWorldPosition());
//    script.image.getTransform().setWorldRotation(script.five.getTransform().getWorldRotation());
//    script.image.getTransform().setLocalScale(new vec3(10,10,10));
    var newPos = script.five.getTransform().getWorldPosition();
    script.imageTest.getTransform().setWorldPosition(newPos);
    script.image.setParent(script.three);
    //script.imageTest.getTransform().setLocalPosition(new vec3(0,0,0));
    script.textt.text = String(newPos);
    script.mesh5.mainMaterial=script.selected;
    script.mesh1.mainMaterial= script.base;
    script.mesh2.mainMaterial= script.base;
    script.mesh3.mainMaterial= script.base;
    script.mesh4.mainMaterial= script.base;
    script.mesh6.mainMaterial= script.base;
}

function six(){
    //global.currentSelect = 6;
    script.image.setParent(script.six);
    var newPos = script.six.getTransform().getWorldPosition();
    script.imageTest.getTransform().setWorldPosition(newPos);
    script.image.setParent(script.three);
    //script.imageTest.getTransform().setLocalPosition(new vec3(0,0,0));
    script.textt.text = String(newPos);
//    script.image.getTransform().setWorldPosition(script.six.getTransform().getWorldPosition());
//    script.image.getTransform().setWorldRotation(script.six.getTransform().getWorldRotation());
//    script.image.getTransform().setLocalScale(new vec3(10,10,10));
    script.mesh6.mainMaterial=script.selected;
    script.mesh1.mainMaterial= script.base;
    script.mesh2.mainMaterial= script.base;
    script.mesh3.mainMaterial= script.base;
    script.mesh4.mainMaterial= script.base;
    script.mesh5.mainMaterial= script.base;
}




