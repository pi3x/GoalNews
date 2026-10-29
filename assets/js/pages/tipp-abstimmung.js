import { currentSeasonStart, fetchJsonCached } from "./data-cache.js";
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
    import { getFirestore, collection, doc, onSnapshot, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

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
    const pollList = document.getElementById("pollList");
    const season = currentSeasonStart();
    const voteListeners = new Map();

    function stopVoteListeners() {
      voteListeners.forEach(unsubscribe => unsubscribe());
      voteListeners.clear();
    }

    function createResult(label, count, total) {
      const line = document.createElement("div");
      line.className = "result-line";
      const text = document.createElement("span");
      text.textContent = label;
      const track = document.createElement("div");
      track.className = "result-track";
      const bar = document.createElement("div");
      bar.className = "result-bar";
      const percentage = total ? Math.round(count / total * 100) : 0;
      bar.style.width = `${percentage}%`;
      track.appendChild(bar);
      const amount = document.createElement("span");
      amount.textContent = `${count} · ${percentage}%`;
      line.append(text, track, amount);
      return line;
    }

    function showError(message) {
      const box = document.createElement("p");
      box.className = "empty";
      box.textContent = message;
      pollList.replaceChildren(box);
    }

    function renderMatch(match, user) {
      const card = document.createElement("article");
      card.className = "poll-card";
      const team1 = match.team1?.teamName || "Heimteam";
      const team2 = match.team2?.teamName || "Auswärtsteam";
      const kickoff = new Date(match.matchDateTime);
      const matchKey = String(match.matchID);
      const counts = { home: 0, draw: 0, away: 0 };
      const meta = document.createElement("div");
      meta.className = "poll-meta";
      const league = document.createElement("span");
      league.textContent = match.leagueName || (match.leagueShortcut === "bl2" ? "2. Bundesliga" : "Bundesliga");
      const badge = document.createElement("span");
      const finalResult = (match.matchResults || []).find(item => item.resultTypeID === 2);
      const started = kickoff.getTime() <= Date.now();
      badge.textContent = finalResult ? "✅ BEENDET" : started ? "🔴 GESTARTET" : "🕒 KOMMT";
      meta.append(league, badge);
      const title = document.createElement("h2");
      title.textContent = `${team1} – ${team2}`;
      const time = document.createElement("p");
      time.className = "poll-time";
      time.textContent = `Anstoß: ${kickoff.toLocaleString("de-DE", { weekday:"long", day:"2-digit", month:"long", hour:"2-digit", minute:"2-digit" })}`;
      const options = document.createElement("div");
      options.className = "vote-options";
      const choices = [
        { id: "home", label: `1 · ${team1}` },
        { id: "draw", label: "X · Remis" },
        { id: "away", label: `2 · ${team2}` },
      ];
      const buttons = new Map();
      const results = document.createElement("div");
      results.className = "poll-result";
      const status = document.createElement("p");
      status.className = "poll-message";
      let chosen = null;
      let countsReady = false;

      function paintResults() {
        results.replaceChildren();
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        choices.forEach(choice => results.appendChild(createResult(
          choice.id === "home" ? "Heimsieg" : choice.id === "draw" ? "Remis" : "Auswärtssieg",
          counts[choice.id], total,
        )));
        buttons.forEach((button, choice) => {
          button.disabled = Boolean(chosen) || started;
          button.classList.toggle("selected", choice === chosen);
        });
        if (!status.dataset.custom) {
          if (finalResult) {
            const winner = finalResult.pointsTeam1 > finalResult.pointsTeam2 ? "home" : finalResult.pointsTeam1 < finalResult.pointsTeam2 ? "away" : "draw";
            const score = `${finalResult.pointsTeam1}:${finalResult.pointsTeam2}`;
            status.textContent = `Endergebnis: ${team1} ${score} ${team2}${chosen ? (chosen === winner ? " · Dein Tipp war richtig!" : " · Dein Tipp war leider falsch.") : ""}`;
          } else if (chosen) {
            status.textContent = "Dein Tipp ist gespeichert – die Community-Stimmen werden live aktualisiert.";
          } else if (started) {
            status.textContent = "Die Abstimmung ist mit Anstoß geschlossen.";
          } else if (countsReady && total === 0) {
            status.textContent = "Noch keine Stimmen – gib deinen Tipp ab!";
          } else if (countsReady) {
            status.textContent = `${total} Community-Stimme${total === 1 ? "" : "n"} · Ergebnisse werden live aktualisiert.`;
          } else {
            status.textContent = "Community-Stimmen werden geladen …";
          }
        }
      }

      choices.forEach(choice => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "vote-button";
        button.dataset.vote = choice.id;
        button.textContent = choice.label;
        button.disabled = started;
        button.addEventListener("click", async () => {
          if (chosen || started) return;
          buttons.forEach(item => item.disabled = true);
          status.dataset.custom = "true";
          status.textContent = "Tipp wird gespeichert …";
          try {
            await runTransaction(db, async transaction => {
              const voteRef = doc(db, "matchPolls", matchKey, "votes", user.uid);
              const existing = await transaction.get(voteRef);
              if (existing.exists()) throw new Error("ALREADY_VOTED");
              transaction.set(voteRef, { choice: choice.id, createdAt: serverTimestamp() });
            });
            chosen = choice.id;
            status.dataset.custom = "";
            status.textContent = "Dein Tipp wurde gespeichert.";
            paintResults();
          } catch (error) {
            console.error("Tipp konnte nicht gespeichert werden:", error);
            status.dataset.custom = "true";
            status.textContent = error.message === "ALREADY_VOTED"
              ? "Du hast für dieses Spiel bereits abgestimmt. Deine Stimme wird geladen."
              : error.code === "permission-denied"
                ? "Firebase blockiert den Tipp. Prüfe die matchPolls-Regeln in FIREBASE_ABSTIMMUNG_SETUP.md."
                : `Tipp konnte nicht gespeichert werden (${error.code || "Fehler"}). Bitte später erneut versuchen.`;
            buttons.forEach((item, id) => {
              item.disabled = Boolean(chosen) || started || error.message === "ALREADY_VOTED";
              item.classList.toggle("selected", id === chosen);
            });
          }
        });
        buttons.set(choice.id, button);
        options.appendChild(button);
      });

      card.append(meta, title, time, options, status, results);
      paintResults();
      const votesRef = collection(db, "matchPolls", matchKey, "votes");
      const unsubscribe = onSnapshot(votesRef, snapshot => {
        counts.home = 0; counts.draw = 0; counts.away = 0;
        chosen = null;
        snapshot.forEach(vote => {
          const choice = vote.data().choice;
          if (Object.hasOwn(counts, choice)) counts[choice] += 1;
          if (vote.id === user.uid && Object.hasOwn(counts, choice)) chosen = choice;
        });
        countsReady = true;
        status.dataset.custom = "";
        paintResults();
      }, error => {
        console.error("Community-Tipps konnten nicht geladen werden:", error);
        status.dataset.custom = "true";
        status.textContent = error.code === "permission-denied"
          ? "Firebase blockiert das Lesen. Prüfe die matchPolls-Regeln in FIREBASE_ABSTIMMUNG_SETUP.md."
          : "Community-Stimmen sind gerade nicht erreichbar.";
      });
      voteListeners.set(matchKey, unsubscribe);
      return card;
    }

    async function loadPolls(user) {
      stopVoteListeners();
      try {
        const leagues = await Promise.all(["bl1", "bl2"].map(async league => {
          const response = await fetchJsonCached(`https://api.openligadb.de/getmatchdata/${league}/${season}`, { ttlMs: 60 * 1000 });
          return response.data;
        }));
        const now = Date.now();
        const allMatches = leagues.flat();
        const upcoming = allMatches.filter(match => new Date(match.matchDateTime).getTime() > now)
          .sort((a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime)).slice(0, 20);
        const finished = allMatches.filter(match => (match.matchResults || []).some(item => item.resultTypeID === 2))
          .sort((a, b) => new Date(b.matchDateTime) - new Date(a.matchDateTime)).slice(0, 8);
        const games = [...finished.reverse(), ...upcoming];
        if (!games.length) {
          showError("Aktuell sind keine Spiele eingetragen.");
          return;
        }
        pollList.replaceChildren(...games.map(match => renderMatch(match, user)));
      } catch (error) {
        console.error("Abstimmungen konnten nicht geladen werden:", error);
        showError("Der Spielplan ist momentan nicht erreichbar. Bitte später erneut versuchen.");
      }
    }

    onAuthStateChanged(auth, user => {
      stopVoteListeners();
      if (!user) {
        const gate = document.createElement("div");
        gate.className = "login-gate";
        gate.append(document.createTextNode("Melde dich an, um bei den Spieltipps mitzumachen. "));
        const login = document.createElement("a");
        login.href = "anmelden.html";
        login.textContent = "Zum Login";
        const separator = document.createTextNode(" · ");
        const register = document.createElement("a");
        register.href = "registrieren.html";
        register.textContent = "Konto erstellen";
        gate.append(login, separator, register);
        pollList.replaceChildren(gate);
        return;
      }
      loadPolls(user);
    });
