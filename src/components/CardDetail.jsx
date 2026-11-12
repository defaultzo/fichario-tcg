import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeftRight, Heart, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { snapshotCard, useRates, useStore } from '../lib/store.js';
import { EXTRA_BY_ID, FINISH_BY_ID, LANGUAGE_BY_ID, PRIORITIES, TYPE_COLORS } from '../lib/constants.js';
import { formatBRL, formatCurrency, itemValue, priceGuide, referencePrice } from '../lib/pricing.js';
import { ConditionBadge, LangBadge, Spinner } from './ui.jsx';
import { TiltCard } from './TiltCard.jsx';
import { ItemForm, WishForm } from './ItemForm.jsx';

const HOLO_RE = /holo|ultra|ilustra|illustration|secret|hiper|hyper|shiny|brilhante|radiante|radiant|incr|dupla|double|ace|amazing|vmax|vstar/i;

function PriceTable({ title, rows, cols }) {
  if (!rows.length) return null;
  return (
    <div className="price-table">
      <div className="price-table-title">{title}</div>
      <div className="price-row price-row-head">
        <span />
        {cols.map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      {rows.map((r) => (
        <div className="price-row" key={r.key}>
          <span className="price-row-label">{r.label}</span>
          {['low', 'mid', 'high'].map((k) => (
            <span key={k} className={k === 'mid' ? 'price-mid' : ''}>
              {formatBRL(r[k + 'BRL'])}
              <small>{formatCurrency(r[k], r.unit)}</small>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function CopyRow({ item, card, rates, onEdit, onRemove, onToggleTrade }) {
  const value = itemValue(item, card, rates);
  return (
    <div className="copy-row">
      <div className="copy-main">
        <div className="copy-badges">
          <span className="copy-qty">{item.qty}×</span>
          <ConditionBadge id={item.condition} />
          <LangBadge id={item.language} />
          <span className="copy-finish">{FINISH_BY_ID[item.finish]?.label}</span>
          {item.forTrade && (
            <span className="trade-badge">
              <ArrowLeftRight size={11} /> Troca
            </span>
          )}
        </div>
        {(item.extras?.length > 0 || item.notes) && (
          <div className="copy-sub">
            {item.extras?.map((x) => EXTRA_BY_ID[x]?.label).join(' · ')}
            {item.extras?.length > 0 && item.notes ? ' — ' : ''}
            {item.notes}
          </div>
        )}
        <div className="copy-sub">
          {formatBRL(value)} estimado
          {item.pricePaid != null && <> · pago {formatBRL(item.pricePaid * item.qty)}</>}
        </div>
      </div>
      <div className="copy-actions">
        <button
          type="button"
          className={`icon-btn ${item.forTrade ? 'is-on' : ''}`}
          aria-label={item.forTrade ? 'Tirar da lista de troca' : 'Colocar para troca'}
          aria-pressed={item.forTrade}
          onClick={onToggleTrade}
        >
          <ArrowLeftRight size={17} />
        </button>
        <button type="button" className="icon-btn" aria-label="Editar cópia" onClick={onEdit}>
          <Pencil size={17} />
        </button>
        <button type="button" className="icon-btn icon-btn-danger" aria-label="Remover cópia" onClick={onRemove}>
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

export function CardDetail({ cardId, onClose }) {
  const apiLang = useStore((s) => s.settings.apiLang);
  const stored = useStore((s) => s.cards[cardId]);
  const allItems = useStore((s) => s.collection);
  const wishlist = useStore((s) => s.wishlist);
  const { addItem, updateItem, removeItem, restoreItem, upsertCard, addWish, updateWish, removeWish, restoreWish } =
    useStore.getState();
  const rates = useRates();
  const [mode, setMode] = useState('view'); // view | add | edit:<uid> | wish
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, error, reload } = useAsync(() => api.card(cardId), [cardId, apiLang]);
  const items = useMemo(() => allItems.filter((i) => i.cardId === cardId), [allItems, cardId]);
  const wish = wishlist.find((w) => w.cardId === cardId);

  // Usa a versão da API quando chega; enquanto isso (ou offline), o recorte salvo.
  const card = data || (stored ? { ...stored, set: { id: stored.setId, name: stored.setName } } : null);
  const snap = data ? snapshotCard(data) : stored;
  const tracked = items.length > 0 || !!wish;

  useEffect(() => {
    if (data && tracked) upsertCard(snapshotCard(data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, tracked]);

  useEffect(() => setMode('view'), [cardId]);

  if (!card) {
    return (
      <div className="detail">
        <DetailTop onClose={onClose} title="Carta" />
        {loading ? (
          <Spinner />
        ) : (
          <div className="empty">
            <h3>{error ? 'Não foi possível carregar a carta' : 'Carta não encontrada'}</h3>
            <p>{error ? 'Verifique sua conexão e tente de novo.' : 'Ela pode não existir no idioma escolhido.'}</p>
            {error && (
              <button type="button" className="btn btn-secondary" onClick={reload}>
                Tentar de novo
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  const guide = priceGuide(snap?.pricing, rates);
  const ref = referencePrice(snap?.pricing, 'normal', [], rates);
  const ownedQty = items.reduce((n, i) => n + (i.qty || 1), 0);
  const ownedValue = items.reduce((n, i) => n + (itemValue(i, snap, rates) || 0), 0);
  const setTotal = card.set?.cardCount?.official ?? snap?.setTotal;
  const holo = HOLO_RE.test(card.rarity || '');

  const save = (values) => {
    upsertCard(snapshotCard(data || { ...stored, set: { id: stored.setId, name: stored.setName } }));
    if (mode === 'add') {
      addItem({ ...values, cardId });
      toast.success(`${card.name} entrou no fichário`);
    } else {
      updateItem(mode.slice(5), values);
      toast.success('Cópia atualizada');
    }
    setMode('view');
  };

  const remove = (uid) => {
    const removed = removeItem(uid);
    toast(`${card.name} removida`, {
      action: { label: 'Desfazer', onClick: () => restoreItem(removed) },
    });
  };

  const saveWish = (values) => {
    if (data) upsertCard(snapshotCard(data));
    if (wish) {
      updateWish(wish.uid, values);
      toast.success('Desejo atualizado');
    } else {
      addWish({ ...values, cardId });
      toast.success(`${card.name} na lista de desejos`);
    }
    setMode('view');
  };

  const dropWish = () => {
    const removed = removeWish(wish.uid);
    toast('Removida dos desejos', { action: { label: 'Desfazer', onClick: () => restoreWish(removed) } });
  };

  const refreshPrice = async () => {
    setRefreshing(true);
    try {
      const fresh = await api.card(cardId, { force: true });
      if (fresh && tracked) upsertCard(snapshotCard(fresh));
      reload();
      toast.success('Preços atualizados');
    } catch {
      toast.error('Sem conexão para atualizar os preços');
    } finally {
      setRefreshing(false);
    }
  };

  const editing = mode.startsWith('edit:') ? items.find((i) => i.uid === mode.slice(5)) : null;

  return (
    <div className="detail">
      <DetailTop onClose={onClose} title={card.name} />
      <div className="detail-layout">
        <div className="detail-visual">
          <TiltCard src={card.image} alt={card.name} holo={holo} />
        </div>

        <div className="detail-info">
          <div className="detail-head">
            <h2 className="detail-title">{card.name}</h2>
            <p className="detail-set">
              {card.set?.id ? (
                <Link to={`/colecoes/${card.set.id}`} onClick={onClose} className="link">
                  {card.set.name}
                </Link>
              ) : (
                card.set?.name
              )}
              {' · '}
              {card.localId}
              {setTotal ? `/${setTotal}` : ''}
            </p>
            <div className="detail-tags">
              {card.rarity && card.rarity !== 'None' && <span className="tag">{card.rarity}</span>}
              {card.types?.map((t) => (
                <span key={t} className="tag tag-type" style={{ '--t': TYPE_COLORS[t] || '#999' }}>
                  {t}
                </span>
              ))}
              {card.hp && <span className="tag">HP {card.hp}</span>}
            </div>
          </div>

          <div className="ref-price">
            <div>
              <span className="ref-price-label">Preço de referência (NM)</span>
              <strong className="ref-price-value">{formatBRL(ref)}</strong>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label="Atualizar preços"
              onClick={refreshPrice}
              disabled={refreshing}
            >
              <RefreshCw size={17} className={refreshing ? 'spin' : ''} />
            </button>
          </div>

          {mode === 'view' && (
            <div className="detail-actions">
              <button type="button" className="btn btn-primary btn-grow" onClick={() => setMode('add')}>
                <Plus size={18} /> Adicionar ao fichário
              </button>
              <button
                type="button"
                className={`btn btn-secondary btn-icon ${wish ? 'is-wished' : ''}`}
                aria-label={wish ? 'Editar desejo' : 'Adicionar aos desejos'}
                onClick={() => setMode('wish')}
              >
                <Heart size={19} fill={wish ? 'currentColor' : 'none'} />
              </button>
            </div>
          )}

          {mode === 'add' && (
            <section className="detail-section">
              <h3 className="section-title">Nova cópia</h3>
              <ItemForm card={snap || card} apiLang={apiLang} onSave={save} onCancel={() => setMode('view')} />
            </section>
          )}
          {editing && (
            <section className="detail-section">
              <h3 className="section-title">Editar cópia</h3>
              <ItemForm
                key={editing.uid}
                card={snap || card}
                initial={editing}
                apiLang={apiLang}
                onSave={save}
                onCancel={() => setMode('view')}
              />
            </section>
          )}
          {mode === 'wish' && (
            <section className="detail-section">
              <h3 className="section-title">{wish ? 'Editar desejo' : 'Quero esta carta'}</h3>
              <WishForm initial={wish} onSave={saveWish} onCancel={() => setMode('view')} />
            </section>
          )}

          {mode === 'view' && items.length > 0 && (
            <section className="detail-section">
              <h3 className="section-title">
                No seu fichário <span className="muted">· {ownedQty} {ownedQty === 1 ? 'cópia' : 'cópias'} · {formatBRL(ownedValue)}</span>
              </h3>
              <div className="group">
                {items.map((i) => (
                  <CopyRow
                    key={i.uid}
                    item={i}
                    card={snap}
                    rates={rates}
                    onEdit={() => setMode('edit:' + i.uid)}
                    onRemove={() => remove(i.uid)}
                    onToggleTrade={() => {
                      updateItem(i.uid, { forTrade: !i.forTrade });
                      toast(i.forTrade ? 'Saiu da lista de troca' : 'Disponível para troca');
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {mode === 'view' && wish && (
            <section className="detail-section">
              <h3 className="section-title">Na lista de desejos</h3>
              <div className="group">
                <div className="copy-row">
                  <div className="copy-main">
                    <div className="copy-badges">
                      <span className="muted">Mínimo</span>
                      <ConditionBadge id={wish.minCondition} />
                      {wish.language !== 'ANY' && <LangBadge id={wish.language} />}
                      <span className="copy-finish">
                        Prioridade {PRIORITIES.find((p) => p.id === wish.priority)?.label.toLowerCase()}
                      </span>
                    </div>
                    <div className="copy-sub">
                      {wish.maxPrice != null ? `Até ${formatBRL(wish.maxPrice)}` : 'Sem limite de preço'}
                      {wish.notes ? ` — ${wish.notes}` : ''}
                    </div>
                  </div>
                  <div className="copy-actions">
                    <button type="button" className="icon-btn" aria-label="Editar desejo" onClick={() => setMode('wish')}>
                      <Pencil size={17} />
                    </button>
                    <button type="button" className="icon-btn icon-btn-danger" aria-label="Remover desejo" onClick={dropWish}>
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {mode === 'view' && (
            <section className="detail-section">
              <h3 className="section-title">Guia de preços</h3>
              {guide.tcg.length || guide.cm.length ? (
                <>
                  <PriceTable title="TCGplayer (EUA)" rows={guide.tcg} cols={['Menor', 'Mercado', 'Maior']} />
                  <PriceTable title="Cardmarket (Europa)" rows={guide.cm} cols={['Menor', 'Média 30d', 'Tendência']} />
                  <p className="field-hint">
                    Valores de referência internacionais convertidos para real (US$ 1 = {formatBRL(rates.usd)} · € 1 ={' '}
                    {formatBRL(rates.eur)}). O valor da sua cópia aplica o fator do estado sobre o preço NM.
                    {guide.updated && <> Atualizado em {new Date(guide.updated).toLocaleDateString('pt-BR')}.</>}
                  </p>
                </>
              ) : (
                <p className="muted">Sem preço de referência disponível para esta carta.</p>
              )}
            </section>
          )}

          {mode === 'view' && data && <CardFacts card={data} />}
        </div>
      </div>
    </div>
  );
}

function DetailTop({ onClose, title }) {
  return (
    <div className="detail-top">
      <span className="detail-top-title">{title}</span>
      <button type="button" className="close-btn" aria-label="Fechar" onClick={onClose}>
        <X size={18} strokeWidth={2.4} />
      </button>
    </div>
  );
}

function CardFacts({ card }) {
  const rows = [
    ['Categoria', card.category],
    ['Estágio', card.stage],
    ['Evolui de', card.evolveFrom],
    ['Fraqueza', card.weaknesses?.map((w) => `${w.type} ${w.value || ''}`).join(', ')],
    ['Resistência', card.resistances?.map((w) => `${w.type} ${w.value || ''}`).join(', ')],
    ['Recuo', card.retreat != null ? String(card.retreat) : null],
    ['Marca de regulamento', card.regulationMark],
    ['Ilustrador', card.illustrator],
    [
      'Formatos',
      card.legal
        ? [card.legal.standard && 'Padrão', card.legal.expanded && 'Expandido'].filter(Boolean).join(', ') || 'Nenhum'
        : null,
    ],
  ].filter(([, v]) => v);

  return (
    <section className="detail-section">
      <h3 className="section-title">Sobre a carta</h3>
      {card.abilities?.map((a) => (
        <div key={a.name} className="attack">
          <div className="attack-head">
            <span className="ability-tag">{a.type || 'Habilidade'}</span>
            <strong>{a.name}</strong>
          </div>
          {a.effect && <p>{a.effect}</p>}
        </div>
      ))}
      {card.attacks?.map((a) => (
        <div key={a.name} className="attack">
          <div className="attack-head">
            <span className="energy-row">
              {a.cost?.map((c, i) => (
                <span key={i} className="energy" style={{ '--t': TYPE_COLORS[c] || '#999' }} title={c} />
              ))}
            </span>
            <strong>{a.name}</strong>
            {a.damage != null && <span className="attack-dmg">{a.damage}</span>}
          </div>
          {a.effect && <p>{a.effect}</p>}
        </div>
      ))}
      {card.effect && <p className="attack">{card.effect}</p>}
      {rows.length > 0 && (
        <dl className="facts">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

export function cardLabel(item, card) {
  const parts = [
    `${item.qty}x ${card?.name || item.cardId}`,
    card ? `${card.setName} ${card.localId}${card.setTotal ? '/' + card.setTotal : ''}` : null,
    item.condition,
    LANGUAGE_BY_ID[item.language] ? item.language : null,
    FINISH_BY_ID[item.finish]?.label,
    ...(item.extras || []).map((x) => EXTRA_BY_ID[x]?.label),
  ];
  return parts.filter(Boolean).join(' · ');
}
