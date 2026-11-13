# Website V3 (motion rebuild)

A separate, animation-heavy rebuild of jettiverson.com. The live site lives in
the `main` branch of `AirplaneMode2955/Website-V2` and must not be edited from
this project.

- Motion primitives: `src/components/motion/primitives.tsx` (SplitText,
  ScrollText, Parallax, ImageReveal, Magnetic, VelocityMarquee,
  HorizontalScroll, StickyStack, Counter, Stagger).
- Shell: `src/components/shell/` (Lenis smooth scroll, scroll progress, cursor,
  preloader), `Nav.tsx`, `Footer.tsx`, `PageTransition.tsx`.
- Home sections: `src/components/home/HomeSections.tsx`.
- Inner-page banner: `src/components/PageHero.tsx`.
- Every effect must keep a static fallback for `prefers-reduced-motion`.
- Verify with `npx tsc --noEmit`, `npm test`, `npm run build`.
