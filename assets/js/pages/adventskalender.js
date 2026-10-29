import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
    authDomain: "goalnewsde-community.firebaseapp.com",
    projectId: "goalnewsde-community",
    storageBucket: "goalnewsde-community.firebasestorage.app",
    messagingSenderId: "134523022055",
    appId: "1:134523022055:web:4f35ed7812d06e4fb55042"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const calendarEl = document.getElementById("calendar");
const coinDisplay = document.getElementById("coinDisplay");
const result = document.getElementById("result");

function createSnowflake() {
    const s = document.createElement("div");
    s.className="snowflake";
    s.textContent="❄";
    s.style.left=Math.random()*window.innerWidth+"px";
    s.style.fontSize=(12+Math.random()*24)+"px";
    s.style.animationDuration=(5+Math.random()*10)+"s";
    document.body.appendChild(s);
    setTimeout(()=>s.remove(),15000);
}
setInterval(createSnowflake,200);
const COIN_REWARDS_PAUSED = true;

onAuthStateChanged(auth, async user=>{
    if(!user){ 
        result.textContent="🔒 Du musst für diese Funktion angemeldet sein!";
        return;
    }

    const userRef = doc(db,"users",user.uid);
    let snap = await getDoc(userRef);
    let data = snap.data() || { coins:0, openedDays:{} };
    coinDisplay.textContent=`💰 Coins: ${data.coins}`;
    result.textContent = "Die Türchen-Belohnungen sind derzeit deaktiviert. Dein gespeicherter Kontostand bleibt erhalten.";

    const todayDate = new Date();
    const month = todayDate.getMonth() + 1; // 1-12
    const dayOfMonth = todayDate.getDate();

    for(let i=1;i<=24;i++){
        const dayDiv=document.createElement("div");
        dayDiv.className="day";
        dayDiv.classList.add("paused");
        dayDiv.setAttribute("aria-disabled", "true");
        dayDiv.textContent=i;

        const tooltip = document.createElement("div");
        tooltip.className="tooltip";
        tooltip.textContent="🎁 Öffnen für Überraschung!";
        dayDiv.appendChild(tooltip);
        calendarEl.appendChild(dayDiv);

        // Bereits geöffnet?
        if(data.openedDays && data.openedDays[i]){
            dayDiv.classList.add("opened");
            tooltip.textContent="✅ Schon geöffnet";
        }

        dayDiv.onclick = async () => {
            if (COIN_REWARDS_PAUSED) {
                result.textContent = "Die Kalenderbelohnungen sind aus Sicherheitsgründen vorübergehend pausiert.";
                return;
            }
            const todayStr = todayDate.toISOString().split("T")[0];
            if(!data.openedDays) data.openedDays = {};

            // Türchen noch nicht verfügbar?
            if(month < 12 || (month === 12 && dayOfMonth < i)){
                result.textContent = `❌ Türchen ${i} ist noch nicht verfügbar!`;
                return;
            }

            // Tagesprüfung: Türchen heute schon geöffnet?
            if(data.openedDays[i] === todayStr){
                result.textContent = "❌ Du hast dieses Türchen heute schon geöffnet!";
                return;
            }

            dayDiv.style.pointerEvents="none";
            dayDiv.classList.add("spin");

            setTimeout(async ()=>{
                let reward;
                if(i===24){
                    reward = "🎅 Breaking News Leiste Freigeschaltet! Merry Cristmas 🎅";
                    await setDoc(userRef, { breakingNews: true }, { merge: true });
                } else {
                    const surprises = [() => Math.floor(Math.random()*151)]; // Coins
                    const choice = surprises[Math.floor(Math.random()*surprises.length)];
                    reward = choice();
                }

                // Coins aktualisieren
                if(typeof reward === "number"){
                    data.coins = (data.coins || 0) + reward;
                    coinDisplay.textContent=`💰 Coins: ${data.coins}`;
                }

                data.openedDays[i] = todayStr;
                await setDoc(userRef, data, { merge: true });

                result.textContent = `🎉 COINS: ${reward}`;
                dayDiv.classList.remove("spin");
                dayDiv.classList.add("opened");
                tooltip.textContent="✅ Schon geöffnet";

            },1000);
        }
    }
});
