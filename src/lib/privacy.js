import { useStore } from './store.js';
import { apiCacheStats, clearApiCache } from './api.js';
import { POLICY_VERSION } from './constants.js';

export { POLICY_VERSION };

/**
 * Canal de contato do controlador (LGPD art. 9º, III e art. 41).
 * Preencha antes de publicar — sem ele a política mostra um aviso de "não informado".
 */
export const PRIVACY_CONTACT = {
  controller: 'Fichário TCG (projeto independente)',
  email: '',
};

export const THIRD_PARTIES = [
  {
    id: 'github',
    name: 'GitHub Pages',
    url: 'https://docs.github.com/pt/site-policy/privacy-policies/github-general-privacy-statement',
    hosts: 'defaultzo.github.io',
    purpose: 'Hospedagem do site (entrega das páginas e arquivos do app).',
    data: 'Endereço IP, navegador (user-agent) e a página acessada, registrados por segurança.',
    basis: 'Legítimo interesse em manter o site seguro e no ar (art. 7º, IX)',
    essential: true,
  },
  {
    id: 'tcgdex',
    name: 'TCGdex',
    url: 'https://tcgdex.dev',
    hosts: 'api.tcgdex.net, assets.tcgdex.net',
    purpose: 'Busca de cartas, coleções, imagens e preços de referência.',
    data: 'Endereço IP, navegador (user-agent) e os termos da busca.',
    basis: 'Execução do serviço pedido por você (art. 7º, V)',
    essential: true,
  },
  {
    id: 'rates',
    name: 'ExchangeRate-API',
    url: 'https://www.exchangerate-api.com',
    hosts: 'open.er-api.com',
    purpose: 'Cotação do dólar e do euro para converter os preços em reais.',
    data: 'Endereço IP e navegador (user-agent).',
    basis: 'Consentimento quando automático (art. 7º, I); pedido seu quando você toca em "Buscar cotação".',
    essential: false,
  },
];

export function consentIsCurrent(consent) {
  return consent?.version === POLICY_VERSION;
}

/** Direito de acesso (art. 18, II): o que está guardado neste aparelho. */
export function storageInventory() {
  const { collection, wishlist, cards, consent } = useStore.getState();
  let appBytes = 0;
  try {
    appBytes = (localStorage.getItem('fichario-tcg-v1') || '').length * 2;
  } catch {
    /* armazenamento indisponível */
  }
  return {
    collection: collection.length,
    wishlist: wishlist.length,
    cards: Object.keys(cards).length,
    appBytes,
    cache: apiCacheStats(),
    consent,
  };
}

/** Direito de portabilidade (art. 18, V): tudo o que o app guarda, em JSON. */
export function exportBackup() {
  const { collection, wishlist, cards, settings, consent } = useStore.getState();
  const payload = {
    app: 'fichario-tcg',
    version: 1,
    exportedAt: new Date().toISOString(),
    collection,
    wishlist,
    cards,
    settings,
    consent,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fichario-tcg-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Direito de eliminação (art. 18, VI): apaga o fichário, os ajustes, o consentimento e o cache. */
export function wipeAllData() {
  useStore.getState().reset();
  useStore.persist.clearStorage();
  clearApiCache();
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
