'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import FadeIn from '@/components/FadeIn';
import InkUnderline from '@/components/motion/InkUnderline';
import CountUpStats, { type Stat } from '@/components/motion/CountUpStats';
import Button from '@/components/ui/Button';
import {
  Counter,
  DrawLine,
  EASE,
  HorizontalScroll,
  ImageReveal,
  Parallax,
  ScrollText,
  SplitText,
  Stagger,
  StaggerItem,
  StickyStack,
  VelocityMarquee,
} from '@/components/motion/primitives';
import type { LatestEpisode } from '@/lib/latestEpisode';

function Eyebrow({ children, index }: { children: React.ReactNode; index: string }) {
  return (
    <FadeIn>
      <span className="font-label text-xs uppercase tracking-luxe text-outline mb-5 flex items-center gap-4">
        <span className="text-primary/50 tabular-nums">{index}</span>
        <span className="h-px w-10 bg-white/15" />
        {children}
      </span>
    </FadeIn>
  );
}

const chip = 'font-label text-[10px] uppercase tracking-luxe px-3 py-1 bg-primary-container text-on-primary-container rounded-full';
const card = 'bg-surface-container-highest rounded-[1.25rem] border border-white/[0.08] shadow-soft';

/* ── Marquee band ─────────────────────────────────────────────────── */

const ROLES = ['Marketer', 'Husband', 'Golfer', 'Fisherman', 'Woodworker', 'Figuring it out'];

export function MarqueeBand() {
  const row = (outline: boolean) =>
    ROLES.map((role, i) => (
      <span key={role} className="flex items-center">
        <span
          className={`font-headline italic text-6xl md:text-8xl px-6 md:px-10 ${
            (i % 2 === 0) === outline ? 'text-outline-stroke' : 'text-primary'
          }`}
        >
          {role}
        </span>
        <span className="h-3 w-3 rounded-full bg-accent/70" />
      </span>
    ));
  return (
    <section className="py-14 md:py-20 bg-background border-y border-white/5 overflow-hidden flex flex-col gap-4 md:gap-6">
      <VelocityMarquee baseVelocity={-1.6}>{row(true)}</VelocityMarquee>
      <VelocityMarquee baseVelocity={1.6}>{row(false)}</VelocityMarquee>
    </section>
  );
}

/* ── About ────────────────────────────────────────────────────────── */

