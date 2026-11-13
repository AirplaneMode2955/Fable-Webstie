'use client';

/**
 * The motion system. Every scroll effect on the site is built from these.
 * All of them fall back to a plain, static render under prefers-reduced-motion.
 */

import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const EASE = [0.22, 1, 0.36, 1] as const;

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** True at Tailwind's `md` breakpoint and up. False on the server and first paint. */
export function useIsDesktop(query = '(min-width: 768px)') {
  const [match, setMatch] = useState(false);
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatch(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return match;
}

/* ── SplitText ─────────────────────────────────────────────────────────
   Headline reveal: each word (or character) rises out of its own mask. */

type SplitTag = 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';

interface SplitTextProps {
  text: string;
  as?: SplitTag;
  className?: string;
  by?: 'word' | 'char';
  delay?: number;
  stagger?: number;
  /** 'view' plays when scrolled into view, 'mount' plays immediately. */
  trigger?: 'view' | 'mount';
}

export function SplitText({
  text,
  as = 'span',
  className = '',
  by = 'word',
  delay = 0,
  stagger,
  trigger = 'view',
}: SplitTextProps) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const lines = text.split('\n');
  const step = stagger ?? (by === 'char' ? 0.028 : 0.07);
  let index = 0;

  const piece = {
    hidden: { y: reduce ? 0 : '110%', rotate: reduce ? 0 : 4 },
    show: (i: number) => ({
      y: 0,
      rotate: 0,
      transition: { duration: reduce ? 0 : 0.95, delay: delay + i * step, ease: EASE },
    }),
  };

  const playProps =
    trigger === 'mount'
      ? { animate: 'show' as const }
      : { whileInView: 'show' as const, viewport: { once: true, margin: '-60px' } };

  return (
    <Tag className={className} initial="hidden" aria-label={text.replace(/\n/g, ' ')} {...playProps}>
      {lines.map((line, li) => (
        <span key={li} className="block" aria-hidden="true">
          {line.split(' ').map((word, wi) => {
            const units = by === 'char' ? Array.from(word) : [word];
            return (
              <span key={wi} className="inline-block whitespace-nowrap">
                {units.map((unit, ui) => (
                  // Padding + negative margin keeps italic overhang and descenders inside the mask.
                  <span
                    key={ui}
                    className="inline-block overflow-hidden align-bottom pb-[0.18em] -mb-[0.18em] pr-[0.12em] -mr-[0.12em] pt-[0.08em] -mt-[0.08em]"
                  >
                    <motion.span className="inline-block origin-bottom-left will-change-transform" variants={piece} custom={index++}>
                      {unit}
                    </motion.span>
                  </span>
                ))}
                {wi < line.split(' ').length - 1 && <span className="inline-block">&nbsp;</span>}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}

/* ── ScrollText ────────────────────────────────────────────────────────
   A paragraph whose words light up one by one as you scroll through it. */

function ScrollWord({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return <motion.span style={{ opacity }}>{children} </motion.span>;
}

export function ScrollText({ text, className = '' }: { text: string; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.88', 'end 0.45'] });
  const words = text.split(' ');

  if (reduce) return <p ref={ref} className={className}>{text}</p>;

  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <ScrollWord key={i} progress={scrollYProgress} range={[i / words.length, Math.min(1, (i + 1.5) / words.length)]}>
          {word}
        </ScrollWord>
      ))}
    </p>
  );
}

/* ── Parallax ──────────────────────────────────────────────────────────
   Moves its child vertically while it crosses the viewport. */

export function Parallax({
  children,
  className = '',
  speed = 60,
}: {
  children: React.ReactNode;
  className?: string;
  /** Pixels of travel either side of center. Negative moves against the scroll. */
  speed?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);
  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { y }}>
      {children}
    </motion.div>
  );
}

/* ── ImageReveal ───────────────────────────────────────────────────────
   A frame that wipes open on scroll while the image inside settles from a
   zoom and keeps drifting as the page moves. Children should fill it. */

export function ImageReveal({
  children,
  className = '',
  delay = 0,
  drift = 8,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Percent of inner travel. 0 disables the drift. */
  drift?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${drift}%`, `${drift}%`]);

  if (reduce) return <div ref={ref} className={`relative overflow-hidden ${className}`}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      initial={{ clipPath: 'inset(100% 0% 0% 0% round 20px)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 20px)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1.2, delay, ease: EASE }}
    >
      <motion.div
        className="absolute inset-x-0 -inset-y-[10%]"
        style={{ y }}
        initial={{ scale: 1.35 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1.6, delay, ease: EASE }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ── Magnetic ──────────────────────────────────────────────────────────
   Pulls its child toward the cursor, then springs back. */

export function Magnetic({
  children,
  className = '',
  strength = 0.35,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 16, mass: 0.4 });

  if (reduce) return <div className={`inline-block ${className}`}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse' || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── VelocityMarquee ───────────────────────────────────────────────────
   An endless band of text that speeds up and flips with scroll velocity. */

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

export function VelocityMarquee({
  children,
  baseVelocity = 2,
  className = '',
}: {
  children: React.ReactNode;
  /** Percent of one copy per second. Negative runs right to left. */
  baseVelocity?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smooth = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smooth, [-1000, 0, 1000], [-4, 0, 4], { clamp: false });
  const skew = useTransform(smooth, [-2000, 0, 2000], [8, 0, -8]);
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const f = factor.get();
    if (f < 0) direction.current = -1;
    else if (f > 0) direction.current = 1;
    let move = direction.current * baseVelocity * (delta / 1000);
    move += direction.current * move * Math.abs(f);
    baseX.set(baseX.get() + move);
  });

  return (
    <div className="overflow-hidden whitespace-nowrap flex" aria-hidden="true">
      <motion.div className={`flex whitespace-nowrap flex-nowrap ${className}`} style={{ x, skewX: reduce ? 0 : skew }}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="flex-shrink-0 flex items-center">
            {children}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ── HorizontalScroll ──────────────────────────────────────────────────
   Pins to the viewport and turns vertical scroll into a sideways track.
   Phones and reduced motion get a native swipeable row instead. */

export function HorizontalScroll({
  children,
  header,
  className = '',
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const desktop = useIsDesktop('(min-width: 1024px)');
  const pin = desktop && !reduce;
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const bar = useTransform(scrollYProgress, [0, 1], [0.04, 1]);

  useEffect(() => {
    if (!pin || !trackRef.current) return;
    const el = trackRef.current;
    const measure = () => setDistance(Math.max(0, el.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [pin]);

  if (!pin) {
    return (
      <div ref={sectionRef} className={className}>
        {header && <div className="px-6 md:px-8 pt-24 pb-10">{header}</div>}
        <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory px-6 md:px-8 pb-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:snap-center">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className={className} style={{ height: `calc(100vh + ${distance}px)` }}>
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
        {header && <div className="px-8 pb-10 max-w-screen-2xl w-full mx-auto">{header}</div>}
        <motion.div ref={trackRef} className="flex gap-8 px-8 w-max will-change-transform" style={{ x }}>
          {children}
        </motion.div>
        <div className="px-8 mt-10 max-w-screen-2xl w-full mx-auto">
          <div className="h-px bg-white/10 overflow-hidden">
            <motion.div className="h-full bg-primary origin-left" style={{ scaleX: bar }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── StickyStack ───────────────────────────────────────────────────────
   Cards pin under the nav and pile up; each one shrinks back as the next
   slides over it. Stacks on desktop only. */

function StackCard({
  children,
  index,
  total,
  progress,
  active,
}: {
  children: React.ReactNode;
  index: number;
  total: number;
  progress: MotionValue<number>;
  active: boolean;
}) {
  const target = 1 - (total - 1 - index) * 0.045;
  const scale = useTransform(progress, [index / total, 1], [1, target]);
  const dim = useTransform(progress, [index / total, 1], ['brightness(1)', index === total - 1 ? 'brightness(1)' : 'brightness(0.55)']);
  return (
    <div className={active ? 'sticky' : ''} style={active ? { top: `calc(7rem + ${index * 1.75}rem)` } : undefined}>
      <motion.div className="origin-top will-change-transform" style={active ? { scale, filter: dim } : undefined}>
        {children}
      </motion.div>
    </div>
  );
}

export function StickyStack({ children, className = '' }: { children: React.ReactNode[]; className?: string }) {
  const reduce = useReducedMotion();
  const desktop = useIsDesktop();
  const tall = useIsDesktop('(min-height: 760px)');
  const active = desktop && tall && !reduce;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  return (
    <div ref={ref} className={`flex flex-col gap-8 ${active ? 'md:gap-[18vh]' : ''} ${className}`}>
      {children.map((child, i) => (
        <StackCard key={i} index={i} total={children.length} progress={scrollYProgress} active={active}>
          {child}
        </StackCard>
      ))}
    </div>
  );
}

/* ── Counter ───────────────────────────────────────────────────────────
   Counts up to a number the first time it scrolls into view. */

export function Counter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.8,
  className = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  // Server HTML carries the final value, so it is never blank or wrong.
  const [shown, setShown] = useState(value);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || reduce || started.current) return;
    started.current = true;
    const controls = animate(0, value, { duration, ease: EASE, onUpdate: setShown });
    return () => controls.stop();
  }, [inView, reduce, value, duration]);

  const text = decimals ? shown.toFixed(decimals) : Math.round(shown).toLocaleString('en-US');
  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

/* ── Stagger ───────────────────────────────────────────────────────────
   Reveals direct children one after another. Wrap each in <StaggerItem>. */

export function Stagger({
  children,
  className = '',
  gap = 0.08,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-60px' }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 36, filter: 'blur(10px)' },
        show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: reduce ? 0.3 : 0.9, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/* ── DrawLine ──────────────────────────────────────────────────────────
   A hairline rule that draws itself across on scroll. */

export function DrawLine({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      className={`h-px bg-white/10 origin-left ${className}`}
      initial={{ scaleX: reduce ? 1 : 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: reduce ? 0 : 1.4, delay, ease: EASE }}
    />
  );
}

/* ── useIntroDelay ─────────────────────────────────────────────────────
   Seconds a page's opening animation should wait: longer on the very first
   load (the preloader is still lifting), shorter after a route change. */

let booted = false;

export function useIntroDelay() {
  const delay = useRef(booted ? 0.55 : 1.25).current;
  useEffect(() => {
    booted = true;
  }, []);
  return delay;
}
