# 🚀 **Hexaflate - Solusi Aplikasi Mobile untuk Sistem Otomax**

## 📱 **Tentang Hexaflate**

Hexaflate adalah aplikasi mobile berbasis Flutter yang dibuat untuk sistem Otomax. Aplikasi ini dirancang agar ringan, cepat, dan mudah digunakan.

### 🏗️ **Hexaflate Built**

- **Frontend**: Flutter (Cross-platform mobile app)
- **Backend**: Rust-Axum (High-performance server)
- **Database**: Self-hosted (Tanpa Biaya VPS Tambahan)
- **Deployment**: Containerized (Docker)
- **Security**: Multi-layer authentication

---

## 📦 **Instalasi Backend**

Untuk panduan lengkap instalasi backend, silakan kunjungi: [Hexaflate Install Wiki](https://github.com/hexaflate/hexaflate/wiki)

---

## 🎯 **Fitur Unggulan Hexaflate**

### 🔐 **1. Keamanan Seperti E-Wallet**

- **Autentikasi biometrik** - sidik jari atau wajah (fallback ke PIN)
- **PIN transaksi** - verifikasi khusus untuk setiap transaksi

### 📱 **2. Aplikasi Modern**

- **Dibuat khusus untuk bisnis Otomax** - karena fokus pada otomax, tidak ada overhead yang mengganggu.
- **Tampilan modern dan mudah dipakai** - seperti aplikasi e-wallet populer
- **Realtime Update** - karena sistem tidak mereplika database otomax semua perubahan diotomax langsung update realtime ke aplikasi, tidak akan ada masalah synchronization.

### 💳 **3. Dibuat Dari Feedback Agen-Agen Pulsa**

- **Cek Detail Pelanggan Tanpa Konfirmasi** Seperti aplikasi modern pada umumnya, cek detail pelanggan hanya opsional, kendala pada pengecekkan pelanggan bisa diabaikan dan bisa langsung transaksi.
- **Struk digital otomatis** - Struk bisa langsung dishare atau diprint
- **Riwayat transaksi Jelas** - Transaksi Produk Cek (Rp. 0,-) Bisa diabaikan, sehingga membuat riwayat transaksi jelas. Karena maraknya member yang bingung dengan produk CEK di riwayat transaksi.
- **Hanya tampilkan produk yang ada harganya** - Produk Harga Rp. 0,- bisa dihide dari list produk, untuk memperjelas yang mana produk cek dan mana produk real.
- **Transaksi pending dengan sistem Polling** - karena sistem pending dengan polling, transaksi akan sukses real time dengan otomax, tanpa menunggu notifikasi masuk apabila google play service & fcm sedang lamban.
- **Daftarkan agen baru** - mendaftarkan agen langsung via aplikasi.
- **Sistem referral** - sistem referal dengan multiple kode referal, setiap agen boleh memiliki kode referal lebih dari satu (maximal 5 kode referal).
- **Transfer saldo ke agen di satu menu** - tidak perlu dua menu untuk transfer saldo, satu menu sudah deteksi otomatis tujuan transfer bebas atau ke downline.
- **Lihat performa setiap agen** - bisa langsung cek jumlah transaksi downline.

### 👥 **4. Pencegah Penipuan Dengan Mudah**

- **Fitur verifikasi** - fitur verifikasi mode ON, ktp dan selfie.
- **Proteksi Keagenan** - Hanya member yang sudah verifikasi bisa mendaftarkan agen(fitur proteksi ini bisa dioffkan jika tidak sesuai)
- **Proteksi Transaksi Di Sesi Baru** Mitra yang baru login dibatasi transaksinya di nilai tertentu dan maximal total tertentu sesuai pengaturan (dapat dioffkan dengan menaikkan limit maximal). Sesi mitra bisa ditandai aman untuk mengangkat pembatasan akunnya.

### ⚙️ **5. Kustomisasi Lengkap**

- **Panel admin terpusat** - ubah menu, tampilan, dan fitur tanpa update aplikasi
- **Widget fleksibel** - pindah-pindah dan pilih sesuai kebutuhan
- **Banner dinamis** - promosi dan selamat datang bisa diganti kapan saja
- **Tampilan personal** - warna, logo, header, navigasi dan model kartu saldo
- **Submenu variatif** - list, grid, atau bottom sheet
- **Notifikasi canggih** - support gambar dan URL untuk broadcast, dan dapat dipisah berdasarkan level grup member

### 🌐 **6. Multi-Device Support**

- **Satu akun, banyak perangkat** - login di beberapa HP sekaligus, cocok untuk konter dengan cabang
- **Sinkronisasi otomatis** - data update real-time di semua perangkat
- **Tidak ada batas jumlah perangkat**

### 💬 **7. Customer Chat Service(Opsional Add On)**

- **Chat langsung dengan admin** - terorganisir di web admin panel, dengan notifikasi dan suara.
- **Notifikasi terorganisir** - pesan dari admin, pesan transaksi, pesan deposit dan biasa dipisah
- **Notifikasi menggunakan FCM** - firebase cloud messaging untuk notifikasi real time
- **Percakapan simple** - mudah dan familiar, support kirim video gambar dan voicenote
- **Jawaban cepat** - Dengan websocket, panel admin menerima pesan dari mitra secara instant, begitu juga mitra menerima pesan dari admin.

### 🌙 **8. Mode Gelap & Tampilan Modern**

- **Mode gelap untuk mata** - tidak silau kalau pakai malam hari
- **Tampilan seperti aplikasi modern**
- **Navigasi mudah dipahami** - tidak perlu belajar lama. Material Design mudah dipahami pengguna android.
- **Animasi halus** - seperti aplikasi premium

### 🔧 **9. Verifikasi & Login Mudah**

- **Login cuma pakai nomor HP** - tidak perlu ID mitra rumit yang sering terlupakan
- **Google Login** - Atau login menggunakan akun google (mengurangi penggunaan OTP dan tetap aman)
- **Ganti PIN mudah** - tidak perlu kirim format manual
- **Edit profil sendiri** - tidak perlu hubungi admin, ubah alamat, nama toko, nama pribadi langsung dari aplikasi.

### 📄 **10. Konten Bisa Diubah**

- **Artikel bisa diedit** - syarat ketentuan, cara pakai, dll
- **Menu bantuan lengkap** - halaman Menu Bantuan, FAQ, tutorial tersedian untuk ditambah.
- **Konten dinamis** - admin bisa update kapan saja bisa disisipkan sebelum menu, seperti syarat ketentuan penggunaan transfer bank, (bukan di letak di deskripsi menu).

### 🎁 **11. Sistem Poin & Hadiah**

- **Poin Transaksi Bisa dirubah kursnya** - Poin per rupiah bisa dirubah
- **Tukar poin jadi hadiah atau saldo** - pulsa gratis, saldo, atau hadiah fisik

### 🏢 **12. Self-Hosted Server**

- **Kontrol penuh atas sistem** - tidak perlu sewa VPS/Data Center tambahan

## ✅ **Keuntungan Memilih Hexaflate**

### 🚀 **Teknologi Terdepan**

- **Flutter** untuk performa native yang smooth
- **Rust backend** untuk keamanan dan stabilitas maksimal
- **Containerized deployment** untuk kemudahan maintenance

### 🎛️ **Kontrol Penuh**

- **Self-hosted server** dengan kontrol total server anda
- **Real-time customization** ubah menu & layout tanpa update aplikasi

### 📈 **Skalabilitas**

- **Real-time synchronization** tanpa replika database otomax, sehingga data selalu real time; tidak ada kendala synchronization.

---

## 🏁 **Penutup**

**Hexaflate** adalah solusi lengkap untuk transformasi digital sistem Otomax Anda. Dengan teknologi terdepan, keamanan maksimal, dan fleksibilitas biaya yang tinggi, kami siap mendukung pertumbuhan bisnis Anda.

### 🎯 **Mulai Sekarang**

Pilih kebutuhan bisnis Anda dan mulai transformasi digital bersama Hexaflate. Tim kami siap membantu dengan simulasi, perbandingan, atau draft kontrak.

---

## **Kontak untuk Demo / Bantuan**

Jika membutuhkan **demo**, **installasi bantuan**, atau **custom app build**, silakan hubungi:

- **Telegram/WhatsApp:** +6285128074595
- **Website:** [https://hexaflate.com/](https://hexaflate.com)

**Hormat kami,**  
**Tim Hexaflate**  
_Revolusi Digital Otomax_
