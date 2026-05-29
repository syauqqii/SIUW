# SIUW — Sistem Informasi Iuran Warga

Panduan setup lengkap dari nol sampai live di internet — untuk pemula.

---

## Gambaran Umum

Aplikasi ini terdiri dari dua bagian:
- **Backend** — server API (folder `be/`)
- **Frontend** — tampilan aplikasi (folder `fe/`)

Keduanya akan di-deploy gratis di **Vercel**. Data disimpan di **Google Sheets**. Foto bukti bayar disimpan di **Cloudinary**.

```
Pengguna (HP/Browser)
       ↓
  Frontend — Vercel  (tampilan)
       ↓
  Backend — Vercel   (logika & API)
       ↓           ↓
 Google Sheets   Cloudinary
  (database)    (foto bukti)
```

---

## Daftar Isi

**Bagian 1 — Persiapan (lakukan sekali)**
1. [Salin kode ke GitHub kamu (private)](#1-salin-kode-ke-github-kamu-private)
2. [Buat Google Sheet](#2-buat-google-sheet)
3. [Setup Google Cloud — Service Account](#3-setup-google-cloud--service-account)
4. [Setup Cloudinary](#4-setup-cloudinary)
5. [Siapkan kredensial admin](#5-siapkan-kredensial-admin)

**Bagian 2 — Deploy ke Vercel**

6. [Deploy Backend ke Vercel](#6-deploy-backend-ke-vercel)
7. [Deploy Frontend ke Vercel](#7-deploy-frontend-ke-vercel)
8. [Sambungkan backend ↔ frontend](#8-sambungkan-backend--frontend)
9. [Verifikasi — pastikan semua berjalan](#9-verifikasi--pastikan-semua-berjalan)

**Bagian 3 — Penggunaan**

10. [Login pertama & tambah warga](#10-login-pertama--tambah-warga)
11. [Kelola admin](#11-kelola-admin)
12. [Update kode — redeploy otomatis](#12-update-kode--redeploy-otomatis)

**Bagian 4 — Referensi**
- [Troubleshooting](#troubleshooting)
- [Jalankan lokal (opsional)](#jalankan-lokal-opsional)
- [Ringkasan API](#ringkasan-api-endpoints)

---

# Bagian 1 — Persiapan

---

## 1. Salin kode ke GitHub kamu (private)

Kamu perlu punya repo GitHub **private** sendiri agar bisa dihubungkan ke Vercel. GitHub tidak mengizinkan fork langsung menjadi private, jadi caranya adalah **import**.

### 1.1 Daftar / Login GitHub

Buka [github.com](https://github.com) dan login atau daftar akun baru.

### 1.2 Import repo

1. Buka halaman import: **[github.com/new/import](https://github.com/new/import)**
2. Di kolom **"Your old repository's clone URL"**, isi:
   ```
   https://github.com/syauqqii/SIUW.git
   ```
3. Di bagian **Repository Name**, beri nama sesukamu, contoh: `siuw`
4. Pilih visibility: **Private** ← penting, agar env vars tidak bocor
5. Klik **Begin Import**
6. Tunggu beberapa detik — selesai. Kamu sekarang punya repo private di `github.com/USERNAMEKAMU/siuw`

---

## 2. Buat Google Sheet

Google Sheet adalah database aplikasi ini — menyimpan data warga, pembayaran, dan rekap.

1. Buka [sheets.google.com](https://sheets.google.com) → klik **+ Blank**
2. Beri nama, contoh: `SIUW Data`
3. Lihat URL di browser:
   ```
   https://docs.google.com/spreadsheets/d/XXXXXXXXXXXXXXXXXXXXXXXXXXXXX/edit
   ```
4. Salin bagian `XXXXX...` di tengah — itulah **Sheet ID**. Simpan di Notepad.

> Isi sheet (tab `Warga Info`, `Payments`, `Payment Summary`) akan **dibuat otomatis** saat backend pertama kali dijalankan.

---

## 3. Setup Google Cloud — Service Account

Service Account adalah "akun robot" yang dipakai aplikasi untuk baca/tulis Google Sheet.

### 3.1 Buat project Google Cloud

1. Buka [console.cloud.google.com](https://console.cloud.google.com) — login dengan akun Google **yang sama** dengan pemilik Sheet
2. Klik dropdown nama project di atas → **New Project**
3. Nama project: `SIUW` → **Create**
4. Pastikan project `SIUW` sudah terpilih di dropdown atas

### 3.2 Aktifkan Google Sheets API

1. Menu kiri → **APIs & Services** → **Library**
2. Ketik `Google Sheets API` di kolom pencarian → klik hasil → **Enable**

### 3.3 Buat Service Account

1. Menu kiri → **APIs & Services** → **Credentials**
2. Klik **+ Create Credentials** → **Service account**
3. Nama: `siuw-bot` → klik **Create and Continue**
4. Role: pilih **Editor** → **Continue** → **Done**

### 3.4 Download file JSON key

1. Di halaman Credentials, klik nama `siuw-bot` yang baru dibuat
2. Tab **Keys** → **Add Key** → **Create new key** → pilih **JSON** → **Create**
3. File JSON otomatis terdownload — **simpan baik-baik**, jangan sampai hilang

### 3.5 Catat dua nilai dari file JSON

Buka file JSON dengan Notepad, cari dua baris ini:

```json
"client_email": "siuw-bot@namaproject.iam.gserviceaccount.com",
"private_key": "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n",
```

Salin nilai `client_email` dan `private_key` — akan dipakai nanti.

### 3.6 Izinkan Service Account mengakses Sheet

1. Buka Google Sheet yang tadi dibuat
2. Klik tombol **Share** (kanan atas)
3. Tempel `client_email` di kolom "Add people"
4. Pastikan role-nya **Editor** → klik **Send**

---

## 4. Setup Cloudinary

Cloudinary menyimpan foto bukti pembayaran warga.

1. Daftar gratis di [cloudinary.com](https://cloudinary.com)
2. Setelah login → klik ikon **Settings** (roda gigi kiri bawah) → **API Keys**
3. Salin tiga nilai berikut — simpan di Notepad:
   - **Cloud Name** — tertera di bagian atas halaman
   - **API Key** — deretan angka
   - **API Secret** — klik ikon mata untuk tampilkan

---

## 5. Siapkan kredensial admin

Admin tidak disimpan di database — melainkan sebagai environment variable berisi password yang sudah di-hash. Kamu perlu mengenerate hash ini sekali di komputer lokal.

### 5.1 Install Node.js (jika belum ada)

Download dan install sesuai OS:

| OS | Link |
|----|------|
| Windows 64-bit | [node-v24.16.0-x64.msi](https://nodejs.org/dist/v24.16.0/node-v24.16.0-x64.msi) |
| macOS Apple Silicon (M1–M4) | [node-v24.16.0-arm64.pkg](https://nodejs.org/dist/v24.16.0/node-v24.16.0-arm64.pkg) |
| macOS Intel | [node-v24.16.0-x64.pkg](https://nodejs.org/dist/v24.16.0/node-v24.16.0-x64.pkg) |

Verifikasi: buka terminal, ketik `node -v` — harusnya muncul angka versi.

### 5.2 Clone repo dan install

```bash
git clone https://github.com/USERNAMEKAMU/siuw.git
cd siuw/be
npm install
```

### 5.3 Generate ADMIN_CREDS

Jalankan perintah ini di terminal (masih di dalam folder `be`):

```bash
node -e "
const b = require('bcryptjs');
b.hash('PASSWORD_KAMU', 10).then(hash => {
  console.log(JSON.stringify([{ email: 'EMAIL_KAMU', password_hash: hash }]));
});
"
```

Ganti `PASSWORD_KAMU` dan `EMAIL_KAMU` (contoh: `admin@siuw.local` dan `password123`).

**Contoh output yang muncul:**
```
[{"email":"admin@siuw.local","password_hash":"$2a$10$abcXYZ..."}]
```

**Salin seluruh teks output tersebut** — ini adalah nilai `ADMIN_CREDS` yang akan dipakai di Vercel.

> Untuk lebih dari satu admin, jalankan perintah untuk setiap admin, lalu gabungkan ke dalam satu array:
> ```json
> [
>   {"email":"admin1@siuw.local","password_hash":"$2a$10$..."},
>   {"email":"admin2@siuw.local","password_hash":"$2a$10$..."}
> ]
> ```

---

# Bagian 2 — Deploy ke Vercel

---

## 6. Deploy Backend ke Vercel

### 6.1 Daftar Vercel

Buka [vercel.com](https://vercel.com) → **Sign Up** → pilih **Continue with GitHub** → izinkan akses.

### 6.2 Import project backend

1. Di dashboard Vercel → klik **Add New...** → **Project**
2. Cari repo `siuw` di daftar → klik **Import**
3. Di halaman konfigurasi:
   - Klik **Edit** di sebelah **Root Directory** → ketik `be` → klik **Continue**
   - **Framework Preset** → pastikan terpilih **Other**
   - Build & Output Settings → biarkan kosong

### 6.3 Isi Environment Variables

Scroll ke bawah ke bagian **Environment Variables**. Tambahkan satu per satu:

| Name | Value |
|------|-------|
| `FRONTEND_URL` | `https://siuw-fe.vercel.app` *(isi sementara, akan diperbarui di langkah 8)* |
| `JWT_SECRET` | Teks acak panjang, contoh: `xK9mP2nQ8vL4wR7jA1cT5hB0dF3sE6` |
| `GOOGLE_SHEET_ID` | Sheet ID dari langkah 2 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Nilai `client_email` dari file JSON |
| `GOOGLE_PRIVATE_KEY` | Nilai `private_key` dari file JSON *(lihat catatan di bawah)* |
| `CLOUDINARY_CLOUD_NAME` | Cloud Name dari Cloudinary |
| `CLOUDINARY_API_KEY` | API Key dari Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret dari Cloudinary |
| `ADMIN_CREDS` | Output JSON dari langkah 5.3 |

> **⚠️ Penting — cara isi `GOOGLE_PRIVATE_KEY`:**
> 1. Buka file JSON dari Google Cloud
> 2. Salin nilai `private_key` mulai dari `-----BEGIN RSA PRIVATE KEY-----` sampai akhir `-----END RSA PRIVATE KEY-----\n`
> 3. **Tempel langsung** di kolom value Vercel — **tanpa** tanda kutip di awal/akhir
> 4. Karakter `\n` di tengah key harus tetap ada sebagai teks `\n`, bukan baris baru
>
> Contoh yang **benar** di kolom value Vercel:
> ```
> -----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----\n
> ```

### 6.4 Deploy

Klik **Deploy** — tunggu 1-2 menit hingga muncul konfeti 🎉

**Catat URL backend** yang muncul, contoh: `https://siuw-be.vercel.app`

---

## 7. Deploy Frontend ke Vercel

### 7.1 Buat project baru

1. Di dashboard Vercel → **Add New...** → **Project**
2. Cari repo `siuw` yang sama → klik **Import**
3. Di halaman konfigurasi:
   - Klik **Edit** di sebelah **Root Directory** → ketik `fe` → klik **Continue**
   - **Framework Preset** → pilih **Vite** (biasanya terdeteksi otomatis)

### 7.2 Isi Environment Variables

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://siuw-be.vercel.app/api` *(URL backend dari langkah 6 + `/api` di akhir)* |

### 7.3 Deploy

Klik **Deploy** — tunggu hingga selesai.

**Catat URL frontend** yang muncul, contoh: `https://siuw-fe.vercel.app`

---

## 8. Sambungkan backend ↔ frontend

Setelah URL frontend diketahui, update konfigurasi backend agar CORS-nya benar.

1. Di dashboard Vercel, buka project **backend** (`siuw-be`)
2. Tab **Settings** → **Environment Variables**
3. Klik variabel `FRONTEND_URL` → edit nilainya menjadi URL frontend yang sebenarnya
   - Contoh: `https://siuw-fe.vercel.app`
4. Buka tab **Deployments** → klik titik tiga `...` di deployment terbaru → **Redeploy** → **Redeploy** lagi

---

## 9. Verifikasi — pastikan semua berjalan

### Cek backend aktif

Buka URL ini di browser (ganti dengan URL backend kamu):
```
https://siuw-be.vercel.app/api/health
```

Harus muncul:
```json
{"status":"ok"}
```

Jika muncul ini → backend berjalan normal ✅

### Cek login admin

1. Buka URL frontend, contoh: `https://siuw-fe.vercel.app`
2. Pilih tab **Admin**
3. Masukkan email dan password yang dipakai saat generate `ADMIN_CREDS` di langkah 5.3
4. Jika berhasil masuk ke dashboard admin → **semua berjalan dengan benar** ✅

### Cek tab Google Sheet dibuat otomatis

Buka Google Sheet kamu — setelah login admin, backend akan otomatis membuat tiga tab:
- `Warga Info`
- `Payments`
- `Payment Summary`

---

# Bagian 3 — Penggunaan

---

## 10. Login pertama & tambah warga

### Login Admin
- Pilih tab **Admin** di halaman login
- Email & password sesuai yang digunakan di langkah 5.3

### Tambah Data Warga
1. Login sebagai admin → menu **Data Warga** → **Tambah Warga**
2. Isi: Nama lengkap, Nomor telepon (format `628xxxxxxxxxx`), Nomor rumah
3. Simpan

### Login Warga
- Pilih tab **Warga** di halaman login
- Masukkan **nomor telepon** yang sudah didaftarkan admin — tanpa password

---

## 11. Kelola Admin

### Tambah admin baru (untuk production di Vercel)

1. Generate hash password baru di terminal lokal:
   ```bash
   cd siuw/be
   node -e "require('bcryptjs').hash('passwordbaru', 10).then(h => console.log(h))"
   ```
2. Salin hash yang dihasilkan

3. Di Vercel → project backend → **Settings** → **Environment Variables**
4. Edit `ADMIN_CREDS` — tambahkan entri baru ke array:
   ```json
   [
     {"email":"admin1@siuw.local","password_hash":"$2a$10$...hash lama..."},
     {"email":"admin2@siuw.local","password_hash":"$2a$10$...hash baru..."}
   ]
   ```
5. Tab **Deployments** → **Redeploy**

### Hapus admin

Edit `ADMIN_CREDS` di Vercel — hapus entri yang tidak diinginkan dari array → Redeploy.

---

## 12. Update kode — redeploy otomatis

Setiap kali kamu **push commit baru** ke branch `main` di GitHub, Vercel akan **otomatis redeploy** backend dan frontend tanpa perlu melakukan apapun. Tidak ada langkah manual.

---

# Troubleshooting

### ❌ Deploy gagal di Vercel

Buka tab **Deployments** di project Vercel → klik deployment yang gagal → lihat tab **Logs**. Error paling umum:

| Error di log | Penyebab | Solusi |
|---|---|---|
| `Cannot read private key` | `GOOGLE_PRIVATE_KEY` salah | Salin ulang dari file JSON, pastikan tidak ada kutip di awal/akhir |
| `invalid_grant` | Service account tidak punya akses ke Sheet | Share Sheet ke `client_email` dengan role Editor |
| `Sheet not found` | `GOOGLE_SHEET_ID` salah | Cek ulang ID dari URL Sheet |
| `Function timeout` | Request terlalu lambat | Coba reload — cold start biasanya 3-5 detik |

### ❌ Login admin gagal "Invalid credentials"

- Pastikan email dan password yang diketik **sama persis** dengan yang dipakai saat generate `ADMIN_CREDS`
- Cek `ADMIN_CREDS` di Vercel — harus berupa JSON array yang valid, bukan string biasa
- Cek tidak ada spasi tersembunyi di awal/akhir nilai env var

### ❌ Login warga gagal

- Pastikan nomor telepon diisi dalam format `628xxxxxxxxxx` saat admin menambahkan warga
- Ketik nomor yang sama persis saat login

### ❌ "No values in the header row"

Tab Google Sheet sudah ada tapi baris pertama kosong. Solusi: cukup **restart** backend (Vercel Redeploy) — sistem akan otomatis mengisi header yang kosong.

### ❌ Upload foto gagal

- Periksa `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_CLOUD_NAME`
- Ukuran foto di atas 4MB bisa gagal — kompres foto lebih kecil sebelum upload

### ❌ Frontend tidak bisa connect ke backend (CORS error)

- Pastikan `VITE_API_URL` di frontend sudah menunjuk ke URL backend yang benar (dengan `/api` di akhir)
- Pastikan `FRONTEND_URL` di backend sudah diupdate ke URL frontend yang benar → Redeploy backend

---

# Jalankan Lokal (Opsional)

Untuk development / testing di komputer sendiri sebelum deploy.

### Konfigurasi `.env`

Di folder `be`, duplikat `.env.example` → rename jadi `.env`, isi:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
JWT_SECRET=teks_acak_minimal_32_karakter
GOOGLE_SHEET_ID=sheet_id_kamu
GOOGLE_SERVICE_ACCOUNT_EMAIL=client_email_dari_json
GOOGLE_PRIVATE_KEY="private_key_dari_json_beserta_newline_n"
CLOUDINARY_CLOUD_NAME=cloud_name
CLOUDINARY_API_KEY=api_key
CLOUDINARY_API_SECRET=api_secret
```

### Setup admin lokal

```bash
cd be
npm install
npm run setup-admin add admin@siuw.local passwordkamu
```

### Jalankan

**Terminal 1:**
```bash
cd be && npm run dev
```

**Terminal 2:**
```bash
cd fe && npm install && npm run dev
```

Buka: **http://localhost:5173**

---

## Catatan Teknis

### Struktur Google Sheet

| Tab | Kolom |
|-----|-------|
| `Warga Info` | id, phone, name, house_no, created_at, updated_at |
| `Payments` | id, phone, month, year, amount, image_url, status, created_at, updated_at |
| `Payment Summary` | user_name, house_no, phone, month, year, amount, image_url, status |

---

## Ringkasan API Endpoints

| Method | Path | Akses | Fungsi |
|--------|------|-------|--------|
| POST | `/api/auth/login` | Semua | Login |
| GET | `/api/warga` | Admin | Daftar warga |
| POST | `/api/warga` | Admin | Tambah warga |
| PUT | `/api/warga/:phone` | Admin | Edit warga |
| DELETE | `/api/warga/:phone` | Admin | Hapus warga |
| GET | `/api/payments` | Login | Riwayat pembayaran |
| POST | `/api/payments` | Warga | Upload bukti bayar |
| GET | `/api/payments/summary` | Admin | Ringkasan & total |
| GET | `/api/payments/pending` | Admin | Antrian persetujuan |
| PUT | `/api/payments/:id/status` | Admin | Approve / Reject |
| POST | `/api/payments/manual` | Admin | Override status manual |
