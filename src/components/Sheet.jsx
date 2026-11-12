import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'motion/react';
import { useLockBody, useMediaQuery } from '../lib/hooks.js';

// Projeção de momento (mesma função do sample da Apple): onde o gesto pararia.
function project(velocity, rate = 0.998) {
  return ((velocity / 1000) * rate) / (1 - rate);
}

const EASE_OUT = [0.23, 1, 0.32, 1];

/**
 * Celular: bottom sheet que acompanha o dedo 1:1 e fecha com arrasto ou "flick".
 * Desktop: modal centralizado.
 */
export function Sheet({ open, onClose, label, children }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const reduce = useReducedMotion();
  const controls = useDragControls();
  const panelRef = useRef(null);
  useLockBody(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => panelRef.current?.focus({ preventScroll: true }), 50);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [open, onClose]);

  const onDragEnd = (_, info) => {
    const h = panelRef.current?.offsetHeight || 600;
    const landing = info.offset.y + project(info.velocity.y);
    if (landing > h * 0.45 || info.velocity.y > 900) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: EASE_OUT }}
          onClick={onClose}
        />
      )}
      {open && isMobile && (
        <motion.div
          key="sheet"
          ref={panelRef}
          className="sheet"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          initial={reduce ? { opacity: 0 } : { y: '100%' }}
          animate={reduce ? { opacity: 1 } : { y: 0 }}
          exit={reduce ? { opacity: 0 } : { y: '100%' }}
          transition={{ type: 'spring', bounce: 0, duration: 0.42 }}
          drag={reduce ? false : 'y'}
          dragListener={false}
          dragControls={controls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0.06, bottom: 1 }}
          dragTransition={{ bounceStiffness: 420, bounceDamping: 42 }}
          onDragEnd={onDragEnd}
        >
          <div
            className="sheet-grabber-zone"
            onPointerDown={(e) => controls.start(e)}
            aria-hidden="true"
          >
            <span className="grabber" />
          </div>
          <div className="sheet-scroll">{children}</div>
        </motion.div>
      )}
      {open && !isMobile && (
        <div key="modal" className="modal-wrap" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            ref={panelRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            initial={{ opacity: 0, transform: reduce ? 'none' : 'scale(0.96)' }}
            animate={{ opacity: 1, transform: 'scale(1)' }}
            exit={{ opacity: 0, transform: reduce ? 'none' : 'scale(0.97)' }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
