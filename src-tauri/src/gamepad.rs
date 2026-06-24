// Native gamepad bridge (desktop only).
//
// The W3C Gamepad API is unreliable inside Tauri's webviews: WebView2 (Windows)
// has a long-standing focus bug where pads only register with DevTools focused,
// and WebKitGTK (Linux/Steam Deck) only exposes pads when built with libmanette.
// So instead of trusting the webview, we read controllers natively with `gilrs`
// (XInput on Windows, evdev on Linux incl. the Steam Deck, IOKit on macOS) and
// emit a snapshot to the frontend, which polyfills `navigator.getGamepads()`.
//
// Layout matches the W3C "standard" gamepad so the existing engine code (which
// reads buttons 0/1/3/9/12-15 + axes 0/1) works unchanged.

use gilrs::{Axis, Button, Gilrs};
use serde::Serialize;
use std::{thread, time::Duration};
use tauri::{AppHandle, Emitter};

#[derive(Serialize, Clone)]
struct PadButton {
    pressed: bool,
    value: f32,
}

#[derive(Serialize, Clone)]
struct PadState {
    index: usize,
    id: String,
    mapping: String, // always "standard" — gilrs normalizes via SDL mappings
    connected: bool,
    buttons: Vec<PadButton>,
    axes: Vec<f32>,
}

// Poll ~120 Hz so a 60 Hz render loop never misses a button edge.
const POLL_MS: u64 = 8;

pub fn start(app: AppHandle) {
    thread::spawn(move || {
        let mut gilrs = match Gilrs::new() {
            Ok(g) => g,
            Err(_) => return, // no gamepad subsystem available; bridge stays silent
        };
        loop {
            // Pump the event queue so connect/disconnect + state stay current.
            while gilrs.next_event().is_some() {}

            let mut pads: Vec<PadState> = Vec::new();
            for (i, (_id, gamepad)) in gilrs.gamepads().enumerate() {
                let b = |btn: Button| {
                    let value = gamepad.button_data(btn).map(|d| d.value()).unwrap_or(0.0);
                    PadButton {
                        pressed: gamepad.is_pressed(btn),
                        value,
                    }
                };
                // W3C standard order: A,B,X,Y, LB,RB, LT,RT, Back,Start, L3,R3,
                // DUp,DDown,DLeft,DRight, Guide. In gilrs, LeftTrigger = bumper
                // (LB) and LeftTrigger2 = the analog trigger (LT).
                let buttons = vec![
                    b(Button::South),
                    b(Button::East),
                    b(Button::West),
                    b(Button::North),
                    b(Button::LeftTrigger),
                    b(Button::RightTrigger),
                    b(Button::LeftTrigger2),
                    b(Button::RightTrigger2),
                    b(Button::Select),
                    b(Button::Start),
                    b(Button::LeftThumb),
                    b(Button::RightThumb),
                    b(Button::DPadUp),
                    b(Button::DPadDown),
                    b(Button::DPadLeft),
                    b(Button::DPadRight),
                    b(Button::Mode),
                ];
                // Web convention: +Y is down. gilrs reports +Y up, so invert Y.
                let axes = vec![
                    gamepad.value(Axis::LeftStickX),
                    -gamepad.value(Axis::LeftStickY),
                    gamepad.value(Axis::RightStickX),
                    -gamepad.value(Axis::RightStickY),
                ];
                pads.push(PadState {
                    index: i,
                    id: gamepad.name().to_string(),
                    mapping: "standard".into(),
                    connected: gamepad.is_connected(),
                    buttons,
                    axes,
                });
            }

            let _ = app.emit("gamepad:state", &pads);
            thread::sleep(Duration::from_millis(POLL_MS));
        }
    });
}
