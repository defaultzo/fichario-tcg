import { Heart } from 'lucide-react';
import { CardImage } from './ui.jsx';
import { useCardSheet, useOwnedMap, useWishedSet } from '../lib/hooks.js';

export function CardTile({ card, owned, wished, dimmed, meta, onOpen }) {
  return (
    <button
      type="button"
      className={`tile ${dimmed ? 'is-dimmed' : ''}`}
      onClick={() => onOpen(card.id)}
      aria-label={`${card.name}${owned ? `, você tem ${owned}` : ''}`}
    >
      <div className="tile-media">
        <CardImage src={card.image} alt={card.name} />
        {owned > 0 && <span className="tile-badge">{owned}×</span>}
        {wished && !owned && (
          <span className="tile-badge tile-badge-wish" aria-label="Na lista de desejos">
            <Heart size={12} fill="currentColor" />
          </span>
        )}
      </div>
      <span className="tile-name">{card.name}</span>
      <span className="tile-meta">{meta ?? `#${card.localId}`}</span>
    </button>
  );
}

export function CardGrid({ cards, missingDim = false, metaFor }) {
  const owned = useOwnedMap();
  const wished = useWishedSet();
  const { open } = useCardSheet();
  return (
    <div className="card-grid">
      {cards.map((c) => (
        <CardTile
          key={c.id}
          card={c}
          owned={owned[c.id] || 0}
          wished={wished.has(c.id)}
          dimmed={missingDim && !owned[c.id]}
          meta={metaFor?.(c)}
          onOpen={open}
        />
      ))}
    </div>
  );
}
