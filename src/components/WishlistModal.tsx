import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { ProductArtwork } from './ProductArtwork';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistIds: string[];
  allProducts: Product[];
  onRemoveFromWishlist: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlistIds,
  allProducts,
  onRemoveFromWishlist,
  onAddToCart,
  onOpenDetails
}) => {
  if (!isOpen) return null;

  const wishlistedProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-[#143329] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 fill-amber-400 text-amber-400" />
            <h3 className="text-base font-bold font-heading">
              Saved Strains & Favorites ({wishlistedProducts.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {wishlistedProducts.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Heart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No saved favorites yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Tap the heart icon on any craft flower or tincture to save for later.
              </p>
            </div>
          ) : (
            wishlistedProducts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 p-3.5 rounded-2xl border border-slate-100 bg-[#fbfbf9] hover:border-slate-200 transition-colors"
              >
                <div
                  onClick={() => { onClose(); onOpenDetails(p); }}
                  className="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200/60 p-1 cursor-pointer"
                >
                  <ProductArtwork category={p.category} name={p.name} className="w-full h-full" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4
                    onClick={() => { onClose(); onOpenDetails(p); }}
                    className="text-xs sm:text-sm font-bold text-slate-900 truncate font-heading cursor-pointer hover:text-emerald-700"
                  >
                    {p.name}
                  </h4>
                  <div className="text-[11px] text-slate-500">
                    {p.strainType} • THC {p.thc.split('-')[0]}
                  </div>
                  <div className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                    R {p.price.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddToCart(p)}
                    className="px-3 py-1.5 rounded-full bg-[#1e8755] hover:bg-[#166c43] text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                  <button
                    onClick={() => onRemoveFromWishlist(p.id)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {wishlistedProducts.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-500">Discreet nationwide courier</span>
            <button
              onClick={() => {
                wishlistedProducts.forEach((p) => onAddToCart(p));
                onClose();
              }}
              className="px-4 py-2 rounded-full bg-[#143329] text-white font-bold hover:bg-[#1c473a] transition-colors cursor-pointer"
            >
              Add All To Cart
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
