import { fetchJsonCached, currentSeasonStart } from "../data-cache.js";
import { appendAdminBadge } from "../admin-badge.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, onSnapshot, collection, getDocs, arrayUnion } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js";

// Firebase Config
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
const storage = getStorage(app);
setPersistence(auth, browserLocalPersistence);

const ADMIN_UIDS = ["gaPuzG1ULdUSskKUsciL1g79nh72", "5Oe5YOBOtfOGQsRJ3XUjr3kemnX2"];

// UI Elements
const usernameEl = document.getElementById("username");
const avatarEl = document.getElementById("avatar");
const coinBadge = document.getElementById("coinsDisplay");
const coinsText = document.getElementById("coinsText");
const coinBadgeSmall = document.getElementById("coinBadge");
const userIdShortEl = document.getElementById("userIdShort");
const favTeamInput = document.getElementById("favTeamInput");
const favTeamLabel = document.getElementById("favTeamLabel");
const saveTeamBtn = document.getElementById("saveTeamBtn");
const personalMsg = document.getElementById("personalMsg");
const buyBreakingBtn = document.getElementById("buyBreakingBtn");
const breakingStatus = document.getElementById("breakingStatus");
const openDailySpin = document.getElementById("openDailySpin");
const usersList = document.getElementById("usersList");
const adminCard = document.getElementById("adminCard");
const adminMsgInput = document.getElementById("adminMsgInput");
const sendAdminMsgBtn = document.getElementById("sendAdminMsgBtn");
const changeNameInput = document.getElementById("changeNameInput");
const changeNameBtn = document.getElementById("changeNameBtn");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const avatarInput = document.getElementById("avatarInput");
const badgesContainer = document.getElementById("badgesContainer");
const userLevelEl = document.getElementById("userLevel");
const userXPEl = document.getElementById("userXP");
const levelFillEl = document.getElementById("levelFill");
const xpToNextEl = document.getElementById("xpToNext");
const logoutBtn = document.getElementById("logoutBtn");
const shopStatus = document.getElementById("shopStatus");
const reminderStatus = document.getElementById("reminderStatus");
const favMatchNotice = document.getElementById("favMatchNotice");
const openBreakingBtn = document.getElementById("openBreakingBtn");
const shopButtons = document.querySelectorAll(".shop-buy");

let currentUserUID = null;
let currentUserData = null;

// Auth Listener
onAuthStateChanged(auth, async user=>{
  if(user){
    currentUserUID = user.uid;
    const userDoc = await getDoc(doc(db,"users",user.uid));
    currentUserData = userDoc.exists() ? userDoc.data() : {};
    renderUser();
    if(ADMIN_UIDS.includes(user.uid)){
      adminCard.style.display="block";
      loadUsers();
    }
    loadMessages();
    checkFavoriteTeamFixtures();
  }else{
    location.href="anmelden.html";
  }
});

// Render User Profile
function renderUser(){
  usernameEl.textContent = currentUserData.username || "User";
  userIdShortEl.textContent = currentUserUID?.slice(0,6) || "—";
  coinBadge.textContent = currentUserData.coins || 0;
  coinsText.textContent = (currentUserData.coins||0) + " Coins";
  coinBadgeSmall.textContent = currentUserData.coins||0;
  favTeamLabel.textContent = currentUserData.favTeam||"—";
  if (favTeamInput && document.activeElement !== favTeamInput) favTeamInput.value = currentUserData.favTeam || "";
  userLevelEl.textContent = currentUserData.level||1;
  userXPEl.textContent = currentUserData.xp||0;
  levelFillEl.style.width = ((currentUserData.xp||0)/100*100) + "%";
  xpToNextEl.textContent = 100 - (currentUserData.xp||0);
  avatarEl.replaceChildren();
  let safeAvatarUrl = "";
  try {
    const parsedAvatarUrl = new URL(currentUserData.avatarUrl || "");
    if (parsedAvatarUrl.protocol === "https:") safeAvatarUrl = parsedAvatarUrl.href;
  } catch { /* Kein gültiger Profilbild-Link. */ }
  if(safeAvatarUrl){
    const avatarImage = document.createElement("img");
    avatarImage.src = safeAvatarUrl;
    avatarImage.alt = "Profilbild";
    avatarEl.appendChild(avatarImage);
  }else{
    avatarEl.textContent = (currentUserData.username||"U")[0].toUpperCase();
  }
  avatarEl.style.border = currentUserData.goldFrame ? "3px solid #e0ad22" : currentUserData.neonFrame ? "3px solid #20c96b" : "";
  avatarEl.style.boxShadow = currentUserData.neonFrame ? "0 0 18px rgba(29,185,84,.75)" : "";
  const title = currentUserData.vipTitle ? "GoalNews VIP" : "Willkommen zurück!";
  document.getElementById("subtitle").textContent = title;
  if (currentUserData.breakingNews) breakingStatus.innerHTML = "Status: <b>Freigeschaltet</b>";
  shopButtons.forEach(button => {
    const owned = button.dataset.item === "breakingNews" ? !!currentUserData.breakingNews : !!currentUserData[button.dataset.item];
    button.disabled = true;
    button.textContent = owned ? "Bereits freigeschaltet" : "Käufe pausiert";
  });
}

// Logout
logoutBtn.addEventListener("click",()=>signOut(auth));

// Save Favorite Team
saveTeamBtn.addEventListener("click",async ()=>{
  const team = favTeamInput.value.trim();
  if (!team) { reminderStatus.textContent = "Bitte gib zuerst deinen Lieblingsverein ein."; return; }
  await updateDoc(doc(db,"users",currentUserUID),{favTeam:team});
  currentUserData.favTeam = team;
  renderUser();
  checkFavoriteTeamFixtures();
});

