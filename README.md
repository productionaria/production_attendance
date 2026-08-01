Production Attendance 
Dashboard kehadiran karyawan berbasis Google Apps Script + Google Sheets sebagai backend, dengan frontend yang bisa diakses lewat GitHub Pages maupun langsung sebagai Web App Apps Script.
🔗 Live: https://productionaria.github.io/production_attendance/
---
✨ Fitur
Dashboard — KPI kehadiran (SKD, Izin/PKB, Mangkir, Cuti Tahunan, Attendance Ratio), tren 6 bulan, Top 5 Mangkir, Pengajuan Terbaru.
Input Absensi — input manual harian + Import Excel/CSV untuk data historis massal.
Riwayat Ketidakhadiran — riwayat per karyawan (NRP), timeline, tren bulanan, export Excel.
Laporan — rekap kehadiran per periode & departemen, distribusi, export Excel.
Profil Karyawan — profil individual + ringkasan kehadiran 12 bulan terakhir.
Data Karyawan — CRUD data master karyawan + Import Excel massal.
ATR (Attendance Rate) — perhitungan tingkat kehadiran per bulan/karyawan, export Excel & PDF.
Manajemen User — 🚧 dalam pengembangan (rencana: 2 akun Admin + role User).
---
🏗️ Arsitektur
Aplikasi ini berjalan dalam 2 mode sekaligus, dideteksi otomatis oleh `gsRun()` di `Index.html`:
Mode	Kapan dipakai	Cara komunikasi ke backend
Native Apps Script	Dibuka lewat URL `.../exec`	`google.script.run`
GitHub Pages (standalone)	Dibuka lewat `productionaria.github.io/...`	`fetch()` POST ke Web App `/exec` (lihat `doPost` di `Code.gs`)
```
┌─────────────────────┐        ┌──────────────────────┐        ┌─────────────────┐
│   GitHub Pages       │ fetch  │  Apps Script Web App  │  R/W   │  Google Sheets   │
│   (Index.html)        │ ─────▶ │  (Code.gs / doPost)   │ ─────▶ │  Data_Rekap      │
│                      │        │                        │        │  Data Karyawan   │
└─────────────────────┘        └──────────────────────┘        └─────────────────┘
```
> ⚠️ **Penting:** kode di GitHub **tidak otomatis** masuk ke Apps Script. Setiap perubahan di `Code.gs` (backend) harus disinkronkan manual (lihat [Deployment](#-deployment)). Perubahan di `Index.html` yang murni client-side (tanpa sentuh `Code.gs`) cukup di-push ke GitHub saja — tidak perlu redeploy Apps Script.
---
📁 Struktur Google Sheets
Sheet `Data_Rekap`
Kolom	Keterangan
NO	Nomor urut otomatis, direnumber saat baris dihapus
NRP	Nomor Registrasi Pokok karyawan
NAMA, POSISI, DEPT	Diambil otomatis dari `Data Karyawan` saat input
SHIFT	(opsional)
TANGGAL	Format tampilan `dd/MM/yyyy`
REMARKS	Salah satu: `SKD`, `Izin / PKB`, `Mangkir`, `Cuti Tahunan`
KETERANGAN	Catatan opsional
Sheet `Data Karyawan`
Kolom	Keterangan
NRP	Kunci unik karyawan
Nama Lengkap, Posisi, Departemen	
Email, HP	Opsional
FotoURL	Opsional, fallback ke avatar inisial otomatis
---
🚀 Deployment
1. Setup Google Apps Script
Buka Google Sheet → Extensions → Apps Script
Pastikan ada file `Code.gs` dan `Index.html` (nama file harus persis, case-sensitive)
Deploy → New deployment → Web app
Execute as: `Me`
Who has access: sesuai kebutuhan (`Anyone` kalau ingin diakses tanpa login Google)
Salin URL yang berakhiran `/exec`, tempel ke variabel `WEB_APP_URL` di `Index.html`
2. Update kode setelah ada perbaikan
Kalau pakai clasp:
```bash
  clasp push
  ```
Kalau manual: copy-paste isi `Code.gs` / `Index.html` dari GitHub ke Apps Script editor.
Lalu wajib: Deploy → Manage deployments → Edit (ikon pensil) → Version: New version → Deploy
> Tanpa langkah ini, URL `/exec` tetap menjalankan kode versi lama meski sudah di-push.
3. Update GitHub Pages
Cukup `git push` ke branch yang dipakai GitHub Pages. Propagasi biasanya 30 detik – 2 menit. Kalau tampilan belum berubah setelah itu, coba:
Hard refresh: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
Buka di Incognito/Private window
Cek tab Actions di repo untuk memastikan build Pages sukses
---
⚙️ Konfigurasi Timezone (penting!)
Untuk menghindari tanggal bergeser (mis. input 29/07 tersimpan jadi 28/07), pastikan timezone Apps Script project sama dengan timezone Spreadsheet:
Spreadsheet: File → Settings → Time zone → `(GMT+07:00) Jakarta`
Apps Script: Project Settings (ikon gerigi) → Time zone → `Asia/Jakarta`
---
📋 Format Import Excel
Input Absensi (Data Historis)
NRP	Tanggal	Status	Keterangan
00012345	01/07/2026	SKD	Contoh: demam
Kolom Tanggal: gunakan format `dd/MM/yyyy` atau `dd-MM-yyyy` secara konsisten dalam satu file. Jangan campur dengan format ISO (`yyyy-mm-dd`) di file yang sama.
Kolom Status: salah satu dari `SKD`, `Izin/PKB`, `Mangkir`, `Cuti Tahunan` (beberapa variasi penulisan umum otomatis dinormalisasi).
Data Karyawan
NRP	Nama	Posisi	Departemen	Email	No HP	URL Foto
Template unduhan tersedia di masing-masing modal import pada aplikasi.
---
🩹 Changelog Perbaikan
Fix: judul "Top 5 Mangkir Terbanyak", "Pengajuan Terbaru", dan "Tren Kehadiran" kini otomatis mengikuti bulan aktual saat load, tidak lagi nyangkut di teks default HTML.
Fix: filter dropdown "Periode" di header Dashboard tidak lagi ikut mengubah judul 3 komponen di atas (karena datanya memang selalu bulan berjalan, terlepas dari filter Periode).
Fix: performa "Simpan Kehadiran" & Import Excel — `addRekap()` di `Code.gs` tidak lagi memanggil renumber kolom NO di setiap submit (sekarang hanya di `deleteRekap()`).
Fix: tanggal bergeser mundur 1 hari saat tersimpan ke Sheet — `parseTanggalToDate_()` sekarang eksplisit memakai timezone project.
Fix: tanggal bergeser mundur 1 hari saat preview Import Excel — `XLSX.read()` diubah ke `cellDates: false`, dan `parseImportedDate()` dibuat aman-timezone.
Fix: legend bawaan Chart.js pada grafik "Tren Kehadiran" dimatikan (`legend: { display: false }`) supaya tidak bentrok/membingungkan dengan tombol filter pill (Semua/Sakit/Izin/PKB/Mangkir/Attendance) di atasnya.
---
🗺️ Roadmap
[ ] Manajemen User — login sederhana dengan 2 role: Admin (2 akun tetap, akses penuh termasuk Import Excel, hapus data, kelola karyawan) dan User (akses terbatas, input absensi harian). Status login disimpan di `localStorage` agar tidak perlu login ulang saat testing perbaikan.
---
🛠️ Tech Stack
Backend: Google Apps Script (`Code.gs`) + Google Sheets sebagai database
Frontend: HTML + Tailwind CSS (CDN) + vanilla JavaScript
Library: Chart.js + chartjs-plugin-datalabels (grafik), SheetJS/xlsx (baca-tulis Excel), jsPDF + AutoTable (export PDF)
Hosting: GitHub Pages (frontend) + Apps Script Web App (backend API)
