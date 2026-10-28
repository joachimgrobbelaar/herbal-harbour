import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, Tag } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { StageModel } from './StageModel';
import { CATEGORIES_LIST } from '../data/products';

interface ProductCatalogProps {
  products: Product[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  wishlist: string[];
  comparedProducts: Product[];
  onToggleWishlist: (id: string) => void;
  onToggleCompare: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onOpenDetails: (product: Product) => void;
  onOpenJackpot: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  wishlist,
  comparedProducts,
  onToggleWishlist,
  onToggleCompare,
  onAddToCart,
  onOpenDetails,
  onOpenJackpot
}) => {
  const [selectedStrainType, setSelectedStrainType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'thc'>('featured');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Strain Type filter
      if (selectedStrainType !== 'all' && p.strainType !== selectedStrainType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCategory = p.categoryLabel.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesEffect = p.effects.some((e) => e.toLowerCase().includes(q));
        const matchesTerpenes = p.terpenes.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesCategory && !matchesDesc && !matchesEffect && !matchesTerpenes) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'thc') {
        const thcA = parseFloat(a.thc) || 0;
        const thcB = parseFloat(b.thc) || 0;
        return thcB - thcA;
      }
      return 0; // featured default
    });
  }, [products, selectedCategory, selectedStrainType, searchQuery, sortBy]);

  return (
    <section id="catalog-section" className="py-14 sm:py-20 bg-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Title Header */}
        <div className="relative text-center max-w-2xl mx-auto mb-10">
          <div className="pointer-events-none absolute -left-16 top-0 hidden xl:block w-28 h-36" aria-hidden="true">
            <StageModel model="seed" label="Seed" className="w-full h-full" />
          </div>
          <h2 className="text-[clamp(1.75rem,1.4rem+1.6vw,3rem)] font-extrabold text-forest-900 mb-3">
            Products
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Prices are in rand. Pay by EFT or on collection. Courier is R95, free over R750.
          </p>
        </div>

        {/* Filter Bar Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs mb-8 space-y-4">
          
          {/* Top Row: Categories Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES_LIST.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    active
                      ? 'bg-[#143329] text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Bottom Row: Strain Type & Sort By */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
            {/* Strain type filters */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Lineage:
              </span>
              {['all', 'Sativa', 'Indica', 'CBD-Rich'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedStrainType(type)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    selectedStrainType === type
                      ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                  }`}
                >
                  {type === 'all' ? 'All Types' : type}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-800 font-medium outline-none cursor-pointer"
              >
                <option value="featured">Featured Strains</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="thc">Highest THC Potency</option>
              </select>
            </div>
          </div>

        </div>

        {/* Product Grid (Matching Screenshot 2: 3 Columns Desktop) */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
            <Tag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h3 className="text-base font-bold text-slate-800">No matching products found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
              Try adjusting your category or lineage filter to view available dispensary products.
            </p>
            <button
              onClick={() => { onSelectCategory('all'); setSelectedStrainType('all'); }}
              className="px-5 py-2 rounded-full bg-[#143329] text-white text-xs font-bold"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlist.includes(product.id)}
                isCompared={comparedProducts.some((p) => p.id === product.id)}
                onToggleWishlist={onToggleWishlist}
                onToggleCompare={onToggleCompare}
                onAddToCart={onAddToCart}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        )}

        </div>
    </section>
  );
};
