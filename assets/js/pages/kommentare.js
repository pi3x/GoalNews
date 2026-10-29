import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
    import { getFirestore, collection, addDoc, deleteDoc, doc, serverTimestamp, query, orderBy, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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
    const commentInput = document.getElementById("commentInput");
    const sendComment = document.getElementById("sendComment");
    const commentsContainer = document.getElementById("commentsContainer");
    const authHint = document.getElementById("authHint");

    sendComment.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) return;
      const text = commentInput.value.trim();
      if (!text) return;
      sendComment.disabled = true;
      try {
        let username = user.displayName || "GoalNews-Mitglied";
        try {
          const profile = await getDoc(doc(db, "users", user.uid));
          if (profile.exists() && profile.data().username) username = String(profile.data().username).slice(0, 40);
        } catch { /* Der Kommentar kann auch ohne Profilnamen gespeichert werden. */ }
        username = String(username).trim().slice(0, 40) || "GoalNews-Mitglied";
        await addDoc(collection(db, "comments"), { userId:user.uid, username, text, created:serverTimestamp(), reactions:{} });
        commentInput.value = "";
      } catch (error) {
        console.error("Kommentar konnte nicht gespeichert werden:", error);
        authHint.textContent = "Kommentar konnte gerade nicht gespeichert werden. Bitte später erneut versuchen.";
      } finally {
        sendComment.disabled = !auth.currentUser;
      }
    });

    function formatDate(timestamp) {
      if (!timestamp?.toDate) return "Gerade eben";
      return timestamp.toDate().toLocaleString("de-DE", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });
    }

    async function renderComments(snapshot) {
      if (snapshot.empty) {
        const empty = document.createElement("p");
        empty.className = "empty-comments";
        empty.textContent = "Noch keine Kommentare – starte die Diskussion!";
        commentsContainer.replaceChildren(empty);
        return;
      }
      const user = auth.currentUser;
      const cards = await Promise.all(snapshot.docs.map(async commentDoc => {
        const data = commentDoc.data();
        const card = document.createElement("article");
        card.className = "comment";
        const username = typeof data.username === "string" && data.username.trim()
          ? data.username.trim().slice(0, 40)
          : "GoalNews-Mitglied";

        const head = document.createElement("div");
        head.className = "comment-head";
        const avatar = document.createElement("span");
        avatar.className = "comment-avatar";
        avatar.textContent = (username.trim()[0] || "G").toLocaleUpperCase("de");
        const identity = document.createElement("div");
        const author = document.createElement("span");
        author.className = "comment-author";
        author.textContent = username;
        const date = document.createElement("time");
        date.className = "comment-date";
        date.textContent = formatDate(data.created);
        identity.append(author, date);
        head.append(avatar, identity);

        const message = document.createElement("p");
        message.className = "comment-text";
        message.textContent = data.text || "";
        const reactions = document.createElement("div");
        reactions.className = "reaction-bar";
        Object.entries(data.reactions || {}).forEach(([emoji, count]) => {
          if (!count) return;
          const badge = document.createElement("span");
          badge.textContent = `${emoji} ${count}`;
          reactions.appendChild(badge);
        });
        const tools = document.createElement("div");
        tools.className = "comment-tools";
        const reactButton = document.createElement("button");
        reactButton.type = "button";
        reactButton.className = "react-btn";
        reactButton.textContent = "Reaktionen pausiert";
        reactButton.disabled = true;
        reactButton.title = "Reaktionen sind vorübergehend deaktiviert, damit Zähler nicht manipuliert werden können.";
        tools.append(reactions, reactButton);
        card.append(head, message, tools);

        if (user && data.userId === user.uid) {
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "delete-btn";
          remove.textContent = "Löschen";
          remove.setAttribute("aria-label", "Eigenen Kommentar löschen");
          remove.addEventListener("click", async () => {
            if (confirm("Kommentar wirklich löschen?")) await deleteDoc(doc(db, "comments", commentDoc.id));
          });
          card.appendChild(remove);
        }
        return card;
      }));
      commentsContainer.replaceChildren(...cards);
    }

    const commentsQuery = query(collection(db, "comments"), orderBy("created", "desc"));
    onSnapshot(commentsQuery, snapshot => renderComments(snapshot), error => {
      console.error("Kommentare konnten nicht geladen werden:", error);
      commentsContainer.textContent = "Kommentare sind gerade nicht erreichbar.";
    });
    onAuthStateChanged(auth, user => {
      commentInput.disabled = !user;
      sendComment.disabled = !user;
      authHint.replaceChildren();
      authHint.append(document.createTextNode(user ? "Du bist angemeldet und kannst kommentieren." : "Zum Schreiben bitte "));
      if (!user) {
        const login = document.createElement("a");
        login.href = "anmelden.html";
        login.textContent = "anmelden";
        authHint.append(login, document.createTextNode("."));
      }
    });
