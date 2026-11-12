import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeftRight, BookOpen, LayoutGrid, List, RefreshCw, Search as SearchIcon, X } from 'lucide-react';
import { api, mapLimit } from '../lib/api.js';
import { CONDITIONS, CONDITION_RANK, FINISH_BY_ID, LANGUAGES } from '../lib/constants.js';
import { formatBRL } from '../lib/pricing.js';
import { useCardSheet, useCollectionStats } from '../lib/hooks.js';
import { snapshotCard, useStore } from '../lib/store.js';
import { CardImage, Chip, ConditionBadge, EmptyState, LangBadge, PageHeader, Segmented } from '../components/ui.jsx';

const SORTS = [
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'valor', label: 'Maior valor' },
  { value: 'nome', label: 'Nome (A–Z)' },
  { value: 'colecao', label: 'Expansão e número' },
  { value: 'estado', label: 'Melhor estado' },
];

function norm(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export async function refreshAllPrices() {
  const { collection, wishlist, upsertCards } = useStore.getState();
  const ids = [...new Set([...collection.map((i) => i.cardId), ...wishlist.map((w) => w.cardId)])];
  if (!ids.length) return;
  const tid = toast.loading(`Atualizando preços… 0/${ids.length}`);
  const fresh = await mapLimit(
    ids,
    4,
    (id) => api.card(id, { force: true }),
    (done, total) => toast.loading(`Atualizando preços… ${done}/${total}`, { id: tid }),
  );
  const snaps = fresh.filter(Boolean).map(snapshotCard);
  upsertCards(snaps);
  const failed = ids.length - snaps.length;
  if (failed) toast.warning(`${snaps.length} atualizadas, ${failed} sem resposta`, { id: tid });
  else toast.success(`Preços de ${snaps.length} cartas atualizados`, { id: tid });
}

export default function Collection() {
  const [params, setParams] = useSearchParams();
  const stats = useCollectionStats();
  const { open } = useCardSheet();
  const [text, setText] = useState('');
  const [conds, setConds] = useState([]);
  const [lang, setLang] = useState('');
  const [onlyTrade, setOnlyTrade] = useState(false);
  const [busy, setBusy] = useState(false);
  const sort = params.get('ordem') || 'recentes';
  const view = params.get('modo') || 'grade';

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    next.set(k, v);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => {
    const f = norm(text);
    const list = stats.valued.filter(({ item, card }) => {
      if (f && !norm(card?.name).includes(f) && !norm(card?.setName).includes(f)) return false;
      if (conds.length && !conds.includes(item.condition)) return false;
      if (lang && item.language !== lang) return false;
      if (onlyTrade && !item.forTrade) return false;
      return true;
    });
    const by = {
      recentes: (a, b) => (b.item.addedAt || 0) - (a.item.addedAt || 0),
      valor: (a, b) => (b.value ?? -1) - (a.value ?? -1),
      nome: (a, b) => (a.card?.name || '').localeCompare(b.card?.name || '', 'pt-BR'),
      colecao: (a, b) =>
        (a.card?.setName || '').localeCompare(b.card?.setName || '', 'pt-BR') ||
        (parseInt(a.card?.localId, 10) || 0) - (parseInt(b.card?.localId, 10) || 0),
      estado: (a, b) => CONDITION_RANK[a.item.condition] - CONDITION_RANK[b.item.condition],
    }[sort];
    return list.sort(by);
  }, [stats.valued, text, conds, lang, onlyTrade, sort]);

  const filteredTotal = rows.reduce((n, r) => n + (r.value || 0), 0);
  const filteredCount = rows.reduce((n, r) => n + (r.item.qty || 1), 0);
  const filtering = text || conds.length || lang || onlyTrade;
  const usedLangs = LANGUAGES.filter((l) => stats.byLanguage[l.id]);

  const refresh = async () => {
    setBusy(true);
    try {
      await refreshAllPrices();
    } finally {
      setBusy(false);
    }
  };

  if (stats.count === 0) {
    return (
      <div className="page">
        <PageHeader title="Fichário" />
        <EmptyState
          icon={BookOpen}
          title="Seu fichário está vazio"
          text="Abra qualquer carta e toque em “Adicionar ao fichário” para registrar estado, idioma e acabamento."
          action={
            <Link to="/buscar" className="btn btn-primary">
              Buscar cartas
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Fichário"
        subtitle={`${stats.count} ${stats.count === 1 ? 'carta' : 'cartas'} · ${stats.unique} ${
          stats.unique === 1 ? 'única' : 'únicas'
        } · ${formatBRL(stats.total)}`}
        actions={
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={refresh}
            disabled={busy}
            aria-label="Atualizar preços"
          >
            <RefreshCw size={16} className={busy ? 'spin' : ''} />
            <span className="hide-xs">Atualizar preços</span>
          </button>
        }
      />

      <div className="toolbar">
        <div className="search-bar search-bar-sm">
          <SearchIcon size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Filtrar por nome ou expansão"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Filtrar fichário"
          />
          {text && (
            <button type="button" className="search-clear" aria-label="Limpar" onClick={() => setText('')}>
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
        <div className="toolbar-row">
          <select className="select select-sm" value={sort} onChange={(e) => setParam('ordem', e.target.value)} aria-label="Ordenar">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <Segmented
            size="sm"
            ariaLabel="Visualização"
            value={view}
            onChange={(v) => setParam('modo', v)}
            options={[
              { value: 'grade', label: <LayoutGrid size={16} aria-label="Grade" /> },
              { value: 'lista', label: <List size={16} aria-label="Lista" /> },
            ]}
          />
        </div>
      </div>

      <div className="chips chips-scroll">
        {CONDITIONS.filter((c) => stats.byCondition[c.id]).map((c) => (
          <Chip
            key={c.id}
            color={c.color}
            active={conds.includes(c.id)}
            onClick={() => setConds((xs) => (xs.includes(c.id) ? xs.filter((x) => x !== c.id) : [...xs, c.id]))}
          >
            {c.id} <span className="chip-count">{stats.byCondition[c.id]}</span>
          </Chip>
        ))}
        {usedLangs.length > 1 &&
          usedLangs.map((l) => (
            <Chip key={l.id} active={lang === l.id} onClick={() => setLang(lang === l.id ? '' : l.id)}>
              {l.id}
            </Chip>
          ))}
        <Chip active={onlyTrade} onClick={() => setOnlyTrade(!onlyTrade)}>
          <ArrowLeftRight size={13} /> Para troca
        </Chip>
      </div>

      {filtering && (
        <p className="result-count">
          {filteredCount} {filteredCount === 1 ? 'carta' : 'cartas'} · {formatBRL(filteredTotal)}
        </p>
      )}

      {rows.length === 0 && <EmptyState icon={SearchIcon} title="Nada com esses filtros" />}

      {view === 'grade' ? (
        <div className="card-grid">
          {rows.map(({ item, card, value }) => (
            <button key={item.uid} type="button" className="tile" onClick={() => open(item.cardId)}>
              <div className="tile-media">
                <CardImage src={card?.image} alt={card?.name || item.cardId} />
                {item.qty > 1 && <span className="tile-badge">{item.qty}×</span>}
                {item.forTrade && (
                  <span className="tile-badge tile-badge-trade" aria-label="Para troca">
                    <ArrowLeftRight size={11} />
                  </span>
                )}
              </div>
              <span className="tile-name">{card?.name || item.cardId}</span>
              <span className="tile-meta tile-meta-row">
                <ConditionBadge id={item.condition} />
                <LangBadge id={item.language} />
                <span className="tile-price">{formatBRL(value)}</span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="group">
          {rows.map(({ item, card, value }) => (
            <button key={item.uid} type="button" className="row row-link list-row" onClick={() => open(item.cardId)}>
              <CardImage src={card?.image} alt="" className="row-thumb" />
              <div className="row-main">
                <span className="row-title">
                  {item.qty > 1 && <span className="muted">{item.qty}× </span>}
                  {card?.name || item.cardId}
                </span>
                <span className="row-sub">
                  {card?.setName} · {card?.localId}
                  {card?.setTotal ? `/${card.setTotal}` : ''}
                </span>
                <span className="row-badges">
                  <ConditionBadge id={item.condition} />
                  <LangBadge id={item.language} />
                  <span className="copy-finish">{FINISH_BY_ID[item.finish]?.label}</span>
                  {item.forTrade && (
                    <span className="trade-badge">
                      <ArrowLeftRight size={11} /> Troca
                    </span>
                  )}
                </span>
              </div>
              <span className="row-value">{formatBRL(value)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
