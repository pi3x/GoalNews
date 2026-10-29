import { fetchJsonCached, currentSeasonStart, formatUpdatedAt } from "./data-cache.js";
    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
    import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";
    import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

    const firebaseConfig = {
      apiKey: "AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w",
      authDomain: "goalnewsde-community.firebaseapp.com",
      projectId: "goalnewsde-community",
      storageBucket: "goalnewsde-community.firebasestorage.app",
      messagingSenderId: "134523022055",
      appId: "1:134523022055:web:4f35ed7812d06e4fb55042",
    };
    const db = getFirestore(initializeApp(firebaseConfig));
    const auth = getAuth();
    setPersistence(auth, browserLocalPersistence);
    const statusEl = document.getElementById("status");
    const titleEl = document.getElementById("pageTitle");
    const introEl = document.getElementById("intro");
    const upcomingEl = document.getElementById("upcoming");
    const resultsEl = document.getElementById("results");
    const refreshButton = document.getElementById("refreshButton");
    let currentTeam = "";

    function normalized(value) {
      return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("de").replace(/[^a-z0-9]/g, "");
    }
    function showEmpty(container, text) {
      container.replaceChildren();
      const p = document.createElement("p"); p.className = "empty"; p.textContent = text; container.append(p);
    }
    function dateText(date) {
      return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
    }
    function renderMatch(match, isPlayed) {
      const card = document.createElement("article"); card.className = "match-card";
      const meta = document.createElement("div"); meta.className = "match-meta";
      const date = new Date(match.matchDateTime);
      const league = match.leagueName || match.league?.leagueName || "Liga";
      meta.textContent = `${league} · ${dateText(date)}`;
      const teams = document.createElement("div"); teams.className = "match-teams";
      teams.textContent = `${match.team1?.teamName || "Heim"} – ${match.team2?.teamName || "Gast"}`;
      card.append(meta, teams);
      if (isPlayed) {
        const score = match.matchResults?.find(item => item.resultTypeID === 2) || match.matchResults?.[match.matchResults.length - 1];
        const result = document.createElement("div"); result.className = "match-score";
        result.textContent = score ? `${score.pointsTeam1} : ${score.pointsTeam2}` : "Ergebnis noch nicht verfügbar";
        card.append(result);
      }
      return card;
    }
    async function loadTeamMatches(team) {
      statusEl.textContent = "Spielplan und Ergebnisse werden geladen …";
      refreshButton.disabled = true;
      try {
        const season = currentSeasonStart();
        const responses = await Promise.all(["bl1", "bl2"].map(league => fetchJsonCached(`https://api.openligadb.de/getmatchdata/${league}/${season}`, { ttlMs: 5 * 60 * 1000 })));
        const all = responses.flatMap(response => response.data);
        const key = normalized(team);
        const matches = all.filter(match => normalized(match.team1?.teamName).includes(key) || normalized(match.team2?.teamName).includes(key));
        const now = Date.now();
        const upcoming = matches.filter(match => new Date(match.matchDateTime).getTime() >= now).sort((a,b) => new Date(a.matchDateTime)-new Date(b.matchDateTime)).slice(0, 6);
        const results = matches.filter(match => new Date(match.matchDateTime).getTime() < now && (match.matchIsFinished || match.matchResults?.length)).sort((a,b) => new Date(b.matchDateTime)-new Date(a.matchDateTime)).slice(0, 6);
        titleEl.textContent = `${team} · Updates`;
        introEl.textContent = `Kommende Partien und die jüngsten Ergebnisse von ${team} in Bundesliga und 2. Bundesliga.`;
        document.getElementById("upcomingCount").textContent = `${upcoming.length} angezeigt`;
        document.getElementById("resultsCount").textContent = `${results.length} angezeigt`;
        upcoming.length ? upcomingEl.replaceChildren(...upcoming.map(match => renderMatch(match, false))) : showEmpty(upcomingEl, `Für ${team} sind aktuell keine kommenden Spiele gelistet.`);
        results.length ? resultsEl.replaceChildren(...results.map(match => renderMatch(match, true))) : showEmpty(resultsEl, `Für ${team} liegen in dieser Saison noch keine Ergebnisse vor.`);
        const updatedAt = Math.min(...responses.map(response => response.updatedAt));
        const stale = responses.some(response => response.stale);
        statusEl.textContent = `Datenstand: ${formatUpdatedAt(updatedAt)}${stale ? " · gespeicherter Stand (API gerade nicht erreichbar)" : ""}.`;
      } catch (error) {
        console.error("OpenLigaDB-Daten konnten nicht geladen werden:", error);
        statusEl.textContent = "Die Spieldaten sind gerade nicht erreichbar. Bitte versuche es später erneut.";
        showEmpty(upcomingEl, "Spielplan momentan nicht verfügbar."); showEmpty(resultsEl, "Ergebnisse momentan nicht verfügbar.");
      } finally { refreshButton.disabled = false; }
    }
    refreshButton.addEventListener("click", () => currentTeam && loadTeamMatches(currentTeam));
    onAuthStateChanged(auth, async user => {
      if (!user) {
        statusEl.replaceChildren(document.createTextNode("Melde dich an, damit wir den in deinem Profil gespeicherten Lieblingsverein anzeigen können. "));
        const actions = document.createElement("span"); actions.className = "auth-actions";
        const login = document.createElement("a"); login.href = "anmelden.html"; login.textContent = "Anmelden";
        const register = document.createElement("a"); register.href = "registrieren.html"; register.textContent = "Konto erstellen";
        actions.append(login, register); statusEl.append(actions);
        showEmpty(upcomingEl, "Nach der Anmeldung erscheinen hier die nächsten Spiele deines Vereins.");
        showEmpty(resultsEl, "Nach der Anmeldung erscheinen hier die letzten Ergebnisse.");
        return;
      }
      try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        currentTeam = String(snapshot.data()?.favTeam || "").trim();
        if (!currentTeam) {
          statusEl.textContent = "In deinem Profil ist noch kein Lieblingsverein gespeichert. Lege ihn im Dashboard fest.";
          const link = document.createElement("a"); link.href = "special.html"; link.textContent = "Zum Dashboard"; statusEl.append(" ", link);
          showEmpty(upcomingEl, "Wähle zuerst deinen Lieblingsverein aus."); showEmpty(resultsEl, "Wähle zuerst deinen Lieblingsverein aus.");
          return;
        }
        await loadTeamMatches(currentTeam);
      } catch (error) {
        console.error("Profil konnte nicht geladen werden:", error);
        statusEl.textContent = "Dein Profil konnte gerade nicht geladen werden. Bitte lade die Seite später erneut.";
      }
    });
