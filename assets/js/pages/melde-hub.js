import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, collection, query, orderBy, startAt, endAt, limit, getDocs, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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
let selectedTarget = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user && !user.isAnonymous && user.email ? user : null;
  $("app").hidden = !currentUser;
  $("loginBox").hidden = Boolean(currentUser);
});

function setStatus(id, message, isError = false) {
  const element = $(id);
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function safeDate(value) {
  try {
    if (value?.toDate) return value.toDate().toLocaleString("de-DE");
    if (value) return new Date(value).toLocaleString("de-DE");
  } catch { /* Fall through to a neutral label. */ }
  return "Datum nicht verfügbar";
}

function addResult(container, { title, body, meta, target }) {
  const card = document.createElement("article");
  card.className = "result-card";
  const main = document.createElement("div");
  main.className = "result-main";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const content = document.createElement("p");
  content.textContent = body || "Kein Text vorhanden.";
  const details = document.createElement("div");
  details.className = "result-meta";
  details.textContent = meta;
  main.append(heading, content, details);
  const button = document.createElement("button");
  button.className = "report-button";
  button.type = "button";
  button.textContent = "🚩 Melden";
  button.addEventListener("click", () => openReport(target));
  card.append(main, button);
  container.appendChild(card);
}

function normalize(text) {
  return String(text || "").trim().toLocaleLowerCase("de");
}

$("accountSearch").addEventListener("submit", async (event) => {
  event.preventDefault();
  const term = $("accountQuery").value.trim();
  const results = $("accountResults");
  results.replaceChildren();
  if (term.length < 2) {
    setStatus("accountStatus", "Bitte mindestens zwei Zeichen eingeben.", true);
    return;
  }
  setStatus("accountStatus", "Konten werden gesucht …");
  try {
    const lower = term.toLocaleLowerCase("de");
    const snapshot = await getDocs(query(
      collection(db, "friendProfiles"),
      orderBy("usernameLower"),
      startAt(lower),
      endAt(`${lower}\uf8ff`),
      limit(15),
    ));
    const profiles = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((profile) => (profile.uid || profile.id) !== currentUser?.uid);
    if (!profiles.length) {
      setStatus("accountStatus", "Keine passenden Konten gefunden.");
      return;
    }
    for (const profile of profiles) {
      const username = String(profile.username || "GoalNews-Konto").slice(0, 40);
      const uid = String(profile.uid || profile.id);
      addResult(results, {
        title: username,
        body: "GoalNews-Mitglied",
        meta: `Konto-ID: ${uid}`,
        target: { kind: "Konto", id: uid, name: username, summary: `Konto „${username}“ · ID ${uid}` },
      });
    }
    setStatus("accountStatus", `${profiles.length} ${profiles.length === 1 ? "Konto gefunden" : "Konten gefunden"}.`);
  } catch (error) {
    console.error("Kontosuche fehlgeschlagen", error);
    setStatus("accountStatus", "Konten konnten nicht geladen werden. Bitte prüfe Anmeldung und Firestore-Regeln.", true);
  }
});

$("postSearch").addEventListener("submit", async (event) => {
  event.preventDefault();
  const term = normalize($("postQuery").value);
  const results = $("postResults");
  results.replaceChildren();
  if (term.length < 2) {
    setStatus("postStatus", "Bitte mindestens zwei Zeichen eingeben.", true);
    return;
  }
  setStatus("postStatus", "Neueste Beiträge werden durchsucht …");
  try {
    const snapshot = await getDocs(query(collection(db, "comments"), orderBy("created", "desc"), limit(100)));
    const matches = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((post) => post.userId !== currentUser?.uid && normalize(`${post.text || ""} ${post.username || ""}`).includes(term))
      .slice(0, 20);
    if (!matches.length) {
      setStatus("postStatus", "In den letzten 100 Kommentaren wurde nichts Passendes gefunden.");
      return;
    }
    for (const post of matches) {
      const author = String(post.username || "GoalNews-Mitglied").slice(0, 40);
      const authorId = String(post.userId || "Unbekannt");
      addResult(results, {
        title: author,
        body: String(post.text || "").slice(0, 1000),
        meta: `Beitrag-ID: ${post.id} · ${safeDate(post.created)}`,
        target: {
          kind: "Beitrag",
          id: post.id,
          name: author,
          authorId,
          summary: `Beitrag von „${author}“ · Beitrag-ID ${post.id} · Konto-ID ${authorId}`,
          content: String(post.text || "").slice(0, 1500),
        },
      });
    }
    setStatus("postStatus", matches.length === 1 ? "1 passender Beitrag gefunden." : `${matches.length} passende Beiträge gefunden.`);
  } catch (error) {
    console.error("Beitragssuche fehlgeschlagen", error);
    setStatus("postStatus", "Beiträge konnten nicht geladen werden. Bitte prüfe Anmeldung und Firestore-Regeln.", true);
  }
});

function openReport(target) {
  selectedTarget = target;
  $("statusPageLink").hidden = true;
  $("submitReport").disabled = false;
  $("submitReport").textContent = "Meldung senden";
  $("dialogTitle").textContent = `${target.kind} melden`;
  $("targetSummary").textContent = target.summary;
  $("reportReason").value = "Beleidigung oder Belästigung";
  $("reportDetails").value = "";
  setStatus("dialogStatus", "");
  $("reportDialog").showModal();
}

function closeDialog() {
  $("reportDialog").close();
  selectedTarget = null;
}

$("closeDialog").addEventListener("click", closeDialog);
$("reportDialog").addEventListener("click", (event) => {
  if (event.target === $("reportDialog")) closeDialog();
});

$("reportForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentUser || !selectedTarget) {
    setStatus("dialogStatus", "Bitte melde dich erneut an und versuche es noch einmal.", true);
    return;
  }
  const button = $("submitReport");
  button.disabled = true;
  setStatus("dialogStatus", "Meldung wird gesendet …");
  const reason = $("reportReason").value;
  const details = $("reportDetails").value.trim().slice(0, 500);
  const targetType = selectedTarget.kind === "Konto" ? "account" : "comment";
  const reportType = targetType === "account" ? "Kontomeldung" : "Kommentarmeldung";
  const description = [
    `Ziel-ID: ${selectedTarget.id}`,
    selectedTarget.authorId ? `Konto-ID des Verfassers: ${selectedTarget.authorId}` : `Gemeldetes Konto: ${selectedTarget.name}`,
    `Grund: ${reason}`,
    details ? `Zusätzliche Informationen: ${details}` : "",
  ].filter(Boolean).join("\n");
  const reportId = `${currentUser.uid}_${targetType}_${selectedTarget.id}`;
  try {
    // This exact schema is validated by firestore.rules and read by the existing Admin PC.
    await setDoc(doc(db, "reports", reportId), {
      type: reportType,
      description,
      targetType,
      targetId: selectedTarget.id,
      targetUserId: selectedTarget.authorId || selectedTarget.id,
      targetName: selectedTarget.name,
      targetText: selectedTarget.content || "",
      reason,
      reporterUid: currentUser.uid,
      status: "Neu",
      statusNote: "",
      created: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setStatus("dialogStatus", `Danke! Deine Meldungs-ID lautet ${reportId}. Du kannst den Bearbeitungsstand damit auf der Status-Seite prüfen.`);
    $("statusPageLink").hidden = false;
    button.textContent = "Gesendet ✓";
    button.disabled = true;
  } catch (error) {
    console.error("Meldung konnte nicht gespeichert werden", error);
    const message = error.code === "permission-denied"
      ? "Diese Meldung wurde möglicherweise schon gesendet oder von den Firestore-Regeln abgelehnt."
      : "Senden fehlgeschlagen. Bitte versuche es später erneut.";
    setStatus("dialogStatus", message, true);
    button.disabled = false;
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const accounts = tab.id === "accountTab";
    $("accountPanel").hidden = !accounts;
    $("postPanel").hidden = accounts;
    $("accountTab").classList.toggle("active", accounts);
    $("postTab").classList.toggle("active", !accounts);
    $("accountTab").setAttribute("aria-selected", String(accounts));
    $("postTab").setAttribute("aria-selected", String(!accounts));
  });
});
