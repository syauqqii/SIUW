# SIUW — Setup Guide

## Prasyarat

- Node.js 18+
- Google Cloud project dengan Sheets API enabled
- Cloudinary account

---

## 1. Google Sheets

1. Buat Google Sheet baru, catat **Sheet ID** dari URL-nya.
2. Di [Google Cloud Console](https://console.cloud.google.com/):
   - Enable **Google Sheets API**
   - Buat **Service Account**, download JSON key-nya
   - Salin `client_email` dan `private_key` dari JSON tersebut
3. Share Google Sheet ke email service account (Editor access)

---

## 2. Cloudinary

1. Daftar/login di [Cloudinary](https://cloudinary.com)
2. Salin `cloud_name`, `api_key`, `api_secret` dari dashboard

---

## 3. Backend

```bash
cd be
cp .env.example .env
# Edit .env dengan kredensial Anda

npm install

# Buat admin pertama
npm run seed

# Jalankan server
npm run dev     # development
npm start       # production
```

Server berjalan di `http://localhost:3001`

---

## 4. Frontend

```bash
cd fe
npm install
npm run dev
```

App berjalan di `http://localhost:5173`

---

## API Endpoints

| Method | Path | Role | Keterangan |
|--------|------|------|------------|
| POST | `/api/auth/login` | — | Login admin/warga |
| GET | `/api/warga` | admin | Daftar warga |
| POST | `/api/warga` | admin | Tambah warga |
| PUT | `/api/warga/:id` | admin | Edit warga |
| DELETE | `/api/warga/:id` | admin | Hapus warga |
| GET | `/api/payments` | auth | Riwayat pembayaran |
| POST | `/api/payments` | warga | Upload bukti |
| GET | `/api/payments/summary` | admin | Ringkasan + total |
| GET | `/api/payments/pending` | admin | Daftar menunggu |
| PUT | `/api/payments/:id/status` | admin | Approve/reject |
| POST | `/api/payments/manual` | admin | Override status manual |

---

## Google Sheets — Tab yang Dibuat Otomatis

| Tab | Kolom |
|-----|-------|
| Warga Info | id, user_id, name, house_no, phone, created_at, updated_at |
| Payments | id, user_id, month, year, amount, image_url, status, created_at, updated_at |
| Payment Summary | user_name, house_no, phone, month, year, amount, image_url, status |

Tab dibuat otomatis saat backend pertama kali terhubung ke sheet.
