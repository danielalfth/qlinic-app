# Qlinic — Clinic Management System

Aplikasi manajemen klinik berbasis web yang memungkinkan pasien mendaftar antrean, dokter mengelola pasien dan rekam medis, serta admin mengawasi seluruh operasional klinik secara real-time.

---

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Arsitektur Proyek](#arsitektur-proyek)
- [Struktur Database](#struktur-database)
- [API Endpoints](#api-endpoints)
- [Autentikasi & Otorisasi](#autentikasi--otorisasi)
- [Struktur Folder](#struktur-folder)
- [Instalasi & Menjalankan Proyek](#instalasi--menjalankan-proyek)
- [Deployment](#deployment)
- [Akun Default (Seed)](#akun-default-seed)

---

## Gambaran Umum

Qlinic adalah sistem manajemen klinik full-stack yang dibangun dengan React (frontend) dan Express.js (backend), menggunakan PostgreSQL sebagai database. Sistem ini mendukung tiga peran pengguna: **Pasien**, **Dokter**, dan **Admin**, masing-masing dengan dashboard dan akses fitur yang berbeda.

---

## Fitur

### Pasien
- Melihat jadwal dokter yang tersedia (hari ini & mingguan)
- Mendaftar antrean secara mandiri *(via admin)*
- Memantau status antrean secara real-time
- Melihat riwayat rekam medis pribadi

### Dokter
- Melihat jadwal praktik mingguan
- Melihat daftar pasien yang sedang antre hari ini
- Mengisi rekam medis pasien (pemeriksaan fisik, diagnosis, resep)
- Mengubah status antrean pasien (Diperiksa → Selesai)

### Admin
- Mendaftarkan pasien ke antrean dokter tertentu
- Mencari pasien berdasarkan nama atau nomor telepon
- Mengelola status antrean (Menunggu, Diperiksa, Dilewati, Dibatalkan)
- Melihat seluruh rekam medis pasien
- Memantau jadwal dan kuota dokter

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18, React Router DOM v6, Axios |
| Backend | Node.js, Express.js 4 |
| Database | PostgreSQL (via `pg` driver) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Build Tool | Vite 6 |
| Dev Tools | Nodemon, Concurrently |
| Deployment | Vercel (frontend + serverless API) |

---

## Arsitektur Proyek

Proyek ini menggunakan arsitektur **monorepo** dengan dua bagian utama:

```
qlinic-app/
├── src/          → React frontend (Vite)
├── server/       → Express.js backend
└── api/          → Vercel serverless entry point
```

Pada mode development, Vite berjalan di port `5173` dan mem-proxy semua request `/api/*` ke Express di port `5000`. Pada production (Vercel), frontend di-build menjadi static files dan backend berjalan sebagai serverless function.

---

## Struktur Database

### ENUM Types
- `user_role`: `pasien`, `dokter`, `admin`
- `gender_type`: `L`, `P`
- `queue_status`: `Menunggu`, `Diperiksa`, `Selesai`, `Dilewati`, `Dibatalkan`

### Tabel

#### `accounts`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | ID unik akun |
| email | VARCHAR(100) UNIQUE | Email (opsional) |
| phone_number | VARCHAR(15) UNIQUE NOT NULL | Nomor telepon (wajib) |
| password | VARCHAR(255) | Password ter-hash (bcrypt) |
| role | user_role | Peran pengguna |
| created_at | TIMESTAMP | Waktu registrasi |

#### `patient_details`
| Kolom | Tipe | Keterangan |
|---|---|---|
| account_id | INTEGER PK FK | Referensi ke `accounts` |
| full_name | VARCHAR(100) | Nama lengkap |
| gender | gender_type | Jenis kelamin |
| age | INTEGER | Usia |

#### `doctor_details`
| Kolom | Tipe | Keterangan |
|---|---|---|
| account_id | INTEGER PK FK | Referensi ke `accounts` |
| full_name | VARCHAR(100) | Nama lengkap |
| doctor_code | CHAR(1) UNIQUE | Kode dokter (misal: D, Z, A, M) |
| specialization | VARCHAR(50) | Spesialisasi (default: Dokter Umum) |
| photo_url | VARCHAR(255) | URL foto profil |

#### `admin_details`
| Kolom | Tipe | Keterangan |
|---|---|---|
| account_id | INTEGER PK FK | Referensi ke `accounts` |
| full_name | VARCHAR(100) | Nama lengkap |

#### `rooms`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | ID ruangan |
| room_name | VARCHAR(50) | Nama ruangan |

#### `schedules`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | ID jadwal |
| doctor_id | INTEGER FK | Referensi ke `doctor_details` |
| room_id | INTEGER FK | Referensi ke `rooms` |
| shift | INTEGER (1 atau 2) | Shift praktik |
| day_of_week | VARCHAR(10) | Hari (Senin–Jumat) |
| max_quota | INTEGER | Kuota maksimal pasien (default: 20) |

#### `queues`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | ID antrean |
| patient_id | INTEGER FK | Referensi ke `patient_details` |
| schedule_id | INTEGER FK | Referensi ke `schedules` |
| queue_number | VARCHAR(10) | Nomor antrean (misal: D-01) |
| status | queue_status | Status antrean |
| complaint | TEXT | Keluhan pasien |
| queue_date | DATE | Tanggal antrean |
| created_at | TIMESTAMP | Waktu pendaftaran |

#### `medical_records`
| Kolom | Tipe | Keterangan |
|---|---|---|
| id | SERIAL PK | ID rekam medis |
| queue_id | INTEGER UNIQUE FK | Referensi ke `queues` (1 rekam per kunjungan) |
| physical_exam | TEXT | Hasil pemeriksaan fisik |
| diagnosis | TEXT | Diagnosis dokter |
| prescription | TEXT | Resep obat |
| created_at | TIMESTAMP | Waktu pencatatan |

### Alur Nomor Antrean
Nomor antrean di-generate otomatis dengan format `{KodeDokter}-{XX}` (contoh: `D-01`, `Z-03`). Nomor direset setiap hari dan dihitung lintas shift untuk dokter yang sama.

### Alur Status Antrean
Transisi status yang diizinkan:
```
Menunggu → Diperiksa | Dilewati | Dibatalkan
Diperiksa → Selesai
Dilewati → Menunggu
Selesai → (final)
Dibatalkan → (final)
```

---

## API Endpoints

### Auth — `/api/auth`
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| POST | `/signup` | Public | Registrasi akun pasien baru |
| POST | `/login` | Public | Login dengan email/no. telepon + password |
| GET | `/me` | Authenticated | Ambil profil pengguna saat ini |

### Schedules — `/api/schedules`
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/` | Authenticated | Semua jadwal dokter |
| GET | `/today` | Authenticated | Jadwal hari ini + sisa kuota |
| GET | `/public` | Public | Jadwal untuk landing page (tanpa auth) |

### Queues — `/api/queues`
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/` | Authenticated | Daftar antrean (difilter per role) |
| GET | `/patients/search` | Admin | Cari pasien berdasarkan nama/telepon |
| POST | `/` | Admin | Daftarkan pasien ke antrean |
| PATCH | `/:id/status` | Admin, Dokter | Update status antrean |

### Medical Records — `/api/medical-records`
| Method | Endpoint | Akses | Deskripsi |
|---|---|---|---|
| GET | `/` | Authenticated | Ambil rekam medis (difilter per role) |
| POST | `/` | Dokter | Buat rekam medis baru |

### Health Check
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/health` | Cek status server |

---

## Autentikasi & Otorisasi

### Autentikasi (JWT)
Semua endpoint yang dilindungi memerlukan header:
```
Authorization: Bearer <token>
```
Token JWT berlaku selama **24 jam** dan menyimpan payload `{ id, role, fullName }`. Jika token kedaluwarsa atau tidak valid, server mengembalikan `401` dan frontend otomatis mengarahkan ke halaman login.

### Role-Based Access Control (RBAC)
Tiga peran dengan akses berbeda:

| Peran | Akses |
|---|---|
| `pasien` | Lihat jadwal, lihat antrean sendiri, lihat rekam medis sendiri |
| `dokter` | Lihat jadwal, lihat daftar pasien, isi & lihat rekam medis pasiennya |
| `admin` | Kelola antrean, cari pasien, update status, lihat semua rekam medis |

Di frontend, route dilindungi oleh komponen `ProtectedRoute` yang memverifikasi role sebelum merender halaman. Di backend, middleware `rbac(...roles)` memblokir akses jika role tidak sesuai.

---

## Struktur Folder

```
qlinic-app/
├── api/
│   └── index.js              # Entry point Vercel serverless
├── public/
│   └── images/
│       ├── logo.png
│       └── doctors/          # Foto profil dokter
├── server/
│   ├── config/
│   │   └── db.js             # Koneksi PostgreSQL (Pool)
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication middleware
│   │   └── rbac.js           # Role-based access control middleware
│   ├── routes/
│   │   ├── auth.js           # Endpoint autentikasi
│   │   ├── schedules.js      # Endpoint jadwal dokter
│   │   ├── queues.js         # Endpoint manajemen antrean
│   │   └── medical-records.js# Endpoint rekam medis
│   ├── seeds/
│   │   └── seed.js           # Script inisialisasi database
│   ├── utils/
│   │   └── queueHelper.js    # Helper: generate nomor antrean & cek kuota
│   └── index.js              # Express app entry point
├── src/
│   ├── components/
│   │   └── Layout/
│   │       └── DashboardLayout.jsx  # Layout utama dashboard
│   ├── contexts/
│   │   └── AuthContext.jsx   # Global auth state (React Context)
│   ├── hooks/
│   │   └── useAutoRefresh.js # Custom hook untuk polling data
│   ├── pages/
│   │   ├── LandingPage.jsx   # Halaman publik
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignUpPage.jsx
│   │   ├── patient/
│   │   │   ├── PatientSchedule.jsx
│   │   │   ├── PatientQueue.jsx
│   │   │   └── PatientMedicalRecords.jsx
│   │   ├── doctor/
│   │   │   ├── DoctorSchedule.jsx
│   │   │   ├── DoctorPatientList.jsx
│   │   │   └── DoctorMedicalRecords.jsx
│   │   └── admin/
│   │       ├── AdminSchedule.jsx
│   │       ├── AdminQueueManagement.jsx
│   │       └── AdminMedicalRecords.jsx
│   ├── services/
│   │   └── api.js            # Axios instance + interceptors
│   ├── App.jsx               # Root component + routing
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles
├── .env                      # Environment variables (tidak di-commit)
├── .gitignore
├── index.html                # HTML template Vite
├── package.json
├── vercel.json               # Konfigurasi deployment Vercel
└── vite.config.js            # Konfigurasi Vite + proxy dev
```

---

## Instalasi & Menjalankan Proyek

### Prasyarat
- Node.js >= 18
- PostgreSQL database (lokal atau cloud, misal: Neon, Supabase)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd qlinic-app
npm install
```

### 2. Konfigurasi Environment
Buat file `.env` di root proyek:
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

### 3. Inisialisasi Database
Jalankan script seed untuk membuat tabel dan mengisi data awal:
```bash
npm run seed
```

### 4. Jalankan Development Server
```bash
npm run dev
```
Perintah ini menjalankan frontend (Vite, port `5173`) dan backend (Express, port `5000`) secara bersamaan menggunakan `concurrently`.

### 5. Build untuk Production
```bash
npm run build
```

---

## Deployment

Proyek ini dikonfigurasi untuk deploy ke **Vercel**:

- Frontend di-build sebagai static files (`dist/`)
- Backend berjalan sebagai Vercel Serverless Function melalui `api/index.js`
- Semua request `/api/*` di-rewrite ke serverless function
- Semua route lainnya di-rewrite ke `index.html` (SPA routing)

Pastikan environment variable `DATABASE_URL`, `JWT_SECRET`, dan `VERCEL=1` sudah dikonfigurasi di dashboard Vercel.

---

## Akun Default (Seed)

Setelah menjalankan `npm run seed`, akun berikut tersedia:

| Peran | Email | Password |
|---|---|---|
| Admin | admin@admin.com | password |
| Dokter | daniel@doctor.com | password |
| Dokter | zaki@doctor.com | password |
| Dokter | amirah@doctor.com | password |
| Dokter | manda@doctor.com | password |

Untuk akun pasien, lakukan registrasi melalui halaman Sign Up.

---

## Jadwal Dokter (Default)

Setiap hari Senin–Jumat, tersedia 2 shift dengan 2 dokter per shift:

| Shift | Ruang 1 | Ruang 2 |
|---|---|---|
| Shift 1 | Dr. Daniel (D) | Dr. Zaki (Z) |
| Shift 2 | Dr. Amirah (A) | Dr. Manda (M) |

Kuota maksimal per jadwal: **20 pasien**.
