'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Desktop-only pointer dressing: a soft sage glow that trails the cursor and a
 * ring that swells over anything clickable. The real cursor stays visible.
 */
export default function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const ringX = useSpring(x, { stiffness: 380, damping: 30, mass: 0.5 });
  const ringY = useSpring(y, { stiffness: 380, damping: 30, mass: 0.5 });
  const glowX = useSpring(x, { stiffness: 60, damping: 20 });
  const glowY = useSpring(y, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;
    setEnabled(true);
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target as Element | null;
      setHovering(!!target?.closest?.('a, button, [role="button"], input, textarea, select, label, summary, .photo'));
    };
    const down = () => setPressed(true);
    const up = () => setPressed(false);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[55] overflow-hidden">
      <motion.div
        className="absolute -left-[260px] -top-[260px] h-[520px] w-[520px] rounded-full mix-blend-screen"
        style={{
          x: glowX,
          y: glowY,
          background: 'radial-gradient(circle, rgba(144,166,138,0.13) 0%, rgba(144,166,138,0.05) 35%, transparent 65%)',
        }}
      />
      <motion.div
        className="absolute -left-4 -top-4 h-8 w-8 rounded-full border border-primary/60"
        style={{ x: ringX, y: ringY }}
        animate={{
          scale: pressed ? 0.7 : hovering ? 1.9 : 1,
          opacity: hovering ? 0.9 : 0.45,
          backgroundColor: hovering ? 'rgba(201,219,195,0.10)' : 'rgba(201,219,195,0)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      />
    </div>
  );
}
