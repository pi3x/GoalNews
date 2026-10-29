import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
    import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

    // 🔐 Firebase Config
    const firebaseConfig = {
      apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
      authDomain: "goalnewsde-community.firebaseapp.com",
      projectId: "goalnewsde-community",
      storageBucket: "goalnewsde-community.firebasestorage.app",
      messagingSenderId: "134523022055",
      appId: "1:134523022055:web:4f35ed7812d06e4fb55042",
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const loginBtn = document.getElementById("loginBtn");
    const errorMsg = document.getElementById("errorMsg");

    // 🧠 NEUE LOGIK
    let failedAttempts = 0;
    let lockedUntil = 0;

    loginBtn.addEventListener("click", async () => {
      const now = Date.now();

      // ⛔ Login gesperrt?
      if (now < lockedUntil) {
        const wait = Math.ceil((lockedUntil - now) / 1000);
        errorMsg.textContent = `Zu viele Versuche. Bitte warte ${wait} Sekunden.`;
        return;
      }

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      errorMsg.textContent = "";

      if (!email || !password) {
        errorMsg.textContent = "Bitte E-Mail und Passwort eingeben.";
        return;
      }

      loginBtn.disabled = true;

      try {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // ✅ ERFOLG → Reset
        failedAttempts = 0;
        lockedUntil = 0;

        const user = userCredential.user;

        const userRef = doc(db, "users", user.uid);
        const [userSnapshot, deletionRequest] = await Promise.all([
          getDoc(userRef),
          getDoc(doc(db, "accountDeletionLogs", user.uid)),
        ]);
        if ((userSnapshot.exists() && userSnapshot.data().banned === true) || (!userSnapshot.exists() && deletionRequest.exists())) {
          window.location.href = "banned%20screen.html";
          return;
        }
        if (!userSnapshot.exists()) {
          errorMsg.textContent = "Für dieses Konto fehlt das GoalNews-Profil. Bitte kontaktiere das Team.";
          loginBtn.disabled = false;
          return;
        }

        // 🕒 letzten Login speichern
        await updateDoc(userRef, {
          last_login: serverTimestamp(),
        });

        window.location.href = "special.html";

      } catch (err) {
        console.error(err);
        failedAttempts++;

        if (failedAttempts >= 5) {
          lockedUntil = Date.now() + 5000; // ⏱️ 5 Sekunden Sperre
          errorMsg.textContent =
            "Zu viele Login‑Versuche erkannt.Dein Zugriff wurde vorübergehend eingeschränkt.Wiederholte Verstöße können zu einer längeren oder dauerhaften Sperre führen.";
        } else {
          errorMsg.textContent =
            `Login fehlgeschlagen (${failedAttempts}/5).`;
        }
      }

      // Button kurz deaktiviert lassen (UX)
      setTimeout(() => {
        loginBtn.disabled = false;
      }, 800);
    });

    // ⏎ Enter-Taste
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") loginBtn.click();
    });
