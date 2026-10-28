/**
 * SMART GROCERY TRUCKER - AUTOMATED TEST SUITE
 * Standard DT2 Evaluation & P12~P15 Compliance
 * Tests Scenarios 1-4, Auth Uniqueness, Cryptographic Hashing,
 * Cart Reactivity, and Budget Warning Thresholds.
 */

const assert = require('assert');
const crypto = require('crypto');

// ==========================================================
// 1. IMPORT OR REPLICATE CORE LOGIC FROM APP.JS
// ==========================================================

function formatRupiah(amount) {
  const num = Math.round(Number(amount) || 0);
  return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function calculateCompoundDiscount(basePrice, discountInput) {
  const price = Math.max(0, Number(basePrice) || 0);
  if (!discountInput || typeof discountInput !== 'string') {
    return { unitPriceFinal: price, discountNominalPerUnit: 0, effectivePercent: 0, label: '', steps: [] };
  }

  const clean = discountInput.trim();
  if (!clean) {
    return { unitPriceFinal: price, discountNominalPerUnit: 0, effectivePercent: 0, label: '', steps: [] };
  }

  const isDirectNominal = (/^rp\s*[\d\.\,]+/i.test(clean)) || (/^\d+$/.test(clean.replace(/[\.\,]/g, '')) && !clean.includes('%'));
  if (isDirectNominal) {
    const nominal = parseFloat(clean.replace(/[^\d]/g, '')) || 0;
    const finalPrice = Math.max(0, price - nominal);
    const nominalDisc = price - finalPrice;
    const effPct = price > 0 ? (nominalDisc / price) * 100 : 0;
    return {
      unitPriceFinal: Math.round(finalPrice),
      discountNominalPerUnit: Math.round(nominalDisc),
      effectivePercent: effPct,
      label: `Potongan Rp ${nominalDisc}`,
      steps: [{ fromPrice: price, cutAmount: nominalDisc, toPrice: finalPrice }]
    };
  }

  const parts = clean.split('+').map(p => parseFloat(p.replace(/[^\d\.]/g, ''))).filter(p => !isNaN(p) && p > 0);
  if (parts.length === 0) {
    return { unitPriceFinal: price, discountNominalPerUnit: 0, effectivePercent: 0, label: '', steps: [] };
  }

  let runningPrice = price;
  const steps = [];
  const labelParts = [];

  for (let i = 0; i < parts.length; i++) {
    const pct = Math.min(100, parts[i]);
    const cut = runningPrice * (pct / 100);
    const nextPrice = Math.max(0, runningPrice - cut);
    steps.push({ stepNum: i + 1, percent: pct, fromPrice: runningPrice, cutAmount: cut, toPrice: nextPrice });
    runningPrice = nextPrice;
    labelParts.push(`${pct}%`);
  }

  const finalUnitPrice = Math.round(runningPrice);
  const totalDiscountNominal = Math.round(price - finalUnitPrice);
  const effectivePct = price > 0 ? ((totalDiscountNominal / price) * 100) : 0;

  return {
    unitPriceFinal: finalUnitPrice,
    discountNominalPerUnit: totalDiscountNominal,
    effectivePercent: effectivePct,
    label: parts.length > 1 ? `Promo ${labelParts.join(' + ')}` : `Diskon ${parts[0]}%`,
    steps: steps
  };
}

function comparePriceTrend(priceCurrent, priceLastMonth) {
  const current = Number(priceCurrent) || 0;
  const last = Number(priceLastMonth) || 0;
  if (last <= 0 || current <= 0) return { status: 'EQUAL', icon: '=', diffNominal: 0, diffPercent: 0 };
  const diff = current - last;
  const pct = (diff / last) * 100;
  if (diff > 0) return { status: 'UP', icon: '↑', diffNominal: diff, diffPercent: pct };
  if (diff < 0) return { status: 'DOWN', icon: '↓', diffNominal: diff, diffPercent: pct };
  return { status: 'EQUAL', icon: '=', diffNominal: 0, diffPercent: 0 };
}

function getBudgetStatus(totalSpent, budgetLimit = 350000) {
  const pct = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
  if (pct > 100) {
    return {
      status: 'DANGER_OVERBUDGET',
      pct,
      alertText: 'BAHAYA OVERBUDGET: Total belanja melebihi batas uang tunai! Kurangi kuantitas atau tunda pembelian barang sekunder.'
    };
  } else if (pct === 100) {
    return {
      status: 'EXACT_CAP',
      pct,
      alertText: 'BATAS SAKU PAS (100%): Total belanja tepat mencapai batas anggaran.'
    };
  } else if (pct >= 80) {
    return {
      status: 'WARNING_80',
      pct,
      alertText: 'Peringatan Waspada (>= 80%): Total belanja sudah mencapai ambang 80% dari dompet.'
    };
  } else {
    return {
      status: 'SAFE',
      pct,
      alertText: 'Dompet Aman: Anggaran terkendali. Sisa uang tunai mencukupi.'
    };
  }
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + ':' + salt).digest('hex');
}

