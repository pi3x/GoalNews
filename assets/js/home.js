// ===== Firebase & Live Games Setup =====
import { fetchJsonCached, currentSeasonStart } from './data-cache.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  limit,
  onSnapshot,
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBmIcdFtxv4jBJKdiAkEiwnkQ8yRwiG_0w',
  authDomain: 'goalnewsde-community.firebaseapp.com',
  projectId: 'goalnewsde-community',
  storageBucket: 'goalnewsde-community.firebasestorage.app',
  messagingSenderId: '134523022055',
  appId: '1:134523022055:web:4f35ed7812d06e4fb55042',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

const favoriteGameNotice = document.getElementById('favoriteGameNotice');
const favoriteGameTitle = document.getElementById('favoriteGameTitle');
const favoriteGameText = document.getElementById('favoriteGameText');
const siteUpdateNotice = document.getElementById('siteUpdateNotice');

let observedFavoriteTeam = null;
let favoriteGameTimer = null;
let stopFriendRequests = null;
let syncedFriendProfileName = '';
let dismissedRequestIds = new Set();
let incomingRequestIds = [];

async function loadSiteUpdate() {
  try {
    const updateSnap = await getDoc(doc(db, 'siteUpdates', 'current'));
    if (!updateSnap.exists()) return;
    const update = updateSnap.data();
    const updateId = String(update.updateId || '');
    if (!update.active || !updateId) return;
    try {
      if (localStorage.getItem('goalnews.seenSiteUpdate') === updateId) return;
      // Mark it as seen as soon as it is shown, so it won't return on reload.
      localStorage.setItem('goalnews.seenSiteUpdate', updateId);
    } catch (error) {
      console.warn(
        'Update-Status konnte nicht lokal gespeichert werden:',
        error,
      );
    }

    document.getElementById('siteUpdateTitle').textContent = String(
      update.title || 'Neu bei GoalNews',
    ).slice(0, 80);
    document.getElementById('siteUpdateText').textContent = String(
      update.text || '',
    ).slice(0, 400);
    const link = document.getElementById('siteUpdateLink');
    const linkUrl = String(update.linkUrl || '').trim();
    const linkLabel = String(update.linkLabel || '').trim();
    try {
      const safeUrl = new URL(linkUrl);
      if (safeUrl.protocol === 'https:' && linkLabel) {
        link.href = safeUrl.href;
        link.textContent = `${linkLabel} ↗`;
        link.hidden = false;
      }
    } catch {
      /* Links are optional. */
    }
    siteUpdateNotice.hidden = false;
  } catch (error) {
    console.warn('Neuigkeiten-Hinweis konnte nicht geladen werden:', error);
  }
}
document.getElementById('siteUpdateDismiss').addEventListener('click', () => {
  siteUpdateNotice.hidden = true;
});
loadSiteUpdate();

function normalizeTeamName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('de')
    .replace(/[^a-z0-9]/g, '');
}

