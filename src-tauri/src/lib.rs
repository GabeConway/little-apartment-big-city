// Shared entry point for desktop and mobile (Tauri v2).

#[cfg(desktop)]
mod gamepad;
#[cfg(windows)]
mod webview2;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // WebView2 runtime guard (Steam ships the raw exe; see webview2.rs).
    // Early-returns immediately when the runtime is already installed.
    #[cfg(windows)]
    webview2::ensure_runtime();

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
