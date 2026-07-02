// Windows-only WebView2 runtime guard.
//
// The Steam depot ships no installer: an InstallScript runs the bundled
// Evergreen bootstrapper on first install, but that can fail silently
// (offline first run, runtime removed later). Without the runtime Tauri
// panics into a blank crash, so before building the app we check for
// WebView2, retry the bundled bootstrapper once, and otherwise explain
// instead of dying silently. No-op (early return) when the runtime exists.

pub fn ensure_runtime() {
    if tauri::webview_version().is_ok() {
        return;
    }
    if let Some(setup) = bundled_bootstrapper() {
        let _ = std::process::Command::new(&setup)
            .args(["/silent", "/install"])
            .status();
        if tauri::webview_version().is_ok() {
            return;
        }
    }
    message_box(
        "Little Apartment, Big City",
        "Microsoft Edge WebView2 Runtime is required but could not be installed.\n\nPlease install it from:\nhttps://developer.microsoft.com/microsoft-edge/webview2/",
    );
    std::process::exit(1);
}

// MicrosoftEdgeWebview2Setup.exe sits beside the game exe in the Steam depot.
fn bundled_bootstrapper() -> Option<std::path::PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let setup = exe.parent()?.join("MicrosoftEdgeWebview2Setup.exe");
    setup.exists().then_some(setup)
}

// Raw MessageBoxW so we need no extra dependency for one error dialog.
fn message_box(title: &str, text: &str) {
    #[link(name = "user32")]
    extern "system" {
        fn MessageBoxW(hwnd: isize, text: *const u16, caption: *const u16, utype: u32) -> i32;
    }
    fn wide(s: &str) -> Vec<u16> {
        s.encode_utf16().chain([0]).collect()
    }
    let (text, title) = (wide(text), wide(title));
    const MB_OK_ICONERROR: u32 = 0x0000_0010;
    unsafe { MessageBoxW(0, text.as_ptr(), title.as_ptr(), MB_OK_ICONERROR) };
}
