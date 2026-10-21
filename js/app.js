/**
 * SMART GROCERY TRUCKERR - CORE APPLICATION LOGIC
 * Standar Kurikulum P12~P14 & Daily Test 2 (DT2) Evaluasi
 * Single User Experience (Rian - Anak Kos Mandiri)
 */

// ==========================================================
// 1. STATE MANAGEMENT & STORAGE
// ==========================================================
const STORAGE_KEYS = {
  CART_ITEMS: 'smart_grocery_cart_items',
  BUDGET_LIMIT: 'smart_grocery_budget_limit',
  SHOPPING_HISTORY: 'smart_grocery_history',
  PRICE_ARCHIVE: 'smart_grocery_price_archive',
  FIREBASE_CONFIG: 'smart_grocery_firebase_config',
  USER_PROFILE: 'smart_grocery_user_profile'
};

const DEFAULT_STATE = {
  budgetLimit: 350000, // Rp 350.000 batas saku bulanan Rian
  userProfile: {
    name: 'Rian (Anak Kos)',
    room: 'Kamar Kos 3x3'
  },
  // Default sample items matching initial grocery setup
  items: [
    {
      id: 'item-1',
      name: 'Minyak Goreng 2L',
      category: 'Bahan Pokok',
      unit: 'liter',
      qty: 3,
      priceCurrent: 43000,
      priceLastMonth: 43000,
      discountStr: '',
      checked: false
    },
    {
      id: 'item-2',
      name: 'Beras Ramos 5kg',
      category: 'Bahan Pokok',
      unit: 'kg',
      qty: 1,
      priceCurrent: 74000,
      priceLastMonth: 68000,
      discountStr: '',
      checked: false
    },
    {
      id: 'item-3',
      name: 'Telur Ayam 1kg',
      category: 'Bahan Pokok',
      unit: 'kg',
      qty: 1,
      priceCurrent: 28000,
      priceLastMonth: 32000,
      discountStr: '',
      checked: false
    },
    {
      id: 'item-4',
      name: 'Garam Dapur 500g',
      category: 'Bumbu Dapur',
      unit: 'pack',
      qty: 1,
      priceCurrent: 5000,
      priceLastMonth: 5000,
      discountStr: '',
      checked: false
    },
    {
      id: 'item-5',
      name: 'Sabun Mandi Cair 450ml',
      category: 'Perawatan Diri',
      unit: 'botol',
      qty: 1,
      priceCurrent: 20000,
      priceLastMonth: 20000,
      discountStr: '25%', // Diskon tunggal
      checked: false
    },
    {
      id: 'item-6',
      name: 'Wajan Anti Lengket 24cm',
      category: 'Peralatan Rumah',
      unit: 'pcs',
      qty: 1,
      priceCurrent: 100000,
      priceLastMonth: 100000,
      discountStr: '50% + 20%', // Diskon bertingkat kompound
      checked: false
    }
  ]
};

let appState = {
  budgetLimit: DEFAULT_STATE.budgetLimit,
  userProfile: { ...DEFAULT_STATE.userProfile },
  items: [],
  history: [],
  priceArchive: {},
  activeCategory: 'ALL',
  searchQuery: '',
  firebaseConfig: null,
  firebaseOnline: false
};

// ==========================================================
// 2. MATHEMATICAL HELPERS (F-02 & F-03 SPECIFICATIONS)
// ==========================================================

/**
 * Format number into Indonesian Rupiah format
 */
function formatRupiah(amount) {
  const rounded = Math.round(Number(amount) || 0);
  return 'Rp ' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Format plain number
 */
function formatNumber(amount) {
  const rounded = Math.round(Number(amount) || 0);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * SRS F-03: Formula Diskon Bertingkat Kompound & Potongan Langsung
 * Mendukung input:
 * - "25%" -> diskon tunggal
 * - "50% + 20%" atau "50%+20%" -> diskon bertingkat (50% lalu 20% dari sisa)
 * - "80% + 20%" -> diskon bertingkat
 * - "Rp 15.000" atau "15000" -> diskon nominal langsung
 */
function calculateCompoundDiscount(basePrice, discountInput) {
  const price = Number(basePrice) || 0;
  if (!discountInput || typeof discountInput !== 'string') {
    return {
      unitPriceFinal: price,
      discountNominalPerUnit: 0,
      effectivePercent: 0,
      label: ''
    };
  }

  const clean = discountInput.trim();
  if (!clean) {
    return {
      unitPriceFinal: price,
      discountNominalPerUnit: 0,
      effectivePercent: 0,
      label: ''
    };
  }

  // 1. Direct Nominal Discount (e.g. "Rp 15.000", "Rp15000", "15000" without %)
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
      label: `Potongan ${formatRupiah(nominalDisc)}`
    };
  }

  // 2. Compound Percentages (e.g. "50% + 20%" or "25%")
  const parts = clean.split('+').map(p => parseFloat(p.replace(/[^\d\.]/g, ''))).filter(p => !isNaN(p) && p > 0);
  if (parts.length === 0) {
    return {
      unitPriceFinal: price,
      discountNominalPerUnit: 0,
      effectivePercent: 0,
      label: ''
    };
  }

  let runningPrice = price;
  const labelParts = [];
  for (const pct of parts) {
    const cut = runningPrice * (pct / 100);
    runningPrice = Math.max(0, runningPrice - cut);
    labelParts.push(`${pct}%`);
  }

  const finalUnitPrice = Math.round(runningPrice);
  const totalDiscountNominal = Math.round(price - finalUnitPrice);
  const effectivePct = price > 0 ? ((totalDiscountNominal / price) * 100) : 0;

  return {
    unitPriceFinal: finalUnitPrice,
    discountNominalPerUnit: totalDiscountNominal,
    effectivePercent: effectivePct,
    label: parts.length > 1 ? `Promo ${labelParts.join(' + ')}` : `Diskon ${parts[0]}%`
  };
}

