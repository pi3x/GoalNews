import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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

async function saveHelpIdea(type, title, description) {
    await addDoc(collection(db, "ideas"), {
        type,
        title,
        description,
        source: "Helft uns",
        created: serverTimestamp()
    });
}

function requireMember() {
    if (auth.currentUser && !auth.currentUser.isAnonymous) return true;
    alert("Bitte melde dich an, bevor du etwas einsendest.");
    window.location.href = "anmelden.html";
    return false;
}

// Formular Toggle
document.querySelectorAll('.help-card').forEach(card=>{
    card.addEventListener('click',()=>{
        const formId = card.dataset.form;
        document.querySelectorAll('.reportForm').forEach(f=>f.style.display='none');
        document.getElementById(formId).style.display='block';
    });
});

// Funktionen zum Absenden
document.getElementById('sendBug').addEventListener('click', async()=>{
    if(!requireMember()) return;
    const type = document.getElementById('errorType').value;
    const desc = document.getElementById('errorDescription').value.trim();
    if(!desc){alert("Bitte eine Beschreibung eingeben!"); return;}
    await Promise.all([
        addDoc(collection(db,"reports"),{type,description:desc,created:serverTimestamp()}),
        saveHelpIdea("Fehlerbericht", type, desc)
    ]);
    alert("✅ Vielen Dank! Dein Bericht wurde anonym gesendet.");
    document.getElementById('errorDescription').value='';
    document.getElementById('bugForm').style.display='none';
});

document.getElementById('sendIdea').addEventListener('click', async()=>{
    if(!requireMember()) return;
    const title = document.getElementById('ideaTitle').value.trim();
    const desc = document.getElementById('ideaDescription').value.trim();
    if(!title || !desc){alert("Bitte Titel und Beschreibung eingeben!"); return;}
    await saveHelpIdea("Idee", title, desc);
    alert("✅ Deine Idee wurde anonym gesendet!");
    document.getElementById('ideaTitle').value='';
    document.getElementById('ideaDescription').value='';
    document.getElementById('ideaForm').style.display='none';
});

document.getElementById('sendFeedback').addEventListener('click', async()=>{
    if(!requireMember()) return;
    const feedback = document.getElementById('feedbackText').value.trim();
    if(!feedback){alert("Bitte Feedback eingeben!"); return;}
    await Promise.all([
        addDoc(collection(db,"feedback"),{feedback,created:serverTimestamp()}),
        saveHelpIdea("Feedback", "Allgemeines Feedback", feedback)
    ]);
    alert("✅ Danke für dein Feedback!");
    document.getElementById('feedbackText').value='';
    document.getElementById('feedbackForm').style.display='none';
});

document.getElementById('sendFeature').addEventListener('click', async()=>{
    if(!requireMember()) return;
    const title = document.getElementById('featureTitle').value.trim();
    const desc = document.getElementById('featureDescription').value.trim();
    if(!title||!desc){alert("Bitte Titel und Beschreibung eingeben!"); return;}
    await Promise.all([
        addDoc(collection(db,"features"),{title,description:desc,created:serverTimestamp()}),
        saveHelpIdea("Feature-Wunsch", title, desc)
    ]);
    alert("✅ Dein Feature Wunsch wurde anonym gesendet!");
    document.getElementById('featureTitle').value='';
    document.getElementById('featureDescription').value='';
    document.getElementById('featureForm').style.display='none';
});
