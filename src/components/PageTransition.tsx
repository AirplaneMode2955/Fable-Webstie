'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const EASE = [0.76, 0, 0.24, 1] as const;

/**
 * Route changes: two stacked curtains lift off the new page while its content
 * rises into place. The first load is left to the CSS preloader.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const first = useRef(true);
  const [curtain, setCurtain] = useState<string | null>(null);

  useIsoLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setCurtain(pathname);
  }, [pathname]);

  return (
    <>
      {curtain && !reduce && (
        <div key={curtain} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[58]">
          <motion.div
            className="absolute inset-0 origin-top bg-primary-container"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ duration: 0.85, ease: EASE, delay: 0.1 }}
          />
          <motion.div
            className="absolute inset-0 origin-top bg-surface-container-lowest"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ duration: 0.75, ease: EASE }}
          />
        </div>
      )}
      <motion.div
        key={pathname}
        initial={first.current ? false : { opacity: 0, y: reduce ? 0 : 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.15 : 0.9, delay: reduce ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
