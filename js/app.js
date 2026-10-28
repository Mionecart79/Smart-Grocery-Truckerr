/**
 * SMART GROCERY TRUCKER - ASTRO EDITION
 * Core Application Logic & State Management
 * Features:
 * - Astro Quick-Commerce Shopping Experience
 * - Interactive Dynamic Budget Control (One-tap Quick Nominals & Custom Input)
 * - Complete Shopping History (Order Archive, Digital Receipts & 1-Click Reorder)
 * - Compound Discount Calculator (SRS F-03)
 * - Realtime Price Fluctuation (SRS F-04)
 * - Budget Safety Cap (SRS F-05: 80% Ambang Waspada & Overbudget Alert)
 */

// ==========================================================
// 1. GLOBAL STATE & CONSTANTS
// ==========================================================
const DEFAULT_BUDGET = 350000;

let currentUser = null;
let cartItems = [];
let budgetLimit = DEFAULT_BUDGET;
let shoppingHistory = [];
let priceLogs = [];
let activeCategory = 'ALL';
let activeNavTab = 'dashboard';
let itemToDeleteId = null;
let usernameDebounceTimer = null;

// Preloaded Astro Grocery Items (Kompatibel dengan Studi Kasus DT2)
const DEFAULT_SHOPPING_ITEMS = [
  {
    id: 'astro_item_1',
    name: 'Minyak Goreng 2L Pouch',
    category: 'Bahan Pokok',
    store: 'Lotte Mart - Puri Indah',
    qty: 3,
    unit: 'liter',
    price: 43000,
    priceLastMonth: 43000,
    discountInput: '',
    purchased: false
  },
  {
    id: 'astro_item_2',
    name: 'Beras Ramos Super 5kg',
    category: 'Bahan Pokok',
    store: 'Lotte Mart - Puri Indah',
    qty: 1,
    unit: 'kg',
    price: 74000,
    priceLastMonth: 68000,
    discountInput: '',
    purchased: false
  },
  {
    id: 'astro_item_3',
    name: 'Telur Ayam Negeri Fresh 1kg',
    category: 'Bahan Pokok',
    store: 'Lotte Mart - Puri Indah',
    qty: 1,
    unit: 'kg',
    price: 28000,
    priceLastMonth: 32000,
    discountInput: '',
    purchased: false
  },
  {
    id: 'astro_item_4',
    name: 'Garam Beryodium Dapur 500g',
    category: 'Bumbu Dapur',
    store: 'Lotte Mart - Puri Indah',
    qty: 1,
    unit: 'bungkus',
    price: 5000,
    priceLastMonth: 5000,
    discountInput: '',
    purchased: false
  },
  {
    id: 'astro_item_5',
    name: 'Sabun Mandi Cair Botol 450ml',
    category: 'Perawatan Diri',
    store: 'Lotte Mart - Puri Indah',
    qty: 1,
    unit: 'botol',
    price: 20000,
    priceLastMonth: 20000,
    discountInput: '25%',
    purchased: false
  },
  {
    id: 'astro_item_6',
    name: 'Wajan Teflon Anti Lengket 24cm',
    category: 'Peralatan Rumah',
    store: 'Lotte Mart - Puri Indah',
    qty: 1,
    unit: 'pcs',
    price: 100000,
    priceLastMonth: 100000,
    discountInput: '50% + 20%',
    purchased: false
  }
];

// Default Price Tracker Observations (Supermarket & Traditional Market)
const DEFAULT_PRICE_LOGS = [
  { id: 'pl_1', itemName: 'Beras Ramos 5kg', store: 'Lotte Mart - Puri Indah', location: 'Puri Indah', price: 74000, unit: 'kg', priceLastMonth: 68000, date: '2026-10-26', notes: 'Harga naik dibanding bulan lalu' },
  { id: 'pl_2', itemName: 'Beras Ramos 5kg', store: 'Superindo', location: 'Meruya', price: 72500, unit: 'kg', priceLastMonth: 71000, date: '2026-10-25', notes: 'Selisih lebih murah' },
  { id: 'pl_3', itemName: 'Beras Ramos 5kg', store: 'Pasar Tradisional Anyar', location: 'Tangerang', price: 70000, unit: 'kg', priceLastMonth: 69000, date: '2026-10-27', notes: 'Paling hemat' },
  { id: 'pl_4', itemName: 'Minyak Goreng 2L', store: 'Lotte Mart - Puri Indah', location: 'Puri Indah', price: 43000, unit: 'liter', priceLastMonth: 43000, date: '2026-10-26', notes: 'Harga stabil' },
  { id: 'pl_5', itemName: 'Minyak Goreng 2L', store: 'Superindo', location: 'Meruya', price: 41500, unit: 'liter', priceLastMonth: 42000, date: '2026-10-24', notes: 'Promo akhir pekan' },
  { id: 'pl_6', itemName: 'Telur Ayam 1kg', store: 'Lotte Mart - Puri Indah', location: 'Puri Indah', price: 28000, unit: 'kg', priceLastMonth: 32000, date: '2026-10-26', notes: 'Turun harga hemat Rp 4.000' },
  { id: 'pl_7', itemName: 'Telur Ayam 1kg', store: 'Pasar Tradisional Anyar', location: 'Tangerang', price: 27000, unit: 'kg', priceLastMonth: 30000, date: '2026-10-27', notes: 'Stok lokal melimpah' },
  { id: 'pl_8', itemName: 'Garam Dapur 500g', store: 'Lotte Mart - Puri Indah', location: 'Puri Indah', price: 5000, unit: 'bungkus', priceLastMonth: 5000, date: '2026-10-26', notes: 'Harga stabil' }
];

// Sample Preloaded History for Immediate Demo & Exploration
const DEFAULT_INITIAL_HISTORY = [
  {
    id: 'AST-20261015-081',
    date: '2026-10-15T10:30:00.000Z',
    items: [
      { name: 'Minyak Goreng 2L Pouch', qty: 2, unit: 'liter', price: 43000, discountInput: '', unitFinal: 43000 },
      { name: 'Beras Ramos Super 5kg', qty: 1, unit: 'kg', price: 68000, discountInput: '', unitFinal: 68000 },
      { name: 'Telur Ayam Negeri Fresh 1kg', qty: 1, unit: 'kg', price: 32000, discountInput: '', unitFinal: 32000 }
    ],
    totalSpent: 186000,
    budgetLimit: 350000,
    remaining: 164000,
    totalSavings: 0,
    itemsCount: 4,
    store: 'Lotte Mart - Puri Indah'
  }
];

// ==========================================================
// 2. MATHEMATICAL HELPERS (SRS F-03 & F-04)
// ==========================================================

function formatRupiah(amount) {
  const num = Math.round(Number(amount) || 0);
  return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Compound Percentage & Nominal Discount Formula (SRS F-03)
 */
function calculateCompoundDiscount(basePrice, discountInput) {
  const price = Math.max(0, Number(basePrice) || 0);
  if (!discountInput || typeof discountInput !== 'string') {
    return { unitPriceFinal: price, discountNominalPerUnit: 0, effectivePercent: 0, label: '', steps: [] };
  }

  const clean = discountInput.trim();
  if (!clean) {
    return { unitPriceFinal: price, discountNominalPerUnit: 0, effectivePercent: 0, label: '', steps: [] };
  }

  // Direct Nominal Cut (e.g. "Rp 15.000" or "15000")
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
      label: `Potongan ${formatRupiah(nominalDisc)}`,
      steps: [
        {
          stepNum: 1,
          description: `Potongan langsung ${formatRupiah(nominalDisc)}`,
          fromPrice: price,
          cutAmount: nominalDisc,
          toPrice: finalPrice
        }
      ]
    };
  }

  // Compound Percentage Promo (e.g. "50% + 20%" or "25%")
  const parts = clean.split('+')
    .map(p => parseFloat(p.replace(/[^\d\.]/g, '')))
    .filter(p => !isNaN(p) && p > 0);

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

    steps.push({
      stepNum: i + 1,
      percent: pct,
      description: `Tahap ${i + 1}: ${formatRupiah(runningPrice)} dipotong ${pct}% (${formatRupiah(cut)}) = ${formatRupiah(nextPrice)}`,
      fromPrice: runningPrice,
      cutAmount: cut,
      toPrice: nextPrice
    });

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

/**
 * Realtime Price Fluctuation Comparator vs Last Month (SRS F-04)
 */
