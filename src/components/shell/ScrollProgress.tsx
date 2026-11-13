'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

/** Hairline at the very top of the window that fills as the page is read. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed top-0 inset-x-0 h-[2px] z-[60] origin-left bg-gradient-to-r from-accent via-primary to-secondary"
      style={{ scaleX }}
    />
  );
}
