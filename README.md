![image](https://firebasestorage.googleapis.com/v0/b/hexcate-mother-base.firebasestorage.app/o/assets%2F1766085732833-528046574-11599fa7-2ba9-4642-9fe9-77f480b9562a.png?alt=media&token=77f9b71c-4be0-413c-946e-6abf873caa85)

# Hexaflate

[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![Axum](https://img.shields.io/badge/Axum-000000?style=for-the-badge&logo=rust&logoColor=white)](https://github.com/tokio-rs/axum)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey?style=for-the-badge)](https://flutter.dev)

Solusi aplikasi mobile untuk sistem Otomax yang dibangun dengan Flutter dan Rust.

## Tentang

Hexaflate adalah aplikasi mobile untuk sistem Otomax yang dibangun dengan Flutter (frontend) dan Rust-Axum (backend). Aplikasi ini dirancang untuk memberikan pengalaman modern seperti aplikasi e-wallet dengan keamanan tinggi dan performa optimal.

---

## Tech Stack

| Komponen   | Teknologi                    |
| ---------- | ---------------------------- |
| Frontend   | Flutter (iOS dan Android)    |
| Backend    | Rust dengan framework Axum   |
| Cache      | Redis                        |
| Database   | SQL Server (existing Otomax) |
| Deployment | Docker Container             |

---

## Fitur Utama

### Keamanan

- Autentikasi biometrik (fingerprint/face recognition) dengan PIN fallback
- Verifikasi PIN untuk setiap transaksi
- Verifikasi identitas dengan KTP dan selfie
- Batas transaksi untuk session login baru
- App Check untuk mencegah akses tidak sah

### Aplikasi

- UI/UX modern mirip aplikasi e-wallet
- Material Design untuk navigasi intuitif
- Dark mode support
- Animasi smooth
- Real-time update tanpa replikasi database

### Fitur Agen

- Pengecekan detail customer (opsional)
- Receipt digital otomatis (share dan print)
- Riwayat transaksi yang jelas
- Sistem polling transaksi real-time
- Registrasi agen langsung via aplikasi
- Multi-referral code (hingga 5 kode per agen)
- Menu transfer saldo terpadu
- Monitoring performa agen

### Pencegahan Fraud

- Mode verifikasi KTP dan selfie
- Proteksi keagenan (hanya member terverifikasi yang dapat mendaftarkan agen)
- Batas transaksi session baru
- Penandaan session aman

### Kustomisasi

- Panel admin untuk perubahan menu, tampilan, dan fitur
- Posisi widget fleksibel
- Banner dinamis untuk promosi
- Widget Cards untuk menu dalam bentuk kartu
- Pengaturan tampilan personal (warna, logo, header, navigasi)
- Layout submenu bervariasi (list, grid, bottom sheet)
- Notifikasi dengan dukungan gambar dan URL

### Multi-Device

- Satu akun untuk multiple devices
- Sinkronisasi otomatis di semua perangkat
- Tidak ada batasan jumlah device

### Customer Chat (Add-on Opsional)

- Chat langsung dengan admin melalui web panel
- Notifikasi terorganisir (admin, transaksi, deposit)
- Firebase Cloud Messaging untuk notifikasi real-time
- Interface chat dengan dukungan media
- Instant messaging via WebSocket

### Login

- Login dengan nomor telepon
- Google & Facebook Login (opsional)
- Perubahan PIN mudah tanpa format manual
- Edit profil self-service

### Konten Dinamis

- Artikel yang dapat diedit (syarat ketentuan, panduan)
- Menu bantuan lengkap (FAQ, tutorial)
- Penyisipan konten dinamis sebelum menu

### Sistem Poin

- Kurs penukaran poin yang dapat dikonfigurasi
- Penukaran poin untuk reward atau saldo

---

## Keunggulan Teknis

### Performa Cache Redis

Response time meningkat drastis dari 250ms menjadi 2ms dengan sistem cache Redis:

- Sinkronisasi cache real-time dengan SQL Server triggers
- Mengurangi beban SQL Server
- Invalidasi cache yang intelligent
- Optimasi memory

### Self-Hosted

- Kontrol penuh atas sistem
- Tidak perlu sewa VPS tambahan
- Data tetap di server Anda

### Skalabilitas

- Real-time sync tanpa replikasi database Otomax
- Data selalu up-to-date
- Support multi-cluster dengan shared storage

---

## Arsitektur Sistem

```bash
[Aplikasi Flutter] <---> [Backend Rust-Axum] <---> [Redis Cache]
                                |
                                v
                         [SQL Server Otomax]
```

Backend Hexaflate berjalan sebagai Docker container yang terhubung ke:

- SQL Server Otomax (database existing)
- Redis (cache dan session)
- Firebase (notifikasi dan autentikasi)

---

## Mulai

Untuk memulai setup Hexaflate, ikuti panduan berikut secara berurutan:

1. [Panduan Setup Redis](Panduan-Setup-Redis-Docker-Container)
2. [Panduan Setup Backend](Panduan-Setup-Backend-Hexaflate)
3. [Panduan Build Aplikasi](Panduan-Build-Aplikasi-Hexaflate)

---

## Kontak

Untuk demo, bantuan instalasi, atau custom app builds:

- Telegram/WhatsApp: +6285128074595
- Website: [hexaflate.com](https://hexaflate.com)

---

## Lisensi

Hexaflate adalah software proprietary yang dikembangkan oleh tim Hexaflate.
