/**
 * Firebase Firestore Cloud Integration (Modul P12 Bagian 9 & SRS F-06)
 * Project: smart-grocery-truckerr
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyBOL-kTuET8eH8IWbCUKyjiGCTBQiiUeEo",
  authDomain: "smart-grocery-truckerr.firebaseapp.com",
  projectId: "smart-grocery-truckerr",
  storageBucket: "smart-grocery-truckerr.firebasestorage.app",
  messagingSenderId: "127646707310",
  appId: "1:127646707310:web:5a528a259ae372bf8c007f"
};

let app = null;
let db = null;
let isConnected = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  isConnected = true;
  console.log("🔥 Firebase initialized successfully for smart-grocery-truckerr!");
} catch (error) {
  console.warn("Firebase initialization notice:", error);
}

// Make accessible to app.js
window.firebaseApp = app;
window.firebaseDb = db;
window.isFirebaseConnected = isConnected;

/**
 * Update UI Indicator for Cloud Connection
 */
export function updateFirebaseUIStatus() {
  const statusEl = document.getElementById('firebaseStatusIndicator');
  const textarea = document.getElementById('firebaseConfigInput');

  if (textarea && !textarea.value.trim()) {
    textarea.value = JSON.stringify(firebaseConfig, null, 2);
  }

  if (statusEl) {
    if (isConnected) {
      statusEl.innerHTML = `🟢 Terhubung Cloud Firestore (smart-grocery-truckerr)`;
      statusEl.className = 'firebase-status-chip firebase-online';
    } else {
      statusEl.innerHTML = `⚪ Mode Offline (LocalStorage Aktif)`;
      statusEl.className = 'firebase-status-chip firebase-offline';
    }
  }
}

/**
 * Sync active cart items and budget limit to Firestore
 */
export async function syncCartToFirestore(items, budgetLimit, profileName = "Rian (Anak Kos)") {
  if (!db) return;
  try {
    const cartDocRef = doc(db, "groceries", "current_cart");
    await setDoc(cartDocRef, {
      user: profileName,
      budgetLimit: budgetLimit,
      items: items,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("☁️ Data keranjang berhasil disinkronkan ke Firestore!");
  } catch (err) {
    // Graceful offline fallback
    console.warn("Firestore sync notification:", err.message);
  }
}

/**
 * Save completed shopping receipt to Firestore history
 */
export async function saveHistoryToFirestore(receipt) {
  if (!db) return;
  try {
    const historyDocRef = doc(db, "groceries_history", receipt.id || `session-${Date.now()}`);
    await setDoc(historyDocRef, {
      ...receipt,
      savedAt: new Date().toISOString()
    });
    console.log("☁️ Struk belanja berhasil diarsipkan ke Firestore!");
  } catch (err) {
    console.warn("Firestore history save notification:", err.message);
  }
}

// Expose functions globally for app.js
window.syncCartToFirestore = syncCartToFirestore;
window.saveHistoryToFirestore = saveHistoryToFirestore;
window.updateFirebaseUIStatus = updateFirebaseUIStatus;

// Initialize on DOM load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateFirebaseUIStatus);
} else {
  updateFirebaseUIStatus();
}
