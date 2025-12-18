# Hexaflate

<img width="1260" height="484" alt="hexflate v otomax" src="https://github.com/user-attachments/assets/b0d8fb3a-ae18-49c5-a345-518e63effc2f" />

[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![Rust](https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![Axum](https://img.shields.io/badge/Axum-000000?style=for-the-badge&logo=rust&logoColor=white)](https://github.com/tokio-rs/axum)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey?style=for-the-badge)](https://flutter.dev)

Solusi aplikasi mobile untuk sistem Otomax yang dibangun dengan Flutter dan Rust.

## Tentang

Hexaflate adalah aplikasi mobile berbasis Flutter yang dirancang untuk sistem Otomax. Aplikasi ini dibangun agar ringan, cepat, dan mudah digunakan.

## Tech Stack

- **Frontend**: Flutter (Cross-platform mobile app)
- **Backend**: Rust-Axum (High-performance server)
- **Database**: Self-hosted
- **Deployment**: Containerized (Docker)
- **Security**: Multi-layer authentication

## Instalasi

Untuk panduan lengkap instalasi backend, kunjungi: [Hexaflate Install Wiki](https://github.com/hexaflate/hexaflate/wiki)

## Fitur

### Security

- Autentikasi biometric (fingerprint atau face recognition dengan PIN fallback)
- Verifikasi PIN transaksi untuk setiap transaksi
- Verifikasi identitas dengan KTP dan selfie
- Batas transaksi berbasis session untuk login baru

### Aplikasi Modern

- Dibangun khusus untuk sistem bisnis Otomax
- UI/UX modern mirip aplikasi e-wallet populer
- Update real-time tanpa replikasi database
- Material Design untuk navigasi yang intuitif

### Fitur Fokus Agen

- Pengecekan detail customer opsional
- Receipt digital otomatis (dapat dibagikan dan dicetak)
- Riwayat transaksi yang jelas (mengecualikan produk cek Rp. 0)
- Sembunyikan produk harga nol dari daftar produk
- Sistem polling transaksi real-time
- Registrasi agen langsung via aplikasi
- Sistem multi-referral code (hingga 5 kode per agen)
- Menu transfer saldo terpadu
- Monitoring performa agen

### Pencegahan Fraud

- Mode verifikasi dengan KTP dan selfie
- Proteksi keagenan (hanya member terverifikasi yang dapat mendaftarkan agen)
- Batas transaksi session baru
- Penandaan session aman untuk mengangkat pembatasan akun

### Kustomisasi Lengkap

- Panel admin untuk perubahan menu, tampilan, dan fitur
- Posisi widget yang fleksibel
- Banner dinamis untuk promosi
- Widget Cards untuk membuat menu dalam bentuk kartu
- Pengaturan tampilan personal (warna, logo, header, navigasi)
- Layout submenu yang bervariasi (list, grid, bottom sheet)
- Notifikasi canggih dengan dukungan gambar dan URL

### Dukungan Multi-Device

- Satu akun, multiple devices
- Sinkronisasi otomatis di semua perangkat
- Tidak ada batasan jumlah device

### Customer Chat Service (Add-on Opsional)

- Chat langsung dengan admin melalui web panel
- Notifikasi terorganisir (admin, transaksi, pesan deposit)
- Firebase Cloud Messaging untuk notifikasi real-time
- Interface percakapan sederhana dengan dukungan media
- Instant messaging via WebSocket

### Interface Modern

- Dukungan dark mode
- Tampilan aplikasi modern
- Navigasi intuitif dengan Material Design
- Animasi halus premium

### Verifikasi & Login Mudah

- Login hanya dengan nomor telepon
- Opsi Google Login
- Perubahan PIN mudah tanpa format manual
- Edit profil self-service

### Manajemen Konten Dinamis

- Artikel yang dapat diedit (syarat dan ketentuan, panduan penggunaan)
- Menu bantuan lengkap (FAQ, tutorial)
- Penyisipan konten dinamis sebelum menu

### Sistem Poin & Reward

- Kurs penukaran poin transaksi yang dapat dikonfigurasi
- Penukaran poin untuk reward atau saldo

### Self-Hosted Server

- Kontrol sistem yang lengkap
- Tidak perlu sewa VPS/Data Center tambahan

### Sistem Cache Redis

- Response time ultra cepat (peningkatan dari 250ms ke 2ms)
- Sinkronisasi cache real-time dengan SQL Server triggers
- Mengurangi beban SQL Server
- Caching dengan single Redis instance
- Invalidasi cache yang intelligent
- Performa yang dioptimalkan memory

## Keunggulan

### Teknologi Canggih

- Flutter untuk performa native yang smooth
- Backend Rust untuk keamanan dan stabilitas maksimal
- Deployment containerized untuk maintenance yang mudah

### Kontrol Penuh

- Self-hosted server dengan kontrol server total
- Kustomisasi real-time tanpa update aplikasi

### Skalabilitas

- Sinkronisasi real-time tanpa replikasi database Otomax
- Data selalu up-to-date tanpa masalah sinkronisasi

## Kontak

Untuk demo, bantuan instalasi, atau custom app builds:

- **Telegram/WhatsApp:** +6285128074595
- **Website:** [https://hexaflate.com/](https://hexaflate.com)

## Lisensi

Proyek ini adalah software proprietary yang dikembangkan oleh tim Hexaflate.
