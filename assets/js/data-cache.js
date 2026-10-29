const CACHE_PREFIX = "goalnews-api-cache-v1:";
const inFlightRequests = new Map();

/** Fetch public JSON once per TTL per browser and reuse stale data during outages. */
export function fetchJsonCached(
  url,
  { ttlMs = 5 * 60 * 1000, force = false } = {},
) {
  const key = `${CACHE_PREFIX}${url}`;
  let cached = null;

  try {
    cached = JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    cached = null;
  }

  const now = Date.now();
  if (!force && cached?.data && now - cached.savedAt < ttlMs) {
    return Promise.resolve({
      data: cached.data,
      updatedAt: cached.savedAt,
      stale: false,
    });
  }

  if (!force && inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const request = (async () => {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (!Array.isArray(data) && (data === null || typeof data !== "object")) {
        throw new Error("Ungültige API-Antwort");
      }

      const savedAt = Date.now();

      try {
        localStorage.setItem(key, JSON.stringify({ savedAt, data }));
      } catch {
        // Cache-Speicherung fehlgeschlagen; Daten trotzdem verwenden.
      }

      return { data, updatedAt: savedAt, stale: false };
    } catch (error) {
      if (cached?.data) {
        return { data: cached.data, updatedAt: cached.savedAt, stale: true };
      }
      throw error;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, request);
  return request;
}

export function currentSeasonStart(date = new Date()) {
  const year = date.getFullYear();
  return date.getMonth() >= 6 ? year : year - 1;
}

export function formatUpdatedAt(value) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