/**
 * SRS F-04: Komparator Fluktuasi Harga Realtime vs Bulan Lalu
 * Return visual indicators:
 * - ↑ Panah Merah Naik: jika harga naik (+Rp selisih)
 * - ↓ Panah Hijau Turun: jika harga turun (Hemat Rp selisih)
 * - = Tanda Setara Abu-abu: jika harga stabil
 */
function comparePriceTrend(priceCurrent, priceLastMonth) {
  const current = Number(priceCurrent) || 0;
  const last = Number(priceLastMonth) || 0;

  if (last <= 0) {
    return {
      status: 'EQUAL',
      icon: '=',
      text: 'Harga Perdana',
      diffNominal: 0,
      diffPercent: 0,
      badgeClass: 'badge-price-equal'
    };
  }

  const diff = current - last;
  const diffPercent = ((diff / last) * 100).toFixed(1);

  if (diff > 0) {
    return {
      status: 'UP',
      icon: '↑',
      text: `Naik +${formatRupiah(diff)} (+${diffPercent}%)`,
      diffNominal: diff,
      diffPercent: parseFloat(diffPercent),
      badgeClass: 'badge-price-up'
    };
  } else if (diff < 0) {
    const absDiff = Math.abs(diff);
    return {
      status: 'DOWN',
      icon: '↓',
      text: `Hemat -${formatRupiah(absDiff)} (${diffPercent}%)`,
      diffNominal: diff,
      diffPercent: parseFloat(diffPercent),
      badgeClass: 'badge-price-down'
    };
  } else {
    return {
      status: 'EQUAL',
      icon: '=',
      text: 'Harga Tetap Stabil',
      diffNominal: 0,
      diffPercent: 0,
      badgeClass: 'badge-price-equal'
    };
  }
}

// ==========================================================
// 3. STORAGE & DATA SYNC (SRS F-06)
// ==========================================================

function loadStateFromStorage() {
  try {
    const savedLimit = localStorage.getItem(STORAGE_KEYS.BUDGET_LIMIT);
    if (savedLimit) appState.budgetLimit = Number(savedLimit) || DEFAULT_STATE.budgetLimit;

    const savedProfile = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (savedProfile) appState.userProfile = JSON.parse(savedProfile);

    const savedItems = localStorage.getItem(STORAGE_KEYS.CART_ITEMS);
    if (savedItems) {
      appState.items = JSON.parse(savedItems);
    } else {
      // First time initial load: use default sample items
      appState.items = JSON.parse(JSON.stringify(DEFAULT_STATE.items));
      saveItemsToStorage();
    }

    const savedHistory = localStorage.getItem(STORAGE_KEYS.SHOPPING_HISTORY);
    if (savedHistory) appState.history = JSON.parse(savedHistory);

    const savedArchive = localStorage.getItem(STORAGE_KEYS.PRICE_ARCHIVE);
    if (savedArchive) appState.priceArchive = JSON.parse(savedArchive);

    const savedFirebase = localStorage.getItem(STORAGE_KEYS.FIREBASE_CONFIG);
    if (savedFirebase) {
      appState.firebaseConfig = JSON.parse(savedFirebase);
      initFirebaseCloud();
    }
  } catch (err) {
    console.error('Error loading state from localStorage:', err);
    appState.items = JSON.parse(JSON.stringify(DEFAULT_STATE.items));
  }
}

function saveItemsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(appState.items));
    localStorage.setItem(STORAGE_KEYS.BUDGET_LIMIT, appState.budgetLimit.toString());
    localStorage.setItem(STORAGE_KEYS.SHOPPING_HISTORY, JSON.stringify(appState.history));
    localStorage.setItem(STORAGE_KEYS.PRICE_ARCHIVE, JSON.stringify(appState.priceArchive));

    // Also trigger cloud sync if connected
    syncToFirebaseCloud();
  } catch (err) {
    console.error('Error saving state to localStorage:', err);
  }
}

// ==========================================================
// 4. CORE RENDER & REACTION LOGIC (F-01, F-02, F-05)
// ==========================================================

function calculateCartTotals() {
  let totalGross = 0;
  let totalNet = 0;
  let totalSavings = 0;
  let checkedCount = 0;

  for (const item of appState.items) {
    const qty = Number(item.qty) || 0;
    const basePrice = Number(item.priceCurrent) || 0;
    const grossSubtotal = basePrice * qty;

    const disc = calculateCompoundDiscount(basePrice, item.discountStr);
    const netSubtotal = disc.unitPriceFinal * qty;

    totalGross += grossSubtotal;
    totalNet += netSubtotal;
    totalSavings += (disc.discountNominalPerUnit * qty);

    if (item.checked) checkedCount++;
  }

  return {
    totalGross,
    totalNet,
    totalSavings,
    checkedCount,
    itemCount: appState.items.length
  };
}

/**
 * SRS F-05: Pengendali Anggaran (Budget Safety Cap)
 * Updates visual status and warning banner based on percentage spent:
 * - < 90%: Safe (Teal/Green)
 * - >= 90% and < 100%: Warning (Amber/Yellow)
 * - >= 100%: Danger (Red Banner with official required message)
 */