async function updateFavoriteGameNotice(team) {
  favoriteGameNotice.hidden = false;
  if (!team) {
    favoriteGameTitle.textContent =
      '⚽ Spielhinweis für deinen Lieblingsverein';
    favoriteGameText.textContent =
      'Lege deinen Lieblingsverein im GoalNews-Dashboard fest, um passende Spiele hier zu sehen.';
    return;
  }
  try {
    const season = currentSeasonStart();
    const [firstLeague, secondLeague] = await Promise.all(
      ['bl1', 'bl2'].map((league) =>
        fetchJsonCached(
          `https://api.openligadb.de/getmatchdata/${league}/${season}`,
          { ttlMs: 60 * 1000 },
        ),
      ),
    );
    const matches = [...firstLeague.data, ...secondLeague.data];
    const now = Date.now();
    const match = matches.find((item) => {
      const start = new Date(item.matchDateTime).getTime();
      const teams = `${item.team1?.teamName || ''} ${item.team2?.teamName || ''}`;
      return (
        start > now &&
        start <= now + 24 * 60 * 60 * 1000 &&
        normalizeTeamName(teams).includes(normalizeTeamName(team))
      );
    });
    favoriteGameTitle.textContent = match
      ? `⚽ ${team} spielt in den nächsten 24 Stunden!`
      : `⚽ Kein Spiel von ${team} in den nächsten 24 Stunden`;
    favoriteGameText.textContent = match
      ? `${match.team1.teamName} – ${match.team2.teamName} · ${new Date(match.matchDateTime).toLocaleString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
      : 'Der Spielplan wird automatisch aktualisiert.';
  } catch (error) {
    console.error(
      'Lieblingsverein-Spielplan konnte nicht geladen werden:',
      error,
    );
    favoriteGameTitle.textContent = '⚽ Spielplan momentan nicht verfügbar';
    favoriteGameText.textContent =
      'Bitte lade die Startseite später erneut, um den Spielplan zu prüfen.';
  }
}

// Während der Entwicklung deaktiviert. Für den normalen Betrieb auf false setzen.
const DEVELOPMENT_MODE = false;

// ===== Maintenance Redirect =====
function watchMaintenance() {
  const docRef = doc(db, 'settings', 'main');
  onSnapshot(docRef, (snap) => {
    if (!snap.exists()) return console.error('Einstellungen nicht gefunden');
    const data = snap.data();
    if (data.maintenance) window.location.href = 'pages/wartungsarbeiten.html';
  });
}
if (!DEVELOPMENT_MODE) watchMaintenance();

// ===== Breaking News Toggle =====
const breakingEl = document.getElementById('breakingNews');
const userGreeting = document.getElementById('userGreeting');
const friendRequestNotice = document.getElementById('friendRequestNotice');
onAuthStateChanged(auth, (user) => {
  if (stopFriendRequests) {
    stopFriendRequests();
    stopFriendRequests = null;
  }
  syncedFriendProfileName = '';
  dismissedRequestIds = new Set();
  incomingRequestIds = [];
  friendRequestNotice.hidden = true;
  if (!user || user.isAnonymous) {
    userGreeting.hidden = true;
    userGreeting.textContent = '';
    breakingEl.classList.add('locked');
    favoriteGameNotice.hidden = true;
    observedFavoriteTeam = null;
    if (favoriteGameTimer) window.clearInterval(favoriteGameTimer);
    favoriteGameTimer = null;
    return;
  }
  userGreeting.hidden = false;
  userGreeting.textContent = `Hallo, ${user.displayName || user.email?.split('@')[0] || 'Fußballfan'}`;
  const userRef = doc(db, 'users', user.uid);
  onSnapshot(userRef, (snap) => {
    const data = snap.data() || {};
    const username = String(
      data.username ||
        user.displayName ||
        user.email?.split('@')[0] ||
        'Fußballfan',
    ).slice(0, 40);
    userGreeting.textContent = `Hallo, ${username}`;
    if (username && username !== syncedFriendProfileName) {
      syncedFriendProfileName = username;
      const profileRef = doc(db, 'friendProfiles', user.uid);
      getDoc(profileRef)
        .then((profileSnap) => {
          const lower = username.toLowerCase();
          if (
            !profileSnap.exists() ||
            profileSnap.data().username !== username ||
            profileSnap.data().usernameLower !== lower
          ) {
            return setDoc(
              profileRef,
              {
                uid: user.uid,
                username,
                usernameLower: lower,
                updatedAt: serverTimestamp(),
              },
              { merge: true },
            );
          }
        })
        .catch((error) =>
          console.warn(
            'Freundesuche-Profil konnte auf der Startseite nicht synchronisiert werden.',
            error,
          ),
        );
    }
    breakingEl.classList.toggle('locked', !data.breakingNews);
    const team = String(data.favTeam || '').trim();
    if (team !== observedFavoriteTeam) {
      observedFavoriteTeam = team;
      updateFavoriteGameNotice(team);
      if (favoriteGameTimer) window.clearInterval(favoriteGameTimer);
      favoriteGameTimer = window.setInterval(
        () => updateFavoriteGameNotice(observedFavoriteTeam),
        5 * 60 * 1000,
      );
    }
  });
  const requestQuery = query(
    collection(db, 'friendships'),
    where('members', 'array-contains', user.uid),
    limit(60),
  );
  stopFriendRequests = onSnapshot(
    requestQuery,
    (snapshot) => {
      const incoming = snapshot.docs.filter(
        (item) =>
          item.data().toUid === user.uid && item.data().status === 'pending',
      );
      const ids = new Set(incoming.map((item) => item.id));
      incomingRequestIds = [...ids];
      const newIds = [...ids].filter((id) => !dismissedRequestIds.has(id));
      if (incoming.length) {
        document.getElementById('friendRequestText').textContent =
          incoming.length === 1
            ? 'Du hast eine neue Anfrage.'
            : `Du hast ${incoming.length} offene Anfragen.`;
        friendRequestNotice.hidden = newIds.length === 0;
      } else {
        friendRequestNotice.hidden = true;
        dismissedRequestIds.clear();
      }
    },
    (error) =>
      console.warn(
        'Freundschaftsanfragen konnten nicht geladen werden.',
        error,
      ),
  );
});
document.getElementById('friendRequestClose').addEventListener('click', () => {
  friendRequestNotice.hidden = true;
  incomingRequestIds.forEach((id) => dismissedRequestIds.add(id));
});

// ===== Live Games Rendering =====
const tableBody = document.getElementById('tableBody');
const breakingNewsWrapper = document.querySelector(
  '#breakingNews .news-wrapper',
);
const season = currentSeasonStart();
const leagueTables = new Map();
const seasonMatchesUrls = {
  bl1: `https://api.openligadb.de/getmatchdata/bl1/${season}`,
  bl2: `https://api.openligadb.de/getmatchdata/bl2/${season}`,
};
let latestMatches = [];

function setMessage(container, message, className = 'ticker-empty') {
  const paragraph = document.createElement('p');
  paragraph.className = className;
  paragraph.textContent = message;
  container.replaceChildren(paragraph);
}

function renderTablePreview(league) {
  const container = document.getElementById(`tablePreview-${league}`);
  const teams = (leagueTables.get(league) || []).slice(0, 5);
  if (!teams.length) {
    setMessage(container, 'Tabellendaten momentan nicht verfügbar.');
    return;
  }
  container.replaceChildren();
  const labels = document.createElement('div');
  labels.className = 'preview-row preview-labels';
  for (const value of ['Platz', 'Verein', 'Sp.', 'Pkt.']) {
    const cell = document.createElement('span');
    cell.textContent = value;
    labels.appendChild(cell);
  }
  container.appendChild(labels);
  teams.forEach((team, index) => {
    const row = document.createElement('div');
    row.className = 'preview-row';
    const rank = document.createElement('span');
    rank.className = 'preview-rank';
    rank.textContent = String(index + 1);
    const name = document.createElement('span');
    name.className = 'preview-team';
    name.textContent = team.teamName || 'Unbekannter Verein';
    const played = document.createElement('span');
    played.className = 'preview-played';
    played.textContent = String(team.matches ?? '–');
    const points = document.createElement('span');
    points.className = 'preview-points';
    points.textContent = String(team.points ?? '–');
    row.append(rank, name, played, points);
    container.appendChild(row);
  });
}

async function loadLeaguePreviews() {
  await Promise.all(
    ['bl1', 'bl2'].map(async (league) => {
      try {
        const result = await fetchJsonCached(
          `https://api.openligadb.de/getbltable/${league}/${season}`,
          { ttlMs: 4 * 60 * 1000 },
        );
        leagueTables.set(league, result.data);
      } catch (error) {
        console.warn(
          `Tabellendaten für den Experten-Tipp (${league}) derzeit nicht verfügbar:`,
          error,
        );
        leagueTables.set(league, []);
      }
    }),
  );
}

function renderBreakingNews(matches) {
  const now = Date.now();
  const headlines = matches
    .filter((match) => {
      const started = new Date(match.matchDateTime).getTime();
      const hasResult = (match.matchResults || []).some(
        (result) => result.resultTypeID === 2,
      );
      const isLiveWindow = started <= now && now - started < 3 * 60 * 60 * 1000;
      return hasResult || isLiveWindow;
    })
    .sort((a, b) => new Date(b.matchDateTime) - new Date(a.matchDateTime))
    .slice(0, 8);

  breakingNewsWrapper.replaceChildren();
  if (!headlines.length) {
    const item = document.createElement('span');
    item.className = 'news-item';
    item.textContent =
      'Breaking News · Zurzeit keine aktuellen Bundesliga-Spielmeldungen';
    breakingNewsWrapper.appendChild(item);
    return;
  }

  headlines.forEach((match) => {
    const finalResult = (match.matchResults || []).find(
      (result) => result.resultTypeID === 2,
    );
    const goals = Array.isArray(match.goals) ? match.goals : [];
    const latestGoal = goals[goals.length - 1];
    const score = latestGoal
      ? `${latestGoal.scoreTeam1}:${latestGoal.scoreTeam2}`
      : finalResult
        ? `${finalResult.pointsTeam1}:${finalResult.pointsTeam2}`
        : 'LIVE';
    const item = document.createElement('span');
    item.className = 'news-item';
    item.textContent = `Breaking News · ${match.team1?.teamName || 'Unbekannt'} ${score} ${match.team2?.teamName || 'Unbekannt'}${match.leagueShortcut ? ` · ${match.leagueShortcut.toUpperCase()}` : ''}`;
    breakingNewsWrapper.appendChild(item);
  });
}

function createMatchRow(match, now) {
  const row = document.createElement('tr');
  const home = document.createElement('td');
  const away = document.createElement('td');
  const info = document.createElement('td');
  const homeName = document.createElement('div');
  homeName.className = 'team-name';
  homeName.textContent = match.team1?.teamName || 'Unbekannt';
  const awayName = document.createElement('div');
  awayName.className = 'team-name';
  awayName.textContent = match.team2?.teamName || 'Unbekannt';
  const homeCity = document.createElement('small');
  homeCity.textContent =
    match.leagueName ||
    match.leagueShortcut ||
    match.location?.locationCity ||
    '';
  const awayVenue = document.createElement('small');
  awayVenue.textContent = match.location?.locationStadium || '';
  home.append(homeName, homeCity);
  away.append(awayName, awayVenue);

  const goals = Array.isArray(match.goals) ? match.goals : [];
  const results = Array.isArray(match.matchResults) ? match.matchResults : [];
  const finalResult = results.find((result) => result.resultTypeID === 2);
  const lastGoal = goals[goals.length - 1];
  let score = '– : –';
  if (lastGoal) score = `${lastGoal.scoreTeam1} : ${lastGoal.scoreTeam2}`;
  else if (finalResult)
    score = `${finalResult.pointsTeam1} : ${finalResult.pointsTeam2}`;

  const start = new Date(match.matchDateTime).getTime();
  const upcoming = start > now;
  if (upcoming) row.classList.add('upcoming-row');
  let state =
    'Anstoß ' +
    new Date(match.matchDateTime).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  if (finalResult) state = 'Beendet';
  else if (start <= now && now - start < 3 * 60 * 60 * 1000)
    state = `LIVE${match.matchMinute ? ` · ${match.matchMinute}'` : ''}`;
  else if (start < now) state = 'Ergebnis ausstehend';

  const scoreLine = document.createElement('strong');
  scoreLine.textContent = score;
  const stateLine = document.createElement('div');
  const stateText = document.createElement('small');
  stateText.textContent = upcoming
    ? `🕒 ANSTOSS ${new Date(match.matchDateTime).toLocaleString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
    : state;
  if (upcoming) stateText.className = 'match-kickoff';
  stateLine.appendChild(stateText);
  info.append(scoreLine, stateLine);
  if (upcoming) {
    const forecast = calculateForecast(match);
    const tip = document.createElement('div');
    tip.className = 'algorithm-tip';
    tip.textContent = `🤖 Algorithmus-Tipp: ${forecast.homeGoals}:${forecast.awayGoals} · ${forecast.outcome}`;
    info.appendChild(tip);
  }
  goals.forEach((goal) => {
    const event = document.createElement('div');
    event.className = 'match-event';
    event.textContent = `${goal.matchMinute ?? ''}' ${goal.goalGetterName || 'Tor'} (${goal.scoreTeam1}:${goal.scoreTeam2})`;
    info.appendChild(event);
  });
  row.append(home, away, info);
  return row;
}

