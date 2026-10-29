import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
      authDomain: "goalnewsde-community.firebaseapp.com",
      projectId: "goalnewsde-community",
      storageBucket: "goalnewsde-community.firebasestorage.app",
      messagingSenderId: "134523022055",
      appId: "1:134523022055:web:4f35ed7812d06e4fb55042",
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const gamesEl = document.getElementById("games");

    function ordinal(n) {
      if (n === 1) return "1ST";
      if (n === 2) return "2ND";
      if (n === 3) return "3RD";
      return n + "TH";
    }

    onSnapshot(collection(db, "FootballGames"), (snapshot) => {
      gamesEl.innerHTML = "";

      if (snapshot.empty) {
        gamesEl.innerHTML = "<p>Keine Spiele live</p>";
        return;
      }

      snapshot.forEach((docSnap) => {
        const g = docSnap.data();

        // STATUS LOGIK
        let statusClass, statusText;
        if (g.flagText) {
          statusClass = "live";
          statusText = "FLAG";
        } else if (g.over) {
          statusClass = "final";
          statusText = "FINAL";
        } else if (g.quarterEnd) { // NEU
          statusClass = "quarterEnd";
          statusText = "QUARTER END";
        } else if (g.halfTime) {
          statusClass = "half";
          statusText = "HALBZEIT";
        } else {
          statusClass = "live";
          statusText = "LIVE";
        }

        const div = document.createElement("div");
        div.className = "game" + (g.over ? " over" : "");

        div.innerHTML = `
          ${g.flagText ? `<div class="flag">FLAG • ${g.flagText}</div>` : ""}
          <div class="status ${statusClass}">${statusText}</div>
          <div class="teams">
            <div class="team">${g.home}</div>
            <div class="score ${g.touchdown ? "td" : ""}">${g.homeScore} : ${g.awayScore}</div>
            <div class="team">${g.away}</div>
          </div>
          <div class="meta">
            ${g.down && g.distance ? `Down: ${ordinal(g.down)} & ${g.distance}` : ""}
            ${g.quarter ? ` • Quarter: ${g.quarter}` : ""}
            ${g.time ? ` • ⏱ ${g.time}` : ""}
          </div>
        `;

        // TOUCHDOWN BANNER
        if (g.touchdown) {
          const tdBanner = document.createElement("div");
          tdBanner.className = "td-banner";
          tdBanner.innerText = "TOUCHDOWN!";
          div.appendChild(tdBanner);

          // Banner neu starten, falls mehrfach TD
          void tdBanner.offsetWidth;
        }

        gamesEl.appendChild(div);
      });
    });
