// ============================================================
//  ARKA — AI API
//  Todas las llamadas van por relay /ai (Groq server-side).
//  Las API keys NO están en el bundle del frontend.
// ============================================================
import { relayFetch } from './config.js';

async function llmCall(messages, max_tokens = 500) {
  return relayFetch('/ai', {
    method: 'POST',
    body: JSON.stringify({ messages, max_tokens }),
  });
}

// ── AI Insights — analiza headlines recientes ────────────────
export async function fetchInsights(headlines = []) {
  if (!headlines.length) return [];

  const prompt = `You are a geopolitical and financial intelligence analyst for ARKA Intelligence Center.
Analyze these recent headlines and generate 3 concise intelligence insights (signal patterns, risk correlations, market implications).

Headlines:
${headlines.slice(0, 15).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Respond ONLY with valid JSON array, no markdown:
[
  {"head": "Short title (5-7 words)", "body": "2-3 sentence analysis", "conf": "XX%", "time": "just now"},
  ...
]`;

  try {
    const resp = await llmCall([{ role: 'user', content: prompt }]);
    const text = resp.choices?.[0]?.message?.content || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return [];
  }
}

// ── AI Deduction — análisis profundo on-demand ───────────────
export async function fetchDeduction(context = '', query = '') {
  const prompt = `You are ARKA Intelligence, an elite geopolitical and financial analysis system.

Context: ${context}
Query: ${query || 'Provide a strategic intelligence assessment of current global risk environment.'}

Provide a structured intelligence assessment with:
1. Key risk vectors (2-3)
2. Market implications
3. Recommended monitoring priorities

Be concise, factual, and analytical. Maximum 300 words.`;

  try {
    const resp = await llmCall([{ role: 'user', content: prompt }]);
    return resp.choices?.[0]?.message?.content || '';
  } catch (err) {
    return `Analysis unavailable: ${err.message}`;
  }
}

// ── Breaking ticker — genera alertas breves ──────────────────
export async function generateBreakingAlerts(headlines = []) {
  if (!headlines.length) return headlines;

  const prompt = `Convert these news headlines into brief breaking news alerts (max 80 chars each).
Add severity emoji: 🔴 critical, 🟡 high, 🟢 normal.

Headlines:
${headlines.slice(0, 8).map(h => `- ${h}`).join('\n')}

Respond ONLY with JSON array of strings, no markdown:
["🔴 Alert text here", "🟡 Alert text here", ...]`;

  try {
    const resp = await llmCall([{ role: 'user', content: prompt }]);
    const text = resp.choices?.[0]?.message?.content || '[]';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return headlines.slice(0, 8).map(h => `🟡 ${h.slice(0, 80)}`);
  }
}
