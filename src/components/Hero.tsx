import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Product } from '../types';
import { StageModel } from './StageModel';

interface HeroProps {
  onExploreProducts: () => void;
  onSelectProductForDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenGoogleSheet: () => void;
  onOpenJackpot?: () => void;
  onOpen3DStudio?: () => void;
  allProducts: Product[];
}

export const Hero: React.FC<HeroProps> = ({
  onExploreProducts,
  onSelectProductForDetails,
  onOpenJackpot,
  allProducts,
}) => {
  const slides = allProducts.filter((product) => product.active !== false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const safeIndex = slides.length ? activeSlideIndex % slides.length : 0;
  const current = slides[safeIndex];

  return (
    <section id="home">
      <div className="grid md:grid-cols-2 md:min-h-[620px] lg:min-h-[680px]">
        <div className="bg-paper flex items-center">
          <div className="hero-copy w-full py-14 sm:py-20 lg:py-24">
            <h1 className="max-w-xl text-[clamp(2.75rem,5vw,4.75rem)] font-extrabold leading-[0.92] text-forest-900">
              Medicinal cannabis and CBD
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-forest-700">
              Herbal Harbour sells online and in store. Prices are in rand. Pay by EFT or when you collect. Courier is R95, free over R750.
            </p>
            <button onClick={onExploreProducts} className="cta-signal mt-8">
              Our Products
            </button>
          </div>
        </div>

        <div className="relative bg-forest-900 text-paper">
          <div className="hero-panel-copy grid grid-cols-1 lg:grid-cols-[minmax(220px,1fr)_minmax(240px,1fr)_auto] gap-4 lg:gap-8 items-center py-10 lg:py-0 lg:min-h-[680px]">
            <div className="order-1 h-72 md:h-80 lg:h-[460px] w-full min-w-0 px-2">
              <StageModel model="bud" src="/models/hero-bud.glb" label="Cannabis bud" className="w-full h-full" />
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
                </>
              ) : (
                <h2 className="text-4xl font-extrabold">Catalogue coming soon</h2>
              )}
            </div>
            {slides.length > 1 && (
              <div className="order-3 flex lg:flex-col gap-3 overflow-x-auto font-mono text-sm lg:pl-4 pb-1 lg:pb-0" aria-label="Products">
                {slides.map((product, index) => (
                  <button
                    key={product.id}
                    onClick={() => setActiveSlideIndex(index)}
                    className={`shrink-0 text-left ${index === safeIndex ? 'text-paper font-bold' : 'text-[#d5e0d2]'}`}
                    aria-current={index === safeIndex}
                    aria-label={product.name}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-forest-900 text-paper border-t border-white/10">
        <div className="page-wrap py-8 sm:py-10 grid sm:grid-cols-[1fr_auto] gap-6 sm:items-center">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-signal">One free spin a day</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-paper">Store credit for your next order</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#e7f2e4]">
              Signed-in customers spin once a day. Credit comes off the next online order and cannot be cashed out.
            </p>
          </div>
          {onOpenJackpot && (
            <button onClick={onOpenJackpot} className="cta-signal sm:self-center">Spin & Win</button>
          )}
        </div>
      </div>
    </section>
  );
};
