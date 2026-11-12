import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { CardImage } from './ui.jsx';
import { useMediaQuery } from '../lib/hooks.js';

const SPRING = { stiffness: 260, damping: 26, mass: 0.6 };

export function TiltCard({ src, alt, holo }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  const enabled = fine && !reduce;

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, SPRING);
  const sy = useSpring(py, SPRING);
  const rotateY = useTransform(sx, [0, 1], [-11, 11]);
  const rotateX = useTransform(sy, [0, 1], [9, -9]);
  const glareX = useTransform(sx, [0, 1], [0, 100]);
  const glareY = useTransform(sy, [0, 1], [0, 100]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.42), rgba(255,255,255,0) 55%)`;
  const foilPos = useMotionTemplate`${glareX}% ${glareY}%`;
  const glow = useMotionValue(0);
  const glowS = useSpring(glow, { stiffness: 300, damping: 30 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onEnter = () => glow.set(1);
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
    glow.set(0);
  };

  return (
    <div className="tilt-stage">
      <motion.div
        ref={ref}
        className="tilt-card"
        style={enabled ? { rotateX, rotateY, transformPerspective: 900 } : undefined}
        onPointerMove={enabled ? onMove : undefined}
        onPointerEnter={enabled ? onEnter : undefined}
        onPointerLeave={enabled ? onLeave : undefined}
      >
        <CardImage src={src} alt={alt} quality="high" eager />
        {enabled && <motion.div className="tilt-glare" style={{ background: glare, opacity: glowS }} />}
        {enabled && holo && (
          <motion.div className="tilt-foil" style={{ backgroundPosition: foilPos, opacity: glowS }} />
        )}
      </motion.div>
    </div>
  );
}
