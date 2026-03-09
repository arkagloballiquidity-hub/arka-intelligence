// ============================================================
//  ARKA — News API (NewsAPI + Guardian + NYT)
// ============================================================
import { KEYS, apiFetch } from './config.js';

// Formatea tiempo relativo
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// Clasifica tag por palabras clave en título
function classifyTag(title = '') {
  const t = title.toLowerCase();
  if (/war|attack|missile|bomb|strike|troops|military|clash|killed|nuclear/.test(t)) return 'critical';
  if (/sanction|conflict|tension|crisis|protest|coup|threat|arrest|detained/.test(t)) return 'high';
  if (/market|fed|rate|gdp|inflation|stock|economy|trade|investment/.test(t)) return 'market';
  return null;
}

// NewsAPI — noticias generales por query
async function fromNewsAPI(query, pageSize = 8) {
  if (!KEYS.newsapi) return [];
  const params = new URLSearchParams({
    q: query,
    pageSize: String(pageSize),
    sortBy: 'publishedAt',
    language: 'en',
    apiKey: KEYS.newsapi,
  });
  const data = await apiFetch(`https://newsapi.org/v2/everything?${params}`);
  return (data.articles || []).map(a => ({
    src: a.source?.name || 'NewsAPI',
    h: a.title,
    t: timeAgo(a.publishedAt),
    tag: classifyTag(a.title),
    url: a.url,
  }));
}

// Guardian API — por sección
async function fromGuardian(section, pageSize = 8) {
  if (!KEYS.guardian) return [];
  const params = new URLSearchParams({
    section,
    'page-size': String(pageSize),
    'show-fields': 'trailText',
    'order-by': 'newest',
    'api-key': KEYS.guardian,
  });
  const data = await apiFetch(`https://content.guardianapis.com/search?${params}`);
  return (data.response?.results || []).map(a => ({
    src: 'The Guardian',
    h: a.webTitle,
    t: timeAgo(a.webPublicationDate),
    tag: classifyTag(a.webTitle),
    url: a.webUrl,
  }));
}

// NYT API — por section
async function fromNYT(section = 'world') {
  if (!KEYS.nyt) return [];
  const data = await apiFetch(
    `https://api.nytimes.com/svc/topstories/v2/${section}.json?api-key=${KEYS.nyt}`
  );
  return (data.results || []).slice(0, 8).map(a => ({
    src: 'NYT',
    h: a.title,
    t: timeAgo(a.published_date),
    tag: classifyTag(a.title),
    url: a.url,
  }));
}

// GDELT — búsqueda de eventos globales (sin key)
async function fromGDELT(query, maxRecords = 6) {
  const params = new URLSearchParams({
    query,
    mode: 'artlist',
    maxrecords: String(maxRecords),
    format: 'json',
    timespan: '24h',
    sort: 'hybridrel',
  });
  const data = await apiFetch(
    `https://api.gdeltproject.org/api/v2/doc/doc?${params}`
  );
  return (data.articles || []).map(a => ({
    src: a.domain || 'GDELT',
    h: a.title,
    t: timeAgo(a.seendate?.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')),
    tag: classifyTag(a.title),
    url: a.url,
  }));
}

// ── Feeds por variante/sección ──────────────────────────────

export async function fetchNewsGlobal() {
  const [guardian, gdelt] = await Promise.allSettled([
    fromGuardian('world', 6),
    fromGDELT('geopolitical conflict war diplomacy', 6),
  ]);
  return [
    ...(guardian.status === 'fulfilled' ? guardian.value : []),
    ...(gdelt.status === 'fulfilled' ? gdelt.value : []),
  ].slice(0, 10);
}

export async function fetchNewsMiddleEast() {
  const [napi, gdelt] = await Promise.allSettled([
    fromNewsAPI('Middle East Israel Iran Gaza Houthi', 6),
    fromGDELT('middle east israel iran conflict', 4),
  ]);
  return [
    ...(napi.status === 'fulfilled' ? napi.value : []),
    ...(gdelt.status === 'fulfilled' ? gdelt.value : []),
  ].slice(0, 8);
}

export async function fetchNewsAfrica() {
  const [guardian, gdelt] = await Promise.allSettled([
    fromGuardian('world/africa', 4),
    fromGDELT('Africa conflict Sudan DRC Sahel', 4),
  ]);
  return [
    ...(guardian.status === 'fulfilled' ? guardian.value : []),
    ...(gdelt.status === 'fulfilled' ? gdelt.value : []),
  ].slice(0, 6);
}

export async function fetchNewsLatam() {
  const [napi, gdelt] = await Promise.allSettled([
    fromNewsAPI('Latin America Venezuela Mexico cartel Brazil', 4),
    fromGDELT('latin america venezuela mexico cartel brazil', 4),
  ]);
  return [
    ...(napi.status === 'fulfilled' ? napi.value : []),
    ...(gdelt.status === 'fulfilled' ? gdelt.value : []),
  ].slice(0, 6);
}

export async function fetchNewsEnergy() {
  const [nyt, napi] = await Promise.allSettled([
    fromNYT('science'),
    fromNewsAPI('OPEC oil gas energy pipeline crude', 6),
  ]);
  return [
    ...(napi.status === 'fulfilled' ? napi.value : []),
    ...(nyt.status === 'fulfilled' ? nyt.value.slice(0, 2) : []),
  ].slice(0, 8);
}

export async function fetchNewsThinkTanks() {
  // GDELT filtra think tanks y policy papers bien
  const [gdelt, napi] = await Promise.allSettled([
    fromGDELT('RAND Brookings CSIS Atlantic Council policy analysis', 6),
    fromNewsAPI('think tank policy analysis geopolitics strategy', 4),
  ]);
  return [
    ...(gdelt.status === 'fulfilled' ? gdelt.value : []),
    ...(napi.status === 'fulfilled' ? napi.value : []),
  ].slice(0, 6);
}

export async function fetchNewsFinance() {
  const [guardian, nyt] = await Promise.allSettled([
    fromGuardian('business', 5),
    fromNYT('business'),
  ]);
  return [
    ...(guardian.status === 'fulfilled' ? guardian.value : []),
    ...(nyt.status === 'fulfilled' ? nyt.value.slice(0, 3) : []),
  ].slice(0, 8);
}

export async function fetchNewsTech() {
  const [guardian, nyt] = await Promise.allSettled([
    fromGuardian('technology', 5),
    fromNYT('technology'),
  ]);
  return [
    ...(guardian.status === 'fulfilled' ? guardian.value : []),
    ...(nyt.status === 'fulfilled' ? nyt.value.slice(0, 3) : []),
  ].slice(0, 8);
}

// Live News ticker (mix de todos)
export async function fetchLiveNews(variant = 'global') {
  const queries = {
    global: () => fromGuardian('world', 5),
    finance: () => fromGuardian('business', 5),
    tech: () => fromGuardian('technology', 5),
  };
  const fn = queries[variant] || queries.global;
  return fn().catch(() => []);
}
