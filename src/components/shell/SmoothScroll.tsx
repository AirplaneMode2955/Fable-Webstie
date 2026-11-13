'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

/** Jump back to the top on every route change, so a glide in progress doesn't carry over. */
function ResetOnNavigate() {
  const lenis = useLenis();
  const pathname = usePathname();
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname, lenis]);
  return null;
}

/** Inertial page scrolling. Every scroll-linked effect on the site rides on this. */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true, anchors: true }}>
      <ResetOnNavigate />
      {children}
    </ReactLenis>
  );
}
