import {
  currentSeasonStart,
  fetchJsonCached,
  formatUpdatedAt,
} from './data-cache.js';

const league = document.body.dataset.league;
const seasonStart = currentSeasonStart();
const tableBody = document.getElementById('tableBody');
const seasonLabel = document.getElementById('seasonLabel');
const statusLabel = document.getElementById('statusLabel');
const fixtureList = document.getElementById('fixtureList');
const fixtureStatus = document.getElementById('fixtureStatus');
const fixturesHeading = document.getElementById('fixturesHeading');
const refreshButton = document.getElementById('refreshButton');
const tableUrl = `https://api.openligadb.de/getbltable/${league}/${seasonStart}`;
const matchDataUrl = `https://api.openligadb.de/getmatchdata/${league}/${seasonStart}`;

let tableLoading = false;
let lastManualRefresh = 0;

seasonLabel.textContent = `${seasonStart}/${seasonStart + 1}`;

function appendCell(row, value, className = '') {
  const cell = document.createElement('td');
  if (className) cell.className = className;
  cell.textContent = value ?? '–';
  row.appendChild(cell);
  return cell;
}

function renderTable(teams, update) {
  tableBody.replaceChildren();

  if (!Array.isArray(teams) || teams.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');

    cell.colSpan = 9;
    cell.className = 'state';
    cell.textContent = 'Für diese Saison liegen noch keine Tabellendaten vor.';

    row.appendChild(cell);
    tableBody.appendChild(row);

    statusLabel.textContent = `Saison ${seasonStart}/${seasonStart + 1} · noch keine Tabelle`;
    return;
  }

  teams.forEach((team, index) => {
    const row = document.createElement('tr');
    const rank = index + 1;

    if (league === 'bl1') {
      if (rank <= 4) {
        row.classList.add('qualify-top');
      } else if (rank === 6) {
        // NEU: 6. Platz bekommt eine eigene Farbe
        row.classList.add('qualify-sixth');
      } else if (rank === 5) {
        row.classList.add('qualify-mid');
      } else if (rank === teams.length || rank === teams.length - 1) {
        row.classList.add('qualify-bottom');
      }
    } else {
      if (rank <= 2) {
        row.classList.add('qualify-top');
      } else if (rank === 3) {
        row.classList.add('qualify-mid');
      } else if (rank === teams.length || rank === teams.length - 1) {
        row.classList.add('qualify-bottom');
      }
    }

    appendCell(row, rank, 'rank');

    const teamCell = document.createElement('td');
    const teamWrap = document.createElement('div');

    teamWrap.className = 'team-cell';

    const name = document.createElement('span');
    name.textContent = team.teamName || 'Unbekannter Verein';

    teamWrap.appendChild(name);
    teamCell.appendChild(teamWrap);
    row.appendChild(teamCell);

    appendCell(row, team.matches);
    appendCell(row, team.won);
    appendCell(row, team.draw);
    appendCell(row, team.lost);
    appendCell(row, `${team.goals} : ${team.opponentGoals}`);
    appendCell(
      row,
      Number(team.goalDiff) > 0 ? `+${team.goalDiff}` : team.goalDiff,
    );
    appendCell(row, team.points, 'points');

    tableBody.appendChild(row);
  });

  const freshness = update.stale
    ? ' · gespeicherter Stand (API nicht erreichbar)'
    : '';

  statusLabel.textContent = `Stand: ${formatUpdatedAt(update.updatedAt)}${freshness}`;
}

async function loadTable(force = false) {
  if (tableLoading) return;

  tableLoading = true;
  refreshButton.disabled = true;
  refreshButton.textContent = force ? 'Aktualisiere …' : 'Lade Tabelle …';
  statusLabel.textContent = 'Tabelle wird geladen …';

  try {
    const update = await fetchJsonCached(tableUrl, {
      ttlMs: 4 * 60 * 1000,
      force,
    });

    renderTable(update.data, update);
  } catch (error) {
    console.error(`Tabelle ${league} konnte nicht geladen werden:`, error);

    tableBody.replaceChildren();

    const row = document.createElement('tr');
    const cell = document.createElement('td');

    cell.colSpan = 9;
    cell.className = 'state error';
    cell.textContent =
      'Die Tabelle ist gerade nicht erreichbar. Bitte versuche es später erneut.';

    row.appendChild(cell);
    tableBody.appendChild(row);

    statusLabel.textContent = 'Keine gespeicherten Daten verfügbar';
  } finally {
    tableLoading = false;
    refreshButton.disabled = false;
    refreshButton.textContent = 'Tabelle aktualisieren';
  }
}