function calculateForecast(match) {
  const league = String(match.leagueShortcut || 'bl1').toLowerCase();
  const table = leagueTables.get(league) || [];
  const normalize = (value) =>
    String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  const home = table.find(
    (team) => normalize(team.teamName) === normalize(match.team1?.teamName),
  );
  const away = table.find(
    (team) => normalize(team.teamName) === normalize(match.team2?.teamName),
  );
  const average = (team, field, fallback) =>
    team && Number(team.matches) > 0
      ? Number(team[field] || 0) / Number(team.matches)
      : fallback;
  const homeExpected =
    (average(home, 'goals', 1.35) + average(away, 'opponentGoals', 1.35)) / 2 +
    0.18;
  const awayExpected =
    (average(away, 'goals', 1.2) + average(home, 'opponentGoals', 1.2)) / 2;
  const homeGoals = Math.max(0, Math.min(5, Math.round(homeExpected)));
  const awayGoals = Math.max(0, Math.min(5, Math.round(awayExpected)));
  const outcome =
    homeGoals > awayGoals
      ? `Sieg ${match.team1?.teamName || 'Heimteam'}`
      : homeGoals < awayGoals
        ? `Sieg ${match.team2?.teamName || 'Auswärtsteam'}`
        : 'Unentschieden';
  return { homeGoals, awayGoals, outcome };
}

