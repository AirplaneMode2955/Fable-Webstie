import type { Metadata } from 'next';
import HeroSection from '@/components/HeroSection';
import { getOnSiteArticles } from '@/lib/articles';
import { getLatestEpisode } from '@/lib/latestEpisode';
import {
  AboutSection,
  BackgroundSection,
  ContactCTA,
  LifeSection,
  MarqueeBand,
  MediaSection,
  ProjectsSection,
  ResultsSection,
} from '@/components/home/HomeSections';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// The latest-episode card reads YouTube's RSS feed; refresh it hourly.
export const revalidate = 3600;

export default async function Home() {
  const [featuredArticle] = getOnSiteArticles();
  const latestEpisode = await getLatestEpisode();
  return (
    <>
      <HeroSection />
      <MarqueeBand />
      <AboutSection />
      <BackgroundSection />
      <ResultsSection />
      <ProjectsSection />
      <MediaSection
        latestEpisode={latestEpisode}
        featuredArticle={
          featuredArticle && {
            slug: featuredArticle.slug,
            title: featuredArticle.title,
            excerpt: featuredArticle.excerpt,
            readTime: featuredArticle.readTime,
          }
        }
      />
      <LifeSection />
      <ContactCTA />
    </>
  );
}
