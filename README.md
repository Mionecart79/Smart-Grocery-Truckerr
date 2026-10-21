# 🛒 Smart Grocery Truckerr (Smart Grocery & Price Tracker)

> **Aplikasi Web Mobile PWA (Progressive Web App)** pencatatan belanja cerdas, komparasi harga realtime, dan sistem *Budget Safety Cap* untuk anak kos mandiri.  
> Dikembangkan sesuai materi modul **P12~P14: Smart Grocery & Price Tracker (Studi Kasus Rian)** dan standar evaluasi sumatif **P15: Daily Test 2 (DT2)** ICT Codehub SMA Mutiara Bangsa 2.

---

## 📱 Ringkasan Studi Kasus Rian
Rian adalah siswa rantau yang hidup mandiri di kamar kos 3x3 meter dengan uang saku bulanan terbatas (batas saku dompet Rp 350.000). Masalah yang sering dihadapi saat berbelanja di supermarket:
1. **Panik di Depan Kasir**: Total tagihan melompat jauh di luar isi dompet dan terpaksa membatalkan barang belanjaan.
2. **Terkecoh Promo Bertumpuk & Kemasan**: Jebakan diskon *"50% + 20%"* atau kebingungan memilih antara 3 kantong minyak 1L seharga Rp 18.000 vs jerigen 5L seharga Rp 85.000.
3. **Struk Kertas Buram**: Tidak tahu apakah harga barang saat ini sedang naik atau turun tajam dibanding bulan lalu.

**Smart Grocery Truckerr** hadir sebagai asisten belanja mobile yang nyaman digunakan dengan satu tangan saat mendorong troli supermarket.

---

## 🚀 Implementasi Spesifikasi Kebutuhan Sistem (SRS F-01 ~ F-06)

| Kode | Fitur Target | Spesifikasi & Perilaku Teknis | Status |
| :--- | :--- | :--- | :---: |
| **F-01** | **Pencatatan Item Belanja Lengkap** | Mencatat nama barang, kategori (Bahan Pokok, Bumbu, dll), satuan (kg, liter, pcs, botol), kuantitas, harga saat ini, dan harga bulan lalu. | ✅ **Tuntas** |
| **F-02** | **Perhitungan Kuantitas Otomatis** | Tombol stepper kuantitas (`+` / `-`) langsung mengalikan harga satuan secara realtime ke subtotal dan total tagihan tanpa delay atau tombol manual. | ✅ **Tuntas** |
| **F-03** | **Kalkulator Diskon Bertingkat Kompound** | Mengakomodasi diskon tunggal (`25%`), diskon bertumpuk kompound (`50% + 20%`), maupun potongan langsung (`Rp 15.000`) dengan formula matematis yang presisi. | ✅ **Tuntas** |
| **F-04** | **Komparator Fluktuasi Harga Realtime** | Indikator visual instan pembanding harga bulan lalu:<br>• **Panah Merah Naik (&uarr;)**: Harga naik (+Rp nominal &amp; %)<br>• **Panah Hijau Turun (&darr;)**: Harga turun / hemat (-Rp nominal &amp; %)<br>• **Tanda Setara (=)**: Harga stabil | ✅ **Tuntas** |
| **F-05** | **Pengendali Anggaran (Budget Safety Cap)** | Pemantau limit saku dompet dengan 3 tingkat status:<br>• **Aman (&lt; 90%)**: Bar hijau/teal, dompet terkendali<br>• **Waspada (&ge; 90%)**: Bar kuning/amber<br>• **Bahaya Overbudget (&ge; 100%)**: Banner merah menyala dengan peringatan resmi:<br><em>"Total belanja melebihi batas uang tunai! Kurangi kuantitas atau tunda pembelian barang sekunder."</em> | ✅ **Tuntas** |
| **F-06** | **Riwayat &amp; Database Belanja** | Tersimpan otomatis di `LocalStorage` browser agar tidak hilang saat refresh/offline, disertai modul integrasi **Cloud Firebase Firestore** (Modul Bagian 9) dan arsip struk digital. | ✅ **Tuntas** |

---

