// Shared entry point for desktop and mobile (Tauri v2).

#[cfg(desktop)]
mod gamepad;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            // Native gamepad bridge → polyfills navigator.getGamepads() in the
            // webview (desktop only; mobile has no controller story here).
            #[cfg(desktop)]
            gamepad::start(_app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
