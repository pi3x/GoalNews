import { currentSeasonStart, fetchJsonCached, formatUpdatedAt } from "./data-cache.js";

    const grid = document.getElementById("matchGrid");
    const status = document.getElementById("status");
    const refreshButton = document.getElementById("refreshButton");
    const filterButtons = [...document.querySelectorAll(".filter-button")];
    const season = currentSeasonStart();
    let matches = [];
    let activeFilter = "all";
    let isLoading = false;

    function addText(parent, tag, className, value) {
      const element = document.createElement(tag);
      if (className) element.className = className;
      element.textContent = value;
      parent.appendChild(element);
      return element;
    }

    function renderMatch(match) {
      const card = document.createElement("article");
      card.className = "match-card";
      const matchDate = new Date(match.matchDateTime);
      const leagueName = match.leagueShortcut === "bl2" ? "2. Bundesliga" : "1. Bundesliga";
      const groupName = match.group?.groupName ? ` · ${match.group.groupName}` : "";
      const top = document.createElement("div");
      top.className = "match-top";
      addText(top, "span", "league-tag", `${leagueName}${groupName}`);
      addText(top, "time", "", matchDate.toLocaleString("de-DE", { weekday:"short", day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }));

      const finalResult = (match.matchResults || []).find(result => result.resultTypeID === 2);
      const scoreline = document.createElement("div");
      scoreline.className = "scoreline";
      addText(scoreline, "span", "team", match.team1?.teamName || "Heimteam");
      addText(scoreline, "span", "score", `${finalResult.pointsTeam1} : ${finalResult.pointsTeam2}`);
      addText(scoreline, "span", "team away", match.team2?.teamName || "Auswärtsteam");

      const goals = Array.isArray(match.goals) ? [...match.goals].sort((a, b) => Number(a.matchMinute || 0) - Number(b.matchMinute || 0)) : [];
      const details = document.createElement("details");
      details.className = "events";
      const summary = document.createElement("summary");
      summary.textContent = goals.length ? `⚽ ${goals.length} Torereignis${goals.length === 1 ? "" : "se"} anzeigen` : "Spielereignisse anzeigen";
      const goalList = document.createElement("div");
      goalList.className = "goal-list";
      if (!goals.length) {
        addText(goalList, "span", "no-goals", "Für dieses Spiel wurden keine Torschützen übermittelt.");
      } else {
        goals.forEach(goal => {
          const event = document.createElement("div");
          event.className = "goal-event";
          addText(event, "span", "goal-minute", `${goal.matchMinute ?? "–"}'`);
          addText(event, "span", "", goal.goalGetterName || "Torschütze nicht angegeben");
          addText(event, "span", "goal-score", `${goal.scoreTeam1} : ${goal.scoreTeam2}`);
          goalList.appendChild(event);
        });
      }
      details.append(summary, goalList);
      card.append(top, scoreline, details);
      return card;
    }

    function render() {
      const visible = matches.filter(match => activeFilter === "all" || match.leagueShortcut === activeFilter);
      if (!visible.length) {
        const empty = document.createElement("p");
        empty.className = "state";
        empty.textContent = activeFilter === "all" ? "Noch keine abgeschlossenen Spiele mit Ergebnissen verfügbar." : "Für diese Liga sind noch keine abgeschlossenen Spiele verfügbar.";
        grid.replaceChildren(empty);
        return;
      }
      grid.replaceChildren(...visible.map(renderMatch));
    }

    async function loadMatches(force = false) {
      if (isLoading) return;
      isLoading = true;
      refreshButton.disabled = true;
      refreshButton.textContent = "Lade Spiele …";
      status.textContent = "Spieldaten werden aktualisiert …";
      try {
        const results = await Promise.all(["bl1", "bl2"].map(league =>
          fetchJsonCached(`https://api.openligadb.de/getmatchdata/${league}/${season}`, { ttlMs: 5 * 60 * 1000, force }),
        ));
        const complete = results.flatMap(result => result.data.map(match => ({ match, updatedAt: result.updatedAt, stale: result.stale })));
        matches = complete.map(entry => entry.match)
          .filter(match => (match.matchResults || []).some(result => result.resultTypeID === 2))
          .sort((a, b) => new Date(b.matchDateTime) - new Date(a.matchDateTime))
          .slice(0, 24);
        const updatedAt = Math.min(...results.map(result => result.updatedAt));
        const stale = results.some(result => result.stale);
        status.textContent = `Saison ${season}/${season + 1} · Stand ${formatUpdatedAt(updatedAt)}${stale ? " · gespeicherter Stand, API nicht erreichbar" : ""} · bis zu 24 letzte Spiele`;
        render();
      } catch (error) {
        console.error("Highlights konnten nicht geladen werden:", error);
        status.textContent = "Spieldaten momentan nicht erreichbar.";
        const message = document.createElement("p");
        message.className = "state error";
        message.textContent = matches.length ? "Die gespeicherten Ergebnisse werden angezeigt; Aktualisierung später erneut versuchen." : "Die Spieldaten sind gerade nicht erreichbar. Bitte später erneut versuchen.";
        if (!matches.length) grid.replaceChildren(message);
        else render();
      } finally {
        isLoading = false;
        refreshButton.disabled = false;
        refreshButton.textContent = "↻ Aktualisieren";
      }
    }

    filterButtons.forEach(button => button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      filterButtons.forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      render();
    }));
    refreshButton.addEventListener("click", () => loadMatches(true));
    loadMatches();
    window.setInterval(() => loadMatches(), 5 * 60 * 1000);
