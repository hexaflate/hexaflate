use std::{
    fs,
    io::{self, BufWriter, Write},
    path::Path,
    process::Command,
    thread,
    time::Duration,
};

use reqwest::blocking::Client;
use serde::Deserialize;

const REPO_API: &str = "https://api.github.com/repos/hexaflate/hexaflate/releases";
const ASSET_NAME: &str = "hexdial-api-windows-x86_64.zip";
const PROCESS_NAME: &str = "hexdial-api.exe";

#[derive(Deserialize)]
struct Release {
    tag_name: String,
    prerelease: bool,
    assets: Vec<Asset>,
}

#[derive(Deserialize)]
struct Asset {
    name: String,
    browser_download_url: String,
}

fn main() {
    println!("=== Hexdial Updater ===\n");

    let include_prerelease = ask_yn("Include pre-release updates? (y/n): ");

    let client = Client::builder()
        .user_agent("hexdial-updater")
        .build()
        .unwrap();

    print!("Checking for updates...");
    io::stdout().flush().unwrap();

    let releases: Vec<Release> = client
        .get(REPO_API)
        .send()
        .expect("Failed to reach GitHub")
        .json()
        .expect("Failed to parse releases");

    let latest = releases
        .into_iter()
        .find(|r| include_prerelease || !r.prerelease);

    let Some(release) = latest else {
        println!(" no releases found.");
        pause();
        return;
    };

    // Read version from exe PE properties, compare against GitHub tag
    // Tag format: "v0.12.9-pre", PE ProductVersion format: "0.12.9.0"
    let current = read_exe_version(PROCESS_NAME).unwrap_or_default();
    let tag_base = release.tag_name
        .trim_start_matches('v')
        .split('-')
        .next()
        .unwrap_or("");

    // PE ProductVersion is "0.12.9" — compare directly
    let current_base = current.trim().to_string();

    if tag_base == current_base {
        println!(" already up to date ({}).", release.tag_name);
        pause();
        return;
    }

    println!(" new version: {} (installed: {})", release.tag_name, if current.is_empty() { "unknown".into() } else { current });

    if !ask_yn(&format!("Update to {}? (y/n): ", release.tag_name)) {
        println!("Cancelled.");
        pause();
        return;
    }

    let asset = release
        .assets
        .iter()
        .find(|a| a.name == ASSET_NAME)
        .expect("Release asset not found");

    // Graceful kill — send terminate signal
    println!("Stopping {}...", PROCESS_NAME);
    let _ = Command::new("taskkill")
        .args(["/IM", PROCESS_NAME])
        .output();

    // Wait up to 5s, then force kill
    let mut stopped = false;
    for _ in 0..5 {
        thread::sleep(Duration::from_secs(1));
        let out = Command::new("tasklist")
            .args(["/FI", &format!("IMAGENAME eq {}", PROCESS_NAME), "/NH"])
            .output()
            .unwrap();
        if !String::from_utf8_lossy(&out.stdout).contains(PROCESS_NAME) {
            stopped = true;
            break;
        }
        print!(".");
        io::stdout().flush().unwrap();
    }
    if !stopped {
        println!("\nForce killing...");
        let _ = Command::new("taskkill")
            .args(["/IM", PROCESS_NAME, "/F"])
            .output();
        thread::sleep(Duration::from_secs(1));
    }

    println!("\nDownloading {}...", asset.name);
    let bytes = client
        .get(&asset.browser_download_url)
        .send()
        .expect("Download failed")
        .bytes()
        .expect("Failed to read bytes");

    println!("Extracting...");
    let cursor = io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor).expect("Invalid zip");

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).unwrap();
        let out_path = Path::new(entry.name());

        if entry.name().ends_with('/') {
            fs::create_dir_all(out_path).unwrap();
            continue;
        }
        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).unwrap();
        }
        let file = fs::File::create(out_path).expect("Failed to write file");
        let mut writer = BufWriter::new(file);
        io::copy(&mut entry, &mut writer).unwrap();
    }

    println!("Updated to {}. Done!", release.tag_name);
    pause();
}

/// Read ProductVersion string from Windows PE version resource.
/// Returns version string like "0.12.9" or None if not found.
#[cfg(windows)]
fn read_exe_version(exe: &str) -> Option<String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use winapi::um::winver::{GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW};
    use winapi::shared::minwindef::DWORD;

    let path: Vec<u16> = OsStr::new(exe).encode_wide().chain(Some(0)).collect();
    let mut handle: DWORD = 0;
    let size = unsafe { GetFileVersionInfoSizeW(path.as_ptr(), &mut handle) };
    if size == 0 { return None; }

    let mut buf = vec![0u8; size as usize];
    let ok = unsafe { GetFileVersionInfoW(path.as_ptr(), handle, size, buf.as_mut_ptr() as _) };
    if ok == 0 { return None; }

    // Query the string table ProductVersion under the default language block
    let sub: Vec<u16> = OsStr::new("\\StringFileInfo\\040904b0\\ProductVersion")
        .encode_wide().chain(Some(0)).collect();
    let mut ptr: *mut u16 = std::ptr::null_mut();
    let mut len: u32 = 0;
    let ok = unsafe {
        VerQueryValueW(buf.as_ptr() as _, sub.as_ptr(), &mut ptr as *mut *mut u16 as *mut *mut _, &mut len)
    };
    if ok == 0 || len == 0 { return None; }

    let slice = unsafe { std::slice::from_raw_parts(ptr, (len - 1) as usize) };
    Some(String::from_utf16_lossy(slice))
}

#[cfg(not(windows))]
fn read_exe_version(_exe: &str) -> Option<String> {
    None
}

fn ask_yn(prompt: &str) -> bool {
    loop {
        print!("{}", prompt);
        io::stdout().flush().unwrap();
        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
        match input.trim().to_lowercase().as_str() {
            "y" => return true,
            "n" => return false,
            _ => println!("Please enter y or n."),
        }
    }
}

fn pause() {
    println!("\nPress Enter to exit...");
    let mut s = String::new();
    io::stdin().read_line(&mut s).unwrap();
}
