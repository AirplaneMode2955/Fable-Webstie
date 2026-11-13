import type { Metadata } from 'next';
import Link from 'next/link';
import FadeIn from '@/components/FadeIn';
import InkUnderline from '@/components/motion/InkUnderline';
import { caseStudies } from '@/lib/caseStudies';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Case Studies',
  alternates: { canonical: '/case-studies' },
  description:
    'Detailed write-ups of marketing work by Jett Iverson — SEO, GEO, and organic search results, measured in GA4 and Search Console.',
};

export default function CaseStudiesPage() {
  return (
    <>
      {/* ── Page Banner ── */}
      <PageHero
        eyebrow="Results"
        title={<>Case <InkUnderline variant="swoop">Studies</InkUnderline></>}
        watermark="Case Studies"
      >
            <p className="text-on-surface-variant text-xl max-w-xl">
              Longer write-ups of specific work — what the problem was, what I did, and the
              numbers it moved. Every figure is pulled from the source it names.
            </p>
      </PageHero>

      {/* ── List ── */}
      <section className="py-24 px-8 bg-surface-container-low">
        <div className="max-w-screen-2xl mx-auto space-y-8">
          {caseStudies.map((study, i) => (
            <FadeIn key={study.slug} delay={i * 0.05}>
              <Link
                href={`/case-studies/${study.slug}`}
                className="group block bg-surface-container-highest rounded-[1.25rem] p-8 md:p-10 border border-white/[0.08] shadow-soft hover:border-primary/20 transition-colors"
              >
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <span className="font-label text-[10px] uppercase tracking-luxe px-3 py-1 bg-primary-container text-on-primary-container rounded-full">
                    The Insurance Center
                  </span>
                  <span className="font-label text-[10px] uppercase tracking-luxe text-outline">
                    {study.period}
                  </span>
                </div>

                <h2 className="font-headline italic text-3xl md:text-4xl text-primary mb-3 group-hover:text-primary-fixed transition-colors">
                  {study.title}
                </h2>

                <p className="text-on-surface-variant leading-relaxed mb-6 max-w-3xl">
                  {study.tagline}
                </p>

                <div className="flex flex-wrap gap-6 mb-6">
                  {study.metrics.slice(0, 3).map((m) => (
                    <div key={m.label}>
                      <p className="font-headline italic text-3xl md:text-4xl text-primary leading-none">
                        {m.change}
                      </p>
                      <p className="text-outline text-xs mt-1">{m.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {study.tags.map((tag) => (
                      <span
                        key={tag}
                        className="font-label text-[10px] uppercase tracking-luxe px-3 py-1 bg-primary/10 text-primary rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-primary font-label text-xs uppercase tracking-luxe group-hover:text-primary-fixed transition-colors hidden md:block">
                    Read case study →
                  </span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>
    </>
  );
}
