import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { usernamePolicyError } from "../username-policy.js";
      import {
        getAuth,
        createUserWithEmailAndPassword,
        sendEmailVerification,
      } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
      import {
        getFirestore,
        setDoc,
        doc,
      } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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

      if (new URLSearchParams(location.search).get("accountDeleted") === "1") {
        document.getElementById("deletedAccountNotice").classList.add("visible");
      }

      const toggle = document.getElementById("togglePwd");
      const pwd = document.getElementById("password");

      toggle.onclick = () => {
        pwd.type = pwd.type === "password" ? "text" : "password";
        toggle.textContent = pwd.type === "password" ? "👁️" : "🙈";
      };

      document.getElementById("registerBtn").onclick = async () => {
        const email = document.getElementById("email").value;
        const password = pwd.value;
        const username = document.getElementById("username").value.trim();
        const allowEmails = document.getElementById("allowEmails").checked;

        if (!email || !password || !username) {
          alert("Bitte fülle alles aus!");
          return;
        }

        const nameError = usernamePolicyError(username);
        if (nameError) {
          alert(nameError);
          return;
        }

        try {
          // Nutzer erstellen
          const userCred = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const user = userCred.user;

          // User-Daten in Firestore speichern
          await setDoc(doc(db, "users", user.uid), {
            username: username,
            email: email,
            createdAt: new Date().toISOString(),
            emailVerified: false,
            allowEmails: allowEmails
          });

          
          await sendEmailVerification(user);
          

          alert(
            "Registrierung erfolgreich!\n" +
            (allowEmails ? "Wir haben dir eine Bestätigungs-E-Mail gesendet!" : "Du hast keine E-Mail-Benachrichtigungen aktiviert.") +
            "\nBitte bestätige deine E-Mail, bevor du dich einloggst."
          );

          window.location.href = "anmelden.html";

        } catch (err) {
          alert("Fehler: " + err.message);
          console.error(err);
        }
      };
