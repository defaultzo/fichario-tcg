import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Layers } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAsync, useOwnedMap } from '../lib/hooks.js';
import { useStore } from '../lib/store.js';
import { CardGrid } from '../components/CardGrid.jsx';
import { EmptyState, ProgressBar, Segmented, SkeletonGrid } from '../components/ui.jsx';

export default function SetDetail() {
  const { setId } = useParams();
  const apiLang = useStore((s) => s.settings.apiLang);
  const { data: set, loading, error, reload } = useAsync(() => api.set(setId), [setId, apiLang]);
  const owned = useOwnedMap();
  const [view, setView] = useState('all');

  const cards = set?.cards || [];
  const ownedCount = useMemo(() => cards.filter((c) => owned[c.id]).length, [cards, owned]);
  const official = set?.cardCount?.official || cards.length;
  const shown = useMemo(() => {
    if (view === 'have') return cards.filter((c) => owned[c.id]);
    if (view === 'missing') return cards.filter((c) => !owned[c.id]);
    return cards;
  }, [cards, owned, view]);

  return (
    <div className="page">
      <Link to="/colecoes" className="back-link">
        <ChevronLeft size={20} /> Coleções
      </Link>

      {loading && (
        <>
          <div className="set-hero skeleton" style={{ height: 120 }} />
          <SkeletonGrid />
        </>
      )}
      {error && (
        <EmptyState
          icon={Layers}
          title="Não foi possível carregar a expansão"
          action={
            <button type="button" className="btn btn-secondary" onClick={reload}>
              Tentar de novo
            </button>
          }
        />
      )}
      {!loading && !error && !set && <EmptyState icon={Layers} title="Expansão não encontrada" />}

      {set && (
        <>
          <header className="set-hero">
            {set.logo && <img className="set-hero-logo" src={`${set.logo}.webp`} alt="" />}
            <div className="set-hero-info">
              <h1 className="large-title">{set.name}</h1>
              <p className="page-subtitle">
                {set.serie?.name}
                {set.releaseDate && ` · ${new Date(set.releaseDate + 'T12:00').toLocaleDateString('pt-BR')}`}
                {` · ${official} cartas`}
                {set.cardCount?.total > official && ` (+${set.cardCount.total - official} secretas)`}
              </p>
              <div className="set-progress">
                <ProgressBar value={ownedCount} max={official} />
                <span>
                  <strong>{ownedCount}</strong>/{official} ·{' '}
                  {Math.min(100, Math.round((ownedCount / (official || 1)) * 100))}%
                </span>
              </div>
            </div>
          </header>

          <div className="toolbar">
            <Segmented
              ariaLabel="Mostrar cartas"
              value={view}
              onChange={setView}
              options={[
                { value: 'all', label: 'Todas', count: cards.length },
                { value: 'have', label: 'Tenho', count: ownedCount },
                { value: 'missing', label: 'Faltam', count: cards.length - ownedCount },
              ]}
            />
          </div>

          {shown.length === 0 ? (
            <EmptyState
              icon={Layers}
              title={view === 'have' ? 'Nenhuma carta desta expansão ainda' : 'Expansão completa!'}
              text={view === 'have' ? 'Toque numa carta para adicioná-la ao fichário.' : 'Você tem todas as cartas listadas.'}
            />
          ) : (
            <CardGrid cards={shown} missingDim={view === 'all'} metaFor={(c) => `${c.localId}/${official}`} />
          )}
        </>
      )}
    </div>
  );
}
