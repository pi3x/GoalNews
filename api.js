/**
 * GoalNews - API Integration für echte Bundesliga News und Highlights
 * Unterstützt: football-data.org, ESPN API, YouTube API
 */

// API Konfiguration
const API_CONFIG = {
  // football-data.org API (kostenlos, 10 Requests/Min)
  footballData: {
    baseUrl: "https://api.football-data.org/v4",
    apiKey: "YOUR_API_KEY_HERE", // Registrieren auf: https://www.football-data.org/client/register
  },
  // Für echte YouTube-Highlights
  youtube: {
    apiKey: "YOUR_YOUTUBE_API_KEY_HERE",
    searchQuery: "Bundesliga Highlights",
  },
};

// Bundesliga-ID bei football-data.org: 425
const BUNDESLIGA_COMPETITION_ID = 425;

/**
 * Ruft aktuelle Bundesliga-Spiele ab
 */
async function fetchBundesligaMatches() {
  try {
    const response = await axios.get(
      `${API_CONFIG.footballData.baseUrl}/competitions/${BUNDESLIGA_COMPETITION_ID}/matches`,
      {
        headers: {
          "X-Auth-Token": API_CONFIG.footballData.apiKey,
        },
        params: {
          status: "FINISHED,LIVE,SCHEDULED",
        },
      },
    );
    return response.data.matches;
  } catch (error) {
    console.error("Fehler beim Abrufen der Spiele:", error);
    return [];
  }
}

/**
 * Ruft News zu einem bestimmten Team ab
 */
async function fetchTeamNews(teamId) {
  try {
    const response = await axios.get(
      `${API_CONFIG.footballData.baseUrl}/teams/${teamId}`,
      {
        headers: {
          "X-Auth-Token": API_CONFIG.footballData.apiKey,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Fehler beim Abrufen der Team-Info:", error);
    return null;
  }
}

/**
 * Ruft die aktuelle Bundesliga-Tabelle ab
 */
async function fetchBundesligaStandings() {
  try {
    const response = await axios.get(
      `${API_CONFIG.footballData.baseUrl}/competitions/${BUNDESLIGA_COMPETITION_ID}/standings`,
      {
        headers: {
          "X-Auth-Token": API_CONFIG.footballData.apiKey,
        },
      },
    );
    return response.data.standings[0].table;
  } catch (error) {
    console.error("Fehler beim Abrufen der Tabelle:", error);
    return [];
  }
}

/**
 * Sucht YouTube-Highlights für ein Spiel
 */
async function fetchYouTubeHighlights(searchQuery) {
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          q: `${searchQuery} Highlights`,
          part: "snippet",
          type: "video",
          maxResults: 5,
          order: "relevance",
          key: API_CONFIG.youtube.apiKey,
        },
      },
    );
    return response.data.items;
  } catch (error) {
    console.error("Fehler beim Abrufen von YouTube-Highlights:", error);
    return [];
  }
}

/**
 * Konvertiert API-Daten in HTML für Nachrichten
 */
