import { useState } from 'react';
import { toast } from 'sonner';
import { Download, ExternalLink, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store.js';
import {
  POLICY_VERSION,
  PRIVACY_CONTACT,
  THIRD_PARTIES,
  consentIsCurrent,
  exportBackup,
  formatBytes,
  storageInventory,
  wipeAllData,
} from '../lib/privacy.js';
import { PageHeader, Switch } from '../components/ui.jsx';

const fmtDate = (t) => new Date(t).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const policyDate = new Date(POLICY_VERSION + 'T12:00:00').toLocaleDateString('pt-BR', { dateStyle: 'long' });

function DataInventory() {
  // Relê o inventário depois de apagar o cache ou os dados.
  const [, setTick] = useState(0);
  useStore((s) => s.collection);
  useStore((s) => s.wishlist);
  useStore((s) => s.cards);
  useStore((s) => s.consent);
  const inv = storageInventory();

  const wipe = () => {
    if (!confirm('Apagar todo o fichário, desejos, ajustes, consentimento e cache deste aparelho? Isso não pode ser desfeito.')) return;
    wipeAllData();
    setTick((t) => t + 1);
    toast('Dados apagados');
  };

  return (
    <section className="section">
      <h2 className="section-title">Dados guardados neste aparelho</h2>
      <div className="group">
        <div className="row row-kv">
          <span className="row-title">Fichário</span>
          <span className="row-value muted">{inv.collection} cópias</span>
        </div>
        <div className="row row-kv">
          <span className="row-title">Lista de desejos</span>
          <span className="row-value muted">{inv.wishlist} itens</span>
        </div>
        <div className="row row-kv">
          <span className="row-title">Fichas de cartas salvas</span>
          <span className="row-value muted">
            {inv.cards} · {formatBytes(inv.appBytes)}
          </span>
        </div>
        <div className="row row-kv">
          <span className="row-title">Cache da TCGdex</span>
          <span className="row-value muted">
            {inv.cache.entries} · {formatBytes(inv.cache.bytes)}
          </span>
        </div>
        <div className="row row-kv">
          <span className="row-title">Consentimento</span>
          <span className="row-value row-value-wrap muted">
            {inv.consent
              ? `${inv.consent.externalRates ? 'Cotação permitida' : 'Só o essencial'} · ${fmtDate(inv.consent.decidedAt)}`
              : 'Ainda não decidido'}
          </span>
        </div>
        <button
          type="button"
          className="row row-link row-action"
          onClick={() => {
            exportBackup();
            toast.success('Cópia dos dados baixada');
          }}
        >
          <Download size={17} />
          <span className="row-title">Baixar uma cópia de tudo (.json)</span>
        </button>
        <button type="button" className="row row-link row-action row-danger" onClick={wipe}>
          <Trash2 size={17} />
          <span className="row-title">Apagar todos os dados</span>
        </button>
      </div>
      <p className="field-hint">
        Esses dados ficam no armazenamento do navegador (localStorage) e nunca são enviados para nós. Eles ficam aqui até
        você apagá-los, aqui ou limpando os dados do site no navegador.
      </p>
    </section>
  );
}

function Choices() {
  const autoRates = useStore((s) => s.settings.autoRates);
  const consent = useStore((s) => s.consent);
  const setConsent = useStore((s) => s.setConsent);
  return (
    <section className="section">
      <h2 className="section-title">Suas escolhas</h2>
      <div className="group">
        <div className="row">
          <Switch
            checked={consentIsCurrent(consent) && autoRates}
            onChange={(v) => {
              setConsent(v);
              toast(v ? 'Cotação automática permitida' : 'Consentimento revogado');
            }}
            label="Cotação automática (ExchangeRate-API)"
          />
        </div>
      </div>
      <p className="field-hint">
        Desligar revoga o consentimento na hora (art. 8º, §5º). A TCGdex é necessária para o app funcionar e não pode ser
        desligada; sem ela não há busca de cartas.
      </p>
    </section>
  );
}

export default function Privacy() {
  const { controller, email } = PRIVACY_CONTACT;
  return (
    <div className="page page-narrow">
      <PageHeader title="Privacidade" subtitle={`Política de privacidade · atualizada em ${policyDate}`} />

      <section className="section">
        <h2 className="section-title">Em resumo</h2>
        <div className="group group-pad prose">
          <ul>
            <li>Não temos servidor, contas, cookies de rastreamento, anúncios nem análise de uso.</li>
            <li>Seu fichário, desejos e ajustes ficam só no navegador deste aparelho.</li>
            <li>
              Para buscar cartas, o seu navegador fala direto com a TCGdex. A cotação automática usa o ExchangeRate-API
              e só roda com a sua permissão.
            </li>
            <li>O site é hospedado no GitHub Pages, que registra os acessos (IP e página) por segurança.</li>
            <li>Você pode ver, baixar e apagar tudo nesta página, a qualquer momento.</li>
          </ul>
        </div>
      </section>

      <DataInventory />
      <Choices />

      <section className="section">
        <h2 className="section-title">Serviços de terceiros</h2>
        <div className="group">
          {THIRD_PARTIES.map((t) => (
            <div key={t.id} className="row row-top">
              <div className="row-main">
                <span className="row-title">
                  {t.name} <span className="muted">· {t.essential ? 'essencial' : 'opcional'}</span>
                </span>
                <span className="row-sub row-sub-wrap">{t.purpose}</span>
                <span className="row-sub row-sub-wrap">Recebe: {t.data}</span>
                <span className="row-sub row-sub-wrap">Base legal: {t.basis}</span>
                <span className="row-sub row-sub-wrap">Endereços: {t.hosts}</span>
              </div>
              <a className="icon-link" href={t.url} target="_blank" rel="noreferrer noopener" aria-label={`Site de ${t.name}`}>
                <ExternalLink size={17} />
              </a>
            </div>
          ))}
        </div>
        <p className="field-hint">
          Esses serviços tratam seu IP como controladores independentes, conforme as políticas deles, e podem estar fora do
          Brasil (transferência internacional, art. 33).
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Política completa</h2>
        <div className="group group-pad prose">
          <h3>Quem é o controlador</h3>
          <p>
            {controller}. Contato para assuntos de privacidade:{' '}
            {email ? <a href={`mailto:${email}`}>{email}</a> : <strong>não informado</strong>}.
          </p>

          <h3>Quais dados tratamos</h3>
          <p>
            Apenas o que você cadastra (cartas, estado, idioma, preço pago, observações, desejos e ajustes) e o registro da
            sua escolha de privacidade. Tudo fica no seu aparelho. Evite colocar dados pessoais nas observações; se colocar,
            eles também ficam só aqui.
          </p>

          <h3>Para que e com qual base legal</h3>
          <p>
            Guardar o fichário no aparelho é o próprio serviço que você pediu (art. 7º, V). A consulta à TCGdex também. A
            cotação automática depende do seu consentimento (art. 7º, I), que fica registrado com data e versão desta
            política e pode ser revogado a qualquer momento.
          </p>

          <h3>Por quanto tempo</h3>
          <p>
            Até você apagar. O cache das buscas na TCGdex se renova sozinho (1 a 7 dias) e é apagado junto com os dados.
          </p>

          <h3>Seus direitos (art. 18)</h3>
          <ul>
            <li><strong>Confirmação e acesso:</strong> veja a lista "Dados guardados neste aparelho" acima.</li>
            <li><strong>Correção:</strong> edite qualquer cópia ou desejo no próprio app.</li>
            <li><strong>Portabilidade:</strong> baixe uma cópia completa em JSON.</li>
            <li><strong>Eliminação:</strong> use "Apagar todos os dados" ou remova itens um a um.</li>
            <li><strong>Revogar o consentimento:</strong> desligue a cotação automática em "Suas escolhas".</li>
            <li><strong>Saber com quem compartilhamos:</strong> veja "Serviços de terceiros".</li>
          </ul>
          <p>
            Como não recebemos seus dados, pedidos sobre o IP enviado aos terceiros devem ir a eles. Você também pode
            reclamar à{' '}
            <a href="https://www.gov.br/anpd" target="_blank" rel="noreferrer noopener">
              ANPD
            </a>
            .
          </p>

          <h3>Segurança</h3>
          <p>
            Os dados ficam protegidos pelo próprio navegador, isolados por site. Quem tiver acesso ao seu aparelho e
            navegador consegue vê-los; os backups em JSON não são criptografados, então guarde-os com cuidado.
          </p>

          <h3>Crianças e adolescentes</h3>
          <p>
            O app não pede nem coleta dados de identificação. Recomendamos que crianças o usem com acompanhamento dos pais
            ou responsáveis (art. 14).
          </p>

          <h3>Mudanças nesta política</h3>
          <p>
            Quando ela mudar de forma relevante, o aviso de privacidade aparece de novo e sua escolha é pedida outra vez.
          </p>
        </div>
      </section>
    </div>
  );
}
