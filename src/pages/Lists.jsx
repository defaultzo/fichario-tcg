import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeftRight, Check, Heart, Share2 } from 'lucide-react';
import { CONDITION_BY_ID, LANGUAGE_BY_ID, PRIORITIES } from '../lib/constants.js';
import { formatBRL, itemValue, referencePrice } from '../lib/pricing.js';
import { useCardSheet, useOwnedMap } from '../lib/hooks.js';
import { useRates, useStore } from '../lib/store.js';
import { cardLabel } from '../components/CardDetail.jsx';
import { CardImage, ConditionBadge, EmptyState, LangBadge, PageHeader, Segmented } from '../components/ui.jsx';

async function shareText(title, text) {
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      await navigator.share({ title, text });
      return;
    }
  } catch (e) {
    if (e?.name === 'AbortError') return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Lista copiada — é só colar no WhatsApp ou no grupo');
  } catch {
    toast.error('Não foi possível copiar a lista');
  }
}

export default function Lists() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('aba') || 'desejos';
  const collection = useStore((s) => s.collection);
  const wishlist = useStore((s) => s.wishlist);
  const cards = useStore((s) => s.cards);
  const rates = useRates();
  const owned = useOwnedMap();
  const { open } = useCardSheet();

  const trades = useMemo(() => collection.filter((i) => i.forTrade), [collection]);
  const wishes = useMemo(
    () => [...wishlist].sort((a, b) => b.priority - a.priority || (b.addedAt || 0) - (a.addedAt || 0)),
    [wishlist],
  );

  const setTab = (v) => {
    const next = new URLSearchParams(params);
    next.set('aba', v);
    setParams(next, { replace: true });
  };

  const shareWishes = () => {
    const lines = wishes.map((w) => {
      const c = cards[w.cardId];
      const parts = [
        c ? `${c.name} — ${c.setName} ${c.localId}${c.setTotal ? '/' + c.setTotal : ''}` : w.cardId,
        `mín. ${w.minCondition}`,
        w.language !== 'ANY' ? w.language : null,
        w.maxPrice != null ? `até ${formatBRL(w.maxPrice)}` : null,
      ];
      return '• ' + parts.filter(Boolean).join(' · ');
    });
    shareText('Minha lista de desejos', `Procuro (Pokémon TCG):\n${lines.join('\n')}`);
  };

  const shareTrades = () => {
    const lines = trades.map((i) => '• ' + cardLabel(i, cards[i.cardId]));
    shareText('Tenho para troca', `Tenho para troca (Pokémon TCG):\n${lines.join('\n')}`);
  };

  const list = tab === 'desejos' ? wishes : trades;
  const onShare = tab === 'desejos' ? shareWishes : shareTrades;

  return (
    <div className="page">
      <PageHeader
        title="Listas"
        actions={
          list.length > 0 && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={onShare}>
              <Share2 size={16} /> <span>Compartilhar</span>
            </button>
          )
        }
      />
      <div className="toolbar">
        <Segmented
          ariaLabel="Lista"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'desejos', label: 'Desejos', count: wishes.length },
            { value: 'trocas', label: 'Para troca', count: trades.length },
          ]}
        />
      </div>

      {tab === 'desejos' &&
        (wishes.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nenhum desejo ainda"
            text="Na ficha de qualquer carta, toque no coração para dizer o estado mínimo, o idioma e quanto aceita pagar."
            action={
              <Link to="/buscar" className="btn btn-primary">
                Buscar cartas
              </Link>
            }
          />
        ) : (
          <div className="group">
            {wishes.map((w) => {
              const c = cards[w.cardId];
              const ref = referencePrice(c?.pricing, 'normal', [], rates);
              const est = ref != null ? ref * (CONDITION_BY_ID[w.minCondition]?.mult ?? 1) : null;
              const fits = w.maxPrice != null && est != null && est <= w.maxPrice;
              return (
                <button key={w.uid} type="button" className="row row-link list-row" onClick={() => open(w.cardId)}>
                  <CardImage src={c?.image} alt="" className="row-thumb" />
                  <div className="row-main">
                    <span className="row-title">{c?.name || w.cardId}</span>
                    <span className="row-sub">
                      {c?.setName} · {c?.localId}
                      {c?.setTotal ? `/${c.setTotal}` : ''}
                    </span>
                    <span className="row-badges">
                      <span className="muted">mín.</span>
                      <ConditionBadge id={w.minCondition} />
                      {w.language !== 'ANY' && <LangBadge id={w.language} />}
                      <span className={`prio prio-${w.priority}`}>
                        {PRIORITIES.find((p) => p.id === w.priority)?.label}
                      </span>
                      {owned[w.cardId] > 0 && (
                        <span className="have-badge">
                          <Check size={11} strokeWidth={3} /> Já tem {owned[w.cardId]}
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="row-value row-value-stack">
                    <span>{formatBRL(est)}</span>
                    {w.maxPrice != null && (
                      <small className={fits ? 'pos' : 'muted'}>
                        {fits ? 'cabe no orçamento' : `máx. ${formatBRL(w.maxPrice)}`}
                      </small>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ))}

      {tab === 'trocas' &&
        (trades.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Nada para troca"
            text="Marque “Disponível para troca” numa cópia do fichário e ela aparece aqui, pronta para compartilhar."
          />
        ) : (
          <div className="group">
            {trades.map((i) => {
              const c = cards[i.cardId];
              return (
                <button key={i.uid} type="button" className="row row-link list-row" onClick={() => open(i.cardId)}>
                  <CardImage src={c?.image} alt="" className="row-thumb" />
                  <div className="row-main">
                    <span className="row-title">
                      {i.qty > 1 && <span className="muted">{i.qty}× </span>}
                      {c?.name || i.cardId}
                    </span>
                    <span className="row-sub">
                      {c?.setName} · {LANGUAGE_BY_ID[i.language]?.label}
                    </span>
                    <span className="row-badges">
                      <ConditionBadge id={i.condition} />
                      <LangBadge id={i.language} />
                    </span>
                  </div>
                  <span className="row-value">{formatBRL(itemValue(i, c, rates))}</span>
                </button>
              );
            })}
          </div>
        ))}
    </div>
  );
}
