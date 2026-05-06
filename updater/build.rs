fn main() {
    #[cfg(windows)]
    {
        let mut res = winres::WindowsResource::new();
        // Shell32.dll icon index 47 = the classic Windows Update/settings gear icon
        res.set_icon_with_id("C:\\Windows\\System32\\shell32.dll", "47");
        res.compile().unwrap();
    }
}