function updateBudgetSafetyCap() {
  const totals = calculateCartTotals();
  const limit = appState.budgetLimit;
  const spent = totals.totalNet;
  const remaining = limit - spent;
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const clampedPct = Math.min(100, Math.max(0, pct));

  const heroCard = document.getElementById('budgetHeroCard');
  const alertBanner = document.getElementById('safetyAlertBanner');
  const alertIcon = document.getElementById('safetyAlertIcon');
  const alertText = document.getElementById('safetyAlertText');
  const progressBar = document.getElementById('budgetProgressBar');
  const spentVal = document.getElementById('spentAmountVal');
  const limitVal = document.getElementById('limitAmountVal');
  const remainingVal = document.getElementById('remainingAmountVal');
  const pctVal = document.getElementById('budgetPctVal');

  // Floating strip totals
  const floatingTotalCash = document.getElementById('floatingTotalCash');
  const floatingItemsCount = document.getElementById('floatingItemsCount');

  if (spentVal) spentVal.textContent = formatRupiah(spent);
  if (limitVal) limitVal.textContent = formatRupiah(limit);
  if (remainingVal) {
    if (remaining >= 0) {
      remainingVal.textContent = `Sisa ${formatRupiah(remaining)}`;
      remainingVal.style.color = 'var(--primary-700)';
    } else {
      remainingVal.textContent = `Defisit ${formatRupiah(Math.abs(remaining))}`;
      remainingVal.style.color = 'var(--danger-600)';
    }
  }
  if (pctVal) pctVal.textContent = `${pct.toFixed(1)}% terpakai`;

  if (floatingTotalCash) floatingTotalCash.textContent = formatRupiah(spent);
  if (floatingItemsCount) floatingItemsCount.textContent = `${totals.itemCount} Barang • ${totals.checkedCount} Tercentang`;

  if (progressBar) {
    progressBar.style.width = `${clampedPct}%`;
    progressBar.className = 'budget-progress-fill';
  }

  // Remove existing state classes
  if (heroCard) {
    heroCard.classList.remove('state-safe', 'state-warning', 'state-danger');
  }
  if (alertBanner) {
    alertBanner.classList.remove('banner-safe', 'banner-warning', 'banner-danger');
  }

  // 1. DANGER STATE (>= 100% dari saldo dompet)
  // Pesan wajib sesuai spesifikasi DT2:
  // "Total belanja melebihi batas uang tunai! Kurangi kuantitas atau tunda pembelian barang sekunder."
  if (pct >= 100) {
    if (heroCard) heroCard.classList.add('state-danger');
    if (progressBar) progressBar.classList.add('progress-danger');
    if (alertBanner) {
      alertBanner.classList.add('banner-danger');
      alertIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      alertText.innerHTML = `<strong>BAHAYA OVERBUDGET:</strong> Total belanja melebihi batas uang tunai! Kurangi kuantitas atau tunda pembelian barang sekunder.`;
    }
  }
  // 2. WARNING STATE (>= 90% dan < 100%)
  else if (pct >= 90) {
    if (heroCard) heroCard.classList.add('state-warning');
    if (progressBar) progressBar.classList.add('progress-warning');
    if (alertBanner) {
      alertBanner.classList.add('banner-warning');
      alertIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      alertText.innerHTML = `<strong>Peringatan Waspada:</strong> Total belanjaan sudah mencapai ${pct.toFixed(1)}% dari limit dompet! Sisa uang tunai tinggal ${formatRupiah(remaining)}.`;
    }
  }
  // 3. SAFE STATE (< 90%)
  else {
    if (heroCard) heroCard.classList.add('state-safe');
    if (progressBar) progressBar.classList.add('progress-safe');
    if (alertBanner) {
      alertBanner.classList.add('banner-safe');
      alertIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`;
      alertText.innerHTML = `<strong>Dompet Aman:</strong> Anggaran terkendali (${pct.toFixed(1)}% terpakai). Sisa saldo aman: ${formatRupiah(remaining)}.`;
    }
  }
}

/**
 * Render all active shopping items
 */
function renderItemsList() {
  const container = document.getElementById('itemListContainer');
  if (!container) return;

  const query = appState.searchQuery.toLowerCase().trim();
  const category = appState.activeCategory;

  const filtered = appState.items.filter(item => {
    const matchesQuery = !query || item.name.toLowerCase().includes(query) || (item.category && item.category.toLowerCase().includes(query));
    const matchesCat = category === 'ALL' || item.category === category;
    return matchesQuery && matchesCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
        </div>
        <p style="font-weight: 700; margin-bottom: 4px; color: var(--slate-700);">Keranjang Belanja Kosong</p>
        <p style="font-size: 11px;">Belum ada barang di daftar belanjaan atau tidak sesuai filter. Tekan tombol <strong>+ Tambah Barang</strong> atau muat skenario DT2 di atas.</p>
      </div>
    `;
    updateBudgetSafetyCap();
    return;
  }

  let html = '';
  filtered.forEach(item => {
    const basePrice = Number(item.priceCurrent) || 0;
    const lastPrice = Number(item.priceLastMonth) || 0;
    const qty = Number(item.qty) || 1;

    // Diskon calculation
    const disc = calculateCompoundDiscount(basePrice, item.discountStr);
    const subtotal = disc.unitPriceFinal * qty;
    const grossSubtotal = basePrice * qty;

    // Price Trend Comparator
    const trend = comparePriceTrend(basePrice, lastPrice);

    html += `
      <div class="grocery-card ${item.checked ? 'is-checked' : ''}" id="card-${item.id}">
        <!-- Top Row: Checkbox, Name, Category & Delete -->
        <div class="card-top-row">
          <div class="card-title-group">
            <button type="button" class="trolley-check-btn ${item.checked ? 'checked' : ''}" onclick="toggleItemCheck('${item.id}')" title="Centang saat masuk troli">
              ${item.checked ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
            </button>
            <div>
              <div class="item-name">${escapeHtml(item.name)}</div>
              <span class="item-category-tag">${escapeHtml(item.category || 'Umum')}</span>
            </div>
          </div>
          <div style="display: flex; gap: 4px;">
            <button type="button" class="card-action-btn" onclick="openEditModal('${item.id}')" title="Edit Barang">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button type="button" class="card-action-btn" onclick="deleteItem('${item.id}')" title="Hapus Barang">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <!-- Price Breakdown & Realtime Indicators -->
        <div class="card-price-details">
          <div>
            <span class="price-meta-label">Harga Satuan:</span>
            <div class="price-meta-val">${formatRupiah(basePrice)} / ${escapeHtml(item.unit || 'pcs')}</div>
            <div style="margin-top: 4px;">
              <span class="price-comparator-badge ${trend.badgeClass}" title="Bandingkan dengan harga bulan lalu">
                <strong>${trend.icon}</strong> ${trend.text}
              </span>
            </div>
          </div>
          <div>
            <span class="price-meta-label">Bulan Lalu:</span>
            <div style="font-size: 11px; color: var(--slate-600);">${lastPrice > 0 ? formatRupiah(lastPrice) : 'Tidak ada data'}</div>
            ${disc.discountNominalPerUnit > 0 ? `
              <div style="margin-top: 4px;">
                <span class="discount-pill" title="${escapeHtml(disc.label)}">
                  🏷️ ${escapeHtml(item.discountStr)}
                </span>
              </div>
            ` : `<div style="margin-top: 4px; font-size: 10px; color: var(--slate-400);">Tanpa diskon</div>`}
          </div>
        </div>

        <!-- Bottom Row: Stepper (F-02) and Subtotal -->
        <div class="card-bottom-row">
          <div class="qty-stepper">
            <button type="button" class="btn-step" onclick="changeQty('${item.id}', -1)" title="Kurang Qty">−</button>
            <span class="stepper-val">${qty}</span>
            <span class="stepper-unit">${escapeHtml(item.unit || '')}</span>
            <button type="button" class="btn-step" onclick="changeQty('${item.id}', 1)" title="Tambah Qty">+</button>
          </div>
          <div class="item-subtotal-block">
            <div class="subtotal-label">Subtotal</div>
            ${disc.discountNominalPerUnit > 0 ? `<span class="subtotal-original-striked">${formatRupiah(grossSubtotal)}</span>` : ''}
            <span class="subtotal-amount">${formatRupiah(subtotal)}</span>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
  updateBudgetSafetyCap();
}

/**
 * SRS F-02: Perubahan kuantitas langsung seketika (Reactivity)
 */
function changeQty(itemId, delta) {
  const item = appState.items.find(i => i.id === itemId);
  if (!item) return;

  const newQty = Math.max(1, (Number(item.qty) || 1) + delta);
  item.qty = newQty;
  saveItemsToStorage();
  renderItemsList();
}

function toggleItemCheck(itemId) {
  const item = appState.items.find(i => i.id === itemId);
  if (!item) return;
  item.checked = !item.checked;
  saveItemsToStorage();
  renderItemsList();
}

function deleteItem(itemId) {
  const idx = appState.items.findIndex(i => i.id === itemId);
  if (idx === -1) return;
  const name = appState.items[idx].name;
  appState.items.splice(idx, 1);
  saveItemsToStorage();
  renderItemsList();
  showToast(`Barang "${name}" dihapus`);
}

// ==========================================================
// 5. ITEM CREATION & EDITING MODAL
// ==========================================================

function openAddItemModal() {
  document.getElementById('modalItemTitle').textContent = 'Tambah Barang Belanja';
  document.getElementById('editItemId').value = '';
  document.getElementById('formItemName').value = '';
  document.getElementById('formItemCategory').value = 'Bahan Pokok';
  document.getElementById('formItemUnit').value = 'pcs';
  document.getElementById('formItemQty').value = '1';
  document.getElementById('formItemPrice').value = '';
  document.getElementById('formItemLastPrice').value = '';
  document.getElementById('formItemDiscount').value = '';

  // Trigger live preview
  updateModalLivePreview();
  document.getElementById('itemModalOverlay').classList.add('open');
  document.getElementById('formItemName').focus();
}

function openEditModal(itemId) {
  const item = appState.items.find(i => i.id === itemId);
  if (!item) return;

  document.getElementById('modalItemTitle').textContent = 'Edit Barang Belanja';
  document.getElementById('editItemId').value = item.id;
  document.getElementById('formItemName').value = item.name;
  document.getElementById('formItemCategory').value = item.category || 'Bahan Pokok';
  document.getElementById('formItemUnit').value = item.unit || 'pcs';
  document.getElementById('formItemQty').value = item.qty || 1;
  document.getElementById('formItemPrice').value = item.priceCurrent || 0;
  document.getElementById('formItemLastPrice').value = item.priceLastMonth || '';
  document.getElementById('formItemDiscount').value = item.discountStr || '';

  updateModalLivePreview();
  document.getElementById('itemModalOverlay').classList.add('open');
}

function closeItemModal() {
  document.getElementById('itemModalOverlay').classList.remove('open');
}

/**
 * Realtime preview calculation in modal
 */
function updateModalLivePreview() {
  const price = parseFloat(document.getElementById('formItemPrice').value) || 0;
  const lastPrice = parseFloat(document.getElementById('formItemLastPrice').value) || 0;
  const qty = parseFloat(document.getElementById('formItemQty').value) || 1;
  const discountStr = document.getElementById('formItemDiscount').value || '';

  const disc = calculateCompoundDiscount(price, discountStr);
  const trend = comparePriceTrend(price, lastPrice);
  const subtotal = disc.unitPriceFinal * qty;

  const previewBox = document.getElementById('modalLivePreviewBox');
  if (previewBox) {
    previewBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span style="font-size: 11px; font-weight: 600; color: var(--slate-600);">Simulasi Subtotal:</span>
        <span style="font-size: 15px; font-weight: 800; color: var(--primary-700);">${formatRupiah(subtotal)}</span>
      </div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">
        <span class="price-comparator-badge ${trend.badgeClass}"><strong>${trend.icon}</strong> ${trend.text}</span>
        ${disc.discountNominalPerUnit > 0 ? `<span class="discount-pill">🏷️ ${escapeHtml(disc.label)}</span>` : ''}
      </div>
    `;
  }
}

function saveItemForm(e) {
  e.preventDefault();
  const id = document.getElementById('editItemId').value;
  const name = document.getElementById('formItemName').value.trim();
  const category = document.getElementById('formItemCategory').value;
  const unit = document.getElementById('formItemUnit').value;
  const qty = Math.max(1, parseInt(document.getElementById('formItemQty').value) || 1);
  const priceCurrent = Math.max(0, parseFloat(document.getElementById('formItemPrice').value) || 0);
  const priceLastMonth = parseFloat(document.getElementById('formItemLastPrice').value) || priceCurrent;
  const discountStr = document.getElementById('formItemDiscount').value.trim();

  if (!name) {
    alert('Nama barang wajib diisi!');
    return;
  }

  if (id) {
    // Update existing item
    const item = appState.items.find(i => i.id === id);
    if (item) {
      item.name = name;
      item.category = category;
      item.unit = unit;
      item.qty = qty;
      item.priceCurrent = priceCurrent;
      item.priceLastMonth = priceLastMonth;
      item.discountStr = discountStr;
    }
    showToast(`Barang "${name}" berhasil diperbarui`);
  } else {
    // Add new item
    const newItem = {
      id: 'item-' + Date.now(),
      name,
      category,
      unit,
      qty,
      priceCurrent,
      priceLastMonth,
      discountStr,
      checked: false
    };
    appState.items.unshift(newItem);
    showToast(`Barang "${name}" ditambahkan`);
  }

  // Update price archive for auto-suggest
  appState.priceArchive[name.toLowerCase()] = priceCurrent;

  saveItemsToStorage();
  closeItemModal();
  renderItemsList();
}

// ==========================================================
// 6. DAILY TEST 2 (DT2) SKENARIO UJI OTOMATIS
// ==========================================================

/**
 * 1-Click load exact DT2 test scenario:
 * 1. Sabun 20.000 diskon 25% -> 15.000 (Skenario 1)
 * 2. Wajan 100.000 promo 50% + 20% -> 40.000 (Skenario 1)
 * 3. Minyak 43.000 x 3 = 129.000 (Skenario 2)
 * 4. Beras 74.000 vs 68.000 (↑ Naik Rp 6.000) (Skenario 3)
 * 5. Telur 28.000 vs 32.000 (↓ Turun Rp 4.000) (Skenario 3)
 * 6. Garam 5.000 vs 5.000 (= Stabil) (Skenario 3)
 * 7. Limit Dompet: Rp 350.000 (Skenario 4)
 */
function loadDT2Scenario() {
  appState.budgetLimit = 350000;
  appState.items = [
    {
      id: 'dt2-1',
      name: 'Minyak Goreng 2L',
      category: 'Bahan Pokok',
      unit: 'liter',
      qty: 3,
      priceCurrent: 43000,
      priceLastMonth: 43000,
      discountStr: '',
      checked: true
    },
    {
      id: 'dt2-2',
      name: 'Beras Ramos 5kg',
      category: 'Bahan Pokok',
      unit: 'kg',
      qty: 1,
      priceCurrent: 74000,
      priceLastMonth: 68000,
      discountStr: '',
      checked: true
    },
    {
      id: 'dt2-3',
      name: 'Telur Ayam 1kg',
      category: 'Bahan Pokok',
      unit: 'kg',
      qty: 1,
      priceCurrent: 28000,
      priceLastMonth: 32000,
      discountStr: '',
      checked: true
    },
    {
      id: 'dt2-4',
      name: 'Garam Dapur 500g',
      category: 'Bumbu Dapur',
      unit: 'pack',
      qty: 1,
      priceCurrent: 5000,
      priceLastMonth: 5000,
      discountStr: '',
      checked: true
    },
    {
      id: 'dt2-5',
      name: 'Sabun Mandi Cair 450ml',
      category: 'Perawatan Diri',
      unit: 'botol',
      qty: 1,
      priceCurrent: 20000,
      priceLastMonth: 20000,
      discountStr: '25%', // Diskon tunggal
      checked: true
    },
    {
      id: 'dt2-6',
      name: 'Wajan Anti Lengket 24cm',
      category: 'Peralatan Rumah',
      unit: 'pcs',
      qty: 1,
      priceCurrent: 100000,
      priceLastMonth: 100000,
      discountStr: '50% + 20%', // Promo bertingkat
      checked: true
    }
  ];

  saveItemsToStorage();
  renderItemsList();
  showToast('✅ Skenario Uji DT2 berhasil dimuat!');
}

/**
 * Quick trigger for Warning (>= 90%) and Danger (>= 100%) test
 */
function testBudgetCapTrigger(level) {
  if (level === 'warning') {
    // Set budget limit such that total spent becomes ~92%
    const totals = calculateCartTotals();
    appState.budgetLimit = Math.round(totals.totalNet / 0.92);
    saveItemsToStorage();
    updateBudgetSafetyCap();
    showToast('⚠️ Skenario Waspada (92%) diaktifkan');
  } else if (level === 'danger') {
    // Set budget limit such that total spent exceeds 100%
    const totals = calculateCartTotals();
    appState.budgetLimit = Math.round(totals.totalNet * 0.85); // 117% overbudget
    saveItemsToStorage();
    updateBudgetSafetyCap();
    showToast('🚨 Skenario Bahaya (>100%) diaktifkan');
  } else {
    // Reset to normal safe 350k
    appState.budgetLimit = 350000;
    saveItemsToStorage();
    updateBudgetSafetyCap();
    showToast('🛡️ Dompet dikembalikan ke batas aman Rp 350.000');
  }
}

// ==========================================================
// 7. PROMO & UNIT PRICE COMPARISON TOOLS (ANTI-JEBAKAN PROMO)
// ==========================================================

/**
 * Tool A: Compound Discount Simulator
 */
function runDiscountCalculator() {
  const basePrice = parseFloat(document.getElementById('calcDiscBasePrice').value) || 0;
  const promoStr = document.getElementById('calcDiscInput').value || '';
  const resultDiv = document.getElementById('calcDiscResult');

  if (basePrice <= 0 || !promoStr.trim()) {
    resultDiv.innerHTML = '<p style="color: var(--slate-500);">Silakan masukkan harga awal dan formula diskon.</p>';
    return;
  }

  const res = calculateCompoundDiscount(basePrice, promoStr);
  resultDiv.innerHTML = `
    <div style="font-weight: 700; color: var(--primary-700); margin-bottom: 4px;">Hasil Perhitungan Diskon Presisi:</div>
    <div>Harga Awal: <strong>${formatRupiah(basePrice)}</strong></div>
    <div>${res.label}</div>
    <div class="calc-highlight">Harga Akhir: ${formatRupiah(res.unitPriceFinal)}</div>
    <div style="margin-top: 4px; font-size: 11px; color: var(--success-700);">
      🎉 Kamu hemat: <strong>${formatRupiah(res.discountNominalPerUnit)}</strong> (${res.effectivePercent.toFixed(1)}% potongan efektif)
    </div>
  `;
}

/**
 * Tool B: Unit Price Comparison (Rian's Oil Dilemma)
 * Compares Option A vs Option B to find the cheapest per liter/kg/unit
 */
function runUnitPriceComparison() {
  const nameA = document.getElementById('optAName').value || 'Opsi A';
  const sizeA = parseFloat(document.getElementById('optASize').value) || 1;
  const priceA = parseFloat(document.getElementById('optAPrice').value) || 0;

  const nameB = document.getElementById('optBName').value || 'Opsi B';
  const sizeB = parseFloat(document.getElementById('optBSize').value) || 1;
  const priceB = parseFloat(document.getElementById('optBPrice').value) || 0;

  const unitType = document.getElementById('unitCompareType').value || 'satuan';
  const resultDiv = document.getElementById('unitCompareResult');

  if (priceA <= 0 || priceB <= 0 || sizeA <= 0 || sizeB <= 0) {
    resultDiv.innerHTML = '<p style="color: var(--slate-500);">Lengkapi ukuran dan harga kedua opsi.</p>';
    return;
  }

  const costPerUnitA = priceA / sizeA;
  const costPerUnitB = priceB / sizeB;

  let winnerText = '';
  let savingsInfo = '';

  if (costPerUnitA < costPerUnitB) {
    const diff = costPerUnitB - costPerUnitA;
    const pct = ((diff / costPerUnitB) * 100).toFixed(1);
    winnerText = `🏆 <strong>${escapeHtml(nameA)}</strong> Jauh Lebih Hemat!`;
    savingsInfo = `Biaya ${escapeHtml(nameA)} hanya <strong>${formatRupiah(costPerUnitA)}</strong>/${unitType}, sedangkan ${escapeHtml(nameB)} <strong>${formatRupiah(costPerUnitB)}</strong>/${unitType}. Kamu menghemat <strong>${pct}%</strong> per ${unitType}!`;
  } else if (costPerUnitB < costPerUnitA) {
    const diff = costPerUnitA - costPerUnitB;
    const pct = ((diff / costPerUnitA) * 100).toFixed(1);
    winnerText = `🏆 <strong>${escapeHtml(nameB)}</strong> Jauh Lebih Hemat!`;
    savingsInfo = `Biaya ${escapeHtml(nameB)} hanya <strong>${formatRupiah(costPerUnitB)}</strong>/${unitType}, sedangkan ${escapeHtml(nameA)} <strong>${formatRupiah(costPerUnitA)}</strong>/${unitType}. Kamu menghemat <strong>${pct}%</strong> per ${unitType}!`;
  } else {
    winnerText = `⚖️ Kedua opsi memiliki nilai keekonomisan yang sama!`;
    savingsInfo = `Keduanya berharga <strong>${formatRupiah(costPerUnitA)}</strong>/${unitType}.`;
  }

  resultDiv.innerHTML = `
    <div style="font-size: 13px; margin-bottom: 4px;">${winnerText}</div>
    <div style="font-size: 11.5px; line-height: 1.5;">${savingsInfo}</div>
  `;
}

// ==========================================================
// 8. CHECKOUT, RECEIPT & HISTORY ARCHIVE (SRS F-06)
// ==========================================================

function openReceiptModal() {
  const totals = calculateCartTotals();
  if (appState.items.length === 0) {
    alert('Keranjang belanja masih kosong!');
    return;
  }

  const receiptContent = document.getElementById('digitalReceiptContent');
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let itemsHtml = '';
  appState.items.forEach((item, index) => {
    const qty = Number(item.qty) || 1;
    const disc = calculateCompoundDiscount(item.priceCurrent, item.discountStr);
    const subtotal = disc.unitPriceFinal * qty;

    itemsHtml += `
      <div class="receipt-item-row">
        <span>${index + 1}. ${escapeHtml(item.name)} (${qty}x)</span>
        <span>${formatRupiah(subtotal)}</span>
      </div>
      ${disc.discountNominalPerUnit > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 9.5px; color: #db2777; margin-bottom: 4px;">
          <span>&nbsp;&nbsp;[${escapeHtml(item.discountStr)}]</span>
          <span>- ${formatRupiah(disc.discountNominalPerUnit * qty)}</span>
        </div>
      ` : ''}
    `;
  });

  receiptContent.innerHTML = `
    <div class="receipt-header-center">
      <div style="font-size: 13px; font-weight: 800; text-transform: uppercase;">SMART GROCERY TRUCKERR</div>
      <div style="font-size: 10px; color: var(--slate-500);">Solusi Belanja Cerdas &amp; Budget Safety Rian</div>
      <div style="font-size: 9.5px; color: var(--slate-400); margin-top: 4px;">${dateFormatted}</div>
      <div style="font-size: 9.5px; color: var(--slate-500); margin-top: 2px;">Pengguna: <strong>${escapeHtml(appState.userProfile.name)}</strong></div>
    </div>

    <div style="margin-bottom: 12px;">
      ${itemsHtml}
    </div>

    <div style="border-top: 1px dashed var(--slate-300); padding-top: 8px; margin-top: 8px;">
      <div class="receipt-item-row" style="font-size: 11px; color: var(--slate-600);">
        <span>Total Harga Normal:</span>
        <span>${formatRupiah(totals.totalGross)}</span>
      </div>
      <div class="receipt-item-row" style="font-size: 11px; color: #db2777;">
        <span>Total Diskon &amp; Hemat:</span>
        <span>- ${formatRupiah(totals.totalSavings)}</span>
      </div>
      <div class="receipt-item-row" style="font-size: 13px; font-weight: 800; color: var(--slate-900); border-top: 1px solid var(--slate-200); padding-top: 6px; margin-top: 4px;">
        <span>TOTAL DIBAYAR KASIR:</span>
        <span style="color: var(--primary-700);">${formatRupiah(totals.totalNet)}</span>
      </div>
      <div class="receipt-item-row" style="font-size: 10.5px; color: var(--slate-500); margin-top: 4px;">
        <span>Batas Uang Saku Dompet:</span>
        <span>${formatRupiah(appState.budgetLimit)}</span>
      </div>
      <div class="receipt-item-row" style="font-size: 11px; font-weight: 700; color: ${appState.budgetLimit >= totals.totalNet ? 'var(--primary-700)' : 'var(--danger-600)'}; margin-top: 2px;">
        <span>Sisa Uang di Dompet:</span>
        <span>${formatRupiah(appState.budgetLimit - totals.totalNet)}</span>
      </div>
    </div>

    <div style="text-align: center; font-size: 9.5px; color: var(--slate-400); margin-top: 14px; border-top: 1px dashed var(--slate-300); padding-top: 8px;">
      *** Terima kasih sudah belanja bijak dan hemat ***<br>
      ICT Codehub • SMA Mutiara Bangsa 2 Tangerang
    </div>
  `;

  document.getElementById('receiptModalOverlay').classList.add('open');
}

function closeReceiptModal() {
  document.getElementById('receiptModalOverlay').classList.remove('open');
}

/**
 * Save current shopping to history & update price archive for future comparison
 */
function finalizeShoppingSession() {
  const totals = calculateCartTotals();
  if (appState.items.length === 0) return;

  const session = {
    id: 'session-' + Date.now(),
    date: new Date().toISOString(),
    totalSpent: totals.totalNet,
    totalGross: totals.totalGross,
    totalSavings: totals.totalSavings,
    budgetLimit: appState.budgetLimit,
    items: JSON.parse(JSON.stringify(appState.items))
  };

  // Update last month prices in archive so next month automatically uses these prices!
  appState.items.forEach(item => {
    appState.priceArchive[item.name.toLowerCase()] = item.priceCurrent;
  });

  appState.history.unshift(session);
  saveItemsToStorage();

  // Save receipt to Firestore Cloud
  if (typeof window !== 'undefined' && window.saveHistoryToFirestore) {
    window.saveHistoryToFirestore(session);
  }

  closeReceiptModal();
  renderHistoryList();
  showToast('🎉 Belanjaan berhasil disimpan ke riwayat & cloud!');
}

function renderHistoryList() {
  const container = document.getElementById('historyListContainer');
  if (!container) return;

  if (appState.history.length === 0) {
    container.innerHTML = `
      <div class="empty-state-box">
        <p style="font-weight: 700; margin-bottom: 4px;">Belum Ada Riwayat Belanja</p>
        <p style="font-size: 11px;">Selesaikan sesi belanja di tab Belanja untuk mencatat struk belanjaan dan riwayat perbandingan harga.</p>
      </div>
    `;
    return;
  }

  let html = '';
  appState.history.forEach((session, idx) => {
    const d = new Date(session.date);
    const dateFormatted = d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    html += `
      <div class="history-card">
        <div class="history-header">
          <div>
            <div class="history-date">📅 ${dateFormatted}</div>
            <div style="font-size: 10px; color: var(--slate-500);">${session.items.length} Barang Belanja</div>
          </div>
          <div class="history-total">${formatRupiah(session.totalSpent)}</div>
        </div>
        <div style="font-size: 11px; color: var(--slate-600); margin-bottom: 8px;">
          ${session.items.slice(0, 3).map(i => `${escapeHtml(i.name)} (${i.qty}x)`).join(', ')}
          ${session.items.length > 3 ? `<em> +${session.items.length - 3} lainnya</em>` : ''}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--slate-200); padding-top: 8px;">
          <span style="font-size: 10px; color: var(--success-700); font-weight: 700;">Hemat: ${formatRupiah(session.totalSavings || 0)}</span>
          <button type="button" class="btn-chip" onclick="restoreHistoryItems(${idx})" style="font-size: 10px; padding: 4px 10px;">
            Muat Ulang ke Keranjang
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function restoreHistoryItems(historyIndex) {
  const session = appState.history[historyIndex];
  if (!session) return;
  if (!confirm('Ganti daftar keranjang saat ini dengan item dari riwayat belanja ini?')) return;

  appState.items = JSON.parse(JSON.stringify(session.items));
  // Keep last prices accurate
  appState.items.forEach(item => {
    item.priceLastMonth = item.priceCurrent; // Now previous month
    item.checked = false;
  });

  saveItemsToStorage();
  switchTab('tabBelanja');
  renderItemsList();
  showToast('Item riwayat dimuat ke keranjang belanja');
}

// ==========================================================
// 9. SETTINGS & FIREBASE CLOUD DATABASE (SRS F-06 / SECTION 9)
// ==========================================================

function updateBudgetLimitSetting() {
  const input = document.getElementById('settingBudgetInput');
  const newLimit = parseFloat(input.value) || DEFAULT_STATE.budgetLimit;
  appState.budgetLimit = newLimit;
  saveItemsToStorage();
  updateBudgetSafetyCap();
  showToast(`Batas dompet diperbarui: ${formatRupiah(newLimit)}`);
}

function updateProfileSetting() {
  const nameInput = document.getElementById('settingProfileName');
  if (nameInput && nameInput.value.trim()) {
    appState.userProfile.name = nameInput.value.trim();
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(appState.userProfile));
    const badge = document.getElementById('userProfileBadge');
    if (badge) badge.textContent = appState.userProfile.name;
    showToast('Profil pengguna diperbarui');
  }
}

/**
 * Section 9 Module Integration: Firebase Firestore Cloud Sync
 */
function saveFirebaseConfigFromInput() {
  const jsonText = document.getElementById('firebaseConfigInput').value.trim();
  if (!jsonText) {
    alert('Silakan tempelkan objek konfigurasi Firebase!');
    return;
  }

  try {
    let parsedConfig;
    if (jsonText.startsWith('{') && jsonText.endsWith('}')) {
      parsedConfig = JSON.parse(jsonText);
    } else {
      // Extract apiKey, projectId, etc from JS snippet
      const apiKeyMatch = jsonText.match(/apiKey:\s*["']([^"']+)["']/);
      const projectIdMatch = jsonText.match(/projectId:\s*["']([^"']+)["']/);
      const authDomainMatch = jsonText.match(/authDomain:\s*["']([^"']+)["']/);
      const appIdMatch = jsonText.match(/appId:\s*["']([^"']+)["']/);

      if (apiKeyMatch && projectIdMatch) {
        parsedConfig = {
          apiKey: apiKeyMatch[1],
          projectId: projectIdMatch[1],
          authDomain: authDomainMatch ? authDomainMatch[1] : undefined,
          appId: appIdMatch ? appIdMatch[1] : undefined
        };
      } else {
        throw new Error('Format konfigurasi tidak valid.');
      }
    }

    appState.firebaseConfig = parsedConfig;
    localStorage.setItem(STORAGE_KEYS.FIREBASE_CONFIG, JSON.stringify(parsedConfig));
    initFirebaseCloud();
    showToast('✅ Konfigurasi Firebase berhasil disimpan!');
  } catch (err) {
    alert('Gagal membaca konfigurasi Firebase. Pastikan format JSON atau potongan kode valid.');
    console.error(err);
  }
}

function initFirebaseCloud() {
  if (!appState.firebaseConfig) return;
  const statusEl = document.getElementById('firebaseStatusIndicator');
  if (statusEl) {
    statusEl.innerHTML = `🟢 Terhubung Cloud Firestore (${escapeHtml(appState.firebaseConfig.projectId || 'Firebase')})`;
    statusEl.className = 'firebase-status-chip firebase-online';
  }
  appState.firebaseOnline = true;
}

function syncToFirebaseCloud() {
  if (typeof window !== 'undefined' && window.syncCartToFirestore) {
    window.syncCartToFirestore(appState.items, appState.budgetLimit, appState.userProfile.name);
  }
}


// ==========================================================
// 10. UI UTILITIES, TABS, TOAST & INITIALIZATION
// ==========================================================

function switchTab(tabId) {
  const tabs = ['tabBelanja', 'tabPromo', 'tabRiwayat', 'tabPengaturan'];
  tabs.forEach(t => {
    const el = document.getElementById(t);
    if (el) el.classList.remove('active');
  });

  const targetEl = document.getElementById(tabId);
  if (targetEl) targetEl.classList.add('active');

  const navBtns = document.querySelectorAll('.nav-tab-btn');
  navBtns.forEach(btn => {
    if (btn.getAttribute('data-target') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Hide floating checkout strip on other tabs to keep UI clean
  const floatStrip = document.getElementById('floatingCheckoutStrip');
  if (floatStrip) {
    floatStrip.style.display = tabId === 'tabBelanja' ? 'flex' : 'none';
  }

  if (tabId === 'tabRiwayat') {
    renderHistoryList();
  }
}

function filterCategory(cat, btnEl) {
  appState.activeCategory = cat;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  renderItemsList();
}

function showToast(msg) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.innerHTML = `<span>${escapeHtml(msg)}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, 2400);
}

function escapeHtml(text) {
  if (!text) return '';
  return text.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Share Receipt to WhatsApp or Clipboard
function shareReceiptWhatsApp() {
  const totals = calculateCartTotals();
  const now = new Date().toLocaleDateString('id-ID');
  let text = `🛒 *CATATAN BELANJA BULANAN - SMART GROCERY TRUCKERR*\n`;
  text += `📅 Tanggal: ${now}\n`;
  text += `👤 Pengguna: ${appState.userProfile.name}\n`;
  text += `--------------------------------\n`;

  appState.items.forEach((item, i) => {
    const disc = calculateCompoundDiscount(item.priceCurrent, item.discountStr);
    const subtotal = disc.unitPriceFinal * item.qty;
    text += `${i + 1}. ${item.name} (${item.qty} ${item.unit || ''}) - ${formatRupiah(subtotal)}\n`;
  });

  text += `--------------------------------\n`;
  text += `💰 *TOTAL BAYAR: ${formatRupiah(totals.totalNet)}*\n`;
  text += `🎉 *Total Hemat: ${formatRupiah(totals.totalSavings)}*\n`;
  text += `💼 Limit Dompet: ${formatRupiah(appState.budgetLimit)}\n`;
  text += `✅ Sisa Dompet: ${formatRupiah(appState.budgetLimit - totals.totalNet)}\n\n`;
  text += `_Dibuat dengan Smart Grocery Truckerr (PWA Mobile)_`;

  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
}

// Print Digital Receipt
function printDigitalReceipt() {
  window.print();
}

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('ServiceWorker registered with scope:', reg.scope))
      .catch(err => console.log('ServiceWorker registration failed:', err));
  });
}

// DOM Ready initialization
document.addEventListener('DOMContentLoaded', () => {
  loadStateFromStorage();

  // Category filter pills
  const catPills = document.querySelectorAll('.cat-pill');
  catPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      filterCategory(e.target.getAttribute('data-cat'), e.target);
    });
  });

  // Search input live filtering
  const searchInput = document.getElementById('searchItemInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value;
      renderItemsList();
    });
  }

  // Modal price input listeners for live calculation
  ['formItemPrice', 'formItemLastPrice', 'formItemQty', 'formItemDiscount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateModalLivePreview);
  });

  // Item form submission
  const itemForm = document.getElementById('itemForm');
  if (itemForm) itemForm.addEventListener('submit', saveItemForm);

  // Settings budget input
  const budgetInput = document.getElementById('settingBudgetInput');
  if (budgetInput) budgetInput.value = appState.budgetLimit;

  // Profile name
  const profileInput = document.getElementById('settingProfileName');
  if (profileInput) profileInput.value = appState.userProfile.name;

  const badge = document.getElementById('userProfileBadge');
  if (badge) badge.textContent = appState.userProfile.name;

  // Render initial list
  renderItemsList();
  renderHistoryList();
});
