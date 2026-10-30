import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
  authDomain: "goalnewsde-community.firebaseapp.com",
  projectId: "goalnewsde-community",
  storageBucket: "goalnewsde-community.firebasestorage.app",
  messagingSenderId: "134523022055",
  appId: "1:134523022055:web:4f35ed7812d06e4fb55042",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const state = document.getElementById("accountState");
const signOutButton = document.getElementById("signOutButton");
const deleteButton = document.getElementById("deleteAccountButton");
const reauthForm = document.getElementById("deleteReauthForm");
const emailInput = document.getElementById("deleteEmail");
const passwordInput = document.getElementById("deletePassword");
const reauthError = document.getElementById("deleteReauthError");

let deleteAllowed = false;
let bannedAccountUid = null;
let bannedAccountEmail = "";
let deletionFlowActive = false;

async function deleteAccount(user) {
  if (!confirm("Möchtest du dein gesperrtes GoalNews-Konto wirklich löschen? Danach kannst du ein neues Konto erstellen.")) {
    return;
  }

  deleteButton.disabled = true;
  state.textContent = "Löschvorgang wird ausgeführt …";

  try {
    const profileRef = doc(db, "users", user.uid);
    const requestRef = doc(db, "accountDeletionLogs", user.uid);
    const [profile, request] = await Promise.all([getDoc(profileRef), getDoc(requestRef)]);

    if (profile.exists() && profile.data().banned !== true && !request.exists()) {
      location.replace("../index.html");
      return;
    }

    if (!request.exists()) {
      await setDoc(requestRef, {
        uid: user.uid,
        email: user.email || "",
        username: profile.exists() ? profile.data().username || "" : "",
        createdAt: serverTimestamp(),
        status: "self_delete_requested",
      });
    }

    if (profile.exists()) await deleteDoc(profileRef);
    await deleteUser(user);
    location.replace("registrieren.html?accountDeleted=1");
  } catch (error) {
    console.error("Selbstlöschung fehlgeschlagen", error);
    const recentLogin = error.code === "auth/requires-recent-login";
    state.textContent = recentLogin
      ? "Bitte melde dich erneut an und bestätige die Löschung noch einmal."
      : `Löschung fehlgeschlagen: ${error.message || "Unbekannter Fehler"}`;
    deleteButton.disabled = false;
  }
}

onAuthStateChanged(auth, async (user) => {
  deleteAllowed = false;
  deleteButton.disabled = true;

  if (!user) {
    if (bannedAccountUid) {
      state.textContent = "Du bist abgemeldet. Dein Konto und deine Daten bleiben bestehen. Für eine freiwillige Löschung melde dich hier erneut an.";
      deleteButton.disabled = false;
      deleteButton.textContent = "Konto freiwillig löschen …";
    } else {
      state.textContent = "Du bist abgemeldet. Melde dich an, um den Kontostatus zu prüfen.";
    }
    signOutButton.textContent = "Zum Login";
    signOutButton.onclick = () => location.href = "anmelden.html";
    return;
  }

  // A wrong account entered in the optional delete re-auth form must not
  // trigger the normal blocked-account redirect while we report the mismatch.
  if (deletionFlowActive && user.uid !== bannedAccountUid) return;

  try {
    const profileRef = doc(db, "users", user.uid);
    const requestRef = doc(db, "accountDeletionLogs", user.uid);
    const [profile, request] = await Promise.all([getDoc(profileRef), getDoc(requestRef)]);
    const isBanned = profile.exists() && profile.data().banned === true;

    if (!isBanned && !request.exists()) {
      location.replace("../index.html");
      return;
    }

    deleteAllowed = true;
    deleteButton.disabled = false;
    if (isBanned) {
      bannedAccountUid = user.uid;
      bannedAccountEmail = user.email || "";
      emailInput.value = bannedAccountEmail;
      state.textContent = `Angemeldet als ${user.email || "GoalNews-Nutzer"} · Konto gesperrt. Du wirst jetzt automatisch abgemeldet.`;
      if (!deletionFlowActive) {
        deleteButton.disabled = true;
        await signOut(auth);
      }
    } else {
      state.textContent = `Löschvorgang für ${user.email || "dein Konto"} kann fortgesetzt werden.`;
    }
  } catch (error) {
    console.error("Kontostatus konnte nicht geladen werden", error);
    state.textContent = "Der Kontostatus konnte gerade nicht bestätigt werden. Bitte lade die Seite erneut oder melde dich ab.";
  }
});

deleteButton.addEventListener("click", async () => {
  if (auth.currentUser && deleteAllowed) {
    await deleteAccount(auth.currentUser);
    return;
  }
  if (!bannedAccountUid) return;
  reauthForm.hidden = false;
  reauthError.textContent = "";
  emailInput.value = bannedAccountEmail;
  passwordInput.focus();
});

reauthForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  reauthError.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) return;

  const submitButton = reauthForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  state.textContent = "Anmeldung wird geprüft …";
  deletionFlowActive = true;
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    passwordInput.value = "";
    if (credential.user.uid !== bannedAccountUid) {
      await signOut(auth);
      throw new Error("Bitte melde dich mit dem gesperrten Konto an.");
    }
    reauthForm.hidden = true;
    deleteAllowed = true;
    await deleteAccount(credential.user);
    if (auth.currentUser) await signOut(auth);
    deletionFlowActive = false;
  } catch (error) {
    console.error("Erneute Anmeldung fehlgeschlagen", error);
    reauthError.textContent = error.code === "auth/invalid-credential"
      ? "E-Mail-Adresse oder Passwort stimmen nicht."
      : error.message || "Anmeldung fehlgeschlagen. Bitte versuche es erneut.";
    state.textContent = "Dein Konto ist weiterhin abgemeldet und wurde nicht gelöscht.";
    if (auth.currentUser) await signOut(auth);
    deletionFlowActive = false;
    submitButton.disabled = false;
  }
});

document.getElementById("cancelDeleteReauth").addEventListener("click", () => {
  reauthForm.reset();
  reauthForm.hidden = true;
  reauthError.textContent = "";
  state.textContent = "Du bist abgemeldet. Dein Konto bleibt bestehen.";
});

signOutButton.addEventListener("click", async () => {
  if (!auth.currentUser) {
    location.href = "anmelden.html";
    return;
  }
  signOutButton.disabled = true;
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Abmelden fehlgeschlagen", error);
    state.textContent = "Abmelden war nicht möglich. Bitte versuche es erneut.";
    signOutButton.disabled = false;
  }
});
