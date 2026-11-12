// Estados de conservação no padrão usado pela LigaPokemon.
// `mult` é o fator aplicado sobre o preço de referência (que é de carta NM).
export const CONDITIONS = [
  {
    id: 'M',
    name: 'Mint',
    label: 'Nova',
    mult: 1.15,
    color: '#0a9fd8',
    desc: 'Perfeita, sem nenhum sinal de uso. Saiu do booster direto para o protetor.',
  },
  {
    id: 'NM',
    name: 'Near Mint',
    label: 'Praticamente nova',
    mult: 1,
    color: '#1f9d55',
    desc: 'Pode ter uma imperfeição mínima, visível só de perto. Bordas e superfície intactas.',
  },
  {
    id: 'SP',
    name: 'Slightly Played',
    label: 'Levemente usada',
    mult: 0.85,
    color: '#7aa61c',
    desc: 'Pequenos desgastes nas bordas ou nas pontas e arranhões leves na superfície.',
  },
  {
    id: 'MP',
    name: 'Moderately Played',
    label: 'Moderadamente usada',
    mult: 0.7,
    color: '#d19a00',
    desc: 'Desgaste visível nas bordas, arranhões e leve perda de brilho. Sem dobras.',
  },
  {
    id: 'HP',
    name: 'Heavily Played',
    label: 'Muito usada',
    mult: 0.5,
    color: '#e5641b',
    desc: 'Desgaste forte, bordas brancas, vincos leves ou manchas.',
  },
  {
    id: 'D',
    name: 'Damaged',
    label: 'Danificada',
    mult: 0.3,
    color: '#d93025',
    desc: 'Rasgos, dobras fortes, marcas de água, escrita ou partes faltando.',
  },
];

export const CONDITION_BY_ID = Object.fromEntries(CONDITIONS.map((c) => [c.id, c]));
export const CONDITION_RANK = Object.fromEntries(CONDITIONS.map((c, i) => [c.id, i]));

export const LANGUAGES = [
  { id: 'PT', label: 'Português' },
  { id: 'EN', label: 'Inglês' },
  { id: 'JP', label: 'Japonês' },
  { id: 'ES', label: 'Espanhol' },
  { id: 'FR', label: 'Francês' },
  { id: 'DE', label: 'Alemão' },
  { id: 'IT', label: 'Italiano' },
  { id: 'KO', label: 'Coreano' },
  { id: 'ZH', label: 'Chinês' },
];
export const LANGUAGE_BY_ID = Object.fromEntries(LANGUAGES.map((l) => [l.id, l]));

// Acabamento: uma escolha por cópia.
export const FINISHES = [
  { id: 'normal', label: 'Normal', variantKey: 'normal' },
  { id: 'foil', label: 'Foil', variantKey: 'holo' },
  { id: 'reverse', label: 'Reverse Foil', variantKey: 'reverse' },
];
export const FINISH_BY_ID = Object.fromEntries(FINISHES.map((f) => [f.id, f]));

// Extras: várias por cópia, como na Liga.
export const EXTRAS = [
  { id: '1ed', label: '1ª Edição', variantKey: 'firstEdition' },
  { id: 'promo', label: 'Promo' },
  { id: 'prerelease', label: 'Pré-Release' },
  { id: 'staff', label: 'Staff' },
  { id: 'shadowless', label: 'Shadowless' },
  { id: 'stamped', label: 'Carimbada' },
  { id: 'signed', label: 'Assinada' },
  { id: 'altered', label: 'Alterada' },
  { id: 'oversize', label: 'Oversize' },
  { id: 'graded', label: 'Graduada' },
];
export const EXTRA_BY_ID = Object.fromEntries(EXTRAS.map((e) => [e.id, e]));

export const PRIORITIES = [
  { id: 3, label: 'Alta' },
  { id: 2, label: 'Média' },
  { id: 1, label: 'Baixa' },
];

export const TYPE_COLORS = {
  Planta: '#4caf50',
  Fogo: '#f05a28',
  Água: '#2f8fe0',
  Elétrico: '#f2c300',
  Psíquico: '#a65fd1',
  Lutador: '#c0662a',
  Sombrio: '#3c4a5a',
  Metal: '#8a9aa8',
  Fada: '#e86fae',
  Dragão: '#b08a1e',
  Incolor: '#a0a0a0',
  Grass: '#4caf50',
  Fire: '#f05a28',
  Water: '#2f8fe0',
  Lightning: '#f2c300',
  Psychic: '#a65fd1',
  Fighting: '#c0662a',
  Darkness: '#3c4a5a',
  Metal_: '#8a9aa8',
  Fairy: '#e86fae',
  Dragon: '#b08a1e',
  Colorless: '#a0a0a0',
};

export const POPULAR_SEARCHES = [
  'Charizard',
  'Pikachu',
  'Umbreon',
  'Mewtwo',
  'Gengar',
  'Eevee',
  'Lugia',
  'Rayquaza',
  'Gardevoir',
  'Greninja',
];

/**
 * Versão da política de privacidade. Ao mudar o texto de forma relevante, atualize a data:
 * o aviso de privacidade volta a aparecer e o consentimento é pedido de novo.
 */
export const POLICY_VERSION = '2026-11-12';
