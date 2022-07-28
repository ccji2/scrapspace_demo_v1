if (!global.appSignals && global.signals) {
    global.appSignals = {
        startedUsingUIElement: new global.signals.Signal(),
        stoppedUsingUIElement: new global.signals.Signal(),
        brushSelected: new global.signals.Signal(),
        colorSelected: new global.signals.Signal(),
        sizeSelected: new global.signals.Signal(),
        undoButtonPressed: new global.signals.Signal(),
        undoPerformed: new global.signals.Signal(),
        pathAdded: new global.signals.Signal(),
        mirrorModePressed: new global.signals.Signal()
    };
}
