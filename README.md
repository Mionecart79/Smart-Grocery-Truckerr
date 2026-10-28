# 🛒 Smart Grocery Trucker

> **Aplikasi Web & Mobile Progressive Web App (PWA)** untuk pencatatan belanja cerdas, pemantauan fluktuasi harga pasar vs supermarket, kalkulator diskon kompound, dan sistem *Budget Safety Cap* (Ambang 80% & Batas Dompet Rp 350.000).  
> Dikembangkan sesuai standar kurikulum **P12~P14 (Analisis Kebutuhan SRS)** dan pengujian sumatif **P15: Daily Test 2 (DT2)** ICT Codehub SMA Mutiara Bangsa 2.

---

## 🎯 1. Tujuan Proyek
Smart Grocery Trucker dirancang untuk memecahkan tiga masalah krusial saat berbelanja bulanan:
1. **Panik di Depan Kasir**: Total tagihan melompat melebihi uang tunai di dompet sehingga terpaksa membatalkan barang belanjaan.
2. **Jebakan Promo Bertingkat & Kemasan**: Kesalahan kalkulasi promo bertumpuk (seperti promo *50% + 20%* yang sering disalahartikan sebagai 70%) serta ketidakpastian perbandingan harga per liter antara botol kecil vs jerigen jumbo.
3. **Fluktuasi Harga Pasar**: Kehilangan jejak apakah harga barang bulan ini sedang naik tajam dibanding bulan lalu atau sedang berada pada titik hemat terbaik.

---

## 🚀 2. Fitur Utama & Kepatuhan SRS (F-01 ~ F-06)

| Kode | Fitur | Spesifikasi & Perilaku Sistem | Status |
| :--- | :--- | :--- | :---: |
| **F-01** | **Pencatatan Item Belanja Lengkap** | Mencatat nama produk, kategori, kuantitas, satuan ukuran (`pcs`, `kg`, `gram`, `liter`, `ml`, `bungkus`, `botol`, `pack`), harga satuan, diskon, toko/lokasi, dan status pembelian. | ✅ **Tuntas** |
| **F-02** | **Reaktivitas Kuantitas Instan** | Tombol stepper kuantitas (`+` / `-`) langsung memperbarui subtotal, total belanja, sisa anggaran, dan budget warning secara realtime tanpa reload atau delay. | ✅ **Tuntas** |
| **F-03** | **Kalkulator Diskon Kompound** | Menangani diskon tunggal (`25%`), promo bertumpuk berurutan (`50% + 20%`), maupun potongan langsung (`Rp 15.000`) dengan formula kompound yang presisi. | ✅ **Tuntas** |
| **F-04** | **Komparator Fluktuasi Harga Realtime** | Indikator visual instan perbandingan harga bulan lalu:<br>• **Panah Merah Naik (&uarr;)**: Harga naik (+Rp selisih & %)<br>• **Panah Hijau Turun (&darr;)**: Harga hemat (-Rp selisih & %)<br>• **Tanda Setara (=)**: Harga stabil | ✅ **Tuntas** |
| **F-05** | **Pengendali Anggaran (Budget Safety Cap)** | Pemantauan batas saku dompet (default Rp 350.000) dengan indikator dinamis:<br>• **Aman (&lt; 80%)**: Bar hijau, dompet aman.<br>• **Waspada (&ge; 80%)**: Bar kuning/amber, mencapai ambang waspada Rp 280.000.<br>• **Batas Saku Pas (= 100%)**: Bar oranye pada Rp 350.000.<br>• **Bahaya Overbudget (&gt; 100%)**: Banner merah menyala:<br><em>"Total belanja melebihi batas uang tunai! Kurangi kuantitas atau tunda pembelian barang sekunder."</em> | ✅ **Tuntas** |
| **F-06** | **Riwayat &amp; Database Terisolasi** | Multi-user authentication, username unik realtime, password hashing (SHA-256 + salt), penyimpanan aman per user ID, arsip struk belanja digital, dan integrasi cloud. | ✅ **Tuntas** |

---

## 🧮 3. Rumus Diskon Bertingkat Kompound (SRS F-03)
Toko sering menerapkan diskon bertingkat seperti `50% + 20%`. Sistem **TIDAK** menjumlahkan persentase menjadi 70%. Rumus yang diterapkan:
$$\text{Harga Akhir} = \text{Harga Awal} \times (1 - d_1) \times (1 - d_2) \times \dots \times (1 - d_n)$$

### Contoh Pembuktian:
- **Sabun Mandi**: Rp 20.000 dengan diskon 25%:
  $$\text{Harga Akhir} = 20.000 \times (1 - 0.25) = \text{Rp } 15.000$$
- **Wajan Anti Lengket**: Rp 100.000 dengan promo 50% + 20%:
  - *Tahap 1*: Rp 100.000 dipotong 50% = Rp 50.000
  - *Tahap 2*: Sisa Rp 50.000 dipotong 20% = **Rp 40.000** *(Bukan Rp 30.000)*
  - *Penghematan Total*: Rp 60.000 (60% efektif).

