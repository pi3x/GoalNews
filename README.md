# ⚽ GoalNews - Live Bundesliga News & Highlights

Eine moderne, vollständig responsive Fußball-News-Website mit **echten Bundesliga-Daten** und **YouTube-Highlights**, die sich automatisch nach jedem Spiel aktualisiert.

## 🎯 Features

### ✅ Echte Live-Daten

- **Bundesliga-Spielergebnisse** in Echtzeit via football-data.org API
- **Live-Score Updates** während des Spiels
- **Automatische Aktualisierung** alle 5 Minuten
- **Nach jedem Spiel** werden die News automatisch aktualisiert

### 🎬 YouTube-Highlights

- Automatische Suche nach den neuesten Bundesliga-Highlights
- Eingebettete Video-Vorschaubilder
- Direktlinks zu YouTube
- Alle 5 Minuten aktualisiert

### 📱 Design & UX

- Vollständig responsive (Mobile, Tablet, Desktop)
- Dunkles Premium-Design mit Gold-Accents
- Smooth Animations & Transitions
- Dark Mode (bereits implementiert)
- Moderne Grid-Layouts

### 🎬 Ticker & Live-Badge

- Blinkendes "Live Scores" Badge
- Scrollender Ticker mit Breaking News
- Status-Indikatoren (Live, FT, Scheduled)

---

## 🚀 Quick Start

### 1️⃣ Mit Demo-Mode starten (0 Minuten Setup)

Die Website funktioniert sofort mit Mock-Daten:

```bash
cd /Users/pietkettenbach/GoalNews
python -m http.server 8000
# Öffne dann: http://localhost:8000
```

**Demo-Features:**

- ✅ News aktualisieren sich alle 5 Minuten
- ✅ Live-Scores funktionieren
- ✅ YouTube-Highlights-Grid funktioniert
- ✅ Alles ist responsiv und designt

---

### 2️⃣ Mit echten Daten (5 Minuten Setup)

#### Schritt 1: Football-Data.org API-Key

1. Gehe zu: https://www.football-data.org/client/register
2. Registriere dich kostenlos
3. Kopiere deinen **API-Key**
4. Öffne `api.js` und ersetze auf Zeile 9:

```javascript
// VOR:
apiKey: 'YOUR_API_KEY_HERE',

// NACH (ersetze mit deinem Key):
apiKey: 'abc123def456xyz789',
```

#### Schritt 2: YouTube-API-Key (Optional)

1. Gehe zu: https://console.cloud.google.com
2. Erstelle ein neues Projekt
3. Suche nach "YouTube Data API v3" und aktiviere sie
4. Erstelle einen API-Key unter "Anmeldedaten"
5. Kopiere den Key in `api.js` auf Zeile 13:

```javascript
// VOR:
apiKey: 'YOUR_YOUTUBE_API_KEY_HERE',

// NACH:
apiKey: 'AIza...',
```

6. Uncommente in `api.js` Zeile 131:

```javascript
// await updateHighlights();

// Zu:
await updateHighlights();
```

#### Schritt 3: Demo-Mode ausschalten

Öffne `demo.js` und ändere Zeile 10 zu:

```javascript
const USE_DEMO_MODE = false; // War true
```

Fertig! Die Seite aktualisiert sich jetzt alle 5 Minuten mit echten Daten. 🎉

---

## 📂 Dateistruktur

```
GoalNews/
├── index.html          # Haupt-Website (alle HTML/CSS)
├── api.js              # API-Integration & Daten-Abrufe
├── demo.js             # Demo-Mode mit Mock-Daten
├── SETUP.md            # Detaillierte Setup-Anleitung
├── README.md           # Diese Datei
└── (Weitere Assets, falls nötig)
```

---

## 🔄 Update-Logik

```
┌─────────────────────────────────────┐
│  Seite wird geladen                 │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  api.js wird geladen                │
│  (Falls USE_DEMO_MODE=true:         │
│   nutze Mock-Daten)                 │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  initializeDataUpdates() startet:   │
│  • updateNewsSection()              │
│  • updateLiveScores()               │
│  • updateHighlights()               │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Alle 5 Minuten:                    │
│  • Neue Spieldaten abrufen          │
│  • News aktualisieren               │
│  • Live-Scores updaten              │
└─────────────────────────────────────┘
```

---

## 🌍 Deployment-Optionen

### Option 1: Netlify (Empfohlen) 🎯

```bash
# 1. Gehe zu https://netlify.com
# 2. Ziehe GoalNews-Ordner hinein
# 3. Deine Seite ist live mit HTTPS!
```

**Vorteil:** Kostenlos, automatisches HTTPS, CDN

### Option 2: GitHub Pages

```bash
# 1. Pushe deinen Code auf GitHub:
git init
git add .
git commit -m "Initial commit"
git push -u origin main

# 2. Gehe zu: Settings > Pages
# 3. Wähle Branch: main
# 4. Seite ist unter github.com/username/GoalNews erreichbar
```

### Option 3: Lokal mit Python

```bash
python -m http.server 8000
# Öffne: http://localhost:8000
```

