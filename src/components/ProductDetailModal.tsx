import React, { useState } from 'react';
import { X, Star, Heart, Scale, ShoppingBag, ShieldCheck, Check, Sparkles, FileText, Box, Focus, Award, Microscope, Leaf, Activity, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { ProductArtwork } from './ProductArtwork';
import { ThreeCanvas } from './ThreeCanvas';
import { GlbViewer } from './GlbViewer';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, weight?: string) => void;
  isWishlisted?: boolean;
  isCompared?: boolean;
  onToggleWishlist?: (productId: string) => void;
  onToggleCompare?: (product: Product) => void;
}

export interface ClinicalFocusPoint {
  id: number;
  label: string;
  tag: string;
  xPercent: number;
  yPercent: number;
  headline: string;
  detail: string;
  labMetric: string;
  icon: string;
}

export const CLINICAL_FOCUS_POINTS: ClinicalFocusPoint[] = [
  {
    id: 1,
    label: 'Trichome Glands',
    tag: '🔬 Glandular Heads',
    xPercent: 48,
    yPercent: 30,
    headline: 'Capitate-Stalked Resin Heads',
    detail: 'Dense milky-to-amber resin glands containing the highest concentration of delta-9 cannabinoids and volatile monoterpenes.',
    labMetric: '92% Intact Glands',
    icon: '🔬'
  },
  {
    id: 2,
    label: 'Calyx Density',
    tag: '🌸 Calyx Geometry',
    xPercent: 55,
    yPercent: 45,
    headline: 'Cold-Cured Swollen Calyx Clusters',
    detail: 'Hand-trimmed and cold-cured for 28 days at 58-62% relative humidity to preserve delicate cell walls without chlorophyll harshness.',
    labMetric: '0.62 Water Activity (aw)',
    icon: '🌸'
  },
  {
    id: 3,
    label: 'Copper Pistils',
    tag: '🌿 Stigma Filaments',
    xPercent: 36,
    yPercent: 52,
    headline: 'Amber & Copper Stigmas',
    detail: 'Vibrant stigmas signaling peak physiological ripeness, confirming harvest occurred at maximum terpene synthesis.',
    labMetric: 'Peak Harvest Verified',
    icon: '🌿'
  },
  {
    id: 4,
    label: 'Terpene Fingerprint',
    tag: '🧪 Monoterpenes',
    xPercent: 65,
    yPercent: 36,
    headline: 'Cold-Trap Terpene Bouquet',
    detail: 'Myrcene (sedative body ease), Limonene (cerebral mood uplift), and Beta-Caryophyllene (direct CB2 receptor agonist).',
    labMetric: '3.4% Total Terpenes',
    icon: '🧪'
  },
  {
    id: 5,
    label: 'HPLC Lab COA',
    tag: '🛡️ ISO/IEC 17025',
    xPercent: 28,
    yPercent: 65,
    headline: 'Third-Party Purity Screening',
    detail: 'Complete liquid chromatography assay confirming zero heavy metals, zero pesticides, and zero microbial contaminants.',
    labMetric: '99.8% Clean Assay',
    icon: '🛡️'
  },
  {
    id: 6,
    label: 'Extraction Matrix',
    tag: '💧 Solventless / CO2',
    xPercent: 70,
    yPercent: 62,
    headline: 'Zero-Hydrocarbon Processing',
    detail: 'Whole-plant extracts prepared via subcritical CO2 or mechanical low-temp hydraulic rosin plates with 100% native lipids.',
    labMetric: 'Zero Residual Solvents',
    icon: '💧'
  },
  {
    id: 7,
    label: 'Living Soil Terroir',
    tag: '🌍 Coastal KZN & Karoo',
    xPercent: 22,
    yPercent: 38,
    headline: 'Regenerative Organic Substrate',
    detail: 'Cultivated under abundant South African coastal sunshine in probiotic living soil enriched with worm castings and indigenous kelp.',
    labMetric: 'Bio-Organic Certified',
    icon: '🌍'
  },
  {
    id: 8,
    label: 'Entourage Synergy',
    tag: '⚖️ Cannabinoid Cascade',
    xPercent: 75,
    yPercent: 46,
    headline: 'Full-Spectrum Entourage Ratio',
    detail: 'Minor cannabinoids CBG, CBC, and CBN work synergistically with primary cannabinoids for sustained therapeutic duration.',
    labMetric: '6 Active Cannabinoids',
    icon: '⚖️'
  },
  {
    id: 9,
    label: 'UV Keeper Seal',
    tag: '🔒 Biophotonic Glass',
    xPercent: 45,
    yPercent: 75,
    headline: 'Nitrogen-Flushed UV Glass Keeper',
    detail: 'Violet biophotonic pharmaceutical glass blocks damaging blue and UV light spectra, ensuring 12-month shelf freshness.',
    labMetric: 'Hermetic Tamper Seal',
    icon: '🔒'
  },
  {
    id: 10,
    label: 'Titration Protocol',
    tag: '⏱️ Onset & Dosage',
    xPercent: 50,
    yPercent: 18,
    headline: 'Clinical Microdosing Curve',
    detail: 'Inhalation onset within 3-5 minutes (peak at 30 min); oral ingestible onset within 45-75 minutes (duration 4-8 hours).',
    labMetric: 'Micro-Dose 0.1g / 5mg',
    icon: '⏱️'
  }
];

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  isWishlisted,
  isCompared,
  onToggleWishlist,
  onToggleCompare
}) => {
  const [quantity, setQuantity] = useState(1);
  const [is3DView, setIs3DView] = useState(Boolean(product?.modelUrl));
  const [activeFocusPoint, setActiveFocusPoint] = useState<ClinicalFocusPoint | null>(CLINICAL_FOCUS_POINTS[0]);
  const [showFocusPointsOverlay, setShowFocusPointsOverlay] = useState(true);
  const [selectedWeight, setSelectedWeight] = useState(
    product?.category === 'seeds' ? '5 Seeds' : product?.category === 'tinctures' ? '30ml (1500mg)' : '5 Grams'
  );
  const [addedToast, setAddedToast] = useState(false);

  if (!product) return null;

  const weights = product.category === 'seeds'
    ? ['3 Seeds', '5 Seeds', '10 Seeds']
    : product.category === 'tinctures'
    ? ['15ml (750mg)', '30ml (1500mg)', '50ml (2500mg)']
    : ['5 Grams', '10 Grams', '28 Grams (Ounce)'];

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedWeight);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer shadow-xs"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          
          {/* Left Column: Visual & 10 Focus Points Inspection */}
          <div className="md:col-span-5 bg-gradient-to-b from-[#f8faf8] to-[#edf3ef] p-5 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200/80">
            <div>
              {/* Hotspot Toggle Bar */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Visual Inspection
                </span>
                <button
                  type="button"
                  onClick={() => setShowFocusPointsOverlay(!showFocusPointsOverlay)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold cursor-pointer transition-colors border ${
                    showFocusPointsOverlay
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-white text-slate-500 border-slate-200'
                  }`}
                >
                  10 Focus Hotspots {showFocusPointsOverlay ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Product Visual Container with 10 Numbered Hotspots */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-xs p-2 flex items-center justify-center relative select-none">
                {is3DView ? (
                  product.modelUrl ? (
                    <GlbViewer
                      src={product.modelUrl}
                      className="w-full h-full"
                      scaleMultiplier={1.05}
                      cameraDistance={3.8}
                    />
                  ) : (
                    <ThreeCanvas initialModel="bud" className="w-full h-full" />
                  )
                ) : (
                  <ProductArtwork category={product.category} name={product.name} imageUrl={product.imageUrl} className="w-full h-full" />
                )}

                {/* 10 Interactive Numbered Clinical Hotspot Pins */}
                {showFocusPointsOverlay && (
                  <div className="absolute inset-0 pointer-events-none">
                    {CLINICAL_FOCUS_POINTS.map((fp) => {
                      const isActive = activeFocusPoint?.id === fp.id;
                      return (
                        <button
                          key={fp.id}
                          type="button"
                          onClick={() => setActiveFocusPoint(fp)}
                          style={{ left: `${fp.xPercent}%`, top: `${fp.yPercent}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-black transition-all cursor-pointer ${
                            isActive
                              ? 'bg-amber-400 text-slate-950 scale-125 ring-3 ring-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.8)] z-20'
                              : 'bg-emerald-900/85 text-emerald-200 hover:bg-emerald-700 hover:scale-110 shadow-md ring-1 ring-white/40 z-10'
                          }`}
                          title={`Point ${fp.id}: ${fp.label}`}
                        >
                          {fp.id}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Focus Point Clinical Breakdown Card */}
              {activeFocusPoint && (
                <div className="mt-3 bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-emerald-900/15 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1 font-mono">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center text-[9px] font-black">
                        {activeFocusPoint.id}
                      </span>
                      {activeFocusPoint.tag}
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      {activeFocusPoint.labMetric}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900">
                    {activeFocusPoint.headline}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                    {activeFocusPoint.detail}
                  </p>
                </div>
              )}

              {/* 10 Focus Points Quick Selector Strip */}
              <div className="mt-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
                  <span>10 Interactive Focus Points:</span>
                  <span className="text-emerald-700 font-mono">Click point 01–10 to inspect</span>
                </div>
                <div className="grid grid-cols-5 gap-1 font-mono text-[10px]">
                  {CLINICAL_FOCUS_POINTS.map((fp) => (
                    <button
                      key={fp.id}
                      type="button"
                      onClick={() => setActiveFocusPoint(fp)}
                      className={`py-1 px-0.5 rounded-lg text-center transition-all cursor-pointer font-bold ${
                        activeFocusPoint?.id === fp.id
                          ? 'bg-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-300'
                          : 'bg-white/80 border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
                      }`}
                    >
                      {String(fp.id).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Certificate of Analysis (COA) Summary */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 font-bold text-emerald-900">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                HPLC Certificate: {product.batchNumber}
              </span>
              <span className="font-mono text-slate-500 text-[10px]">Tested: {product.labTestedDate || 'Oct 2026'}</span>
            </div>
          </div>

          {/* Right Column: Full Product Specs & Add to Cart */}
          <div className="md:col-span-7 p-6 sm:p-7 flex flex-col justify-between">
            <div>
              {/* Category & Strain Type */}
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-800">
                <span>{product.categoryLabel}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {product.strainType}
                </span>
                {product.badge && (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Title & Reviews */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-heading mb-1">
                {product.name}
              </h2>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs text-slate-500">
                  {product.rating} ({product.reviewCount} verified reviews)
                </span>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-2xl font-black text-[#112d23] font-mono tabular-nums">
                  R {product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-slate-400 line-through tabular-nums">
                    R {product.originalPrice.toFixed(2)}
                  </span>
                )}
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  In Stock & Ready for Dispatch
                </span>
              </div>

              {/* Cannabinoid Profile Bars */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/60 mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>THC Potency</span>
                  <span className="font-mono text-emerald-800 font-bold">{product.thc}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-full w-4/5 rounded-full" />
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pt-1">
                  <span>CBD Profile</span>
                  <span className="font-mono text-emerald-800 font-bold">{product.cbd}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-teal-600 h-full w-2/5 rounded-full" />
                </div>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                {product.description}
              </p>

              {/* Terpenes & Effects */}
              <div className="mb-4 space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Dominant Terpenes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.terpenes.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="pt-1.5">
                  <span className="text-slate-500 block mb-1">Therapeutic Indications:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.medicalUses.map((m) => (
                      <span key={m} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Packaging / Weight Selector */}
              <div className="mb-5">
                <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                  Select Size / Quantity:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {weights.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setSelectedWeight(w)}
                      className={`py-2 px-2 text-center text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        selectedWeight === w
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Add to Cart Actions */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 border border-slate-200 rounded-full px-3 py-2 bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="text-slate-400 hover:text-slate-800 cursor-pointer font-bold px-1"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="text-slate-400 hover:text-slate-800 cursor-pointer font-bold px-1"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className="flex-1 py-3 px-6 rounded-full bg-[#143329] hover:bg-[#1f4c3d] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Added To Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                      <span>Add to Bag • R {(product.price * quantity).toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Auxiliary Quick Links: Wishlist, Compare & WhatsApp */}
              <div className="flex items-center justify-between pt-1 text-xs">
                {onToggleWishlist && (
                  <button
                    onClick={() => onToggleWishlist(product.id)}
                    className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isWishlisted ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
                    <span>{isWishlisted ? 'Saved' : 'Save to Wishlist'}</span>
                  </button>
                )}

                {onToggleCompare && (
                  <button
                    onClick={() => onToggleCompare(product)}
                    className={`inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isCompared ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>{isCompared ? 'Comparing' : 'Compare Strains'}</span>
                  </button>
                )}

                <a
                  href={`https://wa.me/27824591234?text=Hi%20Herbal%20Harbour!%20I%20have%20a%20clinical%20question%20about%20${encodeURIComponent(product.name)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:underline font-semibold"
                >
                  Ask Pharmacist
                </a>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