async function loadFixtures() {
  try {
    const update = await fetchJsonCached(matchDataUrl, {
      ttlMs: 4 * 60 * 1000,
    });

    const now = Date.now();
    const matches = Array.isArray(update.data) ? update.data : [];

    const upcoming = matches
      .filter((match) => new Date(match.matchDateTime).getTime() >= now)
      .sort((a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));

    const hasUpcoming = upcoming.length > 0;

    const visible = (
      hasUpcoming
        ? upcoming.slice(0, 6)
        : matches
            .filter((match) => new Date(match.matchDateTime).getTime() < now)
            .sort(
              (a, b) => new Date(b.matchDateTime) - new Date(a.matchDateTime),
            )
    ).slice(0, 6);

    fixturesHeading.textContent = hasUpcoming
      ? 'Nächste Spiele'
      : 'Letzte Ergebnisse';

    fixtureStatus.textContent =
      `Stand: ${formatUpdatedAt(update.updatedAt)}` +
      (update.stale ? ' · gespeicherter Stand' : '');

    fixtureList.replaceChildren();

    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'state';
      empty.textContent =
        'Für diese Saison sind noch keine Spiele eingetragen.';

      fixtureList.appendChild(empty);
      return;
    }

    visible.forEach((match) => {
      const card = document.createElement('article');
      card.className = 'fixture';

      const date = document.createElement('span');
      date.className = 'fixture-date';

      date.textContent = new Date(match.matchDateTime).toLocaleString('de-DE', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });

      const content = document.createElement('div');
      const teams = document.createElement('div');

      teams.className = 'fixture-teams';
      teams.textContent = `${match.team1?.teamName || 'TBD'} – ${match.team2?.teamName || 'TBD'}`;

      content.appendChild(teams);

      if (!hasUpcoming) {
        const finalResult = (match.matchResults || []).find(
          (result) => result.resultTypeID === 2,
        );

        const goals = Array.isArray(match.goals) ? match.goals : [];
        const lastGoal = goals[goals.length - 1];

        const score = document.createElement('div');
        score.className = 'fixture-score';

        score.textContent = finalResult
          ? `${finalResult.pointsTeam1} : ${finalResult.pointsTeam2}`
          : lastGoal
            ? `${lastGoal.scoreTeam1} : ${lastGoal.scoreTeam2}`
            : 'Ergebnis noch nicht eingetragen';

        content.appendChild(score);
      }

      card.append(date, content);
      fixtureList.appendChild(card);
    });
  } catch (error) {
    console.error(`Spielplan ${league} konnte nicht geladen werden:`, error);

    fixturesHeading.textContent = 'Spielplan momentan nicht verfügbar';
    fixtureStatus.textContent = 'Keine gespeicherten Daten verfügbar';

    fixtureList.replaceChildren();

    const message = document.createElement('p');
    message.className = 'state error';
    message.textContent = 'Bitte lade die Seite später erneut.';

    fixtureList.appendChild(message);
  }
}

refreshButton.addEventListener('click', () => {
  const waitMs = 15 * 1000 - (Date.now() - lastManualRefresh);

  if (waitMs > 0) {
    statusLabel.textContent = `Bitte warte noch ${Math.ceil(waitMs / 1000)} Sekunden bis zur nächsten manuellen Aktualisierung.`;
    return;
  }

  lastManualRefresh = Date.now();
  loadTable(true);
});

loadTable();
loadFixtures();

window.setInterval(() => loadTable(), 5 * 60 * 1000);
window.setInterval(loadFixtures, 5 * 60 * 1000);
