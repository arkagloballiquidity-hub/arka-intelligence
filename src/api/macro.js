// ============================================================
//  ARKA — Macro API (FRED Federal Reserve)
// ============================================================
// FRED va por relay — evita CORS y protege el API key en el bundle
import { relayFetch } from './config.js';

// Series FRED relevantes
const SERIES = [
  {
    id: 'FEDFUNDS',
    name: 'Fed Funds Rate',
    sub: 'Effective rate',
    fmt: (v) => `${parseFloat(v).toFixed(2)}%`,
  },
  {
    id: 'CPIAUCSL',
    name: 'US CPI YoY',
    sub: 'Consumer Price Index',
    fmt: (v) => `${parseFloat(v).toFixed(2)}%`,
    transform: 'pc1',
  },
  {
    id: 'A191RL1Q225SBEA',
    name: 'US GDP QoQ',
    sub: 'Real GDP growth',
    fmt: (v) => `${parseFloat(v) >= 0 ? '+' : ''}${parseFloat(v).toFixed(1)}%`,
  },
  {
    id: 'UNRATE',
    name: 'Unemployment',
    sub: 'U-3 rate',
    fmt: (v) => `${parseFloat(v).toFixed(1)}%`,
  },
];

async function fetchSeries(seriesId, transform = null) {
  const params = new URLSearchParams({
    series_id: seriesId,
    file_type: 'json',
    sort_order: 'desc',
    limit: '13',
    observation_end: new Date().toISOString().split('T')[0],
  });
  if (transform) params.set('units', transform);

  const data = await relayFetch(`/fred?${params}`);
  const obs = (data.observations || []).filter(o => o.value !== '.').reverse();
  return obs.map(o => ({
    date: o.date,
    value: parseFloat(o.value),
  }));
}

export async function fetchMacro() {
  const results = await Promise.allSettled(
    SERIES.map(async (s) => {
      const obs = await fetchSeries(s.id, s.transform);
      const latest = obs[obs.length - 1];
      const spark = obs.map(o => o.value);
      const latestDate = latest?.date
        ? new Date(latest.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : '';
      return {
        name: s.name,
        val: latest ? s.fmt(latest.value) : '—',
        sub: latestDate || s.sub,
        spark,
      };
    })
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      name: SERIES[i].name,
      val: '—',
      sub: SERIES[i].sub,
      spark: [],
      error: true,
    };
  });
}