function comparePriceTrend(priceCurrent, priceLastMonth) {
  const current = Number(priceCurrent) || 0;
  const last = Number(priceLastMonth) || 0;

  if (last <= 0 || current <= 0) {
    return { status: 'EQUAL', icon: '=', label: 'Stabil', diffNominal: 0, diffPercent: 0 };
  }

  const diff = current - last;
  const pct = (diff / last) * 100;

  if (diff > 0) {
    return {
      status: 'UP',
      icon: '↑',
      label: `+${formatRupiah(diff)} (+${pct.toFixed(1)}%)`,
      diffNominal: diff,
      diffPercent: pct
    };
  } else if (diff < 0) {
    return {
      status: 'DOWN',
      icon: '↓',
      label: `-${formatRupiah(Math.abs(diff))} (${pct.toFixed(1)}%)`,
      diffNominal: diff,
      diffPercent: pct
    };
  } else {
    return {
      status: 'EQUAL',
      icon: '=',
      label: 'Harga Stabil (=)',
      diffNominal: 0,
      diffPercent: 0
    };
  }
}

// ==========================================================
// 3. STORAGE & PER-USER DATA PERSISTENCE
// ==========================================================

function getUserStorageKey(suffix) {
  const uid = currentUser && currentUser.id ? currentUser.id : 'guest';
  return `sgt_${uid}_${suffix}`;
}

function loadUserState() {
  const savedUserJson = localStorage.getItem('sgt_active_user');
  if (savedUserJson) {
    try {
      currentUser = JSON.parse(savedUserJson);
    } catch (e) {
      currentUser = null;
    }
  }

  if (!currentUser) {
    currentUser = {
      id: 'guest_user',
      username: 'tamu_belanja',
      email: 'tamu@grocery.local',
      name: 'Tamu Belanja',
      isDemo: true
    };
  }

  // Load items
  const itemsKey = getUserStorageKey('cart_items');
  const savedItems = localStorage.getItem(itemsKey);
  if (savedItems) {
    try {
      cartItems = JSON.parse(savedItems);
    } catch (e) {
      cartItems = [];
    }
  } else {
    cartItems = JSON.parse(JSON.stringify(DEFAULT_SHOPPING_ITEMS));
    saveUserState();
  }

  // Load budget
  const budgetKey = getUserStorageKey('budget_limit');
  const savedBudget = localStorage.getItem(budgetKey);
  budgetLimit = savedBudget ? (Number(savedBudget) || DEFAULT_BUDGET) : DEFAULT_BUDGET;

  // Load history
  const historyKey = getUserStorageKey('history');
  const savedHistory = localStorage.getItem(historyKey);
  if (savedHistory) {
    try {
      shoppingHistory = JSON.parse(savedHistory);
    } catch (e) {
      shoppingHistory = [];
    }
  } else {
    shoppingHistory = JSON.parse(JSON.stringify(DEFAULT_INITIAL_HISTORY));
    saveUserState();
  }

  // Load price logs
  const priceKey = getUserStorageKey('price_logs');
  const savedPriceLogs = localStorage.getItem(priceKey);
  priceLogs = savedPriceLogs ? JSON.parse(savedPriceLogs) : JSON.parse(JSON.stringify(DEFAULT_PRICE_LOGS));

  updateUserProfileUI();
  updateBudgetChipsActiveState();
}

function saveUserState() {
  if (!currentUser) return;
  localStorage.setItem(getUserStorageKey('cart_items'), JSON.stringify(cartItems));
  localStorage.setItem(getUserStorageKey('budget_limit'), String(budgetLimit));
  localStorage.setItem(getUserStorageKey('history'), JSON.stringify(shoppingHistory));
  localStorage.setItem(getUserStorageKey('price_logs'), JSON.stringify(priceLogs));

  if (currentUser.id && !currentUser.isDemo) {
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        data: { cartItems, budgetLimit, shoppingHistory, priceLogs }
      })
    }).catch(() => {});
  }
}

function updateUserProfileUI() {
  const badgeEl = document.getElementById('userProfileBadge');
  const greetingTitle = document.getElementById('dashboardGreetingTitle');
  const greetingSub = document.getElementById('greetingBudgetLabel');
  const infoName = document.getElementById('profileInfoName');
  const infoUser = document.getElementById('profileInfoUsername');
  const infoEmail = document.getElementById('profileInfoEmail');
  const infoStatus = document.getElementById('profileInfoStatus');
  const headerWallet = document.getElementById('headerWalletPill');

  const displayName = currentUser ? (currentUser.name || currentUser.username) : 'Tamu';
  const displayUser = currentUser ? `@${currentUser.username}` : '@tamu';
  const displayEmail = currentUser ? currentUser.email : 'tamu@grocery.local';

  if (badgeEl) badgeEl.textContent = displayName;
  if (greetingTitle) greetingTitle.textContent = `Halo, ${displayName}! 👋`;
  if (greetingSub) greetingSub.textContent = formatRupiah(budgetLimit);
  if (headerWallet) headerWallet.textContent = `💰 Dompet: ${formatRupiah(budgetLimit)}`;
  if (infoName) infoName.textContent = displayName;
  if (infoUser) infoUser.textContent = displayUser;
  if (infoEmail) infoEmail.textContent = displayEmail;
  if (infoStatus) {
    infoStatus.textContent = currentUser && !currentUser.isDemo ? '🟢 Terverifikasi' : '⚪ Mode Tamu';
  }

  const inputBudget = document.getElementById('inputBudgetSetting');
  if (inputBudget) inputBudget.value = budgetLimit;
}

// ==========================================================
// 4. INTERACTIVE BUDGET CONTROLLER (NOMINAL CHIPS & CUSTOM MODAL)
// ==========================================================

function setQuickBudget(amount) {
  const num = Number(amount) || DEFAULT_BUDGET;
  budgetLimit = num;

  saveUserState();
  updateUserProfileUI();
  updateBudgetSafetyCap();
  updateBudgetChipsActiveState();

  showToast(`💰 Batas dompet disetel ke ${formatRupiah(num)}`, 'success');
}

function updateBudgetChipsActiveState() {
  const chips = [100000, 200000, 350000, 500000, 1000000];
  chips.forEach(amt => {
    const chip = document.getElementById(`chip_${amt}`);
    if (chip) {
      if (budgetLimit === amt) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    }
  });
}

function openBudgetModal() {
  const modal = document.getElementById('budgetModal');
  const input = document.getElementById('modalCustomBudgetInput');
  const currentSpent = document.getElementById('modalCurrentSpentVal');
  const totals = calculateCartTotals();

  if (input) input.value = budgetLimit;
  if (currentSpent) currentSpent.textContent = formatRupiah(totals.totalAll);
  if (modal) modal.classList.add('open');
}

function closeBudgetModal() {
  const modal = document.getElementById('budgetModal');
  if (modal) modal.classList.remove('open');
}

function applyPresetBudget(amount) {
  setQuickBudget(amount);
  closeBudgetModal();
}

function handleCustomBudgetSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('modalCustomBudgetInput');
  const num = parseFloat(input.value) || DEFAULT_BUDGET;

  if (num <= 0) {
    showToast('Batas anggaran harus lebih dari 0', 'error');
    return;
  }

  setQuickBudget(num);
  closeBudgetModal();
}

function updateBudgetLimitSetting() {
  const input = document.getElementById('inputBudgetSetting');
  if (!input) return;
  const num = parseFloat(input.value) || DEFAULT_BUDGET;
  setQuickBudget(num);
}

// ==========================================================
// 5. CART TOTALS & BUDGET SAFETY CAP (SRS F-02 & F-05)
// ==========================================================

function calculateCartTotals() {
  let totalAll = 0;
  let totalPurchased = 0;
  let totalUnpurchased = 0;
  let totalItemsCount = 0;
  let purchasedCount = 0;
  let countUp = 0;
  let countDown = 0;
  let countEqual = 0;

  for (const item of cartItems) {
    const qty = Math.max(1, Number(item.qty) || 1);
    const discInfo = calculateCompoundDiscount(item.price, item.discountInput);
    const itemSubtotal = discInfo.unitPriceFinal * qty;

    totalAll += itemSubtotal;
    totalItemsCount += qty;

    if (item.purchased) {
      totalPurchased += itemSubtotal;
      purchasedCount += 1;
    } else {
      totalUnpurchased += itemSubtotal;
    }

    const trend = comparePriceTrend(item.price, item.priceLastMonth);
    if (trend.status === 'UP') countUp++;
    else if (trend.status === 'DOWN') countDown++;
    else countEqual++;
  }

  return {
    totalAll,
    totalPurchased,
    totalUnpurchased,
    totalItemsCount,
    purchasedCount,
    unpurchasedCount: cartItems.length - purchasedCount,
    countUp,
    countDown,
    countEqual
  };
}

