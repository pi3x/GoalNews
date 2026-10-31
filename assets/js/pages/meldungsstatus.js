import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, collection, query, where, limit, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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
const $ = (id) => document.getElementById(id);
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user && !user.isAnonymous && user.email ? user : null;
  $("app").hidden = !currentUser;
  $("loginBox").hidden = Boolean(currentUser);
  if (currentUser) loadMyReports();
});

function setMessage(message, error = false) {
  const element = $("statusMessage");
  element.textContent = message;
  element.classList.toggle("error", error);
}

function formatDate(value) {
  try {
    if (value?.toDate) return value.toDate().toLocaleString("de-DE");
    if (value) return new Date(value).toLocaleString("de-DE");
  } catch { /* Show no timestamp when it cannot be formatted. */ }
  return "";
}

async function loadMyReports() {
  const list = $("myReportsList");
  list.replaceChildren();
  $("myReportsMessage").textContent = "Deine Meldungen werden geladen …";
  try {
    const snapshot = await getDocs(query(
      collection(db, "reports"),
      where("reporterUid", "==", currentUser.uid),
      limit(100),
    ));
    const reports = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    reports.sort((a, b) => {
      const aTime = a.created?.toMillis?.() || 0;
      const bTime = b.created?.toMillis?.() || 0;
      return bTime - aTime;
    });
    if (!reports.length) {
      $("myReportsMessage").textContent = "Du hast mit diesem Konto noch keine Meldungen gesendet.";
      return;
    }

    for (const report of reports) {
      const card = document.createElement("article");
      card.className = "my-report-card";
      const heading = document.createElement("div");
      heading.className = "my-report-heading";
      const title = document.createElement("strong");
      title.textContent = report.targetName || report.type || "GoalNews-Meldung";
      const badge = document.createElement("span");
      badge.className = "status-badge";
      badge.textContent = report.status || "Neu";
      badge.dataset.status = report.status || "Neu";
      heading.append(title, badge);

      const idLabel = document.createElement("small");
      idLabel.className = "saved-report-id";
      idLabel.textContent = `Meldungs-ID: ${report.id}`;
      const meta = document.createElement("p");
      meta.className = "result-meta";
      meta.textContent = `${report.type || "Meldung"} · ${formatDate(report.updatedAt || report.created)}`;

      const actions = document.createElement("div");
      actions.className = "saved-report-actions";
      const openButton = document.createElement("button");
      openButton.className = "button";
      openButton.type = "button";
      openButton.textContent = "Status ansehen";
      openButton.addEventListener("click", () => {
        $("reportId").value = report.id;
        $("statusSearch").requestSubmit();
      });
      const copyButton = document.createElement("button");
      copyButton.className = "copy-id-button";
      copyButton.type = "button";
      copyButton.textContent = "ID kopieren";
      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(report.id);
          copyButton.textContent = "Kopiert ✓";
          window.setTimeout(() => { copyButton.textContent = "ID kopieren"; }, 1400);
        } catch {
          copyButton.textContent = "ID markieren und kopieren";
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(idLabel);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      });
      actions.append(openButton, copyButton);
      card.append(heading, idLabel, meta, actions);
      list.appendChild(card);
    }
    $("myReportsMessage").textContent = `${reports.length} ${reports.length === 1 ? "Meldung ist" : "Meldungen sind"} mit deinem Konto verknüpft.`;
  } catch (error) {
    console.error("Eigene Meldungen konnten nicht geladen werden", error);
    $("myReportsMessage").textContent = "Deine Meldungen konnten nicht geladen werden. Prüfe, ob die aktuellen Firestore-Regeln veröffentlicht sind.";
    $("myReportsMessage").classList.add("error");
  }
}

$("statusSearch").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser) return;
  const id = $("reportId").value.trim();
  $("statusResult").hidden = true;
  if (!id || id.length > 260) {
    setMessage("Bitte gib eine gültige Meldungs-ID ein.", true);
    return;
  }

  const button = $("searchButton");
  button.disabled = true;
  setMessage("Status wird abgerufen …");
  try {
    const snapshot = await getDoc(doc(db, "reports", id));
    if (!snapshot.exists()) {
      setMessage("Meldung nicht gefunden. Prüfe die ID und ob du mit dem sendenden Konto angemeldet bist.", true);
      return;
    }
    const report = snapshot.data();
    const status = String(report.status || "Neu");
    $("resultType").textContent = report.type === "Kontomeldung" ? "Kontomeldung" : "Kommentarmeldung";
    $("resultBadge").textContent = status;
    $("resultBadge").dataset.status = status;
    $("resultId").textContent = id;
    $("resultTarget").textContent = report.targetName ? `Gemeldeter Inhalt von ${report.targetName}` : "Deine Meldung wurde empfangen.";
    const note = String(report.statusNote || "").trim();
    $("resultNoteWrap").hidden = !note;
    $("resultNote").textContent = note;
    const updated = formatDate(report.updatedAt || report.created);
    $("resultUpdated").textContent = updated ? `Zuletzt aktualisiert: ${updated}` : "";
    $("statusResult").hidden = false;
    setMessage("Meldung gefunden.");
  } catch (error) {
    console.error("Meldungsstatus konnte nicht geladen werden", error);
    setMessage("Meldung nicht gefunden oder du bist nicht mit dem Konto angemeldet, von dem sie gesendet wurde.", true);
  } finally {
    button.disabled = false;
  }
});
