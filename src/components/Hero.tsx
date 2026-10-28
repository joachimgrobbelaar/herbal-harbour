import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { HERO_SLIDES } from '../data/products';
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
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const slide = HERO_SLIDES[activeSlideIndex];
  const currentProduct = allProducts.find((product) => product.id === slide.productId) || allProducts[0];

  return (
    <section id="home" className="relative bg-paper overflow-hidden">
      <LeafField className="pointer-events-none absolute inset-y-0 left-0 w-1/2 h-full opacity-70" />
      <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 min-h-[620px]">
        <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-14 lg:py-20 flex flex-col justify-center">
          <h1 className="text-[clamp(2.6rem,5vw,4.4rem)] font-extrabold leading-[0.95] text-forest-900 max-w-xl">
            {slide.headline}
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-forest-700">
            {slide.subheadline}
          </p>
          <button onClick={onExploreProducts} className="cta-signal mt-8 self-start">
            Our Products
          </button>
        </div>

        <div className="relative bg-forest-900 text-paper px-8 sm:px-12 py-16 lg:py-20 flex flex-col justify-center min-h-[420px]">
          <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-[42%] h-[78%] z-10">
            {currentProduct && (
              <StageModel model={modelFor(currentProduct)} label={currentProduct.name} className="w-full h-full" />
            )}
          </div>
          <div className="relative z-20 lg:pl-24 max-w-md lg:ml-auto">
            <h2 className="text-4xl sm:text-5xl font-extrabold leading-none">{slide.strainName}</h2>
            <p className="mt-4 text-sm leading-relaxed text-leaf-300 max-w-xs">{slide.description}</p>
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-signal" /> {slide.strainClass}</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-signal" /> {slide.thcRange}</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-signal" /> {slide.cbdRange}</li>
            </ul>
            {currentProduct && (
              <button
                onClick={() => onSelectProductForDetails(currentProduct)}
                className="mt-8 text-sm font-bold underline decoration-signal decoration-2 underline-offset-8"
              >
                About Product
              </button>
            )}
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden sm:flex flex-col gap-3 text-sm font-mono" aria-label="Slides">
            {HERO_SLIDES.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setActiveSlideIndex(index)}
                className={index === activeSlideIndex ? 'text-paper font-bold' : 'text-muted'}
                aria-current={index === activeSlideIndex}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
