'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { EASE, SplitText, useIntroDelay } from '@/components/motion/primitives';

interface PageHeroProps {
  eyebrow: string;
  /** Plain strings get a letter-by-letter reveal; JSX rises as one line. */
  title: React.ReactNode;
  /** Oversized ghost word that slides behind the headline. Defaults to the title when it is a string. */
  watermark?: string;
  image?: string;
  /** Rendered above the eyebrow (small accents). */
  before?: React.ReactNode;
  /** Intro copy and actions under the headline. */
  children?: React.ReactNode;
}

/** The opening banner shared by every inner page. */
export default function PageHero({ eyebrow, title, watermark, image, before, children }: PageHeroProps) {
  const reduce = useReducedMotion();
  const intro = useIntroDelay();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
  const markX = useTransform(scrollYProgress, [0, 1], ['4%', '-22%']);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const ghost = watermark ?? (typeof title === 'string' && title.length <= 12 ? title : undefined);
  const d = reduce ? 0 : intro;

  return (
    <section
      ref={ref}
      className="relative -mt-24 pt-44 pb-24 md:pt-56 md:pb-32 px-6 md:px-8 overflow-hidden bg-surface-container-low border-b border-white/5 grain"
    >
      {image && (
        <motion.div className="absolute inset-0 opacity-[0.16]" style={reduce ? undefined : { y: bgY, scale: bgScale }}>
          <Image src={image} alt="" fill sizes="100vw" className="object-cover object-top" aria-hidden="true" priority />
        </motion.div>
      )}
      <div className="aurora bg-accent/20 h-[32rem] w-[32rem] -top-32 -left-32" />
      <div className="aurora bg-secondary/10 h-[26rem] w-[26rem] -bottom-40 right-[8%]" style={{ animationDelay: '-7s' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-surface-container-low" />

      {ghost && (
        <motion.span
          aria-hidden="true"
          className="absolute right-0 bottom-0 font-headline italic text-outline-stroke select-none pointer-events-none leading-[0.8] whitespace-nowrap opacity-30"
          style={{ fontSize: 'clamp(7rem, 22vw, 22rem)', ...(reduce ? {} : { x: markX }) }}
        >
          {ghost}
        </motion.span>
      )}

      <motion.div className="max-w-screen-2xl mx-auto relative z-10" style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}>
        {before && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: d }}>
            {before}
          </motion.div>
        )}
        <motion.span
          className="font-label text-xs uppercase tracking-luxe text-outline mb-5 flex items-center gap-4"
          initial={{ opacity: 0, x: reduce ? 0 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduce ? 0.3 : 0.9, delay: d, ease: EASE }}
        >
          <motion.span
            className="h-px w-10 bg-primary/50 origin-left"
            initial={{ scaleX: reduce ? 1 : 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: reduce ? 0 : 1, delay: d + 0.1, ease: EASE }}
          />
          {eyebrow}
        </motion.span>

        {typeof title === 'string' ? (
          <SplitText
            as="h1"
            text={title}
            by="char"
            trigger="mount"
            delay={d + 0.05}
            stagger={0.035}
            className="font-headline italic text-6xl md:text-8xl xl:text-[9rem] text-primary leading-[0.95] tracking-tight mb-6"
          />
        ) : (
          <h1 className="font-headline italic text-6xl md:text-8xl xl:text-[9rem] text-primary leading-[0.95] tracking-tight overflow-hidden pb-[0.18em] mb-1">
            <motion.span
              className="block"
              initial={{ y: reduce ? 0 : '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: reduce ? 0 : 1.1, delay: d + 0.05, ease: EASE }}
            >
              {title}
            </motion.span>
          </h1>
        )}

        {children && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: reduce ? 0 : 30, filter: reduce ? 'blur(0px)' : 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: reduce ? 0.3 : 1, delay: d + 0.45, ease: EASE }}
          >
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
