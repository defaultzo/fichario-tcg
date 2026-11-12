import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, RefreshCw, Trash2, Upload } from 'lucide-react';
import { fetchRates } from '../lib/api.js';
import { CONDITIONS } from '../lib/constants.js';
import { formatBRL, parseMoney } from '../lib/pricing.js';
import { useStore } from '../lib/store.js';
import { ConditionBadge, PageHeader, Segmented, Switch } from '../components/ui.jsx';
import { refreshAllPrices } from './Collection.jsx';

function RateInput({ label, value, onCommit }) {
  const [text, setText] = useState(String(value).replace('.', ','));
  const [prev, setPrev] = useState(value);
  if (prev !== value) {
    setPrev(value);
    setText(String(value).replace('.', ','));
  }
  return (
    <label className="row">
      <span className="row-title">{label}</span>
      <div className="input-prefix input-prefix-sm">
        <span>R$</span>
        <input
          className="input"
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^\d,.]/g, ''))}
          onBlur={() => {
            const n = parseMoney(text);
            if (n && n > 0) onCommit(n);
            else setText(String(value).replace('.', ','));
          }}
        />
      </div>
    </label>
  );
}

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const counts = {
    c: useStore((s) => s.collection.length),
    w: useStore((s) => s.wishlist.length),
  };
  const { setSettings, importData, reset } = useStore.getState();
  const fileRef = useRef(null);
  const [loadingRates, setLoadingRates] = useState(false);

  const updateRates = async () => {
    setLoadingRates(true);
    try {
      const r = await fetchRates();
      setSettings({ ...r, ratesUpdated: Date.now() });
      toast.success(`Cotação atualizada: US$ 1 = ${formatBRL(r.usd)}`);
    } catch {
      toast.error('Não foi possível buscar a cotação agora');
    } finally {
      setLoadingRates(false);
    }
  };

  const exportData = () => {
    const { collection, wishlist, cards, settings: st } = useStore.getState();
    const blob = new Blob([JSON.stringify({ app: 'fichario-tcg', version: 1, exportedAt: new Date().toISOString(), collection, wishlist, cards, settings: st }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fichario-tcg-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast.success('Backup baixado');
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.collection)) throw new Error('formato');
      if (!confirm(`Substituir os dados atuais por este backup (${data.collection.length} cópias, ${data.wishlist?.length || 0} desejos)?`)) return;
      importData(data);
      toast.success('Backup restaurado');
    } catch {
      toast.error('Arquivo inválido — use um backup exportado pelo Fichário');
    }
  };

  const wipe = () => {
    if (!confirm('Apagar todo o fichário, desejos e ajustes deste aparelho? Isso não pode ser desfeito.')) return;
    reset();
    toast('Dados apagados');
  };

  return (
    <div className="page page-narrow">
      <PageHeader title="Ajustes" />

      <section className="section">
        <h2 className="section-title">Aparência</h2>
        <div className="group group-pad">
          <Segmented
            ariaLabel="Tema"
            value={settings.theme}
            onChange={(v) => setSettings({ theme: v })}
            options={[
              { value: 'auto', label: 'Automático' },
              { value: 'light', label: 'Claro' },
              { value: 'dark', label: 'Escuro' },
            ]}
          />
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Base de cartas</h2>
        <div className="group group-pad">
          <Segmented
            ariaLabel="Idioma da base"
            value={settings.apiLang}
            onChange={(v) => setSettings({ apiLang: v })}
            options={[
              { value: 'pt', label: 'Português' },
              { value: 'en', label: 'Inglês' },
            ]}
          />
          <p className="field-hint">
            Nomes, expansões e imagens das cartas. A base em inglês tem mais cartas catalogadas (promos, sets antigos e
            japoneses). Seu fichário não muda ao trocar.
          </p>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Cotação para os preços</h2>
        <div className="group">
          <div className="row">
            <Switch
              checked={settings.autoRates}
              onChange={(v) => setSettings({ autoRates: v })}
              label="Atualizar automaticamente"
            />
          </div>
          <RateInput label="Dólar (US$ 1)" value={settings.usd} onCommit={(n) => setSettings({ usd: n, autoRates: false })} />
          <RateInput label="Euro (€ 1)" value={settings.eur} onCommit={(n) => setSettings({ eur: n, autoRates: false })} />
          <button type="button" className="row row-link row-action" onClick={updateRates} disabled={loadingRates}>
            <RefreshCw size={17} className={loadingRates ? 'spin' : ''} />
            <span className="row-title">Buscar cotação de hoje</span>
            {settings.ratesUpdated && (
              <span className="row-sub">{new Date(settings.ratesUpdated).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
            )}
          </button>
          <button type="button" className="row row-link row-action" onClick={() => refreshAllPrices()}>
            <RefreshCw size={17} />
            <span className="row-title">Atualizar preços de todas as cartas</span>
          </button>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Guia de estados</h2>
        <div className="group">
          {CONDITIONS.map((c) => (
            <div key={c.id} className="row row-top">
              <ConditionBadge id={c.id} />
              <div className="row-main">
                <span className="row-title">
                  {c.name} <span className="muted">· {c.label}</span>
                </span>
                <span className="row-sub row-sub-wrap">{c.desc}</span>
              </div>
              <span className="row-value muted">{Math.round(c.mult * 100)}%</span>
            </div>
          ))}
        </div>
        <p className="field-hint">A porcentagem é o fator aplicado ao preço de referência (NM) para estimar o valor da sua cópia.</p>
      </section>

      <section className="section">
        <h2 className="section-title">Seus dados</h2>
        <div className="group">
          <button type="button" className="row row-link row-action" onClick={exportData}>
            <Download size={17} />
            <span className="row-title">Exportar backup (.json)</span>
            <span className="row-sub">
              {counts.c} cópias · {counts.w} desejos
            </span>
          </button>
          <button type="button" className="row row-link row-action" onClick={() => fileRef.current?.click()}>
            <Upload size={17} />
            <span className="row-title">Restaurar backup</span>
          </button>
          <button type="button" className="row row-link row-action row-danger" onClick={wipe}>
            <Trash2 size={17} />
            <span className="row-title">Apagar todos os dados</span>
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
        <p className="field-hint">
          Tudo fica salvo neste navegador. Exporte um backup para levar o fichário para outro aparelho.
        </p>
      </section>

      <p className="credits">
        Dados das cartas: TCGdex. Preços de referência: TCGplayer e Cardmarket. Pokémon e suas marcas pertencem a
        Nintendo, Creatures e GAME FREAK. Projeto independente, sem afiliação.
      </p>
    </div>
  );
}
