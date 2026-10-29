import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../types';
import { StageModel } from './StageModel';
import type { ModelType } from './ThreeCanvas';

function getHeroModel(product?: Product): { model: ModelType; src: string } {
  if (!product) return { model: 'bud', src: '/models/weed_nug_1.glb' };
  const name = product.name.toLowerCase();
  const cat = product.category.toLowerCase();
  if (name.includes('durban poison') || cat === 'flower' || name.includes('bud')) {
    return { model: 'bud', src: '/models/weed_nug_1.glb' };
  }
  if (cat === 'seeds') {
    return { model: 'seed', src: '/models/seed.glb' };
  }
  if (cat === 'tinctures') {
    return { model: 'bottle', src: '/models/bottle.glb' };
  }
  if (name.includes('sativa') || cat === 'plant' || cat === 'plants') {
    return { model: 'plant', src: '/models/cannabis_sativa_plant.glb' };
  }
  return { model: 'bud', src: '/models/hero-bud.glb' };
}

interface HeroProps {
  onExploreProducts: () => void;
  onSelectProductForDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenGoogleSheet: () => void;
  onOpenJackpot?: () => void;
  onOpen3DStudio?: () => void;
  allProducts: Product[];
  signedIn?: boolean;
  walletBalance?: number | null;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreProducts,
  onSelectProductForDetails,
  onOpenJackpot,
  allProducts,
  signedIn = false,
  walletBalance,
}) => {
  const slides = allProducts.filter((product) => product.active !== false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const safeIndex = slides.length ? activeSlideIndex % slides.length : 0;
  const current = slides[safeIndex];
  const heroModel = getHeroModel(current);

  return (
    <section id="home">
      <div className="grid md:grid-cols-2 md:min-h-[620px] lg:min-h-[680px]">
        <div className="bg-paper flex items-center">
          <div className="hero-copy w-full py-14 sm:py-20 lg:py-24">
            <h1 className="max-w-xl text-[clamp(2.75rem,5vw,4.75rem)] font-extrabold leading-[0.92] text-forest-900">
              Medicinal cannabis and CBD
            </h1>
            <p className="mt-6 max-w-lg text-xl sm:text-2xl font-bold leading-relaxed text-forest-950">
              Herbal Harbour sells online and in store. Prices are in rand. Pay by EFT or when you collect. Courier is R95, free over R750.
            </p>
            <button onClick={onExploreProducts} className="cta-signal mt-8">
              Our Products
            </button>
          </div>
        </div>

        <div className="relative bg-forest-900 text-paper">
          <div className="hero-panel-copy grid grid-cols-1 lg:grid-cols-[minmax(220px,1fr)_minmax(260px,1fr)] gap-4 lg:gap-10 items-center py-10 lg:py-0 lg:min-h-[680px]">
            <div className="order-1 h-72 md:h-80 lg:h-[460px] w-full min-w-0 px-2">
              <StageModel model={heroModel.model} src={heroModel.src} label={current ? current.name : "Cannabis bud"} className="w-full h-full" />
            </div>
            <div className="order-2 min-w-0">
              {current ? (
                <>
                  <h2 className="text-[clamp(2rem,3vw,3.25rem)] font-extrabold leading-[0.95] text-paper">{current.name}</h2>
                  <p className="mt-5 max-w-xs text-base leading-relaxed text-[#e7f2e4]">{current.subtitle}</p>
                  <ul className="mt-6 space-y-2.5 text-sm text-paper">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-signal shrink-0" /> {current.strainType}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-signal shrink-0" /> THC {current.thc}</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-signal shrink-0" /> CBD {current.cbd}</li>
                  </ul>
                  <button
                    onClick={() => onSelectProductForDetails(current)}
                    className="mt-8 text-sm font-bold text-paper underline decoration-signal decoration-2 underline-offset-8"
                  >
                    About this product
                  </button>
                  {slides.length > 1 && (
                    <div className="mt-8 flex flex-col gap-3" aria-label="Featured products">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setActiveSlideIndex((safeIndex - 1 + slides.length) % slides.length)}
                          className="w-11 h-11 rounded-full border border-white/25 grid place-items-center text-paper hover:bg-signal hover:text-forest-900 hover:border-signal transition-colors cursor-pointer"
                          aria-label="Previous product"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-mono text-sm text-[#d5e0d2] tabular-nums" aria-live="polite">
                          <span className="text-paper font-bold">{String(safeIndex + 1).padStart(2, '0')}</span>
                          {' / '}
                          {String(slides.length).padStart(2, '0')}
                        </span>
                        <button
                          onClick={() => setActiveSlideIndex((safeIndex + 1) % slides.length)}
                          className="w-11 h-11 rounded-full border border-white/25 grid place-items-center text-paper hover:bg-signal hover:text-forest-900 hover:border-signal transition-colors cursor-pointer"
                          aria-label="Next product"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                        {slides.slice(0, 8).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveSlideIndex(idx)}
                            className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              safeIndex === idx
                                ? 'bg-signal text-forest-900 font-extrabold shadow-xs'
                                : 'bg-white/10 text-paper/70 hover:bg-white/20 hover:text-paper'
                            }`}
                            aria-label={`Go to slide ${idx + 1}`}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <h2 className="text-4xl font-extrabold">Catalogue coming soon</h2>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-forest-900 text-paper border-t border-white/10">
        <div className="page-wrap py-8 sm:py-10 grid sm:grid-cols-[1fr_auto] gap-6 sm:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">One free spin a day</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-paper">Store credit for your next order</h2>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-[#e7f2e4]">
              {signedIn
                ? `Wins go straight into your Herbal Harbour wallet${typeof walletBalance === 'number' ? ` (balance R ${walletBalance.toFixed(2)})` : ''} and come off your next online order.`
                : 'Create a free account to play. Every win is deposited into your Herbal Harbour wallet and comes off your next online order.'}
            </p>
          </div>
          {onOpenJackpot && (
            <button onClick={onOpenJackpot} className="cta-signal sm:self-center">
              {signedIn ? 'Spin & Win' : 'Register & Spin'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
