function normalizeTeamName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("de")
    .replace(/[^a-z0-9]/g, "");
}

const TEAM_ALIAS_GROUPS = [
  ["borussiadortmund", "dortmund", "bvb", "bvb09", "bvb1909"],
  ["bayer04leverkusen", "bayerleverkusen", "leverkusen", "bayer04", "b04"],
  ["fcbayernmunchen", "bayernmunchen", "bayern", "fcb", "fcbayern"],
  ["rasenballsportleipzig", "rbleipzig", "leipzig", "rbl"],
  ["borussiamonchengladbach", "monchengladbach", "gladbach", "bmg"],
  ["eintrachtfrankfurt", "frankfurt", "sge"],
  ["scfreiburg", "freiburg", "scf"],
  ["vfb stuttgart", "vfb stuttgart", "stuttgart", "vfb"],
  ["vflwolfsburg", "wolfsburg", "wob"],
  ["werderbremen", "bremen", "werder", "svw"],
  ["unionberlin", "fcunionberlin", "1fcunionberlin", "union", "fcu"],
  ["hamburgersv", "hamburg", "hsv"],
  ["fcstpauli", "stpauli", "pauli", "fcsp"],
  ["fsvmainz05", "mainz05", "mainz", "fsv"],
  ["fcaugsburg", "augsburg", "fca"],
  ["tsghoffenheim", "hoffenheim", "tsg"],
  ["fcheidenheim", "heidenheim", "fch"],
  ["1fckoeln", "fckoeln", "koeln", "koln", "effzeh"],
  ["schalke04", "schalke", "s04"],
  ["herthabsc", "hertha", "herta"],
  ["hannover96", "hannover", "h96"],
  ["fckaiserslautern", "kaiserslautern", "fck"],
  ["vflbochum1848", "vflbochum", "bochum"],
  ["fortuna dusseldorf", "fortuna dusseldorf", "dusseldorf", "duesseldorf", "f95"],
  ["1fcnurnberg", "fcnurnberg", "nurnberg", "nuernberg", "fcn"],
  ["karlsruher sc", "karlsruher sc", "karlsruhe", "ksc"],
  ["sc paderborn 07", "scpaderborn07", "paderborn", "scp"],
  ["sv elversberg", "svelversberg", "elversberg", "sve"],
  ["sv darmstadt 98", "svdarmstadt98", "darmstadt", "svd"],
  ["eintracht braunschweig", "eintrachtbraunschweig", "braunschweig", "btsv"],
  ["spvgg greuther furth", "greutherfurth", "furth", "fuerth", "sgf"],
  ["preussen munster", "preussenmunster", "munster", "muenster", "scpmunster"],
  ["1fc magdeburg", "1fcmagdeburg", "magdeburg", "fcm"],
];

const TEAM_ALIASES = new Map();
for (const [canonical, ...aliases] of TEAM_ALIAS_GROUPS) {
  for (const alias of [canonical, ...aliases]) {
    TEAM_ALIASES.set(normalizeTeamName(alias), normalizeTeamName(canonical));
  }
}

export function teamsMatch(input, officialName) {
  const inputKey = normalizeTeamName(input);
  const officialKey = normalizeTeamName(officialName);
  if (!inputKey || !officialKey) return false;

  const inputCanonical = TEAM_ALIASES.get(inputKey) || inputKey;
  const officialCanonical = TEAM_ALIASES.get(officialKey) || officialKey;
  if (inputCanonical === officialCanonical) return true;

  // Allow a longer typed form such as "FC Bayern München" when the API uses
  // a slightly different official spelling, without matching short initials.
  return inputCanonical.length >= 6 && officialCanonical.length >= 6 &&
    (inputCanonical.includes(officialCanonical) || officialCanonical.includes(inputCanonical));
}
