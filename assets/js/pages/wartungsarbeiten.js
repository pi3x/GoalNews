import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
  authDomain: "goalnewsde-community.firebaseapp.com",
  projectId: "goalnewsde-community",
  storageBucket: "goalnewsde-community.firebasestorage.app",
  messagingSenderId: "134523022055",
  appId: "1:134523022055:web:4f35ed7812d06e4fb55042",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const statusMsg = document.getElementById("statusMsg");
const checkBtn = document.getElementById("checkBtn");

async function checkMaintenance() {
  checkBtn.disabled = true;
  statusMsg.textContent = "Wartungsstatus wird geprüft …";

  try {
    const snap = await getDoc(doc(db, "settings", "main"));
    if (!snap.exists()) {
      statusMsg.textContent = "Der Wartungsstatus ist momentan nicht verfügbar. Bitte versuche es später erneut.";
      return;
    }

    if (snap.data().maintenance === true) {
      statusMsg.textContent = "Die Wartung dauert noch an. Bitte versuche es später erneut.";
      return;
    }

    statusMsg.textContent = "GoalNews ist wieder verfügbar. Du wirst weitergeleitet …";
    window.setTimeout(() => { window.location.href = "../index.html"; }, 1200);
  } catch (error) {
    console.error("Wartungsstatus konnte nicht abgerufen werden:", error);
    statusMsg.textContent = "Der Wartungsstatus konnte nicht abgerufen werden. Bitte prüfe deine Verbindung und versuche es erneut.";
  } finally {
    checkBtn.disabled = false;
  }
}

checkBtn.addEventListener("click", checkMaintenance);
