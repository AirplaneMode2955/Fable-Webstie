'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';
import PaperAirplane from '@/components/motion/PaperAirplane';
import RotatingWord from '@/components/motion/RotatingWord';
import InkUnderline from '@/components/motion/InkUnderline';
import { SplitText, EASE, useIntroDelay } from '@/components/motion/primitives';
import Button from '@/components/ui/Button';

// Last slot of the tagline cycles through these. Edit freely.
const TAGLINE_WORDS = ['Driven by curiosity.', 'Golfer.', 'Fisherman.', 'Woodworker.', 'Figuring it out.'];

export default function HeroSection() {
  const reduce = useReducedMotion();
  // Everything waits for the intro curtain to lift.
  const INTRO = useIntroDelay();
  const sectionRef = useRef<HTMLElement>(null);
  const akaRef = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });

  // Scrolling away: the backdrop pushes in, the copy lifts and fades, the portrait and card drift at their own speeds.
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.3]);
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const portraitY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const portraitScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -220]);
  const cardRotate = useTransform(scrollYProgress, [0, 1], [-3, 6]);

  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 28, filter: reduce ? 'blur(0px)' : 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: reduce ? 0.3 : 0.9, delay: reduce ? 0 : INTRO + delay, ease: EASE },
  });

  return (
    <section
      ref={sectionRef}
      className="relative -mt-24 px-6 md:px-8 pt-32 pb-24 overflow-hidden min-h-[100svh] flex items-center grain bg-background"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div className="absolute inset-0 opacity-30" style={reduce ? undefined : { scale: bgScale, y: bgY }}>
          <Image
            src="/IMG_1120.JPEG"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: '30% center' }}
            priority
            aria-hidden="true"
          />
        </motion.div>
        <div className="aurora bg-accent/25 h-[38rem] w-[38rem] -top-40 -left-40" />
        <div className="aurora bg-secondary/10 h-[30rem] w-[30rem] bottom-0 right-[10%]" style={{ animationDelay: '-8s' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background" />
      </div>

      <div className="max-w-screen-2xl mx-auto grid grid-cols-12 gap-y-8 md:gap-x-8 items-center relative z-10 w-full">
        <motion.div className="col-span-12 md:col-span-7 min-w-0" style={reduce ? undefined : { y: copyY, opacity: copyOpacity }}>
          <motion.p {...rise(0)} className="font-label text-xs uppercase tracking-luxe text-outline mb-6 flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            Director of Marketing · Utah
          </motion.p>

          <SplitText
            as="h1"
            text={"Hey, I'm\nJett."}
            by="char"
            trigger="mount"
            delay={reduce ? 0 : INTRO}
            stagger={0.045}
            className="font-headline italic text-[4.75rem] sm:text-8xl md:text-[9rem] xl:text-[11rem] text-primary leading-[0.88] tracking-tight mb-4"
          />

          <motion.span
            ref={akaRef}
            {...rise(0.55)}
            className="inline-block font-label text-sm uppercase tracking-luxe text-secondary mb-6"
          >
            AKA Airplane
          </motion.span>

          <motion.p
            {...rise(0.65)}
            className="text-on-surface-variant font-headline italic mb-10 leading-snug sm:whitespace-nowrap"
            style={{ fontSize: 'clamp(0.75rem, 3.5vw, 1.6rem)' }}
          >
            Marketer. Husband. <RotatingWord words={TAGLINE_WORDS} className="text-primary" />
          </motion.p>

          <motion.div {...rise(0.8)} className="flex flex-col sm:flex-row gap-4 items-start">
            <Button href="/case-studies" icon="arrow_forward">See the Results</Button>
            <Button href="/contact" variant="ghost">Contact Me</Button>
          </motion.div>
        </motion.div>

        {/* Portrait wipes open, then floats on scroll */}
        <motion.div
          className="col-span-12 md:col-span-5 relative mt-12 md:mt-0 min-w-0"
          style={reduce ? undefined : { y: portraitY, scale: portraitScale }}
        >
          <motion.div
            className="relative w-full aspect-[4/5] rounded-[1.25rem] overflow-hidden shadow-premium border border-white/10 bg-surface-container-high"
            initial={reduce ? { opacity: 0 } : { clipPath: 'inset(100% 0% 0% 0% round 20px)' }}
            animate={reduce ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0% round 20px)' }}
            transition={{ duration: reduce ? 0.3 : 1.3, delay: reduce ? 0 : INTRO + 0.2, ease: EASE }}
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: reduce ? 1 : 1.4 }}
              animate={{ scale: 1 }}
              transition={{ duration: reduce ? 0 : 1.8, delay: reduce ? 0 : INTRO + 0.2, ease: EASE }}
            >
              <Image
                src="/wedding.jpg.JPEG"
                alt="Jett Iverson"
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="object-cover object-top"
                priority
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/25 to-transparent" />
          </motion.div>

          {/* Quote card */}
          <motion.div
            className="absolute -bottom-8 -left-2 md:-left-10 w-60"
            style={reduce ? undefined : { y: cardY, rotate: cardRotate }}
          >
            <motion.div
              className="bg-secondary-container text-on-secondary-container p-6 rounded-[1rem] shadow-soft border border-white/5"
              initial={{ opacity: 0, y: reduce ? 0 : 40, scale: reduce ? 1 : 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: reduce ? 0.3 : 0.9, delay: reduce ? 0 : INTRO + 0.9, ease: EASE }}
            >
              <p className="font-headline italic text-2xl mb-4">
                <InkUnderline variant="wave" delay={INTRO + 1.6}>&ldquo;Figure it out&rdquo;</InkUnderline>
              </p>
              <p className="font-label text-[10px] uppercase tracking-luxe text-on-secondary-container/60">
                Philosophy Statement
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: INTRO + 1.4, duration: 0.8 }}
        aria-hidden="true"
      >
        <span className="font-label text-[10px] uppercase tracking-luxe text-outline">Scroll</span>
        <span className="relative block h-12 w-px overflow-hidden bg-white/10">
          <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-primary" />
        </span>
      </motion.div>

      <PaperAirplane containerRef={sectionRef} targetRef={akaRef} delay={2600} />
    </section>
  );
}