---

## 💰 4. Sistem Pengendali Anggaran (Budget Warning & Safety Cap)
Batas saku dompet standar adalah **Rp 350.000**:
- **Total < Rp 280.000 (< 80%)**: Status **Dompet Aman** (Hijau).
- **Total Rp 280.000 – Rp 349.999 (80% – 99.9%)**: Status **Peringatan Waspada (≥ 80%)** (Kuning/Amber).
- **Total Rp 350.000 (100%)**: Status **Batas Saku Tercapai** (Oranye).
- **Total > Rp 350.000 (> 100%)**: Status **BAHAYA OVERBUDGET** (Merah Menyala).

---

## 📈 5. Mekanisme Price Tracker & Fluktuasi Pasar
Price Tracker mencatat histori harga dari berbagai gerai:
- **Supermarket Grosir**: Lotte Mart - Puri Indah, Superindo, Alfamart, Indomaret.
- **Pasar Tradisional**: Pasar Tradisional Anyar Tangerang.
- **Grafik SVG Interaktif**: Menampilkan tren historis harga Beras, Minyak Goreng, dan Telur.
- **Matriks Komparasi Toko**: Menemukan gerai termurah untuk komoditas pangan pokok yang sama.

---

## 🔒 6. Autentikasi & Keamanan Pengguna
1. **Username Unik**: Pengecekan realtime ketersediaan username saat diketik (`GET /api/check-username`).
2. **Password Hashing**: Password di-hash menggunakan algoritma `SHA-256` dengan *salt* acak unik di backend server, mencegah kebocoran plaintext.
3. **Google OAuth 2.0**: Opsi "Lanjutkan dengan Google" dengan panduan konfigurasi kredensial Google Client ID.
4. **Isolasi Data**: Data belanja dan riwayat setiap pengguna dipisahkan secara independen berdasarkan `user.id`.
5. **Mode Tamu / Demo 1-Click**: Akses instan untuk penguji tanpa perlu membuat akun baru.

---

## 🛠️ 7. Teknologi yang Digunakan
- **Frontend**: HTML5 Semantic, Modern CSS3 (Shopee-inspired Emerald & White UI tokens), JavaScript ES6+ Modular.
- **PWA (Progressive Web App)**: Web App Manifest (`manifest.json`), Service Worker (`sw.js`) dengan cache offline, responsif untuk smartphone dan desktop.
- **Backend API**: Node.js HTTP Server (`server.js`) dengan modul bawaan `crypto` dan RESTful API.
- **Storage**: Multi-tier persistence (REST Server Storage + Browser LocalStorage + Cloud Firestore module).
- **Testing**: Node.js Automated Unit Test Suite (`test_app_logic.js`).
- **CI/CD**: GitHub Actions Workflow (`.github/workflows/ci-deploy.yml`) untuk otomatisasi build dan deployment ke GitHub Pages.

---

## 📁 8. Struktur Berkas Proyek
```
Smart-Grocery-Truckerr/
├── .github/
│   └── workflows/
│       └── ci-deploy.yml       # GitHub Actions automated test & Pages deployment
├── css/
│   └── styles.css              # Styling Shopee-inspired modern mobile PWA
├── data/
│   ├── users.json              # Basis data pengguna & hash password
│   └── user_data.json          # Penyimpanan terisolasi item & anggaran per user
├── icons/
│   └── icon.svg                # Ikon orisinal PWA (keranjang, daun, grafik harga)
├── js/
│   ├── app.js                  # Logika reaktivitas, diskon kompound, budget cap
│   └── firebase-init.js        # Modul integrasi cloud Firestore
├── .env.example                # Template konfigurasi environment variables
├── .gitignore                  # Berkas proteksi file sensitif & logs
├── index.html                  # Antarmuka utama (Landing, Dashboard, 6 Tab)
├── manifest.json               # Konfigurasi PWA Add to Home Screen
├── package.json                # Metadata proyek & script pengujian
├── README.md                   # Dokumentasi teknis terpadu
├── server.js                   # Node.js backend server (Auth & REST APIs)
├── sw.js                       # Service Worker offline caching
└── test_app_logic.js           # Automated test suite (16 tests PASS)
```

---

## 💻 9. Instalasi & Cara Menjalankan Aplikasi

### Prasyarat
- Node.js (v18 ke atas)
- Web Browser modern (Google Chrome disarankan)

### Langkah Menjalankan Server Lokal (Disarankan):
```bash
# 1. Masuk ke folder proyek
cd "C:\Users\Student\Documents\Smart-Grocery-Truckerr"

# 2. Jalankan backend server Node.js
node server.js
```
Akses di browser: `http://localhost:3000`

### Menjalankan Sebagai Aplikasi Statis / PWA:
Buka file `index.html` langsung di Google Chrome atau host menggunakan static web server. Aplikasi otomatis mengaktifkan *client-side local persistence* jika server offline.

