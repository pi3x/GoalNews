import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
    import { getFirestore, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
    const firebaseConfig={apiKey:"AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",authDomain:"goalnewsde-community.firebaseapp.com",projectId:"goalnewsde-community",storageBucket:"goalnewsde-community.firebasestorage.app",messagingSenderId:"134523022055",appId:"1:134523022055:web:4f35ed7812d06e4fb55042"};
    const app=getApps().length?getApp():initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),state=document.getElementById("accountState"),button=document.getElementById("signOutButton"),deleteButton=document.getElementById("deleteAccountButton");
    let deleteAllowed=false;
    onAuthStateChanged(auth,async user=>{
      deleteAllowed=false;deleteButton.disabled=true;
      if(!user){state.textContent="Du bist abgemeldet. Melde dich an, um den Kontostatus zu prüfen.";button.textContent="Zum Login";button.onclick=()=>location.href="anmelden.html";return;}
      try{const profileRef=doc(db,"users",user.uid),requestRef=doc(db,"accountDeletionLogs",user.uid),[profile,request]=await Promise.all([getDoc(profileRef),getDoc(requestRef)]);if((profile.exists()&&profile.data().banned===true)||request.exists()){deleteAllowed=true;deleteButton.disabled=false;state.textContent=request.exists()?`Löschvorgang für ${user.email||"dein Konto"} kann fortgesetzt werden.`:`Angemeldet als ${user.email||"GoalNews-Nutzer"} · Konto gesperrt.`;}else{location.replace("../index.html");}}
      catch(error){console.error("Kontostatus konnte nicht geladen werden",error);state.textContent="Der Kontostatus konnte gerade nicht bestätigt werden. Bitte lade die Seite erneut oder melde dich ab.";}
    });
    deleteButton.addEventListener("click",async()=>{
      const user=auth.currentUser;if(!user||!deleteAllowed)return;
      if(!confirm("Möchtest du dein gesperrtes GoalNews-Konto wirklich löschen? Danach kannst du ein neues Konto erstellen."))return;
      deleteButton.disabled=true;state.textContent="Löschvorgang wird ausgeführt …";
      try{
        const profileRef=doc(db,"users",user.uid),requestRef=doc(db,"accountDeletionLogs",user.uid);
        const [profile,request]=await Promise.all([getDoc(profileRef),getDoc(requestRef)]);
        if(profile.exists()&&profile.data().banned!==true&&!request.exists()){location.replace("../index.html");return;}
        if(!request.exists()){
          await setDoc(requestRef,{uid:user.uid,email:user.email||"",username:profile.exists()?(profile.data().username||""):"",createdAt:serverTimestamp(),status:"self_delete_requested"});
        }
        if(profile.exists())await deleteDoc(profileRef);
        await deleteUser(user);
        location.replace("registrieren.html?accountDeleted=1");
      }catch(error){
        console.error("Selbstlöschung fehlgeschlagen",error);
        const recent=error.code==="auth/requires-recent-login";
        state.textContent=recent?"Bitte melde dich ab und direkt erneut an. Danach kannst du die Löschung fortsetzen.":`Löschung fehlgeschlagen: ${error.message||"Unbekannter Fehler"}`;
        deleteButton.disabled=false;
      }
    });
    button.addEventListener("click",async()=>{button.disabled=true;try{await signOut(auth);location.href="anmelden.html";}catch(error){console.error(error);state.textContent="Abmelden war nicht möglich. Bitte versuche es erneut.";button.disabled=false;}});
