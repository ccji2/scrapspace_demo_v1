var mc = script.getSceneObject().getComponent("Component.ManipulateComponent");
if (mc) {
    mc.minDistance = -100;
} else {
    print("Manipulate component can't be found")
}