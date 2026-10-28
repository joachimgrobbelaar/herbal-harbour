import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Product } from '../types';
import { StageModel } from './StageModel';
import { LeafField } from './LeafField';
import type { ModelType } from './ThreeCanvas';

interface HeroProps {
  onExploreProducts: () => void;
  onSelectProductForDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenGoogleSheet: () => void;
  onOpenJackpot?: () => void;
  onOpen3DStudio?: () => void;
  allProducts: Product[];
}

function modelFor(product?: Product): ModelType {
  if (!product) return 'bud';
  if (product.category === 'seeds') return 'seed';
  if (product.category === 'tinctures' || product.category === 'topicals') return 'bottle';
  if (product.category === 'edibles') return 'leaf';
  return 'bud';
}

export const Hero: React.FC<HeroProps> = ({
  onExploreProducts,
  onSelectProductForDetails,
  allProducts,
}) => {
  const slides = allProducts.filter((product) => product.active !== false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const safeIndex = slides.length ? activeSlideIndex % slides.length : 0;
  const current = slides[safeIndex];

  return (
    <section id="home" className="relative bg-paper overflow-hidden">
      <LeafField className="pointer-events-none absolute inset-y-0 left-0 w-1/2 h-full opacity-70" />
      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 min-h-[620px]">
        <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-14 lg:py-20 flex flex-col justify-center">
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
              <StageModel model={modelFor(current)} label={current.name} className="w-full h-full" />
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
    </section>
  );
};
