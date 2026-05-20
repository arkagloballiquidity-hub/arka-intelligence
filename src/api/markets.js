// ============================================================
//  ARKA — Markets API
//  Finnhub → relay /finnhub  (evita CORS + protege API key)
//  FX pairs → relay /fx (Frankfurter, gratis, sin quota)
//  Alpha Vantage reservado SOLO para indicadores técnicos en Quant
// ============================================================
import { relayFetch } from './config.js';

// ── Símbolos por variante ─────────────────────────────────────
// Para pares FX agrega { fxFrom, fxTo } en vez de que pasen por Finnhub
const SYMBOLS = {
  global: [
    { sym: 'SPY',              label: 'S&P 500',   type: 'ETF'    },
    { sym: 'EURUSD',           label: 'EUR/USD',   type: 'FX',    fxFrom:'EUR', fxTo:'USD' },
    { sym: 'GC=F',             label: 'GOLD',      type: 'CMD'    },
    { sym: 'BZ=F',             label: 'BRENT',     type: 'CMD'    },
    { sym: 'BINANCE:BTCUSDT',  label: 'BTC',       type: 'CRYPTO' },
    { sym: 'DX-Y.NYB',         label: 'DXY',       type: 'IDX'    },
  ],
  finance: [
    { sym: 'SPY',              label: 'SPY',   type: 'ETF'    },
    { sym: 'QQQ',              label: 'QQQ',   type: 'ETF'    },
    { sym: 'TLT',              label: 'TLT',   type: 'ETF'    },
    { sym: 'GLD',              label: 'GLD',   type: 'ETF'    },
    { sym: 'XLF',              label: 'XLF',   type: 'ETF'    },
    { sym: 'BINANCE:ETHUSDT',  label: 'ETH',   type: 'CRYPTO' },
  ],
  tech: [
    { sym: 'NVDA',   label: 'NVDA',  type: 'STOCK' },
    { sym: 'MSFT',   label: 'MSFT',  type: 'STOCK' },
    { sym: 'GOOGL',  label: 'GOOGL', type: 'STOCK' },
    { sym: 'META',   label: 'META',  type: 'STOCK' },
    { sym: 'AAPL',   label: 'AAPL',  type: 'STOCK' },
    { sym: 'TSM',    label: 'TSMC',  type: 'STOCK' },
  ],
};

// ── Obtiene quote Finnhub via relay ───────────────────────────
async function getQuote(symbol) {
  const data = await relayFetch(`/finnhub?path=quote&symbol=${encodeURIComponent(symbol)}`);
  return {
    price:  data.c,   // current price
    change: data.dp,  // % change
    prev:   data.pc,  // previous close
    high:   data.h,
    low:    data.l,
  };
}

// ── Obtiene tipo de cambio FX via Frankfurter (relay /fx, sin quota) ─
async function getFXRate(from, to) {
  const data = await relayFetch('/fx');
  const base = from.toUpperCase();
  const quote = to.toUpperCase();
  let rate = null;
  if (base === 'EUR' && data.eur?.rates?.[quote])       rate = data.eur.rates[quote];
  else if (base === 'USD' && data.usd?.rates?.[quote])  rate = data.usd.rates[quote];
  else if (data.eur?.rates?.[quote] && data.eur?.rates?.[base]) {
    rate = data.eur.rates[quote] / data.eur.rates[base]; // cross via EUR
  }
  if (!rate) throw new Error(`No FX rate for ${from}/${to}`);
  return { price: rate, change: 0, prev: rate, high: rate, low: rate };
}

