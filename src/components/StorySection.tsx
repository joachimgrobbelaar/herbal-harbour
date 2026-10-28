import React, { useEffect } from 'react';
import { Microscope, Award, ShieldCheck, HeartHandshake } from 'lucide-react';
import { StageModel } from './StageModel';

export const StorySection: React.FC = () => {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let cancelled = false;
    let revert = () => {};
    (async () => {
      const gsapModule = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled) return;
      const gsap = gsapModule.default;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.from('#harbour-stats [data-count]', {
          scrollTrigger: { trigger: '#harbour-stats', start: 'top 80%', once: true },
          innerText: 0,
          snap: { innerText: 1 },
          duration: 1.1,
          stagger: 0.12,
          ease: 'power2.out',
        });
        ScrollTrigger.create({
          trigger: '#harbour-stats',
          start: 'top 18%',
          end: '+=45%',
          pin: true,
          pinSpacing: true,
        });
      });
      revert = () => media.revert();
    })();
    return () => {
      cancelled = true;
      revert();
    };
  }, []);

  return (
    <section id="news" className="py-16 sm:py-24 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Top 2-Column Split matching Screenshot 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mb-16 sm:mb-20">
          
          {/* Left Column: Heading & Editorial Narrative */}
          <div className="lg:col-span-7">
            <span className="text-xs font-bold tracking-widest text-emerald-700 uppercase mb-3 block">
              Botanical Expertise & Quality Control
            </span>
            <h2 className="text-[clamp(1.75rem,1.4rem+1.6vw,3rem)] font-extrabold text-forest-900 leading-tight mb-6">
              Our knowledgeable team can help you design experiences tailored to your needs by accessing one of the flower selections
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
              Elementum eu facilisis sed odio morbi quis commodo odio. Mauris rhoncus aenean vel elit scelerisque mauris pellentesque. Accumsan sit amet nulla facilisi morbi tempus. Suscipit tellus mauris a diam maecenas sed enim ut sem. Turpis egestas maecenas pharetra convallis posuere.
            </p>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Every harvest at Herbal Harbour undergoes comprehensive HPLC cannabinoid profiling, microbiological screening, and residual heavy metal testing in certified South African laboratories. We uphold pharmaceutical-grade consistency so patients receive reliable relief with every batch.
            </p>

            {/* Quality Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Microscope className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">HPLC Tested</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">COA Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Pesticide 0%</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-700">Fair Trade SA</span>
              </div>
            </div>
          </div>

          {/* Right Column: Magnifying Glass Botanical Inspection Image representation */}
          <div className="lg:col-span-5 relative">
            <div className="hidden lg:block absolute inset-0 z-10 pointer-events-none">
              <StageModel model="leaf" label="Harbour leaf" className="w-full h-full" />
            </div>
            <div className="lg:invisible">
            <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-gradient-to-br from-[#1b3d32] to-[#0e241d] p-1">
              <div className="relative aspect-[4/3] rounded-[22px] overflow-hidden bg-slate-900 flex items-center justify-center">
                {/* Visual botanical illustration with magnifying glass inspect */}
                <svg viewBox="0 0 400 300" className="w-full h-full object-cover" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Background green greenhouse foliage */}
                  <rect width="400" height="300" fill="#0f291e" />
                  
                  {/* Background soft leaves blurred */}
                  <g opacity="0.35">
                    <circle cx="60" cy="80" r="70" fill="#245a43" />
                    <circle cx="340" cy="90" r="90" fill="#1c4735" />
                    <circle cx="200" cy="40" r="110" fill="#2d6a50" />
                  </g>

                  {/* Flowering plant branches */}
                  <path d="M120 300 C140 220, 160 170, 190 120" stroke="#1c4231" strokeWidth="12" strokeLinecap="round" />
                  <path d="M190 120 C220 80, 260 50, 310 30" stroke="#23523d" strokeWidth="8" strokeLinecap="round" />
                  
                  {/* Surrounding green buds */}
                  <circle cx="150" cy="180" r="32" fill="#2c6748" />
                  <circle cx="240" cy="110" r="38" fill="#367955" />
                  <circle cx="110" cy="130" r="28" fill="#2d6445" />

                  {/* Scientist blue sterile gloved hand holding glass */}
                  <path d="M330 260 C310 230, 275 210, 250 190 L240 170" stroke="#3b82f6" strokeWidth="22" strokeLinecap="round" />
                  <path d="M250 180 L235 155" stroke="#60a5fa" strokeWidth="16" strokeLinecap="round" />

                  {/* Magnifying Glass Loupe Ring */}
                  <circle cx="190" cy="135" r="58" stroke="#d4af37" strokeWidth="6" fill="#143329" fillOpacity="0.25" />
                  <circle cx="190" cy="135" r="54" stroke="#ffffff" strokeWidth="1.5" opacity="0.4" />
                  
                  {/* Magnified High Res Trichome & Calyx Detail inside the lens! */}
                  <g transform="translate(190, 135)">
                    <circle cx="0" cy="0" r="46" fill="#2a6e49" />
                    <circle cx="-15" cy="-8" r="20" fill="#398c5e" />
                    <circle cx="15" cy="-6" r="19" fill="#348157" />
                    <circle cx="0" cy="14" r="22" fill="#449e6b" />
                    <circle cx="2" cy="-22" r="16" fill="#52b57c" />

                    {/* Magnified fiery orange pistils */}
                    <path d="M-22 5 C-32 -5, -28 -22, -15 -32" stroke="#f59438" strokeWidth="3" strokeLinecap="round" />
                    <path d="M20 10 C34 -2, 30 -22, 16 -32" stroke="#e07718" strokeWidth="3" strokeLinecap="round" />
                    <path d="M-10 25 C2 16, 18 20, 25 10" stroke="#f2953e" strokeWidth="2.8" strokeLinecap="round" />

                    {/* Magnified bulbous trichome heads */}
                    <circle cx="-12" cy="-6" r="2.8" fill="#ffffff" />
                    <line x1="-12" y1="-3.2" x2="-12" y2="2" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />

                    <circle cx="10" cy="-12" r="2.5" fill="#ffffff" />
                    <line x1="10" y1="-9.5" x2="10" y2="-4" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />

                    <circle cx="4" cy="8" r="3" fill="#ffeaa7" />
                    <line x1="4" y1="11" x2="4" y2="16" stroke="#ffffff" strokeWidth="1.2" opacity="0.8" />

                    <circle cx="-2" cy="-18" r="2.6" fill="#ffffff" />
                    <circle cx="16" cy="6" r="2.4" fill="#ffeaa7" />
                    <circle cx="-18" cy="12" r="2.5" fill="#ffffff" />
                  </g>

                  {/* Lens Specular Glint */}
                  <path d="M150 95 A 50 50 0 0 1 215 90" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
                </svg>

                {/* Floating Inspection Card */}
                <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-white/60 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                      Live Laboratory Screening
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      Standardized Terpene Retention: 98.4%
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    PASS ISO-17025
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>

        </div>

        <div id="harbour-stats" className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10 pt-10 border-t border-forest-900/10 bg-paper">
          {/* Stat 1 */}
          <div>
            <div className="text-5xl sm:text-6xl font-black text-leaf-500 tracking-tight tabular-nums mb-2">
              <span data-count="180">180</span>+
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-snug">
              <strong className="text-slate-800 block mb-1">New products to explore.</strong>
              Arcu vitae elementum curabitur vitae nunc sed.
            </p>
          </div>

          {/* Stat 2 */}
          <div>
            <div className="text-5xl sm:text-6xl font-black text-leaf-500 tracking-tight tabular-nums mb-2">
              <span data-count="3">3</span>X
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-snug">
              <strong className="text-slate-800 block mb-1">3-Tier Lab Testing.</strong>
              Quis risus sed vulputate odio ut. Arcu vitae elementum.
            </p>
          </div>

          {/* Stat 3 */}
          <div>
            <div className="text-5xl sm:text-6xl font-black text-leaf-500 tracking-tight tabular-nums mb-2">
              <span data-count="100">100</span>%
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-snug">
              <strong className="text-slate-800 block mb-1">Organic & Pure.</strong>
              Mauris a diam maecenas sed enim ut sem curabitur vitae.
            </p>
          </div>

          {/* Stat 4 */}
          <div>
            <div className="text-5xl sm:text-6xl font-black text-leaf-500 tracking-tight tabular-nums mb-2">
              <span data-count="11">11</span>K
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-snug">
              <strong className="text-slate-800 block mb-1">Satisfied Patients.</strong>
              Quis risus sed vulputate odio ut. Arcu vitae elementum.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
