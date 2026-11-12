import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, SearchX, X } from 'lucide-react';
import { api, PAGE_SIZE } from '../lib/api.js';
import { useAsync, useDebounced } from '../lib/hooks.js';
import { POPULAR_SEARCHES } from '../lib/constants.js';
import { useStore } from '../lib/store.js';
import { CardGrid } from '../components/CardGrid.jsx';
import { Chip, EmptyState, PageHeader, SkeletonGrid, Spinner } from '../components/ui.jsx';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const type = params.get('tipo') || '';
  const rarity = params.get('raridade') || '';
  const apiLang = useStore((s) => s.settings.apiLang);
  const [text, setText] = useState(q);
  const debounced = useDebounced(text.trim(), 350);

  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ loading: false, error: null, done: false });

  const types = useAsync(() => api.types(), [apiLang]);
  const rarities = useAsync(() => api.rarities(), [apiLang]);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next, { replace: true });
  };

  // Texto digitado → URL (com debounce, para não disparar uma busca por tecla).
  useEffect(() => {
    if (debounced !== q) update({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    let alive = true;
    setResults([]);
    setPage(1);
    if (!q && !type && !rarity) {
      setState({ loading: false, error: null, done: true });
      return;
    }
    setState({ loading: true, error: null, done: false });
    api
      .searchCards({ name: q, type, rarity, page: 1 })
      .then((r) => alive && (setResults(r), setState({ loading: false, error: null, done: r.length < PAGE_SIZE })))
      .catch((error) => alive && setState({ loading: false, error, done: true }));
    return () => {
      alive = false;
    };
  }, [q, type, rarity, apiLang]);

  const loadMore = () => {
    const next = page + 1;
    setState((s) => ({ ...s, loading: true }));
    api
      .searchCards({ name: q, type, rarity, page: next })
      .then((r) => {
        setResults((prev) => {
          const seen = new Set(prev.map((c) => c.id));
          return [...prev, ...r.filter((c) => !seen.has(c.id))];
        });
        setPage(next);
        setState({ loading: false, error: null, done: r.length < PAGE_SIZE });
      })
      .catch((error) => setState({ loading: false, error, done: false }));
  };

  const hasQuery = q || type || rarity;

  return (
    <div className="page">
      <PageHeader title="Buscar" />

      <div className="search-bar">
        <SearchIcon size={18} className="search-icon" />
        <input
          type="search"
          className="search-input"
          placeholder="Nome da carta, ex.: Charizard"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
          aria-label="Buscar cartas"
        />
        {text && (
          <button type="button" className="search-clear" aria-label="Limpar busca" onClick={() => setText('')}>
            <X size={14} strokeWidth={3} />
          </button>
        )}
      </div>

      <div className="filters">
        <select
          className="select"
          value={type}
          onChange={(e) => update({ tipo: e.target.value })}
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos os tipos</option>
          {(types.data || []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={rarity}
          onChange={(e) => update({ raridade: e.target.value })}
          aria-label="Filtrar por raridade"
        >
          <option value="">Todas as raridades</option>
          {(rarities.data || [])
            .filter((r) => r !== 'None')
            .map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
        </select>
      </div>

      {!hasQuery && (
        <section className="section">
          <h2 className="section-title">Buscas populares</h2>
          <div className="chips">
            {POPULAR_SEARCHES.map((s) => (
              <Chip key={s} onClick={() => setText(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {hasQuery && state.loading && results.length === 0 && <SkeletonGrid />}

      {state.error && results.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="A busca falhou"
          text="Não conseguimos falar com a base de cartas. Confira sua conexão."
        />
      )}

      {hasQuery && !state.loading && !state.error && results.length === 0 && (
        <EmptyState
          icon={SearchX}
          title="Nenhuma carta encontrada"
          text={
            apiLang === 'pt'
              ? 'Tente outro nome ou troque o idioma da base para inglês em Ajustes — há mais cartas catalogadas em EN.'
              : 'Tente outro nome ou remova os filtros.'
          }
        />
      )}

      {results.length > 0 && (
        <>
          <p className="result-count">
            {results.length}
            {state.done ? '' : '+'} {results.length === 1 ? 'carta' : 'cartas'}
          </p>
          <CardGrid cards={results} />
          {!state.done && (
            <div className="load-more">
              {state.loading ? (
                <Spinner />
              ) : (
                <button type="button" className="btn btn-secondary" onClick={loadMore}>
                  Carregar mais
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
