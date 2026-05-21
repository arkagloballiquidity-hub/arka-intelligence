// ============================================================
//  ARKA — Markets API  (v2 — snapshot architecture)
//  Un solo /market-snapshot por refresh cycle: 0 individual /finnhub calls
//  Relay sirve ~38 símbolos en batch, cacheados 180s server-side
// ============================================================
import { relayFetch } from './config.js';

// ── Promise deduplication ────────────────────────────────────
// Si múltiples componentes piden snapshot simultáneamente, comparten
// el mismo fetch in-flight → nunca más de 1 request por ventana de 30s
let _snapInFlight = null;

export async function fetchSnapshot() {
  if (!_snapInFlight) {
    _snapInFlight = relayFetch('/market-snapshot').finally(() => {
      _snapInFlight = null;
    });
  }
  return _snapInFlight;
}

// ── Helper: extrae quote del dict del snapshot ───────────────
function qFromSnap(snap, sym) {
  const d = snap?.[sym];
  if (!d || d.c == null) return null;
  return { price: d.c, change: d.dp ?? 0, high: d.h, low: d.l };
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

// ── Símbolos por variante ─────────────────────────────────────
// Todos usan claves que existen en /market-snapshot
const SYMBOLS = {
  global: [
    { sym: 'SPY',              label: 'S&P 500',   type: 'ETF'    },
    { sym: 'FX:EUR_USD',       label: 'EUR/USD',   type: 'FX'     },
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

// ── fetchMarkets — tabla de precios por variante ──────────────
export async function fetchMarkets(variant = 'global') {
  const snap = await fetchSnapshot();
  const symbols = SYMBOLS[variant] || SYMBOLS.global;

  return symbols.map(({ sym, label, type }) => {
    const q = qFromSnap(snap, sym);
    if (!q) return { t: label, p: '—', c: '—', up: true, _sym: sym, error: true };
    const chgPct = q.change;
    const up = (chgPct ?? 0) >= 0;
    return {
      t:    label,
      p:    fmtPrice(q.price, type),
      c:    chgPct != null ? `${up ? '+' : ''}${chgPct.toFixed(2)}%` : '—',
      up,
      _sym: sym,
      raw:  { price: q.price, change: q.change, high: q.high, low: q.low },
    };
  });
}

// ── Commodities via snapshot ──────────────────────────────────
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
  const snap = await fetchSnapshot();
  return COMMODITIES_SYMS.map(({ sym, name }) => {
    const q = qFromSnap(snap, sym);
    if (!q) return { name, price: '—', chg: '—', up: true, error: true };
    const up = (q.change ?? 0) >= 0;
    return {
      name,
      price: `$${fmtPrice(q.price, 'CMD')}`,
      chg:   `${up ? '+' : ''}${q.change?.toFixed(2) ?? '—'}%`,
      up,
    };
  });
}

// ── Crypto via snapshot ───────────────────────────────────────
const CRYPTO_SYMS = [
  { sym: 'BINANCE:BTCUSDT',  sym2: 'BTC',  name: 'Bitcoin'  },
  { sym: 'BINANCE:ETHUSDT',  sym2: 'ETH',  name: 'Ethereum' },
  { sym: 'BINANCE:SOLUSDT',  sym2: 'SOL',  name: 'Solana'   },
  { sym: 'BINANCE:BNBUSDT',  sym2: 'BNB',  name: 'BNB'      },
  { sym: 'BINANCE:XRPUSDT',  sym2: 'XRP',  name: 'XRP'      },
  { sym: 'BINANCE:USDCUSDT', sym2: 'USDC', name: 'USD Coin' },
];

export async function fetchCrypto() {
  const snap = await fetchSnapshot();
  return CRYPTO_SYMS.map(({ sym, sym2, name }) => {
    const q = qFromSnap(snap, sym);
    if (!q) return { sym: sym2, name, price: '—', chg: '—', up: true, error: true };
    const up = (q.change ?? 0) >= 0;
    return {
      sym:   sym2,
      name,
      price: `$${fmtPrice(q.price, 'CRYPTO')}`,
      chg:   `${up ? '+' : ''}${q.change?.toFixed(2) ?? '—'}%`,
      up,
    };
  });
}

// ── fetchCustomMarkets — watchlist personalizado ──────────────
// Intenta usar snapshot primero; si el símbolo no está, retorna placeholder
export async function fetchCustomMarkets(symbols = []) {
  if (!symbols.length) return [];
  const snap = await fetchSnapshot();
  return symbols.map(sym => {
    const q = qFromSnap(snap, sym);
    if (!q) return { _sym: sym, t: sym.split(':').pop().replace('USDT', ''), p: '—', c: '—', up: true, error: true };
    const isCrypto = sym.includes(':') && !sym.startsWith('FX:');
    const isFX     = sym.startsWith('FX:');
    const up = (q.change || 0) >= 0;
    return {
      _sym: sym,
      t:    sym.split(':').pop().replace('USDT', ''),
      p:    fmtPrice(q.price, isFX ? 'FX' : isCrypto ? 'CRYPTO' : 'STK'),
      c:    `${up ? '+' : ''}${(q.change || 0).toFixed(2)}%`,
      up,
    };
  });
}
