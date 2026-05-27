# GoalNews - API Setup Anleitung

Diese Seite verwendet echte Bundesliga-Daten und YouTube-Highlights, die sich automatisch aktualisieren.

## 🔧 Erforderliche API-Keys

### 1. Football-Data.org API (Bundesliga Spielergebnisse)

**Schritt 1:** Besuche https://www.football-data.org/client/register  
**Schritt 2:** Erstelle einen kostenlosen Account  
**Schritt 3:** Kopiere deinen API-Key  
**Schritt 4:** Öffne `api.js` und ersetze:

```javascript
apiKey: "YOUR_API_KEY_HERE";
```

mit deinem echten API-Key:

```javascript
apiKey: "abc123def456"; // Dein tatsächlicher Key
```

**Kostenlos verfügbar:** 10 Anfragen pro Minute

### 2. YouTube API (Optional - für Highlights)

**Schritt 1:** Gehe zu https://console.cloud.google.com  
**Schritt 2:** Erstelle ein neues Projekt  
**Schritt 3:** Aktiviere die "YouTube Data API v3"  
**Schritt 4:** Erstelle einen API-Key (Anmeldedaten → API-Keys)  
**Schritt 5:** Ersetze in `api.js`:

```javascript
key: "YOUR_YOUTUBE_API_KEY_HERE";
```

mit deinem Key.

Danach kannst du diese Zeile in `api.js` uncommentten:

```javascript
await updateHighlights(); // Jetzt aktiviert
```

## 📊 Funktionen

### ✅ Automatische Updates

- **News:** Aktualisiert alle 5 Minuten
- **Live-Scores:** Zeigt aktuelle Bundesliga-Spiele
- **Nach jedem Spiel:** Die Seite wird automatisch aktualisiert

### 📺 Live-Daten

- Aktuelle Bundesliga-Spielergebnisse
- Live-Score Updates während des Spiels
- Spielzeiten und Status (Live, FT, Scheduled)

### 🎬 YouTube-Highlights

- Automatische Suche nach den neuesten Bundesliga-Highlights
- Direkter Link zu YouTube
- Video-Vorschaubilder

## 🚀 Deployment

### Option 1: Lokal testen

```bash
# Mit Python 3
python -m http.server 8000

# Mit Node.js
npx http-server
```

Dann öffne: `http://localhost:8000`

### Option 2: Kostenlos hosten

**Netlify (empfohlen):**

1. Gehe zu https://netlify.com
2. Ziehe dein GoalNews-Verzeichnis hinein
3. Fertig! (Kostenlos mit HTTPS)

**GitHub Pages:**

1. Lade den Code auf GitHub hoch
2. Aktiviere "GitHub Pages" in den Einstellungen
3. Deine Seite ist unter `username.github.io/GoalNews` erreichbar

## 🔍 Debugging

Öffne die Browser-Konsole (F12) um Fehler zu sehen:

- `Fehler beim Abrufen der Spiele:` → API-Key ist falsch
- `CORS Error` → Server erlaubt Anfragen nicht → nutze einen Proxy

## 📝 API-Datenquellen

| Quelle            | Daten                      | Kostenlos | Update-Häufigkeit |
| ----------------- | -------------------------- | --------- | ----------------- |
| football-data.org | Bundesliga-Spiele, Tabelle | ✅        | Live              |
| YouTube API       | Highlights-Videos          | ✅        | ~täglich          |

## ⚙️ Erweiterte Anpassungen

### Alle 2 Minuten statt 5 aktualisieren:

In `api.js`, ändere:

```javascript
setInterval(
  async () => {
    // ...
  },
  2 * 60 * 1000,
); // War 5, jetzt 2
```

### Nur bestimmte Teams anzeigen:

In `updateNewsSection()`:

```javascript
const finishedMatches = matches
  .filter(
    (m) =>
      m.status === "FINISHED" && (m.homeTeam.id === 4 || m.awayTeam.id === 4),
  ) // Bayern München (ID 4)
  .slice(0, 4);
```

### Mehr Highlights anzeigen:

In `createHighlightCard()`:

```javascript
maxResults: 10, // War 5
```

## 🆘 Häufige Probleme

**Problem:** "API-Key ist ungültig"  
**Lösung:** Registriere dich erneut und kopiere den Key exakt

**Problem:** Keine Daten werden geladen  
**Lösung:** Öffne Browser-Konsole (F12) und schau nach Fehlermeldungen

**Problem:** YouTube-Highlights funktionieren nicht  
**Lösung:** Überprüfe, ob die YouTube-API aktiviert ist

## 📱 Responsive Design

Die Seite ist vollständig responsive und funktioniert auf:

- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

## 💡 Tipps

- Verwende mehrere API-Keys für höhere Limits
- Cachen Sie Anfragen um Quota zu sparen
- Nutzen Sie einen kostenlosen Proxy-Service bei CORS-Problemen

---

**Benötigst du Hilfe?** Konsultiere die API-Dokumentationen:

- https://www.football-data.org/documentation/api
- https://developers.google.com/youtube/v3