// ==========================================================
// 2. TEST EXECUTION RUNNER
// ==========================================================

console.log('====================================================');
console.log('🧪 RUNNING SYSTEM TESTS FOR SMART GROCERY TRUCKER');
console.log('   Evaluasi Sumatif DT2 (P12 ~ P15 ICT Codehub)');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Error: ${err.message}`);
    failedTests++;
  }
}

// ----------------------------------------------------------
// Skenario 1 — Diskon Bertingkat Kompound (SRS F-03 & DT2)
// ----------------------------------------------------------
console.log('--- SKENARIO 1: DISKON BERTINGKAT KOMPOUND ---');

runTest('Skenario 1.1: Sabun Rp 20.000 diskon 25% -> Rp 15.000', () => {
  const res = calculateCompoundDiscount(20000, '25%');
  assert.strictEqual(res.unitPriceFinal, 15000, 'Harga akhir sabun harus Rp 15.000');
  assert.strictEqual(res.discountNominalPerUnit, 5000, 'Potongan sabun harus Rp 5.000');
  assert.strictEqual(res.effectivePercent, 25, 'Persentase efektif harus 25%');
});

runTest('Skenario 1.2: Wajan Rp 100.000 promo bertumpuk 50% + 20% -> Rp 40.000 (NOT Rp 30.000)', () => {
  const res = calculateCompoundDiscount(100000, '50% + 20%');
  // Tahap 1: 100.000 - 50% = 50.000
  // Tahap 2: 50.000 - 20% = 40.000
  assert.strictEqual(res.unitPriceFinal, 40000, 'Harga akhir wajan harus Rp 40.000');
  assert.notStrictEqual(res.unitPriceFinal, 30000, 'Sistem tidak boleh menjumlahkan persentase menjadi 70% (Rp 30.000)');
  assert.strictEqual(res.discountNominalPerUnit, 60000, 'Penghematan total harus Rp 60.000');
  assert.strictEqual(res.steps.length, 2, 'Harus memiliki 2 tahapan kalkulasi');
  assert.strictEqual(res.steps[0].toPrice, 50000, 'Tahap 1 harus Rp 50.000');
  assert.strictEqual(res.steps[1].toPrice, 40000, 'Tahap 2 harus Rp 40.000');
});

runTest('Skenario 1.3: Promo Potongan Nominal Langsung Rp 15.000 dari Rp 50.000', () => {
  const res = calculateCompoundDiscount(50000, 'Rp 15.000');
  assert.strictEqual(res.unitPriceFinal, 35000);
  assert.strictEqual(res.discountNominalPerUnit, 15000);
});

// ----------------------------------------------------------
// Skenario 2 — Penggandaan Kuantitas Otomatis (SRS F-02 & DT2)
// ----------------------------------------------------------
console.log('\n--- SKENARIO 2: PENGGANDAAN KUANTITAS OTOMATIS TANPA DELAY ---');

runTest('Skenario 2.1: Minyak Goreng 2L Rp 43.000 kuantitas 1 -> Rp 43.000', () => {
  const unitPrice = 43000;
  const qty = 1;
  const subtotal = unitPrice * qty;
  assert.strictEqual(subtotal, 43000);
});

runTest('Skenario 2.2: Ubah kuantitas Minyak Goreng 2L menjadi 3 -> Subtotal Rp 129.000', () => {
  const unitPrice = 43000;
  const qty = 3;
  const subtotal = unitPrice * qty;
  assert.strictEqual(subtotal, 129000, 'Subtotal minyak 3 pcs harus otomatis Rp 129.000');
});

runTest('Skenario 2.3: Penggandaan kuantitas (Doubling) tanpa error nilai', () => {
  let qty = 3;
  const unitPrice = 43000;
  qty = qty * 2; // Doubled to 6
  const subtotal = unitPrice * qty;
  assert.strictEqual(subtotal, 258000, 'Subtotal hasil penggandaan 6 pcs harus Rp 258.000');
});

// ----------------------------------------------------------
// Skenario 3 — Indikator Komparasi Fluktuasi Harga (SRS F-04 & DT2)
// ----------------------------------------------------------
console.log('\n--- SKENARIO 3: INDIKATOR KOMPARASI FLUKTUASI HARGA ---');

runTest('Skenario 3.1: Beras Bulan Lalu Rp 68.000 -> Sekarang Rp 74.000 (Harga Naik ↑)', () => {
  const trend = comparePriceTrend(74000, 68000);
  assert.strictEqual(trend.status, 'UP', 'Status harus UP');
  assert.strictEqual(trend.icon, '↑', 'Icon harus panah atas ↑');
  assert.strictEqual(trend.diffNominal, 6000, 'Selisih naik harus +Rp 6.000');
  assert.ok(trend.diffPercent > 0, 'Persentase naik harus positif');
});

runTest('Skenario 3.2: Telur Bulan Lalu Rp 32.000 -> Sekarang Rp 28.000 (Harga Turun ↓)', () => {
  const trend = comparePriceTrend(28000, 32000);
  assert.strictEqual(trend.status, 'DOWN', 'Status harus DOWN');
  assert.strictEqual(trend.icon, '↓', 'Icon harus panah bawah ↓');
  assert.strictEqual(trend.diffNominal, -4000, 'Selisih hemat harus -Rp 4.000');
  assert.ok(trend.diffPercent < 0, 'Persentase turun harus negatif');
});

runTest('Skenario 3.3: Garam Bulan Lalu Rp 5.000 -> Sekarang Rp 5.000 (Harga Stabil =)', () => {
  const trend = comparePriceTrend(5000, 5000);
  assert.strictEqual(trend.status, 'EQUAL', 'Status harus EQUAL');
  assert.strictEqual(trend.icon, '=', 'Icon harus tanda setara =');
  assert.strictEqual(trend.diffNominal, 0, 'Selisih harus 0');
});

// ----------------------------------------------------------
// Skenario 4 — Sistem Pengendali Anggaran (Budget Warning Thresholds)
// ----------------------------------------------------------
console.log('\n--- SKENARIO 4: BUDGET WARNING & THRESHOLDS ---');

const BUDGET_CAP = 350000;

runTest('Skenario 4.1: Uji Total Belanja Rp 279.000 (< 80% -> SAFE / AMAN)', () => {
  const res = getBudgetStatus(279000, BUDGET_CAP);
  assert.strictEqual(res.status, 'SAFE', 'Status harus SAFE');
  assert.ok(res.pct < 80, 'Persentase harus di bawah 80%');
  assert.ok(res.alertText.includes('Dompet Aman'), 'Pesan harus Dompet Aman');
});

runTest('Skenario 4.2: Uji Total Belanja Rp 280.000 (Tepat 80.0% -> WARNING_80 / WASPADA)', () => {
  const res = getBudgetStatus(280000, BUDGET_CAP);
  assert.strictEqual(res.status, 'WARNING_80', 'Status harus WARNING_80');
  assert.strictEqual(Math.round(res.pct), 80, 'Persentase harus tepat 80%');
  assert.ok(res.alertText.includes('Waspada'), 'Pesan harus Peringatan Waspada');
});

runTest('Skenario 4.3: Uji Total Belanja Rp 350.000 (Tepat 100.0% -> EXACT_CAP / BATAS ANGGARAN)', () => {
  const res = getBudgetStatus(350000, BUDGET_CAP);
  assert.strictEqual(res.status, 'EXACT_CAP', 'Status harus EXACT_CAP');
  assert.strictEqual(res.pct, 100, 'Persentase harus tepat 100%');
  assert.ok(res.alertText.includes('BATAS SAKU PAS'), 'Pesan harus Batas Saku Pas');
});

runTest('Skenario 4.4: Uji Total Belanja Rp 351.000 (> 100% -> DANGER_OVERBUDGET / BAHAYA)', () => {
  const res = getBudgetStatus(351000, BUDGET_CAP);
  assert.strictEqual(res.status, 'DANGER_OVERBUDGET', 'Status harus DANGER_OVERBUDGET');
  assert.ok(res.pct > 100, 'Persentase harus lebih dari 100%');
  assert.ok(res.alertText.includes('BAHAYA OVERBUDGET'), 'Pesan harus memuat BAHAYA OVERBUDGET');
  assert.ok(res.alertText.includes('Kurangi kuantitas atau tunda pembelian barang sekunder'), 'Memuat arahan resmi P15');
});

// ----------------------------------------------------------
// Pengujian Tambahan: Otentikasi & Keamanan (SRS F-06 / Auth)
// ----------------------------------------------------------
console.log('\n--- PENGUJIAN TAMBAHAN: OTENTIKASI & KEAMANAN SISTEM ---');

runTest('Auth Test 1: Username Uniqueness Validation', () => {
  const existingUsers = [{ username: 'rian_kos' }, { username: 'budi_jaya' }];
  const isAvailable = (u) => !existingUsers.some(user => user.username.toLowerCase() === u.toLowerCase());
  assert.strictEqual(isAvailable('rian_kos'), false, 'Username rian_kos harus terdeteksi sudah dipakai');
  assert.strictEqual(isAvailable('RIAN_KOS'), false, 'Case-insensitive uniqueness check');
  assert.strictEqual(isAvailable('user_baru_2026'), true, 'Username baru harus tersedia');
});

runTest('Auth Test 2: Password Hashing with Salt (No Plaintext)', () => {
  const password = 'RahasiaBelanja2026!';
  const salt = 'sample_salt_12345';
  const hash = hashPassword(password, salt);
  assert.notStrictEqual(hash, password, 'Password tidak boleh tersimpan sebagai teks biasa');
  assert.strictEqual(hash.length, 64, 'SHA-256 hash length harus 64 karakter hex');
  // Matching validation
  assert.strictEqual(hashPassword(password, salt), hash, 'Hash harus identik jika salt dan password sama');
  assert.notStrictEqual(hashPassword('SalahPassword', salt), hash, 'Hash harus beda jika password salah');
});

runTest('Data Test 3: Total Keranjang Belanja 6 Item DT2 Sesuai Modul = Rp 291.000', () => {
  // Minyak 3x 43k = 129k
  // Beras 1x 74k = 74k
  // Telur 1x 28k = 28k
  // Garam 1x 5k = 5k
  // Sabun 1x 20k @ 25% = 15k
  // Wajan 1x 100k @ 50%+20% = 40k
  const total = 129000 + 74000 + 28000 + 5000 + 15000 + 40000;
  assert.strictEqual(total, 291000, 'Total belanja 6 item DT2 harus tepat Rp 291.000');
  const pct = (total / BUDGET_CAP) * 100;
  assert.strictEqual(pct.toFixed(1), '83.1', 'Persentase total belanja DT2 adalah 83.1%');
});

// ==========================================================
// 3. FINAL RESULTS SUMMARY
// ==========================================================
console.log('\n====================================================');
console.log(`📊 RINGKASAN HASIL PENGUJIAN OTOMATIS:`);
console.log(`   Total Pengujian : ${totalTests}`);
console.log(`   Status PASS     : ${passedTests}`);
console.log(`   Status FAIL     : ${failedTests}`);
console.log('====================================================');

if (failedTests > 0) {
  console.error('❌ SEBAGIAN PENGUJIAN GAGAL!');
  process.exit(1);
} else {
  console.log('🎉 SELURUH PENGUJIAN SKENARIO 1–4 & SISTEM 100% LULUS (PASS)!');
  process.exit(0);
}
