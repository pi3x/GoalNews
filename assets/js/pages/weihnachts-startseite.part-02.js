import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
      import {
        getFirestore,
        collection,
        doc,
        onSnapshot,
        getDoc,
      } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
      import {
        getAuth,
        onAuthStateChanged,
        setPersistence,
        browserLocalPersistence,
      } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

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
      const auth = getAuth(app);
      setPersistence(auth, browserLocalPersistence);

      // --- Wartungsmodus prüfen live ---
      function watchMaintenance() {
        const docRef = doc(db, "settings", "main");

        onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.maintenance === true) {
              console.log("⚠️ Wartungsmodus aktiv, Weiterleitung...");
              window.location.href = "wartungsarbeiten.html";
            }
          } else {
            console.error("❌ Einstellungen nicht gefunden");
          }
        });
      }

      // Direkt starten
      watchMaintenance();

      const breakingEl = document.getElementById("breakingNews");
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          breakingEl.classList.add("locked");
          return;
        }
        const userRef = doc(db, "users", user.uid);
        onSnapshot(userRef, (snap) => {
          const data = snap.data();
          if (data && data.breakingNews === true) {
            breakingEl.classList.remove("locked");
          } else {
            breakingEl.classList.add("locked");
          }
        });
      });

      // --- Live Games ---
      const tableBody = document.getElementById("tableBody");
      const matchTimers = new Map();

      function addHalfTimeAnimation(td) {
        if (!td.querySelector(".half-time-animation")) {
          const overlay = document.createElement("div");
          overlay.className = "half-time-animation";
          overlay.textContent = "Halbzeit!";
          td.appendChild(overlay);
        }
      }

      function removeHalfTimeAnimation(td) {
        const overlay = td.querySelector(".half-time-animation");
        if (overlay) overlay.remove();
      }

      function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      }
      function startMatchTimer(id, td, startTime, halfTime) {
        if (matchTimers.has(id)) clearInterval(matchTimers.get(id));
        let paused = halfTime;
        const timerEl = document.createElement("span");
        timerEl.className = "match-timer";
        td.appendChild(timerEl);

        const interval = setInterval(() => {
          if (!paused) {
            const elapsed = Date.now() - startTime;
            if (elapsed < 90 * 60 * 1000) {
              timerEl.textContent = `⏱️ ${formatTime(elapsed)}`;
            } else {
              timerEl.textContent = "🕛 90:00";
              clearInterval(interval);
            }
          } else {
            timerEl.textContent = "⏸️ Halbzeit";
          }
        }, 1000);

        matchTimers.set(id, interval);
      }

      function showVARComment(td, comment) {
        let varDiv = td.querySelector(".var-comment");
        if (!varDiv) {
          varDiv = document.createElement("span");
          varDiv.className = "var-comment";
          td.appendChild(varDiv);
        }
        varDiv.textContent = comment;
        varDiv.style.opacity = 1;
        setTimeout(() => (varDiv.style.opacity = 0), 5000);
      }

      async function initLiveGames() {
        const colRef = collection(db, "liveGames");
        onSnapshot(colRef, (snapshot) => {
          tableBody.innerHTML = "";
          if (snapshot.empty) {
            tableBody.innerHTML =
              "<tr><td colspan='3'>Keine aktuellen Spiele</td></tr>";
            return;
          }
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (docSnap.id === "next_game") return;
            const tr = document.createElement("tr");
            tr.innerHTML = `
              <td class="${data.over ? "over-game" : ""}">${
              data.home || ""
            }</td>
              <td class="${data.over ? "over-game" : ""}">${
              data.away || ""
            }</td>
              <td class="${data.goal ? "goal-animation" : ""} ${
              data.over ? "over-game" : ""
            }">${data.score || ""}</td>
            `;
            tableBody.appendChild(tr);
            const td = tr.querySelector("td:nth-child(3)");
            if (data.halfTime) addHalfTimeAnimation(td);
            else removeHalfTimeAnimation(td);
            if (data.startTime)
              startMatchTimer(
                docSnap.id,
                td,
                data.startTime.toDate().getTime(),
                data.halfTime
              );
            if (data.varComment) showVARComment(td, data.varComment);
          });
        });
      }
      initLiveGames();
