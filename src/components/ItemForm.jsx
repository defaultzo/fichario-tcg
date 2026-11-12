import { useMemo, useState } from 'react';
import { CONDITIONS, CONDITION_BY_ID, EXTRAS, FINISHES, LANGUAGES, PRIORITIES } from '../lib/constants.js';
import { formatBRL, itemValue, parseMoney } from '../lib/pricing.js';
import { useRates } from '../lib/store.js';
import { Chip, Segmented, Stepper, Switch } from './ui.jsx';

// Junta as variantes catalogadas com as que têm preço (o catálogo às vezes omite o foil).
function availableFinishes(card) {
  const variants = card.variants;
  if (!variants) return FINISHES;
  const tcg = card.pricing?.tcgplayer || {};
  const priced = {
    normal: tcg.normal || tcg.unlimited,
    foil: tcg.holofoil || tcg['unlimited-holofoil'] || tcg['1st-edition-holofoil'],
    reverse: tcg['reverse-holofoil'],
  };
  const list = FINISHES.filter((f) => variants[f.variantKey] || priced[f.id]);
  return list.length ? list : FINISHES;
}

function defaultLang(apiLang) {
  return apiLang === 'en' ? 'EN' : 'PT';
}

export function ConditionPicker({ value, onChange, allowAny = false }) {
  const selected = CONDITION_BY_ID[value];
  return (
    <div className="field">
      <span className="field-label">{allowAny ? 'Estado mínimo' : 'Estado da carta'}</span>
      <div className="cond-grid">
        {CONDITIONS.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`cond-option ${value === c.id ? 'is-active' : ''}`}
            style={{ '--c': c.color }}
            aria-pressed={value === c.id}
            onClick={() => onChange(c.id)}
          >
            <strong>{c.id}</strong>
            <span>{c.label}</span>
          </button>
        ))}
      </div>
      {selected && (
        <p className="field-hint">
          <b>{selected.name}:</b> {selected.desc}
        </p>
      )}
    </div>
  );
}

function LanguagePicker({ value, onChange, allowAny }) {
  const opts = allowAny ? [{ id: 'ANY', label: 'Qualquer' }, ...LANGUAGES] : LANGUAGES;
  return (
    <div className="field">
      <span className="field-label">Idioma</span>
      <div className="chips">
        {opts.map((l) => (
          <Chip key={l.id} active={value === l.id} onClick={() => onChange(l.id)}>
            {l.id === 'ANY' ? l.label : `${l.id} · ${l.label}`}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/** Formulário de uma cópia da carta no fichário (adicionar ou editar). */
export function ItemForm({ card, initial, apiLang, onSave, onCancel }) {
  const rates = useRates();
  const finishes = availableFinishes(card);
  const [qty, setQty] = useState(initial?.qty ?? 1);
  const [condition, setCondition] = useState(initial?.condition ?? 'NM');
  const [language, setLanguage] = useState(initial?.language ?? defaultLang(apiLang));
  const [finish, setFinish] = useState(initial?.finish ?? finishes[0].id);
  const [extras, setExtras] = useState(initial?.extras ?? []);
  const [pricePaid, setPricePaid] = useState(
    initial?.pricePaid != null ? String(initial.pricePaid).replace('.', ',') : '',
  );
  const [forTrade, setForTrade] = useState(initial?.forTrade ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const estimate = useMemo(
    () => itemValue({ qty, condition, finish, extras }, card, rates),
    [qty, condition, finish, extras, card, rates],
  );

  const toggleExtra = (id) =>
    setExtras((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      qty,
      condition,
      language,
      finish,
      extras,
      pricePaid: parseMoney(pricePaid),
      forTrade,
      notes: notes.trim(),
    });
  };

  return (
    <form className="form" onSubmit={submit}>
      <div className="field field-inline">
        <span className="field-label">Quantidade</span>
        <Stepper value={qty} onChange={setQty} />
      </div>

      <ConditionPicker value={condition} onChange={setCondition} />
      <LanguagePicker value={language} onChange={setLanguage} />

      <div className="field">
        <span className="field-label">Acabamento</span>
        <Segmented
          ariaLabel="Acabamento"
          options={finishes.map((f) => ({ value: f.id, label: f.label }))}
          value={finish}
          onChange={setFinish}
        />
      </div>

      <div className="field">
        <span className="field-label">Extras</span>
        <div className="chips">
          {EXTRAS.map((x) => (
            <Chip key={x.id} active={extras.includes(x.id)} onClick={() => toggleExtra(x.id)}>
              {x.label}
            </Chip>
          ))}
        </div>
      </div>

      <label className="field">
        <span className="field-label">Preço pago (por unidade)</span>
        <div className="input-prefix">
          <span>R$</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder="0,00"
            value={pricePaid}
            onChange={(e) => setPricePaid(e.target.value.replace(/[^\d,.]/g, ''))}
          />
        </div>
      </label>

      <div className="field">
        <Switch checked={forTrade} onChange={setForTrade} label="Disponível para troca" />
      </div>

      <label className="field">
        <span className="field-label">Observações</span>
        <textarea
          className="input textarea"
          rows={2}
          placeholder="Ex.: guardada no fichário azul, página 3"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <div className="form-estimate">
        <span>Valor estimado</span>
        <strong>{formatBRL(estimate)}</strong>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          {initial ? 'Salvar alterações' : 'Adicionar ao fichário'}
        </button>
      </div>
    </form>
  );
}

/** Formulário da lista de desejos. */
export function WishForm({ initial, onSave, onCancel }) {
  const [minCondition, setMinCondition] = useState(initial?.minCondition ?? 'SP');
  const [language, setLanguage] = useState(initial?.language ?? 'ANY');
  const [maxPrice, setMaxPrice] = useState(
    initial?.maxPrice != null ? String(initial.maxPrice).replace('.', ',') : '',
  );
  const [priority, setPriority] = useState(initial?.priority ?? 2);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const submit = (e) => {
    e.preventDefault();
    onSave({ minCondition, language, maxPrice: parseMoney(maxPrice), priority, notes: notes.trim() });
  };

  return (
    <form className="form" onSubmit={submit}>
      <ConditionPicker value={minCondition} onChange={setMinCondition} allowAny />
      <LanguagePicker value={language} onChange={setLanguage} allowAny />
      <div className="field">
        <span className="field-label">Prioridade</span>
        <Segmented
          ariaLabel="Prioridade"
          options={PRIORITIES.map((p) => ({ value: p.id, label: p.label }))}
          value={priority}
          onChange={setPriority}
        />
      </div>
      <label className="field">
        <span className="field-label">Pago no máximo</span>
        <div className="input-prefix">
          <span>R$</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder="Sem limite"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d,.]/g, ''))}
          />
        </div>
      </label>
      <label className="field">
        <span className="field-label">Observações</span>
        <textarea
          className="input textarea"
          rows={2}
          value={notes}
          placeholder="Ex.: quero a versão da arte alternativa"
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          {initial ? 'Salvar desejo' : 'Adicionar aos desejos'}
        </button>
      </div>
    </form>
  );
}