openDailySpin.addEventListener("click", () => { window.location.href = "taeglicher-spin.html"; });
document.getElementById("spinBtn").addEventListener("click", () => { shopStatus.textContent = "Der Daily Spin ist aus Sicherheitsgründen pausiert."; });
document.getElementById("homeBtn").addEventListener("click", () => { window.location.href = "../index.html"; });
document.getElementById("liveBtn").addEventListener("click", () => { window.location.href = "../index.html#liveGamesSection"; });
document.getElementById("profileBtn").addEventListener("click", () => { document.getElementById("changeNameInput").focus(); });
document.getElementById("notifBtn").addEventListener("click", () => { document.querySelector(".notification-card").scrollIntoView({behavior:"smooth",block:"center"}); });
openBreakingBtn.addEventListener("click", () => { window.location.href = "../index.html#breakingNews"; });
buyBreakingBtn.addEventListener("click", () => { document.querySelector('[data-item="breakingNews"]').scrollIntoView({behavior:"smooth",block:"center"}); });

// In-App-Spielhinweis aus dem vorhandenen Bundesliga-Spielplan.
function normalizedTeam(name) { return String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("de").replace(/[^a-z0-9]/g, ""); }
function formatMatchDate(value) { return new Date(value).toLocaleString("de-DE", { weekday:"short", day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" }); }
async function checkFavoriteTeamFixtures() {
  const team = currentUserData?.favTeam?.trim();
  if (!team) {
    reminderStatus.textContent = "Speichere deinen Lieblingsverein, damit wir passende Spiele anzeigen können.";
    favMatchNotice.textContent = "";
    return;
  }
  try {
    const season = currentSeasonStart();
    const [firstLeague, secondLeague] = await Promise.all(["bl1", "bl2"].map(league =>
      fetchJsonCached(`https://api.openligadb.de/getmatchdata/${league}/${season}`, { ttlMs: 60 * 1000 }),
    ));
    const matches = [...firstLeague.data, ...secondLeague.data];
    const now = Date.now();
    const upcoming = matches.filter(match => {
      const start = new Date(match.matchDateTime).getTime();
      const names = `${match.team1?.teamName || ""} ${match.team2?.teamName || ""}`;
      return start > now && start <= now + 24 * 60 * 60 * 1000 && normalizedTeam(names).includes(normalizedTeam(team));
    });
    if (!upcoming.length) {
      reminderStatus.textContent = `Für ${team} steht in den nächsten 24 Stunden kein Bundesliga-Spiel an.`;
      favMatchNotice.textContent = "";
      return;
    }
    const match = upcoming[0];
    reminderStatus.textContent = `Dein Lieblingsverein ${team} spielt bald:`;
    favMatchNotice.textContent = `${match.team1.teamName} – ${match.team2.teamName} · ${formatMatchDate(match.matchDateTime)}`;
  } catch (error) {
    console.error("Spiel-Erinnerung konnte nicht aktualisiert werden:", error);
    reminderStatus.textContent = "Der Spielplan ist momentan nicht erreichbar. Bitte später erneut versuchen.";
    favMatchNotice.textContent = "";
  }
}
window.setInterval(checkFavoriteTeamFixtures, 5 * 60 * 1000);

// Load Admin Users
async function loadUsers(){
  const usersSnapshot = await getDocs(collection(db,"users"));
  usersList.innerHTML = "";
  usersSnapshot.forEach(docSnap=>{
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className="user-card";
    div.textContent = data.username || "User";
    appendAdminBadge(div, docSnap.id);
    div.dataset.uid = docSnap.id;
    div.addEventListener("click",()=>{ div.classList.toggle("selected"); });
    usersList.appendChild(div);
  });
}

// Send Admin Message
sendAdminMsgBtn.addEventListener("click", async ()=>{
  const msg = adminMsgInput.value.trim();
  if(!msg) return;
  const selectedUsers = Array.from(usersList.querySelectorAll(".selected")).map(el=>el.dataset.uid);
  for(const uid of selectedUsers){
    await updateDoc(doc(db,"users",uid), { messages: arrayUnion({ text: msg, from:"admin", timestamp: Date.now() }) });
  }
  adminMsgInput.value="";
});

// Change Username
changeNameBtn.addEventListener("click", async ()=>{
  const newName = changeNameInput.value.trim();
  if(newName){
    await updateDoc(doc(db,"users",currentUserUID),{username:newName});
    currentUserData.username = newName;
    renderUser();
    changeNameInput.value="";
  }
});

// Save Profile (Avatar)
saveProfileBtn.addEventListener("click", async ()=>{
  if(avatarInput.files.length){
    const file = avatarInput.files[0];
    if(!["image/png","image/jpeg"].includes(file.type)){
      alert("Nur PNG/JPG erlaubt!");
      return;
    }
    const storageRef = ref(storage, `avatars/${currentUserUID}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(db,"users",currentUserUID),{avatarUrl:url});
    currentUserData.avatarUrl = url;
    renderUser();
  }
});

// Load Messages
function loadMessages(){
  const userRef = doc(db,"users",currentUserUID);
  onSnapshot(userRef,msgSnap=>{
    const data = msgSnap.data();
    personalMsg.innerHTML="";
    if(data?.messages?.length){
      data.messages.forEach(m=>{
        const div = document.createElement("div");
        div.className = "msg " + (m.from==="admin"?"admin":"");
        div.textContent = m.text;
        personalMsg.appendChild(div);
      });
    }else{
      personalMsg.textContent="Noch keine Nachricht erhalten.";
    }
  });
}
