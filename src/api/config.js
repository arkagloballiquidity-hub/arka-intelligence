// ============================================================
//  ARKA Intelligence Center — API Configuration
//  Todas las variables de entorno centralizadas aquí.
//  Las vars VITE_ son accesibles en el frontend via import.meta.env
// ============================================================

export const RELAY = import.meta.env.VITE_WS_RELAY_URL || '';
export const RELAY_SECRET = import.meta.env.VITE_RELAY_SECRET || '';

export const KEYS = {
  finnhub:       import.meta.env.VITE_FINNHUB_API_KEY        || '',
  fred:          import.meta.env.VITE_FRED_API_KEY            || '',
  eia:           import.meta.env.VITE_EIA_API_KEY             || '',
  alphaVantage:  import.meta.env.VITE_ALPHA_VANTAGE_API_KEY   || '',
  newsapi:       import.meta.env.VITE_NEWSAPI_KEY             || '',
  guardian:      import.meta.env.VITE_GUARDIAN_API_KEY        || '',
  nyt:           import.meta.env.VITE_NYT_API_KEY             || '',
  groq:          import.meta.env.VITE_GROQ_API_KEY            || '',
  openrouter:    import.meta.env.VITE_OPENROUTER_API_KEY      || '',
  anthropic:     import.meta.env.VITE_ANTHROPIC_API_KEY       || '',
  aisstream:     import.meta.env.VITE_AISSTREAM_API_KEY       || '',
  openskyId:     import.meta.env.VITE_OPENSKY_CLIENT_ID       || '',
  openskySecret: import.meta.env.VITE_OPENSKY_CLIENT_SECRET   || '',
  aviationstack: import.meta.env.VITE_AVIATIONSTACK_KEY       || '',
  nasaFirms:     import.meta.env.VITE_NASA_FIRMS_API_KEY      || '',
  cloudflare:    import.meta.env.VITE_CLOUDFLARE_API_TOKEN    || '',
  metaculus:     import.meta.env.VITE_METACULUS_API_KEY       || '',
  mapbox:        import.meta.env.VITE_MAPBOX_TOKEN            || '',
  sentry:        import.meta.env.VITE_SENTRY_DSN              || '',
  hapi:          import.meta.env.VITE_HAPI_APP_IDENTIFIER     || '',
  broadcastify:  import.meta.env.VITE_BROADCASTIFY_API_KEY    || '',
};

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
