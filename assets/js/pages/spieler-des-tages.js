import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

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

// 🔹 Admin UIDs
const adminUIDs = ["gaPuzG1ULdUSskKUsciL1g79nh72", "5Oe5YOBOtfOGQsRJ3XUjr3kemnX2"];

// 🔹 Spieler Liste
let players = [
    { name: "Jamal Musiala", img: "../assets/images/chatgpt-image-5-nov-2025-20-45-50.webp", stats: "", score: 0 },
    { name: "Harry Kane", img: "../assets/images/chatgpt-image-5-nov-2025-20-45-50.webp", stats: "", score: 0 },
    { name: "Joshua Kimmich", img: "../assets/images/chatgpt-image-5-nov-2025-20-45-50.webp", stats: "", score: 0 }
];

// 🔹 Firestore Dokument
const pollDocRef = doc(db, "polls", "player_of_the_week");

// 🔹 Auth anonym & Admin Check
onAuthStateChanged(auth, user => {
    if(user && adminUIDs.includes(user.uid)){
        document.getElementById("adminPanel").style.display = "block";
    }
});

// 🔹 Init Firestore
(async () => {
    const docSnap = await getDoc(pollDocRef);
    if(!docSnap.exists()){
        const optionsObj = {};
        players.forEach(p => optionsObj[p.name] = 0);
        await setDoc(pollDocRef, { options: optionsObj, scores: {} });
    }
})();

// 🔹 Admin: Spieler hinzufügen
document.getElementById("addPlayerBtn").onclick = async () => {
    const name = document.getElementById("newPlayerName").value.trim();
    const img = document.getElementById("newPlayerImg").value.trim();
    const stats = document.getElementById("newPlayerStats").value.trim();
    if(!name) return alert("Name eingeben!");
    players.push({ name, img, stats, score: 80 });
    await updateDoc(pollDocRef, { [`options.${name}`]: 0 });
    document.getElementById("newPlayerName").value = "";
    document.getElementById("newPlayerImg").value = "";
    document.getElementById("newPlayerStats").value = "";
};

// 🔹 Vote Buttons
const voteButtonsDiv = document.getElementById("voteButtons");
function renderVoteButtons(){
    voteButtonsDiv.innerHTML = "";
    players.forEach(player => {
        const btn = document.createElement("button");
        btn.className = "btn-vote";
        btn.textContent = player.name;
        btn.disabled = true;
        btn.title = "Die clientseitige Stimmenzählung ist pausiert.";
        voteButtonsDiv.appendChild(btn);
    });
}
renderVoteButtons();

// 🔹 Spieler anzeigen & live update
const container = document.getElementById("playerContainer");
onSnapshot(pollDocRef, docSnap => {
    const data = docSnap.data();
    if(!data.scores) data.scores = {};
    let maxVotes = -1, topPlayerName = "";
    for(const [name,votes] of Object.entries(data.options)){
        if(votes > maxVotes){ maxVotes = votes; topPlayerName = name; }
    }
    container.innerHTML = "";
    players.forEach(player => {
        const votes = data.options[player.name] || 0;
        const score = (data.scores[player.name] || player.score) + votes;
        const card = document.createElement("div");
        card.className = "player-card";
        const rankDiv = document.createElement("div");
        rankDiv.className = "rank";
        rankDiv.textContent = player.name === topPlayerName ? "#1" : "";
        card.appendChild(rankDiv);
        const img = document.createElement("img"); img.src = player.img; img.className = "player-img"; card.appendChild(img);
        const nameH2 = document.createElement("h2"); nameH2.textContent = player.name; card.appendChild(nameH2);
        const statsDiv = document.createElement("div"); statsDiv.className="stats"; statsDiv.textContent = player.stats; card.appendChild(statsDiv);
        const scoreDiv = document.createElement("div"); scoreDiv.className="score"; scoreDiv.textContent = `Score: ${score} Punkte | Votes: ${votes}`; card.appendChild(scoreDiv);
        container.appendChild(card);
    });
});
