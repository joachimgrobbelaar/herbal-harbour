import React, { useState } from 'react';
import { CheckCircle2, ShoppingCart, ArrowRight, MessageCircle, FileSpreadsheet, Box, Sparkles } from 'lucide-react';
import { HERO_SLIDES } from '../data/products';
import { Product } from '../types';
import { CannabisLeafIcon } from './CannabisLeafIcon';
import { ThreeCanvas } from './ThreeCanvas';
import { GlbViewer } from './GlbViewer';

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
  onAddToCart,
  onOpenGoogleSheet,
  onOpenJackpot,
  onOpen3DStudio,
  allProducts
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [is3DMode, setIs3DMode] = useState(true);
  const slide = HERO_SLIDES[activeSlideIndex];
  const currentProduct = allProducts.find((p) => p.id === slide.productId) || allProducts[0];

  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px] lg:min-h-[540px] items-stretch">
          
          {/* LEFT: Headline & Direct Actions */}
          <div className="lg:col-span-5 px-6 sm:px-10 lg:px-12 py-10 lg:py-14 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-pink-600 bg-pink-50 border border-pink-200/80 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase mb-3 w-fit shadow-xs">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
              <CannabisLeafIcon className="w-3.5 h-3.5 text-pink-600 fill-current" />
              <span>Amsterdam Coffeeshop Vibe • SA Medical Dispensary</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#112d23] tracking-tight leading-[1.15] mb-3 font-heading">
              {slide.headline}
            </h1>

            <div className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-3">
              Reconnect with Earth’s Bounty • A Herbal Journey to Healing
            </div>
            
            <p className="text-base sm:text-lg font-semibold text-slate-800 leading-relaxed mb-6 max-w-xl">
              {slide.subheadline}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onExploreProducts}
                className="px-6 py-3.5 rounded-full bg-[#143329] hover:bg-[#1f4c3d] text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
              >
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>

              {onOpenJackpot && (
                <button
                  onClick={onOpenJackpot}
                  className="px-5 py-3 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:scale-105 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,0,85,0.35)] transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>🎰 3D Mechanical Slot</span>
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

          {/* CENTER: Botanical Cannabis Flower Art or Real-Time 3D Animation */}
          <div className="lg:col-span-3 relative flex flex-col items-center justify-center p-4 my-auto">
            
            {/* 2D / 3D Mode Switcher pill */}
            <div className="mb-2 flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/80 text-[11px] font-bold z-10">
              <button
                onClick={() => setIs3DMode(true)}
                className={`px-3 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                  is3DMode
                    ? 'bg-[#143329] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>3D Live</span>
              </button>
              <button
                onClick={() => setIs3DMode(false)}
                className={`px-3 py-0.5 rounded-full transition-all cursor-pointer ${
                  !is3DMode
                    ? 'bg-[#143329] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>2D Art</span>
              </button>
            </div>

            {is3DMode ? (
              <div className="w-full h-80 sm:h-96 lg:h-[420px] relative flex items-center justify-center p-2 overflow-visible">
                <GlbViewer
                  src={currentProduct?.modelUrl || 'assets/models/cannabis_sativa_plant.glb'}
                  className="w-full h-full"
                  enableFloating={true}
                  scaleMultiplier={1.0}
                  cameraDistance={3.8}
                />
              </div>
            ) : (
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
                  </g>
                </svg>
              </div>
            )}

            {onOpen3DStudio && (
              <button
                onClick={onOpen3DStudio}
                className="mt-2 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
              >
                <Box className="w-3.5 h-3.5 text-amber-500" />
                <span>Open Full 3D Model Studio & OBJ Loader →</span>
              </button>
            )}
          </div>

          {/* RIGHT: Feature Strain Card (Deep Green #143329) with Anchored 01-08 Carousel */}
          <div className="lg:col-span-4 bg-[#143329] text-white px-7 sm:px-9 py-10 lg:py-14 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">
                  Featured Strain 3D Carousel
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900 text-amber-300 border border-emerald-700/60 font-bold">
                  {slide.index} / {HERO_SLIDES.length < 10 ? `0${HERO_SLIDES.length}` : HERO_SLIDES.length}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white mt-1 mb-2 font-heading leading-tight">
                {slide.strainName}
              </h2>
              <p className="text-xs text-emerald-100/90 leading-relaxed mb-5">
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

            {/* Bottom: Quick Add & Anchored 01-08 Interactive Carousel Rail */}
            <div className="mt-6 pt-5 border-t border-emerald-800/40">
              <div className="flex items-center justify-between gap-3 mb-3">
                <button
                  onClick={() => onAddToCart(currentProduct)}
                  className="px-4 py-2.5 rounded-full bg-[#1e8755] hover:bg-[#166c43] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  title={`Quick add ${slide.strainName}`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add {slide.index}</span>
                </button>
                <span className="text-[11px] text-emerald-200/70 font-mono">Select 3D Strain:</span>
              </div>

              {/* Anchored Functional 01 through 10 Carousel Buttons */}
              <div className="grid grid-cols-10 gap-1 font-mono text-[11px] sm:text-xs">
                {HERO_SLIDES.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`py-1.5 px-0.5 text-center rounded-lg transition-all cursor-pointer font-bold ${
                      activeSlideIndex === idx
                        ? 'bg-amber-400 text-slate-950 shadow-md scale-105 ring-1 ring-amber-300'
                        : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800 hover:text-white'
                    }`}
                    title={s.strainName}
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