function createNewsCardFromMatch(match) {
  const homeTeam = match.homeTeam.name;
  const awayTeam = match.awayTeam.name;
  const score = `${match.score.fullTime.home} - ${match.score.fullTime.away}`;
  const date = new Date(match.utcDate).toLocaleString("de-DE");

  return `
    <div class="news-card">
      <div class="news-img">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
          <circle cx="12" cy="12" r="10" stroke="white" stroke-width="1" fill="none"/>
          <path d="M12 2C12 2 9 6 9 12C9 18 12 22 12 22" stroke="white" stroke-width="1" fill="none"/>
          <path d="M2 12H22" stroke="white" stroke-width="1"/>
        </svg>
      </div>
      <div class="news-body">
        <div class="news-cat">Bundesliga</div>
        <div class="news-title">
          ${homeTeam} ${match.status === "FINISHED" ? score : "vs"} ${awayTeam}
        </div>
        <div class="news-meta">
          <span>${homeTeam}</span><span>·</span><span>${date}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Erstellt ein YouTube-Highlight-Element
 */
function createHighlightCard(video) {
  const videoId = video.id.videoId;
  const title = video.snippet.title;
  const thumbnail = video.snippet.thumbnails.medium.url;

  return `
    <div class="highlight-card">
      <div class="highlight-thumbnail" style="background-image: url('${thumbnail}')">
        <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="highlight-play">
          ▶
        </a>
      </div>
      <div class="highlight-title">${title}</div>
    </div>
  `;
}

/**
 * Aktualisiert die News-Sektion mit echten Daten
 */
async function updateNewsSection() {
  const matches = await fetchBundesligaMatches();
  const newsGrid = document.querySelector(".news-grid");

  if (!newsGrid || matches.length === 0) return;

  // Nur die letzten 4 abgeschlossenen Spiele anzeigen
  const finishedMatches = matches
    .filter((m) => m.status === "FINISHED")
    .slice(0, 4);

  const newsHTML = finishedMatches
    .map((match) => createNewsCardFromMatch(match))
    .join("");

  // Ersetze die bestehenden Karten (behalte die erste große Karte)
  const regularCards = newsGrid.querySelectorAll(
    ".news-card:not(.news-card-lg)",
  );
  regularCards.forEach((card) => card.remove());

  newsGrid.insertAdjacentHTML("beforeend", newsHTML);
}

/**
 * Aktualisiert die Live-Scores
 */
async function updateLiveScores() {
  const matches = await fetchBundesligaMatches();
  const scoresWidget = document.querySelector(".scores-widget");

  if (!scoresWidget) return;

  // Hole die nächsten 4 Spiele (Live oder geplant)
  const upcomingMatches = matches.slice(0, 4);

  let scoresHTML = `
    <div class="scores-header">
      <div class="scores-title">
        <div class="live-dot"></div>
        Live & Recent
      </div>
    </div>
  `;

  upcomingMatches.forEach((match) => {
    const homeScore = match.score.fullTime.home ?? "-";
    const awayScore = match.score.fullTime.away ?? "-";
    let statusHTML = "";

    if (match.status === "LIVE") {
      statusHTML = `<span class="status-live">${match.minute || "LIVE"}'</span>`;
    } else if (match.status === "FINISHED") {
      statusHTML = `<span class="status-ft">FT</span>`;
    } else {
      const matchDate = new Date(match.utcDate);
      statusHTML = `<span class="status-scheduled">${matchDate.getHours()}:${String(matchDate.getMinutes()).padStart(2, "0")}</span>`;
    }

    scoresHTML += `
      <div class="match">
        <div class="match-league">Bundesliga</div>
        <div class="match-row">
          <div class="team-name">${match.homeTeam.name}</div>
          <div class="team-score">${homeScore}</div>
          <div class="match-status">
            ${statusHTML}
          </div>
          <div class="team-score">${awayScore}</div>
          <div class="team-name" style="text-align: right">${match.awayTeam.name}</div>
        </div>
      </div>
    `;
  });

  scoresHTML += `<a class="scores-view-all" href="#">View all scores →</a>`;

  scoresWidget.innerHTML = scoresHTML;
}

/**
 * Aktualisiert die Highlights-Sektion
 */
async function updateHighlights() {
  // Suche nach den neuesten Bundesliga-Highlights
  const highlights = await fetchYouTubeHighlights("Bundesliga");

  if (highlights.length === 0) return;

  // Erstelle einen neuen Container für Highlights, falls nicht vorhanden
  let highlightsSection = document.getElementById("highlights-section");

  if (!highlightsSection) {
    const main = document.querySelector("main");
    highlightsSection = document.createElement("div");
    highlightsSection.id = "highlights-section";
    highlightsSection.className = "highlights-section";
    main.insertAdjacentElement("beforeend", highlightsSection);
  }

  const highlightsHTML = `
    <div class="section-head">
      <div class="section-title">Latest Highlights</div>
      <a class="section-more" href="https://www.youtube.com/results?search_query=Bundesliga+highlights" target="_blank">All Highlights →</a>
    </div>
    <div class="highlights-grid">
      ${highlights.map((video) => createHighlightCard(video)).join("")}
    </div>
  `;

  highlightsSection.innerHTML = highlightsHTML;
}

/**
 * Initialisiert alle Updates beim Laden
 */
async function initializeDataUpdates() {
  console.log("🔄 Starte Daten-Updates...");

  // Erste Ladung
  await updateNewsSection();
  await updateLiveScores();
  // await updateHighlights(); // Kommentiert bis API-Key gesetzt

  // Aktualisiere alle 5 Minuten
  setInterval(
    async () => {
      console.log("🔄 Aktualisiere Daten...");
      await updateNewsSection();
      await updateLiveScores();
    },
    5 * 60 * 1000,
  );
}

// Starte Updates wenn DOM bereit ist
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDataUpdates);
} else {
  initializeDataUpdates();
}