### Option 4: Node.js

```bash
npx http-server
# Öffne: http://localhost:8080
```

---

## 📊 API-Quellen & Limits

| API                   | Quelle                      | Daten | Kostenlos            | Limit    | Update |
| --------------------- | --------------------------- | ----- | -------------------- | -------- | ------ |
| **football-data.org** | Bundesliga-Spiele, Tabellen | ✅    | 10 Req/Min           | Sehr gut |
| **YouTube Data API**  | Highlights-Videos           | ✅    | 10.000 Einheiten/Tag | ~täglich |

---

## 🎨 Anpassungen & Customizing

### Nur Bayern München anzeigen

In `api.js`, `updateNewsSection()`:

```javascript
const finishedMatches = matches
  .filter(
    (m) =>
      m.status === "FINISHED" && (m.homeTeam.id === 4 || m.awayTeam.id === 4),
  ) // Bayern = ID 4
  .slice(0, 4);
```

### Update-Häufigkeit ändern

In `api.js`, am Ende von `initializeDataUpdates()`:

```javascript
// Von alle 5 Minuten zu alle 1 Minute:
setInterval(
  async () => {
    // ...
  },
  1 * 60 * 1000,
); // War 5 * 60 * 1000
```

### Farbschema ändern

In `index.html`, `<style>` Abschnitt:

```css
:root {
  --pitch: #0a6e35; /* Grün → andere Farbe */
  --gold: #f5c842; /* Gold → andere Farbe */
  --red: #e63323; /* Rot → andere Farbe */
  --bg: #0f0f0f; /* Schwarz → andere Farbe */
}
```

### Ligaauswahl ändern

In `api.js`:

```javascript
// Bundesliga = 425
// Premier League = 39
// La Liga = 140
// Serie A = 135
// Ligue 1 = 61
// Champions League = 8

const BUNDESLIGA_COMPETITION_ID = 425; // Ändern für andere Liga
```

---

## 🐛 Troubleshooting

### ❌ "Fehler beim Abrufen der Spiele"

**Ursache:** API-Key ist falsch oder nicht gesetzt  
**Lösung:** Überprüfe `api.js` Zeile 9, API-Key muss korrekt kopiert sein

### ❌ "CORS Error" in der Konsole

**Ursache:** Server erlaubt Cross-Origin Anfragen nicht  
**Lösung:**

- Nutze einen kostenlosen CORS-Proxy: `https://cors-anywhere.herokuapp.com/`
- Oder deploye auf Netlify/GitHub Pages statt lokal

### ❌ YouTube-Highlights funktionieren nicht

**Ursache:** YouTube API nicht aktiviert oder Key falsch  
**Lösung:**

1. Öffne https://console.cloud.google.com
2. Überprüfe, dass "YouTube Data API v3" aktiviert ist
3. Überprüfe den API-Key in `api.js`

### ❌ News aktualisieren sich nicht

**Ursache:** Demo-Mode ist aktiv oder API-Limit erreicht  
**Lösung:**

- Überprüfe `demo.js` Zeile 10: `USE_DEMO_MODE = false`
- Warte 1 Minute für nächstes Update
- Öffne Browser-Konsole (F12) für Debug-Ausgaben

---

## 💡 Best Practices

### 🔐 API-Keys schützen

Wenn du die Seite öffentlich machst, nutze einen Backend-Server:

```javascript
// NICHT:
const apiKey = "abc123"; // Sichtbar im Code!

// JA:
fetch("/api/matches"); // Backend handhabt API-Keys
```

### ⚡ Performance optimieren

- Cache Anfragen mit `localStorage`
- Nutze mehrere API-Keys für höhere Limits
- Bilder/Videos vor-laden

### 📱 Mobile-First

- Die Seite ist bereits responsive
- Teste auf verschiedenen Bildschirmgrößen

---

## 📚 Weitere Ressourcen

- 📖 **Football-Data.org API Docs:** https://www.football-data.org/documentation/api
- 🎬 **YouTube API Docs:** https://developers.google.com/youtube/v3
- 🚀 **Netlify Hosting:** https://netlify.com
- 💻 **GitHub Pages:** https://pages.github.com

---

## 📝 Lizenz & Credits

**GoalNews** - Erstellt mit ❤️ für Fußball-Fans

Dataquellen:

- **football-data.org** - Bundesliga & weitere europäische Ligen
- **YouTube Data API** - Highlights & Inhalte

---

## 🎯 Roadmap

- [ ] User-Benachrichtigungen für neue Spiele
- [ ] Spieler-Profile & Statistiken
- [ ] Fantasy-Tipps & Wetten
- [ ] Dunkler/Heller Modus Toggle
- [ ] Push-Notifications bei Live-Spielen
- [ ] Sprachauswahl (DE/EN/ES/FR)
- [ ] Offline-Unterstützung mit Service Worker
- [ ] Native Mobile Apps (React Native)

---

**Viel Spaß mit GoalNews! ⚽🎉**

Hast du Fragen? Schaue in `SETUP.md` nach oder öffne die Browser-Konsole (F12) um Fehler zu sehen.
