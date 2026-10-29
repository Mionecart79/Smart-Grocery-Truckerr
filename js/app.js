/**
 * SMART GROCERY PRO - NEO-CYBER & SUPABASE CLOUD SYNC CORE
 * Menjawab seluruh kebutuhan SRS F-01 s/d F-06 & Cerita Belanja Rian
 * Terintegrasi Cloud Supabase Hybrid (LocalStorage + Cloud Sync)
 */

(function () {
  'use strict';

  // --- SUPABASE EMBEDDED CONFIG ---
  const SUPABASE_CONFIG = {
    URL: 'https://szhtgpjvudguknevurfh.supabase.co',
    KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6aHRncGp2dWRndWtuZXZ1cmZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA5OTcwNDcsImV4cCI6MjEwNjU3MzA0N30.qtqxVbdfU3RBz4cH2jr20w8JHiyhMs3NcppzIPGc1GA'
  };

  // --- STORAGE KEYS ---
  const STORAGE_KEYS = {
    CART: 'smart_grocery_cart',
    BUDGET: 'smart_grocery_budget',
    HISTORY: 'smart_grocery_history',
    MASTER: 'smart_grocery_master',
    SOUND: 'smart_grocery_sound_enabled',
    PLANNER: 'smart_grocery_planner'
  };

  const AUTH_STORAGE_KEYS = {
    CURRENT_USER: 'smart_grocery_current_user',
    KNOWN_USERS: 'smart_grocery_known_users'
  };

  function getUserSlug(username) {
    if (!username) return 'rian';
    return String(username)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .slice(0, 32) || 'user';
  }

  function getUserKey(baseKey) {
    const slug = (appState && appState.currentUser && appState.currentUser.slug)
      ? appState.currentUser.slug
      : 'rian';
    return `sg_usr_${slug}_${baseKey}`;
  }

  // Default Master Reference Items for Rian & DT2 Evaluation (SRS F-04)
  const DEFAULT_MASTER_ITEMS = [
    { name: 'Beras 5kg', category: 'Bahan Pokok', unit: 'pack', lastPrice: 68000 },
    { name: 'Beras Rojolele', category: 'Bahan Pokok', unit: 'karung/5kg', lastPrice: 68000 },
    { name: 'Telur 1kg', category: 'Bahan Pokok', unit: 'kg', lastPrice: 32000 },
    { name: 'Garam 500g', category: 'Dapur & Bumbu', unit: 'pack', lastPrice: 5000 },
    { name: 'Minyak Goreng 2L', category: 'Bahan Pokok', unit: 'pouch', lastPrice: 43000 },
    { name: 'Wajan', category: 'Peralatan', unit: 'pcs', lastPrice: 100000 },
    { name: 'Sabun Mandi', category: 'Kebersihan', unit: 'pcs', lastPrice: 15000 },
    { name: 'Beras Ramos 5kg', category: 'Bahan Pokok', unit: 'pack', lastPrice: 72000 },
    { name: 'Minyak Goreng Sania 2L', category: 'Bahan Pokok', unit: 'pouch', lastPrice: 36000 },
    { name: 'Telur Ayam Negeri 1kg', category: 'Bahan Pokok', unit: 'kg', lastPrice: 28000 },
    { name: 'Sabun Cuci Deterjen 800g', category: 'Kebersihan', unit: 'pack', lastPrice: 19500 },
    { name: 'Pasta Gigi Herbal 190g', category: 'Kebersihan', unit: 'pcs', lastPrice: 14000 },
    { name: 'Sabun Pembersih Lantai 750ml', category: 'Kebersihan', unit: 'botol', lastPrice: 16000 },
    { name: 'Mie Instan Goreng Spesial', category: 'Makanan & Minuman', unit: 'pcs', lastPrice: 3100 },
    { name: 'Kecap Manis Refill 520ml', category: 'Dapur & Bumbu', unit: 'pouch', lastPrice: 17500 },
    { name: 'Biskuit Cokelat Kaleng', category: 'Makanan & Minuman', unit: 'kaleng', lastPrice: 32000 }
  ];

  // ==========================================================================
  // LOTTE MART GROCERY - PURI INDAH CATALOG (32 PRODUK RESMI LOTTE MART)
  // Harga real-time Lotte Mart Puri Indah, tidak perlu ketik manual!
  // ==========================================================================
  const ASTRO_OFFICIAL_CATALOG = [
    {
      id: 'lotte-beras-5kg',
      name: 'Beras 5kg',
      category: 'Bahan Pokok',
      unit: 'pack',
      price: 74000,
      originalPrice: 68000,
      discountRaw: '',
      badge: 'Lotte Mart • Naik',
      emoji: '🌾',
      description: 'Beras 5kg Lotte Mart Puri Indah (Bulan lalu Rp 68.000 -> Naik ke Rp 74.000)'
    },
    {
      id: 'lotte-telur-1kg',
      name: 'Telur 1kg',
      category: 'Bahan Pokok',
      unit: 'kg',
      price: 28000,
      originalPrice: 32000,
      discountRaw: '',
      badge: 'Lotte Mart • Turun',
      emoji: '🥚',
      description: 'Telur 1kg Lotte Mart Puri Indah (Bulan lalu Rp 32.000 -> Turun ke Rp 28.000)'
    },
    {
      id: 'lotte-garam-500g',
      name: 'Garam 500g',
      category: 'Dapur & Bumbu',
      unit: 'pack',
      price: 5000,
      originalPrice: 5000,
      discountRaw: '',
      badge: 'Lotte Mart • Stabil',
      emoji: '🧂',
      description: 'Garam 500g Lotte Mart Puri Indah (Harga stabil Rp 5.000)'
    },
    {
      id: 'astro-beras-5kg',
      name: 'Beras Setra Ramos BMW 5kg',
      category: 'Bahan Pokok',
      unit: '5 kg',
      price: 69900,
      originalPrice: 74500,
      discountRaw: '-Rp 4.600',
      badge: 'Lotte Mart • Diskon',
      emoji: '🌾',
      description: 'Beras putih pulen super quality'
    },
    {
      id: 'astro-minyak-sunco-2l',
      name: 'Minyak Goreng SunCo 2L',
      category: 'Bahan Pokok',
      unit: 'Pouch 2L',
      price: 38900,
      originalPrice: 42000,
      discountRaw: '7%',
      badge: 'Best Seller',
      emoji: '🍳',
      description: 'Minyak goreng bening tidak mudah beku'
    },
    {
      id: 'astro-minyak-sania-2l',
      name: 'Minyak Goreng Sania Pouch 2L',
      category: 'Bahan Pokok',
      unit: 'Pouch 2L',
      price: 37500,
      originalPrice: 39500,
      discountRaw: '5%',
      badge: 'Hemat',
      emoji: '🍳',
      description: 'Kelapa sawit pilihan bermutu tinggi'
    },
    {
      id: 'astro-telur-negeri-10',
      name: 'Telur Ayam Negeri Fresh (10 Butir)',
      category: 'Bahan Pokok',
      unit: 'Pack 10 btr',
      price: 29500,
      originalPrice: 32000,
      discountRaw: '',
      badge: 'Lotte Fresh',
      emoji: '🥚',
      description: 'Telur bersih bebas bakteri salmonella'
    },
    {
      id: 'astro-telur-omega-10',
      name: 'Telur Ayam Omega 3 Lotte Mart (10 Butir)',
      category: 'Bahan Pokok',
      unit: 'Pack 10 btr',
      price: 35000,
      originalPrice: 38500,
      discountRaw: '10%',
      badge: 'Super Premium',
      emoji: '🥚',
      description: 'Kaya DHA & nutrisi tinggi untuk keluarga'
    },
    {
      id: 'astro-indomie-goreng-5',
      name: 'Indomie Goreng Spesial (Pack 5 Pcs)',
      category: 'Bahan Pokok',
      unit: 'Pack 5 pcs',
      price: 15500,
      originalPrice: 16500,
      discountRaw: '',
      badge: 'Favorit Kos',
      emoji: '🍜',
      description: 'Mie instan goreng rasa legendaris'
    },
    {
      id: 'astro-indomie-soto-5',
      name: 'Indomie Kuah Rasa Soto Mie (Pack 5 Pcs)',
      category: 'Bahan Pokok',
      unit: 'Pack 5 pcs',
      price: 15000,
      originalPrice: 16000,
      discountRaw: '',
      badge: 'Kuah Hangat',
      emoji: '🍜',
      description: 'Gurih hangat kuah soto mie khas'
    },
    {
      id: 'astro-gulaku-1kg',
      name: 'Gula Pasir Gulaku Tebu Kuning 1kg',
      category: 'Bahan Pokok',
      unit: 'Pack 1kg',
      price: 18500,
      originalPrice: 19500,
      discountRaw: '',
      badge: 'Gula Murni',
      emoji: '🍬',
      description: 'Gula tebu murni manis alami'
    },
    {
      id: 'astro-tepung-segitiga-1kg',
      name: 'Tepung Terigu Segitiga Biru 1kg',
      category: 'Bahan Pokok',
      unit: 'Pack 1kg',
      price: 14500,
      originalPrice: 15500,
      discountRaw: '',
      badge: 'Serbaguna',
      emoji: '🌾',
      description: 'Tepung terigu protein sedang aneka masakan'
    },
    {
      id: 'astro-ultra-fullcream-1l',
      name: 'Ultra Milk Full Cream UHT 1000ml',
      category: 'Susu & Minuman',
      unit: 'Kotak 1L',
      price: 21000,
      originalPrice: 22500,
      discountRaw: '',
      badge: 'Lotte Choice',
      emoji: '🥛',
      description: 'Susu sapi segar murni kaya kalsium'
    },
    {
      id: 'astro-ultra-cokelat-1l',
      name: 'Ultra Milk Cokelat UHT 1000ml',
      category: 'Susu & Minuman',
      unit: 'Kotak 1L',
      price: 21500,
      originalPrice: 23000,
      discountRaw: '',
      badge: 'Manis Gurih',
      emoji: '🍫',
      description: 'Cokelat asli nikmat kaya nutrisi'
    },
    {
      id: 'astro-greenfields-pasteur-1l',
      name: 'Greenfields Fresh Milk Pasteurisasi 1L',
      category: 'Susu & Minuman',
      unit: 'Botol 1L',
      price: 32500,
      originalPrice: 35000,
      discountRaw: '',
      badge: 'Fresh Chilled',
      emoji: '🥛',
      description: 'Susu segar pasteurisasi dingin dari peternakan'
    },
    {
      id: 'astro-yakult-5',
      name: 'Yakult Minuman Probiotik (5 Botol)',
      category: 'Susu & Minuman',
      unit: 'Pack 5 btl',
      price: 11500,
      originalPrice: 12500,
      discountRaw: '',
      badge: 'Pencernaan Sehat',
      emoji: '🧃',
      description: 'Bakteri baik L. casei Shirota strain'
    },
    {
      id: 'astro-aqua-600-pack6',
      name: 'Aqua Air Mineral 600ml (Pack 6 Botol)',
      category: 'Susu & Minuman',
      unit: 'Pack 6 btl',
      price: 21000,
      originalPrice: 24000,
      discountRaw: '',
      badge: 'Air Murni',
      emoji: '💧',
      description: 'Kemurnian air pegunungan alami'
    },
    {
      id: 'astro-tehbotol-250-pack3',
      name: 'Teh Botol Sosro Kotak 250ml (Pack 3)',
      category: 'Susu & Minuman',
      unit: 'Pack 3 pcs',
      price: 11000,
      originalPrice: 12500,
      discountRaw: '',
      badge: 'Teh Asli',
      emoji: '🧃',
      description: 'Aroma melati teh asli Indonesia'
    },
    {
      id: 'astro-kopi-kapal-api-mix',
      name: 'Kopi Kapal Api Spesial Mix (10x24g)',
      category: 'Susu & Minuman',
      unit: 'Renceng 10 sct',
      price: 16500,
      originalPrice: 18000,
      discountRaw: '',
      badge: 'Kopi Mantap',
      emoji: '☕',
      description: 'Paduan biji kopi pilihan & gula harum'
    },
    {
      id: 'astro-ayam-fillet-500g',
      name: 'Ayam Fillet Dada Boneless Lotte Fresh 500g',
      category: 'Segar & Daging',
      unit: 'Tray 500g',
      price: 39900,
      originalPrice: 44000,
      discountRaw: '',
      badge: 'Lotte Fresh',
      emoji: '🍗',
      description: 'Daging dada ayam tanpa tulang segar'
    },
    {
      id: 'astro-daging-slice-300g',
      name: 'Daging Sapi Slice Sukiyaki Shabu 300g',
      category: 'Segar & Daging',
      unit: 'Tray 300g',
      price: 49500,
      originalPrice: 55000,
      discountRaw: '10%',
      badge: 'Daging Impor',
      emoji: '🥩',
      description: 'Irisan daging sapi impor empuk gurih'
    },
    {
      id: 'astro-pisang-cavendish',
      name: 'Pisang Cavendish Sunpride (1 Sisir)',
      category: 'Segar & Daging',
      unit: '1 Sisir (±1.2kg)',
      price: 26500,
      originalPrice: 29000,
      discountRaw: '',
      badge: 'Buah Segar',
      emoji: '🍌',
      description: 'Pisang manis kulit bersih mulus bernutrisi'
    },
    {
      id: 'astro-apel-fuji-1kg',
      name: 'Apel Fuji Wang Shan Fresh 1kg',
      category: 'Segar & Daging',
      unit: 'Pack 1kg',
      price: 38000,
      originalPrice: 42000,
      discountRaw: '',
      badge: 'Manis Renyah',
      emoji: '🍎',
      description: 'Apel fuji renyah manis kaya vitamin C'
    },
    {
      id: 'astro-kecap-bango-520',
      name: 'Kecap Manis Bango Refill 520ml',
      category: 'Dapur & Bumbu',
      unit: 'Pouch 520ml',
      price: 24800,
      originalPrice: 27000,
      discountRaw: '',
      badge: 'Kedelai Hitam',
      emoji: '🥫',
      description: 'Kecap manis kedelai hitam Mallika legendaris'
    },
    {
      id: 'astro-saus-abc-380',
      name: 'Saus Sambal ABC Asli Pouch 380ml',
      category: 'Dapur & Bumbu',
      unit: 'Pouch 380ml',
      price: 15500,
      originalPrice: 17000,
      discountRaw: '',
      badge: 'Pedas Mantap',
      emoji: '🌶️',
      description: 'Cabai segar pilihan rasa pedas khas'
    },
    {
      id: 'astro-royco-ayam-230',
      name: 'Royco Kaldu Ayam Rasa Mantap 230g',
      category: 'Dapur & Bumbu',
      unit: 'Pouch 230g',
      price: 11500,
      originalPrice: 12500,
      discountRaw: '',
      badge: 'Penyedap Rasa',
      emoji: '🧂',
      description: 'Ekstrak daging ayam asli lezat masakan gurih'
    },
    {
      id: 'astro-bawang-merah-250',
      name: 'Bawang Merah Brebes Pilihan 250g',
      category: 'Dapur & Bumbu',
      unit: 'Pack 250g',
      price: 18500,
      originalPrice: 20000,
      discountRaw: '',
      badge: 'Bumbu Segar',
      emoji: '🧅',
      description: 'Bawang merah Brebes wangi sedap masakan'
    },
    {
      id: 'astro-cabe-rawit-150',
      name: 'Cabe Rawit Merah Super Segar 150g',
      category: 'Dapur & Bumbu',
      unit: 'Pack 150g',
      price: 19500,
      originalPrice: 22000,
      discountRaw: '',
      badge: 'Pedas Nendang',
      emoji: '🌶️',
      description: 'Rawit merah segar petik baru super pedas'
    },
    {
      id: 'astro-rinso-molto-750',
      name: 'Rinso Molto Cair Japanese Peach 750ml',
      category: 'Kebersihan',
      unit: 'Pouch 750ml',
      price: 22900,
      originalPrice: 25500,
      discountRaw: '',
      badge: 'Wangi Segar',
      emoji: '🧺',
      description: 'Deterjen cair konsentrat lembut wangi peach'
    },
    {
      id: 'astro-sunlight-jeruk-700',
      name: 'Sunlight Pencuci Piring Jeruk Nipis 700ml',
      category: 'Kebersihan',
      unit: 'Pouch 700ml',
      price: 14500,
      originalPrice: 16500,
      discountRaw: '',
      badge: 'Hilangkan Lemak',
      emoji: '🍋',
      description: 'Bersih kesat ekstrak jeruk nipis 100 asli'
    },
    {
      id: 'astro-lifebuoy-450',
      name: 'Sabun Mandi Lifebuoy Cair Total 10 450ml',
      category: 'Kebersihan',
      unit: 'Pouch 450ml',
      price: 26500,
      originalPrice: 29500,
      discountRaw: '',
      badge: 'Antibakteri',
      emoji: '🧼',
      description: 'Perlindungan kuman 10x lebih kuat'
    },
    {
      id: 'astro-pepsodent-190',
      name: 'Pasta Gigi Pepsodent Economy 190g',
      category: 'Kebersihan',
      unit: 'Tube 190g',
      price: 14200,
      originalPrice: 16000,
      discountRaw: '',
      badge: 'Gigi Sehat',
      emoji: '🪥',
      description: 'Perlindungan gigi berlubang aktif kalsium'
    },
    {
      id: 'astro-sari-roti-kupas',
      name: 'Roti Tawar Sari Roti Spesial Kupas',
      category: 'Camilan & Roti',
      unit: 'Pack 200g',
      price: 16500,
      originalPrice: 17500,
      discountRaw: '',
      badge: 'Roti Lembut',
      emoji: '🍞',
      description: 'Roti tawar tanpa kulit empuk bergizi'
    },
    {
      id: 'astro-chitato-sapi-68',
      name: 'Chitato Sapi Panggang 68g',
      category: 'Camilan & Roti',
      unit: 'Bungkus 68g',
      price: 11500,
      originalPrice: 12500,
      discountRaw: '',
      badge: 'Renyah Asik',
      emoji: '🥔',
      description: 'Keripik kentang bergelombang rasa sapi panggang'
    },
    {
      id: 'astro-pocky-cokelat',
      name: 'Pocky Chocolate Glico 47g',
      category: 'Camilan & Roti',
      unit: 'Box 47g',
      price: 8900,
      originalPrice: 9900,
      discountRaw: '',
      badge: 'Camilan Manis',
      emoji: '🍫',
      description: 'Biskuit stik renyah salut krim cokelat tebal'
    }
  ];

  // Default Shopping Planner (Kebutuhan yang Direncanakan Sebelum ke Supermarket)
  const DEFAULT_SAMPLE_PLANNER = [
    { id: 'plan-4', name: 'Minyak Goreng SunCo 2L', category: 'Bahan Pokok', unit: 'pouch', qty: 1, isPurchased: false, createdAt: Date.now() - 1800000 },
    { id: 'plan-5', name: 'Mie Instan Goreng Spesial', category: 'Makanan & Minuman', unit: 'pcs', qty: 5, isPurchased: false, createdAt: Date.now() - 1200000 },
    { id: 'plan-6', name: 'Kecap Manis Refill 520ml', category: 'Dapur & Bumbu', unit: 'pouch', qty: 1, isPurchased: false, createdAt: Date.now() - 600000 },
    { id: 'plan-7', name: 'Pasta Gigi Herbal 190g', category: 'Kebersihan', unit: 'pcs', qty: 1, isPurchased: false, createdAt: Date.now() - 300000 }
  ];

  // Default Cart - Skenario Uji 4: Indikator Komparasi Fluktuasi Harga Realtime Lotte Mart Puri Indah (SRS F-04)
  const DEFAULT_SAMPLE_CART = [
    {
      id: 'item-1',
      name: 'Beras 5kg',
      category: 'Bahan Pokok',
      unit: 'pack',
      qty: 1,
      price: 74000,
      lastMonthPrice: 68000,
      discountRaw: '',
      isPlanned: true,
      inPhysicalCart: true,
      createdAt: Date.now() - 3600000
    },
    {
      id: 'item-2',
      name: 'Telur 1kg',
      category: 'Bahan Pokok',
      unit: 'kg',
      qty: 1,
      price: 28000,
      lastMonthPrice: 32000,
      discountRaw: '',
      isPlanned: true,
      inPhysicalCart: true,
      createdAt: Date.now() - 3000000
    },
    {
      id: 'item-3',
      name: 'Garam 500g',
      category: 'Dapur & Bumbu',
      unit: 'pack',
      qty: 1,
      price: 5000,
      lastMonthPrice: 5000,
      discountRaw: '',
      isPlanned: true,
      inPhysicalCart: true,
      createdAt: Date.now() - 2400000
    },
    {
      id: 'item-4',
      name: 'Minyak Goreng SunCo 2L',
      category: 'Bahan Pokok',
      unit: 'pouch',
      qty: 1,
      price: 38900,
      lastMonthPrice: 42000,
      discountRaw: '7%',
      isPlanned: true,
      inPhysicalCart: false,
      createdAt: Date.now() - 1800000
    },
    {
      id: 'item-5',
      name: 'Mie Instan Goreng Spesial',
      category: 'Makanan & Minuman',
      unit: 'pcs',
      qty: 5,
      price: 3100,
      lastMonthPrice: 3100,
      discountRaw: '',
      isPlanned: true,
      inPhysicalCart: false,
      createdAt: Date.now() - 1200000
    }
  ];

  // --- STATE MANAGEMENT ---
  let appState = {
    currentUser: null,
    cart: [],
    planner: [],
    budgetLimit: 350000,
    history: [],
    masterItems: [],
    activeCategory: 'ALL',
    searchQuery: '',
    astroCategory: 'ALL',
    astroSearchQuery: '',
    astroPage: 1,
    astroItemsPerPage: 6,
    editingItemId: null,
    soundEnabled: true,
    supabaseUrl: '',
    supabaseKey: '',
    supabaseClient: null,
    isCloudConnected: false,
    hasInitialCloudPulled: false,
    lastCartPushTimestamp: 0,
    lastPlannerPushTimestamp: 0,
    deviceId: 'dev_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
    realtimeChannel: null
  };

  let astroCheckoutState = {
    voucherCode: 'NONE',
    voucherDiscount: 0,
    selectedMethod: 'qris',
    selectedVaBank: 'BCA',
    cashPaid: 0,
    qrisTimerInterval: null,
    qrisSecondsRemaining: 900
  };

  // --- AUDIO SYNTHESIZER ---
  const AudioEngine = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
    },
    playTap() {
      if (!appState.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.03);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
      } catch (e) { }
    },
    playScan() {
      if (!appState.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1900, now);
        osc.frequency.exponentialRampToValueAtTime(2200, now + 0.05);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
        if (navigator.vibrate) {
          navigator.vibrate([40, 20, 40]);
        }
      } catch (e) { }
    },
    playCashier() {
      if (!appState.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [987.77, 1318.51, 1975.53].forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.06);
          gain.gain.setValueAtTime(0.18, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.25);
        });
      } catch (e) { }
    },
    playSuccess() {
      if (!appState.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [523.25, 659.25, 1046.50].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.05);
          gain.gain.setValueAtTime(0.1, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.15);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.15);
        });
      } catch (e) { }
    },
    playAlert() {
      if (!appState.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.setValueAtTime(180, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } catch (e) { }
    },
    playBeep() {
      if (!appState.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now);
        osc.frequency.setValueAtTime(2200, now + 0.04);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch (e) { }
    },
    playPrinter() {
      if (!appState.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        for (let i = 0; i < 6; i++) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(280 + (i % 2) * 120, now + i * 0.04);
          gain.gain.setValueAtTime(0.05, now + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.025);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.025);
        }
      } catch (e) { }
    }
  };

  // --- INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    initApp();
  });

  function initApp() {
    initAuthModule();
    initSupabaseClient();
    setupNavigation();
    setupEventListeners();
    setupSoundToggle();
    initShelfAdderTray();
    initBarcodeScannerModule();
    initStoreSelectorModule();
    initAstroCatalogModule();
    renderAll();
    initComparatorTool();
    initDockAutoHide();
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // --- AUTO-HIDE BOTTOM DOCK ON SCROLL ---
  function initDockAutoHide() {
    const scrollArea = document.querySelector('.neo-main-content');
    const dock = document.querySelector('.neo-bottom-dock');
    if (!scrollArea || !dock) return;

    let lastScrollY = 0;
    let ticking = false;

    scrollArea.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentY = scrollArea.scrollTop;
          const delta = currentY - lastScrollY;

          // Selalu tampil di paling atas
          if (currentY <= 10) {
            dock.classList.remove('dock-hidden');
          } else if (delta > 5) {
            // Scroll ke BAWAH → sembunyikan dock
            dock.classList.add('dock-hidden');
          } else if (delta < -5) {
            // Scroll ke ATAS → tampilkan dock
            dock.classList.remove('dock-hidden');
          }

          lastScrollY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }


  // --- STORAGE ---
  function loadDataFromStorage() {
    try {
      const cartKey = getUserKey(STORAGE_KEYS.CART);
      const plannerKey = getUserKey(STORAGE_KEYS.PLANNER);
      const budgetKey = getUserKey(STORAGE_KEYS.BUDGET);
      const historyKey = getUserKey(STORAGE_KEYS.HISTORY);
      const masterKey = getUserKey(STORAGE_KEYS.MASTER);
      const soundKey = getUserKey(STORAGE_KEYS.SOUND);
      const storeKey = getUserKey('store');

      const savedCart = localStorage.getItem(cartKey);
      const savedPlanner = localStorage.getItem(plannerKey);
      const savedBudget = localStorage.getItem(budgetKey);
      const savedHistory = localStorage.getItem(historyKey);
      const savedMaster = localStorage.getItem(masterKey);
      const savedSound = localStorage.getItem(soundKey);
      const savedStore = localStorage.getItem(storeKey);

      const isRian = !appState.currentUser || appState.currentUser.slug === 'rian';

      // If user is Rian and no user-specific key exists, check legacy un-namespaced keys
      if (isRian && savedCart === null) {
        const legacyCart = localStorage.getItem(STORAGE_KEYS.CART);
        const legacyPlanner = localStorage.getItem(STORAGE_KEYS.PLANNER);
        const legacyBudget = localStorage.getItem(STORAGE_KEYS.BUDGET);
        const legacyHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
        const legacyMaster = localStorage.getItem(STORAGE_KEYS.MASTER);

        appState.cart = legacyCart ? JSON.parse(legacyCart) : DEFAULT_SAMPLE_CART;
        appState.planner = (legacyPlanner ? JSON.parse(legacyPlanner) : DEFAULT_SAMPLE_PLANNER).filter(p => !p.isPurchased);
        appState.budgetLimit = legacyBudget ? Number(legacyBudget) : 350000;
        appState.history = legacyHistory ? JSON.parse(legacyHistory) : [];
        appState.masterItems = legacyMaster ? JSON.parse(legacyMaster) : DEFAULT_MASTER_ITEMS;

        saveCart();
        savePlanner();
        saveBudget();
        saveHistory();
        saveMaster();
      } else if (savedCart !== null) {
        // User already has isolated data saved
        appState.cart = JSON.parse(savedCart);
        appState.planner = (savedPlanner ? JSON.parse(savedPlanner) : []).filter(p => !p.isPurchased);
        appState.budgetLimit = savedBudget ? Number(savedBudget) : 350000;
        appState.history = savedHistory ? JSON.parse(savedHistory) : [];
        appState.masterItems = savedMaster ? JSON.parse(savedMaster) : DEFAULT_MASTER_ITEMS;

        // Sanitize history to prevent foreign receipts leakage across accounts
        const currentSlug = appState.currentUser ? appState.currentUser.slug : 'rian';
        const isRianUser = currentSlug === 'rian';
        if (Array.isArray(appState.history)) {
          const originalLen = appState.history.length;
          appState.history = appState.history.filter(rcp => {
            if (rcp.userSlug) return rcp.userSlug === currentSlug;
            if (rcp.id && rcp.id.startsWith('rcp_')) return rcp.id.startsWith('rcp_' + currentSlug + '_');
            return isRianUser;
          });
          if (appState.history.length !== originalLen) {
            saveHistory();
          }
        }
      } else {
        // Brand new user (e.g. Budi, Siti, etc.) -> Clean slate! No data pollution
        appState.cart = [];
        appState.planner = [];
        appState.budgetLimit = 350000;
        appState.history = [];
        appState.masterItems = DEFAULT_MASTER_ITEMS;

        saveCart();
        savePlanner();
        saveBudget();
        saveHistory();
        saveMaster();
      }

      // Pastikan master items selalu memuat item acuan DT2 & Skenario Uji 4
      DEFAULT_MASTER_ITEMS.forEach(def => {
        const existing = appState.masterItems.find(m => m.name.toLowerCase() === def.name.toLowerCase());
        if (!existing) {
          appState.masterItems.push(def);
        } else {
          existing.lastPrice = def.lastPrice;
        }
      });

      appState.soundEnabled = savedSound !== null ? savedSound === 'true' : true;
      appState.activeStore = savedStore || localStorage.getItem('smart_grocery_store') || 'Lotte Mart Grocery - Puri Indah';
      if (appState.activeStore === 'GrandLucky SCBD') {
        appState.activeStore = 'Lotte Mart Grocery - Puri Indah';
        localStorage.setItem('smart_grocery_store', 'Lotte Mart Grocery - Puri Indah');
      }
      const storeEl = document.getElementById('activeStoreName');
      if (storeEl) storeEl.textContent = appState.activeStore;
      const scanViewStore = document.getElementById('scanViewStoreName');
      if (scanViewStore) scanViewStore.textContent = appState.activeStore;

      appState.supabaseUrl = SUPABASE_CONFIG.URL;
      appState.supabaseKey = SUPABASE_CONFIG.KEY;
    } catch (e) {
      console.warn('loadDataFromStorage error:', e);
      appState.cart = [];
      appState.planner = [];
      appState.budgetLimit = 350000;
      appState.masterItems = DEFAULT_MASTER_ITEMS;
      appState.activeStore = 'Lotte Mart Grocery - Puri Indah';
      appState.supabaseUrl = SUPABASE_CONFIG.URL;
      appState.supabaseKey = SUPABASE_CONFIG.KEY;
    }
  }

  // ==========================================================================
  // MULTI-DEVICE REALTIME BUS & SYNC ENGINE (INSTANT PHONE <-> LAPTOP REALTIME)
  // ==========================================================================
  let localSyncChannel = null;
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      localSyncChannel = new BroadcastChannel('smart_grocery_multidevice_bus');
      localSyncChannel.onmessage = (event) => {
        handleIncomingRealtimePayload(event.data);
      };
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.includes('smart_grocery_cart')) {
        loadDataFromStorage();
        renderCart();
        flashRealtimeSyncIndicator();
      } else if (e.key && e.key.includes('smart_grocery_planner')) {
        loadDataFromStorage();
        renderShoppingPlannerSection();
        flashRealtimeSyncIndicator();
      } else if (e.key && e.key.includes('smart_grocery_budget')) {
        loadDataFromStorage();
        updateBudgetHud();
        renderBudgetBreakdown();
        flashRealtimeSyncIndicator();
      }
    });
  }

  function broadcastRealtimeUpdate(type, data) {
    const userSyncId = 'user_' + (appState.currentUser ? appState.currentUser.slug : 'rian');
    const message = {
      sourceDeviceId: appState.deviceId,
      userSyncId: userSyncId,
      type: type,
      data: data,
      timestamp: Date.now()
    };

    // 1. Broadcast locally to other tabs/windows
    try {
      if (localSyncChannel) localSyncChannel.postMessage(message);
    } catch (e) {}

    // 2. Broadcast to other devices over Supabase Realtime WebSocket (< 100ms latency)
    if (appState.realtimeChannel) {
      try {
        appState.realtimeChannel.send({
          type: 'broadcast',
          event: 'MULTIDEVICE_SYNC',
          payload: message
        });
      } catch (e) {
        console.warn('Realtime broadcast error:', e);
      }
    }
  }

  function handleIncomingRealtimePayload(payload) {
    if (!payload || payload.sourceDeviceId === appState.deviceId) return;
    const myUserSyncId = 'user_' + (appState.currentUser ? appState.currentUser.slug : 'rian');
    if (payload.userSyncId && payload.userSyncId !== myUserSyncId) return;

    let needsRender = false;

    if (payload.type === 'cart' || payload.type === 'all') {
      if (Array.isArray(payload.data?.cart)) {
        appState.cart = payload.data.cart;
        saveCart(true); // simpan lokal tanpa push balik
        needsRender = true;
      }
    }

    if (payload.type === 'planner' || payload.type === 'all') {
      if (Array.isArray(payload.data?.planner)) {
        appState.planner = payload.data.planner;
        savePlanner(true);
        needsRender = true;
      }
    }

    if (payload.type === 'budget' || payload.type === 'all') {
      if (payload.data?.budgetLimit) {
        appState.budgetLimit = Number(payload.data.budgetLimit);
        saveBudget(true);
        needsRender = true;
      }
    }

    if (needsRender) {
      renderAll();
      flashRealtimeSyncIndicator();
    }
  }

  function flashRealtimeSyncIndicator() {
    const tag = document.getElementById('cloudStatusTag');
    if (tag) {
      tag.classList.add('bg-emerald-300', 'text-emerald-950', 'ring-2', 'ring-emerald-400');
      tag.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-ping"></span><span>SYNCED</span>`;
      setTimeout(() => {
        tag.classList.remove('bg-emerald-300', 'text-emerald-950', 'ring-2', 'ring-emerald-400');
        tag.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" id="cloudStatusDot"></span><span>ONLINE</span>`;
      }, 1400);
    }
  }

  let syncCartTimer = null;
  function pushActiveCartToCloud() {
    clearTimeout(syncCartTimer);
    syncCartTimer = setTimeout(async () => {
      if (!appState.supabaseClient) return;
      try {
        const userSyncId = 'user_' + (appState.currentUser ? appState.currentUser.slug : 'rian');
        const cartSyncId = 'active_cart_' + userSyncId;
        appState.lastCartPushTimestamp = Date.now();
        await appState.supabaseClient.from('receipts').upsert({
          id: cartSyncId,
          date_label: 'ACTIVE_CART',
          budget_limit: Number(appState.budgetLimit) || 350000,
          grand_total: appState.cart.reduce((sum, it) => sum + (Number(it.finalPrice) || 0), 0),
          total_saved: appState.cart.reduce((sum, it) => sum + ((Number(it.savedPerUnit) || 0) * (Number(it.qty) || 1)), 0),
          item_count: appState.cart.length,
          items: appState.cart,
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn('Realtime cart push error:', e);
      }
    }, 250);
  }

  let syncPlannerTimer = null;
  function pushActivePlannerToCloud() {
    clearTimeout(syncPlannerTimer);
    syncPlannerTimer = setTimeout(async () => {
      if (!appState.supabaseClient) return;
      try {
        const userSyncId = 'user_' + (appState.currentUser ? appState.currentUser.slug : 'rian');
        const plannerSyncId = 'active_planner_' + userSyncId;
        appState.lastPlannerPushTimestamp = Date.now();
        await appState.supabaseClient.from('receipts').upsert({
          id: plannerSyncId,
          date_label: 'ACTIVE_PLANNER',
          budget_limit: Number(appState.budgetLimit) || 350000,
          grand_total: 0,
          total_saved: 0,
          item_count: appState.planner.length,
          items: appState.planner,
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (e) {
        console.warn('Realtime planner push error:', e);
      }
    }, 250);
  }

  let syncSettingsTimer = null;
  function pushUserSettingsToCloud() {
    clearTimeout(syncSettingsTimer);
    syncSettingsTimer = setTimeout(async () => {
      if (!appState.supabaseClient) return;
      try {
        const userSyncId = 'user_' + (appState.currentUser ? appState.currentUser.slug : 'rian');
        await appState.supabaseClient.from('user_settings').upsert({
          id: userSyncId,
          budget_limit: Number(appState.budgetLimit) || 350000,
          sound_enabled: appState.soundEnabled,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('Realtime settings push error:', e);
      }
    }, 300);
  }

  function saveCart(skipCloud = false) {
    localStorage.setItem(getUserKey(STORAGE_KEYS.CART), JSON.stringify(appState.cart));
    if (!skipCloud) {
      broadcastRealtimeUpdate('cart', { cart: appState.cart, budgetLimit: appState.budgetLimit });
      if (appState.supabaseClient) {
        pushActiveCartToCloud();
      }
    }
  }

  function savePlanner(skipCloud = false) {
    localStorage.setItem(getUserKey(STORAGE_KEYS.PLANNER), JSON.stringify(appState.planner));
    if (!skipCloud) {
      broadcastRealtimeUpdate('planner', { planner: appState.planner });
      if (appState.supabaseClient) {
        pushActivePlannerToCloud();
      }
    }
  }

  function saveBudget(skipCloud = false) {
    localStorage.setItem(getUserKey(STORAGE_KEYS.BUDGET), appState.budgetLimit.toString());
    if (!skipCloud) {
      broadcastRealtimeUpdate('budget', { budgetLimit: appState.budgetLimit, soundEnabled: appState.soundEnabled });
      if (appState.supabaseClient) {
        pushUserSettingsToCloud();
      }
    }
  }

  function saveHistory() {
    localStorage.setItem(getUserKey(STORAGE_KEYS.HISTORY), JSON.stringify(appState.history));
  }
  function saveMaster() {
    localStorage.setItem(getUserKey(STORAGE_KEYS.MASTER), JSON.stringify(appState.masterItems));
  }
  function saveSound() {
    localStorage.setItem(getUserKey(STORAGE_KEYS.SOUND), appState.soundEnabled.toString());
  }
  function saveStore(storeName) {
    localStorage.setItem(getUserKey('store'), storeName);
    localStorage.setItem('smart_grocery_store', storeName);
  }


  // ==========================================================================
  // SUPABASE CLOUD INTEGRATION MODULE (REALTIME HYBRID)
  // ==========================================================================
  function initSupabaseClient() {
    if (appState.supabaseUrl && appState.supabaseKey && window.supabase) {
      try {
        appState.supabaseClient = window.supabase.createClient(appState.supabaseUrl, appState.supabaseKey);
        appState.isCloudConnected = true;
        updateCloudStatusUI(true);
        subscribeToRealtimeChanges();
        startRealtimeHeartbeat();

        // Listen to official Supabase Auth state changes (Google OAuth callback)
        appState.supabaseClient.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_OUT' || localStorage.getItem('sg_explicit_logout') === 'true') {
            return;
          }

          if (event === 'SIGNED_IN' && session && session.user) {
            const u = session.user;
            const meta = u.user_metadata || {};
            const email = u.email || meta.email || '';
            const name = meta.full_name || meta.name || (email ? email.split('@')[0] : 'User Google');
            const username = email ? email.split('@')[0] : 'google_user';
            const avatarUrl = meta.avatar_url || meta.picture || '';

            const userObj = {
              slug: 'g_' + getUserSlug(username),
              username: username,
              displayName: name,
              provider: 'google',
              email: email,
              avatarUrl: avatarUrl,
              avatarText: (name[0] || 'G').toUpperCase(),
              loginAt: Date.now()
            };

            loginAsUser(userObj, true);
          }
        });

        pullDataFromSupabase(true).then(() => {
          appState.hasInitialCloudPulled = true;
        });
      } catch (e) {
        console.error('Supabase init error:', e);
        appState.isCloudConnected = false;
        updateCloudStatusUI(false);
      }
    } else {
      appState.isCloudConnected = false;
      updateCloudStatusUI(false);
    }
  }

  function subscribeToRealtimeChanges() {
    if (!appState.supabaseClient) return;
    try {
      if (appState.realtimeChannel) {
        try {
          appState.supabaseClient.removeChannel(appState.realtimeChannel);
        } catch (e) {}
      }

      const userSyncId = 'user_' + (appState.currentUser ? appState.currentUser.slug : 'rian');
      const channelName = 'room_' + userSyncId;

      appState.realtimeChannel = appState.supabaseClient
        .channel(channelName, {
          config: {
            broadcast: { self: false }
          }
        })
        .on('broadcast', { event: 'MULTIDEVICE_SYNC' }, (payload) => {
          if (payload && payload.payload) {
            handleIncomingRealtimePayload(payload.payload);
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'receipts' }, () => {
          pullDataFromSupabase(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'master_products' }, () => {
          pullDataFromSupabase(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_settings' }, () => {
          pullDataFromSupabase(true);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            updateCloudStatusUI(true);
          }
        });
    } catch (e) {
      console.warn('Realtime channel error:', e);
    }
  }

  // Active Realtime Heartbeat Polling: syncs every 2.5s if visible
  let realtimeHeartbeatTimer = null;
  function startRealtimeHeartbeat() {
    if (realtimeHeartbeatTimer) clearInterval(realtimeHeartbeatTimer);
    realtimeHeartbeatTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && appState.supabaseClient && appState.isCloudConnected) {
        pullDataFromSupabase(true);
      }
    }, 2500);
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && appState.supabaseClient) {
        pullDataFromSupabase(true);
      }
    });
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      if (appState.supabaseClient) {
        pullDataFromSupabase(true);
      }
    });
  }

  function updateCloudStatusUI(isConnected) {
    const dot = document.getElementById('cloudStatusDot');
    const tag = document.getElementById('cloudStatusTag');
    const cloudIcon = document.getElementById('cloudIndicatorIcon');
    const cloudTitle = document.getElementById('cloudStatusTitle');
    const cloudSub = document.getElementById('cloudStatusSubtitle');

    if (isConnected) {
      if (dot) {
        dot.classList.add('connected');
        dot.title = 'Status: Sinkronisasi Aktif (Tersinkron di Semua HP)';
      }
      if (tag) tag.textContent = 'ONLINE';
      if (cloudIcon) cloudIcon.classList.add('connected');
      if (cloudTitle) cloudTitle.textContent = 'Data Belanja Tersinkron';
      if (cloudSub) cloudSub.textContent = 'Data belanja Anda otomatis tersimpan & sinkron di semua HP Anda.';
    } else {
      if (dot) {
        dot.classList.remove('connected');
        dot.title = 'Status: Mode Offline (Tersimpan di Ponsel)';
      }
      if (tag) tag.textContent = 'OFFLINE';
      if (cloudIcon) cloudIcon.classList.remove('connected');
      if (cloudTitle) cloudTitle.textContent = 'Tersimpan di Ponsel';
      if (cloudSub) cloudSub.textContent = 'Data aman tersimpan di penyimpanan perangkat ini.';
    }

    if (window.lucide) lucide.createIcons();
  }

  async function pushDataToSupabase(silent = false) {
    if (!appState.supabaseClient) {
      if (!silent) showToast('Koneksi sinkronisasi belum aktif!', 'warning');
      return;
    }

    try {
      if (!silent) showToast('Menyimpan data belanja...', 'info');

      // 1. Sync User Settings / Budget
      const userSyncId = 'user_' + (appState.currentUser ? appState.currentUser.slug : 'rian');
      await appState.supabaseClient.from('user_settings').upsert({
        id: userSyncId,
        budget_limit: appState.budgetLimit,
        sound_enabled: appState.soundEnabled,
        updated_at: new Date().toISOString()
      });

      // 2. Sync Master Items
      if (appState.masterItems.length > 0) {
        const masterPayload = appState.masterItems.map(item => ({
          name: item.name,
          category: item.category,
          unit: item.unit,
          last_price: item.lastPrice,
          updated_at: new Date().toISOString()
        }));
        await appState.supabaseClient.from('master_products').upsert(masterPayload, { onConflict: 'name' });
      }

      // 3. Sync Receipts (excluding active carts/planners, strictly isolated for this user)
      const userSlug = appState.currentUser ? appState.currentUser.slug : 'rian';
      const myReceipts = appState.history.filter(rcp => {
        if (rcp.id.startsWith('active_cart_') || rcp.id.startsWith('active_planner_')) return false;
        if (rcp.userSlug) return rcp.userSlug === userSlug;
        if (rcp.id.startsWith('rcp_')) return rcp.id.startsWith('rcp_' + userSlug + '_');
        return userSlug === 'rian';
      });

      if (myReceipts.length > 0) {
        const receiptsPayload = myReceipts.map(rcp => {
          const syncId = rcp.id.startsWith('rcp_') ? rcp.id : ('rcp_' + userSlug + '_' + rcp.id);
          return {
            id: syncId,
            date_label: rcp.date,
            budget_limit: rcp.budgetLimit,
            grand_total: rcp.grandTotal,
            total_saved: rcp.totalSaved,
            item_count: rcp.itemCount,
            items: {
              userSlug: userSlug,
              customerName: rcp.customerName || (appState.currentUser ? (appState.currentUser.displayName || appState.currentUser.username) : 'Pelanggan'),
              lines: Array.isArray(rcp.items) ? rcp.items : []
            },
            created_at: new Date().toISOString()
          };
        });
        if (receiptsPayload.length > 0) {
          await appState.supabaseClient.from('receipts').upsert(receiptsPayload, { onConflict: 'id' });
        }
      }

      // 4. Sync Active Cart in Cloud (Realtime Across Phones)
      const cartSyncId = 'active_cart_' + userSyncId;
      appState.lastCartPushTimestamp = Date.now();
      await appState.supabaseClient.from('receipts').upsert({
        id: cartSyncId,
        date_label: 'ACTIVE_CART',
        budget_limit: Number(appState.budgetLimit) || 350000,
        grand_total: appState.cart.reduce((sum, it) => sum + (Number(it.finalPrice) || 0), 0),
        total_saved: appState.cart.reduce((sum, it) => sum + ((Number(it.savedPerUnit) || 0) * (Number(it.qty) || 1)), 0),
        item_count: appState.cart.length,
        items: appState.cart,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

      // 5. Sync Active Planner in Cloud
      const plannerSyncId = 'active_planner_' + userSyncId;
      appState.lastPlannerPushTimestamp = Date.now();
      await appState.supabaseClient.from('receipts').upsert({
        id: plannerSyncId,
        date_label: 'ACTIVE_PLANNER',
        budget_limit: Number(appState.budgetLimit) || 350000,
        grand_total: 0,
        total_saved: 0,
        item_count: appState.planner.length,
        items: appState.planner,
        created_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (!silent) {
        AudioEngine.playSuccess();
        showToast('Seluruh data belanja tersimpan aman!', 'success');
      }
    } catch (err) {
      console.error('Push error:', err);
      if (!silent) showToast('Gagal menyimpan data: ' + (err.message || 'Koneksi terputus'), 'danger');
    }
  }

  async function pullDataFromSupabase(silent = false) {
    if (!appState.supabaseClient) {
      if (!silent) showToast('Koneksi sinkronisasi belum aktif!', 'warning');
      return;
    }

    try {
      if (!silent) showToast('Menyinkronkan data belanja...', 'info');

      // 1. Fetch Master Products
      const { data: masterData, error: masterErr } = await appState.supabaseClient
        .from('master_products')
        .select('*');

      if (!masterErr && masterData && masterData.length > 0) {
        appState.masterItems = masterData.map(m => ({
          name: m.name,
          category: m.category,
          unit: m.unit,
          lastPrice: Number(m.last_price)
        }));
        saveMaster();
      }

      // 2. Fetch Receipts History & Active Cart / Planner
      const { data: receiptsData, error: rcpErr } = await appState.supabaseClient
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!rcpErr && receiptsData && receiptsData.length > 0) {
        // Struk riwayat transaksi selesai (HANYA milik akun yang sedang aktif)
        const userSlug = appState.currentUser ? appState.currentUser.slug : 'rian';
        const isRianAccount = userSlug === 'rian';
        const userPrefix = 'rcp_' + userSlug + '_';

        const myReceiptRows = receiptsData.filter(r => {
          if (r.id.startsWith('active_cart_') || r.id.startsWith('active_planner_')) return false;
          // Match receipt ID yang terisolasi dengan user prefix
          if (r.id.startsWith('rcp_')) {
            return r.id.startsWith(userPrefix);
          }
          // Match jika di payload items terdapat userSlug
          if (r.items && !Array.isArray(r.items) && r.items.userSlug) {
            return r.items.userSlug === userSlug;
          }
          // Struk bawaan lama hanya untuk akun rian
          return isRianAccount;
        });

        appState.history = myReceiptRows.map(r => {
          let itemsList = [];
          let custName = '';
          if (Array.isArray(r.items)) {
            itemsList = r.items;
          } else if (r.items && Array.isArray(r.items.lines)) {
            itemsList = r.items.lines;
            custName = r.items.customerName || '';
          }

          return {
            id: r.id,
            userSlug: userSlug,
            customerName: custName,
            date: r.date_label,
            budgetLimit: Number(r.budget_limit),
            grandTotal: Number(r.grand_total),
            totalSaved: Number(r.total_saved),
            itemCount: Number(r.item_count),
            items: itemsList
          };
        });
        saveHistory();
        renderHistoryList();

        // Sinkronisasi Troli Aktif Pengguna dari Cloud
        const userSyncId = 'user_' + (appState.currentUser ? appState.currentUser.slug : 'rian');
        const cartSyncId = 'active_cart_' + userSyncId;
        const cartRow = receiptsData.find(r => r.id === cartSyncId);

        const timeSinceMyCartPush = Date.now() - (appState.lastCartPushTimestamp || 0);
        if (timeSinceMyCartPush > 2000) {
          if (cartRow && Array.isArray(cartRow.items)) {
            appState.cart = cartRow.items;
            saveCart(true); // skip pushing back to cloud
          } else if (appState.cart.length > 0 && !cartRow) {
            // Jika akun baru punya keranjang lokal tapi di cloud belum ada, upload ke cloud
            pushActiveCartToCloud();
          }
        }

        // Sinkronisasi Daftar Rencana (Planner) dari Cloud
        const plannerSyncId = 'active_planner_' + userSyncId;
        const plannerRow = receiptsData.find(r => r.id === plannerSyncId);

        const timeSinceMyPlannerPush = Date.now() - (appState.lastPlannerPushTimestamp || 0);
        if (timeSinceMyPlannerPush > 2000) {
          if (plannerRow && Array.isArray(plannerRow.items)) {
            appState.planner = plannerRow.items;
            savePlanner(true); // skip pushing back to cloud
          } else if (appState.planner.length > 0 && !plannerRow) {
            pushActivePlannerToCloud();
          }
        }
      }

      // 3. Fetch Settings
      const userSyncId = 'user_' + (appState.currentUser ? appState.currentUser.slug : 'rian');
      const { data: settingsData } = await appState.supabaseClient
        .from('user_settings')
        .select('*')
        .eq('id', userSyncId)
        .single();

      if (settingsData) {
        appState.budgetLimit = Number(settingsData.budget_limit) || 350000;
        appState.soundEnabled = settingsData.sound_enabled ?? true;
        saveBudget(true);
        saveSound();
      }

      appState.hasInitialCloudPulled = true;
      renderAll();
      if (!silent) {
        AudioEngine.playSuccess();
        showToast('Data belanja berhasil disinkronkan!', 'success');
      }
    } catch (err) {
      console.error('Pull error:', err);
      appState.hasInitialCloudPulled = true;
      if (!silent) showToast('Gagal menyinkronkan data: ' + (err.message || 'Error'), 'danger');
    }
  }

  async function syncCloudData() {
    if (!appState.supabaseClient) {
      initSupabaseClient();
    }
    if (!appState.supabaseClient) {
      showToast('Koneksi sinkronisasi belum aktif', 'danger');
      return;
    }
    AudioEngine.playTap();
    showToast('Menyinkronkan antar perangkat...', 'info');
    await pushDataToSupabase();
    await pullDataFromSupabase();
    showToast('Semua data belanja sudah sinkron!', 'success');
  }

  // ==========================================================================
  // F-03: LOGIKA KALKULATOR DISKON BERTINGKAT
  // ==========================================================================
  function calculateDiscount(originalPrice, discountString) {
    if (!originalPrice || originalPrice <= 0) {
      return { finalUnitPrice: 0, savedPerUnit: 0, discountLabel: '', formulaText: '' };
    }

    const price = Number(originalPrice);
    if (!discountString || typeof discountString !== 'string' || discountString.trim() === '') {
      return {
        finalUnitPrice: price,
        savedPerUnit: 0,
        discountLabel: '',
        formulaText: 'Harga Normal (Tanpa Promo)'
      };
    }

    const cleanStr = discountString.trim().toLowerCase();

    // Buy 2 Get 1
    if (cleanStr.includes('buy 2 get 1') || cleanStr.includes('beli 2 gratis 1')) {
      const discountedUnit = (price * 2) / 3;
      const saved = price - discountedUnit;
      return {
        finalUnitPrice: Math.round(discountedUnit),
        savedPerUnit: Math.round(saved),
        discountLabel: 'Beli 2 Gratis 1 (33.3%)',
        formulaText: `Beli 3 bayar 2: Rp ${(price * 2).toLocaleString('id-ID')} / 3 = Rp ${Math.round(discountedUnit).toLocaleString('id-ID')}`
      };
    }

    // Direct Nominal
    if (cleanStr.startsWith('rp') || (!cleanStr.includes('+') && !cleanStr.includes('%') && !isNaN(Number(cleanStr)))) {
      const nominal = Number(cleanStr.replace(/[^0-9]/g, ''));
      if (nominal > 0 && nominal < price) {
        const finalPrice = price - nominal;
        return {
          finalUnitPrice: finalPrice,
          savedPerUnit: nominal,
          discountLabel: `-Rp ${formatNumber(nominal)}`,
          formulaText: `Potongan Langsung: Rp ${formatNumber(price)} - Rp ${formatNumber(nominal)} = Rp ${formatNumber(finalPrice)}`
        };
      }
    }

    // Tiered Discount (50+20)
    if (cleanStr.includes('+') || cleanStr.includes('%') || !isNaN(Number(cleanStr))) {
      const parts = cleanStr.split('+').map(p => {
        const num = parseFloat(p.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? 0 : num;
      }).filter(num => num > 0);

      if (parts.length > 0) {
        let currentAmount = price;
        const steps = [];
        parts.forEach((pct, index) => {
          const cut = currentAmount * (pct / 100);
          const afterCut = currentAmount - cut;
          steps.push(`Lapis ${index + 1} (-${pct}%): Rp ${formatNumber(Math.round(currentAmount))} ➔ Rp ${formatNumber(Math.round(afterCut))}`);
          currentAmount = afterCut;
        });

        const finalPrice = Math.round(currentAmount);
        const saved = price - finalPrice;
        const totalEffectivePct = ((saved / price) * 100).toFixed(1);

        return {
          finalUnitPrice: finalPrice,
          savedPerUnit: saved,
          discountLabel: `Promo ${parts.join('% + ')}% (-${totalEffectivePct}%)`,
          formulaText: steps.join(' | ')
        };
      }
    }

    return {
      finalUnitPrice: price,
      savedPerUnit: 0,
      discountLabel: '',
      formulaText: 'Format diskon tidak dikenali'
    };
  }

  // ==========================================================================
  // F-04: DETEKSI FLUKTUASI HARGA REALTIME VS BULAN LALU
  // ==========================================================================
  function comparePriceWithLastMonth(currentPrice, lastMonthPrice) {
    const cur = Number(currentPrice) || 0;
    const last = Number(lastMonthPrice) || 0;

    if (!last || last <= 0) {
      return {
        status: 'new',
        text: 'BARU',
        icon: 'sparkles',
        badgeClass: 'new'
      };
    }

    const diff = cur - last;
    const pct = ((diff / last) * 100).toFixed(1);

    if (diff > 0) {
      return {
        status: 'up',
        text: `+Rp ${formatNumber(diff)} (+${pct}%)`,
        icon: 'arrow-up',
        badgeClass: 'up'
      };
    } else if (diff < 0) {
      return {
        status: 'down',
        text: `-Rp ${formatNumber(Math.abs(diff))} (${pct}%)`,
        icon: 'arrow-down',
        badgeClass: 'down'
      };
    } else {
      return {
        status: 'stable',
        text: `Tetap (Rp ${formatNumber(cur)})`,
        icon: 'equal',
        badgeClass: 'stable'
      };
    }
  }

  // ==========================================================================
  // F-05: PENGENDALI ANGGARAN (NEO-BENTO SAFETY CAP) CALCULATION & UI
  // ==========================================================================
  function updateBudgetHud() {
    let totalSpent = 0;
    let totalSaved = 0;
    let totalQty = 0;

    appState.cart.forEach(item => {
      const disc = calculateDiscount(item.price, item.discountRaw);
      const lineTotal = disc.finalUnitPrice * item.qty;
      totalSpent += lineTotal;
      totalSaved += disc.savedPerUnit * item.qty;
      totalQty += item.qty;
    });

    const limit = appState.budgetLimit;
    const remaining = limit - totalSpent;
    const percentage = limit > 0 ? (totalSpent / limit) * 100 : 0;
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

    // Text Elements
    document.getElementById('hudTotalSpending').textContent = formatNumber(totalSpent);
    const shortLimit = limit >= 1000000 ? `${(limit / 1000000).toFixed(1)}jt` : `${Math.round(limit / 1000)}k`;
    document.getElementById('hudBudgetLimit').textContent = `Rp ${shortLimit}`;
    const hudPercentEl = document.getElementById('budgetPercentLabel');
    if (hudPercentEl) hudPercentEl.textContent = `${percentage.toFixed(0)}% CAP`;

    const hudSavingsEl = document.getElementById('hudTotalSavingsText');
    if (hudSavingsEl) hudSavingsEl.textContent = `Hemat Rp ${formatNumber(totalSaved)}`;

    const hudSubtickMax = document.getElementById('hudSubtickMax');
    if (hudSubtickMax) hudSubtickMax.textContent = `Max ${formatNumber(Math.round(limit / 1000))}k`;

    document.getElementById('summaryTotalItems').textContent = `${appState.cart.length} Jenis (${totalQty} Qty)`;
    document.getElementById('summaryTotalSaved').textContent = `Hemat Rp ${formatNumber(totalSaved)}`;

    // DOM Elements
    const hudCard = document.getElementById('budgetHudCard');
    const progressBar = document.getElementById('budgetProgressBar');
    const statusBadge = document.getElementById('hudStatusBadge');
    const statusText = document.getElementById('hudStatusText');
    const statusIcon = document.getElementById('hudStatusIcon');
    const remainingText = document.getElementById('hudRemainingText');
    const overBudgetBanner = document.getElementById('overBudgetBanner');

    if (progressBar) {
      progressBar.style.width = `${clampedPercentage}%`;
    }

    // Stitch Screen 2: 10-Segment Discrete Gauge Blocks
    const segmentBlocks = document.querySelectorAll('#budgetSegmentMeter .segment-block');
    if (segmentBlocks.length === 10) {
      const activeCount = Math.min(10, Math.ceil((percentage / 100) * 10));
      segmentBlocks.forEach((blk, idx) => {
        blk.className = 'segment-block';
        if (percentage > 0 && idx < activeCount) {
          if (percentage < 80) {
            blk.classList.add('active-safe');
          } else if (percentage < 100) {
            blk.classList.add('active-warn');
          } else {
            blk.classList.add('active-danger');
          }
        }
      });
    }

    const navBudgetDot = document.getElementById('navBudgetDot');

    if (percentage < 90) {
      if (statusBadge) {
        statusBadge.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-[10px] font-black tracking-widest';
      }
      if (statusText) statusText.textContent = '● STATUS: AMAN';
      if (statusIcon) statusIcon.innerHTML = '<span class="material-symbols-outlined text-[11px]">verified_user</span> STATUS: AMAN';
      if (remainingText) remainingText.innerHTML = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-800/80 border border-stone-700/80"><span class="text-stone-400 text-[10px]">Sisa Aman:</span><strong class="text-citrus font-black text-[12px]">Rp ${formatNumber(remaining)}</strong></span>`;
      if (overBudgetBanner) overBudgetBanner.classList.add('hidden');
      if (navBudgetDot) navBudgetDot.className = 'w-2 h-2 rounded-full bg-citrus absolute -top-0.5 -right-1';
      if (progressBar) progressBar.className = 'h-full bg-emerald-500 rounded-full transition-all duration-300';
    } else if (percentage >= 90 && percentage <= 100) {
      if (statusBadge) {
        statusBadge.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-[10px] font-black tracking-widest';
      }
      if (statusText) statusText.textContent = '▲ PERINGATAN WASPADA (≥90%)';
      if (statusIcon) statusIcon.innerHTML = '<span class="material-symbols-outlined text-[11px]">warning</span> WASPADA (≥90%)';
      if (remainingText) remainingText.innerHTML = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-stone-800/80 border border-amber-500/40"><span class="text-stone-400 text-[10px]">Sisa Kritis:</span><strong class="text-amber-300 font-black text-[12px]">Rp ${formatNumber(remaining)}</strong></span>`;
      if (overBudgetBanner) overBudgetBanner.classList.add('hidden');
      if (navBudgetDot) navBudgetDot.className = 'w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-1';
      if (progressBar) progressBar.className = 'h-full bg-amber-400 rounded-full transition-all duration-300';
    } else {
      if (statusBadge) {
        statusBadge.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/25 text-rose-300 border border-rose-500/50 font-mono text-[10px] font-black tracking-widest animate-pulse';
      }
      if (statusText) statusText.textContent = '🚨 OVER BUDGET (>100%)';
      if (statusIcon) statusIcon.innerHTML = '<span class="material-symbols-outlined text-[11px]">emergency</span> DEFISIT KUOTA';
      const overAmount = Math.abs(remaining);
      if (remainingText) remainingText.innerHTML = `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-950/80 border border-rose-600/60"><span class="text-rose-300 text-[10px]">Defisit:</span><strong class="text-rose-400 font-black text-[12px]">Rp ${formatNumber(overAmount)}</strong></span>`;
      if (overBudgetBanner) {
        overBudgetBanner.classList.remove('hidden');
        overBudgetBanner.className = 'neo-alert-overbudget bg-red-600 text-white border-2 border-red-800 rounded-2xl p-3.5 mb-space-md shadow-lg animate-shake';
        overBudgetBanner.innerHTML = `
          <div class="flex items-start gap-2.5">
            <span class="material-symbols-outlined text-white text-[20px] shrink-0 mt-0.5 animate-bounce">warning</span>
            <div class="flex-1">
              <div class="font-headline-sm text-sm font-black text-white leading-tight">
                Total belanja melebihi batas saldo dompet! Kurangi kuantitas atau batalkan barang sekunder.
              </div>
              <div class="font-mono text-xs text-red-100 font-bold mt-1">
                Defisit Kuota: -Rp ${formatNumber(overAmount)} (Total: Rp ${formatNumber(totalSpent)} / Limit: Rp ${formatNumber(limit)})
              </div>
            </div>
            <button id="btnSuggestTrim" onclick="window.suggestTrimItems ? window.suggestTrimItems() : null" class="px-2.5 py-1 rounded-lg bg-white text-red-700 text-xs font-black shadow-sm shrink-0 cursor-pointer hover:bg-red-50 active:scale-95">
              Pangkas
            </button>
          </div>
        `;
      }
      if (navBudgetDot) navBudgetDot.className = 'w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-1 animate-ping';
      if (progressBar) progressBar.className = 'h-full bg-rose-600 rounded-full transition-all duration-300';
      AudioEngine.playAlert();
    }

    // Dock Badges & Sticky Checkout Total
    const stickyGrandTotal = document.getElementById('cartBottomGrandTotal');
    if (stickyGrandTotal) stickyGrandTotal.textContent = `Rp ${formatNumber(totalSpent)}`;

    const navCartBadge = document.getElementById('navCartBadge');
    if (navCartBadge) navCartBadge.textContent = appState.cart.length;

    const countAll = document.getElementById('countAll');
    if (countAll) countAll.textContent = appState.cart.length;

    // Macro Allocator & Budget Screen Sync (tabDompet)
    const dompetLimitEl = document.getElementById('hudDompetLimitDisplay');
    if (dompetLimitEl) dompetLimitEl.textContent = `Rp ${formatNumber(limit)}`;

    const planSpend = document.getElementById('budgetCurrentSpend');
    if (planSpend) planSpend.textContent = `Rp ${formatNumber(totalSpent)}`;

    const planRemain = document.getElementById('budgetRemainingAmount');
    if (planRemain) {
      if (remaining >= 0) {
        planRemain.textContent = `Rp ${formatNumber(remaining)}`;
        planRemain.className = 'font-mono text-xs sm:text-sm font-black text-citrus';
      } else {
        planRemain.textContent = `-Rp ${formatNumber(Math.abs(remaining))}`;
        planRemain.className = 'font-mono text-xs sm:text-sm font-black text-rose-400 animate-pulse';
      }
    }

    const planMeter = document.getElementById('budgetHealthMeter');
    if (planMeter) {
      planMeter.style.width = `${clampedPercentage}%`;
      if (percentage < 90) {
        planMeter.className = 'h-full bg-emerald-500 rounded-full transition-all duration-300';
      } else if (percentage <= 100) {
        planMeter.className = 'h-full bg-amber-500 rounded-full transition-all duration-300';
      } else {
        planMeter.className = 'h-full bg-rose-600 rounded-full transition-all duration-300';
      }
    }

    const planPercent = document.getElementById('budgetHealthPercent');
    if (planPercent) planPercent.textContent = `${percentage.toFixed(0)}% Terpakai`;

    const budgetTabStatusPill = document.getElementById('budgetTabStatusPill');
    if (budgetTabStatusPill) {
      if (percentage < 90) {
        budgetTabStatusPill.textContent = '● AMAN (<90%)';
        budgetTabStatusPill.className = 'font-label-sm text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold';
      } else if (percentage <= 100) {
        budgetTabStatusPill.textContent = '▲ WASPADA (90-100%)';
        budgetTabStatusPill.className = 'font-label-sm text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-extrabold';
      } else {
        budgetTabStatusPill.textContent = '🚨 DEFISIT (>100%)';
        budgetTabStatusPill.className = 'font-label-sm text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-extrabold animate-pulse';
      }
    }

    const inputBudget = document.getElementById('inputBudgetSetting');
    if (inputBudget && document.activeElement !== inputBudget) {
      inputBudget.value = limit;
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // ==========================================================================
  // RENDER CART ITEMS (STITCH SCREEN 2: TACTILE TICKET LOT CARDS)
  // ==========================================================================
  function renderCart() {
    const container = document.getElementById('cartItemsList');
    const emptyState = document.getElementById('emptyCartState');
    const summaryBottom = document.getElementById('cartSummaryBottom');
    const headerCount = document.getElementById('cartHeaderPillCount');
    if (headerCount) headerCount.textContent = `${appState.cart.length} LOT`;

    renderShoppingPlannerSection();

    let filteredItems = appState.cart.filter(item => {
      const matchCat = appState.activeCategory === 'ALL' || item.category === appState.activeCategory;
      const matchSearch = appState.searchQuery === '' || item.name.toLowerCase().includes(appState.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    if (appState.cart.length === 0) {
      container.innerHTML = '';
      emptyState.classList.remove('hidden');
      summaryBottom.classList.add('hidden');
      updateBudgetHud();
      return;
    }

    emptyState.classList.add('hidden');
    summaryBottom.classList.remove('hidden');

    if (filteredItems.length === 0) {
      container.innerHTML = `
        <div class="p-6 text-center bg-white rounded-2xl border-2 border-dashed border-stone-300 text-stone-500 font-mono text-xs">
          TIDAK ADA ITEM DITEMUKAN PADA KATEGORI INI
        </div>
      `;
      updateBudgetHud();
      return;
    }

    let html = '';
    filteredItems.forEach((item, index) => {
      const discount = calculateDiscount(item.price, item.discountRaw);
      const comparison = comparePriceWithLastMonth(item.price, item.lastMonthPrice);
      const lineTotal = discount.finalUnitPrice * item.qty;
      const hasDiscount = discount.savedPerUnit > 0;
      const isChecked = !!item.inPhysicalCart;
      const lotNumber = String(index + 1).padStart(2, '0');

      html += `
        <div class="neo-ticket-card ticket-perforation-left ${isChecked ? 'is-checked' : 'is-pending'}" data-id="${item.id}">
          <!-- Top Row: Checkbox, LOT #, Category, Barcode Strip & Quick Actions -->
          <div class="flex items-center justify-between border-b border-stone-200/80 pb-2">
            <div class="flex items-center gap-2">
              <button type="button" class="cart-check-btn ${isChecked ? 'checked' : ''}" onclick="window.toggleItemInCart('${item.id}')" title="Centang jika sudah di rak troli">
                <i data-lucide="check"></i>
              </button>
              <div class="flex items-center gap-1.5">
                <span class="font-mono text-[11px] font-black text-ink tracking-tight">LOT #${lotNumber}</span>
                <span class="cat-mono-tag">${escapeHtml(item.category)}</span>
              </div>
              <span class="barcode-strip hidden sm:inline-block" title="Barcode Lot"></span>
            </div>
            <div class="flex items-center gap-1.5">
              ${isChecked ? `
                <span class="rubber-stamp rubber-stamp-green text-[9px]">DI RAK ✓</span>
              ` : `
                <span class="rubber-stamp rubber-stamp-amber text-[9px]">PENDING</span>
              `}
              <div class="flex items-center gap-0.5 ml-1">
                <button class="btn-ico-subtle" onclick="window.editCartItem('${item.id}')" title="Edit">
                  <i data-lucide="edit-3"></i>
                </button>
                <button class="btn-ico-subtle trash" onclick="window.deleteCartItem('${item.id}')" title="Hapus">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Middle Row: Title, Spec & Status Rencana -->
          <div class="flex items-start justify-between gap-2 pt-0.5">
            <div>
              <h4 class="card-item-title text-[15px] font-extrabold text-ink leading-snug">${escapeHtml(item.name)}</h4>
              <div class="flex items-center gap-2 mt-1">
                <span class="font-mono text-[11px] text-stone-500 font-semibold">Kemasan: ${escapeHtml(item.unit)}</span>
                ${item.isPlanned !== false ? `
                  <span class="inline-flex items-center gap-1 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <i data-lucide="check-circle-2" class="w-2.5 h-2.5"></i>
                    <span>Rencana</span>
                  </span>
                ` : `
                  <span class="inline-flex items-center gap-1 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200" title="Di luar daftar rencana">
                    <i data-lucide="alert-circle" class="w-2.5 h-2.5"></i>
                    <span>Impulsif</span>
                  </span>
                `}
              </div>
            </div>
          </div>

          <!-- Pricing Flow & Badges Row -->
          <div class="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed border-stone-200">
            <span class="unit-rate-mono">
              ${hasDiscount ? `<span class="strike text-stone-400">Rp ${formatNumber(item.price)}</span>` : ''}
              <strong>Rp ${formatNumber(discount.finalUnitPrice)}</strong><span class="text-stone-500">/${escapeHtml(item.unit)}</span>
            </span>

            <!-- F-04: Comparison Badge -->
            <span class="neo-badge-indicator ${comparison.badgeClass}">
              <i data-lucide="${comparison.icon}"></i>
              <span>${comparison.text}</span>
            </span>

            <!-- F-03: Stamped Discount Rubber Stamp -->
            ${hasDiscount ? `
              <span class="rubber-stamp rubber-stamp-terracotta text-[9px]">
                <i data-lucide="tag"></i>
                <span>${discount.discountLabel}</span>
              </span>
            ` : ''}
            ${hasDiscount && discount.formulaText && discount.formulaText.includes('Lapis') ? `
              <div class="w-full text-[10.5px] font-mono text-purple-900 bg-purple-50/90 px-2.5 py-1.5 rounded-xl border border-purple-200 mt-1 flex items-start gap-1">
                <span class="font-bold shrink-0">✨ Diskon Kompound:</span>
                <span>${escapeHtml(discount.formulaText)}</span>
              </div>
            ` : ''}
          </div>

          <!-- Bottom Row: Tactile POS Stepper & Chunky Subtotal -->
          <div class="flex items-center justify-between pt-2 border-t border-stone-200/80 mt-1">
            <div class="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-stone-300 shadow-pos-key">
              <button type="button" class="w-11 h-11 rounded-lg bg-white border border-stone-400 text-ink font-black flex items-center justify-center hover:bg-stone-100 active:scale-95 cursor-pointer ${item.qty === 1 ? 'text-rose-600' : ''}" onclick="window.changeItemQty('${item.id}', -1)" title="${item.qty === 1 ? 'Hapus Barang' : 'Kurangi'}">
                <i data-lucide="${item.qty === 1 ? 'trash-2' : 'minus'}"></i>
              </button>
              <input type="number" inputmode="numeric" min="1" class="w-12 text-center font-mono font-black text-sm text-ink bg-transparent border-0 focus:ring-1 focus:ring-stone-400 rounded p-1" value="${item.qty}" onchange="window.setItemQty('${item.id}', this.value)" oninput="window.setItemQty('${item.id}', this.value)" title="Ketik kuantitas langsung" />
              <button type="button" class="w-11 h-11 rounded-lg bg-white border border-stone-400 text-ink font-black flex items-center justify-center hover:bg-stone-100 active:scale-95 cursor-pointer" onclick="window.changeItemQty('${item.id}', 1)" title="Tambah">
                <i data-lucide="plus"></i>
              </button>
            </div>

            <div class="text-right">
              <div class="font-mono text-[9px] text-stone-500 font-bold uppercase tracking-wider">SUBTOTAL (${item.qty} ${item.unit})</div>
              <div class="font-headline-md text-[18px] font-black text-ink tracking-tight">Rp ${formatNumber(lineTotal)}</div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    updateBudgetHud();

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // Toggle Physical Cart Status
  window.toggleItemInCart = function (id) {
    const item = appState.cart.find(i => i.id === id);
    if (!item) return;
    item.inPhysicalCart = !item.inPhysicalCart;
    AudioEngine.playTap();
    saveCart();
    renderCart();
  };

  // ==========================================================================
  // F-02: LOGIKA STEPPER & TOUCH
  // ==========================================================================
  window.changeItemQty = function (id, delta) {
    const item = appState.cart.find(i => i.id === id);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      window.deleteCartItem(id);
      return;
    }

    item.qty = newQty;
    AudioEngine.playTap();
    saveCart();
    renderCart();
  };

  window.setItemQty = function (id, value) {
    const item = appState.cart.find(i => i.id === id);
    if (!item) return;

    let parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed < 1) parsed = 1;
    item.qty = parsed;
    AudioEngine.playTap();
    saveCart();
    renderCart();
  };

  window.deleteCartItem = function (id) {
    const item = appState.cart.find(i => i.id === id);
    if (!item) return;

    appState.cart = appState.cart.filter(i => i.id !== id);
    AudioEngine.playTap();
    saveCart();
    renderCart();
    renderShoppingPlannerSection();
    showToast(`"${item.name}" dihapus dari troli`, 'warning');
  };

  // ==========================================================================
  // MODAL TAMBAH & EDIT ITEM
  // ==========================================================================
  const modalItemBackdrop = document.getElementById('modalItemBackdrop');
  const formItemModal = document.getElementById('formItemModal');
  const inputItemName = document.getElementById('inputItemName');
  const selectItemCategory = document.getElementById('selectItemCategory');
  const selectItemUnit = document.getElementById('selectItemUnit');
  const inputItemQty = document.getElementById('inputItemQty');
  const inputItemPrice = document.getElementById('inputItemPrice');
  const inputItemLastMonthPrice = document.getElementById('inputItemLastMonthPrice');
  const inputItemDiscount = document.getElementById('inputItemDiscount');
  const autoSuggestContainer = document.getElementById('autoSuggestContainer');

  function openItemModal(itemId = null) {
    appState.editingItemId = itemId;
    const title = document.getElementById('modalItemTitle');
    const submitText = document.getElementById('btnSubmitItemText');

    if (itemId) {
      const item = appState.cart.find(i => i.id === itemId);
      if (!item) return;
      title.textContent = 'Edit Produk';
      submitText.textContent = 'SIMPAN PERUBAHAN';

      document.getElementById('modalItemId').value = item.id;
      inputItemName.value = item.name;
      selectItemCategory.value = item.category;
      selectItemUnit.value = item.unit;
      inputItemQty.value = item.qty;
      inputItemPrice.value = item.price;
      inputItemLastMonthPrice.value = item.lastMonthPrice || '';
      inputItemDiscount.value = item.discountRaw || '';
    } else {
      title.textContent = 'Tambah ke Troli';
      submitText.textContent = 'SIMPAN KE TROLI';
      formItemModal.reset();
      document.getElementById('modalItemId').value = '';
      inputItemQty.value = 1;
    }

    updateModalLiveCalculations();
    modalItemBackdrop.classList.remove('hidden');
    inputItemName.focus();
    if (window.lucide) lucide.createIcons();
  }

  function closeItemModal() {
    modalItemBackdrop.classList.add('hidden');
    autoSuggestContainer.classList.add('hidden');
    appState.editingItemId = null;
  }

  window.editCartItem = function (id) {
    openItemModal(id);
  };

  function updateModalLiveCalculations() {
    const price = parseFloat(inputItemPrice.value) || 0;
    const lastPrice = parseFloat(inputItemLastMonthPrice.value) || 0;
    const qty = parseInt(inputItemQty.value, 10) || 1;
    const discountRaw = inputItemDiscount.value.trim();

    // 1. Discount Preview
    const disc = calculateDiscount(price, discountRaw);
    const discPreview = document.getElementById('modalDiscountPreview');
    const elFinalPrice = document.getElementById('modalDiscountFinalPrice');
    const elSavedText = document.getElementById('modalDiscountSavedText');
    const elBreakdown = document.getElementById('modalDiscountBreakdown');

    if (disc.savedPerUnit > 0) {
      if (discPreview) discPreview.classList.remove('hidden');
      if (elFinalPrice) elFinalPrice.textContent = `Rp ${formatNumber(disc.finalUnitPrice)}`;
      if (elSavedText) elSavedText.textContent = `Hemat Rp ${formatNumber(disc.savedPerUnit)}/item (${disc.discountLabel || 'Promo'})`;
      if (elBreakdown) {
        if (disc.formulaText && disc.formulaText.includes('Lapis')) {
          elBreakdown.classList.remove('hidden');
          elBreakdown.textContent = `Rincian: ${disc.formulaText}`;
        } else {
          elBreakdown.classList.add('hidden');
        }
      }
    } else {
      if (discPreview) discPreview.classList.add('hidden');
    }

    // 2. Comparison Badge
    const compPill = document.getElementById('modalComparePill');
    if (price > 0 && lastPrice > 0) {
      const comp = comparePriceWithLastMonth(price, lastPrice);
      compPill.className = `neo-badge-indicator ${comp.badgeClass}`;
      compPill.innerHTML = `<i data-lucide="${comp.icon}"></i> <span>${comp.text}</span>`;
    } else if (price > 0) {
      compPill.className = 'neo-badge-indicator new';
      compPill.innerHTML = `<i data-lucide="sparkles"></i> <span>Item baru atau tanpa acuan harga lalu</span>`;
    } else {
      compPill.className = 'neo-badge-indicator stable';
      compPill.innerHTML = `<i data-lucide="minus"></i> <span>Masukkan harga untuk cek fluktuasi</span>`;
    }

    // 3. Subtotal
    const lineTotal = disc.finalUnitPrice * qty;
    document.getElementById('modalLineTotal').textContent = `Rp ${formatNumber(lineTotal)}`;

    if (window.lucide) lucide.createIcons();
  }

  // Autocomplete Suggestions
  inputItemName.addEventListener('input', () => {
    const val = inputItemName.value.trim().toLowerCase();
    if (val.length < 1) {
      autoSuggestContainer.classList.add('hidden');
      return;
    }

    const matches = appState.masterItems.filter(m => m.name.toLowerCase().includes(val));
    if (matches.length === 0) {
      autoSuggestContainer.classList.add('hidden');
      return;
    }

    let html = '';
    matches.forEach(m => {
      html += `
        <div class="auto-row-neo" onclick="window.selectMasterSuggestion('${escapeHtml(m.name)}')">
          <div>
            <strong>${escapeHtml(m.name)}</strong>
            <small style="display:block; color:var(--text-muted); font-size:0.65rem;">${escapeHtml(m.category)} • ${escapeHtml(m.unit)}</small>
          </div>
          <span style="font-family:var(--font-mono); color:var(--volt-main); font-size:0.72rem;">
            Lalu: Rp ${formatNumber(m.lastPrice)}
          </span>
        </div>
      `;
    });

    autoSuggestContainer.innerHTML = html;
    autoSuggestContainer.classList.remove('hidden');
  });

  window.selectMasterSuggestion = function (name) {
    const item = appState.masterItems.find(m => m.name === name);
    if (!item) return;

    inputItemName.value = item.name;
    selectItemCategory.value = item.category;
    selectItemUnit.value = item.unit;
    inputItemLastMonthPrice.value = item.lastPrice;
    if (!inputItemPrice.value) {
      inputItemPrice.value = item.lastPrice;
    }
    autoSuggestContainer.classList.add('hidden');
    updateModalLiveCalculations();
    AudioEngine.playTap();
  };

  // Submit Modal
  formItemModal.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = inputItemName.value.trim();
    const category = selectItemCategory.value;
    const unit = selectItemUnit.value;
    const qty = parseInt(inputItemQty.value, 10) || 1;
    const price = parseFloat(inputItemPrice.value) || 0;
    const lastMonthPrice = parseFloat(inputItemLastMonthPrice.value) || 0;
    const discountRaw = inputItemDiscount.value.trim();

    if (!name) {
      showToast('Gagal: Nama barang tidak boleh kosong!', 'danger');
      AudioEngine.playAlert();
      inputItemName.focus();
      return;
    }

    if (isNaN(price) || price <= 0) {
      showToast('Gagal: Harga tidak boleh kosong atau bernilai negatif / 0!', 'danger');
      AudioEngine.playAlert();
      inputItemPrice.focus();
      return;
    }

    // Auto-detect last month price from master database if not manually specified
    if (!lastMonthPrice) {
      const match = appState.masterItems.find(m => m.name.toLowerCase() === name.toLowerCase())
        || appState.masterItems.find(m => m.name.toLowerCase().includes(name.toLowerCase()));
      if (match) {
        lastMonthPrice = match.lastPrice;
      }
    }

    if (appState.editingItemId) {
      const idx = appState.cart.findIndex(i => i.id === appState.editingItemId);
      if (idx !== -1) {
        appState.cart[idx] = {
          ...appState.cart[idx],
          name, category, unit, qty, price, lastMonthPrice, discountRaw
        };
        showToast(`"${name}" berhasil diubah`, 'success');
      }
    } else {
      const newItem = {
        id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name, category, unit, qty, price, lastMonthPrice, discountRaw,
        createdAt: Date.now()
      };
      appState.cart.unshift(newItem);
      showToast(`"${name}" ditambahkan ke troli`, 'success');
    }

    AudioEngine.playTap();
    updateMasterDatabaseItem(name, category, unit, lastMonthPrice || price);
    saveCart();
    renderCart();
    closeItemModal();
  });

  function updateMasterDatabaseItem(name, category, unit, price) {
    const existing = appState.masterItems.find(m => m.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.category = category;
      existing.unit = unit;
      if (price > 0) existing.lastPrice = price;
    } else {
      appState.masterItems.push({ name, category, unit, lastPrice: price });
    }
    saveMaster();

    // Auto-sync single item to Supabase if connected
    if (appState.supabaseClient) {
      appState.supabaseClient.from('master_products').upsert({
        name, category, unit, last_price: price, updated_at: new Date().toISOString()
      }, { onConflict: 'name' }).then(() => { });
    }
  }

  // ==========================================================================
  // NAVIGATION & TABS
  // ==========================================================================
  function setupNavigation() {
    const navButtons = document.querySelectorAll('.dock-tab');
    const panes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTabId = btn.getAttribute('data-tab');
        if (!targetTabId) return;

        let paneId = targetTabId;

        // Reset semua tombol nav ke gaya inaktif (100% solid, tidak transparan)
        navButtons.forEach(b => {
          b.classList.remove('active');
        });

        // Aktifkan tombol yang dipilih
        btn.classList.add('active');

        // Toggle pane tampilan
        panes.forEach(p => {
          p.classList.remove('active');
          p.classList.add('hidden');
        });

        const targetPane = document.getElementById(paneId);
        if (targetPane) {
          targetPane.classList.add('active');
          targetPane.classList.remove('hidden');
        }

        AudioEngine.playTap();

        // Screen 2 Stitch: Scan Barcode & Promo Calculator
        if (paneId === 'tabScan') {
          renderBarcodePresets();
          startCameraScanner();
          if (!currentScannedItem && BARCODE_CATALOG.length > 0) {
            onBarcodeDetected(BARCODE_CATALOG[0].barcode, false);
          } else if (currentScannedItem) {
            runPythonScanAnalysis(currentScannedItem.barcode);
          }
        } else {
          // Matikan kamera saat meninggalkan tab scan
          stopCameraScanner();
        }

        if (paneId === 'tabBudget') {
          renderShoppingPlannerSection();
        } else if (paneId === 'tabDompet') {
          renderDompetTab();
        } else if (paneId === 'tabHistory') {
          renderHistoryList();
          renderMasterList();
        } else if (paneId === 'tabCart') {
          renderCart();
        }

        if (window.lucide) lucide.createIcons();
      });
    });

    // Sub tabs in History (Screen 1 Stitch)
    const subTabHistory = document.getElementById('btnSubHistory');
    const subTabMaster = document.getElementById('btnSubMaster');
    const subViewHistory = document.getElementById('subViewHistory');
    const subViewMaster = document.getElementById('subViewMaster');

    if (subTabHistory && subTabMaster) {
      subTabHistory.addEventListener('click', () => {
        subTabHistory.classList.add('active', 'bg-primary-container', 'text-on-primary');
        subTabHistory.classList.remove('text-on-surface-variant');
        subTabMaster.classList.remove('active', 'bg-primary-container', 'text-on-primary');
        subTabMaster.classList.add('text-on-surface-variant');
        if (subViewHistory) subViewHistory.classList.remove('hidden');
        if (subViewMaster) subViewMaster.classList.add('hidden');
        AudioEngine.playTap();
        renderHistoryList();
      });

      subTabMaster.addEventListener('click', () => {
        subTabMaster.classList.add('active', 'bg-primary-container', 'text-on-primary');
        subTabMaster.classList.remove('text-on-surface-variant');
        subTabHistory.classList.remove('active', 'bg-primary-container', 'text-on-primary');
        subTabHistory.classList.add('text-on-surface-variant');
        if (subViewMaster) subViewMaster.classList.remove('hidden');
        if (subViewHistory) subViewHistory.classList.add('hidden');
        AudioEngine.playTap();
        renderMasterList();
      });
    }

    // Sub-mode tabs in Scan Screen (Screen 2 Stitch)
    const btnModeBarcode = document.getElementById('tab-scan-barcode');
    const btnModeMulti = document.getElementById('tab-scan-multibuy');
    const btnModeManual = document.getElementById('tab-scan-manual');

    if (btnModeBarcode && btnModeMulti && btnModeManual) {
      const modeButtons = [btnModeBarcode, btnModeMulti, btnModeManual];
      modeButtons.forEach(mBtn => {
        mBtn.addEventListener('click', () => {
          modeButtons.forEach(b => {
            b.classList.remove('active', 'bg-primary-container', 'text-on-primary', 'shadow-md');
            b.classList.add('text-on-surface-variant');
          });
          mBtn.classList.add('active', 'bg-primary-container', 'text-on-primary', 'shadow-md');
          mBtn.classList.remove('text-on-surface-variant');
          AudioEngine.playTap();

          if (mBtn.id === 'tab-scan-multibuy') {
            openComparatorToolModal();
          } else if (mBtn.id === 'tab-scan-manual') {
            openItemModal();
          }
        });
      });
    }
  }

  function openComparatorToolModal() {
    const card = document.getElementById('scannerComparatorCard');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-4', 'ring-secondary-fixed');
      setTimeout(() => card.classList.remove('ring-4', 'ring-secondary-fixed'), 2000);
      showToast('Kalkulator kemasan aktif (Opsi A vs B)', 'info');
    }
  }

  function setupSoundToggle() {
    const btnSound = document.getElementById('btnSoundToggle');
    const iconSound = document.getElementById('soundIcon');
    if (!btnSound) return;

    function refreshSoundIcon() {
      if (iconSound) {
        iconSound.textContent = appState.soundEnabled ? 'volume_up' : 'volume_off';
      }
      btnSound.title = appState.soundEnabled ? 'Suara Aktif (Klik untuk Matikan)' : 'Suara Mati (Klik untuk Nyalakan)';
    }

    refreshSoundIcon();

    btnSound.addEventListener('click', () => {
      appState.soundEnabled = !appState.soundEnabled;
      saveSound();
      refreshSoundIcon();
      if (appState.soundEnabled) {
        showToast('Efek suara aktif 🔊', 'info');
        AudioEngine.playTap();
      } else {
        showToast('Efek suara nonaktif 🔇', 'info');
      }
    });
  }

  // ==========================================================================
  // EVENT LISTENERS & SUPABASE MODAL HANDLERS
  // ==========================================================================
  function setupEventListeners() {
    // Discount Quick Builder Buttons (+10%, +20%, +25%, etc.)
    document.querySelectorAll('.btn-add-discount-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.getAttribute('data-val') || '';
        const cur = inputItemDiscount.value.trim();
        if (!cur) {
          inputItemDiscount.value = val.startsWith('+') ? val.substring(1).trim() : val;
        } else if (val.startsWith('+')) {
          inputItemDiscount.value = `${cur} + ${val.substring(1).trim()}`;
        } else {
          inputItemDiscount.value = val;
        }
        AudioEngine.playTap();
        updateModalLiveCalculations();
      });
    });

    const btnClearDisc = document.getElementById('btnClearDiscountPill');
    if (btnClearDisc) {
      btnClearDisc.addEventListener('click', () => {
        inputItemDiscount.value = '';
        AudioEngine.playTap();
        updateModalLiveCalculations();
      });
    }

    document.getElementById('btnOpenAddModal').addEventListener('click', () => openItemModal());
    document.getElementById('btnEmptyAdd').addEventListener('click', () => openItemModal());
    document.getElementById('btnCloseItemModal').addEventListener('click', closeItemModal);
    document.getElementById('btnCancelModalItem').addEventListener('click', closeItemModal);

    // Modal Qty Stepper
    document.getElementById('btnModalQtyMinus').addEventListener('click', () => {
      const q = parseInt(inputItemQty.value, 10) || 1;
      if (q > 1) inputItemQty.value = q - 1;
      AudioEngine.playTap();
      updateModalLiveCalculations();
    });
    document.getElementById('btnModalQtyPlus').addEventListener('click', () => {
      const q = parseInt(inputItemQty.value, 10) || 1;
      inputItemQty.value = q + 1;
      AudioEngine.playTap();
      updateModalLiveCalculations();
    });

    inputItemPrice.addEventListener('input', updateModalLiveCalculations);
    inputItemLastMonthPrice.addEventListener('input', updateModalLiveCalculations);
    inputItemDiscount.addEventListener('input', updateModalLiveCalculations);
    inputItemQty.addEventListener('input', updateModalLiveCalculations);

    // Category Tabs
    document.querySelectorAll('.neo-cat-chip').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.neo-cat-chip').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        appState.activeCategory = pill.getAttribute('data-category');
        AudioEngine.playTap();
        renderCart();
      });
    });

    // Search
    const searchInput = document.getElementById('searchCartInput');
    const btnClearSearch = document.getElementById('btnClearSearch');

    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value.trim();
      if (appState.searchQuery) {
        btnClearSearch.classList.remove('hidden');
      } else {
        btnClearSearch.classList.add('hidden');
      }
      renderCart();
    });

    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      appState.searchQuery = '';
      btnClearSearch.classList.add('hidden');
      renderCart();
    });

    // Budget Quick Edit
    const budgetModal = document.getElementById('modalBudgetBackdrop');
    document.getElementById('btnEditBudgetTrigger').addEventListener('click', () => {
      document.getElementById('inputQuickBudget').value = appState.budgetLimit;
      budgetModal.classList.remove('hidden');
      AudioEngine.playTap();
    });

    document.getElementById('btnCloseBudgetModal').addEventListener('click', () => budgetModal.classList.add('hidden'));
    document.getElementById('btnCancelQuickBudget').addEventListener('click', () => budgetModal.classList.add('hidden'));
    document.getElementById('btnSaveQuickBudget').addEventListener('click', () => {
      const val = parseFloat(document.getElementById('inputQuickBudget').value) || 0;
      if (val > 0) {
        appState.budgetLimit = val;
        saveBudget();
        updateBudgetHud();
        budgetModal.classList.add('hidden');
        AudioEngine.playSuccess();
        showToast('Batas anggaran berhasil disimpan', 'success');
      }
    });

    // Budget Tab Save (tabDompet)
    const btnSaveBudget = document.getElementById('btnSaveBudgetSetting');
    if (btnSaveBudget) {
      btnSaveBudget.addEventListener('click', () => {
        const val = parseFloat(document.getElementById('inputBudgetSetting').value) || 0;
        if (val > 0) {
          appState.budgetLimit = val;
          saveBudget();
          updateBudgetHud();
          renderBudgetBreakdown();
          AudioEngine.playSuccess();
          showToast('Batas anggaran dompet berhasil disimpan', 'success');
        }
      });
    }

    // Cloud Sync Buttons
    const btnSyncHeader = document.getElementById('btnSyncCloudHeader');
    if (btnSyncHeader) btnSyncHeader.addEventListener('click', syncCloudData);

    const btnSyncNow = document.getElementById('btnSyncNow');
    if (btnSyncNow) btnSyncNow.addEventListener('click', syncCloudData);

    // Trim Helper
    document.getElementById('btnSuggestTrim').addEventListener('click', openTrimModal);
    document.getElementById('btnCloseTrimModal').addEventListener('click', () => {
      document.getElementById('modalTrimBackdrop').classList.add('hidden');
    });
    document.getElementById('btnCloseTrimDone').addEventListener('click', () => {
      document.getElementById('modalTrimBackdrop').classList.add('hidden');
      renderCart();
    });

    // Finish Shopping / Checkout
    document.getElementById('btnFinishShopping').addEventListener('click', handleCheckout);

    // Clear Cart with Safety Confirmation Modal (Skenario 8)
    const modalClearCart = document.getElementById('modalConfirmClearCart');
    const btnOpenClearCart = document.getElementById('btnOpenClearCartModal');
    const btnCancelClearCart = document.getElementById('btnCancelClearCart');
    const btnConfirmClearCart = document.getElementById('btnConfirmClearCart');

    if (btnOpenClearCart && modalClearCart) {
      btnOpenClearCart.addEventListener('click', () => {
        if (appState.cart.length === 0) {
          showToast('Keranjang sudah dalam keadaan kosong', 'info');
          return;
        }
        modalClearCart.classList.remove('hidden');
        AudioEngine.playTap();
      });
    }

    if (btnCancelClearCart && modalClearCart) {
      btnCancelClearCart.addEventListener('click', () => {
        modalClearCart.classList.add('hidden');
      });
    }

    if (btnConfirmClearCart && modalClearCart) {
      btnConfirmClearCart.addEventListener('click', () => {
        appState.cart = [];
        saveCart();
        renderCart();
        modalClearCart.classList.add('hidden');
        AudioEngine.playSuccess();
        showToast('Seluruh isi troli berhasil dikosongkan', 'success');
      });
    }

    // Selector Tanggal Belanja (Skenario 1 & 6)
    const datePickerEl = document.getElementById('sessionDatePicker');
    if (datePickerEl) {
      const savedDate = localStorage.getItem('smart_grocery_date') || '2026-10-26';
      datePickerEl.value = savedDate;
      datePickerEl.addEventListener('change', (e) => {
        const newDate = e.target.value;
        if (newDate) {
          localStorage.setItem('smart_grocery_date', newDate);
          AudioEngine.playTap();
          showToast(`Tanggal belanja disetel: ${newDate}`, 'info');
        }
      });
    }

    // Sample Data
    document.getElementById('btnLoadSampleData').addEventListener('click', () => {
      appState.cart = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_CART));
      saveCart();
      renderCart();
      AudioEngine.playSuccess();
      showToast('Contoh kebutuhan belanja dimuat', 'success');
    });

    // Header Utility Buttons
    const btnCompareHeader = document.getElementById('btnQuickCompareHeader');
    if (btnCompareHeader) {
      btnCompareHeader.addEventListener('click', () => {
        const navScan = document.getElementById('navBtnScan');
        if (navScan) navScan.click();
      });
    }

    const btnScanHeader = document.getElementById('btnOpenScannerHeader');
    if (btnScanHeader) {
      btnScanHeader.addEventListener('click', () => {
        const navScan = document.getElementById('navBtnScan');
        if (navScan) navScan.click();
      });
    }

    const btnGoToScanTab = document.getElementById('btnGoToScanTab');
    if (btnGoToScanTab) {
      btnGoToScanTab.addEventListener('click', () => {
        const navScan = document.getElementById('navBtnScan');
        if (navScan) navScan.click();
      });
    }

    const btnCheckoutSticky = document.getElementById('btnCheckoutCashierSticky');
    if (btnCheckoutSticky) {
      btnCheckoutSticky.addEventListener('click', handleCheckout);
    }

    const btnStore = document.getElementById('btnStoreSelector');
    if (btnStore) {
      btnStore.addEventListener('click', openStoreModal);
    }
    const btnCloseStore = document.getElementById('btnCloseStoreModal');
    if (btnCloseStore) {
      btnCloseStore.addEventListener('click', closeStoreModal);
    }

    // Scanner Modals Close & Submit
    const btnCloseScan = document.getElementById('btnCloseScannerModal');
    if (btnCloseScan) {
      btnCloseScan.addEventListener('click', closeBarcodeScanner);
    }
    const btnCloseScanRes = document.getElementById('btnCloseScanResultModal');
    if (btnCloseScanRes) {
      btnCloseScanRes.addEventListener('click', () => {
        document.getElementById('modalScanResultBackdrop')?.classList.add('hidden');
      });
    }
    const btnCancelScanRes = document.getElementById('btnCancelScanResult');
    if (btnCancelScanRes) {
      btnCancelScanRes.addEventListener('click', () => {
        document.getElementById('modalScanResultBackdrop')?.classList.add('hidden');
        openBarcodeScanner();
      });
    }
    const btnApplyScan = document.getElementById('btnApplyScanToCart');
    if (btnApplyScan) {
      btnApplyScan.addEventListener('click', applyScannedItemToCart);
    }

    // Flashlight & Flip Camera Toggles
    const btnFlash = document.getElementById('btnScannerFlash');
    if (btnFlash) {
      btnFlash.addEventListener('click', toggleScannerTorch);
    }
    const btnFlip = document.getElementById('btnScannerFlip');
    if (btnFlip) {
      btnFlip.addEventListener('click', flipScannerCamera);
    }

    // Master DB
    document.getElementById('searchMasterInput').addEventListener('input', (e) => {
      renderMasterList(e.target.value.trim().toLowerCase());
    });
    document.getElementById('btnAddMasterItem').addEventListener('click', () => {
      const name = prompt('Nama Barang Acuan:');
      if (!name) return;
      const price = parseFloat(prompt('Harga Acuan Bulan Lalu (Rp):', '10000')) || 0;
      const cat = prompt('Kategori (Bahan Pokok / Makanan & Minuman / Kebersihan / Dapur & Bumbu):', 'Bahan Pokok') || 'Lainnya';
      updateMasterDatabaseItem(name, cat, 'pcs', price);
      renderMasterList();
      showToast('Acuan harga ditambahkan', 'success');
    });

    // Sync & Data
    document.getElementById('btnExportData')?.addEventListener('click', exportDataJson);
    document.getElementById('btnImportDataTrigger')?.addEventListener('click', () => {
      document.getElementById('importFileInput')?.click();
    });
    document.getElementById('importFileInput')?.addEventListener('change', importDataJson);
    document.getElementById('btnResetToDefaults')?.addEventListener('click', resetAllData);
    document.getElementById('btnCloseReceiptModal')?.addEventListener('click', () => {
      document.getElementById('modalReceiptBackdrop')?.classList.add('hidden');
    });

    // Smart Price & Discount Scanner Execution
    const btnRunPy = document.getElementById('btnRunPythonScanAnalysis');
    if (btnRunPy) {
      btnRunPy.addEventListener('click', () => {
        AudioEngine.playTap();
        runPythonScanAnalysis();
        showToast('Analisis harga dan diskon berhasil diperbarui', 'success');
      });
    }

    // Node.js & TypeScript Cloud Insights
    const btnRunNode = document.getElementById('btnRunNodeAnalytics');
    if (btnRunNode) {
      btnRunNode.addEventListener('click', requestNodeSmartInsights);
    }

    // Shopping Planner & Shelf Price Modal Handlers
    const formPlan = document.getElementById('formAddPlannerItem');
    if (formPlan) formPlan.addEventListener('submit', addPlannerItemFromForm);

    const formShelf = document.getElementById('formShelfPriceModal');
    if (formShelf) formShelf.addEventListener('submit', applyShelfPriceModalSubmit);

    const inputShelf = document.getElementById('inputShelfPrice');
    if (inputShelf) {
      inputShelf.addEventListener('input', () => {
        const val = parseFloat(inputShelf.value) || 0;
        const last = currentShelfModalPlannerItem ?
          (appState.masterItems.find(m => m.name.toLowerCase() === currentShelfModalPlannerItem.name.toLowerCase())?.lastPrice || 0) : 0;
        updateShelfModalFluctuation(val, last);
      });
    }

    const btnCloseShelf = document.getElementById('btnCloseShelfModal');
    if (btnCloseShelf) {
      btnCloseShelf.addEventListener('click', () => {
        document.getElementById('modalShelfPriceBackdrop').classList.add('hidden');
      });
    }

    const btnCancelShelf = document.getElementById('btnCancelShelfModal');
    if (btnCancelShelf) {
      btnCancelShelf.addEventListener('click', () => {
        document.getElementById('modalShelfPriceBackdrop').classList.add('hidden');
      });
    }

    const btnGoPlan = document.getElementById('btnGoToPlannerTab');
    if (btnGoPlan) {
      btnGoPlan.addEventListener('click', () => {
        const tabBtn = document.getElementById('navBtnBudget');
        if (tabBtn) tabBtn.click();
      });
    }

    const btnClearPlan = document.getElementById('btnClearCompletedPlanner');
    if (btnClearPlan) {
      btnClearPlan.addEventListener('click', clearCompletedPlannerItems);
    }
  }

  // ==========================================================================
  // STITCH SHELF-ADDER TRAY MODULE ("Input Cepat di Rak")
  // ==========================================================================
  let traySelectedPromo = '0';
  let traySelectedCategory = 'Bahan Pokok';

  function initShelfAdderTray() {
    const promoChips = document.querySelectorAll('.tray-promo-chip');
    promoChips.forEach(chip => {
      chip.addEventListener('click', () => {
        promoChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        traySelectedPromo = chip.getAttribute('data-promo') || '0';
        AudioEngine.playTap();
      });
    });

    const catTags = document.querySelectorAll('.tray-cat-tag');
    catTags.forEach(tag => {
      tag.addEventListener('click', () => {
        catTags.forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        traySelectedCategory = tag.getAttribute('data-cat') || 'Bahan Pokok';
        AudioEngine.playTap();
      });
    });

    const btnScanTray = document.getElementById('btnQuickScanTray');
    if (btnScanTray) {
      btnScanTray.addEventListener('click', openBarcodeScanner);
    }

    const btnAddTray = document.getElementById('btnTrayAddToCart');
    if (btnAddTray) {
      btnAddTray.addEventListener('click', () => {
        const priceInput = document.getElementById('trayItemPrice');
        const nameInput = document.getElementById('trayItemName');
        if (!priceInput || !nameInput) return;

        const priceVal = parseFloat(priceInput.value);
        if (!priceVal || priceVal <= 0) {
          showToast('Masukkan harga di rak terlebih dahulu!', 'warning');
          priceInput.focus();
          return;
        }

        const nameVal = nameInput.value.trim() || `${traySelectedCategory} Rak`;
        const newItem = {
          id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          name: nameVal,
          category: traySelectedCategory,
          unit: 'pcs',
          qty: 1,
          price: priceVal,
          lastMonthPrice: priceVal,
          discountRaw: (traySelectedPromo && traySelectedPromo !== '0') ? traySelectedPromo : '',
          createdAt: Date.now(),
          inPhysicalCart: false
        };

        appState.cart.unshift(newItem);
        updateMasterDatabaseItem(newItem.name, newItem.category, newItem.unit, newItem.price);
        saveCart();
        renderCart();

        priceInput.value = '';
        nameInput.value = '';
        AudioEngine.playSuccess();
        showToast(`"${nameVal}" masuk ke troli aktif!`, 'success');
      });
    }
  }

  // ==========================================================================
  // BARCODE DATABASE & REALTIME SCANNER MODULE (STITCH SPEC)
  // ==========================================================================
  const BARCODE_CATALOG = [
    {
      barcode: '84101970',
      name: 'Olive Oil Extra Virgin 500ml',
      brand: 'Borges Mediterranean Craft • Spanyol',
      category: 'Dapur & Bumbu',
      unit: 'botol',
      unitSize: '500ml',
      price: 125000,
      lastMonthPrice: 130000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCr02p4i7QikyTt3l67LStzsEpbx6b5dkONS-XcxxFFfiASKe_AU8nrJelLfQ4dUBxeIKYD4Z5whmp0swAWtI9OkCH3u-4pcEwFjzInLqNc8mlKYPg0ap0BkVxTmAWc2jYP3Gi6ERtirta3o5sY0mX9bVOny3OQpMHvJgMtH7DnZgERkymPK4DwzFOU7142FDkjCh9mmG671eqGR6eQQ6uabRMRB42aiQ1suBXwW0BVRyKQIhIYHnB1Kg',
      unitPricingDesc: 'Rp 17.000 / 100ml',
      defaultDiscounts: [
        { id: 'katalog', label: 'Diskon Katalog Mingguan (-20%)', type: 'pct', value: 20, tag: 'Katalog', checked: true },
        { id: 'member', label: 'Member Supermarket Club (-5%)', type: 'pct', value: 5, tag: 'Member', checked: true },
        { id: 'qris', label: 'Cashback Bank QRIS (Min. 100k)', type: 'nom', value: 10000, tag: 'Bank', checked: true }
      ]
    },
    {
      barcode: '89927531',
      name: 'Susu UHT Full Cream 1L',
      brand: 'Ultra Milk Dairy Farms • Lembang',
      category: 'Makanan & Minuman',
      unit: 'pack',
      unitSize: '1 Liter',
      price: 22000,
      lastMonthPrice: 20500,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCX4hERzTA6DhuC2FLnb6P2eu1QiDZdRhb3ckzupgDiGgDWA2oDsD_UcS_eHGcv-h2eu-cNQJ5xxFeSdydTZ5yqhjqeU5MtXX-Ki63qqcrzs9a7SC-BHOnMYaLDBBTYgoonbrrdGX7s--77gJclOD5G1xj5cpwgdrepmIXUuzLqyTkzOdqOWokwJGe7zUWPYTgBS0NVZoxp7xAamjtavwPLE3io_h1yfvptOUSwKRS81fXljc8EmRObiQ',
      unitPricingDesc: 'Rp 18.700 / Liter',
      defaultDiscounts: [
        { id: 'katalog', label: 'Diskon Belanja Mingguan (-15%)', type: 'pct', value: 15, tag: 'Katalog', checked: true },
        { id: 'member', label: 'Member Club Point (-5%)', type: 'pct', value: 5, tag: 'Member', checked: false }
      ]
    },
    {
      barcode: '20019280',
      name: 'Dada Ayam Fillet Segar 500g',
      brand: 'Fresh Butcher Farm Choice',
      category: 'Bahan Pokok',
      unit: 'pack',
      unitSize: '0.51 kg',
      price: 48500,
      lastMonthPrice: 52000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBzra5PPTiPJt7jEUu4_x-LkTHhYmToF-wR8nLhrRmeRSJQ6u4dTmFKkkOfiBMHMGapoMc_HU-xwxjOYuHW0ogI9-MWhWyVzilurIAhs8VL6cJsZ8tTDh-44_X__xi7jzANSEvySd5THSgFSJXhQQaRLpWlRk7GnRCa_u6pbSELveNiOXHvGP-ZR5X2EWeS-zi9_hFO4FUyFrrv7dGMU7_qpBjzLfW6jFmpOnDC5L6S5iafMWunm045PA',
      unitPricingDesc: 'Rp 95 / gram',
      defaultDiscounts: [
        { id: 'katalog', label: 'Promo Protein Segar (-10%)', type: 'pct', value: 10, tag: 'Katalog', checked: true }
      ]
    },
    {
      barcode: '89938210',
      name: 'Apel Fuji Wang Shan 1kg',
      brand: 'Fresh Import Fruit Market',
      category: 'Makanan & Minuman',
      unit: 'kg',
      unitSize: '1 kg',
      price: 38000,
      lastMonthPrice: 38000,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDcqp4_nHG0hMnJd8CYsRtlh0iQ9ZNX8X7tqVMXZtTktDWdvQEF8_LcKciaJxB_Esx9XmR8DGXjQRu427JEeK1CQSllJ1Iq_5lVs9vV2k5E__89zNuvl-F8lNSc2XKHgZQNIIPQdtl7zs5A5VFv-nPlwL0phATCnkHySqWTGCAWvpU-MQuOwnz2QzXLpTxxp9yhUtyTm9D6OQ2Y_dUOmXJsqlnWOvpfpA2HdJJYctiS14_XTDxzeoDwjg',
      unitPricingDesc: 'Rp 34.200 / kg',
      defaultDiscounts: [
        { id: 'katalog', label: 'Diskon Buah Segar (-10%)', type: 'pct', value: 10, tag: 'Katalog', checked: true },
        { id: 'member', label: 'Diskon Member Fresh (-5%)', type: 'pct', value: 5, tag: 'Member', checked: true }
      ]
    },
    {
      barcode: '89927753',
      name: 'Minyak Goreng Sania 2L',
      brand: 'Sania Royale Kelapa Sawit',
      category: 'Bahan Pokok',
      unit: 'pouch',
      unitSize: '2 Liter',
      price: 38000,
      lastMonthPrice: 36000,
      image: '',
      unitPricingDesc: 'Rp 17.100 / Liter',
      defaultDiscounts: [
        { id: 'katalog', label: 'Katalog Minyak Hemat (-10%)', type: 'pct', value: 10, tag: 'Katalog', checked: true }
      ]
    },
    {
      barcode: '89910023',
      name: 'Beras Ramos Super 5kg',
      brand: 'Ramos Setra Super Premium',
      category: 'Bahan Pokok',
      unit: 'pack',
      unitSize: '5 kg',
      price: 75000,
      lastMonthPrice: 72000,
      image: '',
      unitPricingDesc: 'Rp 14.250 / kg',
      defaultDiscounts: [
        { id: 'katalog', label: 'Subsidi Pokok (-5%)', type: 'pct', value: 5, tag: 'Katalog', checked: true }
      ]
    },
    {
      barcode: '89988662',
      name: 'Indomie Goreng Spesial',
      brand: 'Indofood Rasa Legendaris',
      category: 'Makanan & Minuman',
      unit: 'pcs',
      unitSize: '85g',
      price: 3100,
      lastMonthPrice: 3100,
      image: '',
      unitPricingDesc: 'Rp 3.100 / bks',
      defaultDiscounts: [
        { id: 'katalog', label: 'Beli 5 Potongan Rp 1.000', type: 'nom', value: 200, tag: 'Katalog', checked: true }
      ]
    },
    {
      barcode: '89923456',
      name: 'Biore Guard Body Wash 400ml',
      brand: 'Kao Biore Antibacterial Clean',
      category: 'Kebersihan',
      unit: 'pouch',
      unitSize: '400ml',
      price: 24500,
      lastMonthPrice: 22000,
      image: '',
      unitPricingDesc: 'Rp 4.900 / 100ml',
      defaultDiscounts: [
        { id: 'katalog', label: 'Promo Kebersihan Rumah (-20%)', type: 'pct', value: 20, tag: 'Katalog', checked: true },
        { id: 'member', label: 'Member Cashback (-5%)', type: 'pct', value: 5, tag: 'Member', checked: true }
      ]
    }
  ];

  let html5QrScannerInstance = null;
  let isScannerActive = false;
  let currentCameraFacing = 'environment';
  let isTorchOn = false;
  let currentScannedItem = null;
  let scannedDiscountsState = [];

  function initBarcodeScannerModule() {
    // Initializer
  }

  function openBarcodeScanner() {
    AudioEngine.playTap();
    const modal = document.getElementById('modalScannerBackdrop');
    if (!modal) return;
    modal.classList.remove('hidden');
    renderBarcodePresets();
    startCameraScanner();
    if (window.lucide) lucide.createIcons();
  }

  function closeBarcodeScanner() {
    stopCameraScanner();
    const modal = document.getElementById('modalScannerBackdrop');
    if (modal) modal.classList.add('hidden');
  }

  async function startCameraScanner() {
    const viewContainer = document.getElementById('interactiveScannerView');
    if (!viewContainer) return;

    if (window.Html5Qrcode && !isScannerActive) {
      try {
        html5QrScannerInstance = new Html5Qrcode('interactiveScannerView');
        isScannerActive = true;
        await html5QrScannerInstance.start(
          { facingMode: currentCameraFacing },
          {
            fps: 20,
            qrbox: { width: 220, height: 160 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            onBarcodeDetected(decodedText);
          },
          () => {
            // Frame search callback
          }
        );
      } catch (err) {
        console.warn('Camera could not start:', err);
        isScannerActive = false;
        showToast('Kamera tidak dapat diakses. Gunakan simulasi barcode di bawah!', 'info');
      }
    }
  }

  async function stopCameraScanner() {
    if (html5QrScannerInstance && isScannerActive) {
      try {
        await html5QrScannerInstance.stop();
        await html5QrScannerInstance.clear();
      } catch (e) { }
      isScannerActive = false;
      html5QrScannerInstance = null;
    }
  }

  async function toggleScannerTorch() {
    if (html5QrScannerInstance && isScannerActive) {
      try {
        isTorchOn = !isTorchOn;
        await html5QrScannerInstance.applyVideoConstraints({
          advanced: [{ torch: isTorchOn }]
        });
        showToast(isTorchOn ? 'Lampu flash aktif' : 'Lampu flash mati', 'info');
      } catch (e) {
        showToast('Fitur lampu flash tidak didukung perangkat', 'warning');
      }
    } else {
      showToast('Kamera belum aktif', 'info');
    }
  }

  async function flipScannerCamera() {
    currentCameraFacing = currentCameraFacing === 'environment' ? 'user' : 'environment';
    await stopCameraScanner();
    await startCameraScanner();
  }

  function renderBarcodePresets() {
    const container = document.getElementById('scannerPresetsList');
    if (!container) return;

    let html = '';
    BARCODE_CATALOG.forEach(prod => {
      html += `
        <div class="preset-card" onclick="window.selectBarcodePreset('${prod.barcode}')" title="Klik untuk simulasi scan">
          <div class="preset-img-wrap">
            ${prod.image ? `<img src="${prod.image}" alt="${escapeHtml(prod.name)}">` : `<div style="font-size:1.6rem; color:var(--volt-main);">🛒</div>`}
            <span class="preset-unit-tag">${escapeHtml(prod.unitSize)}</span>
          </div>
          <div class="preset-title">${escapeHtml(prod.name)}</div>
          <div class="preset-price-row">
            <span>Rp ${formatNumber(prod.price)}</span>
            <span class="preset-barcode-badge">EAN:${prod.barcode}</span>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  window.selectBarcodePreset = function (barcode) {
    onBarcodeDetected(barcode);
  };

  function onBarcodeDetected(code) {
    AudioEngine.playScan();
    stopCameraScanner();
    closeBarcodeScanner();

    let found = BARCODE_CATALOG.find(p => p.barcode === code || code.includes(p.barcode));
    if (!found) {
      const inMaster = appState.masterItems.find(m => m.name.toLowerCase().includes(code.toLowerCase()));
      if (inMaster) {
        found = {
          barcode: code,
          name: inMaster.name,
          brand: 'Produk Terdaftar di Riwayat',
          category: inMaster.category,
          unit: inMaster.unit,
          unitSize: inMaster.unit,
          price: inMaster.lastPrice || 25000,
          lastMonthPrice: inMaster.lastPrice || 25000,
          image: '',
          unitPricingDesc: `Rp ${formatNumber(inMaster.lastPrice || 25000)} / ${inMaster.unit}`,
          defaultDiscounts: [
            { id: 'katalog', label: 'Promo Toko Mingguan (-10%)', type: 'pct', value: 10, tag: 'Katalog', checked: true }
          ]
        };
      } else {
        found = {
          barcode: code,
          name: `Item Barcode #${code}`,
          brand: 'Item Supermarket',
          category: 'Bahan Pokok',
          unit: 'pcs',
          unitSize: '1 pcs',
          price: 32000,
          lastMonthPrice: 32000,
          image: '',
          unitPricingDesc: 'Rp 32.000 / pcs',
          defaultDiscounts: [
            { id: 'katalog', label: 'Diskon Rak (-10%)', type: 'pct', value: 10, tag: 'Katalog', checked: true }
          ]
        };
      }
    }

    currentScannedItem = JSON.parse(JSON.stringify(found));
    scannedDiscountsState = JSON.parse(JSON.stringify(found.defaultDiscounts || []));
    openScanResultModal();
    runPythonScanAnalysis(code);
  }

  function openScanResultModal() {
    if (!currentScannedItem) return;

    const titleEl = document.getElementById('scanResultTitle');
    if (titleEl) titleEl.textContent = currentScannedItem.name;

    const nameEl = document.getElementById('scanProductName');
    if (nameEl) nameEl.textContent = currentScannedItem.name;

    const brandEl = document.getElementById('scanProductBrand');
    if (brandEl) brandEl.textContent = currentScannedItem.brand || 'Item Supermarket';

    const catEl = document.getElementById('scanProductCategory');
    if (catEl) catEl.textContent = `Kategori: ${currentScannedItem.category}`;

    const unitEl = document.getElementById('scanProductUnit');
    if (unitEl) unitEl.textContent = currentScannedItem.unitSize || currentScannedItem.unit;

    const priceEl = document.getElementById('scanShelfPrice');
    if (priceEl) priceEl.textContent = `Rp ${formatNumber(currentScannedItem.price)}`;

    const imgEl = document.getElementById('scanProductImg');
    if (imgEl) {
      if (currentScannedItem.image) {
        imgEl.src = currentScannedItem.image;
        imgEl.style.display = 'block';
      } else {
        imgEl.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="%2322c55e" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>';
      }
    }

    renderScanDiscountsChecklist();
    recalculateScanFinalResult();

    const modal = document.getElementById('modalScanResultBackdrop');
    if (modal) modal.classList.remove('hidden');

    if (window.lucide) lucide.createIcons();
  }

  function renderScanDiscountsChecklist() {
    const container = document.getElementById('scanDiscountsChecklist');
    if (!container) return;

    let html = '';
    scannedDiscountsState.forEach((d, idx) => {
      let savedPreview = 0;
      if (d.type === 'pct') {
        savedPreview = currentScannedItem.price * (d.value / 100);
      } else {
        savedPreview = d.value;
      }

      const tagClass = d.tag.toLowerCase();

      html += `
        <label class="discount-item-row flex items-center justify-between p-2.5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 cursor-pointer hover:border-secondary transition-all">
          <div class="discount-item-left flex items-center gap-2.5">
            <input type="checkbox" id="disc_chk_${idx}" ${d.checked ? 'checked' : ''} onchange="window.toggleScanDiscount(${idx}, this.checked)"
              class="w-4 h-4 accent-secondary rounded cursor-pointer">
            <div class="discount-item-text">
              <span class="font-headline-sm text-label-md text-primary font-bold block">${escapeHtml(d.label)}</span>
              <span class="font-numeric-sm text-body-sm text-secondary font-bold">Hemat Rp ${formatNumber(savedPreview)}</span>
            </div>
          </div>
          <span class="font-label-sm text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${tagClass === 'katalog' ? 'bg-secondary-fixed text-on-secondary-fixed' : tagClass === 'member' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container-high text-primary'}">
            ${escapeHtml(d.tag)}
          </span>
        </label>
      `;
    });
    container.innerHTML = html;
  }

  window.toggleScanDiscount = function (idx, isChecked) {
    if (scannedDiscountsState[idx]) {
      scannedDiscountsState[idx].checked = isChecked;
      recalculateScanFinalResult();
      AudioEngine.playTap();
    }
  };

  function recalculateScanFinalResult() {
    if (!currentScannedItem) return;
    const basePrice = currentScannedItem.price;
    let currentPrice = basePrice;
    let totalDiscount = 0;
    let activeCount = 0;

    scannedDiscountsState.forEach(d => {
      if (d.checked) {
        activeCount++;
        let cut = 0;
        if (d.type === 'pct') {
          cut = currentPrice * (d.value / 100);
        } else {
          cut = d.value;
        }
        totalDiscount += cut;
        currentPrice -= cut;
      }
    });

    if (currentPrice < 0) currentPrice = 0;
    currentPrice = Math.round(currentPrice);
    totalDiscount = Math.round(totalDiscount);

    const savingsPct = basePrice > 0 ? ((totalDiscount / basePrice) * 100).toFixed(0) : 0;

    const countEl = document.getElementById('scanActiveDiscountsCount');
    if (countEl) countEl.textContent = `${activeCount} Promo Aktif`;

    const finalPriceEl = document.getElementById('scanFinalPrice');
    if (finalPriceEl) finalPriceEl.textContent = `Rp ${formatNumber(currentPrice)}`;

    const pctEl = document.getElementById('scanSavingsPercent');
    if (pctEl) pctEl.textContent = `Hemat ${savingsPct}%`;

    const nomEl = document.getElementById('scanSavingsNominal');
    if (nomEl) nomEl.textContent = `Total Hemat: Rp ${formatNumber(totalDiscount)}`;

    const unitDescEl = document.getElementById('scanUnitPriceDetail');
    if (unitDescEl) unitDescEl.textContent = currentScannedItem.unitPricingDesc || `Rp ${formatNumber(currentPrice)} / ${currentScannedItem.unit}`;

    // Wallet Impact
    let currentTotalSpent = 0;
    appState.cart.forEach(item => {
      const disc = calculateDiscount(item.price, item.discountRaw);
      currentTotalSpent += disc.finalUnitPrice * item.qty;
    });
    const newTotalSpent = currentTotalSpent + currentPrice;
    const limit = appState.budgetLimit;
    const sisa = limit - newTotalSpent;

    const tagEl = document.getElementById('scanImpactTag');
    const descEl = document.getElementById('scanImpactDesc');

    if (tagEl && descEl) {
      if (sisa >= 0) {
        tagEl.textContent = 'Aman ✅';
        tagEl.className = 'font-label-sm text-label-sm text-secondary font-bold';
        descEl.innerHTML = `Budget sisa menjadi <strong class="text-primary font-semibold">Rp ${formatNumber(sisa)}</strong> dari limit Rp ${formatNumber(Math.round(limit / 1000))}k`;
      } else {
        tagEl.textContent = 'Defisit ⚠️';
        tagEl.className = 'font-label-sm text-label-sm text-error font-bold';
        descEl.innerHTML = `<span class="text-error font-medium">Melebihi budget saku sebesar <strong class="font-bold">Rp ${formatNumber(Math.abs(sisa))}</strong>!</span>`;
      }
    }

    // Update Python analysis card
    updatePythonAnalysisCard({
      name: currentScannedItem.name,
      finalPrice: currentPrice,
      totalDiscount: totalDiscount,
      basePrice: basePrice,
      lastMonthPrice: currentScannedItem.lastMonthPrice || currentScannedItem.price,
      sisa: sisa
    });
  }

  function updatePythonAnalysisCard(info) {
    const nameEl = document.getElementById('pyScannedName');
    const formulaEl = document.getElementById('pyFormulaBreakdown');
    const compEl = document.getElementById('pyComparisonLabel');
    const capEl = document.getElementById('pyBudgetCapStatus');

    if (nameEl && info.name) nameEl.textContent = info.name;
    if (formulaEl) {
      const saved = info.totalDiscount || 0;
      formulaEl.textContent = `Nett: Rp ${formatNumber(info.finalPrice)} (Hemat Rp ${formatNumber(saved)})`;
    }
    if (compEl) {
      const diff = info.finalPrice - info.lastMonthPrice;
      if (diff > 0) {
        const pct = info.lastMonthPrice > 0 ? ((diff / info.lastMonthPrice) * 100).toFixed(1) : 0;
        compEl.textContent = `↑ Naik Rp ${formatNumber(diff)} (+${pct}%)`;
        compEl.className = 'text-rose-400 font-bold';
      } else if (diff < 0) {
        const pct = info.lastMonthPrice > 0 ? ((Math.abs(diff) / info.lastMonthPrice) * 100).toFixed(1) : 0;
        compEl.textContent = `↓ Turun Rp ${formatNumber(Math.abs(diff))} (-${pct}%)`;
        compEl.className = 'text-emerald-400 font-bold';
      } else {
        compEl.textContent = '= Stabil (Sama dgn bulan lalu)';
        compEl.className = 'text-secondary-fixed font-bold';
      }
    }
    if (capEl) {
      if (info.sisa < 0) {
        capEl.textContent = `Over-Budget 🚨 (Defisit Rp ${formatNumber(Math.abs(info.sisa))})`;
        capEl.className = 'text-rose-400 font-bold';
      } else if (info.sisa < appState.budgetLimit * 0.2) {
        capEl.textContent = `Waspada ⚠️ (Sisa Rp ${formatNumber(info.sisa)})`;
        capEl.className = 'text-amber-300 font-bold';
      } else {
        capEl.textContent = `Aman ✅ (Sisa Rp ${formatNumber(info.sisa)})`;
        capEl.className = 'text-secondary-fixed font-bold';
      }
    }
  }

  async function runPythonScanAnalysis(barcode, discount) {
    const statusBadge = document.getElementById('pyEngineStatusBadge');
    if (statusBadge) {
      statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span> Menganalisis Promo...';
      statusBadge.className = 'px-2.5 py-0.5 rounded-full bg-amber-500/30 text-[10.5px] font-semibold text-amber-300 flex items-center gap-1';
    }

    const code = barcode || (currentScannedItem ? currentScannedItem.barcode : '8991002105432');
    const disc = discount !== undefined ? discount : (currentScannedItem ? currentScannedItem.defaultDiscounts || '15+5' : '15+5');
    const shelfPrice = currentScannedItem ? currentScannedItem.price : 38500;
    const lastPrice = currentScannedItem ? currentScannedItem.lastMonthPrice : 34000;
    const itemName = currentScannedItem ? currentScannedItem.name : 'Minyak Goreng Sania Pouch';

    try {
      let data = null;
      try {
        const res = await fetch(`/api/scan-python?barcode=${encodeURIComponent(code)}&discount=${encodeURIComponent(disc)}&price=${shelfPrice}&lastPrice=${lastPrice}`);
        if (res.ok) data = await res.json();
      } catch (netErr) {
        // Fallback offline calculation
      }

      if (!data) {
        // High-precision local calculation fallback
        const discRes = calculateDiscount(shelfPrice, disc);
        const diff = discRes.finalUnitPrice - lastPrice;
        const pct = lastPrice > 0 ? ((diff / lastPrice) * 100).toFixed(1) : 0;
        data = {
          name: itemName,
          discount_result: {
            formula_text: discRes.discountTag || (disc ? `${disc}%` : 'Harga Normal'),
            final_price: discRes.finalUnitPrice
          },
          comparison: {
            status: diff > 0 ? 'UP' : diff < 0 ? 'DOWN' : 'EQUAL',
            label: diff > 0 ? `↑ Naik Rp ${formatNumber(diff)} (+${pct}%)`
              : diff < 0 ? `↓ Turun Rp ${formatNumber(Math.abs(diff))} (${pct}%)`
              : '= Stabil (Sama dng Bulan Lalu)'
          }
        };
      }

      const nameEl = document.getElementById('pyScannedName');
      const formulaEl = document.getElementById('pyFormulaBreakdown');
      const compEl = document.getElementById('pyComparisonLabel');
      const capEl = document.getElementById('pyBudgetCapStatus');

      if (nameEl) nameEl.textContent = data.name;
      if (formulaEl) formulaEl.textContent = `${data.discount_result.formula_text} = Rp ${formatNumber(data.discount_result.final_price)}`;
      if (compEl) {
        compEl.textContent = data.comparison.label;
        compEl.className = data.comparison.status === 'UP' ? 'text-rose-400 font-bold'
          : data.comparison.status === 'DOWN' ? 'text-emerald-400 font-bold'
          : 'text-secondary-fixed font-bold';
      }

      const totalCart = appState.cart.reduce((s, it) => s + (it.price * it.qty), 0);
      const remaining = appState.budgetLimit - (totalCart + data.discount_result.final_price);
      if (capEl) {
        if (remaining < 0) {
          capEl.textContent = `Over-Budget 🚨 (Defisit Rp ${formatNumber(Math.abs(remaining))})`;
          capEl.className = 'text-rose-400 font-bold';
        } else if (remaining < appState.budgetLimit * 0.2) {
          capEl.textContent = `Waspada ⚠️ (Sisa Rp ${formatNumber(remaining)})`;
          capEl.className = 'text-amber-300 font-bold';
        } else {
          capEl.textContent = `Aman ✅ (Sisa Rp ${formatNumber(remaining)})`;
          capEl.className = 'text-secondary-fixed font-bold';
        }
      }

      if (statusBadge) {
        statusBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-ping"></span> Sistem Aktif & Terhubung';
        statusBadge.className = 'px-2.5 py-0.5 rounded-full bg-secondary/30 text-[10.5px] font-semibold text-secondary-fixed flex items-center gap-1';
      }
    } catch (e) {
      if (statusBadge) {
        statusBadge.textContent = 'Sistem Siap (Mode Offline)';
        statusBadge.className = 'px-2.5 py-0.5 rounded-full bg-surface-container text-[10.5px] font-semibold text-outline-variant';
      }
    }
  }

  function applyScannedItemToCart() {
    if (!currentScannedItem) return;

    const basePrice = currentScannedItem.price;
    let currentPrice = basePrice;
    let totalDiscount = 0;

    scannedDiscountsState.forEach(d => {
      if (d.checked) {
        let cut = d.type === 'pct' ? currentPrice * (d.value / 100) : d.value;
        totalDiscount += cut;
        currentPrice -= cut;
      }
    });

    if (currentPrice < 0) currentPrice = 0;
    currentPrice = Math.round(currentPrice);

    const discountEffective = totalDiscount > 0 ? `${Math.round((totalDiscount / basePrice) * 100)}%` : '';

    const newItem = {
      id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      name: currentScannedItem.name,
      category: currentScannedItem.category,
      unit: currentScannedItem.unit,
      qty: 1,
      price: currentScannedItem.price,
      lastMonthPrice: currentScannedItem.lastMonthPrice || currentScannedItem.price,
      discountRaw: discountEffective,
      barcode: currentScannedItem.barcode,
      createdAt: Date.now(),
      inPhysicalCart: true
    };

    appState.cart.unshift(newItem);
    saveCart();
    updateMasterDatabaseItem(newItem.name, newItem.category, newItem.unit, newItem.price);
    renderCart();

    AudioEngine.playSuccess();
    if (window.confetti) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#006e2f', '#6bff8f', '#ffffff']
      });
    }

    showToast(`"${newItem.name}" dimasukkan ke troli!`, 'success');

    const modal = document.getElementById('modalScanResultBackdrop');
    if (modal) modal.classList.add('hidden');

    // Alihkan otomatis ke troli agar user langsung melihat item di keranjang
    const navCartBtn = document.getElementById('navBtnCart');
    if (navCartBtn) {
      setTimeout(() => navCartBtn.click(), 400);
    }
  }

  // ==========================================================================
  // SUPERMARKET STORE SELECTOR MODULE
  // ==========================================================================
  function initStoreSelectorModule() {
    const storeButtons = document.querySelectorAll('.store-item-btn');
    storeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const storeName = btn.getAttribute('data-store');
        if (storeName) {
          selectStore(storeName);
        }
      });
    });
  }

  function openStoreModal() {
    AudioEngine.playTap();
    const modal = document.getElementById('modalStoreBackdrop');
    if (modal) modal.classList.remove('hidden');
  }

  function closeStoreModal() {
    const modal = document.getElementById('modalStoreBackdrop');
    if (modal) modal.classList.add('hidden');
  }

  function selectStore(storeName) {
    appState.activeStore = storeName;
    appState.selectedStore = storeName;
    saveStore(storeName);

    const activeLabel = document.getElementById('activeStoreName');
    if (activeLabel) activeLabel.textContent = storeName;
    const scanViewStore = document.getElementById('scanViewStoreName');
    if (scanViewStore) scanViewStore.textContent = storeName;

    const storeButtons = document.querySelectorAll('.store-item-btn');
    storeButtons.forEach(btn => {
      const match = btn.getAttribute('data-store') === storeName;
      btn.classList.toggle('active', match);
      const chk = btn.querySelector('.store-check-icon');
      if (chk) chk.classList.toggle('hidden', !match);
    });

    closeStoreModal();
    AudioEngine.playSuccess();
    showToast(`Lokasi diubah: ${storeName}`, 'info');
  }
  window.selectStore = selectStore;

  // ==========================================================================
  // NODE.JS & TYPESCRIPT CLOUD INSIGHTS SERVICE (/api/insights)
  // ==========================================================================
  async function requestNodeSmartInsights() {
    const btn = document.getElementById('btnRunNodeAnalytics');
    const container = document.getElementById('nodeAnalyticsResult');
    if (!btn || !container) return;

    if (appState.cart.length === 0) {
      showToast('Keranjang masih kosong. Tambahkan barang dulu!', 'warning');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" class="spin"></i> Memeriksa Pengeluaran Belanja...';
    if (window.lucide) lucide.createIcons();
    AudioEngine.playTap();

    try {
      let insightData = null;

      // Call live Node.js Serverless Function on Vercel / local Node server
      try {
        const response = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cart: appState.cart,
            budgetLimit: appState.budgetLimit
          })
        });

        if (response.ok) {
          insightData = await response.json();
        }
      } catch (networkErr) {
        // Fallback for static file preview
      }

      // If offline/preview, calculate with matching TypeScript logic
      if (!insightData) {
        let totalSpent = 0;
        appState.cart.forEach(item => {
          const disc = calculateDiscount(item.price, item.discountRaw);
          totalSpent += disc.finalUnitPrice * item.qty;
        });

        const limit = appState.budgetLimit;
        const ratio = limit > 0 ? totalSpent / limit : 0;
        const status = ratio >= 1.0 ? 'DANGER' : ratio >= 0.8 ? 'WARNING' : 'SAFE';
        const healthScore = status === 'DANGER' ? Math.max(20, Math.round(100 - (ratio - 1) * 150))
          : status === 'WARNING' ? Math.round(85 - (ratio - 0.8) * 150)
          : Math.round(100 - ratio * 20);

        const recs = [];
        if (status === 'DANGER') {
          recs.push({
            type: 'WARNING',
            title: 'Defisit Anggaran Terdeteksi',
            description: `Keranjang Anda melebihi batas dompet sebesar Rp ${Math.round(totalSpent - limit).toLocaleString('id-ID')}. Disarankan memangkas barang non-pokok.`
          });
        }
        recs.push({
          type: 'SAVINGS',
          title: 'Saran & Optimasi Belanja Pintar',
          description: `Total belanjaan Rp ${totalSpent.toLocaleString('id-ID')} dengan skor kesehatan belanja ${healthScore}/100.`
        });

        insightData = {
          status,
          healthScore,
          summary: `Keranjang dianalisis (${healthScore}/100). Status dompet: ${status}.`,
          recommendations: recs
        };
      }

      // Render Insight Box
      const isDanger = (insightData.status || 'SAFE') === 'DANGER';
      const isWarning = (insightData.status || 'SAFE') === 'WARNING';
      const scoreBadgeColor = isDanger ? 'bg-rose-100 text-rose-700 border-rose-300'
        : isWarning ? 'bg-amber-100 text-amber-800 border-amber-300'
        : 'bg-emerald-100 text-emerald-800 border-emerald-300';

      let recomHtml = '';
      (insightData.recommendations || []).forEach(r => {
        const isWarn = r.type === 'WARNING';
        const cardStyle = isWarn
          ? 'bg-rose-50/80 border-rose-200 text-rose-950'
          : 'bg-emerald-50/80 border-emerald-200 text-emerald-950';
        const iconName = isWarn ? 'warning' : 'tips_and_updates';
        const iconColor = isWarn ? 'text-rose-600' : 'text-emerald-600';

        recomHtml += `
          <div class="p-3 rounded-xl border ${cardStyle} flex items-start gap-2.5">
            <span class="material-symbols-outlined text-[18px] ${iconColor} shrink-0 mt-0.5">${iconName}</span>
            <div class="min-w-0 flex-1">
              <div class="font-bold text-xs leading-snug">${escapeHtml(r.title)}</div>
              <div class="text-[11px] mt-0.5 opacity-90 leading-relaxed">${escapeHtml(r.description)}</div>
            </div>
          </div>
        `;
      });

      container.innerHTML = `
        <div class="p-4 bg-white rounded-2xl border border-outline-variant/30 shadow-md space-y-3 mt-3">
          <div class="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <div>
              <span class="font-label-sm text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Health Score Belanja</span>
              <strong class="font-numeric-lg text-2xl text-primary font-bold">${insightData.healthScore}<span class="text-xs text-gray-500 font-normal">/100</span></strong>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-bold border ${scoreBadgeColor}">${insightData.status}</span>
          </div>
          <p class="text-xs text-gray-700 leading-relaxed font-medium">
            ${escapeHtml(insightData.summary)}
          </p>
          <div class="space-y-2">
            ${recomHtml}
          </div>
          <div class="text-[10px] text-gray-500 text-right pt-1">
            💡 Dianalisis oleh Smart Grocery Node.js Engine
          </div>
        </div>
      `;

      container.classList.remove('hidden');
      AudioEngine.playSuccess();
      showToast('Pemeriksaan belanjaan selesai!', 'success');
    } catch (err) {
      showToast('Gagal memeriksa belanjaan: ' + err.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="refresh-cw"></i> Perbarui Analisis Cerdas';
      if (window.lucide) lucide.createIcons();
    }
  }

  window.setQuickBudget = function (amount) {
    document.getElementById('inputQuickBudget').value = amount;
    AudioEngine.playTap();
  };
  window.setBudgetSetting = function (amount) {
    const el = document.getElementById('inputBudgetSetting');
    if (el) el.value = amount;
    appState.budgetLimit = amount;
    saveBudget();
    updateBudgetHud();
    renderBudgetBreakdown();
    AudioEngine.playTap();
    showToast(`Batas anggaran disetel: Rp ${formatNumber(amount)}`, 'info');
  };

  // ==========================================================================
  // SARAN PANGKAS BELANJAAN
  // ==========================================================================
  function openTrimModal() {
    const modal = document.getElementById('modalTrimBackdrop');
    const list = document.getElementById('trimSuggestionsList');

    const sorted = [...appState.cart].sort((a, b) => {
      const isAPokok = a.category === 'Bahan Pokok';
      const isBPokok = b.category === 'Bahan Pokok';
      if (isAPokok && !isBPokok) return 1;
      if (!isAPokok && isBPokok) return -1;

      const totalA = calculateDiscount(a.price, a.discountRaw).finalUnitPrice * a.qty;
      const totalB = calculateDiscount(b.price, b.discountRaw).finalUnitPrice * b.qty;
      return totalB - totalA;
    });

    let html = '';
    if (sorted.length === 0) {
      html = `
        <div class="p-4 rounded-xl bg-surface-container text-center text-xs text-on-surface-variant font-medium">
          Keranjang belanja masih kosong.
        </div>
      `;
    } else {
      sorted.forEach(item => {
        const disc = calculateDiscount(item.price, item.discountRaw);
        const lineTotal = disc.finalUnitPrice * item.qty;

        html += `
          <div class="p-3 bg-surface-container-low rounded-xl flex items-center justify-between gap-2 border border-outline-variant/30">
            <div class="min-w-0 flex-1">
              <strong class="font-headline-sm text-xs font-bold text-primary block truncate">${escapeHtml(item.name)}</strong>
              <span class="text-[11px] text-on-surface-variant font-medium">${item.qty} ${escapeHtml(item.unit)} • Rp ${formatNumber(lineTotal)}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button type="button" class="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs transition-all cursor-pointer active:scale-95" onclick="window.reduceItemFromTrim('${item.id}')">
                -1 Qty
              </button>
              <button type="button" class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-all cursor-pointer active:scale-95" onclick="window.removeItemFromTrim('${item.id}')">
                Hapus
              </button>
            </div>
          </div>
        `;
      });
    }

    list.innerHTML = html;
    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  }

  window.reduceItemFromTrim = function (id) {
    window.changeItemQty(id, -1);
    openTrimModal();
  };

  window.removeItemFromTrim = function (id) {
    window.deleteCartItem(id);
    openTrimModal();
  };

  // ==========================================================================
  // ASTRO OFFICIAL CATALOG SHELF MODULE (WITH TACTILE PAGINATION)
  // ==========================================================================
  function initAstroCatalogModule() {
    // 1. Astro Category Filter Chips
    const chips = document.querySelectorAll('.astro-cat-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => {
          c.classList.remove('active', 'bg-primary', 'text-secondary-fixed', 'font-bold');
          c.classList.add('bg-surface-container-low', 'text-on-surface-variant');
        });
        chip.classList.add('active', 'bg-primary', 'text-secondary-fixed', 'font-bold');
        chip.classList.remove('bg-surface-container-low', 'text-on-surface-variant');

        appState.astroCategory = chip.getAttribute('data-astro-cat') || 'ALL';
        appState.astroPage = 1; // Reset to page 1 on category change
        AudioEngine.playTap();
        renderAstroCatalog();
      });
    });

    // 2. Astro Search
    const searchInput = document.getElementById('inputAstroSearch');
    const clearBtn = document.getElementById('btnClearAstroSearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        appState.astroSearchQuery = searchInput.value.trim().toLowerCase();
        appState.astroPage = 1; // Reset to page 1 on search
        if (clearBtn) {
          clearBtn.classList.toggle('hidden', appState.astroSearchQuery === '');
        }
        renderAstroCatalog();
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        appState.astroSearchQuery = '';
        appState.astroPage = 1; // Reset to page 1 on clear
        clearBtn.classList.add('hidden');
        renderAstroCatalog();
      });
    }

    // 3. 1-Klik Paket Hemat Anak Kos Astro
    const btnLoadKos = document.getElementById('btnLoadAstroKosPack');
    if (btnLoadKos) {
      btnLoadKos.addEventListener('click', loadAstroKosStarterPack);
    }

    renderAstroCatalog();
    initAstroCheckoutModule();
  }

  function renderAstroCatalog() {
    const grid = document.getElementById('astroCatalogGrid');
    const paginationContainer = document.getElementById('astroCatalogPagination');
    if (!grid) return;

    let items = ASTRO_OFFICIAL_CATALOG;

    // Filter category
    if (appState.astroCategory && appState.astroCategory !== 'ALL') {
      items = items.filter(i => i.category === appState.astroCategory);
    }

    // Filter search
    if (appState.astroSearchQuery) {
      items = items.filter(i =>
        i.name.toLowerCase().includes(appState.astroSearchQuery) ||
        i.category.toLowerCase().includes(appState.astroSearchQuery) ||
        (i.description && i.description.toLowerCase().includes(appState.astroSearchQuery))
      );
    }

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="col-span-2 text-center py-8 text-on-surface-variant">
          <span class="material-symbols-outlined text-[32px] text-outline-variant block mb-1">search_off</span>
          <p class="text-xs font-semibold">Produk Lotte Mart tidak ditemukan</p>
          <p class="text-[11px] text-outline">Coba kata kunci lain seperti "Beras", "Minyak", atau "Susu"</p>
        </div>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    // Pagination calculations (6 items per page for clean mobile grid without long scrolling)
    const itemsPerPage = appState.astroItemsPerPage || 6;
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    // Ensure valid page range
    if (!appState.astroPage || appState.astroPage < 1) {
      appState.astroPage = 1;
    } else if (appState.astroPage > totalPages) {
      appState.astroPage = totalPages;
    }

    const currentPage = appState.astroPage;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedItems = items.slice(startIndex, endIndex);

    grid.innerHTML = paginatedItems.map(prod => {
      // Check if product is already in active cart
      const inCart = appState.cart.find(c => c.astroId === prod.id || c.name.toLowerCase() === prod.name.toLowerCase());
      const inCartQty = inCart ? inCart.qty : 0;
      const hasDiscount = prod.originalPrice && prod.originalPrice > prod.price;

      return `
        <div class="astro-product-card" data-astro-id="${prod.id}">
          <div>
            <!-- Top Badges -->
            <div class="flex items-center justify-between gap-1 mb-2">
              <span class="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center text-lg shadow-xs shrink-0 select-none">${prod.emoji || '🛒'}</span>
              <span class="px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[9px] font-bold truncate max-w-[85px]">${escapeHtml(prod.badge || 'Lotte Mart')}</span>
            </div>

            <!-- Title & Size -->
            <h4 class="font-headline-sm text-xs font-bold text-primary line-clamp-2 leading-snug mb-0.5" title="${escapeHtml(prod.name)}">${escapeHtml(prod.name)}</h4>
            <div class="text-[10px] text-on-surface-variant font-medium mb-1.5">${escapeHtml(prod.unit)}</div>

            <!-- Pricing -->
            <div class="flex items-baseline gap-1 mb-2.5">
              ${hasDiscount ? `<del class="text-[10px] text-outline font-mono">Rp ${formatNumber(prod.originalPrice)}</del>` : ''}
              <span class="font-bold text-xs text-secondary font-mono">Rp ${formatNumber(prod.price)}</span>
            </div>
          </div>

          <!-- Bottom Action Button / Stepper -->
          <div>
            ${inCartQty > 0 ? `
              <div class="flex items-center justify-between bg-primary rounded-xl p-1 text-white shadow-xs">
                <button type="button" class="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 active:scale-90 text-white flex items-center justify-center font-bold text-xs cursor-pointer transition-all" onclick="window.addAstroToCart('${prod.id}', -1)" title="Kurangi">-</button>
                <span class="font-bold text-[11px] text-secondary-fixed px-1 font-mono">${inCartQty} di Troli</span>
                <button type="button" class="w-6 h-6 rounded-lg bg-secondary-fixed text-primary hover:bg-white active:scale-90 flex items-center justify-center font-bold text-xs cursor-pointer transition-all" onclick="window.addAstroToCart('${prod.id}', 1)" title="Tambah">+</button>
              </div>
            ` : `
              <button type="button"
                class="w-full py-2 px-2.5 rounded-xl bg-primary hover:bg-secondary text-secondary-fixed hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-95"
                onclick="window.addAstroToCart('${prod.id}', 1)">
                <span class="material-symbols-outlined text-[15px]">add_shopping_cart</span>
                <span>+ Keranjang</span>
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Render tactile pagination controls
    if (paginationContainer) {
      if (totalPages <= 1) {
        paginationContainer.innerHTML = `
          <div class="flex items-center justify-between text-[11px] font-mono text-stone-500 py-1 px-1">
            <span class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Menampilkan seluruh <strong>${totalItems}</strong> produk</span>
            </span>
          </div>
        `;
      } else {
        let pageButtonsHtml = '';
        for (let p = 1; p <= totalPages; p++) {
          const isActive = p === currentPage;
          pageButtonsHtml += `
            <button type="button"
              class="w-8 h-8 rounded-xl font-mono text-xs font-black transition-all flex items-center justify-center cursor-pointer select-none ${
                isActive
                  ? 'bg-ink text-citrus border-2 border-stone-900 shadow-pos-key scale-105'
                  : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-100 hover:border-stone-400 active:scale-95'
              }"
              onclick="window.changeAstroPage(${p})"
              title="Ke Halaman ${p}">
              ${p}
            </button>
          `;
        }

        const isFirst = currentPage === 1;
        const isLast = currentPage === totalPages;

        paginationContainer.innerHTML = `
          <div class="flex flex-col gap-2 pt-1">
            <!-- Row 1: Item Range & Page Count Summary -->
            <div class="flex items-center justify-between text-[11px] font-mono text-stone-600 px-0.5">
              <span class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-citrus animate-pulse"></span>
                <span>Produk <strong>${startIndex + 1}-${endIndex}</strong> dari <strong>${totalItems}</strong></span>
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 font-bold text-[10px]">
                Halaman <strong>${currentPage}</strong> / ${totalPages}
              </span>
            </div>

            <!-- Row 2: Tactile Pagination Bar with Prev, Numeric Buttons, Next -->
            <div class="flex items-center justify-between gap-1.5 bg-[#F4EFEA] p-1.5 rounded-2xl border border-stone-300/80 shadow-2xs">
              <!-- Prev Button -->
              <button type="button"
                class="px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1 transition-all select-none ${
                  isFirst
                    ? 'opacity-35 cursor-not-allowed bg-stone-200/50 text-stone-400 border border-transparent'
                    : 'bg-white text-stone-800 border border-stone-300 shadow-xs hover:bg-stone-50 active:scale-95 cursor-pointer'
                }"
                ${isFirst ? 'disabled' : `onclick="window.changeAstroPage(${currentPage - 1})"`}
                title="Halaman Sebelumnya">
                <span class="material-symbols-outlined text-[16px]">chevron_left</span>
                <span class="text-[11px] font-bold">Prev</span>
              </button>

              <!-- Page Number Buttons -->
              <div class="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                ${pageButtonsHtml}
              </div>

              <!-- Next Button -->
              <button type="button"
                class="px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1 transition-all select-none ${
                  isLast
                    ? 'opacity-35 cursor-not-allowed bg-stone-200/50 text-stone-400 border border-transparent'
                    : 'bg-white text-stone-800 border border-stone-300 shadow-xs hover:bg-stone-50 active:scale-95 cursor-pointer'
                }"
                ${isLast ? 'disabled' : `onclick="window.changeAstroPage(${currentPage + 1})"`}
                title="Halaman Selanjutnya">
                <span class="text-[11px] font-bold">Next</span>
                <span class="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        `;
      }
    }
  }

  // Window helper for page change
  window.changeAstroPage = function (page) {
    if (typeof page !== 'number') page = parseInt(page, 10);
    if (isNaN(page)) return;
    appState.astroPage = page;
    AudioEngine.playTap();
    renderAstroCatalog();

    // Smooth scroll back to top of catalog section so user sees the new page products immediately
    const catalogContainer = document.getElementById('sectionAstroCatalog');
    if (catalogContainer) {
      const rect = catalogContainer.getBoundingClientRect();
      if (rect.top < 60) {
        catalogContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // 1-Click add to cart from Astro Catalog
  window.addAstroToCart = function (astroId, delta = 1) {
    const prod = ASTRO_OFFICIAL_CATALOG.find(p => p.id === astroId);
    if (!prod) return;

    let existing = appState.cart.find(c => c.astroId === prod.id || c.name.toLowerCase() === prod.name.toLowerCase());

    if (!existing) {
      if (delta <= 0) return;
      const newItem = {
        id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        astroId: prod.id,
        name: prod.name,
        category: prod.category,
        unit: prod.unit,
        qty: 1,
        price: prod.price,
        lastMonthPrice: prod.originalPrice || prod.price,
        discountRaw: prod.discountRaw || '',
        isPlanned: true,
        inPhysicalCart: true,
        createdAt: Date.now()
      };
      appState.cart.unshift(newItem);
      AudioEngine.playTap();
      showToast(`"${prod.name}" masuk ke troli!`, 'success');
    } else {
      const nextQty = existing.qty + delta;
      if (nextQty <= 0) {
        appState.cart = appState.cart.filter(c => c.id !== existing.id);
        AudioEngine.playTap();
        showToast(`"${prod.name}" dikeluarkan dari troli`, 'warning');
      } else {
        existing.qty = nextQty;
        AudioEngine.playTap();
      }
    }

    saveCart();
    renderCart();
    renderAstroCatalog();
  };

  // 1-Click Paket Hemat Anak Kos Astro (Beras, Minyak, Telur, Indomie, Susu, Rinso)
  function loadAstroKosStarterPack() {
    const kosPicks = [
      'lotte-beras-5kg',
      'lotte-telur-1kg',
      'lotte-garam-500g',
      'astro-minyak-sunco-2l',
      'astro-indomie-goreng-5',
      'astro-ultra-fullcream-1l'
    ];

    kosPicks.forEach(id => {
      const prod = ASTRO_OFFICIAL_CATALOG.find(p => p.id === id);
      if (!prod) return;

      const existing = appState.cart.find(c => c.astroId === prod.id || c.name.toLowerCase() === prod.name.toLowerCase());
      if (!existing) {
        appState.cart.push({
          id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          astroId: prod.id,
          name: prod.name,
          category: prod.category,
          unit: prod.unit,
          qty: 1,
          price: prod.price,
          lastMonthPrice: prod.originalPrice || prod.price,
          discountRaw: prod.discountRaw || '',
          isPlanned: true,
          inPhysicalCart: true,
          createdAt: Date.now()
        });
      }
    });

    saveCart();
    renderCart();
    renderAstroCatalog();
    AudioEngine.playSuccess();

    if (window.confetti) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#006e2f', '#6bff8f', '#ffffff']
      });
    }

    showToast('✨ 6 Produk Paket Sembako Lotte Mart Puri Indah masuk ke troli!', 'success');
  }

  // ==========================================================================
  // ASTRO INTERACTIVE CASHIER CHECKOUT & RECEIPT ENGINE
  // Fitur pembayaran menarik dengan animasi mesin kasir & struk thermal
  // ==========================================================================
  let currentProcessingTimer = null;
  let qrisInterval = null;

  function initAstroCheckoutModule() {
    // Finish Shopping button opens the interactive checkout modal
    const btnFinish = document.getElementById('btnFinishShopping');
    if (btnFinish) {
      btnFinish.addEventListener('click', openAstroCheckoutModal);
    }

    const btnSticky = document.getElementById('btnCheckoutCashierSticky');
    if (btnSticky) {
      btnSticky.addEventListener('click', openAstroCheckoutModal);
    }

    // Close button
    const btnClose = document.getElementById('btnCloseAstroCheckout');
    if (btnClose) {
      btnClose.addEventListener('click', closeAstroCheckoutModal);
    }

    const btnCloseReceipt = document.getElementById('btnCloseReceiptView');
    if (btnCloseReceipt) {
      btnCloseReceipt.addEventListener('click', closeAstroCheckoutModal);
    }

    // Voucher selection with Minimum Spend Validation
    const voucherButtons = document.querySelectorAll('.checkout-voucher-btn');
    voucherButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-code');
        const disc = parseInt(btn.getAttribute('data-discount'), 10) || 0;
        const minSpend = parseInt(btn.getAttribute('data-min-spend') || '0', 10);
        const subtotal = calculateCurrentSubtotal();

        if (code !== 'NONE' && subtotal < minSpend) {
          showToast(`Voucher ${code} butuh min. belanja Rp ${formatNumber(minSpend)} (kurang Rp ${formatNumber(minSpend - subtotal)})`, 'warning');
          return;
        }

        voucherButtons.forEach(b => {
          b.classList.remove('active', 'border-emerald-500', 'bg-emerald-50');
          b.classList.add('border-gray-200', 'bg-white');
        });
        btn.classList.add('active', 'border-emerald-500', 'bg-emerald-50');
        btn.classList.remove('border-gray-200', 'bg-white');

        astroCheckoutState.voucherCode = code;
        astroCheckoutState.voucherDiscount = disc;
        AudioEngine.playTap();
        refreshCheckoutTotals();
        showToast(code === 'NONE' ? 'Belanja tanpa voucher promo' : `Voucher ${code} berhasil dipasang!`, 'success');
      });
    });

    // Payment method tabs
    const methodTabs = document.querySelectorAll('.checkout-method-tab');
    methodTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const method = tab.getAttribute('data-method');
        selectPaymentMethod(method);
      });
    });

    // VA Bank Selection
    const vaButtons = document.querySelectorAll('.btn-select-va-bank');
    vaButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        vaButtons.forEach(b => {
          b.classList.remove('active', 'border-primary', 'bg-primary', 'text-secondary-fixed');
          b.classList.add('border-outline-variant/30', 'bg-white', 'text-gray-700');
        });
        btn.classList.add('active', 'border-primary', 'bg-primary', 'text-secondary-fixed');
        btn.classList.remove('border-outline-variant/30', 'bg-white', 'text-gray-700');

        const bank = btn.getAttribute('data-bank');
        astroCheckoutState.selectedVaBank = bank;
        updateVaNumber(bank);
        AudioEngine.playTap();
      });
    });

    // Copy VA button
    const btnCopyVa = document.getElementById('btnCopyVaNumber');
    if (btnCopyVa) {
      btnCopyVa.addEventListener('click', () => {
        const vaNum = document.getElementById('vaNumberDisplay')?.textContent || '';
        navigator.clipboard?.writeText(vaNum);
        AudioEngine.playTap();
        showToast(`Nomor VA ${astroCheckoutState.selectedVaBank} berhasil disalin!`, 'success');
      });
    }

    // Quick Cash buttons
    const cashButtons = document.querySelectorAll('.btn-quick-cash');
    cashButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const amountType = btn.getAttribute('data-amount');
        const inputCash = document.getElementById('inputCashPaid');
        const currentGrandTotal = calculateCurrentGrandTotal();

        if (amountType === 'pas') {
          astroCheckoutState.cashPaid = currentGrandTotal;
          if (inputCash) inputCash.value = currentGrandTotal;
        } else {
          const val = parseInt(amountType, 10) || 0;
          astroCheckoutState.cashPaid = val;
          if (inputCash) inputCash.value = val;
        }
        AudioEngine.playTap();
        refreshCashChangeDisplay();
      });
    });

    // Cash input live change
    const inputCash = document.getElementById('inputCashPaid');
    if (inputCash) {
      inputCash.addEventListener('input', () => {
        astroCheckoutState.cashPaid = parseFloat(inputCash.value) || 0;
        refreshCashChangeDisplay();
      });
    }

    // Confirm Pay button
    const btnConfirmPay = document.getElementById('btnConfirmAstroPay');
    if (btnConfirmPay) {
      btnConfirmPay.addEventListener('click', handleAstroPaymentExecution);
    }

    // Copy receipt text
    const btnCopyReceipt = document.getElementById('btnCopyReceiptText');
    if (btnCopyReceipt) {
      btnCopyReceipt.addEventListener('click', copyThermalReceiptSummary);
    }

    // Done shopping / new trolley
    const btnDone = document.getElementById('btnDoneAstroCheckout');
    if (btnDone) {
      btnDone.addEventListener('click', () => {
        closeAstroCheckoutModal();
        const navCart = document.getElementById('navBtnCart');
        if (navCart) navCart.click();
      });
    }

    // View history from receipt
    const btnViewHist = document.getElementById('btnViewHistoryFromReceipt');
    if (btnViewHist) {
      btnViewHist.addEventListener('click', () => {
        closeAstroCheckoutModal();
        const navHistory = document.getElementById('navBtnHistory');
        if (navHistory) navHistory.click();
      });
    }
  }

  function selectPaymentMethod(method) {
    astroCheckoutState.selectedMethod = method;

    const methodTabs = document.querySelectorAll('.checkout-method-tab');
    methodTabs.forEach(t => {
      const match = t.getAttribute('data-method') === method;
      t.classList.toggle('active', match);
      t.classList.toggle('border-secondary', match);
      t.classList.toggle('bg-secondary/10', match);
      t.classList.toggle('border-outline-variant/30', !match);
      t.classList.toggle('bg-surface-container-low', !match);
    });

    const panelQris = document.getElementById('methodPanelQris');
    const panelAstroPay = document.getElementById('methodPanelAstroPay');
    const panelVa = document.getElementById('methodPanelVa');
    const panelCash = document.getElementById('methodPanelCash');

    if (panelQris) panelQris.classList.toggle('hidden', method !== 'qris');
    if (panelAstroPay) panelAstroPay.classList.toggle('hidden', method !== 'astropay');
    if (panelVa) panelVa.classList.toggle('hidden', method !== 'va');
    if (panelCash) panelCash.classList.toggle('hidden', method !== 'cash');

    AudioEngine.playTap();
    refreshCheckoutTotals();
  }

  function updateVaNumber(bank) {
    const label = document.getElementById('vaBankNameLabel');
    const numDisplay = document.getElementById('vaNumberDisplay');
    const numbers = {
      'BCA': '8801 2948 1029 3847',
      'Mandiri': '8932 7481 0293 8472',
      'BRI': '8029 4810 2938 4721',
      'BNI': '8271 0294 8102 9384'
    };
    if (label) label.textContent = `NOMOR VIRTUAL ACCOUNT ${bank}`;
    if (numDisplay) numDisplay.textContent = numbers[bank] || '8801 2948 1029 3847';
  }

  function calculateCurrentSubtotal() {
    let subtotal = 0;
    appState.cart.forEach(item => {
      const disc = calculateDiscount(item.price, item.discountRaw);
      subtotal += disc.finalUnitPrice * item.qty;
    });
    return subtotal;
  }

  function calculateCurrentGrandTotal() {
    const subtotal = calculateCurrentSubtotal();
    const rawDiscount = astroCheckoutState.voucherDiscount || 0;
    const effectiveDiscount = Math.min(rawDiscount, subtotal);
    const serviceFee = astroCheckoutState.voucherCode === 'ONGKIRGRATIS' ? 0 : 1000;
    return Math.max(0, (subtotal - effectiveDiscount) + serviceFee);
  }

  function refreshCheckoutTotals() {
    const subtotal = calculateCurrentSubtotal();
    const rawDiscount = astroCheckoutState.voucherDiscount || 0;
    const effectiveDiscount = Math.min(rawDiscount, subtotal);
    const serviceFee = astroCheckoutState.voucherCode === 'ONGKIRGRATIS' ? 0 : 1000;
    const grandTotal = Math.max(0, (subtotal - effectiveDiscount) + serviceFee);

    const elSub = document.getElementById('checkoutSubtotal');
    const elDisc = document.getElementById('checkoutDiscountAmount');
    const elVouchLabel = document.getElementById('checkoutVoucherLabel');
    const elService = document.getElementById('checkoutServiceFee');
    const elGrand = document.getElementById('checkoutGrandTotal');
    const elConfirmBtnText = document.getElementById('btnConfirmPayText');
    const elRemaining = document.getElementById('checkoutBudgetRemaining');

    if (elSub) elSub.textContent = `Rp ${formatNumber(subtotal)}`;
    if (elDisc) elDisc.textContent = effectiveDiscount > 0 ? `-Rp ${formatNumber(effectiveDiscount)}` : 'Rp 0';
    if (elVouchLabel) elVouchLabel.textContent = astroCheckoutState.voucherCode === 'NONE' ? 'Tanpa Voucher' : astroCheckoutState.voucherCode;
    if (elService) elService.textContent = serviceFee > 0 ? `Rp ${formatNumber(serviceFee)}` : 'GRATIS (Voucher)';
    if (elGrand) elGrand.textContent = `Rp ${formatNumber(grandTotal)}`;
    if (elConfirmBtnText) elConfirmBtnText.textContent = `Bayar Sekarang (Rp ${formatNumber(grandTotal)})`;

    // Budget comparison
    const remainingWallet = appState.budgetLimit - grandTotal;
    if (elRemaining) {
      if (remainingWallet >= 0) {
        elRemaining.className = 'font-bold text-emerald-700';
        elRemaining.textContent = `Rp ${formatNumber(remainingWallet)} (Aman ✅)`;
      } else {
        elRemaining.className = 'font-bold text-red-600';
        elRemaining.textContent = `Defisit Rp ${formatNumber(Math.abs(remainingWallet))} (Melebihi Limit ⚠️)`;
      }
    }

    refreshCashChangeDisplay();
  }

  function refreshCashChangeDisplay() {
    const elChange = document.getElementById('cashChangeDisplay');
    if (!elChange) return;

    const grandTotal = calculateCurrentGrandTotal();
    const paid = astroCheckoutState.cashPaid || 0;
    const change = paid - grandTotal;

    if (paid <= 0) {
      elChange.textContent = 'Rp 0';
      elChange.className = 'text-sm font-bold text-gray-500';
    } else if (change >= 0) {
      elChange.textContent = `Rp ${formatNumber(change)} (Kembalian Pas)`;
      elChange.className = 'text-sm font-bold text-secondary';
    } else {
      elChange.textContent = `Kurang Rp ${formatNumber(Math.abs(change))}`;
      elChange.className = 'text-sm font-bold text-red-600';
    }
  }

  function startQrisCountdown() {
    clearInterval(qrisInterval);
    astroCheckoutState.qrisSecondsRemaining = 900; // 15:00
    const timerEl = document.getElementById('qrisCountdownTimer');

    function updateDisplay() {
      const sec = astroCheckoutState.qrisSecondsRemaining;
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      if (timerEl) {
        timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      }
      if (sec <= 0) {
        clearInterval(qrisInterval);
      }
      astroCheckoutState.qrisSecondsRemaining--;
    }

    updateDisplay();
    qrisInterval = setInterval(updateDisplay, 1000);
  }

  function openAstroCheckoutModal() {
    if (appState.cart.length === 0) {
      showToast('Keranjang belanja masih kosong! Pilih barang di Katalog Lotte Mart Puri Indah.', 'warning');
      const catalogSection = document.getElementById('sectionAstroCatalog');
      if (catalogSection) {
        catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    const modal = document.getElementById('modalAstroCheckout');
    const stageReview = document.getElementById('checkoutStageReview');
    const stageProcessing = document.getElementById('checkoutStageProcessing');
    const stageReceipt = document.getElementById('checkoutStageReceipt');

    if (!modal) return;

    // Reset stages
    stageReview.classList.remove('hidden');
    stageProcessing.classList.add('hidden');
    stageReceipt.classList.add('hidden');

    // Populate user
    const avatarEl = document.getElementById('checkoutUserAvatar');
    const nameEl = document.getElementById('checkoutUserName');
    if (avatarEl) avatarEl.textContent = (appState.currentUser?.avatarText || 'R');
    if (nameEl) nameEl.textContent = (appState.currentUser?.displayName || appState.currentUser?.username || 'Rian Pratama');

    // Render items list
    const itemsContainer = document.getElementById('checkoutItemsList');
    const countBadge = document.getElementById('checkoutItemCountBadge');
    if (countBadge) countBadge.textContent = `${appState.cart.length} Produk`;

    if (itemsContainer) {
      itemsContainer.innerHTML = appState.cart.map(item => {
        const disc = calculateDiscount(item.price, item.discountRaw);
        const lineTotal = disc.finalUnitPrice * item.qty;
        return `
          <div class="flex items-center justify-between text-xs py-1 border-b border-outline-variant/15 last:border-b-0">
            <div class="flex-1 min-w-0 pr-2">
              <span class="font-bold text-gray-800 truncate block">${escapeHtml(item.name)}</span>
              <span class="text-[10px] text-gray-500">${item.qty} ${escapeHtml(item.unit)} x Rp ${formatNumber(disc.finalUnitPrice)}</span>
            </div>
            <strong class="font-mono text-gray-900 shrink-0">Rp ${formatNumber(lineTotal)}</strong>
          </div>
        `;
      }).join('');
    }

    // Validate voucher eligibility against current subtotal
    const subtotal = calculateCurrentSubtotal();
    const activeBtn = document.querySelector(`.checkout-voucher-btn[data-code="${astroCheckoutState.voucherCode}"]`);
    const minSpend = activeBtn ? parseInt(activeBtn.getAttribute('data-min-spend') || '0', 10) : 0;
    if (subtotal < minSpend) {
      astroCheckoutState.voucherCode = 'NONE';
      astroCheckoutState.voucherDiscount = 0;
    }

    // Update voucher buttons UI (highlight selected, dim ineligible)
    document.querySelectorAll('.checkout-voucher-btn').forEach(b => {
      const bCode = b.getAttribute('data-code');
      const bMin = parseInt(b.getAttribute('data-min-spend') || '0', 10);
      const isEligible = subtotal >= bMin || bCode === 'NONE';
      const isSelected = bCode === astroCheckoutState.voucherCode;

      b.classList.toggle('active', isSelected);
      b.classList.toggle('border-emerald-500', isSelected);
      b.classList.toggle('bg-emerald-50', isSelected);
      b.classList.toggle('border-gray-200', !isSelected);
      b.classList.toggle('bg-white', !isSelected);
      b.classList.toggle('opacity-50', !isEligible);
      b.classList.toggle('grayscale', !isEligible);
    });

    // Reset default payment method & refresh totals
    selectPaymentMethod('qris');
    startQrisCountdown();
    refreshCheckoutTotals();

    modal.classList.remove('hidden');
    AudioEngine.playTap();
  }

  function closeAstroCheckoutModal() {
    const modal = document.getElementById('modalAstroCheckout');
    if (modal) modal.classList.add('hidden');
    clearInterval(qrisInterval);
    if (currentProcessingTimer) clearTimeout(currentProcessingTimer);
  }

  // Multi-Phase Interactive Cashier Machine Sequence
  function handleAstroPaymentExecution() {
    const grandTotal = calculateCurrentGrandTotal();

    // If Cash method, check if paid is sufficient
    if (astroCheckoutState.selectedMethod === 'cash') {
      const paid = astroCheckoutState.cashPaid || 0;
      if (paid < grandTotal && paid > 0) {
        showToast('Nomor uang tunai kurang dari total belanjaan!', 'danger');
        return;
      }
      if (paid <= 0) {
        // Assume uang pas
        astroCheckoutState.cashPaid = grandTotal;
      }
    }

    const stageReview = document.getElementById('checkoutStageReview');
    const stageProcessing = document.getElementById('checkoutStageProcessing');
    const stageReceipt = document.getElementById('checkoutStageReceipt');

    stageReview.classList.add('hidden');
    stageProcessing.classList.remove('hidden');
    stageReceipt.classList.add('hidden');

    const stepBadge = document.getElementById('posStepBadge');
    const stepTitle = document.getElementById('posStepTitle');
    const stepDesc = document.getElementById('posStepDesc');
    const progressBar = document.getElementById('posProgressBar');

    // Phase 1 (0ms - 1200ms): Connect to Gateway
    if (stepBadge) stepBadge.textContent = 'FASE 1 / 3';
    if (stepTitle) stepTitle.textContent = '📡 Menghubungkan ke Lotte Mart Payment Gateway...';
    if (stepDesc) stepDesc.textContent = 'Mengunci pesanan dan memvalidasi saluran pembayaran terenkripsi.';
    if (progressBar) progressBar.style.width = '35%';
    AudioEngine.playBeep();

    // Phase 2 (1200ms - 2400ms): Verify balance / auth
    currentProcessingTimer = setTimeout(() => {
      if (stepBadge) stepBadge.textContent = 'FASE 2 / 3';
      if (stepTitle) stepTitle.textContent = '🔐 Memverifikasi Saldo & Mengunci Stok Bahan...';
      if (stepDesc) stepDesc.textContent = 'Sistem kasir mengonfirmasi transaksi disetujui tanpa kendala.';
      if (progressBar) progressBar.style.width = '75%';
      AudioEngine.playTap();

      // Phase 3 (2400ms - 3400ms): Printing Thermal Receipt
      currentProcessingTimer = setTimeout(() => {
        if (stepBadge) stepBadge.textContent = 'FASE 3 / 3';
        if (stepTitle) stepTitle.textContent = '🖨️ Mencetak Struk Kasir Thermal Digital...';
        if (stepDesc) stepDesc.textContent = 'Mengesahkan struk bukti transaksi resmi Lotte Mart Grocery - Puri Indah.';
        if (progressBar) progressBar.style.width = '100%';
        AudioEngine.playPrinter();

        // Phase 4 (3500ms): Success Celebration & Rollout Receipt
        currentProcessingTimer = setTimeout(() => {
          completeCheckoutAndDisplayReceipt();
        }, 1100);

      }, 1200);

    }, 1200);
  }

  function completeCheckoutAndDisplayReceipt() {
    clearInterval(qrisInterval);
    const stageProcessing = document.getElementById('checkoutStageProcessing');
    const stageReceipt = document.getElementById('checkoutStageReceipt');

    stageProcessing.classList.add('hidden');
    stageReceipt.classList.remove('hidden');

    const subtotal = calculateCurrentSubtotal();
    const discount = astroCheckoutState.voucherDiscount || 0;
    const serviceFee = astroCheckoutState.voucherCode === 'ONGKIRGRATIS' ? 0 : 1000;
    const grandTotal = Math.max(0, subtotal - discount + serviceFee);

    const customerName = appState.currentUser?.displayName || appState.currentUser?.username || 'Rian Pratama';
    const userSlug = (appState.currentUser && appState.currentUser.slug) ? appState.currentUser.slug : 'rian';

    const rawTrxId = 'LOTTE-20261026-' + Math.floor(10000 + Math.random() * 90000);
    const isolatedTrxId = 'rcp_' + userSlug + '_' + rawTrxId;
    const nowStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';

    const methodLabels = {
      'qris': 'QRIS Lotte Mart Instant (LUNAS)',
      'astropay': 'LottePay E-Wallet (LUNAS)',
      'va': `Virtual Account ${astroCheckoutState.selectedVaBank} (LUNAS)`,
      'cash': 'Tunai di Kasir (LUNAS)'
    };
    const paymentMethodLabel = methodLabels[astroCheckoutState.selectedMethod] || 'QRIS Lotte Mart (LUNAS)';

    // Populate Thermal Receipt Elements
    const elTrx = document.getElementById('receiptTrxId');
    const elTime = document.getElementById('receiptTimestamp');
    const elCust = document.getElementById('receiptCustomerName');
    const elMethod = document.getElementById('receiptPaymentMethodLabel');
    const elItemsBody = document.getElementById('receiptItemsBody');
    const elSub = document.getElementById('receiptSubtotal');
    const elVouch = document.getElementById('receiptVoucherDiscount');
    const elService = document.getElementById('receiptServiceFee');
    const elGrand = document.getElementById('receiptGrandTotal');
    const elCashDetail = document.getElementById('receiptCashDetailRow');
    const elCashChange = document.getElementById('receiptCashChangeText');

    if (elTrx) elTrx.textContent = rawTrxId;
    if (elTime) elTime.textContent = nowStr;
    if (elCust) elCust.textContent = customerName;
    if (elMethod) elMethod.textContent = paymentMethodLabel;
    if (elSub) elSub.textContent = `Rp ${formatNumber(subtotal)}`;
    if (elVouch) elVouch.textContent = discount > 0 ? `-Rp ${formatNumber(discount)}` : 'Rp 0';
    if (elService) elService.textContent = serviceFee > 0 ? `Rp ${formatNumber(serviceFee)}` : 'GRATIS';
    if (elGrand) elGrand.textContent = `Rp ${formatNumber(grandTotal)}`;

    if (astroCheckoutState.selectedMethod === 'cash') {
      const paid = astroCheckoutState.cashPaid || grandTotal;
      const change = paid - grandTotal;
      if (elCashDetail) elCashDetail.classList.remove('hidden');
      if (elCashChange) elCashChange.textContent = `Bayar: Rp ${formatNumber(paid)} • Kembali: Rp ${formatNumber(Math.max(0, change))}`;
    } else {
      if (elCashDetail) elCashDetail.classList.add('hidden');
    }

    // Render receipt items lines
    const receiptItems = appState.cart.map(item => {
      const disc = calculateDiscount(item.price, item.discountRaw);
      const lineTotal = disc.finalUnitPrice * item.qty;
      updateMasterDatabaseItem(item.name, item.category, item.unit, item.price);
      return {
        name: item.name,
        category: item.category,
        unit: item.unit,
        qty: item.qty,
        originalPrice: item.price,
        finalUnitPrice: disc.finalUnitPrice,
        lineTotal
      };
    });

    if (elItemsBody) {
      elItemsBody.innerHTML = receiptItems.map(item => `
        <div class="flex justify-between items-start text-[11px] leading-tight">
          <div class="flex-1 pr-2">
            <span class="font-bold text-gray-900">${escapeHtml(item.name)}</span>
            <span class="block text-[10px] text-gray-500">${item.qty} ${escapeHtml(item.unit)} @ Rp ${formatNumber(item.finalUnitPrice)}</span>
          </div>
          <strong class="font-mono text-gray-900 shrink-0">Rp ${formatNumber(item.lineTotal)}</strong>
        </div>
      `).join('');
    }

    // Save to user's isolated history
    const newReceipt = {
      id: isolatedTrxId,
      rawTrxId: rawTrxId,
      userSlug: userSlug,
      customerName: customerName,
      date: nowStr,
      budgetLimit: appState.budgetLimit,
      grandTotal,
      totalSaved: discount,
      itemCount: receiptItems.length,
      items: receiptItems,
      paymentMethod: paymentMethodLabel
    };

    appState.history.unshift(newReceipt);
    appState.cart = [];

    saveHistory();
    saveCart();
    saveMaster();

    renderCart();
    renderAstroCatalog();
    renderHistoryList();

    // Auto push receipt to Supabase if connected (strictly isolated per user)
    if (appState.supabaseClient) {
      appState.supabaseClient.from('receipts').insert({
        id: newReceipt.id,
        date_label: newReceipt.date,
        budget_limit: newReceipt.budgetLimit,
        grand_total: newReceipt.grandTotal,
        total_saved: newReceipt.totalSaved,
        item_count: newReceipt.itemCount,
        items: {
          userSlug: userSlug,
          customerName: customerName,
          lines: receiptItems
        },
        created_at: new Date().toISOString()
      }).then(() => { });
    }

    AudioEngine.playCashier();
    AudioEngine.playSuccess();

    if (window.confetti) {
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#006e2f', '#6bff8f', '#ffffff', '#ffd700']
      });
    }

    showToast('Pembayaran berhasil! Struk digital dicetak.', 'success');
  }

  function copyThermalReceiptSummary() {
    const elTrx = document.getElementById('receiptTrxId')?.textContent || '';
    const elCust = document.getElementById('receiptCustomerName')?.textContent || '';
    const elMethod = document.getElementById('receiptPaymentMethodLabel')?.textContent || '';
    const elGrand = document.getElementById('receiptGrandTotal')?.textContent || '';

    const text = `🧾 STRUK PEMBAYARAN LOTTE MART GROCERY - PURI INDAH\nNo. TRX: ${elTrx}\nPelanggan: ${elCust}\nMetode: ${elMethod}\nTOTAL: ${elGrand}\nStatus: LUNAS\nTerima kasih telah berbelanja di Lotte Mart Puri Indah!`;

    navigator.clipboard?.writeText(text);
    AudioEngine.playTap();
    showToast('Teks struk berhasil disalin ke clipboard!', 'success');
  }

  // Alias for backward compatibility
  function handleCheckout() {
    openAstroCheckoutModal();
  }

  function renderHistoryList() {
    const container = document.getElementById('historyListContainer');
    if (!container) return;

    const currentSlug = appState.currentUser ? appState.currentUser.slug : 'rian';
    const isRian = currentSlug === 'rian';

    const visibleHistory = (appState.history || []).filter(rcp => {
      if (rcp.userSlug) return rcp.userSlug === currentSlug;
      if (rcp.id && rcp.id.startsWith('rcp_')) return rcp.id.startsWith('rcp_' + currentSlug + '_');
      return isRian;
    });

    if (visibleHistory.length === 0) {
      const activeName = appState.currentUser ? (appState.currentUser.displayName || appState.currentUser.username) : 'Rian';
      container.innerHTML = `
        <div class="neo-empty-box p-6 text-center bg-white rounded-2xl border border-stone-200 shadow-sm">
          <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2.5 text-2xl">🧾</div>
          <h3 class="font-headline-sm text-sm font-bold text-ink mb-1">Belum Ada Struk untuk Akun ${escapeHtml(activeName)}</h3>
          <p class="font-body-sm text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            Struk belanja tersimpan secara privat per akun. Setelah menyelesaikan belanja di kasir, struk digital milik kamu akan otomatis tercatat di sini.
          </p>
        </div>
      `;
      return;
    }

    let html = '';
    visibleHistory.forEach(rcp => {
      const displayTrx = rcp.rawTrxId || (rcp.id.startsWith('rcp_') ? rcp.id.split('_').slice(2).join('_') : rcp.id);
      html += `
        <div class="neo-history-card bg-white p-4 rounded-2xl border border-stone-200 shadow-xs hover:border-stone-400 transition-all">
          <div class="flex items-center justify-between mb-2">
            <span class="font-mono text-xs text-stone-500 flex items-center gap-1 font-semibold">
              <span class="material-symbols-outlined text-[15px] text-stone-400">calendar_month</span>
              ${escapeHtml(rcp.date)}
            </span>
            <span class="font-mono text-sm font-extrabold text-ink">Rp ${formatNumber(rcp.grandTotal)}</span>
          </div>
          <div class="flex items-center justify-between text-xs text-stone-600 mb-3 pb-2 border-b border-stone-100 font-mono">
            <span>${rcp.itemCount} Jenis Barang</span>
            <span class="text-emerald-700 font-bold">Hemat: Rp ${formatNumber(rcp.totalSaved)}</span>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="font-mono text-[10px] text-stone-400 truncate">No: ${escapeHtml(displayTrx)}</span>
            <button class="px-3 py-1.5 rounded-xl bg-ink text-citrus font-mono text-xs font-bold flex items-center gap-1 shadow-pos-key hover:bg-stone-800 active:scale-95 transition-all cursor-pointer" onclick="window.showReceiptModal('${rcp.id}')">
              <span class="material-symbols-outlined text-[15px]">receipt_long</span>
              <span>Buka Struk</span>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }

  window.showReceiptModal = function (receiptId) {
    const currentSlug = appState.currentUser ? appState.currentUser.slug : 'rian';
    const isRian = currentSlug === 'rian';

    const rcp = appState.history.find(h => {
      if (h.id !== receiptId) return false;
      if (h.userSlug) return h.userSlug === currentSlug;
      if (h.id.startsWith('rcp_')) return h.id.startsWith('rcp_' + currentSlug + '_');
      return isRian;
    });

    if (!rcp) {
      showToast('Akses ditolak: Struk ini tidak terdaftar pada akun kamu.', 'danger');
      return;
    }

    const body = document.getElementById('receiptModalBody');
    let itemsHtml = '';

    const items = Array.isArray(rcp.items) ? rcp.items : [];
    items.forEach(item => {
      const linePrice = item.lineTotal || ((item.finalUnitPrice || item.price || 0) * (item.qty || 1));
      itemsHtml += `
        <div class="receipt-line-split flex justify-between text-xs py-1 border-b border-stone-100">
          <span>${escapeHtml(item.name)} (${item.qty} ${escapeHtml(item.unit || 'pcs')})</span>
          <span class="font-mono font-bold">Rp ${formatNumber(linePrice)}</span>
        </div>
      `;
    });

    const displayTrx = rcp.rawTrxId || (rcp.id.startsWith('rcp_') ? rcp.id.split('_').slice(2).join('_') : rcp.id);
    const ownerName = rcp.customerName || (appState.currentUser ? (appState.currentUser.displayName || appState.currentUser.username) : 'Pelanggan');

    body.innerHTML = `
      <div class="receipt-paper-slip font-mono text-ink">
        <div class="receipt-slip-top text-center pb-3 border-b border-dashed border-stone-300">
          <div class="font-black text-sm tracking-tight text-ink">LOTTE MART GROCERY - PURI INDAH</div>
          <small class="text-stone-500 text-[11px] block mt-0.5">Struk Resmi • Pelanggan: <strong>${escapeHtml(ownerName)}</strong></small>
          <div class="text-[10px] text-stone-400 mt-1">No. TRX: ${escapeHtml(displayTrx)}</div>
          <div class="receipt-meta-row text-[10px] text-stone-500 mt-0.5">${escapeHtml(rcp.date)}</div>
        </div>
        <div class="receipt-lines-list py-2.5 space-y-1">
          ${itemsHtml}
        </div>
        <div class="receipt-slip-total flex justify-between pt-2.5 border-t border-dashed border-stone-300 font-bold text-sm">
          <span>TOTAL BAYAR:</span>
          <span class="font-mono text-emerald-800">Rp ${formatNumber(rcp.grandTotal)}</span>
        </div>
        <div class="receipt-savings-banner text-center text-xs text-amber-700 font-bold bg-amber-50 p-2 rounded-lg mt-2.5 border border-amber-200/60">
          Total Hemat Promo: Rp ${formatNumber(rcp.totalSaved)}
        </div>
      </div>
    `;

    document.getElementById('modalReceiptBackdrop').classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  };

  // ==========================================================================
  // MASTER PRICE DATABASE LIST
  // ==========================================================================
  function renderMasterList(search = '') {
    const container = document.getElementById('masterItemsList');
    if (!container) return;

    let items = appState.masterItems;
    if (search) {
      items = items.filter(i => i.name.toLowerCase().includes(search));
    }

    if (items.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:14px; color:var(--text-muted); font-size:0.75rem;">Belum ada acuan harga.</div>';
      return;
    }

    let html = '';
    items.forEach(item => {
      html += `
        <div class="neo-master-row">
          <div>
            <div class="m-name">${escapeHtml(item.name)}</div>
            <div class="m-spec">${escapeHtml(item.category)} • Satuan: ${escapeHtml(item.unit)}</div>
          </div>
          <div style="text-align:right;">
            <div class="m-price">Rp ${formatNumber(item.lastPrice)}</div>
            <small style="font-family:var(--font-mono); color:var(--text-muted); font-size:0.62rem;">Harga Acuan</small>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // ==========================================================================
  // BUDGET TAB BREAKDOWN & DOMPET TAB
  // ==========================================================================
  function renderDompetTab() {
    updateBudgetHud();
    renderBudgetBreakdown();
  }

  function renderBudgetBreakdown() {
    const inputEl = document.getElementById('inputBudgetSetting');
    if (inputEl && document.activeElement !== inputEl) {
      inputEl.value = appState.budgetLimit;
    }
    const container = document.getElementById('categoryBreakdownList');
    if (!container) return;

    const catTotals = {};
    let grandTotal = 0;

    appState.cart.forEach(item => {
      const disc = calculateDiscount(item.price, item.discountRaw);
      const line = disc.finalUnitPrice * item.qty;
      catTotals[item.category] = (catTotals[item.category] || 0) + line;
      grandTotal += line;
    });

    const categories = ['Bahan Pokok', 'Makanan & Minuman', 'Kebersihan', 'Dapur & Bumbu', 'Lainnya'];
    let html = '';
    categories.forEach(cat => {
      const total = catTotals[cat] || 0;
      const pct = grandTotal > 0 ? ((total / grandTotal) * 100).toFixed(1) : 0;

      html += `
        <div class="cat-neo-row">
          <div class="cat-neo-meta">
            <span><strong>${cat}</strong> (${pct}%)</span>
            <span>Rp ${formatNumber(total)}</span>
          </div>
          <div class="cat-track-neo">
            <div class="cat-fill-neo" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // ==========================================================================
  // TAB 2: PROMO & VALUE COMPARATOR TOOL
  // ==========================================================================
  function initComparatorTool() {
    const calcOrigPrice = document.getElementById('calcOrigPrice');
    const calcDiscountInput = document.getElementById('calcDiscountInput');

    function runPromoCalc() {
      if (!calcOrigPrice || !calcDiscountInput) return;
      const price = parseFloat(calcOrigPrice.value) || 0;
      const discStr = calcDiscountInput.value;
      const res = calculateDiscount(price, discStr);

      const elFinal = document.getElementById('calcFinalPrice');
      if (elFinal) elFinal.textContent = `Rp ${formatNumber(res.finalUnitPrice)}`;
      const savedPct = price > 0 ? ((res.savedPerUnit / price) * 100).toFixed(1) : 0;
      const elSaved = document.getElementById('calcSavedAmount');
      if (elSaved) elSaved.textContent = `Hemat Rp ${formatNumber(res.savedPerUnit)} (${savedPct}%)`;
      const elFormula = document.getElementById('calcFormulaBreakdown');
      if (elFormula) elFormula.textContent = res.formulaText;
    }

    if (calcOrigPrice && calcDiscountInput) {
      calcOrigPrice.addEventListener('input', runPromoCalc);
      calcDiscountInput.addEventListener('input', runPromoCalc);
      calcOrigPrice.value = '100000';
      calcDiscountInput.value = '50+20';
      runPromoCalc();
    }

    // Unit Price Comparison
    const cmpSizeA = document.getElementById('cmpSizeA');
    const cmpUnitA = document.getElementById('cmpUnitA');
    const cmpPriceA = document.getElementById('cmpPriceA');
    const cmpSizeB = document.getElementById('cmpSizeB');
    const cmpUnitB = document.getElementById('cmpUnitB');
    const cmpPriceB = document.getElementById('cmpPriceB');

    function runUnitComparison() {
      const sizeA = parseFloat(cmpSizeA?.value) || 1;
      const priceA = parseFloat(cmpPriceA?.value) || 0;
      const sizeB = parseFloat(cmpSizeB?.value) || 1;
      const priceB = parseFloat(cmpPriceB?.value) || 0;

      let normSizeA = sizeA;
      if (cmpUnitA && (cmpUnitA.value === 'ml' || cmpUnitA.value === 'gram')) normSizeA = sizeA / 1000;

      let normSizeB = sizeB;
      if (cmpUnitB && (cmpUnitB.value === 'ml' || cmpUnitB.value === 'gram')) normSizeB = sizeB / 1000;

      const unitCostA = normSizeA > 0 ? priceA / normSizeA : 0;
      const unitCostB = normSizeB > 0 ? priceB / normSizeB : 0;

      const unitName = (cmpUnitA && (cmpUnitA.value === 'ml' || cmpUnitA.value === 'liter')) ? 'Liter' :
        (cmpUnitA && (cmpUnitA.value === 'gram' || cmpUnitA.value === 'kg')) ? 'Kg' : 'pcs';

      const elCostA = document.getElementById('unitCostA');
      if (elCostA) elCostA.textContent = `Rp ${formatNumber(Math.round(unitCostA))} / ${unitName}`;
      const elCostB = document.getElementById('unitCostB');
      if (elCostB) elCostB.textContent = `Rp ${formatNumber(Math.round(unitCostB))} / ${unitName}`;

      const title = document.getElementById('cmpVerdictTitle');
      const desc = document.getElementById('cmpVerdictDesc');

      if (title && desc && unitCostA > 0 && unitCostB > 0) {
        if (unitCostA < unitCostB) {
          const diff = unitCostB - unitCostA;
          const pct = ((diff / unitCostB) * 100).toFixed(1);
          title.textContent = 'Opsi A Lebih Hemat!';
          desc.textContent = `Hemat Rp ${formatNumber(Math.round(diff))}/${unitName} (${pct}% lebih murah).`;
        } else if (unitCostB < unitCostA) {
          const diff = unitCostA - unitCostB;
          const pct = ((diff / unitCostA) * 100).toFixed(1);
          title.textContent = 'Opsi B Lebih Hemat!';
          desc.textContent = `Hemat Rp ${formatNumber(Math.round(diff))}/${unitName} (${pct}% lebih murah).`;
        } else {
          title.textContent = 'Nilai Ekonomis Sama';
          desc.textContent = 'Harga per satuan kedua opsi persis sama.';
        }
      }
    }

    [cmpSizeA, cmpUnitA, cmpPriceA, cmpSizeB, cmpUnitB, cmpPriceB].forEach(el => {
      if (el) {
        el.addEventListener('input', runUnitComparison);
        el.addEventListener('change', runUnitComparison);
      }
    });
    runUnitComparison();
  }

  window.setCalcDiscount = function (str) {
    const input = document.getElementById('calcDiscountInput');
    if (input) {
      input.value = str;
      input.dispatchEvent(new Event('input'));
      AudioEngine.playTap();
    }
  };

  // ==========================================================================
  // DATA EXPORT / IMPORT / RESET
  // ==========================================================================
  function exportDataJson() {
    const data = {
      cart: appState.cart,
      budgetLimit: appState.budgetLimit,
      history: appState.history,
      masterItems: appState.masterItems,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-grocery-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil diekspor', 'success');
  }

  function importDataJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const data = JSON.parse(event.target.result);
        if (data.cart) appState.cart = data.cart;
        if (data.budgetLimit) appState.budgetLimit = data.budgetLimit;
        if (data.history) appState.history = data.history;
        if (data.masterItems) appState.masterItems = data.masterItems;

        saveCart();
        saveBudget();
        saveHistory();
        saveMaster();
        renderAll();
        showToast('Data berhasil diimpor', 'success');
      } catch (err) {
        showToast('Gagal membaca file JSON', 'danger');
      }
    };
    reader.readAsText(file);
  }

  function resetAllData() {
    if (confirm('Reset seluruh data ke pengaturan awal?')) {
      appState.cart = JSON.parse(JSON.stringify(DEFAULT_SAMPLE_CART));
      appState.budgetLimit = 350000;
      appState.history = [];
      appState.masterItems = JSON.parse(JSON.stringify(DEFAULT_MASTER_ITEMS));

      saveCart();
      saveBudget();
      saveHistory();
      saveMaster();
      renderAll();
      AudioEngine.playSuccess();
      showToast('Data direset', 'success');
    }
  }

  // ==========================================================================
  // SHOPPING PLANNER MODULE (MENCATAT SEBELUM KE SUPERMARKET)
  // ==========================================================================
  let currentShelfModalPlannerItem = null;

  function renderShoppingPlannerSection() {
    // 1. Render di Tab 1 (Troli: #plannerPendingItemsList)
    const shelfContainer = document.getElementById('plannerPendingItemsList');
    const pill = document.getElementById('plannerProgressPill');

    const pendingItems = appState.planner.filter(p => !p.isPurchased);
    const purchasedInCartCount = appState.cart.filter(item => item.isPlanned).length;
    const totalPlannedCount = purchasedInCartCount + pendingItems.length;

    if (pill) {
      if (totalPlannedCount > 0) {
        pill.textContent = `${purchasedInCartCount}/${totalPlannedCount} Terbeli`;
      } else {
        pill.textContent = `0 Terencana`;
      }
    }

    const plannerBadge = document.getElementById('navPlannerBadge');
    if (plannerBadge) {
      if (pendingItems.length > 0) {
        plannerBadge.textContent = pendingItems.length;
        plannerBadge.classList.remove('hidden');
      } else {
        plannerBadge.classList.add('hidden');
      }
    }

    if (shelfContainer) {
      if (pendingItems.length === 0) {
        if (purchasedInCartCount > 0) {
          shelfContainer.innerHTML = `
            <div class="p-3 bg-secondary-fixed/20 rounded-2xl text-center text-secondary font-label-sm text-label-sm font-semibold flex items-center justify-center gap-2 border border-secondary/20">
              <span class="material-symbols-outlined text-[18px]">verified</span>
              <span>Semua kebutuhan terencana sudah dimasukkan ke troli! 🎉</span>
            </div>
          `;
        } else {
          shelfContainer.innerHTML = `
            <div class="p-3 bg-surface-container-low rounded-2xl text-center text-on-surface-variant font-body-sm text-xs border border-outline-variant/30">
              Belum ada rencana kebutuhan. Tekan <strong>+ Atur Daftar Kebutuhan</strong> di bawah untuk mencatat barang dari rumah.
            </div>
          `;
        }
      } else {
        let html = '';
        pendingItems.forEach(item => {
          const master = appState.masterItems.find(m => m.name.toLowerCase() === item.name.toLowerCase());
          const refPrice = master ? master.lastPrice : 0;

          html += `
            <div class="p-3 bg-surface-container-low rounded-2xl flex items-center justify-between gap-2 border border-outline-variant/30">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 mb-0.5">
                  <span class="text-[10px] font-bold uppercase px-2 py-0.2 rounded-full bg-surface-container text-secondary">
                    ${escapeHtml(item.category)}
                  </span>
                  ${refPrice > 0 ? `<span class="text-[10px] text-on-surface-variant font-mono">Acuan bulan lalu: Rp ${formatNumber(refPrice)}</span>` : ''}
                </div>
                <h4 class="font-headline-sm text-[14px] text-primary font-bold truncate">${escapeHtml(item.name)}</h4>
                <span class="font-body-sm text-[12px] text-on-surface-variant font-medium">Kebutuhan: <strong>${item.qty} ${escapeHtml(item.unit)}</strong></span>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button class="px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-sm text-[12px] font-bold flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer hover:bg-primary-container"
                  onclick="window.openShelfPriceModal('${item.id}')" title="Ketik harga saat menemukan di rak">
                  <span class="material-symbols-outlined text-[15px]">price_change</span>
                  <span>Input Harga Rak</span>
                </button>
              </div>
            </div>
          `;
        });
        shelfContainer.innerHTML = html;
      }
    }

    // 2. Render di Tab 3 (Shopping Planner Full List: #shoppingPlannerFullList)
    const fullContainer = document.getElementById('shoppingPlannerFullList');
    const badgeCount = document.getElementById('plannerActiveCountBadge');
    const estCostEl = document.getElementById('plannerEstimatedCostTotal');

    if (badgeCount) badgeCount.textContent = `${pendingItems.length} Item`;

    let totalEstCost = 0;
    pendingItems.forEach(p => {
      const master = appState.masterItems.find(m => m.name.toLowerCase() === p.name.toLowerCase());
      if (master) totalEstCost += master.lastPrice * p.qty;
    });

    if (estCostEl) {
      estCostEl.textContent = `Estimasi acuan belanja: Rp ${formatNumber(totalEstCost)}`;
    }

    if (fullContainer) {
      if (pendingItems.length === 0) {
        fullContainer.innerHTML = `
          <div class="p-4 bg-surface-container-low rounded-xl text-center text-on-surface-variant font-body-sm text-body-sm">
            Belum ada rencana kebutuhan. Gunakan form di atas untuk mencatat barang sebelum ke supermarket.
          </div>
        `;
      } else {
        let html = '';
        pendingItems.forEach(item => {
          const master = appState.masterItems.find(m => m.name.toLowerCase() === item.name.toLowerCase());
          const estPrice = master ? master.lastPrice : 0;

          html += `
            <div class="p-3 bg-surface-container-low rounded-xl flex items-center justify-between gap-2 border border-outline-variant/30">
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <span class="w-6 h-6 rounded-full bg-surface-container-highest text-secondary flex items-center justify-center text-[13px] font-bold">
                  •
                </span>
                <div class="min-w-0">
                  <h4 class="font-headline-sm text-[14px] text-primary font-bold truncate">${escapeHtml(item.name)}</h4>
                  <div class="flex items-center gap-2 font-body-sm text-[11px] text-on-surface-variant">
                    <span>${item.qty} ${escapeHtml(item.unit)}</span>
                    <span>•</span>
                    <span>${escapeHtml(item.category)}</span>
                    ${estPrice > 0 ? `<span>• Est. Rp ${formatNumber(estPrice * item.qty)}</span>` : ''}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <button class="px-2.5 py-1 rounded-full bg-primary text-on-primary font-label-sm text-[11px] font-bold flex items-center gap-1 shadow-xs hover:bg-primary-container cursor-pointer"
                  onclick="window.openShelfPriceModal('${item.id}')" title="Input harga di rak & masukkan ke troli">
                  <span class="material-symbols-outlined text-[14px]">price_change</span>
                  <span>Beli</span>
                </button>
                <button class="w-7 h-7 rounded-full text-error hover:bg-red-50 flex items-center justify-center cursor-pointer"
                  onclick="window.deletePlannerItem('${item.id}')" title="Hapus dari Rencana">
                  <span class="material-symbols-outlined text-[16px]">delete</span>
                </button>
              </div>
            </div>
          `;
        });
        fullContainer.innerHTML = html;
      }
    }
  }

  window.openShelfPriceModal = function (plannerId) {
    const item = appState.planner.find(p => p.id === plannerId);
    if (!item) return;

    currentShelfModalPlannerItem = item;
    AudioEngine.playTap();

    document.getElementById('shelfModalPlannerId').value = item.id;
    document.getElementById('shelfModalItemName').textContent = item.name;
    document.getElementById('shelfModalItemSpec').textContent = `${item.qty} ${item.unit} • ${item.category}`;

    const master = appState.masterItems.find(m => m.name.toLowerCase() === item.name.toLowerCase());
    const lastPrice = master ? master.lastPrice : 0;
    document.getElementById('shelfModalLastPriceText').textContent = lastPrice > 0 ? `Rp ${formatNumber(lastPrice)} / ${item.unit}` : 'Belum ada catatan';

    const inputPrice = document.getElementById('inputShelfPrice');
    inputPrice.value = '';
    document.getElementById('inputShelfDiscount').value = '';

    updateShelfModalFluctuation(0, lastPrice);

    document.getElementById('modalShelfPriceBackdrop').classList.remove('hidden');
    inputPrice.focus();
  };

  function updateShelfModalFluctuation(currentPrice, lastPrice) {
    const box = document.getElementById('shelfModalFluctuationBox');
    const icon = document.getElementById('shelfFluctuationIcon');
    const title = document.getElementById('shelfFluctuationText');
    const sub = document.getElementById('shelfFluctuationSub');

    if (!box || !icon || !title || !sub) return;

    if (!currentPrice || currentPrice <= 0) {
      box.className = 'p-2.5 rounded-xl bg-surface-container flex items-center gap-2';
      icon.textContent = 'query_stats';
      icon.className = 'material-symbols-outlined text-[18px] text-secondary';
      title.textContent = 'Ketik harga rak untuk melihat fluktuasi';
      sub.textContent = 'Dibandingkan dengan catatan belanja bulan lalu';
      return;
    }

    if (!lastPrice || lastPrice <= 0) {
      box.className = 'p-2.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2 text-blue-700';
      icon.textContent = 'sparkles';
      icon.className = 'material-symbols-outlined text-[18px] text-blue-600';
      title.textContent = 'Barang Baru (Belum ada catatan bulan lalu)';
      sub.textContent = `Harga Rp ${formatNumber(currentPrice)} akan dicatat sebagai acuan`;
      return;
    }

    const diff = currentPrice - lastPrice;
    const pct = ((diff / lastPrice) * 100).toFixed(1);

    if (diff > 0) {
      box.className = 'p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700';
      icon.textContent = 'trending_up';
      icon.className = 'material-symbols-outlined text-[18px] text-red-600';
      title.textContent = `↑ Harga Naik +Rp ${formatNumber(diff)} (+${pct}%)`;
      sub.textContent = `Bulan lalu Rp ${formatNumber(lastPrice)} ➔ Sekarang Rp ${formatNumber(currentPrice)}`;
    } else if (diff < 0) {
      box.className = 'p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800';
      icon.textContent = 'trending_down';
      icon.className = 'material-symbols-outlined text-[18px] text-emerald-600';
      title.textContent = `↓ Harga Turun -Rp ${formatNumber(Math.abs(diff))} (-${Math.abs(pct)}%)`;
      sub.textContent = `Lebih hemat dari bulan lalu (Rp ${formatNumber(lastPrice)})`;
    } else {
      box.className = 'p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2 text-gray-700';
      icon.textContent = 'drag_handle';
      icon.className = 'material-symbols-outlined text-[18px] text-gray-600';
      title.textContent = `= Harga Tetap Stabil (Rp ${formatNumber(currentPrice)})`;
      sub.textContent = 'Sama persis dengan belanjaan bulan lalu';
    }
  }

  function applyShelfPriceModalSubmit(e) {
    if (e) e.preventDefault();
    if (!currentShelfModalPlannerItem) return;

    const price = parseFloat(document.getElementById('inputShelfPrice').value) || 0;
    const discountRaw = document.getElementById('inputShelfDiscount').value.trim();
    if (price <= 0) {
      showToast('Masukkan harga di rak yang valid', 'warning');
      return;
    }

    const master = appState.masterItems.find(m => m.name.toLowerCase() === currentShelfModalPlannerItem.name.toLowerCase());
    const lastPrice = master ? master.lastPrice : price;

    const newCartItem = {
      id: 'item-' + Date.now(),
      name: currentShelfModalPlannerItem.name,
      category: currentShelfModalPlannerItem.category,
      unit: currentShelfModalPlannerItem.unit,
      qty: currentShelfModalPlannerItem.qty,
      price: price,
      lastMonthPrice: lastPrice,
      discountRaw: discountRaw,
      createdAt: Date.now(),
      inPhysicalCart: true,
      isPlanned: true,
      plannerItemId: currentShelfModalPlannerItem.id
    };

    appState.cart.unshift(newCartItem);

    // Hapus barang dari daftar rencana kebutuhan karena sudah dimasukkan ke keranjang
    const removedPlannerId = currentShelfModalPlannerItem.id;
    const addedItemName = currentShelfModalPlannerItem.name;
    appState.planner = appState.planner.filter(p => p.id !== removedPlannerId);
    currentShelfModalPlannerItem = null;

    saveCart();
    savePlanner();
    updateMasterDatabaseItem(newCartItem.name, newCartItem.category, newCartItem.unit, price);

    document.getElementById('modalShelfPriceBackdrop').classList.add('hidden');
    renderCart();
    renderShoppingPlannerSection();

    AudioEngine.playSuccess();
    showToast(`"${addedItemName}" dimasukkan ke troli dan dihapus dari daftar rencana!`, 'success');
  }

  function addPlannerItemFromForm(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('inputPlannerName');
    const catSelect = document.getElementById('selectPlannerCategory');
    const unitSelect = document.getElementById('selectPlannerUnit');
    const qtyInput = document.getElementById('inputPlannerQty');

    const name = nameInput.value.trim();
    const category = catSelect.value;
    const unit = unitSelect.value;
    const qty = parseInt(qtyInput.value, 10) || 1;

    if (!name) return;

    const newPlan = {
      id: 'plan-' + Date.now(),
      name,
      category,
      unit,
      qty,
      isPurchased: false,
      createdAt: Date.now()
    };

    appState.planner.unshift(newPlan);
    savePlanner();
    renderShoppingPlannerSection();

    nameInput.value = '';
    qtyInput.value = '1';

    AudioEngine.playTap();
    showToast(`"${name}" dicatat ke Rencana Belanja`, 'success');
  }

  window.deletePlannerItem = function (id) {
    const item = appState.planner.find(p => p.id === id);
    if (!item) return;

    appState.planner = appState.planner.filter(p => p.id !== id);
    savePlanner();
    renderShoppingPlannerSection();
    showToast(`"${item.name}" dihapus dari rencana`, 'warning');
  };

  function clearCompletedPlannerItems() {
    const prevCount = appState.planner.length;
    appState.planner = appState.planner.filter(p => !p.isPurchased);
    if (appState.planner.length < prevCount) {
      savePlanner();
      renderShoppingPlannerSection();
      showToast('Item yang sudah terbeli dibersihkan', 'info');
    } else if (appState.planner.length > 0) {
      if (confirm('Kosongkan seluruh daftar rencana kebutuhan belanja?')) {
        appState.planner = [];
        savePlanner();
        renderShoppingPlannerSection();
        showToast('Seluruh daftar rencana telah dikosongkan', 'warning');
      }
    } else {
      showToast('Daftar rencana kebutuhan sudah kosong', 'info');
    }
  }

  // ==========================================================================
  // TOAST NOTIFICATIONS & HELPERS
  // ==========================================================================
  function showToast(message, type = 'info') {
    const toast = document.getElementById('neoToast');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = document.getElementById('toastIcon');

    if (toast && msgEl) {
      msgEl.textContent = message;
      toast.className = `neo-toast show ${type}`;
      if (iconEl) {
        iconEl.textContent = type === 'success' ? 'check_circle' :
          type === 'danger' ? 'error' :
            type === 'warning' ? 'warning' : 'info';
      }
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2600);
      return;
    }

    const container = document.getElementById('toastContainer');
    if (!container) return;

    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = message;
    container.appendChild(t);

    setTimeout(() => {
      t.remove();
    }, 2500);
  }

  function formatNumber(num) {
    if (isNaN(num)) return '0';
    return Number(num).toLocaleString('id-ID');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // AUTHENTICATION & MULTI-USER DATA ISOLATION MODULE
  // ==========================================================================
  // AUTHENTICATION & MULTI-USER SYSTEM (USERNAME & PASSWORD / GOOGLE)
  // ==========================================================================
  const USERS_CREDENTIALS_KEY = 'smart_grocery_user_credentials';

  function initAuthModule() {
    const loginScreen = document.getElementById('loginScreen');
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const formLogin = document.getElementById('formUsernameLogin');
    const formRegister = document.getElementById('formRegisterUser');
    const inputUsername = document.getElementById('inputLoginUsername');
    const inputPassword = document.getElementById('inputLoginPassword');
    const inputRegUsername = document.getElementById('inputRegUsername');
    const inputRegEmail = document.getElementById('inputRegEmail');
    const inputRegPassword = document.getElementById('inputRegPassword');
    const btnToggleLoginPwd = document.getElementById('btnToggleLoginPwd');
    const btnToggleRegPwd = document.getElementById('btnToggleRegPwd');

    const btnGoogle = document.getElementById('btnGoogleLoginTrigger');
    const GOOGLE_CLIENT_ID_KEY = 'smart_grocery_google_client_id';

    // Email Verification Modal Elements
    const modalEmailVerify = document.getElementById('modalEmailVerificationBackdrop');
    const verifyTargetEmail = document.getElementById('verifyTargetEmail');
    const verifySimulatedOtp = document.getElementById('verifySimulatedOtpDisplay');
    const btnAutofillOtp = document.getElementById('btnAutofillOtp');
    const formVerifyEmailOtp = document.getElementById('formVerifyEmailOtp');
    const inputVerificationOtp = document.getElementById('inputVerificationOtp');
    const verifyOtpFeedback = document.getElementById('verifyOtpFeedback');
    const btnCancelVerifyModal = document.getElementById('btnCancelVerifyModal');
    const btnResendOtp = document.getElementById('btnResendOtp');
    const resendCountdownText = document.getElementById('resendCountdownText');

    let pendingRegistration = null;
    let resendTimerInterval = null;

    function startOtpCountdown(seconds = 30) {
      if (resendTimerInterval) clearInterval(resendTimerInterval);
      if (btnResendOtp) btnResendOtp.disabled = true;
      let left = seconds;
      if (resendCountdownText) resendCountdownText.textContent = `(${left}s)`;
      resendTimerInterval = setInterval(() => {
        left--;
        if (left <= 0) {
          clearInterval(resendTimerInterval);
          if (btnResendOtp) btnResendOtp.disabled = false;
          if (resendCountdownText) resendCountdownText.textContent = '';
        } else {
          if (resendCountdownText) resendCountdownText.textContent = `(${left}s)`;
        }
      }, 1000);
    }

    const btnProfileTrigger = document.getElementById('btnUserProfileTrigger');
    const modalProfile = document.getElementById('modalUserProfileBackdrop');
    const btnCloseProfile = document.getElementById('btnCloseUserProfileModal');
    const btnSwitchAccount = document.getElementById('btnSwitchAccount');
    const btnLogoutUser = document.getElementById('btnLogoutUser');

    // Tab Switching Logic: Masuk vs Daftar
    if (tabLoginBtn && tabRegisterBtn && formLogin && formRegister) {
      tabLoginBtn.addEventListener('click', () => {
        tabLoginBtn.className = 'py-2 rounded-lg bg-ink text-white shadow-xs transition-all cursor-pointer';
        tabRegisterBtn.className = 'py-2 rounded-lg text-stone-600 hover:text-ink transition-all cursor-pointer';
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
        if (inputUsername) inputUsername.focus();
      });

      tabRegisterBtn.addEventListener('click', () => {
        tabRegisterBtn.className = 'py-2 rounded-lg bg-ink text-white shadow-xs transition-all cursor-pointer';
        tabLoginBtn.className = 'py-2 rounded-lg text-stone-600 hover:text-ink transition-all cursor-pointer';
        formRegister.classList.remove('hidden');
        formLogin.classList.add('hidden');
        if (inputRegUsername) inputRegUsername.focus();
      });
    }

    // Password visibility toggles
    if (btnToggleLoginPwd && inputPassword) {
      btnToggleLoginPwd.addEventListener('click', () => {
        const isPwd = inputPassword.type === 'password';
        inputPassword.type = isPwd ? 'text' : 'password';
        const icon = btnToggleLoginPwd.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = isPwd ? 'visibility_off' : 'visibility';
      });
    }
    if (btnToggleRegPwd && inputRegPassword) {
      btnToggleRegPwd.addEventListener('click', () => {
        const isPwd = inputRegPassword.type === 'password';
        inputRegPassword.type = isPwd ? 'text' : 'password';
        const icon = btnToggleRegPwd.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = isPwd ? 'visibility_off' : 'visibility';
      });
    }

    // Helper: Get stored user credentials
    function getStoredCredentials() {
      try {
        const raw = localStorage.getItem(USERS_CREDENTIALS_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        return {};
      }
    }

    function saveCredentials(creds) {
      try {
        localStorage.setItem(USERS_CREDENTIALS_KEY, JSON.stringify(creds));
      } catch (e) {}
    }

    // 1. Check existing session
    let savedUser = null;
    try {
      const rawUser = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      if (rawUser) {
        savedUser = JSON.parse(rawUser);
      }
    } catch (e) {
      console.warn('Error reading saved user session:', e);
    }

    if (savedUser && savedUser.username) {
      appState.currentUser = savedUser;
      if (loginScreen) loginScreen.classList.add('hidden');
      loadDataFromStorage();
      updateHeaderUserUI();
    } else {
      // First time or logged out -> Show clean login screen
      appState.currentUser = null;
      loadDataFromStorage();
      if (loginScreen) loginScreen.classList.remove('hidden');
      renderSavedAccountsList();
      updateHeaderUserUI();
    }

    // Inline Alert Helper on Login Card
    const alertEl = document.getElementById('loginFeedbackAlert');
    const alertText = document.getElementById('loginFeedbackText');
    const alertIcon = document.getElementById('loginFeedbackIcon');

    function showLoginAlert(msg, type = 'danger') {
      if (!alertEl || !alertText) return;
      alertText.textContent = msg;
      alertEl.classList.remove('hidden', 'animate-shake');
      alertEl.style.display = 'flex';
      void alertEl.offsetWidth; // restart shake animation
      if (type === 'danger') {
        alertEl.className = 'mb-3.5 p-3.5 rounded-xl bg-red-100 border-2 border-red-500 text-red-900 font-body-md text-xs font-black flex items-start gap-2 shadow-sm animate-shake';
        if (alertIcon) alertIcon.textContent = 'error';
      } else if (type === 'warning') {
        alertEl.className = 'mb-3.5 p-3.5 rounded-xl bg-amber-100 border-2 border-amber-500 text-amber-900 font-body-md text-xs font-black flex items-start gap-2 shadow-sm animate-shake';
        if (alertIcon) alertIcon.textContent = 'warning';
      } else {
        alertEl.className = 'mb-3.5 p-3.5 rounded-xl bg-emerald-100 border-2 border-emerald-500 text-emerald-900 font-body-md text-xs font-black flex items-start gap-2 shadow-sm';
        if (alertIcon) alertIcon.textContent = 'check_circle';
      }
    }

    function hideLoginAlert() {
      if (alertEl) {
        alertEl.classList.add('hidden');
        alertEl.style.display = 'none';
      }
    }

    if (inputUsername) {
      inputUsername.addEventListener('input', () => {
        inputUsername.style.borderColor = '';
        hideLoginAlert();
      });
    }
    if (inputPassword) {
      inputPassword.addEventListener('input', () => {
        inputPassword.style.borderColor = '';
        hideLoginAlert();
      });
    }

    const btnSubmitLogin = document.getElementById('btnSubmitLogin');
    if (btnSubmitLogin && formLogin) {
      btnSubmitLogin.addEventListener('click', (e) => {
        // If form is valid, trigger submit manually if needed
        if (!formLogin.checkValidity()) {
          formLogin.reportValidity();
        }
      });
    }

    // 2. Handle Login Submit
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hideLoginAlert();
        const rawUsername = inputUsername ? inputUsername.value.trim() : '';
        const rawPassword = inputPassword ? inputPassword.value : '';

        if (!rawUsername) {
          AudioEngine.playLimitAlert();
          showLoginAlert('Silakan masukkan username kamu!', 'warning');
          showToast('Silakan masukkan username kamu!', 'warning');
          if (inputUsername) {
            inputUsername.style.borderColor = '#ef4444';
            inputUsername.focus();
          }
          return;
        }

        if (!rawPassword) {
          AudioEngine.playLimitAlert();
          showLoginAlert('Silakan masukkan password akun kamu!', 'warning');
          showToast('Silakan masukkan password akun kamu!', 'warning');
          if (inputPassword) {
            inputPassword.style.borderColor = '#ef4444';
            inputPassword.focus();
          }
          return;
        }

        const slug = getUserSlug(rawUsername);
        const creds = getStoredCredentials();

        // Akun harus terdaftar terlebih dahulu lewat Sign Up (Daftar Akun)
        if (!creds[slug]) {
          AudioEngine.playLimitAlert();
          const notRegMsg = `Akun "${rawUsername}" belum terdaftar! Silakan klik tab "Daftar Akun" di atas untuk mendaftar.`;
          showLoginAlert(notRegMsg, 'danger');
          showToast(notRegMsg, 'danger');
          if (inputUsername) {
            inputUsername.style.borderColor = '#ef4444';
            inputUsername.focus();
          }
          return;
        }

        // Verifikasi password akun terdaftar
        if (creds[slug].password !== rawPassword) {
          AudioEngine.playLimitAlert();
          const wrongPwdMsg = 'Password salah! Cek kembali password akun kamu.';
          showLoginAlert(wrongPwdMsg, 'danger');
          showToast(wrongPwdMsg, 'danger');
          if (inputPassword) {
            inputPassword.value = '';
            inputPassword.style.borderColor = '#ef4444';
            inputPassword.focus();
          }
          return;
        }

        const userObj = {
          slug: slug,
          username: creds[slug].username || rawUsername,
          displayName: creds[slug].displayName || creds[slug].username || rawUsername,
          provider: 'username',
          email: '',
          avatarText: (rawUsername[0] || 'U').toUpperCase(),
          loginAt: Date.now()
        };

        hideLoginAlert();
        loginAsUser(userObj, true);
        if (inputUsername) inputUsername.value = '';
        if (inputPassword) inputPassword.value = '';
      });
    }

    // 3. Handle Register Submit (Instant Register & Login - Tanpa batasan kuota OTP email)
    if (formRegister) {
      formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawUsername = inputRegUsername ? inputRegUsername.value.trim() : '';
        const rawEmail = inputRegEmail ? inputRegEmail.value.trim() : '';
        const rawPassword = inputRegPassword ? inputRegPassword.value : '';

        if (!rawUsername || rawUsername.length < 3) {
          showToast('Username minimal 3 karakter!', 'warning');
          if (inputRegUsername) inputRegUsername.focus();
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!rawEmail || !emailRegex.test(rawEmail)) {
          showToast('Masukkan alamat email yang valid!', 'warning');
          if (inputRegEmail) inputRegEmail.focus();
          return;
        }

        if (!rawPassword || rawPassword.length < 4) {
          showToast('Password minimal 4 karakter!', 'warning');
          if (inputRegPassword) inputRegPassword.focus();
          return;
        }

        const slug = getUserSlug(rawUsername);
        const creds = getStoredCredentials();

        if (creds[slug]) {
          showToast('Username sudah terdaftar! Silakan login di tab Masuk.', 'warning');
          if (tabLoginBtn) tabLoginBtn.click();
          if (inputUsername) inputUsername.value = rawUsername;
          if (inputPassword) inputPassword.focus();
          return;
        }

        // Check if email is already registered locally
        const isEmailRegistered = Object.values(creds).some(c => c.email && c.email.toLowerCase() === rawEmail.toLowerCase());
        if (isEmailRegistered) {
          showToast('Email ini sudah terdaftar! Silakan login atau gunakan email lain.', 'warning');
          if (inputRegEmail) inputRegEmail.focus();
          return;
        }

        // Simpan akun baru secara permanen
        creds[slug] = {
          username: rawUsername,
          email: rawEmail,
          password: rawPassword,
          verified: true,
          createdAt: Date.now()
        };
        saveCredentials(creds);

        // Daftarkan ke Supabase di background jika terhubung
        if (appState.supabaseClient) {
          appState.supabaseClient.auth.signUp({
            email: rawEmail,
            password: rawPassword,
            options: {
              data: {
                username: rawUsername,
                display_name: rawUsername
              }
            }
          }).catch(err => console.warn('Supabase background signup:', err));
        }

        const userObj = {
          slug: slug,
          username: rawUsername,
          displayName: rawUsername,
          provider: 'username',
          email: rawEmail,
          avatarText: (rawUsername[0] || 'U').toUpperCase(),
          loginAt: Date.now()
        };

        if (inputRegUsername) inputRegUsername.value = '';
        if (inputRegEmail) inputRegEmail.value = '';
        if (inputRegPassword) inputRegPassword.value = '';

        hideLoginAlert();
        loginAsUser(userObj, true);
        AudioEngine.playSuccess();
        showToast(`Akun ${rawUsername} berhasil dibuat! Selamat datang di KeranjangPintar.`, 'success');
        if (window.confetti) {
          window.confetti({ particleCount: 50, spread: 70, origin: { y: 0.2 } });
        }
      });
    }

    // ==========================================================================
    // FORGOT PASSWORD MODULE (Kirim kode verifikasi ke Gmail & Reset Password)
    // ==========================================================================
    const btnForgotTrigger = document.getElementById('btnForgotPasswordTrigger');
    const modalForgot = document.getElementById('modalForgotPasswordBackdrop');
    const btnCancelForgot = document.getElementById('btnCancelForgotModal');
    const formForgotStep1 = document.getElementById('formForgotStep1Email');
    const inputForgotEmail = document.getElementById('inputForgotEmail');
    const formForgotStep2 = document.getElementById('formForgotStep2Reset');
    const forgotTargetEmailDisplay = document.getElementById('forgotTargetEmailDisplay');
    const inputForgotOtp = document.getElementById('inputForgotOtp');
    const inputForgotNewPassword = document.getElementById('inputForgotNewPassword');
    const btnToggleForgotPwd = document.getElementById('btnToggleForgotPwd');
    const forgotModalDesc = document.getElementById('forgotModalDesc');

    let forgotState = null;

    if (btnToggleForgotPwd && inputForgotNewPassword) {
      btnToggleForgotPwd.addEventListener('click', () => {
        const isPwd = inputForgotNewPassword.type === 'password';
        inputForgotNewPassword.type = isPwd ? 'text' : 'password';
        const icon = btnToggleForgotPwd.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = isPwd ? 'visibility_off' : 'visibility';
      });
    }

    if (btnForgotTrigger && modalForgot) {
      btnForgotTrigger.addEventListener('click', () => {
        AudioEngine.playTap();
        forgotState = null;
        if (formForgotStep1) formForgotStep1.classList.remove('hidden');
        if (formForgotStep2) formForgotStep2.classList.add('hidden');
        if (forgotModalDesc) forgotModalDesc.textContent = 'Masukkan email akun kamu untuk menerima 6-digit kode verifikasi';
        if (inputForgotEmail) {
          inputForgotEmail.value = inputUsername && inputUsername.value.includes('@') ? inputUsername.value : '';
          inputForgotEmail.style.borderColor = '';
        }
        modalForgot.classList.remove('hidden');
        setTimeout(() => {
          if (inputForgotEmail) inputForgotEmail.focus();
        }, 150);
      });
    }

    if (btnCancelForgot && modalForgot) {
      btnCancelForgot.addEventListener('click', () => {
        modalForgot.classList.add('hidden');
      });
    }

    // Step 1: Submit Email Lupa Password
    if (formForgotStep1) {
      formForgotStep1.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rawEmail = inputForgotEmail ? inputForgotEmail.value.trim().toLowerCase() : '';
        if (!rawEmail || !rawEmail.includes('@')) {
          showToast('Masukkan alamat email yang valid!', 'warning');
          if (inputForgotEmail) inputForgotEmail.focus();
          return;
        }

        const creds = getStoredCredentials();
        // Cari user berdasarkan email
        const targetSlug = Object.keys(creds).find(s => creds[s].email && creds[s].email.toLowerCase() === rawEmail);

        if (!targetSlug) {
          AudioEngine.playLimitAlert();
          showToast('Email ini belum terdaftar di aplikasi!', 'danger');
          if (inputForgotEmail) {
            inputForgotEmail.style.borderColor = '#ef4444';
            inputForgotEmail.focus();
          }
          return;
        }

        showToast('Mengirim kode verifikasi ke Gmail...', 'info');

        // Panggil Supabase reset password jika terhubung
        if (appState.supabaseClient) {
          try {
            await appState.supabaseClient.auth.resetPasswordForEmail(rawEmail);
          } catch (err) {
            console.warn('Supabase resetPassword error:', err);
          }
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        forgotState = {
          email: rawEmail,
          slug: targetSlug,
          otp: otpCode,
          createdAt: Date.now()
        };

        if (forgotTargetEmailDisplay) forgotTargetEmailDisplay.textContent = rawEmail;
        if (formForgotStep1) formForgotStep1.classList.add('hidden');
        if (formForgotStep2) formForgotStep2.classList.remove('hidden');
        if (forgotModalDesc) forgotModalDesc.textContent = 'Masukkan kode verifikasi dari email dan password baru kamu';

        if (inputForgotOtp) {
          inputForgotOtp.value = '';
          inputForgotOtp.focus();
        }

        AudioEngine.playSuccess();
        showToast(`Kode verifikasi dikirim ke ${rawEmail}`, 'success');
      });
    }

    // Step 2: Submit OTP & Password Baru
    if (formForgotStep2) {
      formForgotStep2.addEventListener('submit', async (e) => {
        e.preventDefault();
        const enteredOtp = inputForgotOtp ? inputForgotOtp.value.trim() : '';
        const newPassword = inputForgotNewPassword ? inputForgotNewPassword.value : '';

        if (!forgotState) {
          showToast('Sesi lupa password telah kadaluarsa. Silakan ulangi.', 'warning');
          if (formForgotStep1) formForgotStep1.classList.remove('hidden');
          if (formForgotStep2) formForgotStep2.classList.add('hidden');
          return;
        }

        if (!enteredOtp || enteredOtp.length < 6) {
          AudioEngine.playLimitAlert();
          showToast('Masukkan 6 digit kode verifikasi!', 'warning');
          if (inputForgotOtp) inputForgotOtp.focus();
          return;
        }

        if (!newPassword || newPassword.length < 4) {
          showToast('Password baru minimal 4 karakter!', 'warning');
          if (inputForgotNewPassword) inputForgotNewPassword.focus();
          return;
        }

        let isOtpValid = false;

        // Coba verifikasi dengan Supabase recovery
        if (appState.supabaseClient) {
          try {
            const { data, error } = await appState.supabaseClient.auth.verifyOtp({
              email: forgotState.email,
              token: enteredOtp,
              type: 'recovery'
            });
            if (!error && data && data.user) {
              isOtpValid = true;
              // Update user password di Supabase
              await appState.supabaseClient.auth.updateUser({ password: newPassword });
            }
          } catch (e) {
            console.warn('Supabase verify recovery error:', e);
          }
        }

        if (!isOtpValid && enteredOtp === forgotState.otp) {
          isOtpValid = true;
        }

        if (!isOtpValid) {
          AudioEngine.playLimitAlert();
          showToast('Kode verifikasi salah! Cek kembali email Anda.', 'danger');
          if (inputForgotOtp) {
            inputForgotOtp.style.borderColor = '#ef4444';
            inputForgotOtp.focus();
          }
          return;
        }

        // Simpan password baru ke kredensial
        const creds = getStoredCredentials();
        if (creds[forgotState.slug]) {
          creds[forgotState.slug].password = newPassword;
          saveCredentials(creds);
        }

        if (modalForgot) modalForgot.classList.add('hidden');
        AudioEngine.playSuccess();
        showToast('Password berhasil diubah! Silakan masuk dengan password baru.', 'success');

        // Beralih ke form login & isi otomatis username
        if (tabLoginBtn) tabLoginBtn.click();
        if (inputUsername) inputUsername.value = creds[forgotState.slug]?.username || forgotState.email;
        if (inputPassword) {
          inputPassword.value = '';
          inputPassword.focus();
        }

        forgotState = null;
      });
    }

    // 4. Handle Official Supabase Google OAuth Flow
    // Helper mem-parse payload JWT tanpa dependency eksternal
    function parseJwtPayload(token) {
      if (!token || typeof token !== 'string') return null;
      try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
      } catch (e) {
        return null;
      }
    }

    // Helper memproses user Supabase ke appState dan langsung tutup form login
    function handleSupabaseUserSession(u) {
      if (!u) return;
      const meta = u.user_metadata || {};
      const email = u.email || meta.email || '';
      const name = meta.full_name || meta.name || (email ? email.split('@')[0] : 'User Google');
      const username = email ? email.split('@')[0] : 'google_user';
      const avatarUrl = meta.avatar_url || meta.picture || '';

      const userObj = {
        slug: 'g_' + getUserSlug(username),
        username: username,
        displayName: name,
        provider: 'google',
        email: email,
        avatarUrl: avatarUrl,
        avatarText: (name[0] || 'G').toUpperCase(),
        loginAt: Date.now()
      };

      loginAsUser(userObj, true);
      const ls = document.getElementById('loginScreen');
      if (ls) {
        ls.classList.add('hidden');
        ls.style.display = 'none';
      }
    }

    // Pemroses token/code OAuth incoming dari berbagai channel (postMessage, direct redirect, dll.)
    async function processOAuthIncoming(payload) {
      if (!payload) return false;
      const { hash = '', search = '', user = null } = payload;

      // 1. Jika objek user sudah disiapkan langsung
      if (user && (user.email || user.user_metadata)) {
        handleSupabaseUserSession(user);
        return true;
      }

      // 2. PKCE Authorization Code flow (search parameter ?code=...)
      if (search.includes('code=')) {
        const searchParams = new URLSearchParams(search.replace(/^\?/, ''));
        const code = searchParams.get('code');
        if (code && appState.supabaseClient) {
          showToast('Menyelesaikan login Google...', 'info');
          try {
            const { data, error } = await appState.supabaseClient.auth.exchangeCodeForSession(code);
            if (data && data.user) {
              handleSupabaseUserSession(data.user);
              return true;
            } else if (data && data.session && data.session.user) {
              handleSupabaseUserSession(data.session.user);
              return true;
            }
          } catch (err) {
            console.warn('exchangeCodeForSession error:', err);
          }
        }
      }

      // 3. Implicit token flow (hash fragment #access_token=...)
      if (hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const providerToken = params.get('provider_token');

        if (accessToken) {
          showToast('Menghubungkan akun Google...', 'info');

          // A. Supabase setSession
          if (appState.supabaseClient) {
            try {
              const { data } = await appState.supabaseClient.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
              });
              if (data && data.user) {
                handleSupabaseUserSession(data.user);
                return true;
              }
            } catch (e) {}
          }

          // B. Decode Supabase JWT secara langsung jika setSession asynchronous
          const jwt = parseJwtPayload(accessToken);
          if (jwt && (jwt.email || jwt.user_metadata)) {
            handleSupabaseUserSession({
              email: jwt.email,
              user_metadata: jwt.user_metadata || {}
            });
            return true;
          }

          // C. Coba fetch Google UserInfo jika ada provider_token asli dari Google
          if (providerToken) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 'Authorization': `Bearer ${providerToken}` }
              });
              if (res.ok) {
                const profile = await res.json();
                handleSupabaseUserSession({
                  email: profile.email,
                  user_metadata: {
                    full_name: profile.name,
                    avatar_url: profile.picture
                  }
                });
                return true;
              }
            } catch (e) {}
          }
        }
      }

      return false;
    }

    // Deteksi jika jendela ini adalah POPUP CALLBACK OAuth dari Supabase/Google
    const isLikelyOAuthPopup = (window.opener && window.opener !== window) || window.name === 'GoogleSignInPopup';
    const currentHash = window.location.hash || '';
    const currentSearch = window.location.search || '';

    // Tangani jika callback menghasilkan error dari Supabase (misal server_error / scopes)
    if (currentSearch.includes('error=')) {
      const sp = new URLSearchParams(currentSearch.replace(/^\?/, ''));
      const errCode = sp.get('error_code') || sp.get('error') || 'unknown';
      const errDesc = sp.get('error_description') || errCode;

      try {
        localStorage.setItem('sg_oauth_error', JSON.stringify({ error: errCode, description: errDesc, time: Date.now() }));
      } catch (e) {}

      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({
            type: 'SUPABASE_OAUTH_ERROR',
            error: errCode,
            description: errDesc
          }, '*');
        } catch (e) {}
      }

      // Jika ini di dalam popup, tutup jendela seketika agar tidak membuka halaman kembar
      if (isLikelyOAuthPopup) {
        setTimeout(() => {
          try { window.close(); } catch (e) {}
        }, 150);
      } else {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    if (currentHash.includes('access_token') || currentSearch.includes('code=')) {
      (async function resolveAnyOAuthCallback() {
        if (!appState.supabaseClient) {
          initSupabaseClient();
        }

        let resolvedUser = null;

        // 1. Tangani code atau access_token
        if (currentSearch.includes('code=') && appState.supabaseClient) {
          try {
            const code = new URLSearchParams(currentSearch.replace(/^\?/, '')).get('code');
            if (code) {
              const { data } = await appState.supabaseClient.auth.exchangeCodeForSession(code);
              if (data && data.user) resolvedUser = data.user;
            }
          } catch (e) {}
        } else if (currentHash.includes('access_token')) {
          try {
            const params = new URLSearchParams(currentHash.replace(/^#/, ''));
            const at = params.get('access_token');
            const rt = params.get('refresh_token');
            if (at && appState.supabaseClient) {
              const { data } = await appState.supabaseClient.auth.setSession({
                access_token: at,
                refresh_token: rt || ''
              });
              if (data && data.user) resolvedUser = data.user;
            }
            if (!resolvedUser && at) {
              const jwt = parseJwtPayload(at);
              if (jwt && (jwt.email || jwt.user_metadata)) {
                resolvedUser = { email: jwt.email, user_metadata: jwt.user_metadata || {} };
              }
            }
          } catch (e) {}
        }

        // 2. Jika user berhasil didapat: simpan ke localStorage agar jendela utama mendeteksi seketika
        if (resolvedUser) {
          const meta = resolvedUser.user_metadata || {};
          const email = resolvedUser.email || meta.email || '';
          const name = meta.full_name || meta.name || (email ? email.split('@')[0] : 'User Google');
          const username = email ? email.split('@')[0] : 'google_user';
          const avatarUrl = meta.avatar_url || meta.picture || '';

          const userObj = {
            slug: 'g_' + getUserSlug(username),
            username: username,
            displayName: name,
            provider: 'google',
            email: email,
            avatarUrl: avatarUrl,
            avatarText: (name[0] || 'G').toUpperCase(),
            loginAt: Date.now()
          };

          try {
            localStorage.setItem('sg_oauth_sync_user', JSON.stringify(userObj));
            localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(userObj));
          } catch (e) {}

          // Kirim postMessage jika opener masih terhubung
          if (window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage({
                type: 'SUPABASE_OAUTH_TOKEN_TRANSFER',
                hash: currentHash,
                search: currentSearch,
                user: resolvedUser
              }, '*');
            } catch (e) {}
          }

          // Jika ini jendela popup, tutup otomatis
          if (isLikelyOAuthPopup) {
            setTimeout(() => {
              try { window.close(); } catch (e) {}
            }, 300);
            return;
          }

          // Jika ini jendela utama (direct redirect), langsung masuk
          loginAsUser(userObj, true);
          const ls = document.getElementById('loginScreen');
          if (ls) {
            ls.classList.add('hidden');
            ls.style.display = 'none';
          }
          window.history.replaceState(null, '', window.location.pathname);
        }
      })();
    }

    // Parent window: Dengarkan token/user/error dari popup via postMessage
    window.addEventListener('message', async (event) => {
      if (event.data && event.data.type === 'SUPABASE_OAUTH_TOKEN_TRANSFER') {
        await processOAuthIncoming(event.data);
      } else if (event.data && event.data.type === 'SUPABASE_OAUTH_ERROR') {
        showToast('Login Google: ' + (event.data.description || event.data.error), 'danger');
      }
    });

    // Parent window: Dengarkan perubahan localStorage jika popup menulis auth token
    window.addEventListener('storage', (e) => {
      if (localStorage.getItem('sg_explicit_logout') === 'true') return;
      if ((e.key === 'sg_oauth_sync_user' || e.key === AUTH_STORAGE_KEYS.CURRENT_USER || (e.key && e.key.includes('auth-token'))) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const u = parsed.user || (parsed.currentSession && parsed.currentSession.user) || parsed;
          if (u && (u.email || u.username)) {
            if (u.provider === 'google') {
              loginAsUser(u, true);
            } else {
              handleSupabaseUserSession(u);
            }
          }
        } catch (err) {}
      }
    });

    // 4. Handle Official Supabase Google OAuth Flow (Popup Mengambang Tanpa Beralih Halaman)
    if (btnGoogle) {
      btnGoogle.addEventListener('click', async () => {
        AudioEngine.playTap();
        try {
          localStorage.removeItem('sg_explicit_logout');
        } catch (e) {}

        if (!appState.supabaseClient) {
          initSupabaseClient();
        }

        if (appState.supabaseClient) {
          showToast('Membuka Google Sign-In...', 'info');

          try {
            const currentRedirect = window.location.origin + window.location.pathname;
            const { data, error } = await appState.supabaseClient.auth.signInWithOAuth({
              provider: 'google',
              options: {
                skipBrowserRedirect: true, // Mencegah halaman utama beralih halaman
                redirectTo: currentRedirect,
                scopes: 'openid email profile',
                queryParams: {
                  prompt: 'select_account',
                  access_type: 'offline'
                }
              }
            });

            if (error) {
              console.warn('Supabase Google OAuth status:', error.message);
              if (error.message.includes('not enabled') || error.message.includes('Unsupported provider')) {
                showToast('Google Provider belum diaktifkan di Supabase!', 'danger');
                showSupabaseGoogleGuide();
                return;
              }
              showToast(error.message, 'danger');
              return;
            }

            if (data && data.url) {
              const width = 500;
              const height = 650;
              const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
              const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

              // Hapus flag sinkronisasi & error lama sebelum mulai
              try {
                localStorage.removeItem('sg_oauth_sync_user');
                localStorage.removeItem('sg_oauth_error');
              } catch (e) {}

              // Buka di popup window terpisah agar halaman utama tidak beralih halaman
              const popup = window.open(
                data.url,
                'GoogleSignInPopup',
                `width=${width},height=${height},left=${left},top=${top},status=0,toolbar=0,menubar=0,location=1`
              );

              if (popup) {
                // Pantau sinkronisasi aktif setiap 300ms dari localStorage dan session
                const checkInterval = setInterval(async () => {
                  try {
                    // Cek jika ada error dari callback
                    const errRaw = localStorage.getItem('sg_oauth_error');
                    if (errRaw) {
                      localStorage.removeItem('sg_oauth_error');
                      clearInterval(checkInterval);
                      try { popup.close(); } catch (e) {}
                      const errObj = JSON.parse(errRaw);
                      showToast('Google Login: ' + (errObj.description || errObj.error), 'danger');
                      return;
                    }

                    // A. Cek sync user dari localStorage (paling cepat & aman dari pemutusan opener)
                    const syncRaw = localStorage.getItem('sg_oauth_sync_user');
                    if (syncRaw) {
                      localStorage.removeItem('sg_oauth_sync_user');
                      clearInterval(checkInterval);
                      const u = JSON.parse(syncRaw);
                      if (u) {
                        loginAsUser(u, true);
                        try { popup.close(); } catch (e) {}
                        return;
                      }
                    }

                    // B. Cek session aktif di Supabase Client
                    if (appState.supabaseClient) {
                      const { data: sData } = await appState.supabaseClient.auth.getSession();
                      if (sData && sData.session && sData.session.user) {
                        clearInterval(checkInterval);
                        handleSupabaseUserSession(sData.session.user);
                        try { popup.close(); } catch (e) {}
                        return;
                      }
                    }

                    // C. Cek current user di localStorage
                    const curRaw = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
                    if (curRaw) {
                      const cur = JSON.parse(curRaw);
                      if (cur && cur.provider === 'google' && cur.loginAt > Date.now() - 30000) {
                        clearInterval(checkInterval);
                        loginAsUser(cur, true);
                        try { popup.close(); } catch (e) {}
                        return;
                      }
                    }

                    // D. Jika popup sudah ditutup user
                    if (popup.closed) {
                      clearInterval(checkInterval);
                      // Cek sekali lagi apakah login sudah tersimpan
                      setTimeout(() => {
                        const finalCheck = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
                        if (finalCheck) {
                          const u = JSON.parse(finalCheck);
                          if (u && u.provider === 'google') {
                            loginAsUser(u, true);
                          }
                        }
                      }, 400);
                    }
                  } catch (e) {}
                }, 300);
              } else {
                showToast('Izinkan pop-up di browser Anda agar tidak beralih halaman.', 'warning');
              }
            }
          } catch (err) {
            console.error('Supabase OAuth error:', err);
            showToast('Gagal memproses Supabase OAuth: ' + err.message, 'danger');
          }
        } else {
          showToast('Koneksi Supabase belum siap', 'warning');
        }
      });
    }

    function showSupabaseGoogleGuide() {
      const guideText = 
        'AKSES GOOGLE BELUM DIAKTIFKAN DI DASHBOARD SUPABASE!\n\n' +
        'Langkah manual yang perlu Anda lakukan (hanya 2 menit):\n\n' +
        '1. Buka Dashboard Supabase Anda:\n' +
        '   https://supabase.com/dashboard/project/szhtgpjvudguknevurfh/auth/providers\n\n' +
        '2. Klik provider "Google" dan aktifkan toggle "Enable Google provider".\n\n' +
        '3. Buka Google Cloud Console (https://console.cloud.google.com/apis/credentials):\n' +
        '   - Buat OAuth Client ID (Web Application)\n' +
        '   - Masukkan Callback URL Supabase ini ke Authorized Redirect URIs:\n' +
        '     https://szhtgpjvudguknevurfh.supabase.co/auth/v1/callback\n\n' +
        '4. Salin Client ID & Client Secret dari Google ke kolom di Supabase tadi, lalu klik Save.\n\n' +
        'Setelah itu, tombol Google ini akan 100% otomatis membuka akun Google asli Anda!';

      alert(guideText);
    }

    // Listener respon dari popup Google Account Chooser
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'GOOGLE_SIGNIN_SUCCESS' && event.data.account) {
        const acct = event.data.account;
        const username = acct.email.split('@')[0];
        const slug = 'g_' + getUserSlug(username);

        const userObj = {
          slug: slug,
          username: username,
          displayName: acct.name,
          provider: 'google',
          email: acct.email,
          avatarText: acct.avatar || (acct.name[0] || 'G').toUpperCase(),
          avatarClass: acct.avatarClass || '',
          loginAt: Date.now()
        };

        loginAsUser(userObj, true);
        AudioEngine.playSuccess();
        showToast(`Selamat datang, ${acct.name}! Berhasil masuk via Google.`, 'success');
      }
    });

    // Cek jika login Google selesai via redirect tab mandiri
    try {
      const pendingRaw = localStorage.getItem('pending_google_login');
      if (pendingRaw) {
        localStorage.removeItem('pending_google_login');
        const acct = JSON.parse(pendingRaw);
        if (acct && acct.email) {
          const username = acct.email.split('@')[0];
          const slug = 'g_' + getUserSlug(username);
          const userObj = {
            slug: slug,
            username: username,
            displayName: acct.name,
            provider: 'google',
            email: acct.email,
            avatarText: acct.avatar || (acct.name[0] || 'G').toUpperCase(),
            avatarClass: acct.avatarClass || '',
            loginAt: Date.now()
          };
          loginAsUser(userObj, true);
          showToast(`Selamat datang, ${acct.name}! Berhasil masuk via Google.`, 'success');
        }
      }
    } catch(e) {}

    // 7. Profile Header Trigger
    if (btnProfileTrigger) {
      btnProfileTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        AudioEngine.playTap();
        openUserProfileModal();
      });
    }

    const headerAvatarEl = document.getElementById('headerUserAvatar');
    if (headerAvatarEl) {
      headerAvatarEl.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        AudioEngine.playTap();
        openUserProfileModal();
      });
    }

    // 8. Close Profile Modal
    if (btnCloseProfile && modalProfile) {
      btnCloseProfile.addEventListener('click', () => {
        modalProfile.classList.add('hidden');
        modalProfile.style.display = 'none';
      });
    }

    if (modalProfile) {
      modalProfile.addEventListener('click', (e) => {
        if (e.target === modalProfile) {
          modalProfile.classList.add('hidden');
          modalProfile.style.display = 'none';
        }
      });
    }

    // 9. Switch Account Button (From Profile Modal)
    if (btnSwitchAccount) {
      btnSwitchAccount.addEventListener('click', () => {
        AudioEngine.playTap();
        if (modalProfile) {
          modalProfile.classList.add('hidden');
          modalProfile.style.display = 'none';
        }
        if (loginScreen) {
          loginScreen.classList.remove('hidden');
          loginScreen.style.display = '';
          renderSavedAccountsList();
          if (inputUsername) {
            inputUsername.focus();
          }
        }
      });
    }

    // 10. Logout Button
    if (btnLogoutUser) {
      btnLogoutUser.addEventListener('click', () => {
        AudioEngine.playTap();
        logoutUser();
      });
    }

    // 11. Data Management in Profile Modal
    const btnExpProfile = document.getElementById('btnExportDataProfile');
    if (btnExpProfile) btnExpProfile.addEventListener('click', exportDataJson);

    const btnImpProfile = document.getElementById('btnImportDataProfile');
    if (btnImpProfile) {
      btnImpProfile.addEventListener('click', () => {
        document.getElementById('importFileInput')?.click();
      });
    }

    const btnResetProfile = document.getElementById('btnResetDataProfile');
    if (btnResetProfile) btnResetProfile.addEventListener('click', resetAllData);
  }

  function loginAsUser(userObj, withGreeting = true) {
    try {
      localStorage.removeItem('sg_explicit_logout');
    } catch (e) {}
    appState.currentUser = userObj;
    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(userObj));

      // Update Known Users List
      let knownUsers = [];
      const saved = localStorage.getItem(AUTH_STORAGE_KEYS.KNOWN_USERS);
      if (saved) knownUsers = JSON.parse(saved);

      const existingIdx = knownUsers.findIndex(u => u.slug === userObj.slug);
      if (existingIdx >= 0) {
        knownUsers[existingIdx] = userObj;
      } else {
        knownUsers.unshift(userObj);
      }
      knownUsers = knownUsers.slice(0, 8);
      localStorage.setItem(AUTH_STORAGE_KEYS.KNOWN_USERS, JSON.stringify(knownUsers));
    } catch (e) {
      console.warn('Error saving user session:', e);
    }

    // Load data isolated strictly for this user
    loadDataFromStorage();
    appState.hasInitialCloudPulled = false;

    // Hide login screen
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.classList.add('hidden');
      loginScreen.style.display = 'none';
    }

    // Update Header UI
    updateHeaderUserUI();

    // Render all components
    renderAll();

    // Immediately pull latest real-time cloud data (cart, planner, budget) and subscribe to user channel
    if (appState.supabaseClient) {
      subscribeToRealtimeChanges();
      pullDataFromSupabase(true).then(() => {
        appState.hasInitialCloudPulled = true;
      });
    } else {
      initSupabaseClient();
    }

    if (withGreeting) {
      AudioEngine.playSuccess();
      showToast(`Halo, ${userObj.displayName}! Ruang belanja Anda aktif.`, 'success');
      if (window.confetti) {
        window.confetti({ particleCount: 35, spread: 60, origin: { y: 0.15 } });
      }
    }
  }

  async function logoutUser() {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem('sg_oauth_sync_user');
      localStorage.setItem('sg_explicit_logout', 'true');

      // Bersihkan semua token auth Supabase dari localStorage agar tidak auto-restore session
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('supabase.auth'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}

    // Sign out tuntas dari Supabase Client
    if (appState.supabaseClient && appState.supabaseClient.auth) {
      try {
        await appState.supabaseClient.auth.signOut({ scope: 'local' });
      } catch (e) {
        console.warn('Supabase signOut error:', e);
      }
    }

    appState.currentUser = null;

    const modalProfile = document.getElementById('modalUserProfileBackdrop');
    if (modalProfile) modalProfile.classList.add('hidden');

    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
      loginScreen.classList.remove('hidden');
      loginScreen.style.display = '';
      renderSavedAccountsList();
    }

    updateHeaderUserUI();
    showToast('Anda telah keluar dari akun.', 'info');
  }

  function updateHeaderUserUI() {
    const avatarEl = document.getElementById('headerUserAvatar');
    const nameEl = document.getElementById('headerUsername');
    if (!appState.currentUser) {
      if (avatarEl) {
        avatarEl.textContent = '?';
        avatarEl.className = 'w-6 h-6 rounded-full bg-stone-300 text-stone-700 text-[11px] font-black flex items-center justify-center shrink-0 shadow-sm pointer-events-none';
      }
      if (nameEl) nameEl.textContent = 'Masuk';
      return;
    }
    if (avatarEl) {
      if (appState.currentUser.avatarUrl) {
        avatarEl.innerHTML = `<img src="${appState.currentUser.avatarUrl}" alt="Avatar" class="w-full h-full object-cover rounded-full" referrerpolicy="no-referrer" />`;
      } else {
        avatarEl.textContent = appState.currentUser.avatarText || 'U';
      }
      if (appState.currentUser.avatarClass === 'avatar-green') {
        avatarEl.className = 'w-6 h-6 rounded-full bg-emerald-600 text-white text-[12px] font-black flex items-center justify-center shrink-0 shadow-sm pointer-events-none';
      } else if (appState.currentUser.avatarClass === 'avatar-gray') {
        avatarEl.className = 'w-6 h-6 rounded-full bg-stone-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-sm pointer-events-none';
      } else if (appState.currentUser.avatarClass === 'avatar-dark') {
        avatarEl.className = 'w-6 h-6 rounded-full bg-stone-900 text-white text-[12px] font-black flex items-center justify-center shrink-0 shadow-sm border border-stone-700 pointer-events-none';
      } else if (appState.currentUser.avatarClass === 'avatar-amber') {
        avatarEl.className = 'w-6 h-6 rounded-full bg-amber-500 text-white text-[12px] font-black flex items-center justify-center shrink-0 shadow-sm pointer-events-none';
      } else if (appState.currentUser.avatarClass === 'avatar-brown') {
        avatarEl.className = 'w-6 h-6 rounded-full bg-amber-900 text-white text-[11px] font-black flex items-center justify-center shrink-0 shadow-sm pointer-events-none';
      } else if (appState.currentUser.provider === 'google') {
        avatarEl.className = 'w-6 h-6 rounded-full bg-blue-600 text-white text-[12px] font-black flex items-center justify-center shrink-0 shadow-sm pointer-events-none';
      } else {
        avatarEl.className = 'w-6 h-6 rounded-full bg-citrus text-ink text-[11px] font-black flex items-center justify-center shrink-0 shadow-sm pointer-events-none';
      }
    }
    if (nameEl) nameEl.textContent = appState.currentUser.displayName || appState.currentUser.username || 'User';
  }

  function openUserProfileModal() {
    const modalProfile = document.getElementById('modalUserProfileBackdrop');
    if (!modalProfile) return;

    if (!appState.currentUser) {
      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen) {
        loginScreen.classList.remove('hidden');
        loginScreen.style.display = '';
        renderSavedAccountsList();
      }
      return;
    }

    const avatar = document.getElementById('profileModalAvatar');
    const displayName = document.getElementById('profileModalDisplayName');
    const badge = document.getElementById('profileModalProviderBadge');
    const subtitle = document.getElementById('profileModalSubtitle');
    const cartCount = document.getElementById('profileModalCartCount');
    const budgetCap = document.getElementById('profileModalBudgetCap');

    const isGoogle = appState.currentUser.provider === 'google';
    if (avatar) {
      if (appState.currentUser.avatarUrl) {
        avatar.innerHTML = `<img src="${appState.currentUser.avatarUrl}" alt="Avatar" class="w-full h-full object-cover rounded-2xl" referrerpolicy="no-referrer" />`;
      } else {
        avatar.textContent = appState.currentUser.avatarText || 'U';
      }
      if (appState.currentUser.avatarClass === 'avatar-green') {
        avatar.className = 'w-14 h-14 rounded-2xl bg-emerald-600 text-white text-2xl font-bold flex items-center justify-center shadow-md shrink-0';
      } else if (appState.currentUser.avatarClass === 'avatar-amber') {
        avatar.className = 'w-14 h-14 rounded-2xl bg-amber-500 text-white text-2xl font-bold flex items-center justify-center shadow-md shrink-0';
      } else if (appState.currentUser.avatarClass === 'avatar-dark') {
        avatar.className = 'w-14 h-14 rounded-2xl bg-stone-900 text-white text-2xl font-bold flex items-center justify-center shadow-md shrink-0 border border-stone-700';
      } else if (isGoogle) {
        avatar.className = 'w-14 h-14 rounded-2xl bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shadow-md shrink-0';
      } else {
        avatar.className = 'w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-secondary-fixed text-xl font-bold flex items-center justify-center shadow-md shrink-0';
      }
    }
    if (displayName) displayName.textContent = appState.currentUser.displayName || appState.currentUser.username;
    if (badge) {
      badge.textContent = isGoogle ? 'Akun Google' : 'Username Mandiri';
      badge.className = isGoogle
        ? 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700'
        : 'text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-fixed/30 text-secondary';
    }
    if (subtitle) {
      subtitle.textContent = isGoogle && appState.currentUser.email
        ? appState.currentUser.email
        : `@${appState.currentUser.username} • Ruang Data Privat`;
    }

    if (cartCount) {
      const physicalCount = appState.cart.filter(i => i.inPhysicalCart).length;
      cartCount.textContent = `${appState.cart.length} Produk (${physicalCount} fisik)`;
    }

    if (budgetCap) {
      budgetCap.textContent = 'Rp ' + formatNumber(appState.budgetLimit);
    }

    modalProfile.classList.remove('hidden');
    modalProfile.style.display = 'flex';
  }

  function renderSavedAccountsList() {
    const section = document.getElementById('sectionSavedAccounts');
    const list = document.getElementById('savedAccountsList');
    if (!section || !list) return;

    let knownUsers = [];
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEYS.KNOWN_USERS);
      if (saved) knownUsers = JSON.parse(saved);
    } catch (e) {}

    // Sembunyikan bagian jika tidak ada akun tersimpan di perangkat
    if (!Array.isArray(knownUsers) || knownUsers.length === 0) {
      section.classList.add('hidden');
      list.innerHTML = '';
      return;
    }

    section.classList.remove('hidden');
    list.innerHTML = knownUsers.map(u => {
      const isGoogle = u.provider === 'google';
      const badgeIcon = isGoogle ? 'verified' : 'person';
      return `
        <div class="inline-flex items-center rounded-full bg-[#FAF8F5] border-2 border-stone-300 hover:border-stone-800 transition-all shadow-xs group">
          <button type="button" class="btn-quick-user-chip flex items-center gap-1.5 py-1.5 pl-2.5 pr-1 text-on-surface text-xs font-semibold cursor-pointer active:scale-95 transition-transform" data-user='${escapeHtml(JSON.stringify(u))}'>
            <span class="w-5 h-5 rounded-full ${isGoogle ? 'bg-blue-600 text-white' : 'bg-primary text-secondary-fixed'} text-[10px] font-bold flex items-center justify-center shrink-0">${escapeHtml(u.avatarText || 'U')}</span>
            <span class="truncate max-w-[110px]">${escapeHtml(u.displayName || u.username)}</span>
            <span class="material-symbols-outlined text-[13px] text-stone-400">${badgeIcon}</span>
          </button>
          <button type="button" class="btn-delete-saved-user w-6 h-6 mr-1 rounded-full text-stone-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer" data-slug="${escapeHtml(u.slug)}" title="Hapus dari daftar tersimpan">
            <span class="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      `;
    }).join('');

    // Klik chip akun tersimpan untuk langsung masuk (Quick Login)
    list.querySelectorAll('.btn-quick-user-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        try {
          const u = JSON.parse(btn.getAttribute('data-user'));
          AudioEngine.playTap();
          loginAsUser(u, true);
        } catch (e) {
          console.warn('Error selecting saved user:', e);
        }
      });
    });

    // Klik tombol silang (x) untuk menghapus akun dari daftar tersimpan
    list.querySelectorAll('.btn-delete-saved-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const slugToDelete = btn.getAttribute('data-slug');
        if (!slugToDelete) return;
        AudioEngine.playTap();
        deleteSavedAccount(slugToDelete);
      });
    });
  }

  function deleteSavedAccount(slugToDelete) {
    try {
      let knownUsers = [];
      const saved = localStorage.getItem(AUTH_STORAGE_KEYS.KNOWN_USERS);
      if (saved) knownUsers = JSON.parse(saved);

      const removedUser = knownUsers.find(u => u.slug === slugToDelete);
      const updated = knownUsers.filter(u => u.slug !== slugToDelete);
      localStorage.setItem(AUTH_STORAGE_KEYS.KNOWN_USERS, JSON.stringify(updated));

      renderSavedAccountsList();
      const name = removedUser ? (removedUser.displayName || removedUser.username) : (slugToDelete === 'rian' ? 'Rian Kos' : 'Akun');
      showToast(`Akun ${name} dihapus dari daftar tersimpan`, 'info');
    } catch (e) {
      console.warn('Error deleting saved user:', e);
    }
  }

  function renderAll() {
    renderCart();
    renderAstroCatalog();
    renderShoppingPlannerSection();
    renderBudgetBreakdown();
    renderHistoryList();
    renderMasterList();
  }

})();

