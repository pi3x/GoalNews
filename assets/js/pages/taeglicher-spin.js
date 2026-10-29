import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, runTransaction } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
  authDomain: "goalnewsde-community.firebaseapp.com",
  projectId: "goalnewsde-community",
  storageBucket: "goalnewsde-community.firebasestorage.app",
  messagingSenderId: "134523022055",
  appId: "1:134523022055:web:4f35ed7812d06e4fb55042",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const spinBtn = document.getElementById("spinBtn");
const wheel = document.getElementById("wheel");
const result = document.getElementById("result");
const balanceEl = document.getElementById("balance");
const lastSpinEl = document.getElementById("lastSpin");
const prizes = [10, 25, 50, 15, 150, 20, 75, 30];
const COINS_PAUSED = true;
let userRef = null;
let busy = false;

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function updateDailyState(data) {
  const coins = Number(data.coins) || 0;
  balanceEl.textContent = `Dein Kontostand: ${coins.toLocaleString("de-DE")} Coins`;
  if (COINS_PAUSED) {
    spinBtn.disabled = true;
    spinBtn.textContent = "Daily Spin pausiert";
    result.textContent = "Dein Kontostand bleibt gespeichert. Coin-Verdienen ist derzeit deaktiviert.";
    document.querySelector(".wheel-wrap").hidden = true;
    return;
  }
  const lastSpin = data.lastSpin || "";
  lastSpinEl.textContent = lastSpin ? `Letzter Spin: ${lastSpin}` : "Du hast heute noch nicht gedreht.";
  const alreadySpun = lastSpin === localDateKey();
  spinBtn.disabled = alreadySpun;
  spinBtn.textContent = alreadySpun ? "Morgen wartet dein nächster Spin" : "Jetzt drehen";
  if (alreadySpun) result.textContent = "Dein täglicher Bonus wurde bereits abgeholt. Bis morgen!";
}

onAuthStateChanged(auth, async user => {
  if (!user) { window.location.href = "anmelden.html"; return; }
  userRef = doc(db, "users", user.uid);
  try {
    const snapshot = await getDoc(userRef);
    if (!snapshot.exists()) throw new Error("USER_NOT_FOUND");
    updateDailyState(snapshot.data());
  } catch (error) {
    console.error("Daily-Spin-Konto konnte nicht geladen werden:", error);
    spinBtn.disabled = true;
    spinBtn.textContent = "Konto konnte nicht geladen werden";
    result.textContent = "Bitte lade die Seite neu oder melde dich erneut an.";
  }
});

spinBtn.addEventListener("click", async () => {
  if (COINS_PAUSED) return;
  if (!userRef || busy) return;
  busy = true;
  spinBtn.disabled = true;
  spinBtn.textContent = "Das Rad dreht sich …";
  result.textContent = "Viel Glück!";
  const prizeIndex = Math.floor(Math.random() * prizes.length);
  const reward = prizes[prizeIndex];
  const segmentAngle = 360 / prizes.length;
  const targetAngle = 360 * 6 + (360 - (prizeIndex + 0.5) * segmentAngle);
  wheel.style.transform = `rotate(${targetAngle}deg)`;
  try {
    await new Promise(resolve => window.setTimeout(resolve, 4300));
    const updated = await runTransaction(db, async transaction => {
      const snap = await transaction.get(userRef);
      if (!snap.exists()) throw new Error("USER_NOT_FOUND");
      const data = snap.data();
      if (data.lastSpin === localDateKey()) throw new Error("ALREADY_SPUN");
      const coins = (Number(data.coins) || 0) + reward;
      transaction.update(userRef, { coins, lastSpin: localDateKey() });
      return { ...data, coins, lastSpin: localDateKey() };
    });
    result.textContent = `🎉 Stark! Du hast ${reward} Coins gewonnen.`;
    updateDailyState(updated);
  } catch (error) {
    console.error("Daily Spin fehlgeschlagen:", error);
    result.textContent = error.message === "ALREADY_SPUN" ? "Du hast heute bereits gedreht. Dein Bonus wartet morgen wieder auf dich." : "Der Spin konnte nicht gespeichert werden. Bitte prüfe deine Verbindung und versuche es erneut.";
    spinBtn.disabled = error.message === "ALREADY_SPUN";
    spinBtn.textContent = error.message === "ALREADY_SPUN" ? "Morgen wartet dein nächster Spin" : "Erneut versuchen";
    if (error.message === "ALREADY_SPUN") lastSpinEl.textContent = `Letzter Spin: ${localDateKey()}`;
  } finally {
    busy = false;
  }
});
