import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, addDoc, collection, onSnapshot, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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
const form = document.getElementById("contactForm");
const sendButton = document.getElementById("sendMessage");
const sendStatus = document.getElementById("sendStatus");
const messagesEl = document.getElementById("messages");
const conversationStatus = document.getElementById("conversationStatus");
let currentUser = null;

function formatDate(timestamp) {
  if (!timestamp?.toDate) return "Gerade eben";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp.toDate());
}

function textElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text || "";
  return element;
}

function renderMessages(snapshot) {
  const records = snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

  messagesEl.replaceChildren();
  if (!records.length) {
    messagesEl.appendChild(textElement("p", "state", "Du hast dem Admin-Team noch keine Nachricht geschrieben."));
    conversationStatus.textContent = "Noch keine Nachrichten";
    return;
  }

  conversationStatus.textContent = `${records.length} Nachricht${records.length === 1 ? "" : "en"}`;
  for (const record of records) {
    const card = document.createElement("article");
    card.className = "message-card";
    const meta = document.createElement("div");
    meta.className = "message-meta";
    meta.append(
      textElement("span", "message-name", record.name || "GoalNews-Mitglied"),
      textElement("time", "", formatDate(record.createdAt)),
    );
    card.append(meta, textElement("p", "message-body", record.message));
    if (record.reply) {
      const reply = document.createElement("div");
      reply.className = "admin-reply";
      const replyMeta = document.createElement("div");
      replyMeta.className = "message-meta";
      replyMeta.append(
        textElement("span", "message-name", "Server Admin"),
        textElement("time", "", formatDate(record.replyAt)),
      );
      reply.append(replyMeta, textElement("p", "message-body", record.reply));
      card.appendChild(reply);
    } else {
      card.appendChild(textElement("p", "privacy-note", "Noch keine Antwort – schau später wieder vorbei."));
    }
    messagesEl.appendChild(card);
  }
}

function watchMessages(user) {
  const ownMessages = query(
    collection(db, "adminContact"),
    where("ownerUid", "==", user.uid),
  );
  onSnapshot(
    ownMessages,
    renderMessages,
    (error) => {
      console.error("Kontaktverlauf konnte nicht geladen werden:", error);
      conversationStatus.textContent = "Laden fehlgeschlagen";
      messagesEl.replaceChildren(textElement("p", "state error", "Deine Nachrichten konnten nicht geladen werden."));
    },
  );
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    watchMessages(user);
    return;
  }
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error("Anonyme Anmeldung fehlgeschlagen:", error);
    conversationStatus.textContent = "Anmeldung nicht verfügbar";
    sendStatus.textContent = "Der Kontakt ist gerade nicht verfügbar. Bitte versuche es später erneut.";
    sendStatus.className = "status error";
    sendButton.disabled = true;
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("senderName").value.trim();
  const message = document.getElementById("messageText").value.trim();
  if (!currentUser || !name || !message) return;

  sendButton.disabled = true;
  sendStatus.textContent = "Wird gesendet …";
  sendStatus.className = "status";
  try {
    await addDoc(collection(db, "adminContact"), {
      ownerUid: currentUser.uid,
      name: name.slice(0, 60),
      message: message.slice(0, 3000),
      createdAt: serverTimestamp(),
      reply: "",
      replyBy: "",
      replyAt: null,
    });
    document.getElementById("messageText").value = "";
    sendStatus.textContent = "Nachricht gesendet. Deine Antwort erscheint hier.";
  } catch (error) {
    console.error("Nachricht konnte nicht gesendet werden:", error);
    sendStatus.textContent = "Senden fehlgeschlagen. Bitte versuche es später erneut.";
    sendStatus.className = "status error";
  } finally {
    sendButton.disabled = false;
  }
});