async function loadBundesligaMatches(force = false) {
  try {
    await loadLeaguePreviews();
    renderTablePreview('bl1');
    renderTablePreview('bl2');
    const [firstLeague, secondLeague] = await Promise.all([
      fetchJsonCached(seasonMatchesUrls.bl1, {
        ttlMs: 5 * 60 * 1000,
        force,
      }),
      fetchJsonCached(seasonMatchesUrls.bl2, {
        ttlMs: 5 * 60 * 1000,
        force,
      }),
    ]);
    latestMatches = [...firstLeague.data, ...secondLeague.data];
    renderBreakingNews(latestMatches);
    const now = Date.now();
    const orderedMatches = [...latestMatches].sort(
      (a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime),
    );
    const liveMatches = orderedMatches.filter((match) => {
      const start = new Date(match.matchDateTime).getTime();
      const finished = (match.matchResults || []).some(
        (result) => result.resultTypeID === 2,
      );
      return !finished && start <= now && now - start < 3 * 60 * 60 * 1000;
    });
    const recentResults = orderedMatches
      .filter(
        (match) =>
          (match.matchResults || []).some(
            (result) => result.resultTypeID === 2,
          ) && new Date(match.matchDateTime).getTime() < now,
      )
      .slice(-12);
    const nextMatches = orderedMatches
      .filter((match) => new Date(match.matchDateTime).getTime() >= now)
      .slice(0, 12);
    const visible = [
      ...new Map(
        [...recentResults, ...liveMatches, ...nextMatches].map((match) => [
          match.matchID,
          match,
        ]),
      ).values(),
    ].sort((a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));
    if (!visible.length) {
      setMessage(
        tableBody,
        'Für diese Saison sind noch keine Spiele eingetragen.',
      );
    } else {
      tableBody.replaceChildren(
        ...visible.map((match) => createMatchRow(match, now)),
      );
    }
  } catch (error) {
    console.error('Bundesliga-Spiele konnten nicht geladen werden:', error);
    if (!latestMatches.length)
      setMessage(
        tableBody,
        'Spieldaten momentan nicht erreichbar. Bitte später erneut laden.',
        'error-state',
      );
    renderTablePreview('bl1');
    renderTablePreview('bl2');
  }
}

loadBundesligaMatches();
window.setInterval(() => loadBundesligaMatches(), 60 * 1000);

// Hamburger-Menü
const burger = document.getElementById('burger');
const sideMenu = document.getElementById('sideMenu');
burger.addEventListener('click', () => {
  burger.classList.toggle('active');
  sideMenu.classList.toggle('active');
});
