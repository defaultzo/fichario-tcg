import { CONDITION_BY_ID } from './constants.js';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const usd = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' });
const eur = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR' });

export function formatBRL(v) {
  return v == null || Number.isNaN(v) ? '—' : brl.format(v);
}

export function formatCurrency(v, unit) {
  if (v == null) return '—';
  if (unit === 'USD') return usd.format(v);
  if (unit === 'EUR') return eur.format(v);
  return brl.format(v);
}

export function parseMoney(str) {
  if (str == null || str === '') return null;
  const n = Number(String(str).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function toBRL(value, unit, rates) {
  if (value == null) return null;
  if (unit === 'EUR') return value * rates.eur;
  if (unit === 'USD') return value * rates.usd;
  return value;
}

const TCG_LABELS = {
  normal: 'Normal',
  holofoil: 'Foil',
  'reverse-holofoil': 'Reverse Foil',
  '1st-edition': '1ª Edição',
  '1st-edition-normal': '1ª Edição',
  '1st-edition-holofoil': '1ª Edição Foil',
  'unlimited-holofoil': 'Unlimited Foil',
  unlimited: 'Unlimited',
};

function tcgEntries(pricing) {
  const tp = pricing?.tcgplayer;
  if (!tp) return [];
  return Object.entries(tp).filter(([, v]) => v && typeof v === 'object');
}

const TCG_PREFS = {
  normal: ['normal', 'unlimited', '1st-edition-normal', '1st-edition'],
  foil: ['holofoil', 'unlimited-holofoil', '1st-edition-holofoil'],
  reverse: ['reverse-holofoil'],
};
const TCG_PREFS_1ED = {
  normal: ['1st-edition-normal', '1st-edition', 'normal', 'unlimited'],
  foil: ['1st-edition-holofoil', 'holofoil', 'unlimited-holofoil'],
  reverse: ['reverse-holofoil'],
};

/** Preço de referência (carta NM) em R$ para um acabamento. */
export function referencePrice(pricing, finish = 'normal', extras = [], rates) {
  if (!pricing) return null;
  const prefs = (extras.includes('1ed') ? TCG_PREFS_1ED : TCG_PREFS)[finish] || TCG_PREFS.normal;
  const entries = Object.fromEntries(tcgEntries(pricing));
  for (const key of prefs) {
    const e = entries[key];
    const v = e && (e.marketPrice ?? e.midPrice ?? e.lowPrice);
    if (v) return toBRL(v, pricing.tcgplayer.unit || 'USD', rates);
  }
  const cm = pricing.cardmarket;
  if (cm) {
    const holo = finish !== 'normal';
    const v = holo
      ? cm['trend-holo'] ?? cm['avg-holo'] ?? cm.trend ?? cm.avg
      : cm.trend ?? cm.avg ?? cm['trend-holo'];
    if (v) return toBRL(v, cm.unit || 'EUR', rates);
  }
  const any = Object.values(entries).find((e) => e.marketPrice ?? e.midPrice);
  if (any) return toBRL(any.marketPrice ?? any.midPrice, pricing.tcgplayer.unit || 'USD', rates);
  return null;
}

/** Valor estimado de uma cópia: referência × fator do estado × quantidade. */
export function itemValue(item, card, rates) {
  const ref = referencePrice(card?.pricing, item.finish, item.extras, rates);
  if (ref == null) return null;
  const mult = CONDITION_BY_ID[item.condition]?.mult ?? 1;
  return ref * mult * (item.qty || 1);
}

/** Tabelas do guia de preços, no formato menor / médio / maior. */
export function priceGuide(pricing, rates) {
  if (!pricing) return { tcg: [], cm: [] };
  const unit = pricing.tcgplayer?.unit || 'USD';
  const tcg = tcgEntries(pricing).map(([key, e]) => ({
    key,
    label: TCG_LABELS[key] || key,
    unit,
    low: e.lowPrice,
    mid: e.marketPrice ?? e.midPrice,
    high: e.highPrice,
    lowBRL: toBRL(e.lowPrice, unit, rates),
    midBRL: toBRL(e.marketPrice ?? e.midPrice, unit, rates),
    highBRL: toBRL(e.highPrice, unit, rates),
  }));
  const cm = [];
  const c = pricing.cardmarket;
  if (c) {
    const u = c.unit || 'EUR';
    if (c.avg != null || c.low != null) {
      cm.push({
        key: 'normal',
        label: 'Normal',
        unit: u,
        low: c.low,
        mid: c.avg30 ?? c.avg,
        high: c.trend,
        lowBRL: toBRL(c.low, u, rates),
        midBRL: toBRL(c.avg30 ?? c.avg, u, rates),
        highBRL: toBRL(c.trend, u, rates),
      });
    }
    if (c['avg-holo'] != null || c['low-holo'] != null) {
      cm.push({
        key: 'holo',
        label: 'Foil / Reverse',
        unit: u,
        low: c['low-holo'],
        mid: c['avg30-holo'] ?? c['avg-holo'],
        high: c['trend-holo'],
        lowBRL: toBRL(c['low-holo'], u, rates),
        midBRL: toBRL(c['avg30-holo'] ?? c['avg-holo'], u, rates),
        highBRL: toBRL(c['trend-holo'], u, rates),
      });
    }
  }
  return { tcg, cm, updated: pricing.tcgplayer?.updated || pricing.cardmarket?.updated };
}
