import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
    import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
    const config={apiKey:"AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",authDomain:"goalnewsde-community.firebaseapp.com",projectId:"goalnewsde-community",storageBucket:"goalnewsde-community.firebasestorage.app",messagingSenderId:"134523022055",appId:"1:134523022055:web:4f35ed7812d06e4fb55042"};
    const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app);
    const forms=document.getElementById("forms"),loginBox=document.getElementById("loginBox");
    onAuthStateChanged(auth,user=>{const member=!!user&&!user.isAnonymous&&!!user.email;forms.hidden=!member;loginBox.hidden=member;});
    const bugTab=document.getElementById("bugTab"),ideaTab=document.getElementById("ideaTab"),bugForm=document.getElementById("bugForm"),ideaForm=document.getElementById("ideaForm");
    function selectTab(idea){bugForm.hidden=idea;ideaForm.hidden=!idea;bugTab.classList.toggle("active",!idea);ideaTab.classList.toggle("active",idea);bugTab.setAttribute("aria-selected",String(!idea));ideaTab.setAttribute("aria-selected",String(idea));}
    bugTab.addEventListener("click",()=>selectTab(false));ideaTab.addEventListener("click",()=>selectTab(true));
    async function submit(button,status,collectionName,data,reset){
      if(!auth.currentUser||auth.currentUser.isAnonymous){status.textContent="Bitte melde dich zuerst an.";status.className="status error";return;}
      button.disabled=true;status.textContent="Wird gesendet …";status.className="status";
      try{await addDoc(collection(db,collectionName),{...data,created:serverTimestamp()});reset();status.textContent="Danke! Deine Meldung wurde an das GoalNews-Team gesendet.";status.className="status success";}
      catch(error){console.error("Beta-Feedback konnte nicht gespeichert werden",error);status.textContent="Senden fehlgeschlagen. Bitte prüfe deine Anmeldung oder versuche es später erneut.";status.className="status error";}
      finally{button.disabled=false;}
    }
    document.getElementById("sendBug").addEventListener("click",()=>{const description=document.getElementById("bugDescription").value.trim();if(!description){document.getElementById("bugStatus").textContent="Bitte beschreibe den Fehler.";document.getElementById("bugStatus").className="status error";return;}submit(document.getElementById("sendBug"),document.getElementById("bugStatus"),"reports",{type:document.getElementById("bugType").value,description},()=>document.getElementById("bugDescription").value="");});
    document.getElementById("sendIdea").addEventListener("click",()=>{const title=document.getElementById("ideaTitle").value.trim(),description=document.getElementById("ideaDescription").value.trim();if(!title||!description){document.getElementById("ideaStatus").textContent="Bitte fülle Titel und Beschreibung aus.";document.getElementById("ideaStatus").className="status error";return;}submit(document.getElementById("sendIdea"),document.getElementById("ideaStatus"),"ideas",{title,description},()=>{document.getElementById("ideaTitle").value="";document.getElementById("ideaDescription").value="";});});