export function AboutSection() {
  return (
    <section className="py-28 md:py-40 px-6 md:px-8 bg-surface-container-low relative overflow-hidden">
      <div className="aurora bg-accent/10 h-[34rem] w-[34rem] top-1/3 -right-40" />
      <div className="max-w-screen-2xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-center">
          <div className="md:col-span-7">
            <Eyebrow index="01">About</Eyebrow>
            <h2 className="font-headline italic text-5xl md:text-7xl text-primary mb-10 leading-[1.02]">
              <SplitText text="Marketing student." className="block" />
              <span className="block">
                <InkUnderline variant="flick" delay={0.5}>
                  <SplitText text="AI-driven." delay={0.15} />
                </InkUnderline>
              </span>
            </h2>
            <ScrollText
              className="font-headline text-2xl md:text-[2rem] text-on-surface leading-[1.35] mb-10"
              text="Studying Marketing at Utah State University's Huntsman School of Business, graduating December 2026 with a 3.74 GPA while working full time. Director of Marketing at The Insurance Center, where I lead SEO, GEO, and AI innovation across the company's entire marketing operation."
            />
            <FadeIn>
              <Button href="/about" variant="ghost" icon="arrow_forward">My Story</Button>
            </FadeIn>
          </div>
          <div className="md:col-span-5 relative">
            <ImageReveal className="aspect-[4/5] rounded-[1.25rem] shadow-premium">
              <Image src="/Golf.JPEG" alt="Jett golfing in Hawaii" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover" />
            </ImageReveal>
            <Parallax speed={-50} className="absolute -bottom-10 -left-4 md:-left-12 w-40 md:w-52 hidden sm:block">
              <ImageReveal delay={0.25} drift={0} className="aspect-square rounded-[1rem] shadow-premium border border-white/10">
                <Image src="/fishing-pond-golden.jpg" alt="Fishing a still pond at golden hour" fill sizes="208px" className="object-cover" />
              </ImageReveal>
            </Parallax>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Background ───────────────────────────────────────────────────── */

const background = [
  {
    icon: 'work',
    org: 'The Insurance Center',
    title: 'Director of Marketing',
    meta: 'Farr West, UT · Jun 2024 – Present · Director since Apr 2025',
    items: ['Lead SEO, GEO and AI implementation', 'Licensed Insurance Agent (P&C)', 'YouTube views up 12× in 2026'],
    from: -70,
  },
  {
    icon: 'school',
    org: 'Utah State University',
    title: 'B.S. Marketing',
    meta: 'Jon M. Huntsman School of Business · Dec 2026',
    items: ['GPA 3.74 · Academic Scholarship', 'ProSales Member', 'Google Ads Certified', 'Meta Business Suite Certified'],
    from: 70,
  },
];

export function BackgroundSection() {
  const reduce = useReducedMotion();
  return (
    <section className="py-24 md:py-32 px-6 md:px-8 bg-background">
      <div className="max-w-screen-2xl mx-auto">
        <Eyebrow index="02">Background</Eyebrow>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto [perspective:1400px]">
          {background.map((b, i) => (
            <motion.div
              key={b.org}
              className={`${card} p-8 md:p-10 h-full transition-colors duration-500 hover:border-primary/25`}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: b.from, rotateY: b.from / -5, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, x: 0, rotateY: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: reduce ? 0.3 : 1.1, delay: i * 0.1, ease: EASE }}
            >
              <span className="material-symbols-outlined text-primary/60 text-3xl mb-5 block" aria-hidden="true">{b.icon}</span>
              <p className="font-label text-xs uppercase tracking-luxe text-outline mb-2">{b.org}</p>
              <h3 className="font-headline italic text-3xl md:text-4xl text-primary mb-2">{b.title}</h3>
              <p className="text-on-surface-variant text-sm mb-7">{b.meta}</p>
              <Stagger gap={0.1} delay={0.35} className="space-y-3">
                {b.items.map((item) => (
                  <StaggerItem key={item} className="flex items-center gap-3 text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined text-primary text-base flex-shrink-0" aria-hidden="true">task_alt</span>
                    {item}
                  </StaggerItem>
                ))}
              </Stagger>
            </motion.div>
          ))}
        </div>
        <FadeIn delay={0.15} className="flex justify-center mt-10">
          <Button href="/resume.pdf" variant="ghost" icon="download">Download Resume</Button>
        </FadeIn>
      </div>
    </section>
  );
}

/* ── Results ──────────────────────────────────────────────────────── */

const adsStats: Stat[] = [
  { label: 'Impressions', value: 7.4, format: 'multiplier', before: 69200, after: 513980, beforeLabel: '69,200', afterLabel: '513,980' },
  { label: 'Clicks', value: 7.9, format: 'multiplier', before: 2060, after: 16372, beforeLabel: '2,060', afterLabel: '16,372' },
  { label: 'Inbound Calls', value: 105, format: 'percent', before: 181, after: 371, beforeLabel: '181', afterLabel: '371' },
  { label: 'Digital Premium', value: 490713, format: 'currency', after: 490713, beforeLabel: '—', afterLabel: '$490,713', note: '306 policies' },
];

