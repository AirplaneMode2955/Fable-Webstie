# Website V3 (motion rebuild)

The animation-heavy rebuild of jettiverson.com, and now the live site:
jettiverson.com is served by the `fable-website` Vercel project, which deploys
from this repo's `main` branch. `AirplaneMode2955/Website-V2` is the old site
and no longer serves the domain.

- Motion primitives: `src/components/motion/primitives.tsx` (SplitText,
  ScrollText, Parallax, ImageReveal, Magnetic, VelocityMarquee,
  HorizontalScroll, StickyStack, Counter, Stagger).
- Shell: `src/components/shell/` (Lenis smooth scroll, scroll progress, cursor,
  preloader), `Nav.tsx`, `Footer.tsx`, `PageTransition.tsx`.
- Home sections: `src/components/home/HomeSections.tsx`.
- Inner-page banner: `src/components/PageHero.tsx`.
- Every effect must keep a static fallback for `prefers-reduced-motion`.
- Verify with `npx tsc --noEmit`, `npm test`, `npm run build`.