---

## ⚙️ 10. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env` jika ingin mengonfigurasi port khusus, Google OAuth, atau Firebase Cloud:
```bash
PORT=3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_PROJECT_ID=smart-grocery-truckerr
```

---

## 🧪 11. Hasil Pengujian Sistem DT2 (Skenario 1–4)
Jalankan pengujian otomatis:
```bash
node test_app_logic.js
```

### Tabel Hasil Eksekusi Uji:
| No | Skenario Uji | Parameter / Input | Hasil yang Diharapkan | Hasil Aktual | Status |
| :-: | :--- | :--- | :--- | :--- | :-: |
| 1 | **Skenario 1.1** Diskon Tunggal | Sabun Rp 20.000, Diskon 25% | Harga Rp 15.000 | Rp 15.000 | **PASS** |
| 2 | **Skenario 1.2** Diskon Kompound | Wajan Rp 100.000, Promo 50% + 20% | Harga Rp 40.000 (NOT Rp 30.000) | Rp 40.000 | **PASS** |
| 3 | **Skenario 1.3** Potongan Langsung | Barang Rp 50.000, Potongan Rp 15.000 | Harga Rp 35.000 | Rp 35.000 | **PASS** |
| 4 | **Skenario 2.1** Kuantitas Awal | Minyak 2L Rp 43.000, Qty = 1 | Subtotal Rp 43.000 | Rp 43.000 | **PASS** |
| 5 | **Skenario 2.2** Perubahan Kuantitas | Minyak 2L Rp 43.000, Qty diubah ke 3 | Subtotal Rp 129.000 tanpa reload | Rp 129.000 | **PASS** |
| 6 | **Skenario 2.3** Penggandaan Kuantitas | Qty digandakan (x2) menjadi 6 | Subtotal Rp 258.000 | Rp 258.000 | **PASS** |
| 7 | **Skenario 3.1** Fluktuasi Naik | Beras: Bulan lalu Rp 68k &rarr; Sekarang Rp 74k | Indikator (&uarr;) Merah, +Rp 6.000 (+8.8%) | (&uarr;) +Rp 6.000 (+8.8%) | **PASS** |
| 8 | **Skenario 3.2** Fluktuasi Turun | Telur: Bulan lalu Rp 32k &rarr; Sekarang Rp 28k | Indikator (&darr;) Hijau, -Rp 4.000 (-12.5%) | (&darr;) -Rp 4.000 (-12.5%) | **PASS** |
| 9 | **Skenario 3.3** Fluktuasi Stabil | Garam: Bulan lalu Rp 5k &rarr; Sekarang Rp 5k | Indikator (=) Abu-abu Stabil | (=) Tetap Stabil | **PASS** |
| 10 | **Skenario 4.1** Budget Safe | Total Belanja Rp 279.000 (dari Rp 350.000) | 79.7% (&lt; 80%) &rarr; Status Dompet Aman | 79.7% Status Aman | **PASS** |
| 11 | **Skenario 4.2** Budget 80% Warning | Total Belanja Rp 280.000 (dari Rp 350.000) | 80.0% (&ge; 80%) &rarr; Peringatan Waspada | 80.0% Status Waspada | **PASS** |
| 12 | **Skenario 4.3** Budget 100% Cap | Total Belanja Rp 350.000 (dari Rp 350.000) | 100.0% &rarr; Batas Saku Pas | 100.0% Batas Saku Pas | **PASS** |
| 13 | **Skenario 4.4** Budget Overbudget | Total Belanja Rp 351.000 (dari Rp 350.000) | 100.3% &rarr; BAHAYA OVERBUDGET | 100.3% Bahaya Overbudget | **PASS** |
| 14 | **Auth 1** Username Unik | Cek username terdaftar vs baru | Terdeteksi duplikat saat diketik | Tersedia / Terpakai valid | **PASS** |
| 15 | **Auth 2** Password Hash Salt | Enkripsi SHA-256 dengan salt | Hash 64 karakter hex, tanpa plaintext | Hash 64-char valid | **PASS** |
| 16 | **DT2 6 Items** Keranjang Total | 6 barang uji evaluasi DT2 | Total Rp 291.000 (83.1% saku) | Total Rp 291.000 | **PASS** |

---

## 🌐 12. Deployment & Repository GitHub
- **Repository GitHub**: [https://github.com/Mionecart79/Smart-Grocery-Truckerr](https://github.com/Mionecart79/Smart-Grocery-Truckerr)
- **Live Deployment (GitHub Pages)**: [https://mionecart79.github.io/Smart-Grocery-Truckerr/](https://mionecart79.github.io/Smart-Grocery-Truckerr/)
- **Otomatisasi**: Terintegrasi GitHub Actions `.github/workflows/ci-deploy.yml` yang otomatis menjalankan `test_app_logic.js` dan mempublikasikan versi rilis setiap ada push ke branch `main`.
