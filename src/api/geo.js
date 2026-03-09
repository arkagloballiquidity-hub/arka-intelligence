// ============================================================
//  ARKA — Geo & Monitoring APIs
//  USGS (earthquakes), NASA FIRMS (fires), Polymarket (predictions)
//  UNHCR (displacement), ReliefWeb (humanitarian)
// ============================================================
import { KEYS, RELAY, relayHeaders, apiFetch } from './config.js';

// ── USGS Earthquakes (sin key) ───────────────────────────────
export async function fetchEarthquakes(minMag = 4.0, limit = 8) {
  const params = new URLSearchParams({
    format: 'geojson',
    minmagnitude: String(minMag),
    limit: String(limit),
    orderby: 'time',
  });
  const data = await apiFetch(
    `https://earthquake.usgs.gov/fdsnws/event/1/query?${params}`
  );

  function timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function magColor(mag) {
    if (mag >= 6.0) return '#EF4444';
    if (mag >= 5.0) return '#F59E0B';
    return '#10B981';
  }

  return (data.features || []).map(f => ({
    mag: f.properties.mag,
    place: f.properties.place?.replace(/^\d+km [NSEW]+ of /, '') || 'Unknown',
    time: timeAgo(f.properties.time),
    color: magColor(f.properties.mag),
    coords: f.geometry?.coordinates,
  }));
}

// ── NASA FIRMS — Satellite Fires ─────────────────────────────
export async function fetchFires() {
  if (!KEYS.nasaFirms) return [];
  // FIRMS devuelve CSV — pedimos últimas 24h, world
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${KEYS.nasaFirms}/VIIRS_SNPP_NRT/world/1`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.trim().split('\n').slice(1); // skip header

    // Agrupa por país/región aproximada via lat/lon
    const grouped = {};
    for (const line of lines.slice(0, 200)) {
      const cols = line.split(',');
      const lat = parseFloat(cols[0]);
      const lon = parseFloat(cols[1]);
      const acq_date = cols[5];
      // Estimación muy básica de región
      const region = estimateRegion(lat, lon);
      if (!grouped[region]) grouped[region] = { count: 0, date: acq_date };
      grouped[region].count++;
    }

    return Object.entries(grouped)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([loc, info]) => ({
        loc,
        ac: `${(info.count * 250).toLocaleString()} ha est.`, // VIIRS pixel ~250m
        count: info.count,
      }));
  } catch {
    return [];
  }
}

function estimateRegion(lat, lon) {
  if (lat > 50 && lon > 60 && lon < 180) return 'Siberia, Russia';
  if (lat > 25 && lat < 50 && lon > -130 && lon < -60) return 'North America';
  if (lat > -15 && lat < 15 && lon > -80 && lon < -30) return 'Amazon, Brazil';
  if (lat > -55 && lat < -15 && lon > -80 && lon < -30) return 'South America';
  if (lat > -45 && lat < -10 && lon > 110 && lon < 155) return 'Australia';
  if (lat > -35 && lat < 37 && lon > -20 && lon < 55) return 'Africa';
  if (lat > -10 && lat < 60 && lon > 55 && lon < 110) return 'South/Central Asia';
  if (lat > 30 && lat < 75 && lon > -30 && lon < 60) return 'Europe';
  return `${lat.toFixed(0)}°, ${lon.toFixed(0)}°`;
}

// ── Polymarket (sin key, público) ───────────────────────────
export async function fetchPredictions() {
  // Usamos relay si está configurado para evitar CORS, sino directo
  const base = RELAY
    ? `${RELAY}/polymarket?endpoint=markets&closed=false&limit=20`
    : `https://gamma-api.polymarket.com/markets?closed=false&limit=20`;

  try {
    const data = await apiFetch(base, RELAY ? { headers: relayHeaders() } : {});
    const markets = Array.isArray(data) ? data : data.markets || [];

    // Filtra mercados geopolíticos/financieros relevantes
    const keywords = ['war','election','rate','bitcoin','recession','fed','ukraine','china','ai','nuclear'];
    const filtered = markets.filter(m => {
      const q = (m.question || m.title || '').toLowerCase();
      return keywords.some(kw => q.includes(kw));
    }).slice(0, 8);

    return filtered.map(m => {
      let yes = 50;
      try {
        const prices = JSON.parse(m.outcomePrices || '["0.5","0.5"]');
        yes = Math.round(parseFloat(prices[0]) * 100);
      } catch {}
      return {
        q: m.question || m.title || 'Unknown market',
        yes,
      };
    });
  } catch {
    return [];
  }
}

// ── UNHCR Displacement (público) ────────────────────────────
export async function fetchDisplacement() {
  try {
    const params = new URLSearchParams({
      limit: '10',
      year: new Date().getFullYear() - 1,
      coa_all: 'true',
    });
    const data = await apiFetch(
      `https://api.unhcr.org/population/v1/population/?${params}`
    );
    const items = (data.items || []).slice(0, 6);
    return items.map(i => ({
      country: i.coo_name || 'Unknown',
      num: i.refugees
        ? `${(i.refugees / 1e6).toFixed(1)}M`
        : '—',
      trend: '→',
    }));
  } catch {
    return [];
  }
}

// ── Cloudflare Radar — Internet outages ─────────────────────
export async function fetchCloudflareOutages() {
  if (!KEYS.cloudflare) return [];
  try {
    const data = await apiFetch(
      'https://api.cloudflare.com/client/v4/radar/netflows/timeseries?aggInterval=1h&dateRange=24h',
      {
        headers: {
          Authorization: `Bearer ${KEYS.cloudflare}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return data.result || [];
  } catch {
    return [];
  }
}