function updateBudgetSafetyCap() {
  const totals = calculateCartTotals();
  const totalSpent = totals.totalAll;
  const pct = budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;
  const remaining = budgetLimit - totalSpent;

  // Header Elements
  const heroCard = document.getElementById('budgetHeroCard');
  const alertBanner = document.getElementById('safetyAlertBanner');
  const alertIcon = document.getElementById('safetyAlertIcon');
  const alertText = document.getElementById('safetyAlertText');
  const spentVal = document.getElementById('spentAmountVal');
  const limitVal = document.getElementById('limitAmountVal');
  const progressBar = document.getElementById('budgetProgressBar');
  const pctVal = document.getElementById('budgetPctVal');
  const remainingVal = document.getElementById('remainingAmountVal');
  const cartSummaryText = document.getElementById('cartItemsSummaryText');

  if (spentVal) spentVal.textContent = formatRupiah(totalSpent);
  if (limitVal) limitVal.textContent = formatRupiah(budgetLimit);
  if (pctVal) pctVal.textContent = `${pct.toFixed(1)}% terpakai`;
  if (remainingVal) {
    if (remaining >= 0) {
      remainingVal.textContent = `Sisa ${formatRupiah(remaining)}`;
      remainingVal.style.color = 'var(--slate-600)';
    } else {
      remainingVal.textContent = `Defisit ${formatRupiah(Math.abs(remaining))}`;
      remainingVal.style.color = 'var(--danger-600)';
    }
  }

  if (cartSummaryText) {
    cartSummaryText.textContent = `${totals.totalItemsCount} Barang di Keranjang (${formatRupiah(totalSpent)})`;
  }

  if (progressBar) {
    progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  }

  // Thresholds: Safe (<80%), Warning (>=80%), Cap (=100%), Danger (>100%)
  if (pct > 100) {
    if (heroCard) heroCard.className = 'budget-hero-card state-danger';
    if (alertBanner) alertBanner.className = 'safety-alert-banner banner-danger';
    if (progressBar) progressBar.className = 'budget-progress-fill progress-danger';
    if (alertIcon) {
      alertIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }
    if (alertText) {
      alertText.innerHTML = `<strong>BAHAYA OVERBUDGET:</strong> Total belanja melebihi batas uang tunai! Kurangi kuantitas atau tunda pembelian barang sekunder.`;
    }
  } else if (pct === 100) {
    if (heroCard) heroCard.className = 'budget-hero-card state-cap';
    if (alertBanner) alertBanner.className = 'safety-alert-banner banner-cap';
    if (progressBar) progressBar.className = 'budget-progress-fill progress-cap';
    if (alertIcon) {
      alertIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    }
    if (alertText) {
      alertText.innerHTML = `<strong>BATAS SAKU PAS (100%):</strong> Total belanja tepat mencapai batas anggaran ${formatRupiah(budgetLimit)}. Tidak ada sisa uang tunai!`;
    }
  } else if (pct >= 80) {
    if (heroCard) heroCard.className = 'budget-hero-card state-warning';
    if (alertBanner) alertBanner.className = 'safety-alert-banner banner-warning';
    if (progressBar) progressBar.className = 'budget-progress-fill progress-warning';
    if (alertIcon) {
      alertIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    }
    if (alertText) {
      alertText.innerHTML = `<strong>Peringatan Waspada (&ge; 80%):</strong> Total belanja sudah mencapai ${pct.toFixed(1)}% dari dompet. Periksa kembali keranjang Anda.`;
    }
  } else {
    if (heroCard) heroCard.className = 'budget-hero-card state-safe';
    if (alertBanner) alertBanner.className = 'safety-alert-banner banner-safe';
    if (progressBar) progressBar.className = 'budget-progress-fill progress-safe';
    if (alertIcon) {
      alertIcon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`;
    }
    if (alertText) {
      alertText.innerHTML = `<strong>Dompet Aman:</strong> Anggaran belanja terkendali (${pct.toFixed(1)}%). Sisa saldo mencukupi.`;
    }
  }

  // Dashboard Overview Elements
  const dashTotalItems = document.getElementById('dashTotalItems');
  const dashItemsStatus = document.getElementById('dashItemsStatus');
  const dashTotalEst = document.getElementById('dashTotalEst');
  const dashActualSpent = document.getElementById('dashActualSpent');
  const dashRemaining = document.getElementById('dashRemainingBudget');
  const dashBudgetPct = document.getElementById('dashBudgetPctDesc');
  const navCartCount = document.getElementById('navCartCount');

  if (dashTotalItems) dashTotalItems.textContent = `${totals.totalItemsCount} Barang`;
  if (dashItemsStatus) dashItemsStatus.textContent = `${totals.purchasedCount} dibeli / ${totals.unpurchasedCount} belum`;
  if (dashTotalEst) dashTotalEst.textContent = formatRupiah(totalSpent);
  if (dashActualSpent) dashActualSpent.textContent = formatRupiah(totals.totalPurchased);
  if (dashRemaining) dashRemaining.textContent = formatRupiah(remaining);
  if (dashBudgetPct) {
    dashBudgetPct.textContent = remaining >= 0 ? `${(100 - pct).toFixed(1)}% tersisa` : `Defisit ${Math.abs(100 - pct).toFixed(1)}%`;
  }
  if (navCartCount) navCartCount.textContent = String(totals.totalItemsCount);

  // Fluctuation Badges
  const elUp = document.getElementById('dashCountUp');
  const elDown = document.getElementById('dashCountDown');
  const elEqual = document.getElementById('dashCountEqual');
  if (elUp) elUp.textContent = `${totals.countUp} Barang`;
  if (elDown) elDown.textContent = `${totals.countDown} Barang`;
  if (elEqual) elEqual.textContent = `${totals.countEqual} Barang`;

  // Update Astro Floating Tray
  updateAstroFloatingCart(totals);
  renderDashRecentHistory();
}

function updateAstroFloatingCart(totals) {
  const tray = document.getElementById('astroFloatingCart');
  const countBadge = document.getElementById('floatingCartCount');
  const totalVal = document.getElementById('floatingCartTotal');

  if (!tray) return;

  if (totals.totalItemsCount > 0 && activeNavTab !== 'belanja') {
    tray.style.display = 'flex';
    if (countBadge) countBadge.textContent = String(totals.totalItemsCount);
    if (totalVal) totalVal.textContent = formatRupiah(totals.totalAll);
  } else {
    tray.style.display = 'none';
  }
}

// ==========================================================
// 6. GROCERY LIST RENDERING & REACITIVTY (SRS F-01 & F-02)
// ==========================================================

function renderItemsList() {
  const container = document.getElementById('itemListContainer');
  if (!container) return;

  const searchInput = document.getElementById('searchItemInput');
  const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const filterStore = document.getElementById('filterStoreSelect');
  const selectedStore = filterStore ? filterStore.value : 'ALL';

  const filterStatus = document.getElementById('filterStatusSelect');
  const selectedStatus = filterStatus ? filterStatus.value : 'ALL';

  const filtered = cartItems.filter(item => {
    if (activeCategory !== 'ALL' && item.category !== activeCategory) return false;
    if (selectedStore !== 'ALL' && !item.store.toLowerCase().includes(selectedStore.toLowerCase())) return false;
    if (selectedStatus === 'PURCHASED' && !item.purchased) return false;
    if (selectedStatus === 'UNPURCHASED' && item.purchased) return false;

    if (searchQuery) {
      const matchName = item.name.toLowerCase().includes(searchQuery);
      const matchStore = (item.store || '').toLowerCase().includes(searchQuery);
      if (!matchName && !matchStore) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon">🛒</div>
        <h4>Keranjang Masih Kosong</h4>
        <p>Yuk tambah barang kebutuhan belanjaan Anda sekarang.</p>
        <button type="button" class="btn-sm-primary" onclick="openAddItemModal()">+ Tambah Barang</button>
      </div>
    `;
    return;
  }

  let html = '';
  filtered.forEach(item => {
    const qty = Math.max(1, Number(item.qty) || 1);
    const discInfo = calculateCompoundDiscount(item.price, item.discountInput);
    const subtotal = discInfo.unitPriceFinal * qty;
    const trend = comparePriceTrend(item.price, item.priceLastMonth);

    let trendBadge = '';
    if (trend.status === 'UP') {
      trendBadge = `<span class="price-trend-tag trend-up" title="Harga naik dibanding bulan lalu">↑ +${formatRupiah(trend.diffNominal)}</span>`;
    } else if (trend.status === 'DOWN') {
      trendBadge = `<span class="price-trend-tag trend-down" title="Harga turun / hemat">↓ -${formatRupiah(Math.abs(trend.diffNominal))}</span>`;
    } else {
      trendBadge = `<span class="price-trend-tag trend-equal" title="Harga stabil">= Tetap</span>`;
    }

    let promoBadge = '';
    if (discInfo.label) {
      promoBadge = `<span class="item-promo-badge">${discInfo.label}</span>`;
    }

    html += `
      <div class="item-card ${item.purchased ? 'item-card-purchased' : ''}" id="card_${item.id}">
        <div class="item-card-header">
          <div class="item-title-col">
            <input type="checkbox" class="custom-checkbox" ${item.purchased ? 'checked' : ''} onchange="toggleItemPurchased('${item.id}')" title="Tandai sudah dibeli">
            <div>
              <div class="item-name">${escapeHtml(item.name)}</div>
              <div class="item-meta-sub">
                <span class="item-meta-pill">${escapeHtml(item.store || 'Supermarket')}</span>
                ${trendBadge}
                ${promoBadge}
              </div>
            </div>
          </div>
          <div class="item-actions-col">
            <button type="button" class="btn-item-action" onclick="openEditModal('${item.id}')" title="Edit Barang">✏️</button>
            <button type="button" class="btn-item-action btn-item-delete" onclick="promptDeleteItem('${item.id}')" title="Hapus Barang">🗑️</button>
          </div>
        </div>

        <div class="item-card-body">
          <!-- Stepper Quantity with Instant Reactivity (SRS F-02) -->
          <div class="stepper-control">
            <button type="button" class="btn-step" onclick="changeQty('${item.id}', -1)" title="Kurang 1">−</button>
            <span class="stepper-qty">${qty}</span>
            <span class="stepper-unit">${escapeHtml(item.unit || 'pcs')}</span>
            <button type="button" class="btn-step" onclick="changeQty('${item.id}', 1)" title="Tambah 1">+</button>
          </div>

          <!-- Price & Subtotal -->
          <div class="item-price-col">
            <div class="item-subtotal">${formatRupiah(subtotal)}</div>
            <div class="item-unit-note">
              @ ${formatRupiah(discInfo.unitPriceFinal)} / ${escapeHtml(item.unit || 'pcs')}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function changeQty(itemId, delta) {
  const item = cartItems.find(i => i.id === itemId);
  if (!item) return;

  const currentQty = Number(item.qty) || 1;
  const newQty = Math.max(1, currentQty + delta);
  if (currentQty === newQty) return;

  item.qty = newQty;
  saveUserState();
  renderItemsList();
  updateBudgetSafetyCap();
}

function toggleItemPurchased(itemId) {
  const item = cartItems.find(i => i.id === itemId);
  if (!item) return;

  item.purchased = !item.purchased;
  saveUserState();
  renderItemsList();
  updateBudgetSafetyCap();
  showToast(item.purchased ? `✅ ${item.name} ditandai sudah dibeli` : `⏳ ${item.name} dikembalikan ke belum dibeli`, 'success');
}

function promptDeleteItem(itemId) {
  const item = cartItems.find(i => i.id === itemId);
  if (!item) return;

  itemToDeleteId = itemId;
  const modal = document.getElementById('deleteConfirmModal');
  const msg = document.getElementById('deleteConfirmMessage');
  if (msg) msg.textContent = `Apakah Anda yakin ingin menghapus "${item.name}" dari keranjang?`;
  if (modal) modal.classList.add('open');
}

function closeDeleteModal() {
  itemToDeleteId = null;
  const modal = document.getElementById('deleteConfirmModal');
  if (modal) modal.classList.remove('open');
}

function executeDelete() {
  if (!itemToDeleteId) return;
  const deletedItem = cartItems.find(i => i.id === itemToDeleteId);
  cartItems = cartItems.filter(i => i.id !== itemToDeleteId);

  closeDeleteModal();
  saveUserState();
  renderItemsList();
  updateBudgetSafetyCap();
  showToast(`🗑️ ${deletedItem ? deletedItem.name : 'Barang'} berhasil dihapus`, 'info');
}

// ==========================================================
// 7. ITEM MODAL (ADD / EDIT)
// ==========================================================

function openAddItemModal() {
  document.getElementById('editItemId').value = '';
  document.getElementById('itemModalTitle').textContent = 'Tambah Belanjaan Baru';
  document.getElementById('formItemName').value = '';
  document.getElementById('formItemCategory').value = 'Bahan Pokok';
  document.getElementById('formItemStore').value = 'Lotte Mart - Puri Indah';
  document.getElementById('formItemQty').value = '1';
  document.getElementById('formItemUnit').value = 'pcs';
  document.getElementById('formItemPrice').value = '';
  document.getElementById('formItemPriceLastMonth').value = '';
  document.getElementById('formItemDiscount').value = '';
  document.getElementById('formItemPurchased').value = 'false';

  updateModalLivePreview();
  const modal = document.getElementById('itemModal');
  if (modal) modal.classList.add('open');
}

function openEditModal(itemId) {
  const item = cartItems.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('editItemId').value = item.id;
  document.getElementById('itemModalTitle').textContent = 'Edit Belanjaan';
  document.getElementById('formItemName').value = item.name;
  document.getElementById('formItemCategory').value = item.category || 'Bahan Pokok';
  document.getElementById('formItemStore').value = item.store || 'Lotte Mart - Puri Indah';
  document.getElementById('formItemQty').value = item.qty || 1;
  document.getElementById('formItemUnit').value = item.unit || 'pcs';
  document.getElementById('formItemPrice').value = item.price || 0;
  document.getElementById('formItemPriceLastMonth').value = item.priceLastMonth || '';
  document.getElementById('formItemDiscount').value = item.discountInput || '';
  document.getElementById('formItemPurchased').value = item.purchased ? 'true' : 'false';

  updateModalLivePreview();
  const modal = document.getElementById('itemModal');
  if (modal) modal.classList.add('open');
}

function closeItemModal() {
  const modal = document.getElementById('itemModal');
  if (modal) modal.classList.remove('open');
}

function updateModalLivePreview() {
  const price = Number(document.getElementById('formItemPrice').value) || 0;
  const lastPrice = Number(document.getElementById('formItemPriceLastMonth').value) || 0;
  const qty = Math.max(1, Number(document.getElementById('formItemQty').value) || 1);
  const discountInput = document.getElementById('formItemDiscount').value || '';

  const discInfo = calculateCompoundDiscount(price, discountInput);
  const subtotal = discInfo.unitPriceFinal * qty;
  const trend = comparePriceTrend(price, lastPrice);

  const prevUnit = document.getElementById('previewEffectiveUnit');
  const prevTrend = document.getElementById('previewPriceTrend');
  const prevSubtotal = document.getElementById('previewSubtotalVal');

  if (prevUnit) prevUnit.textContent = `${formatRupiah(discInfo.unitPriceFinal)} ${discInfo.label ? `(${discInfo.label})` : ''}`;
  if (prevSubtotal) prevSubtotal.textContent = formatRupiah(subtotal);

  if (prevTrend) {
    if (trend.status === 'UP') {
      prevTrend.innerHTML = `<span class="price-trend-tag trend-up">↑ Naik (+${formatRupiah(trend.diffNominal)})</span>`;
    } else if (trend.status === 'DOWN') {
      prevTrend.innerHTML = `<span class="price-trend-tag trend-down">↓ Turun (-${formatRupiah(Math.abs(trend.diffNominal))})</span>`;
    } else {
      prevTrend.innerHTML = `<span class="price-trend-tag trend-equal">= Stabil</span>`;
    }
  }
}

function saveItemForm(e) {
  e.preventDefault();
  const editId = document.getElementById('editItemId').value;
  const name = document.getElementById('formItemName').value.trim();
  const category = document.getElementById('formItemCategory').value;
  const store = document.getElementById('formItemStore').value.trim() || 'Supermarket';
  const qty = Math.max(1, parseInt(document.getElementById('formItemQty').value, 10) || 1);
  const unit = document.getElementById('formItemUnit').value;
  const price = Math.max(0, parseFloat(document.getElementById('formItemPrice').value) || 0);
  const priceLastMonth = parseFloat(document.getElementById('formItemPriceLastMonth').value) || price;
  const discountInput = document.getElementById('formItemDiscount').value.trim();
  const purchased = document.getElementById('formItemPurchased').value === 'true';

  if (!name) {
    showToast('Nama produk wajib diisi', 'error');
    return;
  }

  if (editId) {
    const item = cartItems.find(i => i.id === editId);
    if (item) {
      item.name = name;
      item.category = category;
      item.store = store;
      item.qty = qty;
      item.unit = unit;
      item.price = price;
      item.priceLastMonth = priceLastMonth;
      item.discountInput = discountInput;
      item.purchased = purchased;
      showToast(`✅ "${name}" berhasil diperbarui`, 'success');
    }
  } else {
    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      name,
      category,
      store,
      qty,
      unit,
      price,
      priceLastMonth,
      discountInput,
      purchased
    };
    cartItems.unshift(newItem);
    showToast(`✅ "${name}" berhasil dimasukkan ke keranjang`, 'success');
  }

  closeItemModal();
  saveUserState();
  renderItemsList();
  updateBudgetSafetyCap();
}

// ==========================================================
// 8. RIWAYAT BELANJA (SHOPPING HISTORY ALA ASTRO)
// ==========================================================

function finalizeShoppingSession() {
  if (cartItems.length === 0) {
    showToast('Keranjang belanja kosong!', 'error');
    return;
  }

  const totals = calculateCartTotals();
  let totalSavings = 0;

  const orderItems = cartItems.map(item => {
    const qty = Math.max(1, Number(item.qty) || 1);
    const disc = calculateCompoundDiscount(item.price, item.discountInput);
    const subtotal = disc.unitPriceFinal * qty;
    const savings = (item.price - disc.unitPriceFinal) * qty;
    totalSavings += savings;
    return {
      name: item.name,
      qty: qty,
      unit: item.unit || 'pcs',
      price: item.price,
      discountInput: item.discountInput,
      unitFinal: disc.unitPriceFinal,
      subtotal: subtotal
    };
  });

  const orderId = `AST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
  const sessionRecord = {
    id: orderId,
    date: new Date().toISOString(),
    items: orderItems,
    totalSpent: totals.totalAll,
    budgetLimit: budgetLimit,
    remaining: budgetLimit - totals.totalAll,
    totalSavings: totalSavings,
    itemsCount: totals.totalItemsCount,
    store: cartItems[0]?.store || 'Supermarket'
  };

  shoppingHistory.unshift(sessionRecord);
  saveUserState();
  renderHistoryList();
  renderDashRecentHistory();
  showToast('🎉 Sesi belanja berhasil diselesaikan dan dicatat ke Riwayat!', 'success');
  openReceiptModal();
}

function renderHistoryList() {
  const container = document.getElementById('historyListContainer');
  if (!container) return;

  if (shoppingHistory.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon">📜</div>
        <h4>Belum Ada Riwayat Belanja</h4>
        <p>Setelah Anda berbelanja dan menyelesaikan pesanan, struk transaksi akan otomatis tersimpan rapi di sini.</p>
        <button type="button" class="btn-sm-primary" onclick="switchNavTab('belanja')">Mulai Belanja ➜</button>
      </div>
    `;
    return;
  }

  let html = '';
  shoppingHistory.forEach((rec, idx) => {
    const dateFormatted = new Date(rec.date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsSummary = rec.items && rec.items.length > 0
      ? rec.items.map(i => `${i.name} (${i.qty} ${i.unit || 'pcs'})`).slice(0, 3).join(', ') + (rec.items.length > 3 ? '...' : '')
      : 'Beberapa barang belanjaan';

    html += `
      <div class="history-order-card">
        <div class="history-order-header">
          <div>
            <span class="order-code-badge">#${escapeHtml(rec.id || `ORD-${idx}`)}</span>
            <div class="order-store-name">${escapeHtml(rec.store || 'Astro Grocery')}</div>
          </div>
          <div class="order-date-text">${dateFormatted}</div>
        </div>

        <div class="history-items-summary">
          📦 <strong>${rec.itemsCount || (rec.items ? rec.items.length : 0)} Barang:</strong> ${escapeHtml(itemsSummary)}
        </div>

        <div class="history-bill-row">
          <span>Total Tagihan:</span>
          <strong>${formatRupiah(rec.totalSpent)}</strong>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--slate-500);">
          <span>Batas Saku: ${formatRupiah(rec.budgetLimit || DEFAULT_BUDGET)}</span>
          <span style="color: ${rec.remaining >= 0 ? 'var(--primary-700)' : 'var(--danger-600)'}">
            ${rec.remaining >= 0 ? 'Sisa ' + formatRupiah(rec.remaining) : 'Defisit ' + formatRupiah(Math.abs(rec.remaining))}
          </span>
        </div>

        <div class="history-actions-row">
          <button type="button" class="btn-reorder-astro" onclick="reorderHistory(${idx})" title="Salin barang belanjaan ini ke keranjang aktif">
            🔄 Beli Lagi
          </button>
          <button type="button" class="btn-receipt-history" onclick="viewHistoryReceipt(${idx})" title="Lihat Struk Digital">
            📄 Struk
          </button>
          <button type="button" class="btn-sm-danger" onclick="deleteHistoryItem(${idx})" title="Hapus catatan ini">
            🗑️
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderDashRecentHistory() {
  const box = document.getElementById('dashRecentHistoryBox');
  if (!box) return;

  if (shoppingHistory.length === 0) {
    box.innerHTML = `
      <div style="font-size: 12px; color: var(--slate-500); padding: 8px 0; text-align: center;">
        Belum ada riwayat belanja tercatat. Belanja sekarang untuk membuat struk pertama Anda!
      </div>
    `;
    return;
  }

  const latest = shoppingHistory[0];
  const dateFormatted = new Date(latest.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  box.innerHTML = `
    <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: var(--radius-md); padding: 10px 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span class="order-code-badge">#${escapeHtml(latest.id)}</span>
        <small style="color: var(--slate-500);">${dateFormatted}</small>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
        <div>
          <div style="font-weight: 700; font-size: 13px; color: var(--slate-900);">${escapeHtml(latest.store || 'Supermarket')}</div>
          <small style="color: var(--slate-500);">${latest.itemsCount || 1} Barang Belanjaan</small>
        </div>
        <div style="text-align: right;">
          <strong style="color: var(--primary-700); font-family: var(--font-mono); font-size: 14px;">${formatRupiah(latest.totalSpent)}</strong>
          <div><button type="button" class="btn-text-link" onclick="reorderHistory(0)">🔄 Beli Lagi</button></div>
        </div>
      </div>
    </div>
  `;
}

function reorderHistory(index) {
  const session = shoppingHistory[index];
  if (!session || !session.items) return;

  const newItems = session.items.map(i => ({
    id: 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: i.name,
    category: 'Bahan Pokok',
    store: session.store || 'Lotte Mart - Puri Indah',
    qty: i.qty || 1,
    unit: i.unit || 'pcs',
    price: i.price,
    priceLastMonth: i.price,
    discountInput: i.discountInput || '',
    purchased: false
  }));

  cartItems = newItems;
  saveUserState();
  renderItemsList();
  updateBudgetSafetyCap();
  switchNavTab('belanja');
  showToast(`✓ Berhasil memuat ${newItems.length} barang dari riwayat ke keranjang!`, 'success');
}

function viewHistoryReceipt(index) {
  const session = shoppingHistory[index];
  if (!session) return;

  const receiptEl = document.getElementById('receiptContent');
  if (!receiptEl) return;

  const dateFormatted = new Date(session.date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let itemsRows = '';
  session.items.forEach(item => {
    itemsRows += `
      <div style="margin-bottom: 6px;">
        <div class="receipt-row">
          <span>${escapeHtml(item.name)}</span>
          <strong>${formatRupiah(item.subtotal || (item.unitFinal * item.qty))}</strong>
        </div>
        <div style="font-size: 10px; color: #64748b;">
          ${item.qty} ${item.unit || 'pcs'} x ${formatRupiah(item.unitFinal || item.price)}
          ${item.discountInput ? `[Promo ${item.discountInput}]` : ''}
        </div>
      </div>
    `;
  });

  receiptEl.innerHTML = `
    <h4>SMART GROCERY TRUCKER</h4>
    <div style="text-align: center; font-size: 10.5px; color: #64748b; margin-bottom: 6px;">
      Struk Belanja Digital • Astro Edition<br>
      ID Pesanan: #${escapeHtml(session.id)}<br>
      ${dateFormatted}
    </div>
    <div class="receipt-divider"></div>
    ${itemsRows}
    <div class="receipt-divider"></div>
    <div class="receipt-row">
      <span>Total Belanja:</span>
      <strong>${formatRupiah(session.totalSpent)}</strong>
    </div>
    <div class="receipt-row">
      <span>Batas Uang Saku:</span>
      <span>${formatRupiah(session.budgetLimit || DEFAULT_BUDGET)}</span>
    </div>
    <div class="receipt-row">
      <span>Sisa Anggaran:</span>
      <strong style="color: ${session.remaining >= 0 ? 'var(--primary-700)' : 'var(--danger-600)'}">
        ${formatRupiah(session.remaining)}
      </strong>
    </div>
    <div class="receipt-divider"></div>
    <div style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 6px;">
      Terima kasih telah berbelanja cerdas dan menjaga batas dompet Anda!
    </div>
  `;

  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.add('open');
}

function deleteHistoryItem(index) {
  shoppingHistory.splice(index, 1);
  saveUserState();
  renderHistoryList();
  renderDashRecentHistory();
  showToast('Riwayat belanja dihapus', 'info');
}

function clearAllHistory() {
  if (shoppingHistory.length === 0) return;
  if (!confirm('Apakah Anda yakin ingin menghapus seluruh riwayat belanja?')) return;

  shoppingHistory = [];
  saveUserState();
  renderHistoryList();
  renderDashRecentHistory();
  showToast('Seluruh riwayat belanja telah dikosongkan', 'info');
}

// ==========================================================
// 9. PRICE TRACKER & STORE COMPARISON
// ==========================================================

function openAddPriceModal() {
  const modal = document.getElementById('priceLogModal');
  if (modal) modal.classList.add('open');
}

function closeAddPriceModal() {
  const modal = document.getElementById('priceLogModal');
  if (modal) modal.classList.remove('open');
}

function savePriceLogForm(e) {
  e.preventDefault();
  const itemName = document.getElementById('logItemName').value.trim();
  const store = document.getElementById('logStoreName').value.trim();
  const location = document.getElementById('logLocation').value.trim();
  const price = parseFloat(document.getElementById('logPrice').value) || 0;
  const unit = document.getElementById('logUnit').value.trim() || 'kg';
  const notes = document.getElementById('logNotes').value.trim();

  if (!itemName || !store || price <= 0) {
    showToast('Mohon lengkapi nama barang, toko, dan harga', 'error');
    return;
  }

  const newLog = {
    id: 'pl_' + Date.now(),
    itemName,
    store,
    location,
    price,
    unit,
    priceLastMonth: price,
    date: new Date().toISOString().split('T')[0],
    notes: notes || 'Pencatatan harga manual'
  };

  priceLogs.unshift(newLog);
  closeAddPriceModal();
  saveUserState();
  renderPriceTrackerView();
  showToast(`📈 Harga "${itemName}" di ${store} berhasil dicatat`, 'success');
}

function renderPriceTrackerView() {
  renderPriceTrendChart();
  renderStoreComparison();
  renderPriceLogsList();
}

function renderPriceTrendChart() {
  const svg = document.getElementById('priceTrendSvg');
  if (!svg) return;

  svg.innerHTML = `
    <!-- Grid Lines -->
    <line x1="30" y1="20" x2="360" y2="20" stroke="#e2e8f0" stroke-dasharray="4" />
    <line x1="30" y1="60" x2="360" y2="60" stroke="#e2e8f0" stroke-dasharray="4" />
    <line x1="30" y1="100" x2="360" y2="100" stroke="#e2e8f0" stroke-dasharray="4" />
    <line x1="30" y1="140" x2="360" y2="140" stroke="#cbd5e1" />

    <!-- Beras Ramos Trend Line (Up 68k -> 74k) -->
    <polyline points="40,110 140,105 240,90 340,50" fill="none" stroke="#00A86B" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="40" cy="110" r="4.5" fill="#00A86B" />
    <circle cx="140" cy="105" r="4" fill="#00A86B" />
    <circle cx="240" cy="90" r="4" fill="#00A86B" />
    <circle cx="340" cy="50" r="6" fill="#00875A" stroke="#ffffff" stroke-width="2" />
    <text x="345" y="45" font-size="10" fill="#00875A" font-weight="bold">Rp 74k (↑)</text>

    <!-- Minyak 2L Trend Line (Stable 43k) -->
    <polyline points="40,85 140,85 240,85 340,85" fill="none" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 3" />
    <circle cx="340" cy="85" r="5" fill="#2563eb" stroke="#ffffff" stroke-width="2" />
    <text x="345" y="82" font-size="10" fill="#2563eb" font-weight="bold">Rp 43k (=)</text>

    <!-- Telur Ayam Trend Line (Down 32k -> 28k) -->
    <polyline points="40,70 140,78 240,100 340,125" fill="none" stroke="#d97706" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="40" cy="70" r="4.5" fill="#d97706" />
    <circle cx="140" cy="78" r="4" fill="#d97706" />
    <circle cx="240" cy="100" r="4" fill="#d97706" />
    <circle cx="340" cy="125" r="6" fill="#b45309" stroke="#ffffff" stroke-width="2" />
    <text x="345" y="138" font-size="10" fill="#b45309" font-weight="bold">Rp 28k (↓)</text>
  `;
}

function renderStoreComparison() {
  const container = document.getElementById('storeComparisonContainer');
  if (!container) return;

  const comparisonData = [
    {
      item: 'Beras Ramos 5kg',
      unit: 'sak',
      stores: [
        { name: 'Lotte Mart', price: 74000, isBest: false },
        { name: 'Superindo', price: 72500, isBest: false },
        { name: 'Pasar Anyar', price: 70000, isBest: true }
      ]
    },
    {
      item: 'Minyak Goreng 2L',
      unit: 'pouch',
      stores: [
        { name: 'Lotte Mart', price: 43000, isBest: false },
        { name: 'Superindo', price: 41500, isBest: true },
        { name: 'Pasar Anyar', price: 42000, isBest: false }
      ]
    },
    {
      item: 'Telur Ayam 1kg',
      unit: 'kg',
      stores: [
        { name: 'Lotte Mart', price: 28000, isBest: false },
        { name: 'Superindo', price: 28500, isBest: false },
        { name: 'Pasar Anyar', price: 27000, isBest: true }
      ]
    }
  ];

  let html = '';
  comparisonData.forEach(comp => {
    html += `
      <div class="store-comp-card">
        <div class="store-comp-title">
          <span>📦 ${escapeHtml(comp.item)}</span>
          <small style="color:var(--slate-500)">per ${comp.unit}</small>
        </div>
        <div class="store-prices-row">
          ${comp.stores.map(s => `
            <div class="store-price-cell ${s.isBest ? 'best-price' : ''}">
              <small>${escapeHtml(s.name)} ${s.isBest ? '⭐ Termurah' : ''}</small>
              <strong>${formatRupiah(s.price)}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function renderPriceLogsList() {
  const container = document.getElementById('priceLogContainer');
  if (!container) return;

  if (priceLogs.length === 0) {
    container.innerHTML = `<div style="font-size:12px;color:var(--slate-500);text-align:center;padding:12px;">Belum ada catatan harga tersimpan.</div>`;
    return;
  }

  let html = '';
  priceLogs.slice(0, 6).forEach(log => {
    html += `
      <div class="price-log-item">
        <div>
          <strong>${escapeHtml(log.itemName)}</strong>
          <div class="price-log-meta">${escapeHtml(log.store)} • ${log.date || 'Hari ini'}</div>
        </div>
        <div style="text-align:right;">
          <strong style="color:var(--primary-700)">${formatRupiah(log.price)}</strong>
          <div class="price-log-meta">/${escapeHtml(log.unit || 'unit')}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ==========================================================
// 10. SMART DISCOUNT & PACKAGING COMPARISON CALCULATOR (TAB 4)
// ==========================================================

function runDiscountCalculator() {
  const basePrice = parseFloat(document.getElementById('calcBasePrice').value) || 0;
  const promoInput = document.getElementById('calcDiscountInput').value || '';

  const result = calculateCompoundDiscount(basePrice, promoInput);

  const labelEl = document.getElementById('calcPromoLabel');
  const finalPriceEl = document.getElementById('calcFinalPriceVal');
  const stepsEl = document.getElementById('calcBreakdownSteps');
  const initPriceEl = document.getElementById('calcInitialPriceVal');
  const savingsEl = document.getElementById('calcTotalSavingsVal');

  if (labelEl) labelEl.textContent = result.label || 'Harga Normal (Tanpa Promo)';
  if (finalPriceEl) finalPriceEl.textContent = formatRupiah(result.unitPriceFinal);
  if (initPriceEl) initPriceEl.textContent = formatRupiah(basePrice);
  if (savingsEl) {
    savingsEl.textContent = `${formatRupiah(result.discountNominalPerUnit)} (${result.effectivePercent.toFixed(1)}%)`;
  }

  if (stepsEl) {
    if (result.steps.length === 0) {
      stepsEl.innerHTML = `<div style="color:var(--slate-500);font-size:11.5px;">Masukkan format diskon tunggal (contoh: 25%) atau diskon bertumpuk (contoh: 50% + 20%).</div>`;
    } else {
      let stepHtml = '';
      result.steps.forEach(st => {
        stepHtml += `
          <div class="step-card">
            <span>${escapeHtml(st.description)}</span>
          </div>
        `;
      });
      stepsEl.innerHTML = stepHtml;
    }
  }
}

function setCalcPreset(price, discountStr) {
  document.getElementById('calcBasePrice').value = price;
  document.getElementById('calcDiscountInput').value = discountStr;
  runDiscountCalculator();
}

function runUnitPriceComparison() {
  const priceA = parseFloat(document.getElementById('packAPrice').value) || 0;
  const volA = parseFloat(document.getElementById('packAVol').value) || 1;

  const priceB = parseFloat(document.getElementById('packBPrice').value) || 0;
  const volB = parseFloat(document.getElementById('packBVol').value) || 1;

  const unitA = volA > 0 ? priceA / volA : 0;
  const unitB = volB > 0 ? priceB / volB : 0;

  const resA = document.getElementById('packAResult');
  const resB = document.getElementById('packBResult');
  const banner = document.getElementById('packRecommendationBanner');

  if (resA) resA.textContent = `${formatRupiah(unitA)} / unit`;
  if (resB) resB.textContent = `${formatRupiah(unitB)} / unit`;

  if (banner) {
    if (unitA < unitB) {
      const diff = unitB - unitA;
      const pct = (diff / unitB) * 100;
      banner.innerHTML = `💡 <strong>Rekomendasi Hemat:</strong> Pilihan A (Kemasan Kecil) lebih hemat ${formatRupiah(diff)} per unit (Hemat ${pct.toFixed(1)}%)!`;
      banner.style.borderLeftColor = 'var(--primary-600)';
    } else if (unitB < unitA) {
      const diff = unitA - unitB;
      const pct = (diff / unitA) * 100;
      banner.innerHTML = `💡 <strong>Rekomendasi Hemat:</strong> Pilihan B (Kemasan Jumbo) lebih hemat ${formatRupiah(diff)} per unit (Hemat ${pct.toFixed(1)}%)!`;
      banner.style.borderLeftColor = 'var(--primary-600)';
    } else {
      banner.innerHTML = `⚖️ <strong>Harga Setara:</strong> Kedua pilihan memiliki harga per unit yang persis sama.`;
      banner.style.borderLeftColor = 'var(--slate-400)';
    }
  }
}

// ==========================================================
// 11. DIGITAL RECEIPT MODAL
// ==========================================================

function openReceiptModal() {
  const totals = calculateCartTotals();
  const receiptEl = document.getElementById('receiptContent');
  if (!receiptEl) return;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let itemsRows = '';
  let totalSavings = 0;

  cartItems.forEach(item => {
    const qty = Math.max(1, Number(item.qty) || 1);
    const discInfo = calculateCompoundDiscount(item.price, item.discountInput);
    const subtotal = discInfo.unitPriceFinal * qty;
    const itemSavings = (item.price - discInfo.unitPriceFinal) * qty;
    totalSavings += itemSavings;

    itemsRows += `
      <div style="margin-bottom: 6px;">
        <div class="receipt-row">
          <span>${escapeHtml(item.name)}</span>
          <strong>${formatRupiah(subtotal)}</strong>
        </div>
        <div style="font-size: 10px; color: #64748b;">
          ${qty} ${item.unit || 'pcs'} x ${formatRupiah(discInfo.unitPriceFinal)}
          ${discInfo.label ? `[${discInfo.label}]` : ''}
          ${item.purchased ? '✓ Lunas' : '⏳ Belum'}
        </div>
      </div>
    `;
  });

  receiptEl.innerHTML = `
    <h4>SMART GROCERY TRUCKER</h4>
    <div style="text-align: center; font-size: 10.5px; color: #64748b; margin-bottom: 6px;">
      Struk Belanja Digital • Astro Edition<br>
      ${escapeHtml(currentUser.name || currentUser.username)} • ${dateFormatted}
    </div>
    <div class="receipt-divider"></div>
    ${itemsRows || '<div style="text-align:center;padding:8px;">Belum ada item belanja.</div>'}
    <div class="receipt-divider"></div>
    <div class="receipt-row">
      <span>Total Belanja:</span>
      <strong>${formatRupiah(totals.totalAll)}</strong>
    </div>
    <div class="receipt-row">
      <span>Batas Uang Saku:</span>
      <span>${formatRupiah(budgetLimit)}</span>
    </div>
    <div class="receipt-row">
      <span>Sisa Anggaran:</span>
      <strong style="color: ${budgetLimit >= totals.totalAll ? 'var(--primary-700)' : 'var(--danger-600)'}">
        ${formatRupiah(budgetLimit - totals.totalAll)}
      </strong>
    </div>
    <div class="receipt-row" style="color: #10b981; font-size: 11px; margin-top: 4px;">
      <span>Total Hemat Promo:</span>
      <span>${formatRupiah(totalSavings)}</span>
    </div>
    <div class="receipt-divider"></div>
    <div style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 6px;">
      Simpan struk ini sebagai data histori pembanding harga bulan depan.
    </div>
  `;

  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.add('open');
}

function closeReceiptModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.remove('open');
}

function shareReceiptWhatsApp() {
  const totals = calculateCartTotals();
  let text = `🛒 *STRUK SMART GROCERY TRUCKER*\n`;
  text += `👤 Pembeli: ${currentUser.name || currentUser.username}\n`;
  text += `📅 Tanggal: ${new Date().toLocaleDateString('id-ID')}\n\n`;

  cartItems.forEach(i => {
    const disc = calculateCompoundDiscount(i.price, i.discountInput);
    text += `• ${i.name} (${i.qty} ${i.unit || 'pcs'}): ${formatRupiah(disc.unitPriceFinal * i.qty)}\n`;
  });

  text += `\n💳 *Total Belanja:* ${formatRupiah(totals.totalAll)}`;
  text += `\n💰 *Batas Dompet:* ${formatRupiah(budgetLimit)}`;
  text += `\n🛡️ *Sisa Saldo:* ${formatRupiah(budgetLimit - totals.totalAll)}`;

  const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

// ==========================================================
// 12. AUTHENTICATION & LOGIN/REGISTRATION HANDLERS
// ==========================================================

function handleHeaderAuthClick() {
  if (currentUser && !currentUser.isDemo) {
    switchNavTab('pengaturan');
  } else {
    openAuthModal('login');
  }
}

function openAuthModal(mode = 'login') {
  switchAuthMode(mode);
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('open');
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('open');
  clearAuthAlert();
}

function switchAuthMode(mode) {
  const tabLogin = document.getElementById('authTabLoginBtn');
  const tabRegister = document.getElementById('authTabRegisterBtn');
  const formLogin = document.getElementById('formLogin');
  const formRegister = document.getElementById('formRegister');

  clearAuthAlert();

  if (mode === 'login') {
    if (tabLogin) tabLogin.classList.add('active');
    if (tabRegister) tabRegister.classList.remove('active');
    if (formLogin) formLogin.style.display = 'block';
    if (formRegister) formRegister.style.display = 'none';
  } else {
    if (tabLogin) tabLogin.classList.remove('active');
    if (tabRegister) tabRegister.classList.add('active');
    if (formLogin) formLogin.style.display = 'none';
    if (formRegister) formRegister.style.display = 'block';
  }
}

function showAuthAlert(message, type = 'error') {
  const box = document.getElementById('authAlertBox');
  if (!box) return;
  box.textContent = message;
  box.className = `auth-alert-box ${type === 'error' ? 'auth-alert-error' : 'auth-alert-success'}`;
  box.style.display = 'block';
}

function clearAuthAlert() {
  const box = document.getElementById('authAlertBox');
  if (box) box.style.display = 'none';
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
  }
}

function handleUsernameInput(input) {
  const badge = document.getElementById('regUsernameBadge');
  const username = input.value.trim().toLowerCase();

  clearTimeout(usernameDebounceTimer);

  if (!username) {
    if (badge) {
      badge.textContent = 'Minimal 3 karakter';
      badge.className = 'username-status-badge';
    }
    return;
  }

  if (username.length < 3) {
    if (badge) {
      badge.textContent = 'Terlalu pendek (min 3)';
      badge.className = 'username-status-badge user-status-taken';
    }
    return;
  }

  if (badge) {
    badge.textContent = 'Memeriksa...';
    badge.className = 'username-status-badge';
  }

  usernameDebounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.available) {
          badge.textContent = '✅ Username tersedia!';
          badge.className = 'username-status-badge user-status-avail';
        } else {
          badge.textContent = '❌ Username sudah terpakai!';
          badge.className = 'username-status-badge user-status-taken';
        }
        return;
      }
    } catch (err) {}

    const takenUsernames = ['rian_kos', 'admin', 'user', 'guest'];
    if (takenUsernames.includes(username)) {
      badge.textContent = '❌ Username sudah terpakai!';
      badge.className = 'username-status-badge user-status-taken';
    } else {
      badge.textContent = '✅ Username tersedia!';
      badge.className = 'username-status-badge user-status-avail';
    }
  }, 350);
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;

  if (password !== confirmPassword) {
    showAuthAlert('Konfirmasi password tidak cocok!', 'error');
    return;
  }

  const spinner = document.getElementById('registerSpinner');
  const btnText = document.getElementById('registerBtnText');
  const btn = document.getElementById('btnRegisterSubmit');

  if (spinner) spinner.style.display = 'inline-block';
  if (btnText) btnText.textContent = 'Mendaftarkan...';
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, confirmPassword })
    });

    const data = await res.json();
    if (!res.ok) {
      showAuthAlert(data.message || 'Registrasi gagal', 'error');
      return;
    }

    currentUser = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      name: data.user.name,
      token: data.user.token,
      isDemo: false
    };

    localStorage.setItem('sgt_active_user', JSON.stringify(currentUser));
    loadUserState();
    closeAuthModal();
    switchNavTab('dashboard');
    showToast(`🎉 Selamat datang, ${currentUser.name}!`, 'success');
  } catch (err) {
    const localId = 'usr_' + Date.now();
    currentUser = {
      id: localId,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      name: username,
      token: 'local_' + localId,
      isDemo: false
    };

    localStorage.setItem('sgt_active_user', JSON.stringify(currentUser));
    loadUserState();
    closeAuthModal();
    switchNavTab('dashboard');
    showToast(`🎉 Selamat datang, ${currentUser.name}!`, 'success');
  } finally {
    if (spinner) spinner.style.display = 'none';
    if (btnText) btnText.textContent = 'Daftar Akun Baru';
    if (btn) btn.disabled = false;
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const identifier = document.getElementById('loginIdentifier').value.trim();
  const password = document.getElementById('loginPassword').value;

  const spinner = document.getElementById('loginSpinner');
  const btnText = document.getElementById('loginBtnText');
  const btn = document.getElementById('btnLoginSubmit');

  if (spinner) spinner.style.display = 'inline-block';
  if (btnText) btnText.textContent = 'Memverifikasi...';
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    const data = await res.json();
    if (!res.ok) {
      showAuthAlert(data.message || 'Username atau password salah', 'error');
      return;
    }

    currentUser = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      name: data.user.name,
      token: data.user.token,
      isDemo: false
    };

    localStorage.setItem('sgt_active_user', JSON.stringify(currentUser));
    loadUserState();
    closeAuthModal();
    switchNavTab('dashboard');
    showToast(`👋 Selamat datang kembali, ${currentUser.name}!`, 'success');
  } catch (err) {
    if (identifier.toLowerCase() === 'rian_kos' || identifier.toLowerCase() === 'rian@kos.ac.id') {
      loginDemoAccount();
    } else {
      showAuthAlert('Gagal terhubung ke server. Gunakan tombol Akun Demo.', 'error');
    }
  } finally {
    if (spinner) spinner.style.display = 'none';
    if (btnText) btnText.textContent = 'Masuk Sekarang';
    if (btn) btn.disabled = false;
  }
}

function loginDemoAccount() {
  currentUser = {
    id: 'user_rian_demo',
    username: 'rian_kos',
    email: 'rian@kos.ac.id',
    name: 'Rian Siswa Kos',
    isDemo: true
  };

  localStorage.setItem('sgt_active_user', JSON.stringify(currentUser));
  loadUserState();
  closeAuthModal();
  switchNavTab('dashboard');
  showToast('⚡ Masuk sebagai Akun Demo (Rian Kos)', 'success');
}

function enterDemoMode() {
  loginDemoAccount();
}

function handleGoogleSignIn() {
  const infoEl = document.getElementById('googleOauthInfoText');
  if (infoEl) infoEl.innerHTML = `⏳ Menghubungkan Google OAuth 2.0...`;

  setTimeout(() => {
    currentUser = {
      id: 'usr_g_881239',
      username: 'google_user',
      email: 'user.belanja@gmail.com',
      name: 'Google User',
      provider: 'google',
      isDemo: false
    };

    localStorage.setItem('sgt_active_user', JSON.stringify(currentUser));
    loadUserState();
    closeAuthModal();
    switchNavTab('dashboard');
    showToast('🔒 Berhasil login melalui Akun Google!', 'success');
  }, 600);
}

function handleLogout() {
  localStorage.removeItem('sgt_active_user');
  currentUser = {
    id: 'guest_user',
    username: 'tamu_belanja',
    email: 'tamu@grocery.local',
    name: 'Tamu Belanja',
    isDemo: true
  };
  loadUserState();
  switchNavTab('landing');
  showToast('🚪 Anda telah keluar dari akun.', 'info');
}

// ==========================================================
// 13. NAVIGATION & TABS SWITCHING
// ==========================================================

function switchNavTab(tabName) {
  activeNavTab = tabName;

  const views = ['tabLanding', 'tabDashboard', 'tabBelanja', 'tabTracker', 'tabPromo', 'tabRiwayat', 'tabPengaturan'];
  views.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  let targetId = 'tabDashboard';
  if (tabName === 'landing') targetId = 'tabLanding';
  else if (tabName === 'dashboard') targetId = 'tabDashboard';
  else if (tabName === 'belanja') targetId = 'tabBelanja';
  else if (tabName === 'tracker') targetId = 'tabTracker';
  else if (tabName === 'promo') targetId = 'tabPromo';
  else if (tabName === 'riwayat') targetId = 'tabRiwayat';
  else if (tabName === 'pengaturan') targetId = 'tabPengaturan';

  const targetEl = document.getElementById(targetId);
  if (targetEl) targetEl.classList.add('active');

  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  if (tabName === 'belanja') renderItemsList();
  if (tabName === 'tracker') renderPriceTrackerView();
  if (tabName === 'riwayat') renderHistoryList();
  if (tabName === 'dashboard') renderDashRecentHistory();
  if (tabName === 'promo') {
    runDiscountCalculator();
    runUnitPriceComparison();
  }

  // Update floating cart visibility
  const totals = calculateCartTotals();
  updateAstroFloatingCart(totals);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================================
// 14. TOAST NOTIFICATIONS & UTILITIES
// ==========================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  }, 2800);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==========================================================
// 15. INITIALIZATION & EVENT LISTENERS
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.cat-pill').forEach(pill => {
    pill.addEventListener('click', (e) => {
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      e.target.classList.add('active');
      activeCategory = e.target.getAttribute('data-cat') || 'ALL';
      renderItemsList();
    });
  });

  loadUserState();
  renderItemsList();
  updateBudgetSafetyCap();
  renderPriceTrackerView();
  renderHistoryList();
  renderDashRecentHistory();
  runDiscountCalculator();
  runUnitPriceComparison();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✅ ServiceWorker registered:', reg.scope))
      .catch(err => console.warn('ServiceWorker registration skipped:', err));
  }
});
