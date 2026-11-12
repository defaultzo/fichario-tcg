import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import { useStore } from '../lib/store.js';
import { consentIsCurrent } from '../lib/privacy.js';

const EASE_OUT = [0.23, 1, 0.32, 1];

/**
 * Aviso de privacidade (LGPD art. 8º e 9º). Não bloqueia o app: até a pessoa decidir, só o essencial roda.
 * As duas opções têm o mesmo peso visual — recusar é tão fácil quanto aceitar.
 */
export function ConsentBanner() {
  const pending = useStore((s) => !consentIsCurrent(s.consent));
  const setConsent = useStore((s) => s.setConsent);
  const reduce = useReducedMotion();

  // Espera o primeiro paint: o aviso entra depois da página, não junto com ela.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const hidden = reduce ? 'translateY(0px)' : 'translateY(16px)';

  return (
    <AnimatePresence>
      {ready && pending && (
        <motion.section
          key="consent"
          className="consent"
          role="region"
          aria-labelledby="consent-title"
          initial={{ opacity: 0, transform: hidden }}
          animate={{ opacity: 1, transform: 'translateY(0px)' }}
          exit={{ opacity: 0, transform: hidden, transition: { duration: 0.18, ease: EASE_OUT } }}
          transition={{ duration: 0.26, ease: EASE_OUT }}
        >
          <div className="consent-head">
            <ShieldCheck size={20} aria-hidden="true" />
            <h2 id="consent-title">Sua privacidade</h2>
          </div>
          <p>
            Seu fichário fica só neste aparelho: não temos servidor, contas, cookies de rastreamento nem análise de uso.
            Para mostrar cartas e preços, o app consulta a TCGdex.
          </p>
          <p>
            Quer que a cotação do dólar e do euro seja atualizada sozinha? Isso envia seu IP ao ExchangeRate-API. Você
            pode mudar de ideia em Ajustes.{' '}
            <Link to="/privacidade" className="consent-link">
              Política de privacidade
            </Link>
          </p>
          <div className="consent-actions">
            <button type="button" className="btn btn-secondary btn-sm btn-grow" onClick={() => setConsent(false)}>
              Só o essencial
            </button>
            <button type="button" className="btn btn-secondary btn-sm btn-grow" onClick={() => setConsent(true)}>
              Permitir cotação automática
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
