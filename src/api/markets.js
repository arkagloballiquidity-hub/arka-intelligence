// ============================================================
//  ARKA — Markets API (Finnhub + Alpha Vantage fallback)
// ============================================================
import { KEYS, apiFetch } from './config.js';

const BASE = 'https://finnhub.io/api/v1';

// Símbolos por variante
const SYMBOLS = {
  global: [
    { sym: 'SPY',    label: 'S&P 500',   type: 'ETF' },
    { sym: 'EURUSD', label: 'EUR/USD',   type: 'FX'  },
    { sym: 'GC=F',   label: 'GOLD',      type: 'CMD' },
    { sym: 'BZ=F',   label: 'BRENT',     type: 'CMD' },
    { sym: 'BINANCE:BTCUSDT', label: 'BTC', type: 'CRYPTO' },
    { sym: 'DX-Y.NYB', label: 'DXY',    type: 'IDX' },
  ],
  finance: [
    { sym: 'SPY',  label: 'SPY',  type: 'ETF' },
    { sym: 'QQQ',  label: 'QQQ',  type: 'ETF' },
    { sym: 'TLT',  label: 'TLT',  type: 'ETF' },
    { sym: 'GLD',  label: 'GLD',  type: 'ETF' },
    { sym: 'XLF',  label: 'XLF',  type: 'ETF' },
    { sym: 'BINANCE:ETHUSDT', label: 'ETH', type: 'CRYPTO' },
  ],
  tech: [
    { sym: 'NVDA',  label: 'NVDA',  type: 'STOCK' },
    { sym: 'MSFT',  label: 'MSFT',  type: 'STOCK' },
    { sym: 'GOOGL', label: 'GOOGL', type: 'STOCK' },
    { sym: 'META',  label: 'META',  type: 'STOCK' },
    { sym: 'AAPL',  label: 'AAPL',  type: 'STOCK' },
    { sym: 'TSM',   label: 'TSMC',  type: 'STOCK' },
  ],
};

// Obtiene quote de un símbolo via Finnhub
async function getQuote(symbol) {
  const url = `${BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${KEYS.finnhub}`;
  const data = await apiFetch(url);
  return {
    price: data.c,     // current price
    change: data.dp,   // % change
    prev: data.pc,     // previous close
    high: data.h,
    low: data.l,
  };
}

// Obtiene precios crypto via Finnhub (exchange:pair)
async function getCryptoQuote(symbol) {
  return getQuote(symbol); // mismo endpoint para crypto
}

// Formatea precio según tipo
function fmtPrice(price, type) {
  if (!price && price !== 0) return '—';
  if (type === 'FX') return price.toFixed(4);
  if (type === 'CRYPTO') return price > 1000
    ? price.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : price.toFixed(2);
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Función principal: devuelve array de market items para la variante dada
export async function fetchMarkets(variant = 'global') {
  const symbols = SYMBOLS[variant] || SYMBOLS.global;
  const results = await Promise.allSettled(
    symbols.map(async ({ sym, label, type }) => {
      const q = await getQuote(sym);
      const chgPct = q.change;
      const up = chgPct >= 0;
      return {
        t: label,
        p: fmtPrice(q.price, type),
        c: `${up ? '+' : ''}${chgPct?.toFixed(2) ?? '—'}%`,
        up,
        raw: { price: q.price, change: q.change, high: q.high, low: q.low },
      };
    })
  );
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    // fallback si falla
    return { t: symbols[i].label, p: '—', c: '—', up: true, error: true };
  });
}

// Commodities específicos vía Finnhub
const COMMODITIES_SYMS = [
  { sym: 'BZ=F',  name: 'Brent Crude' },
  { sym: 'CL=F',  name: 'WTI' },
  { sym: 'NG=F',  name: 'Natural Gas' },
  { sym: 'GC=F',  name: 'Gold Spot' },
  { sym: 'SI=F',  name: 'Silver' },
  { sym: 'HG=F',  name: 'Copper' },
  { sym: 'ZW=F',  name: 'Wheat' },
];

export async function fetchCommodities() {
  const results = await Promise.allSettled(
    COMMODITIES_SYMS.map(async ({ sym, name }) => {
      const q = await getQuote(sym);
      const up = q.change >= 0;
      return {
        name,
        price: `$${fmtPrice(q.price, 'CMD')}`,
        chg: `${up ? '+' : ''}${q.change?.toFixed(2) ?? '—'}%`,
        up,
      };
    })
  );
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return { name: COMMODITIES_SYMS[i].name, price: '—', chg: '—', up: true, error: true };
  });
}

// Crypto via Finnhub
const CRYPTO_SYMS = [
  { sym: 'BINANCE:BTCUSDT', sym2: 'BTC', name: 'Bitcoin' },
  { sym: 'BINANCE:ETHUSDT', sym2: 'ETH', name: 'Ethereum' },
  { sym: 'BINANCE:SOLUSDT', sym2: 'SOL', name: 'Solana' },
  { sym: 'BINANCE:BNBUSDT', sym2: 'BNB', name: 'BNB' },
  { sym: 'BINANCE:XRPUSDT', sym2: 'XRP', name: 'XRP' },
  { sym: 'BINANCE:USDCUSDT',sym2: 'USDC',name: 'USD Coin' },
];

export async function fetchCrypto() {
  const results = await Promise.allSettled(
    CRYPTO_SYMS.map(async ({ sym, sym2, name }) => {
      const q = await getQuote(sym);
      const up = q.change >= 0;
      return {
        sym: sym2,
        name,
        price: `$${fmtPrice(q.price, 'CRYPTO')}`,
        chg: `${up ? '+' : ''}${q.change?.toFixed(2) ?? '—'}%`,
        up,
      };
    })
  );
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return { sym: CRYPTO_SYMS[i].sym2, name: CRYPTO_SYMS[i].name, price: '—', chg: '—', up: true, error: true };
  });
}
