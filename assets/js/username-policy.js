const RESERVED_ROLE_MARKERS = ["admin", "administrator", "serveradmin", "moderator", "moderation"];

/** Returns the first username rule the provided name violates, or an empty string. */
export function usernamePolicyError(value) {
  const name = String(value ?? "").trim();
  if (!name) return "Bitte gib einen Nutzernamen ein.";
  if (name.length > 40) return "Nutzernamen dürfen höchstens 40 Zeichen lang sein.";

  const normalized = name
    .normalize("NFKD")
    .toLocaleLowerCase("de")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t");

  if (RESERVED_ROLE_MARKERS.some((marker) => normalized.includes(marker))) {
    return "Admin- und Moderatoren-Namen sind dem Team vorbehalten. Eine Täuschung kann zur Kontosperre führen.";
  }

  return "";
}
