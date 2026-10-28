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
    <section id="home" className="relative bg-paper overflow-hidden">
      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 min-h-[620px]">
        <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-14 lg:py-20 flex flex-col justify-center">
          <div className="pointer-events-none absolute bottom-6 right-6 hidden lg:block w-40 h-56" aria-hidden="true">
            <StageModel model="leaf" label="Cannabis leaf" className="w-full h-full" />
          </div>
          <h1 className="text-[clamp(2.6rem,5vw,4.4rem)] font-extrabold leading-[0.95] text-forest-900 max-w-xl">
            Medicinal cannabis and CBD
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-forest-700">
            Herbal Harbour sells online and in store. Prices are in rand. Pay by EFT or when you collect. Courier is R95, free over R750.
          </p>
          <button onClick={onExploreProducts} className="cta-signal mt-8 self-start">
            Our Products
          </button>
        </div>

        <div className="relative bg-forest-900 text-paper px-8 sm:px-12 py-16 lg:py-20 flex flex-col justify-center min-h-[420px]">
          {current && (
            <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[42%] h-[78%] z-10">
              <StageModel model="bud" label="Cannabis bud" className="w-full h-full" />
            </div>
          )}
          <div className="relative z-20 lg:pl-24 max-w-md lg:ml-auto">
            {current ? (
              <>
                <h2 className="text-4xl sm:text-5xl font-extrabold leading-none">{current.name}</h2>
                <p className="mt-4 text-sm leading-relaxed text-leaf-300 max-w-xs">{current.subtitle}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-signal" /> {current.strainType}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-signal" /> THC {current.thc}</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-signal" /> CBD {current.cbd}</li>
                </ul>
                <button
                  onClick={() => onSelectProductForDetails(current)}
                  className="mt-8 text-sm font-bold underline decoration-signal decoration-2 underline-offset-8"
                >
                  About this product
                </button>
              </>
            ) : (
              <h2 className="text-4xl font-extrabold">Catalogue coming soon</h2>
            )}
          </div>
          {slides.length > 1 && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-3 text-sm font-mono" aria-label="Products">
              {slides.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => setActiveSlideIndex(index)}
                  className={index === safeIndex ? 'text-paper font-bold' : 'text-muted'}
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
      <div className="border-t border-forest-900/10 bg-forest-900 text-paper">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-signal">One free spin a day</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold">Spin & Win store credit</h2>
            <p className="mt-2 max-w-xl text-sm text-leaf-300">
              Signed-in customers get one free spin a day. Credit comes off the next online order. It cannot be cashed out.
            </p>
          </div>
          {onOpenJackpot && (
            <button onClick={onOpenJackpot} className="cta-signal shrink-0">Spin & Win</button>
          )}
        </div>
      </div>
    </section>
  );
};
