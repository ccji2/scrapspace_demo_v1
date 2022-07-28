// -----JS CODE-----

script.api.initialization = function() {
    var LensMetricsManager = function() {
        var that = this;
        const PAINT_STATE_HISTORY_KEY_PREFIX = 'paint3d_events_';
        var stateHistoryEventArray = [];
        var eventIndex = 0;
        updateEventKey();

        const PRINT_EVENTS = true;

        that.lensStartTime = getTime();

        var deviceClass = global.deviceInfoSystem.getDeviceClass();
        if (!deviceClass) {
            deviceClass = 'U';
        }

        function truncated(val) {
            return Math.floor(val * 100) / 100;
        }

        function countOnce(arr) {
            if (arr.length > 0) return 1;
            else return 0;
        }

        function getPaddedInt(i, size) {
            var s = i.toString();
            var INT_SIZE = size;
            while (s.length < (INT_SIZE || 2)) {
                s = '0' + s;
            }
            return s;
        }

        function updateEventKey() {
            that.eventKey = PAINT_STATE_HISTORY_KEY_PREFIX + getPaddedInt(eventIndex, 3);
        }

        that.getDeltaTime = function() {
            return getTime() - that.lensStartTime;
        };

        function summarizeEvents(events) {
            var brush_selected = events.filter(function(obj) {
                return obj.e == 'brush_selected';
            });
            var color_selected = events.filter(function(obj) {
                return obj.e == 'color_selected';
            });
            var size_selected = events.filter(function(obj) {
                return obj.e == 'size_selected';
            });
            var undo_pressed = events.filter(function(obj) {
                return obj.e == 'undo_pressed';
            });
            var mirror_pressed = events.filter(function(obj) {
                return obj.e == 'mirror_pressed';
            });
            var add_new_stroke = events.filter(function(obj) {
                return obj.e == 'add_new_stroke';
            });
            var face_onboarding = events.filter(function(obj) {
                return obj.e == 'face_onboarding_complete';
            });
            var world_onboarding = events.filter(function(obj) {
                return obj.e == 'world_onboarding_complete';
            });
            const brush_selected_count = brush_selected.length;
            const color_selected_count = color_selected.length;
            const size_selected_count = size_selected.length;
            const undo_pressed_count = undo_pressed.length;
            const mirror_pressed_count = mirror_pressed.length;
            const strokes_count = add_new_stroke.length;
            const face_onboarding_completed = countOnce(face_onboarding);
            const world_onboarding_completed = countOnce(world_onboarding);

            const report = [
                deviceClass,
                brush_selected_count,
                color_selected_count,
                size_selected_count,
                undo_pressed_count,
                mirror_pressed_count,
                strokes_count,
                face_onboarding_completed,
                world_onboarding_completed
            ].join('_');

            return report;
        }

        that.addStateEvent = function(eventName, eventValue) {
            var currentTime = truncated(that.getDeltaTime());
            var newEvent = {
                e: eventName,
                v: eventValue,
                t: currentTime
            };
            stateHistoryEventArray.push(newEvent);
            const report = summarizeEvents(stateHistoryEventArray);
            if (PRINT_EVENTS) {
                // print('[LensMetricsManager]: paint_3d_report='+report);
                // print(newEvent.t+"  "+newEvent.e+ " ("+newEvent.v+")")
            }
            if (report.length > 0) {
                global.analyticsSystem.setEventValue(that.eventKey, report);
            }
        };
    };
    var lensMetricsManagerSingleton = new LensMetricsManager();
    return lensMetricsManagerSingleton;
};
