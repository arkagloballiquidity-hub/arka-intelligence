// ============================================================
//  ARKA Intelligence Center — API Configuration
//  Todas las variables de entorno centralizadas aquí.
//  Las vars VITE_ son accesibles en el frontend via import.meta.env
// ============================================================

export const RELAY = import.meta.env.VITE_WS_RELAY_URL || '';
export const RELAY_SECRET = import.meta.env.VITE_RELAY_SECRET || '';

// TTL de caché en ms para cada categoría
export const TTL = {
  markets:   30_000,   // 30s
  news:      60_000,   // 1min
  geo:      120_000,   // 2min
  tracking:  10_000,   // 10s
  macro:    300_000,   // 5min
  humanitarian: 600_000, // 10min
};

// Relay headers helper
export function relayHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (RELAY_SECRET) h['x-relay-key'] = RELAY_SECRET;
  return h;
}

// Relay fetch: llama al relay con auth
export function relayFetch(path, opts = {}) {
  return apiFetch(`${RELAY}${path}`, { ...opts, headers: { ...relayHeaders(), ...(opts.headers || {}) } });
}

// Generic fetch con timeout y error handling
export async function apiFetch(url, opts = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timeout');
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
