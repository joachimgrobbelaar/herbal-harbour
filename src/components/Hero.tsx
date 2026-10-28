import React, { useState } from 'react';
import { CheckCircle2, ShoppingCart, ArrowRight, MessageCircle, FileSpreadsheet } from 'lucide-react';
import { HERO_SLIDES } from '../data/products';
import { Product } from '../types';
import { CannabisLeafIcon } from './CannabisLeafIcon';

interface HeroProps {
  onExploreProducts: () => void;
  onSelectProductForDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenGoogleSheet: () => void;
  onOpenJackpot?: () => void;
  allProducts: Product[];
}

export const Hero: React.FC<HeroProps> = ({
  onExploreProducts,
  onSelectProductForDetails,
  onAddToCart,
  onOpenGoogleSheet,
  onOpenJackpot,
  allProducts
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const slide = HERO_SLIDES[activeSlideIndex];
  const currentProduct = allProducts.find((p) => p.id === slide.productId) || allProducts[0];

  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px] lg:min-h-[540px] items-stretch">
          
          {/* LEFT: Headline & Direct Actions */}
          <div className="lg:col-span-5 px-6 sm:px-10 lg:px-12 py-10 lg:py-14 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-emerald-800 text-xs font-bold tracking-wider uppercase mb-3">
              <CannabisLeafIcon className="w-4 h-4 text-[#25a86a]" />
              <span>South African Medical Marijuana & CBD Store</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#112d23] tracking-tight leading-[1.15] mb-4 font-heading">
              {slide.headline}
            </h1>
            
            <p className="text-sm text-slate-600 leading-relaxed mb-6 max-w-lg">
              {slide.subheadline}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onExploreProducts}
                className="px-6 py-3 rounded-full bg-[#e5a83b] hover:bg-[#d49626] text-slate-950 font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onOpenJackpot && (
                <button
                  onClick={onOpenJackpot}
                  className="px-5 py-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                >
                  <span>🎰 Spin & Win (Free)</span>
                </button>
              )}

              <a
                href="https://wa.me/27824591234?text=Hi%20Herbal%20Harbour!%20I'd%20like%20to%20order%20directly%20via%20WhatsApp."
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-full border border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>WhatsApp Order</span>
              </a>

              <button
                onClick={onOpenGoogleSheet}
                className="px-4 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Connect live Google Sheets inventory"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>Link Sheet</span>
              </button>
            </div>
          </div>

          {/* CENTER: Botanical Cannabis Flower Art */}
          <div className="lg:col-span-3 relative flex items-center justify-center p-4 my-auto">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 flex items-center justify-center">
              <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="100" cy="225" rx="55" ry="12" fill="#000000" fillOpacity="0.12" />
                <g transform="translate(100, 110)">
                  <path d="M-45 60 C-60 30, -55 -15, -35 -40 C-25 -65, 0 -95, 10 -95 C20 -95, 45 -65, 55 -40 C75 -15, 70 30, 55 60 C40 80, 0 92, -15 92 C-35 92, -40 80, -45 60 Z" fill="#204a32" />
                  <circle cx="-30" cy="30" r="28" fill="#2d6444" />
                  <circle cx="30" cy="30" r="27" fill="#295d3e" />
                  <circle cx="0" cy="45" r="30" fill="#347650" />
                  <circle cx="-35" cy="-10" r="26" fill="#3c8459" />
                  <circle cx="35" cy="-10" r="25" fill="#367751" />
                  <circle cx="-20" cy="-45" r="24" fill="#469968" />
                  <circle cx="20" cy="-45" r="24" fill="#408d5f" />
                  <circle cx="2" cy="-75" r="20" fill="#50ad76" />
                  <circle cx="0" cy="0" r="32" fill="#3c865a" />
                  <path d="M-25 15 Q-42 -5 -32 -28 Q-12 -18 -10 10 Z" fill="#603064" opacity="0.85" />
                  <path d="M15 22 Q38 2 28 -24 Q10 -12 12 18 Z" fill="#552659" opacity="0.85" />
                  <path d="M-42 20 C-52 5, -48 -20, -35 -35" stroke="#e07718" strokeWidth="3" strokeLinecap="round" />
                  <path d="M38 25 C54 10, 48 -18, 30 -35" stroke="#f08824" strokeWidth="3" strokeLinecap="round" />
                  <path d="M-20 60 C-5 45, 18 52, 38 40" stroke="#d56b0f" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M-25 -15 C-10 -35, 20 -25, 32 -42" stroke="#f59438" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="-22" cy="22" r="2" fill="#ffffff" opacity="0.85" />
                  <circle cx="-8" cy="36" r="1.6" fill="#ffffff" opacity="0.9" />
                  <circle cx="16" cy="30" r="1.8" fill="#ffffff" opacity="0.8" />
                  <circle cx="-28" cy="-8" r="2" fill="#ffffff" opacity="0.85" />
                  <circle cx="18" cy="-16" r="1.8" fill="#ffffff" opacity="0.8" />
                </g>
              </svg>
            </div>
          </div>

          {/* RIGHT: Feature Strain Card (Deep Green #143329) */}
          <div className="lg:col-span-4 bg-[#143329] text-white px-7 sm:px-9 py-10 lg:py-14 flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
                Featured Strain Profile
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-2 font-heading">
                {slide.strainName}
              </h2>
              <p className="text-xs text-emerald-100/80 leading-relaxed mb-5">
                {slide.description}
              </p>

              <ul className="space-y-2.5 mb-6 text-xs sm:text-sm font-semibold">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{slide.strainClass}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{slide.thcRange}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{slide.cbdRange}</span>
                </li>
              </ul>

              <button
                onClick={() => onSelectProductForDetails(currentProduct)}
                className="text-xs font-bold text-white underline decoration-amber-400 underline-offset-4 hover:text-amber-300 transition-colors cursor-pointer"
              >
                View Full Specs & COA Report
              </button>
            </div>

            {/* Bottom: Quick Add & Slide Navigator */}
            <div className="mt-6 pt-5 border-t border-emerald-800/40 flex items-center justify-between">
              <button
                onClick={() => onAddToCart(currentProduct)}
                className="w-11 h-11 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-md transition-transform cursor-pointer"
                title={`Quick add ${slide.strainName}`}
              >
                <ShoppingCart className="w-5 h-5 text-slate-950" />
              </button>

              <div className="flex items-center gap-2 font-mono text-xs">
                {HERO_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`py-1 px-1.5 cursor-pointer ${
                      activeSlideIndex === idx
                        ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.index}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
