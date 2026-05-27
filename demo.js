/**
 * Demo-Mode für Testzwecke
 * Verwendet Mock-Daten statt echter APIs
 * Aktiviere dies, wenn du noch keine API-Keys hast
 */

// Wechsle zu true für Demo-Modus
const USE_DEMO_MODE = true;

// Mock-Daten für Demo
const MOCK_MATCHES = [
  {
    id: 1,
    homeTeam: { name: "Bayern München", id: 4 },
    awayTeam: { name: "Borussia Dortmund", id: 5 },
    score: { fullTime: { home: 3, away: 1 } },
    status: "FINISHED",
    utcDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    minute: null,
  },
  {
    id: 2,
    homeTeam: { name: "RB Leipzig", id: 173 },
    awayTeam: { name: "Bayer Leverkusen", id: 1 },
    score: { fullTime: { home: 2, away: 2 } },
    status: "FINISHED",
    utcDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    minute: null,
  },
  {
    id: 3,
    homeTeam: { name: "SC Freiburg", id: 60 },
    awayTeam: { name: "Werder Bremen", id: 84 },
    score: { fullTime: { home: 1, away: 0 } },
    status: "FINISHED",
    utcDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    minute: null,
  },
  {
    id: 4,
    homeTeam: { name: "VfL Wolfsburg", id: 38 },
    awayTeam: { name: "Eintracht Frankfurt", id: 32 },
    score: { fullTime: { home: 2, away: 1 } },
    status: "FINISHED",
    utcDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    minute: null,
  },
  {
    id: 5,
    homeTeam: { name: "Borussia M'gladbach", id: 87 },
    awayTeam: { name: "1. FC Köln", id: 3 },
    score: { fullTime: null },
    status: "SCHEDULED",
    utcDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    minute: null,
  },
];

const MOCK_HIGHLIGHTS = [
  {
    id: { videoId: "dQw4w9WgXcQ" },
    snippet: {
      title: "Bayern München 3-1 Borussia Dortmund | Bundesliga Highlights",
      thumbnails: {
        medium: {
          url: "https://via.placeholder.com/320x180?text=Bayern+vs+BVB",
        },
      },
    },
  },
  {
    id: { videoId: "jNQXAC9IVRw" },
    snippet: {
      title: "RB Leipzig 2-2 Bayer Leverkusen | Match Highlights",
      thumbnails: {
        medium: {
          url: "https://via.placeholder.com/320x180?text=Leipzig+vs+Leverkusen",
        },
      },
    },
  },
  {
    id: { videoId: "9bZkp7q19f0" },
    snippet: {
      title: "SC Freiburg 1-0 Werder Bremen | All Goals & Highlights",
      thumbnails: {
        medium: {
          url: "https://via.placeholder.com/320x180?text=Freiburg+vs+Bremen",
        },
      },
    },
  },
  {
    id: { videoId: "ELMjJafKJgY" },
    snippet: {
      title: "Bundesliga Top 5 Moments dieser Woche | Best Goals",
      thumbnails: {
        medium: { url: "https://via.placeholder.com/320x180?text=Top+5+Goals" },
      },
    },
  },
  {
    id: { videoId: "tYzMGcUty6s" },
    snippet: {
      title: "VfL Wolfsburg 2-1 Eintracht Frankfurt | Extended Highlights",
      thumbnails: {
        medium: {
          url: "https://via.placeholder.com/320x180?text=Wolfsburg+vs+Frankfurt",
        },
      },
    },
  },
];

// Überschreibe die API-Funktionen mit Demo-Versionen
if (USE_DEMO_MODE) {
  console.log("🎬 Demo-Mode aktiviert - nutze Mock-Daten");

  window.fetchBundesligaMatches = async () => {
    console.log("📊 Lade Demo-Spieldaten...");
    await new Promise((r) => setTimeout(r, 500)); // Simuliere Netzwerk-Verzögerung
    return MOCK_MATCHES;
  };

  window.fetchYouTubeHighlights = async () => {
    console.log("🎬 Lade Demo-Highlights...");
    await new Promise((r) => setTimeout(r, 500));
    return MOCK_HIGHLIGHTS;
  };

  // Zeige Demo-Nachricht
  window.addEventListener("load", () => {
    const ticker = document.querySelector(".ticker-content");
    if (ticker) {
      const demoWarning = document.createElement("span");
      demoWarning.style.cssText =
        "background: #f5c842; color: #000; padding: 4px 10px; border-radius: 4px; margin-left: 20px;";
      demoWarning.textContent =
        "🎬 Demo-Mode: Mit echten APIs aktualisiert sich diese Seite alle 5 Minuten automatisch!";
      ticker.appendChild(demoWarning);
    }
  });
}
