/*
  Random User Picker (Admin)
  - Lädt alle Dokumente aus collection "users" (einmal)
  - Wählt zufällig ein Dokument aus und zeigt nur diesen User an
  - Admin-Zugriff prüfen: EDITIEREN SIE ADMIN_UIDS vor Einsatz
  - Keine E-Mail/Passwörter ausgeben (sensible Daten vermeiden)
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// --- Firebase config (wie bei deinen anderen Seiten) ---
const firebaseConfig = {
  apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
  authDomain: "goalnewsde-community.firebaseapp.com",
  projectId: "goalnewsde-community",
  storageBucket: "goalnewsde-community.firebasestorage.app",
  messagingSenderId: "134523022055",
  appId: "1:134523022055:web:4f35ed7812d06e4fb55042"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const ADMIN_UIDS = ["gaPuzG1ULdUSskKUsciL1g79nh72", "5Oe5YOBOtfOGQsRJ3XUjr3kemnX2"];

// UI-Elemente
const loading = document.getElementById("loading");
const userDisplay = document.getElementById("userDisplay");
const noAccess = document.getElementById("noAccess");
const noUsers = document.getElementById("noUsers");
const pickBtn = document.getElementById("pickBtn");
const refreshBtn = document.getElementById("refreshBtn");
const logEl = document.getElementById("log");

const uidEl = document.getElementById("uid");
const usernameEl = document.getElementById("username");
const coinsEl = document.getElementById("coins");
const favEl = document.getElementById("fav");
const extraEl = document.getElementById("extra");

let usersCache = []; // Array of { id, data }
let currentDisplayed = null;

function showError(msg){
  loading.style.display = "none";
  noAccess.style.display = "block";
  noAccess.textContent = msg;
}

// Prüfen ob eingeloggter User Admin ist, sonst Redirect/Fehler
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    showError("Nicht angemeldet. Bitte als Admin einloggen.");
    return;
  }
  if (!ADMIN_UIDS.includes(user.uid)) {
    showError("Zugriff verweigert. Du bist kein Admin.");
    return;
  }

  // Admin hat Zugriff -> lade Nutzer
  await loadAllUsers();
});

// Nutzer aus Firestore laden (einmal)
async function loadAllUsers(){
  loading.style.display = "block";
  noAccess.style.display = "none";
  userDisplay.style.display = "none";
  noUsers.style.display = "none";
  pickBtn.style.display = "none";
  refreshBtn.style.display = "none";
  logEl.style.display = "none";

  try {
    const colRef = collection(db, "users");
    const snapshot = await getDocs(colRef);
    usersCache = [];

    snapshot.forEach(docSnap => {
      usersCache.push({ id: docSnap.id, data: docSnap.data() });
    });

    loading.style.display = "none";

    if (usersCache.length === 0) {
      noUsers.style.display = "block";
      return;
    }

    // Zeige erstes zufälliges Ergebnis und Buttons
    pickRandomAndShow();
    pickBtn.style.display = "inline-block";
    refreshBtn.style.display = "inline-block";
    logEl.style.display = "block";
    logEl.textContent = `Insgesamt ${usersCache.length} Nutzer geladen.`;
  } catch (e) {
    console.error(e);
    showError("Fehler beim Laden der Nutzer. Konsole prüfen.");
  }
}

// Zufälligen User auswählen und anzeigen
function pickRandomAndShow(){
  if (!usersCache || usersCache.length === 0) return;
  const index = Math.floor(Math.random() * usersCache.length);
  const item = usersCache[index];
  currentDisplayed = item;
  renderUser(item);
}

// Rendert nur den ausgewählten Nutzer (keine Liste)
function renderUser(item){
  const d = item.data || {};
  uidEl.textContent = item.id;
  usernameEl.textContent = d.username || "(kein username)";
  coinsEl.textContent = (typeof d.coins !== "undefined") ? d.coins : "0";
  favEl.textContent = d.favTeam || d.fav || "-";
  // extra: hier z. B. letzte Nachricht / lastSpin anzeigen (nicht sensibel)
  let extras = [];
  if (d.lastSpin) extras.push(`lastSpin: ${d.lastSpin}`);
  if (d.messages && Array.isArray(d.messages) && d.messages.length>0) extras.push(`messages: ${d.messages.length}`);
  extraEl.textContent = extras.length ? extras.join(" • ") : "-";

  // UI
  userDisplay.style.display = "block";
}

// Buttons
pickBtn.addEventListener("click", () => {
  pickRandomAndShow();
});
refreshBtn.addEventListener("click", () => {
  loadAllUsers();
});
