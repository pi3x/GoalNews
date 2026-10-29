import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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
const tableBody = document.getElementById("tableBody");
const matchTimers = new Map();

function addHalfTimeAnimation(td) {
  if (!td.querySelector('.half-time-animation')) {
    const overlay = document.createElement("div");
    overlay.className = "half-time-animation";
    overlay.textContent = "Halbzeit!";
    td.appendChild(overlay);
  }
}
function removeHalfTimeAnimation(td) {
  const overlay = td.querySelector('.half-time-animation');
  if (overlay) overlay.remove();
}
function formatTime(ms) {
  const totalSeconds = Math.floor(ms/1000);
  const minutes = Math.floor(totalSeconds/60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2,"0")}`;
}

function startMatchTimer(id, td, startTime, halfTime, over=false) {
  if (matchTimers.has(id)) clearInterval(matchTimers.get(id));
  const timerEl = document.createElement("span");
  timerEl.className = "match-timer";
  td.appendChild(timerEl);

  let paused = halfTime || over;

  const interval = setInterval(() => {
    if (!paused) {
      const elapsed = Date.now() - startTime;
      const minutes = Math.floor(elapsed/60000);
      const seconds = Math.floor((elapsed/1000)%60);
      timerEl.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2,"0")}`;
    } else {
      timerEl.textContent = over ? "🕛 90:00" : "⏸️ Halbzeit";
    }
  }, 1000);

  matchTimers.set(id, interval);
}

function showVARComment(td, comment) {
  let varDiv = td.querySelector('.var-comment');
  if (!varDiv) {
    varDiv = document.createElement("span");
    varDiv.className = "var-comment";
    td.appendChild(varDiv);
  }
  varDiv.textContent = comment;
  varDiv.style.opacity = 1;
  setTimeout(()=>{ varDiv.style.opacity=0; },5000);
}

function showGoalFirework(td) {
  for (let i=0; i<10; i++) {
    const particle = document.createElement("div");
    particle.className="goal-particle";
    td.appendChild(particle);
    particle.style.left=Math.random()*100+"%";
    particle.style.animationDelay=Math.random()*0.3+"s";
    setTimeout(()=>particle.remove(),1000);
  }
}

async function initLiveGames() {
  const colRef = collection(db, "liveGames");
  onSnapshot(colRef, snapshot => {
    tableBody.innerHTML = "";
    if (snapshot.empty) {
      tableBody.innerHTML = "<tr><td colspan='3'>Keine aktuellen Spiele</td></tr>";
      return;
    }

    snapshot.forEach(doc=>{
      const data = doc.data();
      if (doc.id === "next_game") return;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="${data.over?'over-game':''}">${data.home || ""}</td>
        <td class="${data.over?'over-game':''}">${data.away || ""}</td>
        <td class="${data.goal?'goal-animation':''} ${data.over?'over-game':''}">${data.score || ""}</td>
      `;
      tableBody.appendChild(tr);

      const td = tr.querySelector("td:nth-child(3)");

      if (data.halfTime) addHalfTimeAnimation(td); else removeHalfTimeAnimation(td);

      if (data.startTime) startMatchTimer(doc.id, td, data.startTime.toDate().getTime(), data.halfTime, data.over);

      if (data.varComment) showVARComment(td, data.varComment);

      if (data.goal) showGoalFirework(td);
    });
  });
}

initLiveGames();
