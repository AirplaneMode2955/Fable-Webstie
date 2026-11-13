'use client';

import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Magnetic, SplitText, DrawLine } from '@/components/motion/primitives';

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/resume', label: 'Resume' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/projects', label: 'Projects' },
  { href: '/play', label: 'Play' },
  { href: '/content', label: 'Content' },
  { href: '/podcast', label: 'Podcast' },
  { href: '/contact', label: 'Contact' },
];

const socials = [
  { href: 'https://www.linkedin.com/in/jettiverson', label: 'LinkedIn' },
  { href: 'https://www.instagram.com/jett_iverson/', label: 'Instagram' },
  { href: 'https://github.com/AirplaneMode2955', label: 'GitHub' },
];

export default function Footer() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  // The wordmark rises out of the floor as the footer arrives.
  const y = useTransform(scrollYProgress, [0, 1], ['45%', '0%']);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [0.2, 1]);

  return (
    <footer ref={ref} className="relative overflow-hidden border-t border-white/5 bg-surface-container-lowest">
      <div className="max-w-screen-2xl mx-auto px-6 md:px-8 pt-16">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
          <div>
            <p className="font-label text-xs uppercase tracking-luxe text-outline mb-4">Sitemap</p>
            <div className="grid grid-cols-2 gap-x-12 gap-y-2">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="link-sweep font-headline italic text-lg text-on-surface/60 hover:text-primary transition-colors w-fit">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="font-label text-xs uppercase tracking-luxe text-outline mb-4">Elsewhere</p>
            <div className="flex flex-col gap-2">
              {socials.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="link-sweep font-headline italic text-lg text-on-surface/60 hover:text-primary transition-colors w-fit">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          <Magnetic>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
              className="group h-24 w-24 rounded-full border border-primary/30 text-primary font-label text-[10px] uppercase tracking-luxe flex flex-col items-center justify-center gap-1 transition-colors duration-300 hover:bg-primary hover:text-on-primary"
            >
              <span className="material-symbols-outlined text-lg transition-transform duration-500 group-hover:-translate-y-1" aria-hidden="true">arrow_upward</span>
              Top
            </button>
          </Magnetic>
        </div>

        <DrawLine className="mt-14" />
      </div>

      <motion.div className="px-4 select-none" style={reduce ? undefined : { y, opacity }}>
        <Link href="/" aria-label="Jett Iverson, home" className="block text-center">
          <SplitText
            text="Jett Iverson"
            by="char"
            stagger={0.04}
            className="block font-headline italic text-primary leading-[0.95] tracking-tight whitespace-nowrap text-[15.5vw]"
          />
        </Link>
      </motion.div>

      <div className="max-w-screen-2xl mx-auto px-6 md:px-8 pb-8 pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="font-label text-xs text-on-surface/30 tracking-luxe uppercase">
          © {new Date().getFullYear()} Jett Iverson. All rights reserved.
        </p>
        <p className="font-label text-xs text-on-surface/30 tracking-luxe uppercase">Built in Utah · Figure it out</p>
      </div>
    </footer>
  );
}