## 🌟 Fitur Unggulan Tambahan
1. **🧪 Tombol Preset Skenario Uji DT2 (1-Click Loader)**:
   - Langsung memuat 6 item uji acak sesuai soal evaluasi DT2:
     - Minyak Goreng 2L: 3 pcs x Rp 43.000 = Rp 129.000 (Skenario 2).
     - Beras Ramos 5kg: Rp 74.000 vs Rp 68.000 (&uarr; Naik Rp 6.000) (Skenario 3).
     - Telur Ayam 1kg: Rp 28.000 vs Rp 32.000 (&darr; Turun Rp 4.000) (Skenario 3).
     - Garam Dapur 500g: Rp 5.000 vs Rp 5.000 (= Stabil) (Skenario 3).
     - Sabun Mandi Cair: Rp 20.000 diskon 25% = Rp 15.000 (Skenario 1).
     - Wajan Anti Lengket: Rp 100.000 promo 50% + 20% = Rp 40.000 (Skenario 1).
     - Total Belanja: Rp 291.000 dari limit dompet Rp 350.000 (83.1% - Aman).
2. **Kalkulator Anti-Jebakan Promo**:
   - Membandingkan kemasan kecil vs jerigen besar (harga per satuan liter/kg/pcs).
3. **Struk Belanja Digital**:
   - Menghasilkan struk thermal rapi dengan rincian penghematan promo, siap cetak / PDF dan kirim ke WhatsApp.
4. **PWA Mobile-First Native Look**:
   - Tampilan lebar maksimal 430px centered dengan frame elegan, bottom floating navigation bar, dan touch targets ramah jempol.
   - PWA Manifest (`manifest.json`) dan Service Worker (`sw.js`) untuk instalasi langsung (*Add to Home Screen*).

---

## 🛠️ Struktur Berkas Proyek
```
Smart Grocery Truckerr/
├── css/
│   └── styles.css          # Desain sistem mobile PWA, color tokens, cards, badges
├── js/
│   └── app.js              # Logika state, rumus diskon bertingkat, komparator, storage
├── icons/
│   └── icon.svg            # Ikon PWA maskable bergaya native
├── index.html              # Antarmuka mobile utama dengan 4 tab navigasi
├── manifest.json           # Konfigurasi PWA Add to Home Screen
├── sw.js                   # Service Worker untuk dukungan offline caching
├── server.js               # Dev server lokal statis ringan (Node.js)
├── test_app_logic.js       # Script automated unit testing (100% PASS)
└── README.md               # Dokumentasi lengkap proyek
```

---

## 💻 Cara Menjalankan Aplikasi

### Opsi 1: Menjalankan Server Lokal (Node.js)
Buka terminal di folder proyek dan jalankan:
```bash
node server.js
```
Akses di browser: `http://localhost:3000`

### Opsi 2: Membuka Langsung File HTML
Klik kanan pada berkas `index.html` dan pilih **Open with Google Chrome**.

> **Tips Uji Mobile DevTools:**  
> Tekan `F12` pada keyboard di Chrome, lalu tekan `Ctrl + Shift + M` (Toggle Device Toolbar) untuk beralih ke simulasi layar smartphone asli (misal: iPhone 14 Pro / Pixel 7).

---

## 🧪 Menjalankan Pengujian Logika Otomatis
Untuk memvalidasi bahwa seluruh rumus matematika, diskon bertingkat kompound, dan budget safety cap lulus pengujian tanpa kesalahan:
```bash
node test_app_logic.js
```
Hasil:
```text
=== RUNNING TESTS FOR SMART GROCERY TRUCKERR ===
1. Testing Diskon Formula (F-03 & DT2 Skenario 1): ✅ PASS
2. Testing Reaktivitas Kuantitas (F-02 & DT2 Skenario 2): ✅ PASS
3. Testing Komparator Fluktuasi Harga (F-04 & DT2 Skenario 3): ✅ PASS
4. Testing Budget Safety Cap (F-05 & DT2 Skenario 4): ✅ PASS
🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY! 100% COMPLIANT WITH P12 & P15 DT2.
```

---

## ☁️ Integrasi Cloud Firebase (Modul P12 Bagian 9)
Untuk menghubungkan database ke Firebase Firestore:
1. Buka tab **Anggaran** di navigasi bawah aplikasi.
2. Scroll ke bagian **Cloud Database Firebase**.
3. Tempelkan objek `const firebaseConfig = { ... };` dari Firebase Console milikmu.
4. Klik **Hubungkan Firebase Cloud**. Data keranjang, riwayat, dan limit anggaran akan otomatis tersinkronisasi.
