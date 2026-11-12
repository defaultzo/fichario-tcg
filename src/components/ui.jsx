import { useId, useState } from 'react';
import { motion } from 'motion/react';
import { Minus, Plus } from 'lucide-react';
import { CONDITION_BY_ID, LANGUAGE_BY_ID } from '../lib/constants.js';
import { cardImage } from '../lib/api.js';

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="large-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function ConditionBadge({ id, full = false }) {
  const c = CONDITION_BY_ID[id];
  if (!c) return null;
  return (
    <span className="cond-badge" style={{ '--c': c.color }} title={`${c.name} — ${c.label}`}>
      {c.id}
      {full && <span className="cond-badge-label">{c.label}</span>}
    </span>
  );
}

export function LangBadge({ id }) {
  if (!id) return null;
  return (
    <span className="lang-badge" title={LANGUAGE_BY_ID[id]?.label}>
      {id}
    </span>
  );
}

/** Controle segmentado; a pílula desliza entre opções (indica o estado escolhido). */
export function Segmented({ options, value, onChange, size, ariaLabel }) {
  const id = useId();
  return (
    <div className={`segmented ${size === 'sm' ? 'segmented-sm' : ''}`} role="tablist" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`segmented-item ${active ? 'is-active' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="segmented-pill"
                transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              />
            )}
            <span className="segmented-label">
              {o.label}
              {o.count != null && <span className="segmented-count">{o.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ active, onClick, children, color }) {
  return (
    <button
      type="button"
      className={`chip ${active ? 'is-active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
      style={color ? { '--chip-c': color } : undefined}
    >
      {children}
    </button>
  );
}

export function Stepper({ value, onChange, min = 1, max = 999 }) {
  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper-btn"
        aria-label="Diminuir"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={18} />
      </button>
      <input
        className="stepper-input"
        inputMode="numeric"
        aria-label="Quantidade"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
          onChange(Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min);
        }}
      />
      <button
        type="button"
        className="stepper-btn"
        aria-label="Aumentar"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

export function Switch({ checked, onChange, label }) {
  return (
    <label className="switch-row">
      <span>{label}</span>
      <input
        type="checkbox"
        className="switch"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

/** Imagem da carta: aparece com fade quando carrega; se a versão PT falhar, tenta a EN. */
export function CardImage({ src, alt, quality = 'low', className = '', eager = false }) {
  const [state, setState] = useState({ src, url: cardImage(src, quality), loaded: false, failed: false });
  if (state.src !== src) {
    setState({ src, url: cardImage(src, quality), loaded: false, failed: false });
  }
  const onError = () => {
    if (state.url && state.url.includes('/pt/')) {
      setState((s) => ({ ...s, url: s.url.replace('/pt/', '/en/') }));
    } else {
      setState((s) => ({ ...s, failed: true }));
    }
  };
  if (!state.url || state.failed) {
    return (
      <div className={`card-img card-img-fallback ${className}`} role="img" aria-label={alt}>
        <span className="card-fallback-ball" />
        <span className="card-fallback-name">{alt}</span>
      </div>
    );
  }
  return (
    <div className={`card-img ${state.loaded ? 'is-loaded' : ''} ${className}`}>
      <img
        src={state.url}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        onLoad={() => setState((s) => ({ ...s, loaded: true }))}
        onError={onError}
      />
    </div>
  );
}

export function SetSymbol({ src, className = 'set-symbol' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <span className={className} aria-hidden="true" />;
  return <img className={className} src={`${src}.webp`} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty">
      {Icon && (
        <div className="empty-icon">
          <Icon size={28} strokeWidth={1.8} />
        </div>
      )}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Spinner({ label = 'Carregando' }) {
  return (
    <div className="spinner-wrap" role="status" aria-label={label}>
      <span className="spinner" />
    </div>
  );
}

export function ProgressBar({ value, max, color }) {
  const pct = max ? Math.min(1, value / max) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <span className="progress-fill" style={{ transform: `scaleX(${pct})`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

export function SkeletonGrid({ count = 12 }) {
  return (
    <div className="card-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="tile">
          <div className="card-img skeleton" />
          <div className="skeleton skeleton-line" />
        </div>
      ))}
    </div>
  );
}
