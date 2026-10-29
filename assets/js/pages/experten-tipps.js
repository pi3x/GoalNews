import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:"AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
  authDomain:"goalnewsde-community.firebaseapp.com",
  projectId:"goalnewsde-community",
  storageBucket:"goalnewsde-community.firebasestorage.app",
  messagingSenderId:"134523022055",
  appId:"1:134523022055:web:4f35ed7812d06e4fb55042"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const gamesEl = document.getElementById("games");

function getTipClass(level){
  if(level === 'heiß') return 'tip-hot';
  if(level === 'mittel') return 'tip-medium';
  return 'tip-cool';
}

function buildGameCard(id,data){
  const expert = data.expertPick || "Keine Experten Info";
  const level = data.tipLevel || 'cool'; // möglich: heiß, mittel, cool
  const tipClass = getTipClass(level);

  return `
    <div class="game-card" id="game-${id}">
      <div class="teams">
        <span>${data.home}</span>
        <span>vs</span>
        <span>${data.away}</span>
      </div>
      <div class="expert-box ${tipClass}">Unser <mark> GoalNews </mark> Experten Tipp: <br> ${expert}</div>
    </div>
  `;
}

onSnapshot(collection(db,"liveGames"),(snap)=>{
  gamesEl.innerHTML="";
  snap.forEach(docSnap=>{
    if(docSnap.id === "next_game") return;
    const data = docSnap.data();
    gamesEl.innerHTML += buildGameCard(docSnap.id,data);
  });
});
