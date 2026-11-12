import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Search, Settings, Sparkles } from 'lucide-react';
import { CONDITIONS, LANGUAGE_BY_ID } from '../lib/constants.js';
import { formatBRL } from '../lib/pricing.js';
import { useCardSheet, useCollectionStats } from '../lib/hooks.js';
import { useStore } from '../lib/store.js';
import { CardImage, ConditionBadge, PageHeader, ProgressBar, SetSymbol } from '../components/ui.jsx';

function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

export default function Home() {
  const stats = useCollectionStats();
  const wishCount = useStore((s) => s.wishlist.length);
  const tradeCount = useStore((s) => s.collection.filter((i) => i.forTrade).length);
  const { open } = useCardSheet();

  const top = useMemo(
    () =>
      stats.valued
        .filter((v) => v.value != null)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10),
    [stats.valued],
  );
  const recent = useMemo(
    () => [...stats.valued].sort((a, b) => (b.item.addedAt || 0) - (a.item.addedAt || 0)).slice(0, 10),
    [stats.valued],
  );

  const settingsLink = (
    <Link to="/ajustes" className="icon-btn icon-btn-lg only-mobile" aria-label="Ajustes">
      <Settings size={21} />
    </Link>
  );

  if (stats.count === 0) {
    return (
      <div className="page">
        <PageHeader title="Início" actions={settingsLink} />
        <div className="hero-empty">
          <div className="hero-empty-art" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2>Seu fichário começa aqui</h2>
          <p>
            Busque uma carta, registre o estado (M, NM, SP, MP, HP ou D), o idioma e o acabamento. O Fichário calcula o
            valor da coleção, acompanha o progresso de cada expansão e monta suas listas de desejos e trocas.
          </p>
          <div className="hero-empty-actions">
            <Link to="/buscar" className="btn btn-primary">
              <Search size={18} /> Buscar cartas
            </Link>
            <Link to="/colecoes" className="btn btn-secondary">
              Ver coleções
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const profit = stats.paid > 0 ? stats.total - stats.paid : null;

  return (
    <div className="page">
      <PageHeader title="Início" actions={settingsLink} />

      <section className="value-card">
        <span className="value-label">Valor estimado da coleção</span>
        <strong className="value-total">{formatBRL(stats.total)}</strong>
        <span className="value-sub">
          {profit != null && (
            <span className={profit >= 0 ? 'pos' : 'neg'}>
              {profit >= 0 ? '+' : ''}
              {formatBRL(profit)} sobre o que você pagou
            </span>
          )}
          {stats.unpriced > 0 && <span>{stats.unpriced} sem preço de referência</span>}
        </span>
      </section>

      <div className="stats-grid">
        <Stat label="Cartas" value={stats.count} />
        <Stat label="Únicas" value={stats.unique} />
        <Stat label="Desejos" value={wishCount} />
        <Stat label="Para troca" value={tradeCount} />
      </div>

      <section className="section">
        <h2 className="section-title">Estado das cartas</h2>
        <div className="group group-pad">
          <div className="dist-bar" role="img" aria-label="Distribuição por estado">
            {CONDITIONS.filter((c) => stats.byCondition[c.id]).map((c) => (
              <span
                key={c.id}
                style={{ flexGrow: stats.byCondition[c.id], background: c.color }}
                title={`${c.id}: ${stats.byCondition[c.id]}`}
              />
            ))}
          </div>
          <div className="dist-legend">
            {CONDITIONS.filter((c) => stats.byCondition[c.id]).map((c) => (
              <span key={c.id} className="dist-item">
                <ConditionBadge id={c.id} />
                <span className="muted">{c.label}</span>
                <strong>{stats.byCondition[c.id]}</strong>
              </span>
            ))}
          </div>
          <div className="dist-langs">
            {Object.entries(stats.byLanguage)
              .sort((a, b) => b[1] - a[1])
              .map(([id, n]) => (
                <span key={id} className="dist-lang">
                  {LANGUAGE_BY_ID[id]?.label || id} <strong>{n}</strong>
                </span>
              ))}
          </div>
        </div>
      </section>

      {top.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">
              <Sparkles size={17} /> Mais valiosas
            </h2>
            <Link to="/fichario?ordem=valor" className="link">
              Ver todas
            </Link>
          </div>
          <div className="rail">
            {top.map(({ item, card, value }) => (
              <button key={item.uid} type="button" className="rail-item" onClick={() => open(item.cardId)}>
                <CardImage src={card?.image} alt={card?.name || item.cardId} />
                <span className="tile-name">{card?.name}</span>
                <span className="rail-value">{formatBRL(value)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {stats.sets.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">Coleções em andamento</h2>
            <Link to="/colecoes" className="link">
              Todas
            </Link>
          </div>
          <div className="group">
            {stats.sets.slice(0, 5).map((s) => (
              <Link key={s.id} to={`/colecoes/${s.id}`} className="row row-link">
                <SetSymbol src={s.symbol} />
                <div className="row-main">
                  <span className="row-title">{s.name}</span>
                  <ProgressBar value={s.ownedCount} max={s.total || s.ownedCount} />
                </div>
                <span className="row-value">
                  {s.ownedCount}
                  {s.total ? `/${s.total}` : ''}
                </span>
                <ChevronRight size={18} className="chev" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">Adicionadas recentemente</h2>
          <Link to="/fichario" className="link">
            <BookOpen size={15} /> Fichário
          </Link>
        </div>
        <div className="rail">
          {recent.map(({ item, card }) => (
            <button key={item.uid} type="button" className="rail-item" onClick={() => open(item.cardId)}>
              <CardImage src={card?.image} alt={card?.name || item.cardId} />
              <span className="tile-name">{card?.name}</span>
              <span className="rail-meta">
                <ConditionBadge id={item.condition} /> {item.qty > 1 && `${item.qty}×`}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
