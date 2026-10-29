import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
    import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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

    const ADMIN_UIDS = ["gaPuzG1ULdUSskKUsciL1g79nh72", "5Oe5YOBOtfOGQsRJ3XUjr3kemnX2"];

    const favTeamInput = document.getElementById("favTeamInput");
    const saveTeamBtn = document.getElementById("saveTeamBtn");
    const saveTeamMsg = document.getElementById("saveTeamMsg");
    const personalMsg = document.getElementById("personalMsg");

    const adminBox = document.getElementById("adminBox");
    const targetUID = document.getElementById("targetUID");
    const adminMsgInput = document.getElementById("adminMsgInput");
    const sendMsgBtn = document.getElementById("sendMsgBtn");
    const msgSent = document.getElementById("msgSent");

    const usernameField = document.getElementById("username");

    // Hauptfunktion
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "anmelden.html";
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      // User anzeigen
      if (userDoc.exists()) {
        usernameField.textContent = userDoc.data().username || "User";

        if (userDoc.data().favTeam) {
          favTeamInput.value = userDoc.data().favTeam;
        }

        if (userDoc.data().message) {
          personalMsg.textContent = userDoc.data().message;
        }
      }

      // Wenn Admin → Admin-Box anzeigen
      if (ADMIN_UIDS.includes(user.uid)) {
        adminBox.style.display = "block";
      }
    });

    // Lieblingsverein speichern
    saveTeamBtn.onclick = async () => {
      const user = auth.currentUser;
      if (!user) return;

      await updateDoc(doc(db, "users", user.uid), {
        favTeam: favTeamInput.value
      });

      saveTeamMsg.style.display = "block";
      setTimeout(() => saveTeamMsg.style.display = "none", 2000);
    };

    // Admin Nachricht senden
    sendMsgBtn.onclick = async () => {
      if (!adminMsgInput.value || !targetUID.value) return;

      await updateDoc(doc(db, "users", targetUID.value), {
        message: adminMsgInput.value
      });

      msgSent.style.display = "block";
      setTimeout(() => msgSent.style.display = "none", 2000);
    };
