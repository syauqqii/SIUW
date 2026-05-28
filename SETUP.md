# SIUW — Panduan Setup Lengkap

Panduan ini ditulis untuk pemula. Ikuti langkah demi langkah dari atas ke bawah.

---

## Daftar Isi

1. [Install Node.js](#1-install-nodejs)
2. [Download Kode Project](#2-download-kode-project)
3. [Setup Google Sheet](#3-setup-google-sheet)
4. [Setup Google Cloud (Service Account)](#4-setup-google-cloud-service-account)
5. [Setup Cloudinary](#5-setup-cloudinary)
6. [Konfigurasi File .env](#6-konfigurasi-file-env)
7. [Jalankan Backend](#7-jalankan-backend)
8. [Jalankan Frontend](#8-jalankan-frontend)
9. [Login Pertama Kali](#9-login-pertama-kali)

---

## 1. Install Node.js

Node.js adalah runtime yang dibutuhkan untuk menjalankan backend.

**Download sesuai sistem operasi:**

- [Windows (64-bit)](https://nodejs.org/dist/v24.16.0/node-v24.16.0-x64.msi)
- [macOS (Apple Silicon / M1-M4)](https://nodejs.org/dist/v24.16.0/node-v24.16.0-arm64.pkg)
- [macOS (Intel)](https://nodejs.org/dist/v24.16.0/node-v24.16.0-x64.pkg)
- [Linux](https://nodejs.org/en/download) — pilih versi LTS

**Cara install (Windows):**
1. Buka file `.msi` yang sudah didownload
2. Klik **Next** terus sampai selesai, centang semua opsi default
3. Restart komputer setelah selesai

**Verifikasi berhasil:** Buka terminal / Command Prompt, ketik:
```
node -v
```
Harusnya muncul angka versi, contoh: `v24.16.0`

---

## 2. Download Kode Project

Jika sudah ada folder project-nya, lewati langkah ini.

Jika belum, download dan extract folder `SIUW` ke lokasi yang mudah diakses, misalnya `C:\Projects\SIUW` (Windows) atau `~/Projects/SIUW` (Mac/Linux).

---

## 3. Setup Google Sheet

Google Sheet digunakan sebagai database operasional (data warga, pembayaran, dan rekap).

### 3.1 Buat Google Sheet baru

1. Buka [Google Sheets](https://sheets.google.com)
2. Klik **+ Blank** untuk membuat sheet baru
3. Beri nama sheet, misalnya: `SIUW Data`
4. Lihat URL di browser, formatnya seperti ini:
   ```
   https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/edit
   ```
5. Salin bagian `XXXXXXX...` di tengah URL tersebut — itulah **Sheet ID** Anda. Simpan, akan dipakai nanti.

> Tab-tab di dalam sheet (`Warga Info`, `Payments`, `Payment Summary`) akan **dibuat otomatis** oleh sistem saat pertama kali dijalankan. Anda tidak perlu membuat apapun di dalam sheet.

---

## 4. Setup Google Cloud (Service Account)

Service Account adalah "akun robot" yang dipakai aplikasi untuk mengakses Google Sheet Anda secara otomatis.

### 4.1 Buka Google Cloud Console

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Login dengan akun Google yang sama dengan pemilik Sheet
3. Di bagian atas, klik dropdown project lalu klik **New Project**
4. Beri nama project, misalnya `SIUW`, klik **Create**
5. Pastikan project baru sudah terpilih di dropdown atas

### 4.2 Aktifkan Google Sheets API

1. Di menu kiri, klik **APIs & Services** → **Library**
2. Di kolom pencarian, ketik `Google Sheets API`
3. Klik hasilnya, lalu klik **Enable**

### 4.3 Buat Service Account

1. Di menu kiri, klik **APIs & Services** → **Credentials**
2. Klik **+ Create Credentials** → pilih **Service account**
3. Isi nama, misalnya `siuw-bot`, klik **Create and Continue**
4. Pada bagian **Role**, pilih **Editor**, klik **Continue** lalu **Done**

### 4.4 Download JSON Key

1. Di halaman Credentials, klik nama service account yang baru dibuat
2. Klik tab **Keys**
3. Klik **Add Key** → **Create new key** → pilih **JSON** → **Create**
4. File JSON akan terdownload otomatis. Simpan baik-baik, file ini berisi kredensial sensitif.

### 4.5 Buka file JSON tersebut

Buka file JSON dengan Notepad atau text editor. Cari dua bagian ini:

```json
{
  "client_email": "siuw-bot@your-project.iam.gserviceaccount.com",
  "private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n"
}
```

Salin nilai `client_email` dan `private_key`. Keduanya akan dipakai di file `.env` nanti.

### 4.6 Share Google Sheet ke Service Account

1. Buka kembali Google Sheet yang tadi dibuat
2. Klik tombol **Share** (kanan atas)
3. Paste `client_email` dari langkah di atas ke kolom "Add people"
4. Pastikan permission-nya **Editor**
5. Klik **Send** (abaikan pesan "invite" jika muncul, klik Share anyway)

---

## 5. Setup Cloudinary

Cloudinary digunakan untuk menyimpan foto bukti pembayaran.

1. Buka [cloudinary.com](https://cloudinary.com) dan daftar akun gratis
2. Setelah login, klik ikon **Settings** (roda gigi) di pojok kiri bawah sidebar
3. Pilih menu **API Keys**
   - Atau akses langsung: [console.cloudinary.com/app/settings/api-keys](https://console.cloudinary.com/app/settings/api-keys)
4. Di halaman tersebut, salin tiga nilai ini:
   - `Cloud Name` — tertera di bagian atas halaman
   - `API Key` — angka panjang
   - `API Secret` — klik ikon mata untuk menampilkannya

> **Catatan:** Dashboard utama Cloudinary hanya menampilkan Cloud Name saja. API Key dan API Secret hanya tersedia di halaman **Settings → API Keys**.

---

## 6. Konfigurasi File .env

File `.env` adalah file konfigurasi rahasia yang menyimpan semua kredensial.

1. Masuk ke folder `be` di dalam project
2. Cari file `.env.example`, **duplikat** file tersebut, dan **rename** duplikatnya menjadi `.env`
3. Buka file `.env` dengan Notepad atau text editor
4. Isi semua bagian yang kosong:

```env
# Server
PORT=3001
FRONTEND_URL=http://localhost:5173

# JWT — ganti dengan teks acak panjang, bebas apa saja
JWT_SECRET=isi_teks_acak_minimal_32_karakter_contoh_abc123xyz789

# Google Sheets
GOOGLE_SHEET_ID=paste_sheet_id_dari_langkah_3.1
GOOGLE_SERVICE_ACCOUNT_EMAIL=paste_client_email_dari_json_key
GOOGLE_PRIVATE_KEY="paste_private_key_dari_json_key_beserta_tanda_petiknya"

# Cloudinary
CLOUDINARY_CLOUD_NAME=paste_cloud_name
CLOUDINARY_API_KEY=paste_api_key
CLOUDINARY_API_SECRET=paste_api_secret

# Akun admin pertama
ADMIN_EMAIL=admin@siuw.local
ADMIN_PASSWORD=ganti_dengan_password_aman
```

> **Penting untuk `GOOGLE_PRIVATE_KEY`:** Pastikan nilai private key diapit tanda kutip ganda `"..."` dan tuliskan persis seperti yang ada di file JSON, termasuk bagian `\n`-nya. Jangan hapus atau ubah apapun.

---

## 7. Jalankan Backend

Buka terminal / Command Prompt, lalu jalankan perintah berikut **satu per satu**:

```bash
# Masuk ke folder backend
cd be

# Install semua dependensi (hanya perlu dilakukan sekali)
npm install

# Buat akun admin pertama (hanya perlu dilakukan sekali)
npm run seed

# Jalankan server backend
npm run dev
```

Jika berhasil, terminal akan menampilkan:
```
SIUW backend running on port 3001
```

> Biarkan terminal ini tetap terbuka. Jangan ditutup selama aplikasi digunakan.

---

## 8. Jalankan Frontend

Buka terminal / Command Prompt **baru** (jangan tutup yang lama), lalu:

```bash
# Masuk ke folder frontend
cd fe

# Install semua dependensi (hanya perlu dilakukan sekali)
npm install

# Jalankan aplikasi frontend
npm run dev
```

Jika berhasil, terminal akan menampilkan:
```
Local: http://localhost:5173/
```

Buka browser dan akses: **http://localhost:5173**

---

## 9. Login Pertama Kali

### Admin

- Pilih tab **Admin** di halaman login
- Email: sesuai `ADMIN_EMAIL` di file `.env` (default: `admin@siuw.local`)
- Password: sesuai `ADMIN_PASSWORD` di file `.env`

### Warga

- Warga hanya bisa login setelah admin menambahkan akunnya terlebih dahulu
- Admin membuat akun warga lewat menu **Data Warga** → **Tambah Warga**
- Warga login menggunakan **nomor telepon** + password yang ditetapkan admin

---

## Catatan Tambahan

### Google Sheets — Tab Otomatis

Saat backend pertama kali berjalan dan terhubung ke Google Sheet, tiga tab berikut dibuat otomatis:

| Tab | Isi |
|-----|-----|
| Warga Info | Data profil warga |
| Payments | Riwayat semua pembayaran |
| Payment Summary | Rekap status per warga per bulan |

Anda tidak perlu mengisi atau mengubah apapun di sheet tersebut secara manual.

### Menghentikan Aplikasi

Tekan `Ctrl + C` di masing-masing terminal (backend dan frontend) untuk menghentikan server.

### Menjalankan Ulang

Cukup ulangi langkah 7 dan 8 tanpa perlu `npm install` atau `npm run seed` lagi.

---

## Ringkasan API Endpoints

| Method | Path | Akses | Fungsi |
|--------|------|-------|--------|
| POST | `/api/auth/login` | Semua | Login |
| GET | `/api/warga` | Admin | Daftar warga |
| POST | `/api/warga` | Admin | Tambah warga |
| PUT | `/api/warga/:id` | Admin | Edit warga |
| DELETE | `/api/warga/:id` | Admin | Hapus warga |
| GET | `/api/payments` | Login | Riwayat pembayaran |
| POST | `/api/payments` | Warga | Upload bukti bayar |
| GET | `/api/payments/summary` | Admin | Ringkasan & total |
| GET | `/api/payments/pending` | Admin | Antrian persetujuan |
| PUT | `/api/payments/:id/status` | Admin | Approve / Reject |
| POST | `/api/payments/manual` | Admin | Override status manual |
