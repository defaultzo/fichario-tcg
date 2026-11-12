import { useStore } from './store.js';

const BASE = 'https://api.tcgdex.net/v2';
const DAY = 24 * 60 * 60 * 1000;
const mem = new Map();

function apiLang() {
  return useStore.getState().settings.apiLang || 'pt';
}

function readCache(key, ttl) {
  try {
    const raw = localStorage.getItem('tcgdex:' + key);
    if (!raw) return undefined;
    const { t, d } = JSON.parse(raw);
    if (Date.now() - t < ttl) return d;
  } catch {
    /* cache indisponível */
  }
  return undefined;
}

function writeCache(key, data) {
  try {
    localStorage.setItem('tcgdex:' + key, JSON.stringify({ t: Date.now(), d: data }));
  } catch {
    /* sem espaço: segue sem cache */
  }
}

async function get(path, { ttl = 0, force = false } = {}) {
  const lang = apiLang();
  const key = `${lang}${path}`;
  if (!force && mem.has(key)) return mem.get(key);
  if (!force && ttl) {
    const cached = readCache(key, ttl);
    if (cached !== undefined) {
      const p = Promise.resolve(cached);
      mem.set(key, p);
      return p;
    }
  }
  const p = fetch(`${BASE}/${lang}${path}`)
    .then((r) => {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`Falha na API (${r.status})`);
      return r.json();
    })
    .then((data) => {
      if (ttl && data) writeCache(key, data);
      return data;
    });
  p.catch(() => mem.delete(key));
  mem.set(key, p);
  return p;
}

function query(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
}

export const PAGE_SIZE = 36;

export const api = {
  searchCards({ name, type, rarity, page = 1 }) {
    if (!name && !type && !rarity) return Promise.resolve([]);
    const q = query({
      name,
      types: type,
      rarity,
      'pagination:page': page,
      'pagination:itemsPerPage': PAGE_SIZE,
    });
    return get(`/cards?${q}`).then((r) => r || []);
  },
  card: (id, opts) => get(`/cards/${encodeURIComponent(id)}`, opts),
  set: (id) => get(`/sets/${encodeURIComponent(id)}`, { ttl: DAY }),
  series: () => get('/series', { ttl: DAY }),
  serie: (id) => get(`/series/${encodeURIComponent(id)}`, { ttl: DAY }),
  types: () => get('/types', { ttl: 7 * DAY }),
  rarities: () => get('/rarities', { ttl: 7 * DAY }),
  async allSeries() {
    const list = (await api.series()) || [];
    const details = await Promise.all(list.map((s) => api.serie(s.id).catch(() => null)));
    return details
      .filter(Boolean)
      .sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
  },
};

export function cardImage(url, quality = 'low') {
  return url ? `${url}/${quality}.webp` : null;
}

// Limita requisições simultâneas ao atualizar muitos preços de uma vez.
export async function mapLimit(items, limit, fn, onProgress) {
  const results = new Array(items.length);
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i]);
      } catch {
        results[i] = null;
      }
      onProgress?.(++done, items.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function fetchRates() {
  const r = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!r.ok) throw new Error('Cotação indisponível');
  const d = await r.json();
  const brl = d?.rates?.BRL;
  const eur = d?.rates?.EUR;
  if (!brl || !eur) throw new Error('Cotação indisponível');
  return { usd: +brl.toFixed(4), eur: +(brl / eur).toFixed(4) };
}
