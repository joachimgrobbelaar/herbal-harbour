import React, { useState } from 'react';
import { X, Star, Heart, Scale, ShoppingBag, ShieldCheck, Check, Sparkles, FileText, Box } from 'lucide-react';
import { Product } from '../types';
import { ProductArtwork } from './ProductArtwork';
import { ThreeCanvas } from './ThreeCanvas';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, weight?: string) => void;
  isWishlisted: boolean;
  isCompared: boolean;
  onToggleWishlist: (id: string) => void;
  onToggleCompare: (product: Product) => void;
}

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
  const [is3DView, setIs3DView] = useState(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          
          {/* Left Column: Visual & Lab Card */}
          <div className="md:col-span-5 bg-gradient-to-b from-[#f8faf8] to-[#edf3ef] p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200/80">
            
            {/* 2D / 3D Toggle */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Visual Inspection
              </span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-slate-200 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setIs3DView(false)}
                  className={`px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                    !is3DView ? 'bg-[#143329] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2D
                </button>
                <button
                  type="button"
                  onClick={() => setIs3DView(true)}
                  className={`px-2.5 py-0.5 rounded-full cursor-pointer transition-colors flex items-center gap-1 ${
                    is3DView ? 'bg-[#143329] text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Box className="w-3 h-3 text-amber-400" />
                  <span>3D</span>
                </button>
              </div>
            </div>

            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-xs p-2 flex items-center justify-center relative">
              {is3DView ? (
                <ThreeCanvas
                  initialModel={
                    product.category === 'tinctures'
                      ? 'bottle'
                      : product.category === 'seeds'
                      ? 'seed'
                      : 'bud'
                  }
                  className="w-full h-full"
                  autoRotate={true}
                  allowUpload={true}
                />
              ) : (
                <ProductArtwork category={product.category} name={product.name} className="w-full h-full" />
              )}
            </div>

            {/* Certificate of Analysis (COA) Box */}
            <div className="mt-6 bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-emerald-900/10 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  COA Certificate
                </span>
                <span className="text-[10px] font-mono text-slate-500">{product.batchNumber}</span>
              </div>
              <div className="text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Tested By:</span>
                  <strong className="text-slate-800">Cape Bio-Analytics</strong>
                </div>
                <div className="flex justify-between">
                  <span>Purity Screening:</span>
                  <strong className="text-emerald-700">99.8% Clean</strong>
                </div>
                <div className="flex justify-between">
                  <span>Heavy Metals:</span>
                  <strong className="text-emerald-700">None Detected</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Full Product Specs & Add to Cart */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Category & Strain Type */}
              <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-800">
                <span>{product.categoryLabel}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {product.strainType}
                </span>
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
              <div className="flex items-baseline gap-3 mb-5">
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
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 mb-5 space-y-2">
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
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                {product.description}
              </p>

              {/* Terpenes & Effects */}
              <div className="mb-5 space-y-2 text-xs">
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
                <div className="pt-2">
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
              <div className="mb-6">
                <span className="text-xs font-semibold text-slate-700 block mb-2">
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

            {/* Add to Cart Actions & Direct WhatsApp */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
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
                  className="flex-1 py-3.5 px-6 rounded-full bg-[#1e8755] hover:bg-[#166c43] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Added To Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Bag • R {(product.price * quantity).toFixed(2)}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className={`p-3 rounded-full border transition-colors cursor-pointer ${
                    isWishlisted ? 'border-rose-300 bg-rose-50 text-rose-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  title="Wishlist"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              {/* Direct WhatsApp Order Link */}
              <a
                href={`https://wa.me/27824591234?text=${encodeURIComponent(
                  `Hi Herbal Harbour! I'd like to order: ${quantity}x ${product.name} (${selectedWeight}) at R ${(product.price * quantity).toFixed(2)} from herbalharbour.co.za`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-full border border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>💬 Quick Order {quantity}x on WhatsApp (+27 82 459 1234)</span>
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