// ── Formatea precio según tipo ────────────────────────────────
function fmtPrice(price, type) {
  if (!price && price !== 0) return '—';
  if (type === 'FX')
    return price.toFixed(4);
  if (type === 'CRYPTO')
    return price > 1000
      ? price.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : price.toFixed(2);
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── fetchMarkets — array de market items para la variante ─────
export async function fetchMarkets(variant = 'global') {
  const symbols = SYMBOLS[variant] || SYMBOLS.global;
  const results = await Promise.allSettled(
    symbols.map(async ({ sym, label, type, fxFrom, fxTo }) => {
      // Pares FX → Alpha Vantage via relay
      const q = (type === 'FX' && fxFrom && fxTo)
        ? await getFXRate(fxFrom, fxTo)
        : await getQuote(sym);
      const chgPct = q.change;
      const up = (chgPct ?? 0) >= 0;
      return {
        t: label,
        p: fmtPrice(q.price, type),
        c: chgPct != null ? `${up ? '+' : ''}${chgPct.toFixed(2)}%` : '—',
        up,
        raw: { price: q.price, change: q.change, high: q.high, low: q.low },
      };
    })
  );
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return { t: symbols[i].label, p: '—', c: '—', up: true, error: true };
  });
}

// ── Commodities via Finnhub relay ─────────────────────────────
const COMMODITIES_SYMS = [
  { sym: 'BZ=F',  name: 'Brent Crude' },
  { sym: 'CL=F',  name: 'WTI'         },
  { sym: 'NG=F',  name: 'Natural Gas' },
  { sym: 'GC=F',  name: 'Gold Spot'   },
  { sym: 'SI=F',  name: 'Silver'      },
  { sym: 'HG=F',  name: 'Copper'      },
  { sym: 'ZW=F',  name: 'Wheat'       },
];

export async function fetchCommodities() {
  const results = await Promise.allSettled(
    COMMODITIES_SYMS.map(async ({ sym, name }) => {
      const q = await getQuote(sym);
      const up = (q.change ?? 0) >= 0;
      return {
        name,
        price: `$${fmtPrice(q.price, 'CMD')}`,
        chg:   `${up ? '+' : ''}${q.change?.toFixed(2) ?? '—'}%`,
        up,
      };
    })
  );
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return { name: COMMODITIES_SYMS[i].name, price: '—', chg: '—', up: true, error: true };
  });
}

// ── Crypto via Finnhub relay ──────────────────────────────────
const CRYPTO_SYMS = [
  { sym: 'BINANCE:BTCUSDT',  sym2: 'BTC',  name: 'Bitcoin'  },
  { sym: 'BINANCE:ETHUSDT',  sym2: 'ETH',  name: 'Ethereum' },
  { sym: 'BINANCE:SOLUSDT',  sym2: 'SOL',  name: 'Solana'   },
  { sym: 'BINANCE:BNBUSDT',  sym2: 'BNB',  name: 'BNB'      },
  { sym: 'BINANCE:XRPUSDT',  sym2: 'XRP',  name: 'XRP'      },
  { sym: 'BINANCE:USDCUSDT', sym2: 'USDC', name: 'USD Coin' },
];

export async function fetchCrypto() {
  const results = await Promise.allSettled(
    CRYPTO_SYMS.map(async ({ sym, sym2, name }) => {
      const q = await getQuote(sym);
      const up = (q.change ?? 0) >= 0;
      return {
        sym: sym2,
        name,
        price: `$${fmtPrice(q.price, 'CRYPTO')}`,
        chg:   `${up ? '+' : ''}${q.change?.toFixed(2) ?? '—'}%`,
        up,
      };
    })
  );
  return results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return { sym: CRYPTO_SYMS[i].sym2, name: CRYPTO_SYMS[i].name, price: '—', chg: '—', up: true, error: true };
  });
}

// ── fetchCustomMarkets — watchlist personalizado ──────────────
export async function fetchCustomMarkets(symbols = []) {
  if (!symbols.length) return [];
  const results = await Promise.allSettled(
    symbols.map(async (sym) => {
      try {
        const q = await getQuote(sym);
        const isCrypto = sym.includes(':');
        const up = (q.change || 0) >= 0;
        return {
          _sym: sym,
          t:    sym.split(':').pop().replace('USDT',''),
          p:    fmtPrice(q.price, isCrypto ? 'CRYPTO' : 'STK'),
          c:    `${up ? '+' : ''}${(q.change || 0).toFixed(2)}%`,
          up,
        };
      } catch {
        return { _sym: sym, t: sym, p: '—', c: '—', up: true, error: true };
      }
    })
  );
  return results.map(r => r.status === 'fulfilled' ? r.value : { _sym:'', t:'—', p:'—', c:'—', up:true });
}
