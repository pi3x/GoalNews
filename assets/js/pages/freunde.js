import {fetchJsonCached,currentSeasonStart} from "./data-cache.js";
import {initializeApp} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {getAuth,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc,updateDoc,deleteDoc,collection,getDocs,query,where,orderBy,startAt,endAt,limit,documentId,serverTimestamp} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
const config={apiKey:"AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",authDomain:"goalnewsde-community.firebaseapp.com",projectId:"goalnewsde-community",storageBucket:"goalnewsde-community.firebasestorage.app",messagingSenderId:"134523022055",appId:"1:134523022055:web:4f35ed7812d06e4fb55042"};
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
let uid="",myName="",relations=[],profileMap=new Map(),activityMap=new Map(),shownMatches=[],lastPickAt=0;
const relationLabel={pending:"Offen",accepted:"Angenommen",declined:"Abgelehnt"},choiceLabel={home:"Heimsieg",draw:"Unentschieden",away:"Auswärtssieg"};
function msg(id,text,isError=false){const el=$(id);el.textContent=text;el.classList.toggle("error",isError)}
function empty(id,text){const el=$(id);el.replaceChildren();const box=document.createElement("div");box.className="empty";box.textContent=text;el.appendChild(box)}
function otherUid(r){return r.fromUid===uid?r.toUid:r.fromUid}
function profileName(id){return profileMap.get(id)?.username||"GoalNews-Konto"}
function byDate(value){if(value?.toDate)return value.toDate().toLocaleString("de-DE");if(value instanceof Date)return value.toLocaleString("de-DE");return "Zeit nicht verfügbar"}
function markActive(){ $("app").hidden=false; $("loginBox").hidden=true; }
onAuthStateChanged(auth,async user=>{
  if(!user||user.isAnonymous||!user.email){uid="";$("app").hidden=true;$("loginBox").hidden=false;return}
  uid=user.uid;markActive();
  try{await syncOwnProfile();await loadRelationships()}catch(error){console.error(error);msg("relationStatus","Daten konnten nicht geladen werden. Prüfe Anmeldung und veröffentlichte Firestore-Regeln.",true)}
});
async function syncOwnProfile(){
  const userSnap=await getDoc(doc(db,"users",uid));
  if(!userSnap.exists())throw new Error("User profile missing");
  myName=String(userSnap.data().username||auth.currentUser?.displayName||auth.currentUser?.email?.split("@")[0]||"GoalNews Nutzer").slice(0,40);
  const ref=doc(db,"friendProfiles",uid),profile=await getDoc(ref),lower=myName.toLowerCase();
  if(!profile.exists()||profile.data().username!==myName||profile.data().usernameLower!==lower){
    await setDoc(ref,{uid,username:myName,usernameLower:lower,updatedAt:serverTimestamp()},{merge:true});
  }
  if(profile.exists())activityMap.set(uid,profile.data());
}
async function loadProfileDocs(ids){
  const unique=[...new Set(ids)].filter(Boolean);
  for(let i=0;i<unique.length;i+=30){const group=unique.slice(i,i+30);if(!group.length)continue;const snap=await getDocs(query(collection(db,"friendProfiles"),where(documentId(),"in",group),limit(30)));snap.forEach(d=>profileMap.set(d.id,d.data()))}
}
async function loadRelationships(){
  msg("relationStatus","Lade Freundschaften …");
  const snap=await getDocs(query(collection(db,"friendships"),where("members","array-contains",uid),limit(60)));
  relations=snap.docs.map(d=>({id:d.id,...d.data()}));
  await loadProfileDocs(relations.map(otherUid));
  renderRelationships();
}
function renderEntry(target,relation,kind){
  const row=document.createElement("div");row.className="entry";
  const text=document.createElement("div"),name=document.createElement("strong"),meta=document.createElement("small");
  const peer=otherUid(relation);name.textContent=profileName(peer);meta.textContent=`${relationLabel[relation.status]||relation.status} · ${byDate(relation.updatedAt||relation.createdAt)}`;text.append(name,meta);
  const actions=document.createElement("div");actions.className="entry-actions";
  if(kind==="incoming"){
    const accept=document.createElement("button");accept.textContent="Annehmen";accept.addEventListener("click",()=>changeRelation(relation,"accepted"));
    const decline=document.createElement("button");decline.className="danger";decline.textContent="Ablehnen";decline.addEventListener("click",()=>changeRelation(relation,"declined"));actions.append(accept,decline);
  }else if(kind==="outgoing"){
    const cancel=document.createElement("button");cancel.className="danger";cancel.textContent="Zurückziehen";cancel.addEventListener("click",()=>removeRelation(relation));actions.append(cancel);
  }else{
    const remove=document.createElement("button");remove.className="danger";remove.textContent="Entfernen";remove.addEventListener("click",()=>removeRelation(relation));actions.append(remove);
  }
  row.append(text,actions);target.appendChild(row);
}
function renderRelationships(){
  const incoming=relations.filter(r=>r.status==="pending"&&r.toUid===uid),outgoing=relations.filter(r=>r.status==="pending"&&r.fromUid===uid),friends=relations.filter(r=>r.status==="accepted");
  for(const [id,items,kind,label] of [["incoming",incoming,"incoming","Keine eingehenden Anfragen."],["outgoing",outgoing,"outgoing","Keine offenen gesendeten Anfragen."],["friends",friends,"friend","Noch keine Freunde hinzugefügt."]]){const target=$(id);target.replaceChildren();if(!items.length){empty(id,label);continue}items.forEach(r=>renderEntry(target,r,kind))}
  msg("relationStatus",`${friends.length} Freunde · ${incoming.length} eingehende Anfragen · ${outgoing.length} offene Anfragen`);
}
async function changeRelation(relation,status){try{await updateDoc(doc(db,"friendships",relation.id),{status,updatedAt:serverTimestamp()});await loadRelationships()}catch(error){console.error(error);msg("relationStatus","Aktion fehlgeschlagen. Prüfe die Firestore-Regeln.",true)}}
async function removeRelation(relation){if(!confirm(`Beziehung mit ${profileName(otherUid(relation))} wirklich entfernen?`))return;try{await deleteDoc(doc(db,"friendships",relation.id));await loadRelationships()}catch(error){console.error(error);msg("relationStatus","Entfernen fehlgeschlagen. Prüfe die Firestore-Regeln.",true)}}
$("refreshFriends").addEventListener("click",()=>loadRelationships().catch(error=>{console.error(error);msg("relationStatus","Aktualisieren fehlgeschlagen.",true)}));
$("searchForm").addEventListener("submit",async event=>{
  event.preventDefault();const term=$("searchInput").value.trim().toLowerCase();const results=$("searchResults");results.replaceChildren();
  if(term.length<2){msg("searchStatus","Bitte mindestens zwei Zeichen eingeben.",true);return}
  msg("searchStatus","Suche …");
  try{
    const snap=await getDocs(query(collection(db,"friendProfiles"),orderBy("usernameLower"),startAt(term),endAt(term+"\uf8ff"),limit(10)));
    const found=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.uid!==uid);
    if(!found.length){msg("searchStatus","Keine passenden Konten gefunden. Bestehende Nutzer werden beim Besuch der Startseite automatisch für die Suche freigeschaltet.");return}
    const existingByPeer=new Map(relations.map(r=>[otherUid(r),r]));
    for(const profile of found){const row=document.createElement("div");row.className="entry";const name=document.createElement("strong");name.textContent=profile.username||"GoalNews Nutzer";const action=document.createElement("div");action.className="entry-actions";const rel=existingByPeer.get(profile.uid);const button=document.createElement("button");
      if(rel?.status==="accepted"){button.textContent="Bereits befreundet";button.disabled=true}
      else if(rel?.status==="pending"){button.textContent=rel.toUid===uid?"Anfrage annehmen":"Anfrage gesendet";button.disabled=true}
      else if(rel?.status==="declined"){button.textContent="Alte Anfrage entfernen";button.className="danger";button.addEventListener("click",async()=>{await removeRelation(rel);$("searchForm").requestSubmit()})}
      else{button.textContent="Freundschaft anfragen";button.addEventListener("click",()=>sendRequest(profile))}
      action.append(button);row.append(name,action);results.appendChild(row)
    }
    msg("searchStatus",`${found.length} Treffer (höchstens 10 pro Suche).`)
  }catch(error){console.error(error);msg("searchStatus","Suche fehlgeschlagen. Prüfe Anmeldung und Firestore-Regeln.",true)}
});
async function sendRequest(profile){
  if(relations.filter(r=>r.status==="accepted").length>=30){msg("searchStatus","Für eine übersichtliche Freundesliste sind maximal 30 Freunde vorgesehen.",true);return}
  if(relations.length>=60){msg("searchStatus","Zu viele offene oder bestehende Einträge. Entferne zuerst alte Anfragen.",true);return}
  try{
    const reverse=relations.find(r=>r.fromUid===profile.uid&&r.toUid===uid&&r.status==="pending");
    if(reverse){await changeRelation(reverse,"accepted");msg("searchStatus","Die eingehende Anfrage wurde angenommen.");return}
    const id=`${uid}__${profile.uid}`;
    await setDoc(doc(db,"friendships",id),{members:[uid,profile.uid],fromUid:uid,toUid:profile.uid,status:"pending",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    await loadRelationships();msg("searchStatus",`Freundschaftsanfrage an ${profile.username} gesendet.`);$("searchForm").requestSubmit()
  }catch(error){console.error(error);msg("searchStatus","Anfrage konnte nicht gesendet werden. Prüfe Firestore-Regeln und ob das Konto bereits angefragt wurde.",true)}
}

$("loadMatches").addEventListener("click",loadMatches);
async function loadMatches(){
  const button=$("loadMatches");button.disabled=true;msg("matchStatus","Spielplan wird einmalig geladen …");$("matchList").replaceChildren();
  try{
    const season=currentSeasonStart();
    const [bl1,bl2]=await Promise.all([fetchJsonCached(`https://api.openligadb.de/getmatchdata/bl1/${season}`,{ttlMs:5*60*1000}),fetchJsonCached(`https://api.openligadb.de/getmatchdata/bl2/${season}`,{ttlMs:5*60*1000})]);
    const all=[...bl1.data,...bl2.data],now=Date.now(),finished=m=>(m.matchResults||[]).some(r=>r.resultTypeID===2);
    const live=all.filter(m=>{const t=new Date(m.matchDateTime).getTime();return !finished(m)&&t<=now&&now-t<4*60*60*1000}).map(m=>({...m,liveNow:true}));
    const upcoming=all.filter(m=>{const t=new Date(m.matchDateTime).getTime();return !finished(m)&&t>now&&t-now<=24*60*60*1000}).sort((a,b)=>new Date(a.matchDateTime)-new Date(b.matchDateTime)).map(m=>({...m,liveNow:false}));
    shownMatches=[...live,...upcoming].slice(0,6);
    if(!shownMatches.length){empty("matchList","Aktuell läuft kein Spiel und in den nächsten 24 Stunden ist kein Spiel eingetragen.");msg("matchStatus","Keine passenden Spiele gefunden.");return}
    await loadFriendActivity();renderMatches();msg("matchStatus",`${live.length?`${live.length} laufend`:"Kein Spiel läuft gerade"} · ${upcoming.length} bald startend · Spielplan aus OpenLigaDB.`)
  }catch(error){console.error(error);msg("matchStatus","Spiele konnten nicht geladen werden. Bitte später erneut versuchen.",true)}finally{button.disabled=false}
}
async function loadFriendActivity(){
  const friendIds=relations.filter(r=>r.status==="accepted").map(otherUid).slice(0,29);const ids=[uid,...friendIds];
  for(let i=0;i<ids.length;i+=30){const group=ids.slice(i,i+30);const snap=await getDocs(query(collection(db,"friendProfiles"),where(documentId(),"in",group),limit(30)));snap.forEach(d=>activityMap.set(d.id,d.data()))}
}
function renderMatches(){
  const list=$("matchList");list.replaceChildren();
  for(const match of shownMatches){
    const id=String(match.matchID);const home=match.team1?.teamName||"Heimteam",away=match.team2?.teamName||"Auswärtsteam";const card=document.createElement("article");card.className="match-card";
    const head=document.createElement("div");head.className="match-head";const title=document.createElement("h3");title.textContent=`${home} – ${away}`;const tag=document.createElement("span");tag.className="match-tag";tag.textContent=match.liveNow?"LÄUFT":"STARTET BALD";head.append(title,tag);
    const sub=document.createElement("p");sub.className="match-sub";sub.textContent=`${match.leagueShortcut||"Liga"} · ${new Date(match.matchDateTime).toLocaleString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}`;
    const picks=document.createElement("div");picks.className="pick-row";
    for(const [choice,label] of [["home","Heimsieg"],["draw","Remis"],["away","Auswärtssieg"]]){const button=document.createElement("button");button.type="button";button.textContent=label;button.addEventListener("click",()=>savePick(match,choice));picks.appendChild(button)}
    const activity=document.createElement("div");activity.className="friend-picks";const relevant=[...activityMap.entries()].filter(([id,p])=>id===uid||relations.some(r=>r.status==="accepted"&&otherUid(r)===id)).map(([profileId,p])=>({profileId,...p})).filter(p=>p.activeMatchId===id);
    if(!relevant.length)activity.textContent="Noch niemand aus deinem Freundeskreis hat für dieses Spiel getippt.";
    else activity.textContent=relevant.map(p=>`${p.profileId===uid?"Du":profileName(p.profileId)}: ${choiceLabel[p.activeChoice]||"Tipp"}`).join(" · ");
    card.append(head,sub,picks,activity);list.appendChild(card)
  }
}
async function savePick(match,choice){
  const now=Date.now();if(now-lastPickAt<15000){msg("matchStatus","Bitte warte kurz, bevor du deinen Tipp erneut änderst.",true);return}
  const label=`${match.team1?.teamName||"Heimteam"} – ${match.team2?.teamName||"Auswärtsteam"}`.slice(0,120);
  try{await updateDoc(doc(db,"friendProfiles",uid),{activeMatchId:String(match.matchID),activeMatchLabel:label,activeChoice:choice,activityUpdatedAt:serverTimestamp()});lastPickAt=Date.now();const mine=activityMap.get(uid)||{uid,username:myName};activityMap.set(uid,{...mine,activeMatchId:String(match.matchID),activeMatchLabel:label,activeChoice:choice,activityUpdatedAt:new Date()});renderMatches();msg("matchStatus","Dein aktueller Spieltipp ist für deine GoalNews-Freunde sichtbar.")}
  catch(error){console.error(error);msg("matchStatus","Tipp konnte nicht gespeichert werden. Prüfe, ob die Firestore-Regeln veröffentlicht wurden.",true)}
}
