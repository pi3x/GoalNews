import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { 
  getFirestore, collection, doc, setDoc, addDoc, updateDoc, deleteDoc, increment, onSnapshot, getDoc 
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// 🔹 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
  authDomain: "goalnewsde-community.firebaseapp.com",
  projectId: "goalnewsde-community",
  storageBucket: "goalnewsde-community.firebasestorage.app",
  messagingSenderId: "134523022055",
  appId: "1:134523022055:web:4f35ed7812d06e4fb55042"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔹 Elemente
const pollButton = document.getElementById("pollButton");
const pollForm = document.getElementById("pollForm");
const optionsContainer = document.getElementById("optionsContainer");
const resultsDiv = document.getElementById("results");
const adminSection = document.getElementById("adminSection");
const newOptionInput = document.getElementById("newOption");
const addOptionBtn = document.getElementById("addOptionBtn");
const adminOptionsDiv = document.getElementById("adminOptions");

// 🔹 Admin IDs
const adminUIDs = ["gaPuzG1ULdUSskKUsciL1g79nh72", "5Oe5YOBOtfOGQsRJ3XUjr3kemnX2"];

// 🔹 Formular ausklappen
pollButton.addEventListener("click", () => {
  pollForm.style.display = pollForm.style.display === "none" ? "block" : "none";
});

// 🔹 Optionen laden und live aktualisieren
const optionsCol = collection(db, "pollOptions");

onSnapshot(optionsCol, snapshot => {
  optionsContainer.innerHTML = "";
  resultsDiv.innerHTML = "";
  adminOptionsDiv.innerHTML = "";

  let totalVotes = 0;
  snapshot.docs.forEach(docSnap => totalVotes += docSnap.data().votes || 0);

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const option = docSnap.id;
    const votes = data.votes || 0;
    const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

    // Abstimmungs-Buttons für Besucher
    const btn = document.createElement("button");
    btn.textContent = option;
    btn.disabled = true;
    btn.title = "Die clientseitige Stimmenzählung konnte nicht sicher vor Manipulation geschützt werden.";
    optionsContainer.appendChild(btn);

    // Ergebnisse
    const bar = document.createElement("div");
    bar.className = "result-bar";
    bar.style.width = percent + "%";
    bar.textContent = `${votes} (${percent}%)`;
    resultsDiv.innerHTML += `<p>${option}</p>`;
    resultsDiv.appendChild(bar);

    // Admin Panel
    if(window.currentUserIsAdmin){
      const delBtn = document.createElement("button");
      delBtn.textContent = "❌ Löschen";
      delBtn.style.marginLeft = "10px";
      delBtn.addEventListener("click", async () => {
        if(confirm(`Option "${option}" wirklich löschen?`)){
          await deleteDoc(doc(db, "pollOptions", option));
        }
      });
      const div = document.createElement("div");
      div.textContent = option;
      div.appendChild(delBtn);
      adminOptionsDiv.appendChild(div);
    }
  });
});

// 🔹 Admin Login Check
onAuthStateChanged(auth, async user => {
  if(user && adminUIDs.includes(user.uid)){
    window.currentUserIsAdmin = true;
    adminSection.style.display = "block";
  } else {
    window.currentUserIsAdmin = false;
    adminSection.style.display = "none";
  }
});

// 🔹 Admin: Neue Option hinzufügen
addOptionBtn.addEventListener("click", async () => {
  const option = newOptionInput.value.trim();
  if(!option) return alert("Bitte Option eingeben!");
  await setDoc(doc(db, "pollOptions", option), { votes: 0 });
  newOptionInput.value = "";
});
