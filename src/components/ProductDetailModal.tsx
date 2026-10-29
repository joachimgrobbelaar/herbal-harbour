import React, { Suspense, lazy, useState } from 'react';
import { X, Star, Heart, Scale, ShoppingBag, ShieldCheck, Check, Sparkles, FileText, Box } from 'lucide-react';
import { Product } from '../types';
import { ProductArtwork } from './ProductArtwork';
import { canUseWebGL } from '../lib/display';
import type { ModelType } from './ThreeCanvas';

function resolveProduct3DModel(product: Product): { model: ModelType; urls: string[] } {
  const name = product.name.toLowerCase();
  const cat = product.category.toLowerCase();

  // 1. Mushrooms & Fungi
  if (name.includes('mushroom') || name.includes('shroom') || name.includes('fungi') || name.includes('reishi') || name.includes('lion')) {
    return { model: 'mushroom', urls: ['/models/mushroom.glb', '/models/mushrooms.glb'] };
  }
  // 2. Pre-rolls & Cones
  if (name.includes('pre-roll') || name.includes('preroll') || name.includes('joint') || name.includes('cone')) {
    return { model: 'joint', urls: ['/models/joint.glb', '/models/preroll.glb'] };
  }
  // 3. Edibles -> Brownie
  if (cat === 'edibles' || name.includes('brownie') || name.includes('gumm') || name.includes('edible') || name.includes('honey')) {
    return { model: 'brownie', urls: ['/models/brownie.glb', '/models/brownie_01.glb', '/models/edible.glb'] };
  }
  // 4. Concentrates
  if (cat === 'concentrates' || name.includes('rosin') || name.includes('wax') || name.includes('shatter') || name.includes('extract')) {
    return { model: 'concentrate', urls: ['/models/concentrates.glb', '/models/vape_pen.glb'] };
  }
  // 5. Tinctures & Topicals
  if (cat === 'tinctures' || cat === 'topicals' || name.includes('balm') || name.includes('salve') || name.includes('oil')) {
    return { model: 'bottle', urls: ['/models/bottle.glb'] };
  }
  // 6. Seeds
  if (cat === 'seeds' || name.includes('seed')) {
    return { model: 'seed', urls: ['/models/seed.glb'] };
  }
  // 7. Craft Flower
  if (name.includes('granddaddy') || name.includes('purple')) {
    return { model: 'bud', urls: ['/models/bud.glb', '/models/weed_nug_1.glb'] };
  }
  return { model: 'bud', urls: ['/models/weed_nug_1.glb', '/models/hero-bud.glb'] };
}

const ThreeCanvas = lazy(() => import('./ThreeCanvas').then((mod) => ({ default: mod.ThreeCanvas })));

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
  const [addedToast, setAddedToast] = useState(false);

  if (!product) return null;

  const maxQty = Math.max(product.stock, 0);
  const outOfStock = maxQty <= 0;

  const handleAdd = () => {
    if (outOfStock) return;
    onAddToCart(product, Math.min(quantity, maxQty));
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
              {canUseWebGL() && <div className="flex items-center gap-1 bg-white p-0.5 rounded-full border border-slate-200 text-[10px] font-bold">
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
              </div>}
            </div>

            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-xs p-2 flex items-center justify-center relative">
              {is3DView && canUseWebGL() ? (
                <Suspense fallback={<ProductArtwork category={product.category} name={product.name} imageUrl={product.imageUrl} className="w-full h-full" />}>
                  {(() => {
                    const modelCfg = resolveProduct3DModel(product);
                    return (
                      <ThreeCanvas
                        key={`${product.id}-${modelCfg.model}`}
                        initialModel={modelCfg.model}
                        modelUrls={[`/models/${product.id}.glb`, ...modelCfg.urls]}
                        className="w-full h-full"
                        autoRotate={true}
                        allowUpload={false}
                      />
                    );
                  })()}
                </Suspense>
              ) : (
                <ProductArtwork category={product.category} name={product.name} imageUrl={product.imageUrl} className="w-full h-full" />
              )}
            </div>

            <p className="mt-4 text-xs text-slate-600">
              {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
            </p>
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
              <p className="text-sm text-slate-600 mb-4">{product.subtitle}</p>

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
                  {outOfStock ? 'Out of stock' : 'In stock'}
                </span>
              </div>

              {/* Cannabinoid Profile Bars */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 mb-5 space-y-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center justify-between">
                  <span>THC</span>
                  <span className="font-mono text-emerald-800 font-bold">{product.thc}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>CBD</span>
                  <span className="font-mono text-emerald-800 font-bold">{product.cbd}</span>
                </div>
              </div>

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
                    onClick={() => setQuantity(Math.min(maxQty || 1, quantity + 1))}
                    disabled={outOfStock || quantity >= maxQty}
                    className="text-slate-400 hover:text-slate-800 cursor-pointer font-bold px-1 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  disabled={outOfStock}
                  className="flex-1 py-3.5 px-6 rounded-full bg-[#1e8755] hover:bg-[#166c43] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Added To Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{outOfStock ? 'Out of stock' : `Add to Bag • R ${(product.price * quantity).toFixed(2)}`}</span>
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

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