function BigStatCard({
  tags,
  title,
  body,
  value,
  unit,
  children,
}: {
  tags: string[];
  title: string;
  body: string;
  value: number;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${card} p-8 md:p-12 grid grid-cols-1 md:grid-cols-12 gap-8 items-center`}>
      <div className="md:col-span-7">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {tags.map((t) => (
            <span key={t} className={chip}>{t}</span>
          ))}
        </div>
        <h3 className="font-headline italic text-3xl md:text-4xl text-primary mb-4">{title}</h3>
        <p className="text-on-surface-variant leading-relaxed max-w-xl">{body}</p>
      </div>
      <div className="md:col-span-5 md:text-right">
        <p className="font-headline italic text-[5.5rem] md:text-[8rem] text-primary leading-none">
          <Counter value={value} prefix="+" suffix="%" />
        </p>
        <p className="text-on-surface-variant mt-2">{unit}</p>
        <div className="text-on-surface-variant text-sm mt-3">{children}</div>
      </div>
    </div>
  );
}

export function ResultsSection() {
  return (
    <section className="py-28 md:py-40 px-6 md:px-8 bg-surface-container-low border-t border-white/5">
      <div className="max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-16">
          <div className="md:col-span-7">
            <Eyebrow index="03">Results</Eyebrow>
            <h2 className="font-headline italic text-6xl md:text-8xl text-primary leading-[0.95]">
              <SplitText text="By the" />{' '}
              <InkUnderline variant="flick" delay={0.5}>
                <SplitText text="numbers" delay={0.15} />
              </InkUnderline>
            </h2>
          </div>
          <FadeIn className="md:col-span-5" delay={0.1}>
            <p className="text-on-surface-variant text-lg mb-5">
              Real outcomes from real campaigns. These are the numbers behind the work at The Insurance Center.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/case-studies/organic-search" className="group inline-flex items-center gap-2 text-primary font-headline italic text-lg w-fit">
                <span className="link-sweep">Full case study: growing organic search 203%</span>
                <span className="material-symbols-outlined text-sm transition-transform duration-500 group-hover:translate-x-1.5" aria-hidden="true">arrow_forward</span>
              </Link>
              <Link href="/case-studies" className="group inline-flex items-center gap-2 text-outline font-label uppercase tracking-luxe text-xs hover:text-primary transition-colors w-fit">
                More: AI prospecting agent, marketing dashboard, YouTube growth
                <span className="material-symbols-outlined text-sm transition-transform duration-500 group-hover:translate-x-1.5" aria-hidden="true">arrow_forward</span>
              </Link>
            </div>
          </FadeIn>
        </div>

        <StickyStack>
          {[
            <div key="ads" className={`${card} overflow-hidden`}>
              <div className="p-8 md:p-12 border-b border-white/[0.06]">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={chip}>The Insurance Center</span>
                  <span className={chip}>Google Ads</span>
                  <span className="font-label text-[10px] uppercase tracking-luxe text-outline">2024 → 2025</span>
                </div>
                <h3 className="font-headline italic text-3xl md:text-4xl text-primary mb-3">
                  Search performance rebuilt from the ground up
                </h3>
                <p className="text-on-surface-variant max-w-2xl leading-relaxed">
                  Took over a stagnant Google Ads account and rebuilt the strategy from scratch — new campaign architecture,
                  tighter audience targeting, and landing pages optimized for insurance intent. The results compounded fast.
                </p>
              </div>
              <CountUpStats stats={adsStats} />
            </div>,
            <BigStatCard
              key="reviews"
              tags={['The Insurance Center', 'Local SEO']}
              title="Google Reviews — reputation built systematically"
              body="Built an internal workflow that made requesting reviews a trackable, competitive team activity. A leaderboard surfacing each agent's review count changed behavior agency-wide."
              value={222}
              unit="review growth"
            >
              <span className="text-outline">95 reviews</span>
              <span className="mx-2 text-primary/40">→</span>
              <span className="text-primary font-medium">306 reviews</span>
              <span className="block text-outline mt-1">rating holding at 4.9</span>
            </BigStatCard>,
            <BigStatCard
              key="drip"
              tags={['The Insurance Center', 'Automation']}
              title="Automated drip campaigns — outreach that runs itself"
              body="Designed and deployed automated lead gen workflows that maintain contact with prospects and commercial accounts over time — removing manual follow-up from the process entirely."
              value={200}
              unit="outreach volume"
            >
              fully automated
            </BigStatCard>,
          ]}
        </StickyStack>
      </div>
    </section>
  );
}

/* ── Projects: pinned horizontal gallery ──────────────────────────── */

type Build = {
  kind: 'Work' | 'For fun';
  title: string;
  description: string;
  tags: string[];
  href: string;
  external?: boolean;
  cta: string;
  image?: string;
  icon?: string;
};

const builds: Build[] = [
  {
    kind: 'Work',
    title: 'Marketing Dashboard',
    description: 'A week of reports collapsed into a one-minute answer to "what\'s working?" Built for The Insurance Center.',
    tags: ['React', 'Python', 'Analytics'],
    href: '/case-studies/marketing-dashboard',
    cta: 'Read the case study',
    icon: 'monitoring',
  },
  {
    kind: 'Work',
    title: 'AI Prospecting Agent',
    description: "ZoomInfo connected to Claude so the week's best prospects show up ranked, with outreach already drafted.",
    tags: ['Claude', 'MCP', 'Automation'],
    href: '/case-studies/ai-prospecting-agent',
    cta: 'Read the case study',
    icon: 'smart_toy',
  },
  {
    kind: 'Work',
    title: 'SearchLight Digital',
    description: 'An SEO and GEO agency built for the new era of search, where AI answers are the new page one.',
    tags: ['SEO', 'GEO', 'AI Search'],
    href: 'https://searchlight-digital-v2.vercel.app/',
    external: true,
    cta: 'Visit site',
    image: '/projects/searchlight.jpg',
  },
  {
    kind: 'For fun',
    title: 'Play Me in Chess',
    description: 'A chess bot trained on 311 of my real games, with a leaderboard behind an API I wrote.',
    tags: ['AI', 'Chess', 'API'],
    href: '/play/play-me-chess',
    cta: 'Play it',
    image: '/projects/chess.jpg',
  },
  {
    kind: 'For fun',
    title: 'Premier League Command Center',
    description: 'A live one-screen match-day dashboard. A proxy I wrote shrinks a 743 KB payload to the 12 KB the screen needs.',
    tags: ['Next.js', 'API Proxy', 'Data Viz'],
    href: 'https://plcc-live.vercel.app',
    external: true,
    cta: 'Visit site',
    image: '/projects/plcc.jpg',
  },
  {
    kind: 'For fun',
    title: 'Utah Golf Tinder',
    description: "Log every Utah course you've played and watch your percentage of the whole state tick up.",
    tags: ['React', 'Maps', 'Golf'],
    href: 'https://utah-golf-tinder.vercel.app/',
    external: true,
    cta: 'Visit site',
    image: '/projects/utah-golf.jpg',
  },
];

function BuildCard({ build, index }: { build: Build; index: number }) {
  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1rem] bg-surface-container-lowest border border-white/[0.06]">
        {build.image ? (
          <Image
            src={build.image}
            alt={`${build.title} screenshot`}
            fill
            sizes="(max-width: 1024px) 80vw, 36vw"
            className="object-cover object-top transition-transform duration-[1200ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-container via-surface-container to-surface-container-lowest">
            <div className="aurora bg-accent/30 h-48 w-48" />
            <span className="material-symbols-outlined text-primary/80 !text-[7rem] transition-transform duration-[1200ms] ease-out group-hover:scale-110 group-hover:-rotate-6" aria-hidden="true">
              {build.icon}
            </span>
          </div>
        )}
        <span className="absolute top-4 left-4 font-headline italic text-primary text-lg bg-surface-container-lowest/70 backdrop-blur-md rounded-full h-11 w-11 flex items-center justify-center border border-white/10 tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="pt-6 px-1 flex flex-col flex-1">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`font-label text-[10px] uppercase tracking-luxe px-3 py-1 rounded-full ${build.kind === 'Work' ? 'bg-primary text-on-primary' : 'bg-secondary/20 text-secondary'}`}>
            {build.kind}
          </span>
          {build.tags.slice(0, 2).map((tag) => (
            <span key={tag} className={chip}>{tag}</span>
          ))}
        </div>
        <h3 className="font-headline italic text-3xl text-primary mb-2 whitespace-normal">{build.title}</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-5 whitespace-normal flex-1">{build.description}</p>
        <span className="inline-flex items-center gap-2 text-primary font-label uppercase tracking-[0.18em] text-xs">
          {build.cta}
          <span className="material-symbols-outlined text-sm transition-transform duration-500 group-hover:translate-x-1.5" aria-hidden="true">
            {build.external ? 'open_in_new' : 'arrow_forward'}
          </span>
        </span>
      </div>
    </>
  );
  const cls = `group flex flex-col flex-shrink-0 w-[82vw] sm:w-[60vw] lg:w-[36vw] xl:w-[30vw] ${card} p-4 pb-6 transition-colors duration-500 hover:border-primary/25`;
  return build.external ? (
    <a href={build.href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
  ) : (
    <Link href={build.href} className={cls}>{body}</Link>
  );
}

export function ProjectsSection() {
  return (
    <section className="bg-background border-t border-white/5">
      <HorizontalScroll
        header={
          <div className="flex items-end justify-between gap-8">
            <div>
              <Eyebrow index="04">Projects</Eyebrow>
              <h2 className="font-headline italic text-5xl md:text-7xl text-primary mb-3 leading-none">
                <SplitText text="Things I've" />{' '}
                <InkUnderline variant="flick" delay={0.5}>
                  <SplitText text="built" delay={0.15} />
                </InkUnderline>
              </h2>
              <p className="text-on-surface-variant text-lg max-w-xl">
                Some of it runs the marketing at work. Some of it is just for fun.
              </p>
            </div>
            <div className="hidden md:flex gap-4 flex-shrink-0">
              <Button href="/projects" variant="ghost" icon="arrow_forward">All Projects</Button>
              <Button href="/play" variant="ghost" icon="arrow_forward">Open the Arcade</Button>
            </div>
          </div>
        }
      >
        {builds.map((build, i) => (
          <BuildCard key={build.title} build={build} index={i} />
        ))}
        <Link
          href="/projects"
          className="group flex-shrink-0 w-[82vw] sm:w-[60vw] lg:w-[28vw] rounded-[1.25rem] border border-dashed border-primary/25 flex flex-col items-center justify-center gap-5 p-10 text-center transition-colors duration-500 hover:bg-primary-container/40"
        >
          <span className="h-20 w-20 rounded-full border border-primary/40 flex items-center justify-center text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-on-primary group-hover:scale-110">
            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          </span>
          <span className="font-headline italic text-3xl text-primary whitespace-normal">See every project</span>
        </Link>
      </HorizontalScroll>
    </section>
  );
}

/* ── Podcast + writing ────────────────────────────────────────────── */

export function MediaSection({
  latestEpisode,
  featuredArticle,
}: {
  latestEpisode: LatestEpisode | null;
  featuredArticle?: { slug: string; title: string; excerpt: string; readTime: string };
}) {
  return (
    <section className="py-28 md:py-40 px-6 md:px-8 bg-surface-container-low border-t border-white/5">
      <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-16">
        {/* Podcast */}
        <div>
          <Eyebrow index="05">Podcast</Eyebrow>
          <h2 className="font-headline italic text-5xl md:text-6xl text-primary mb-6 flex items-end gap-5">
            <span>
              <SplitText text="Commute 2" />{' '}
              <InkUnderline variant="flick" delay={0.5}>
                <SplitText text="Work" delay={0.15} />
              </InkUnderline>
            </span>
            <span className="flex items-end gap-1 h-9 mb-2" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="eq-bar w-1 h-full rounded-full bg-accent" style={{ animationDelay: `${i * -0.23}s` }} />
              ))}
            </span>
          </h2>
          <FadeIn>
            <p className="text-on-surface-variant text-lg mb-8 max-w-xl leading-relaxed">
              A podcast recorded from the driver&apos;s seat. I turned my commute into a place to think out loud about AI,
              careers, and the algorithm, and I&apos;m automating the whole channel along the way.
            </p>
            <Button href="/podcast" variant="ghost" icon="arrow_forward">Where to start</Button>
          </FadeIn>
          {latestEpisode && (
            <FadeIn delay={0.1}>
              <a
                href={`https://www.youtube.com/watch?v=${latestEpisode.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`group mt-12 flex flex-col sm:flex-row gap-6 items-center ${card} p-4 hover:border-primary/25 transition-colors duration-500`}
              >
                <div className="relative w-full sm:w-64 aspect-video flex-shrink-0 rounded-[0.75rem] overflow-hidden">
                  <Image
                    src={`https://i.ytimg.com/vi/${latestEpisode.id}/hqdefault.jpg`}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 256px"
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-12 w-12 rounded-full bg-surface-container-lowest/70 backdrop-blur-md border border-white/15 flex items-center justify-center text-primary transition-transform duration-500 group-hover:scale-125">
                      <span className="material-symbols-outlined" aria-hidden="true">play_arrow</span>
                    </span>
                  </span>
                </div>
                <div className="sm:pr-4">
                  <p className="font-label text-[10px] uppercase tracking-luxe text-outline mb-2">
                    Latest episode ·{' '}
                    {new Date(latestEpisode.published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                  </p>
                  <p className="font-headline italic text-xl text-primary group-hover:text-primary-fixed transition-colors">
                    {latestEpisode.title}
                  </p>
                </div>
              </a>
            </FadeIn>
          )}
        </div>

        {/* Writing */}
        <div>
          <Eyebrow index="06">Writing</Eyebrow>
          <div className="flex items-end justify-between mb-6">
            <SplitText as="h2" text="Content" className="font-headline italic text-5xl md:text-6xl text-primary" />
            <Link href="/content" className="group hidden md:inline-flex items-center gap-2 text-primary font-headline italic text-lg">
              <span className="link-sweep">All articles</span>
              <span className="material-symbols-outlined text-sm transition-transform duration-500 group-hover:translate-x-1.5" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>
          {featuredArticle && (
            <FadeIn>
              <Link
                href={`/content/${featuredArticle.slug}`}
                className="group block bg-surface-container p-8 md:p-10 rounded-[1.25rem] border border-white/[0.08] shadow-soft hover:border-primary/25 transition-all duration-500 hover:-translate-y-1.5"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="font-label text-[10px] uppercase tracking-luxe px-2 py-0.5 bg-primary/10 text-primary rounded-full">On-Site</span>
                  <span className="text-outline/50">·</span>
                  <span className="font-label text-[10px] uppercase tracking-luxe text-outline">{featuredArticle.readTime}</span>
                </div>
                <h3 className="font-headline italic text-2xl md:text-3xl text-primary mb-3 group-hover:text-primary-fixed transition-colors">
                  {featuredArticle.title}
                </h3>
                <p className="text-on-surface-variant text-sm leading-relaxed mb-6">{featuredArticle.excerpt}</p>
                <span className="inline-flex items-center gap-2 text-primary font-label text-xs uppercase tracking-luxe">
                  Read Article
                  <span className="material-symbols-outlined text-sm transition-transform duration-500 group-hover:translate-x-1.5" aria-hidden="true">arrow_forward</span>
                </span>
              </Link>
            </FadeIn>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── Life: photo wall with columns drifting at different speeds ───── */

// Pre-sorted into four columns of near-equal height (see the aspect ratios).
const photoColumns = [
  [
    { src: '/fishing-pond-golden.jpg', alt: 'Fishing a still pond at golden hour with the dog watching, Utah foothills behind', w: 788, h: 1400 },
    { src: '/IMG_7344.JPEG', alt: 'Jett and his wife at an Argentina soccer match', w: 1500, h: 2000 },
    { src: '/Snow Time with Wife.JPEG', alt: 'Snow day with wife', w: 1500, h: 2000 },
    { src: '/IMG_0961.JPEG', alt: 'Jett and his wife in the mountains', w: 1333, h: 2000 },
    { src: '/IMG_0104.JPEG', alt: 'In Naples, Italy wearing Argentina jerseys', w: 1500, h: 2000 },
  ],
  [
    { src: '/couple-forest-hillside.jpg', alt: 'Jett and his wife on a wooded hillside with the dog', w: 1400, h: 933 },
    { src: '/Wedding.JPEG', alt: 'Wedding day', w: 1333, h: 2000 },
    { src: '/Golf.JPEG', alt: 'On the golf course', w: 2000, h: 1125 },
    { src: '/Mountain 2.0.JPEG', alt: 'Mountain adventure', w: 2000, h: 1333 },
    { src: '/Fishing sitting down.jpeg', alt: 'Fishing', w: 2000, h: 2667 },
    { src: '/IMG_9203.JPEG', alt: 'Jett and his wife at a wedding', w: 1500, h: 2000 },
  ],
  [
    { src: '/IMG_6716.JPEG', alt: 'Jett and his wife at Lake Como, Italy', w: 1500, h: 2000 },
    { src: '/snowbasin-summer-dog.jpg', alt: 'At Snowbasin in summer with the dog, gondola line up the green run', w: 1400, h: 933 },
    { src: '/IMG_0208.JPEG', alt: 'Cooking class in Rome', w: 1500, h: 2000 },
    { src: '/Mission.JPEG', alt: 'LDS Mission in Brazil', w: 1333, h: 2000 },
    { src: '/IMG_6857.JPEG', alt: 'Kissing in the rain at a lakeside heart sculpture', w: 1500, h: 2000 },
  ],
  [
    { src: '/fishing-sunset-silhouette.jpg', alt: 'Silhouetted at the lake, fishing under a burning sunset', w: 788, h: 1400 },
    { src: '/Fishing Wind Rivers.JPEG', alt: 'Fishing in the Wind Rivers', w: 1500, h: 2000 },
    { src: '/Double Rainbow.JPEG', alt: 'Double rainbow', w: 2000, h: 1500 },
    { src: '/Baby Jett.JPEG', alt: 'Baby Jett', w: 2000, h: 1500 },
    { src: '/IMG_8221.jpeg', alt: 'Christmas lights date night', w: 2000, h: 2667 },
    { src: '/Fishing w leo.JPEG', alt: 'Teaching a toddler to fish on the river', w: 1500, h: 2000 },
  ],
];

const COLUMN_SPEEDS = [50, -40, 70, -20];

export function LifeSection() {
  return (
    <section className="py-28 md:py-40 px-6 md:px-8 bg-background border-t border-white/5 overflow-hidden">
      <div className="max-w-screen-2xl mx-auto">
        <Eyebrow index="07">Life</Eyebrow>
        <h2 className="font-headline italic text-6xl md:text-8xl text-primary mb-16 md:mb-28 leading-[0.95]">
          <SplitText text="Outside the" />{' '}
          <InkUnderline variant="flick" delay={0.5}>
            <SplitText text="office" delay={0.15} />
          </InkUnderline>
        </h2>
        <div className="photo-wall grid grid-cols-2 md:grid-cols-4 gap-4 items-start">
          {photoColumns.map((col, ci) => (
            <Parallax key={ci} speed={COLUMN_SPEEDS[ci]} className={`flex flex-col gap-4 ${ci % 2 === 1 ? 'md:mt-16' : ''}`}>
              {col.map((photo) => (
                <FadeIn key={photo.src}>
                  <figure tabIndex={0} className="photo relative m-0 overflow-hidden rounded-[0.75rem] outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      width={photo.w}
                      height={photo.h}
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="w-full h-auto object-cover"
                    />
                    <figcaption
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-8 font-headline italic text-sm md:text-[15px] leading-snug text-white bg-gradient-to-t from-[#0f140f]/90 to-transparent"
                    >
                      {photo.alt}
                    </figcaption>
                  </figure>
                </FadeIn>
              ))}
            </Parallax>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Contact CTA: the panel opens like an iris as it arrives ──────── */

export function ContactCTA() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 0.15'] });
  const clip = useTransform(scrollYProgress, [0, 1], ['inset(12% 14% 12% 14% round 48px)', 'inset(0% 0% 0% 0% round 0px)']);

  return (
    <section ref={ref} className="bg-background">
      <motion.div
        className="relative overflow-hidden py-32 md:py-48 px-6 md:px-8 bg-primary-container"
        style={reduce ? undefined : { clipPath: clip }}
      >
        <div className="aurora bg-accent/30 h-[36rem] w-[36rem] -top-40 left-1/4" />
        <div className="aurora bg-secondary/15 h-[28rem] w-[28rem] -bottom-40 right-1/4" style={{ animationDelay: '-6s' }} />
        <div className="max-w-screen-2xl mx-auto text-center relative">
          <h2 className="font-headline italic text-5xl md:text-7xl xl:text-8xl text-on-primary-container mb-6 leading-[1.02]">
            <SplitText text="Got something worth building," className="block" />
            <span className="block">
              <SplitText text="or just want to play" delay={0.2} />{' '}
              <InkUnderline variant="swoop" color="text-secondary" delay={0.9}>
                <SplitText text="a quick 9?" delay={0.4} />
              </InkUnderline>
            </span>
          </h2>
          <FadeIn delay={0.2}>
            <p className="text-on-primary-container/70 text-lg mb-10 max-w-xl mx-auto">Let me know.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button href="mailto:jett@insurancecenterut.com" icon="mail">Email Me</Button>
              <Button href="/contact" variant="onContainer" icon="arrow_forward">Get in Touch</Button>
            </div>
            <p className="mt-8 text-on-primary-container/70 text-sm">
              Or write directly:{' '}
              <a href="mailto:jett@insurancecenterut.com" className="link-sweep hover:text-on-primary-container transition-colors">
                jett@insurancecenterut.com
              </a>
            </p>
          </FadeIn>
        </div>
      </motion.div>
      <DrawLine />
    </section>
  );
}
