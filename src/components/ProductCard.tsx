import React from 'react';
import { Star, Heart, Scale, ShoppingBag } from 'lucide-react';
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

      <button onClick={() => onOpenDetails(product)} className="h-40 my-2" aria-label={`View ${product.name}`}>
        <ProductArtwork category={product.category} name={product.name} className="w-full h-full" />
      </button>

      <div className="flex justify-center gap-0.5" aria-label={`Rated ${product.rating} out of 5`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`w-3.5 h-3.5 ${star <= Math.round(product.rating) ? 'fill-signal text-forest-700' : 'text-muted'}`} />
        ))}
      </div>
      <h3 className="mt-3 text-center text-xl font-extrabold text-forest-900">
        <button onClick={() => onOpenDetails(product)}>{product.name}</button>
      </h3>
      <p className="mt-2 text-center text-[13px] leading-5 text-forest-700">
        <span className="font-extrabold">THC</span> {product.thc}<br />
        <span className="font-extrabold">CBD</span> {product.cbd}
      </p>
      <p className={`text-center text-[11px] mt-1 font-semibold ${outOfStock ? 'text-forest-900' : 'text-forest-700'}`}>
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
        className="mt-4 mx-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-forest-700 text-forest-900 text-sm font-bold hover:bg-signal hover:border-signal disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ShoppingBag className="w-4 h-4" />
        {outOfStock ? 'Out of stock' : 'Add to Cart'}
      </button>
    </article>
  );
};
