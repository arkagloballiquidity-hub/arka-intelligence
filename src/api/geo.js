// ============================================================
//  ARKA — Geo & Monitoring APIs
//  USGS (earthquakes), NASA FIRMS (fires), Polymarket (predictions)
//  UNHCR (displacement), ReliefWeb (humanitarian)
// ============================================================
import { RELAY, relayHeaders, apiFetch, relayFetch } from './config.js';

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
  // Via relay — NASA key nunca sale al browser
  try {
    const data = await relayFetch('/firms');
    const text = data.csv || '';
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
  // Via relay — Cloudflare token nunca sale al browser
  try {
    const data = await relayFetch('/cloudflare');
    return data.result || [];
  } catch {
    return [];
  }
}

// ── NewsAPI — Cyber Threats Feed ─────────────────────────────
export async function fetchCyberFeed() {
  // Via relay — NewsAPI key nunca sale al browser
  try {
    const params = new URLSearchParams({
      q: 'cyber attack OR ransomware OR malware OR APT OR "data breach" OR "zero-day"',
      language: 'en',
      pageSize: '8',
      sortBy: 'publishedAt',
    });
    const data = await relayFetch(`/newsapi?${params}`);
    return (data.articles || []).slice(0, 8).map(a => {
      const title = (a.title || '').toLowerCase();
      const sev = (title.includes('critical') || title.includes('zero-day') || title.includes('nation-state') || title.includes('apt'))
        ? 'critical'
        : (title.includes('ransomware') || title.includes('breach') || title.includes('exploit') || title.includes('cve'))
        ? 'high'
        : 'medium';
      return {
        sev,
        text: a.title || '',
        src: a.source?.name || '',
        url: a.url || '',
      };
    });
  } catch {
    return [];
  }
}

// ── GDELT — Military Activity Feed ───────────────────────────
export async function fetchMilitaryFeed() {
  try {
    // Via relay — evita CORS (GDELT no permite llamadas directas desde el browser)
    const params = new URLSearchParams({
      query: 'military troops navy airforce missile strike theme:MILITARY',
      mode: 'artlist',
      maxrecords: '10',
      format: 'json',
    });
    const data = await relayFetch(`/military-feed?${params}`);
    // El relay devuelve array directo [{title, src, url, time}], no {articles:[...]}
    const articles = Array.isArray(data) ? data : (data.articles || []);
    return articles.slice(0, 8).map(a => {
      const title = (a.title || '').toLowerCase();
      let tag = 'INT', tagCol = '#A3A3A3', icon = '⚔';
      if (title.includes('russia') || title.includes('russian') || title.includes('kremlin')) {
        tag = 'RUS'; tagCol = '#EF4444'; icon = '✈';
      } else if (title.includes('china') || title.includes('pla') || title.includes('beijing')) {
        tag = 'CHN'; tagCol = '#EF4444'; icon = '⛵';
      } else if (title.includes('iran') || title.includes('irgc') || title.includes('tehran')) {
        tag = 'IRN'; tagCol = '#F59E0B'; icon = '⛵';
      } else if (title.includes('north korea') || title.includes('dprk') || title.includes('pyongyang')) {
        tag = 'PRK'; tagCol = '#F59E0B'; icon = '🚀';
      } else if (title.includes('israel') || title.includes('idf')) {
        tag = 'ISR'; tagCol = '#3B82F6'; icon = '✈';
      } else if (title.includes('united states') || title.includes('pentagon') || title.includes('nato') || title.includes(' us ')) {
        tag = 'USA'; tagCol = '#3B82F6'; icon = '✈';
      }
      return { icon, tag, tagCol, text: a.title || '', url: a.url || '' };
    });
  } catch {
    return [];
  }
}
