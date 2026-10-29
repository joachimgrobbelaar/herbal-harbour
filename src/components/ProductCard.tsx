import React from 'react';
import { Heart, Scale, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { ProductArtwork } from './ProductArtwork';
import { formatZar } from '../lib/pricing';

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
  onOpenDetails,
}) => {
  const outOfStock = product.stock <= 0;
  return (
    <article className="relative bg-white rounded-[28px] border border-forest-900/5 shadow-[0_10px_40px_rgba(19,42,26,0.04)] p-5 flex flex-col">
      <div className="flex items-start justify-between">
        {outOfStock ? (
          <span className="px-3 py-1 rounded-full bg-forest-900 text-paper text-[11px] font-bold">Out of stock</span>
        ) : product.isSale ? (
          <span className="px-3 py-1 rounded-full bg-forest-700 text-paper text-[11px] font-bold">Sale</span>
        ) : <span />}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onToggleCompare(product)}
            aria-pressed={isCompared}
            aria-label={`Compare ${product.name}`}
            className={`w-9 h-9 rounded-full border grid place-items-center ${isCompared ? 'bg-forest-900 text-paper border-forest-900' : 'border-signal text-forest-700'}`}
          >
            <Scale className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onToggleWishlist(product.id)}
            aria-pressed={isWishlisted}
            aria-label={`Save ${product.name}`}
            className={`w-9 h-9 rounded-full border grid place-items-center ${isWishlisted ? 'bg-signal border-signal text-forest-900' : 'border-signal text-forest-700'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-forest-900' : ''}`} />
          </button>
        </div>
      </div>

      <button onClick={() => onOpenDetails(product)} className="mt-3 h-44 rounded-2xl overflow-hidden" aria-label={`View ${product.name}`}>
        <ProductArtwork category={product.category} name={product.name} imageUrl={product.imageUrl} className="w-full h-full" />
      </button>

      <h3 className="mt-3 text-center text-xl font-extrabold text-forest-900">
        <button onClick={() => onOpenDetails(product)}>{product.name}</button>
      </h3>
      <p className="mt-2 text-center text-[15px] leading-6 text-forest-900/80">
        <span className="font-extrabold">THC</span> {product.thc}<br />
        <span className="font-extrabold">CBD</span> {product.cbd}
      </p>
      <p className={`text-center text-[13px] mt-1 font-semibold ${outOfStock ? 'text-forest-900' : 'text-forest-700'}`}>
        {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
      </p>
      <p className="mt-3 text-center text-2xl font-extrabold text-forest-900 font-mono">
        {product.originalPrice && (
          <span className="mr-2 text-base text-forest-700 line-through">{formatZar(product.originalPrice)}</span>
        )}
        {formatZar(product.price)}
      </p>
      <button
        onClick={() => onAddToCart(product)}
        disabled={outOfStock}
        className="mt-4 mx-auto inline-flex items-center justify-center gap-2 min-h-12 px-7 rounded-full bg-signal text-forest-900 text-sm font-extrabold uppercase tracking-[0.06em] shadow-[0_6px_18px_rgba(150,180,30,0.35)] hover:bg-forest-900 hover:text-signal focus-visible:bg-forest-900 focus-visible:text-signal active:scale-[0.98] transition-colors disabled:opacity-40 disabled:shadow-none disabled:hover:bg-signal disabled:hover:text-forest-900"
      >
        <ShoppingBag className="w-[18px] h-[18px]" />
        {outOfStock ? 'Out of stock' : 'Add to Cart'}
      </button>
    </article>
  );
};
