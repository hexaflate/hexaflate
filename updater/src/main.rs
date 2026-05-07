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

    let include_prerelease = ask_yn("Include pre-release updates?", false);

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

    let is_fresh = !Path::new(PROCESS_NAME).exists();
    let current = read_exe_version(PROCESS_NAME).unwrap_or_default();

    // Tag: "v0.12.9-pre" -> "0.12.9", PE ProductVersion: "0.12.9"
    let tag_base = release
        .tag_name
        .trim_start_matches('v')
        .split('-')
        .next()
        .unwrap_or("");

    if !is_fresh && tag_base == current.trim() {
        println!(" already up to date ({}).", release.tag_name);
        pause();
        return;
    }

    if is_fresh {
        println!(" {} not found.", PROCESS_NAME);
        if !ask_yn(&format!("Fresh install {}?", release.tag_name), true) {
            println!("Cancelled.");
            pause();
            return;
        }
    } else {
        println!(
            " new version: {} (installed: {})",
            release.tag_name, current
        );
        if !ask_yn(&format!("Update to {}?", release.tag_name), true) {
            println!("Cancelled.");
            pause();
            return;
        }
    }

    let asset = release
        .assets
        .iter()
        .find(|a| a.name == ASSET_NAME)
        .expect("Release asset not found");

    if !is_fresh {
        println!("Stopping {}...", PROCESS_NAME);

        // Get PID of target process
        let pid = get_pid(PROCESS_NAME);

        if let Some(pid) = pid {
            // Send SIGINT (Ctrl+C) via GenerateConsoleCtrlEvent
            #[cfg(windows)]
            unsafe {
                winapi::um::wincon::GenerateConsoleCtrlEvent(winapi::um::wincon::CTRL_C_EVENT, pid);
            }
            #[cfg(not(windows))]
            let _ = pid;
        }

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
        println!();
    }

    println!("Downloading {}...", asset.name);
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
        let mut writer = BufWriter::new(fs::File::create(out_path).expect("Failed to write file"));
        io::copy(&mut entry, &mut writer).unwrap();
    }

    println!("Done! Please start {} manually.", PROCESS_NAME);
    pause();
}

/// Read ProductVersion string from Windows PE version resource.
#[cfg(windows)]
fn read_exe_version(exe: &str) -> Option<String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use winapi::shared::minwindef::DWORD;
    use winapi::um::winver::{GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW};

    let path: Vec<u16> = OsStr::new(exe).encode_wide().chain(Some(0)).collect();
    let mut handle: DWORD = 0;
    let size = unsafe { GetFileVersionInfoSizeW(path.as_ptr(), &mut handle) };
    if size == 0 {
        return None;
    }

    let mut buf = vec![0u8; size as usize];
    let ok = unsafe { GetFileVersionInfoW(path.as_ptr(), handle, size, buf.as_mut_ptr() as _) };
    if ok == 0 {
        return None;
    }

    let sub: Vec<u16> = OsStr::new("\\StringFileInfo\\040904b0\\ProductVersion")
        .encode_wide()
        .chain(Some(0))
        .collect();
    let mut ptr: winapi::shared::minwindef::LPVOID = std::ptr::null_mut();
    let mut len: u32 = 0;
    let ok = unsafe { VerQueryValueW(buf.as_ptr() as _, sub.as_ptr(), &mut ptr, &mut len) };
    if ok == 0 || len == 0 {
        return None;
    }

    let slice = unsafe { std::slice::from_raw_parts(ptr as *const u16, (len - 1) as usize) };
    Some(String::from_utf16_lossy(slice))
}

#[cfg(not(windows))]
fn read_exe_version(_exe: &str) -> Option<String> {
    None
}

/// Find PID of a process by name using CreateToolhelp32Snapshot.
#[cfg(windows)]
fn get_pid(name: &str) -> Option<u32> {
    use winapi::shared::minwindef::FALSE;
    use winapi::um::handleapi::CloseHandle;
    use winapi::um::tlhelp32::{
        CreateToolhelp32Snapshot, Process32First, Process32Next, PROCESSENTRY32, TH32CS_SNAPPROCESS,
    };

    let snapshot = unsafe { CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) };
    if snapshot == winapi::um::handleapi::INVALID_HANDLE_VALUE {
        return None;
    }

    let mut entry: PROCESSENTRY32 = unsafe { std::mem::zeroed() };
    entry.dwSize = std::mem::size_of::<PROCESSENTRY32>() as u32;

    let mut pid = None;
    if unsafe { Process32First(snapshot, &mut entry) } != FALSE {
        loop {
            let exe = unsafe {
                std::ffi::CStr::from_ptr(entry.szExeFile.as_ptr())
                    .to_string_lossy()
                    .to_lowercase()
            };
            if exe == name.to_lowercase() {
                pid = Some(entry.th32ProcessID);
                break;
            }
            if unsafe { Process32Next(snapshot, &mut entry) } == FALSE {
                break;
            }
        }
    }
    unsafe { CloseHandle(snapshot) };
    pid
}

#[cfg(not(windows))]
fn get_pid(_name: &str) -> Option<u32> {
    None
}

fn ask_yn(prompt: &str, default: bool) -> bool {
    let display = if default {
        format!("{} (Y/n): ", prompt)
    } else {
        format!("{} (y/N): ", prompt)
    };
    loop {
        print!("{}", display);
        io::stdout().flush().unwrap();
        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
        let trimmed = input.trim().to_lowercase();
        if trimmed.is_empty() {
            return default;
        }
        match trimmed.as_str() {
            "y" => return true,
            "n" => return false,
            _ => println!("Please enter y or n."),
        }
    }
}

fn pause() {
    println!("\nPress Enter to exit...");
    io::stdout().flush().unwrap();
    let mut s = String::new();
    io::stdin().read_line(&mut s).unwrap();
}
