Build a web-based mobile-first app: Sistem Informasi Iuran Warga (SIUW)

Monorepo structure - 1 repo, 2 folders:
be/   > Node.js + Express.js (MVC pattern)
fe/   > React.js + Tailwind CSS

Stack: React.js + Tailwind CSS | Node.js + Express.js | SQLite (auth) + Google Sheets API (google-spreadsheet) (operational data) | Cloudinary (image storage, save URL to Sheets) | JWT auth

Database:
1. SQLite (auth only):
   - users: id, email (nullable), phone (nullable), house_no (nullable), password_hash, role (admin/warga), created_at
   - Admin logs in via email + password, Warga logs in via phone + password
   - Login logic: role=admin > lookup by email | role=warga > lookup by phone

2. Google Sheets (operational data) - 3 tabs:
   - Warga Info: id, user_id, name, house_no, phone, created_at, updated_at
   - Payments: id, user_id, month, year, amount, image_url, status (pending/approved/rejected), created_at, updated_at
   - Payment Summary: user_name, house_no, phone, month, year, amount, image_url, status
     > auto-populated/updated by backend on every payment create or status change
   - Note: handle write operations sequentially to avoid race conditions

Auth: Admin > email + password | Warga > phone + password | JWT stateless

Warga Dashboard: payment status per month, history log, receipt upload form
Admin Dashboard:
- Summary: total collected, total pending, total unpaid
- Pending approval list: approve / reject receipt with image preview
- User management: add, edit, delete warga
- Manual status override: admin can manually set payment status (paid/unpaid) per warga per month
- Auto-refresh every 10s (polling)

Design:
- Low poly geometric aesthetic, premium & minimal
- Mobile-first layout (max-width 480px centered, desktop as secondary)
- Monochrome palette: 3-4 colors only (deep navy, white, light gray, accent gold)
- No emojis, no decorative icons, no mixed colors
- UX-first for elderly users: large font (min 16px), big tap targets (min 48px), high contrast, simple flat navigation, minimal steps per action

Output:
- Monorepo folder structure (be/ and fe/)
- Backend: auth, Sheets CRUD, image upload endpoints
- Frontend: Admin Dashboard + Warga Upload Form components (Tailwind)

Code: clean, modular, production-ready
