'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/resume', label: 'Resume' },
  { href: '/projects', label: 'Projects' },
  { href: '/play', label: 'Play' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/content', label: 'Content' },
  { href: '/contact', label: 'Contact' },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  // Slide away while reading down, come back the moment the scroll reverses.
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setScrolled(latest > 40);
    if (latest > previous && latest > 320) setHidden(true);
    else if (latest < previous) setHidden(false);
  });

  useEffect(() => {
    setMenuOpen(false);
    setHidden(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (href: string) => {
    // The podcast lives under Content now, so keep Content lit on /podcast.
    if (href === '/content' && pathname.startsWith('/podcast')) return true;
    return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
  };

  const pill = hovered ?? navLinks.find((l) => isActive(l.href))?.href ?? null;

  return (
    <>
      <motion.nav
        aria-label="Main"
        className="fixed top-0 inset-x-0 z-50 px-4 md:px-8 pt-4 pointer-events-none"
        initial={false}
        animate={{ y: hidden && !menuOpen ? '-130%' : '0%' }}
        transition={{ duration: reduce ? 0 : 0.55, ease: EASE }}
      >
        <div
          className={`pointer-events-auto max-w-screen-2xl mx-auto flex items-center justify-between rounded-full border pl-4 pr-3 transition-all duration-500 ${
            scrolled || menuOpen
              ? 'py-2 bg-surface-container-lowest/70 backdrop-blur-2xl border-white/10 shadow-soft'
              : 'py-3 bg-transparent border-transparent'
          }`}
        >
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="Jett logo"
              width={48}
              height={48}
              className="h-10 w-auto transition-transform duration-700 ease-out group-hover:rotate-[-12deg] group-hover:scale-110"
              style={{ filter: 'invert(1) brightness(0.85)' }}
            />
            <span className="font-headline italic text-xl text-primary tracking-tight whitespace-nowrap">
              Jett Iverson
            </span>
          </Link>

          {/* Desktop links: one pill slides between hovered and active */}
          <div className="hidden lg:flex items-center" onMouseLeave={() => setHovered(null)}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onMouseEnter={() => setHovered(link.href)}
                onFocus={() => setHovered(link.href)}
                onBlur={() => setHovered(null)}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`relative px-4 py-2 font-headline italic text-[17px] whitespace-nowrap transition-colors duration-300 ${
                  isActive(link.href) ? 'text-primary' : 'text-on-surface/60 hover:text-primary'
                }`}
              >
                {pill === link.href && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-primary/10 border border-primary/15"
                    transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden relative h-11 w-11 rounded-full border border-white/10 bg-white/5 flex items-center justify-center"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span
              className={`absolute h-px w-5 bg-primary transition-transform duration-500 ${menuOpen ? 'rotate-45' : '-translate-y-[5px]'}`}
            />
            <span
              className={`absolute h-px w-5 bg-primary transition-transform duration-500 ${menuOpen ? '-rotate-45' : 'translate-y-[5px]'}`}
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu: opens as a circle from the toggle */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="menu"
            className="fixed inset-0 z-40 bg-surface-container-lowest lg:hidden flex flex-col justify-center px-8 pt-24 pb-10 grain"
            data-lenis-prevent
            initial={reduce ? { opacity: 0 } : { clipPath: 'circle(0% at calc(100% - 3rem) 3rem)' }}
            animate={reduce ? { opacity: 1 } : { clipPath: 'circle(150% at calc(100% - 3rem) 3rem)' }}
            exit={reduce ? { opacity: 0 } : { clipPath: 'circle(0% at calc(100% - 3rem) 3rem)' }}
            transition={{ duration: reduce ? 0.15 : 0.75, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="relative z-10 flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <div key={link.href} className="overflow-hidden">
                  <motion.div
                    initial={{ y: reduce ? 0 : '110%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.2 + i * 0.05, ease: EASE }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-baseline gap-4 py-1.5 font-headline italic text-[2.6rem] leading-tight ${
                        isActive(link.href) ? 'text-primary' : 'text-on-surface/55'
                      }`}
                    >
                      <span className="font-label not-italic text-[10px] tracking-luxe text-outline w-5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {link.label}
                    </Link>
                  </motion.div>
                </div>
              ))}
            </div>
            <motion.a
              href="mailto:jett@insurancecenterut.com"
              className="relative z-10 mt-10 font-label text-xs uppercase tracking-luxe text-outline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              jett@insurancecenterut.com
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
