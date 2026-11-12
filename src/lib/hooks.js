import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './store.js';
import { itemValue } from './pricing.js';

export function useAsync(fn, deps) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(fn)
      .then(
        (data) => alive && setState({ data, error: null, loading: false }),
        (error) => alive && setState({ data: undefined, error, loading: false }),
      );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

export function useMediaQuery(query) {
  const subscribe = useCallback(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

export function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Abre/fecha a ficha da carta via `?carta=` — o botão voltar do celular fecha a ficha. */
export function useCardSheet() {
  const navigate = useNavigate();
  const location = useLocation();
  const open = useCallback(
    (id) => {
      const params = new URLSearchParams(location.search);
      params.set('carta', id);
      const wasOpen = new URLSearchParams(location.search).has('carta');
      navigate(
        { pathname: location.pathname, search: '?' + params.toString() },
        { state: { sheet: true }, replace: wasOpen },
      );
    },
    [navigate, location],
  );
  const close = useCallback(() => {
    if (location.state?.sheet) {
      navigate(-1);
    } else {
      const params = new URLSearchParams(location.search);
      params.delete('carta');
      const qs = params.toString();
      navigate({ pathname: location.pathname, search: qs ? '?' + qs : '' }, { replace: true });
    }
  }, [navigate, location]);
  return { open, close };
}

export function useOwnedMap() {
  const collection = useStore((s) => s.collection);
  return useMemo(() => {
    const map = {};
    for (const i of collection) map[i.cardId] = (map[i.cardId] || 0) + (i.qty || 1);
    return map;
  }, [collection]);
}

export function useWishedSet() {
  const wishlist = useStore((s) => s.wishlist);
  return useMemo(() => new Set(wishlist.map((w) => w.cardId)), [wishlist]);
}

/** Estatísticas derivadas da coleção, usadas no Início e no Fichário. */
export function useCollectionStats() {
  const collection = useStore((s) => s.collection);
  const cards = useStore((s) => s.cards);
  const usd = useStore((s) => s.settings.usd);
  const eur = useStore((s) => s.settings.eur);
  return useMemo(() => {
    const rates = { usd, eur };
    let total = 0;
    let count = 0;
    let paid = 0;
    let unpriced = 0;
    const unique = new Set();
    const byCondition = {};
    const byLanguage = {};
    const sets = {};
    const valued = [];
    for (const item of collection) {
      const card = cards[item.cardId];
      const qty = item.qty || 1;
      const value = itemValue(item, card, rates);
      count += qty;
      unique.add(item.cardId);
      if (value == null) unpriced += qty;
      else total += value;
      if (item.pricePaid != null) paid += item.pricePaid * qty;
      byCondition[item.condition] = (byCondition[item.condition] || 0) + qty;
      byLanguage[item.language] = (byLanguage[item.language] || 0) + qty;
      if (card?.setId) {
        const s = (sets[card.setId] ||= {
          id: card.setId,
          name: card.setName,
          total: card.setTotal,
          symbol: card.setSymbol,
          owned: new Set(),
          lastAdded: 0,
        });
        s.owned.add(item.cardId);
        s.lastAdded = Math.max(s.lastAdded, item.addedAt || 0);
      }
      valued.push({ item, card, value });
    }
    const setList = Object.values(sets)
      .map((s) => ({ ...s, ownedCount: s.owned.size }))
      .sort((a, b) => b.lastAdded - a.lastAdded);
    return {
      total,
      count,
      paid,
      unpriced,
      unique: unique.size,
      byCondition,
      byLanguage,
      sets: setList,
      valued,
      rates,
    };
  }, [collection, cards, usd, eur]);
}

export function useLockBody(active) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);
}

export function useLatest(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
