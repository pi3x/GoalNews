import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
    import { 
      getFirestore, collection, getDocs, doc, getDoc, query, orderBy, updateDoc, serverTimestamp
    } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

    // 🔹 Firebase Config
    const firebaseConfig = {
      apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
      authDomain: "goalnewsde-community.firebaseapp.com",
      projectId: "goalnewsde-community",
      storageBucket: "goalnewsde-community.appspot.com",
      messagingSenderId: "134523022055",
      appId: "1:134523022055:web:4f35ed7812d06e4fb55042"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const dashboard = document.getElementById("dashboard");

    // 🔹 Collections, die angezeigt werden sollen
    const collectionsToShow = ["comments", "visits", "users", "polls", "reports", "ideas", "feedback", "features", "tipps"];

    async function loadContactInbox() {
      const container = document.createElement("section");
      container.className = "collection-container contact-inbox";
      const title = document.createElement("h2");
      title.textContent = "KONTAKTANFRAGEN";
      container.appendChild(title);

      try {
        const inboxQuery = query(collection(db, "adminContact"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(inboxQuery);
        if (snapshot.empty) {
          const empty = document.createElement("p");
          empty.className = "inbox-empty";
          empty.textContent = "Noch keine Kontaktanfragen.";
          container.appendChild(empty);
        }

        for (const messageSnap of snapshot.docs) {
          const data = messageSnap.data();
          const card = document.createElement("article");
          card.className = "admin-contact-card";
          const meta = document.createElement("div");
          meta.className = "admin-contact-meta";
          const sender = document.createElement("strong");
          sender.textContent = data.name || "Ohne Namen";
          const sentAt = document.createElement("span");
          sentAt.textContent = data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleString("de-DE")
            : "Gerade eben";
          meta.append(sender, sentAt);
          const message = document.createElement("p");
          message.className = "admin-contact-message";
          message.textContent = data.message || "";
          card.append(meta, message);

          if (data.reply) {
            const reply = document.createElement("p");
            reply.className = "admin-contact-reply";
            reply.textContent = `Server Admin: ${data.reply}`;
            card.appendChild(reply);
          }

          const replyInput = document.createElement("textarea");
          replyInput.className = "admin-contact-reply-input";
          replyInput.maxLength = 3000;
          replyInput.placeholder = data.reply ? "Antwort bearbeiten …" : "Antwort schreiben …";
          replyInput.value = data.reply || "";
          const replyButton = document.createElement("button");
          replyButton.className = "admin-contact-reply-button";
          replyButton.type = "button";
          replyButton.textContent = data.reply ? "Antwort aktualisieren" : "Als Server Admin antworten";
          replyButton.addEventListener("click", async () => {
            const replyText = replyInput.value.trim();
            if (!replyText) return;
            replyButton.disabled = true;
            try {
              await updateDoc(doc(db, "adminContact", messageSnap.id), {
                reply: replyText,
                replyBy: "Server Admin",
                replyAt: serverTimestamp(),
              });
              replyButton.textContent = "Antwort gesendet";
              replyInput.disabled = true;
            } catch (error) {
              console.error("Admin-Antwort konnte nicht gespeichert werden:", error);
              replyButton.textContent = "Senden fehlgeschlagen – erneut versuchen";
              replyButton.disabled = false;
            }
          });
          card.append(replyInput, replyButton);
          container.appendChild(card);
        }
      } catch (error) {
        console.error("Kontaktanfragen konnten nicht geladen werden:", error);
        const failure = document.createElement("p");
        failure.className = "inbox-empty error";
        failure.textContent = "Kontaktanfragen konnten nicht geladen werden. Prüfe die Firestore-Regeln.";
        container.appendChild(failure);
      }

      dashboard.appendChild(container);
    }

    async function loadDashboard() {
      dashboard.innerHTML = "";
      for (const collName of collectionsToShow) {
        const container = document.createElement("div");
        container.className = "collection-container";
        const title = document.createElement("h2");
        title.textContent = collName.toUpperCase();
        container.appendChild(title);

        const q = query(collection(db, collName));
        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const div = document.createElement("div");
          div.className = "doc";
          const pre = document.createElement("pre");
          pre.textContent = JSON.stringify(data, null, 2);
          div.appendChild(pre);
          container.appendChild(div);
        }

        dashboard.appendChild(container);
      }
      await loadContactInbox();
    }

    const ADMIN_UIDS = ["gaPuzG1ULdUSskKUsciL1g79nh72", "5Oe5YOBOtfOGQsRJ3XUjr3kemnX2"];
    onAuthStateChanged(auth, (user) => {
      if (!user || !ADMIN_UIDS.includes(user.uid)) {
        dashboard.textContent = "Kein Adminzugriff.";
        return;
      }
      loadDashboard();
    });

    // Admin-Ansicht in größeren Abständen aktualisieren.
    setInterval(() => {
      if (auth.currentUser && ADMIN_UIDS.includes(auth.currentUser.uid)) loadDashboard();
    }, 60000);
