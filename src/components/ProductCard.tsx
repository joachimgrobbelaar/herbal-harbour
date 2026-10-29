import React from 'react';
import { Star, Heart, Scale, MessageCircle, ShoppingBag, Box } from 'lucide-react';
import { Product } from '../types';
import { ProductArtwork } from './ProductArtwork';
import { GlbViewer } from './GlbViewer';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  isCompared: boolean;
  onToggleWishlist: (id: string) => void;
  onToggleCompare: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  isCompared,
  onToggleWishlist,
  onToggleCompare,
  onAddToCart,
  onOpenDetails
}) => {
  const whatsappUrl = `https://wa.me/27824591234?text=${encodeURIComponent(
    `Hi Herbal Harbour! I'd like to order: ${product.name} (R ${product.price.toFixed(2)}) from herbalharbour.co.za`
  )}`;

  return (
    <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      
      {/* Top Header: Badge & Actions */}
      <div className="flex items-center justify-between mb-2">
        <div>
          {product.isSale ? (
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1e8755] text-white">
              Sale
            </span>
          ) : product.badge ? (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
              {product.badge}
            </span>
          ) : (
            <span />
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Comparison Scale */}
          <button
            onClick={() => onToggleCompare(product)}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
              isCompared
                ? 'bg-[#143329] text-white border-[#143329]'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Compare Specs"
          >
            <Scale className="w-3.5 h-3.5" />
          </button>

          {/* Wishlist */}
          <button
            onClick={() => onToggleWishlist(product.id)}
            className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
              isWishlisted
                ? 'bg-rose-50 text-rose-500 border-rose-300'
                : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title="Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Image / 3D Model Canvas with Generous Border Clearance */}
      <div
        onClick={() => onOpenDetails(product)}
        className="w-full h-52 sm:h-56 rounded-2xl cursor-pointer my-2 flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100/60 relative group-hover:scale-[1.02] transition-transform duration-200 border border-slate-200/80 p-2 shadow-inner overflow-hidden"
      >
        {product.modelUrl ? (
          <GlbViewer
            src={product.modelUrl}
            className="w-full h-full"
            enableControls={false}
            enableFloating={true}
            scaleMultiplier={0.88}
            cameraDistance={3.8}
          />
        ) : (
          <ProductArtwork category={product.category} name={product.name} imageUrl={product.imageUrl} className="w-full h-full" />
        )}
      </div>

      {/* Ratings */}
      <div className="flex items-center justify-center gap-1 my-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= Math.floor(product.rating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-100 text-slate-300'
            }`}
          />
        ))}
        <span className="text-[10px] text-slate-400 ml-1">({product.reviewCount})</span>
      </div>

      {/* Title & Category */}
      <div className="text-center mb-2.5">
        <h3
          onClick={() => onOpenDetails(product)}
          className="text-base font-bold text-slate-900 group-hover:text-[#1e8755] transition-colors cursor-pointer font-heading leading-snug"
        >
          {product.name}
        </h3>
        <p className="text-[11px] text-slate-500 truncate mt-0.5">
          {product.subtitle}
        </p>
      </div>

      {/* Cannabinoid Specs Bar */}
      <div className="bg-[#f7f9f7] rounded-lg py-1.5 px-3 mb-3 text-center border border-slate-100 text-[11px]">
        <span className="font-semibold text-slate-700">THC: {product.thc}</span>
        <span className="text-slate-300 mx-2">|</span>
        <span className="font-semibold text-slate-700">CBD: {product.cbd}</span>
      </div>

      {/* Price */}
      <div className="text-center mb-3">
        <div className="flex items-center justify-center gap-2">
          {product.originalPrice && (
            <span className="text-xs text-slate-400 line-through tabular-nums">
              R {product.originalPrice.toFixed(2)}
            </span>
          )}
          <span className="text-lg font-black text-[#112d23] tabular-nums font-mono">
            R {product.price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Action Buttons: Solid High-Contrast Add to Cart & Direct WhatsApp Order */}
      <div className="space-y-2">
        <button
          onClick={() => onAddToCart(product)}
          className="w-full py-2.5 px-3 rounded-xl bg-[#143329] hover:bg-[#1f4c3d] text-white font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-md"
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span>Add to Cart</span>
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 rounded-xl border border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors text-center cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
          <span>Order via WhatsApp</span>
        </a>
      </div>

    </div>
  );
};
