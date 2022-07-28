//@input float weight = 1.0 {"widget": "slider", "min": 0, "max": 1, "step": 0.05}
//@input SceneObject transform1
//@input SceneObject transform2
//@input SceneObject transform3
//@input float weight1 = 0.0 {"widget": "slider", "min": 0, "max": 1, "step": 0.05}
//@input float weight2 = 0.0 {"widget": "slider", "min": 0, "max": 1, "step": 0.05}
//@input float weight3 = 0.0 {"widget": "slider", "min": 0, "max": 1, "step": 0.05}
//@input vec3 offset


var initPos = vec3.zero()


function init() {
    if (!script.transform1 && !script.transform2 && !script.transform3)
        return

    initPos = script.getSceneObject().getTransform().getWorldPosition()
    script.createEvent("UpdateEvent").bind(update)
}


function update() {
    var normWeights = normalizeWeights()

    var dif1 = vec3.zero()
    if (script.transform1 && script.weight1 > 0) {
        dif1 = script.transform1.getTransform().getWorldPosition().uniformScale(normWeights[0])
    }

    var dif2 = vec3.zero()
    if (script.transform2 && script.weight2 > 0) {
        dif2 = script.transform2.getTransform().getWorldPosition().uniformScale(normWeights[1])
    }

    var dif3 = vec3.zero()
    if (script.transform3 && script.weight3 > 0) {
        dif3 = script.transform3.getTransform().getWorldPosition().uniformScale(normWeights[2])
    }

    var targetPosition = dif1.add(dif2).add(dif3)
    var pos = initPos.add(targetPosition.sub(initPos).uniformScale(script.weight)).add(script.offset)
    script.getSceneObject().getTransform().setWorldPosition(pos)
}


function normalizeWeights() {
    var sum = script.weight1 + script.weight2 + script.weight3
    return [
        script.weight1 / sum,
        script.weight2 / sum,
        script.weight3 / sum,
    ]
}


init()