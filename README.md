# ARKA Intelligence Center

Dashboard de inteligencia geopolítica y financiera en tiempo real.

---

## Stack

- **Frontend**: React + Vite → deploy en Vercel
- **Relay**: Express → deploy en Railway
- **APIs**: Finnhub, FRED, Guardian, NYT, USGS, NASA FIRMS, Groq, Polymarket, UNHCR, GDELT

---

## PASO 1 — Subir a GitHub

Sube **dos repositorios separados**:

```
arka-intelligence/   → repo: arka-intelligence
arka-relay/          → repo: arka-relay
```

En GitHub:
1. New repository → `arka-intelligence` → crear
2. New repository → `arka-relay` → crear

En tu máquina (desde la carpeta de cada proyecto):

```bash
# Frontend
cd arka-intelligence
git init
git add .
git commit -m "init"
git remote add origin https://github.com/TU_USUARIO/arka-intelligence.git
git push -u origin main

# Relay
cd ../arka-relay
git init
git add .
git commit -m "init"
git remote add origin https://github.com/TU_USUARIO/arka-relay.git
git push -u origin main
```

---

## PASO 2 — Deploy del Relay en Railway

1. Ve a [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Selecciona `arka-relay`
3. Railway detecta el `railway.toml` automáticamente
4. Ve a **Variables** y agrega:

```
RELAY_SHARED_SECRET=arka2026secret
OPENSKY_CLIENT_ID=tu_client_id
OPENSKY_CLIENT_SECRET=tu_client_secret
AISSTREAM_API_KEY=tu_aisstream_key
```

5. Deploy → espera que diga **Active**
6. Copia la URL del deploy: `https://arka-relay-xxxx.up.railway.app`
7. Verifica: abre `https://arka-relay-xxxx.up.railway.app/health` → debe responder `{"status":"ok"}`

---

## PASO 3 — Deploy del Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Selecciona `arka-intelligence`
3. Framework: **Vite** (Vercel lo detecta solo)
4. Antes de hacer deploy, ve a **Environment Variables** y agrega **todas** las siguientes:

```
VITE_WS_RELAY_URL=https://arka-relay-xxxx.up.railway.app
VITE_RELAY_SECRET=arka2026secret
VITE_FINNHUB_API_KEY=tu_key
VITE_FRED_API_KEY=tu_key
VITE_EIA_API_KEY=tu_key
VITE_ALPHA_VANTAGE_API_KEY=tu_key
VITE_NEWSAPI_KEY=tu_key
VITE_GUARDIAN_API_KEY=tu_key
VITE_NYT_API_KEY=tu_key
VITE_GROQ_API_KEY=tu_key
VITE_OPENROUTER_API_KEY=tu_key
VITE_ANTHROPIC_API_KEY=tu_key
VITE_AISSTREAM_API_KEY=tu_key
VITE_OPENSKY_CLIENT_ID=tu_id
VITE_OPENSKY_CLIENT_SECRET=tu_secret
VITE_AVIATIONSTACK_KEY=tu_key
VITE_NASA_FIRMS_API_KEY=tu_key
VITE_CLOUDFLARE_API_TOKEN=tu_token
VITE_METACULUS_API_KEY=tu_key
VITE_MAPBOX_TOKEN=tu_token
VITE_HAPI_APP_IDENTIFIER=tu_identifier
VITE_BROADCASTIFY_API_KEY=tu_key
VITE_SENTRY_DSN=tu_dsn
```

5. Deploy → espera que termine
6. Abre tu URL de Vercel → el dashboard carga con datos reales

---

## Desarrollo local

```bash
cd arka-intelligence
npm install
cp .env.example .env
# Edita .env con tus keys reales
npm run dev
# Abre http://localhost:5173
```

Para el relay localmente:

```bash
cd arka-relay
npm install
cp .env.example .env
# Edita .env
npm run dev
# Corre en http://localhost:3001
```

---

## Paneles y fuentes de datos

| Panel | API | TTL |
|---|---|---|
| Markets | Finnhub | 30s |
| Commodities | Finnhub | 30s |
| Crypto | Finnhub (Binance feed) | 30s |
| Macro Indicators | FRED | 5min |
| News feeds (8 paneles) | Guardian + NYT + GDELT | 1min |
| AI Insights | Groq (LLaMA) | 1min |
| AI Deduction | Groq → OpenRouter fallback | on-demand |
| Earthquakes | USGS | 2min |
| Fires | NASA FIRMS | 2min |
| Predictions | Polymarket | 1min |
| Displacement | UNHCR | 10min |
| Breaking ticker | Guardian | 1min |

Paneles estáticos (datos base mientras se integran APIs dedicadas):
Military Posture, Cyber Threats, Theater Posture, GPS Jamming, Supply Chain, Gulf FDI, Layoffs

---

## Notas importantes

- **VITE_** prefix es obligatorio para que Vite exponga las variables al frontend
- El relay es necesario para OpenSky y AISStream (autenticación server-side)
- NewsAPI solo funciona en localhost en plan gratuito — en producción usa Guardian + GDELT
- Groq plan gratuito: 14,400 req/día — el dashboard hace ~5 llamadas AI por minuto activo
