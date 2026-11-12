import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Recorte da carta guardado junto da coleção, para funcionar sem rede. */
export function snapshotCard(card) {
  return {
    id: card.id,
    name: card.name,
    image: card.image || null,
    localId: card.localId,
    rarity: card.rarity || null,
    category: card.category || null,
    types: card.types || [],
    setId: card.set?.id,
    setName: card.set?.name,
    setTotal: card.set?.cardCount?.official ?? card.set?.cardCount?.total ?? null,
    setSymbol: card.set?.symbol || null,
    variants: card.variants || null,
    pricing: card.pricing || null,
    pricedAt: Date.now(),
  };
}

const DEFAULT_SETTINGS = {
  apiLang: 'pt',
  theme: 'auto',
  usd: 5.4,
  eur: 5.9,
  autoRates: true,
  ratesUpdated: null,
};

export const useStore = create(
  persist(
    (set, get) => ({
      collection: [],
      wishlist: [],
      cards: {},
      settings: DEFAULT_SETTINGS,

      upsertCard: (snap) => set((s) => ({ cards: { ...s.cards, [snap.id]: snap } })),
      upsertCards: (snaps) =>
        set((s) => {
          const cards = { ...s.cards };
          for (const snap of snaps) if (snap) cards[snap.id] = snap;
          return { cards };
        }),

      addItem: (item) => {
        const full = { uid: uid(), addedAt: Date.now(), qty: 1, extras: [], forTrade: false, ...item };
        set((s) => ({ collection: [full, ...s.collection] }));
        return full;
      },
      updateItem: (id, patch) =>
        set((s) => ({ collection: s.collection.map((i) => (i.uid === id ? { ...i, ...patch } : i)) })),
      removeItem: (id) => {
        const item = get().collection.find((i) => i.uid === id);
        set((s) => ({ collection: s.collection.filter((i) => i.uid !== id) }));
        return item;
      },
      restoreItem: (item) => set((s) => ({ collection: [item, ...s.collection] })),

      addWish: (wish) => {
        const full = { uid: uid(), addedAt: Date.now(), priority: 2, ...wish };
        set((s) => ({ wishlist: [full, ...s.wishlist.filter((w) => w.cardId !== wish.cardId)] }));
        return full;
      },
      updateWish: (id, patch) =>
        set((s) => ({ wishlist: s.wishlist.map((w) => (w.uid === id ? { ...w, ...patch } : w)) })),
      removeWish: (id) => {
        const wish = get().wishlist.find((w) => w.uid === id);
        set((s) => ({ wishlist: s.wishlist.filter((w) => w.uid !== id) }));
        return wish;
      },
      restoreWish: (wish) => set((s) => ({ wishlist: [wish, ...s.wishlist] })),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      importData: (data) =>
        set({
          collection: Array.isArray(data.collection) ? data.collection : [],
          wishlist: Array.isArray(data.wishlist) ? data.wishlist : [],
          cards: data.cards && typeof data.cards === 'object' ? data.cards : {},
          settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
        }),
      reset: () => set({ collection: [], wishlist: [], cards: {}, settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'fichario-tcg-v1',
      version: 1,
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        settings: { ...DEFAULT_SETTINGS, ...(persisted?.settings || {}) },
      }),
    },
  ),
);

export const useRates = () => {
  const usd = useStore((s) => s.settings.usd);
  const eur = useStore((s) => s.settings.eur);
  return { usd, eur };
};
