import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
    import { getFirestore, collection, doc, getDoc, setDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
import { appendAdminBadge } from "../admin-badge.js";

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
    const ratingFields = document.getElementById("ratingFields");
    const starButtons = [...document.querySelectorAll(".star-button")];
    const reviewText = document.getElementById("reviewText");
    const submitButton = document.getElementById("submitRating");
    const formStatus = document.getElementById("formStatus");
    const authNote = document.getElementById("authNote");
    const reviewList = document.getElementById("reviewList");
    const ratingsQuery = query(collection(db, "siteRatings"), orderBy("updatedAt", "desc"));
    let selectedRating = 0;
    let currentUser = null;
    let ownRating = null;

    function chooseRating(value) {
      selectedRating = value;
      starButtons.forEach(button => {
        const active = Number(button.dataset.rating) <= value;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(Number(button.dataset.rating) === value));
      });
      document.getElementById("starLabel").textContent = `${value} von 5 Sternen`;
    }
    starButtons.forEach(button => button.addEventListener("click", () => chooseRating(Number(button.dataset.rating))));

    function formatDate(timestamp) {
      return timestamp?.toDate ? timestamp.toDate().toLocaleDateString("de-DE", { day:"2-digit", month:"long", year:"numeric" }) : "Gerade eben";
    }

    function renderReviews(snapshot) {
      const rows = snapshot.docs.map(item => ({ id:item.id, ...item.data() }));
      const valid = rows.filter(item => Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5);
      const average = valid.length ? valid.reduce((sum, item) => sum + item.rating, 0) / valid.length : 0;
      document.getElementById("averageRating").textContent = valid.length ? average.toFixed(1) : "–";
      document.getElementById("averageStars").textContent = valid.length ? `${"★".repeat(Math.round(average))}${"☆".repeat(5 - Math.round(average))}` : "☆☆☆☆☆";
      document.getElementById("reviewCount").textContent = valid.length === 1 ? "1 Bewertung" : `${valid.length} Bewertungen`;
      ownRating = currentUser ? valid.find(item => item.id === currentUser.uid) || null : null;
      if (ownRating) {
        chooseRating(ownRating.rating);
        reviewText.value = ownRating.text || "";
      }
      if (!valid.length) {
        const empty = document.createElement("p");
        empty.className = "empty-reviews";
        empty.textContent = "Noch keine Bewertungen. Sei die erste Person, die GoalNews bewertet.";
        reviewList.replaceChildren(empty);
        return;
      }
      reviewList.replaceChildren(...valid.map(item => {
        const card = document.createElement("article");
        card.className = "review-card";
        const head = document.createElement("div");
        head.className = "review-head";
        const identity = document.createElement("div");
        const author = document.createElement("div");
        author.className = "review-author";
        author.textContent = item.authorName || "GoalNews-Mitglied";
        appendAdminBadge(author, item.userId || item.id);
        const date = document.createElement("time");
        date.className = "review-date";
        date.textContent = formatDate(item.updatedAt);
        identity.append(author, date);
        const stars = document.createElement("span");
        stars.className = "review-stars";
        stars.textContent = `${"★".repeat(item.rating)}${"☆".repeat(5 - item.rating)}`;
        stars.setAttribute("aria-label", `${item.rating} von 5 Sternen`);
        head.append(identity, stars);
        card.appendChild(head);
        if (item.text) {
          const text = document.createElement("p");
          text.className = "review-text";
          text.textContent = item.text;
          card.appendChild(text);
        }
        return card;
      }));
    }

    onSnapshot(ratingsQuery, renderReviews, error => {
      console.error("Bewertungen konnten nicht geladen werden:", error);
      reviewList.textContent = "Bewertungen sind gerade nicht erreichbar.";
    });

    onAuthStateChanged(auth, user => {
      currentUser = user;
      ratingFields.disabled = !user;
      submitButton.disabled = !user;
      authNote.replaceChildren();
      if (!user) {
        authNote.append(document.createTextNode("Zum Bewerten bitte "));
        const login = document.createElement("a");
        login.href = "anmelden.html";
        login.textContent = "anmelden";
        authNote.append(login, document.createTextNode("."));
      } else {
        authNote.textContent = "Du kannst deine Bewertung jederzeit aktualisieren.";
      }
      if (user) getDoc(doc(db, "siteRatings", user.uid)).then(snapshot => {
        if (snapshot.exists()) {
          const existing = snapshot.data();
          chooseRating(existing.rating);
          reviewText.value = existing.text || "";
          submitButton.textContent = "Bewertung aktualisieren";
        }
      }).catch(error => console.debug("Vorhandene Bewertung konnte nicht geladen werden:", error));
    });

    document.getElementById("ratingForm").addEventListener("submit", async event => {
      event.preventDefault();
      if (!currentUser) {
        formStatus.textContent = "Bitte zuerst anmelden.";
        return;
      }
      if (selectedRating < 1 || selectedRating > 5) {
        formStatus.textContent = "Bitte zuerst die Sterne auswählen.";
        formStatus.classList.add("error");
        return;
      }
      submitButton.disabled = true;
      formStatus.classList.remove("error");
      formStatus.textContent = "Bewertung wird gespeichert …";
      try {
        let authorName = currentUser.displayName || "GoalNews-Mitglied";
        try {
          const profile = await getDoc(doc(db, "users", currentUser.uid));
          if (profile.exists() && profile.data().username) authorName = String(profile.data().username).slice(0, 50);
        } catch { /* The rating remains available with a generic member name. */ }
        await setDoc(doc(db, "siteRatings", currentUser.uid), {
          userId: currentUser.uid,
          authorName,
          rating: selectedRating,
          text: reviewText.value.trim().slice(0, 600),
          updatedAt: serverTimestamp(),
        });
        formStatus.textContent = "Danke! Deine Bewertung wurde gespeichert.";
        submitButton.textContent = "Bewertung aktualisieren";
      } catch (error) {
        console.error("Bewertung konnte nicht gespeichert werden:", error);
        formStatus.textContent = error.code === "permission-denied"
          ? "Firebase hat das Speichern abgelehnt. Für siteRatings müssen Firestore-Regeln ergänzt werden."
          : `Bewertung konnte nicht gespeichert werden (${error.code || "Fehler"}). Bitte erneut versuchen.`;
        formStatus.classList.add("error");
      } finally {
        submitButton.disabled = !currentUser;
      }
    });
