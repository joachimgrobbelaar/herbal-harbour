import React, { useEffect } from 'react';

/** Lenis + GSAP ticker. Native scrolling stays in place when motion is reduced. */
export const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let destroy = () => {};
    (async () => {
      const [{ default: Lenis }, gsapModule, scrollModule] = await Promise.all([
        import('lenis'),
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ]);
      if (cancelled) return;
      const gsap = gsapModule.default;
      gsap.registerPlugin(scrollModule.ScrollTrigger);
      const lenis = new Lenis({ lerp: 0.1 });
      lenis.on('scroll', scrollModule.ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      destroy = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    })();
    return () => {
      cancelled = true;
      destroy();
    };
  }, []);

  return <>{children}</>;
};
