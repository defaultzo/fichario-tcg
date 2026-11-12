import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Layers, Search as SearchIcon, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAsync, useCollectionStats } from '../lib/hooks.js';
import { useStore } from '../lib/store.js';
import { EmptyState, PageHeader, ProgressBar, Segmented, SetSymbol, Spinner } from '../components/ui.jsx';

function norm(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export default function Sets() {
  const apiLang = useStore((s) => s.settings.apiLang);
  const { data, loading, error, reload } = useAsync(() => api.allSeries(), [apiLang]);
  const stats = useCollectionStats();
  const [filter, setFilter] = useState('');
  const [scope, setScope] = useState('all');

  const ownedBySet = useMemo(() => Object.fromEntries(stats.sets.map((s) => [s.id, s.ownedCount])), [stats.sets]);

  const series = useMemo(() => {
    if (!data) return [];
    const f = norm(filter);
    return data
      .map((serie) => ({
        ...serie,
        sets: [...(serie.sets || [])]
          .reverse()
          .filter((s) => !f || norm(s.name).includes(f) || norm(s.id).includes(f) || norm(serie.name).includes(f))
          .filter((s) => scope === 'all' || ownedBySet[s.id]),
      }))
      .filter((s) => s.sets.length);
  }, [data, filter, scope, ownedBySet]);

  return (
    <div className="page">
      <PageHeader title="Coleções" subtitle="Expansões por série, com o seu progresso em cada uma." />

      <div className="toolbar">
        <div className="search-bar search-bar-sm">
          <SearchIcon size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Filtrar expansões"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="Filtrar expansões"
          />
          {filter && (
            <button type="button" className="search-clear" aria-label="Limpar" onClick={() => setFilter('')}>
              <X size={14} strokeWidth={3} />
            </button>
          )}
        </div>
        <Segmented
          size="sm"
          ariaLabel="Mostrar"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'mine', label: 'Com cartas minhas', count: stats.sets.length },
          ]}
        />
      </div>

      {loading && <Spinner />}
      {error && (
        <EmptyState
          icon={Layers}
          title="Não foi possível carregar as coleções"
          text="Confira sua conexão."
          action={
            <button type="button" className="btn btn-secondary" onClick={reload}>
              Tentar de novo
            </button>
          }
        />
      )}
      {!loading && !error && series.length === 0 && (
        <EmptyState
          icon={Layers}
          title={scope === 'mine' ? 'Nenhuma expansão iniciada' : 'Nada encontrado'}
          text={scope === 'mine' ? 'Adicione cartas ao fichário para ver o progresso aqui.' : 'Tente outro termo.'}
        />
      )}

      {series.map((serie) => (
        <section key={serie.id} className="section">
          <h2 className="section-title">
            {serie.name}
            {serie.releaseDate && <span className="muted"> · desde {serie.releaseDate.slice(0, 4)}</span>}
          </h2>
          <div className="set-grid">
            {serie.sets.map((s) => {
              const total = s.cardCount?.official || s.cardCount?.total || 0;
              const owned = ownedBySet[s.id] || 0;
              return (
                <Link key={s.id} to={`/colecoes/${s.id}`} className="set-card">
                  <div className="set-logo">
                    {s.logo ? (
                      <img src={`${s.logo}.webp`} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    ) : s.symbol ? (
                      <SetSymbol src={s.symbol} className="set-logo-symbol" />
                    ) : (
                      <Layers size={26} className="muted" />
                    )}
                  </div>
                  <div className="set-card-body">
                    <span className="set-card-name">{s.name}</span>
                    <span className="set-card-meta">
                      {owned > 0 ? `${owned}/${total}` : `${total} cartas`}
                      <ChevronRight size={15} />
                    </span>
                    {owned > 0 && <ProgressBar value={owned} max={total || owned} />}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
