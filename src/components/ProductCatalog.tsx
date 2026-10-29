import React, { useState, useMemo } from 'react';
import { Sparkles, SlidersHorizontal, Tag, Gift } from 'lucide-react';
import { Product, ProductCategory, StrainType } from '../types';
import { ProductCard } from './ProductCard';
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
    <section id="catalog-section" className="py-14 sm:py-20 bg-[#fbfbf9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        
        {/* Section Title Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold tracking-widest text-emerald-700 uppercase mb-2 block">
            Apothecary Collection
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#112d23] tracking-tight font-heading mb-3">
            Featured Medicinal Strains & Extracts
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Organically cultivated, laboratory-verified genetics, premium seeds, and full-spectrum CBD oils formulated for clinical efficacy.
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
              {['all', 'Sativa', 'Indica', 'Hybrid', 'CBD-Rich'].map((type) => (
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

        {/* Mid-Catalog Promotional Callout Banner (Spin & Win Slot Machine) */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#143329] via-[#1a4437] to-[#143329] text-white border border-emerald-700/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md text-2xl font-black">
              🎰
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-amber-300 tracking-wider block">
                Dispensary Patient Casino • 3 Free Spins
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-heading mt-0.5">
                Spin & Win — Up to R500 Wallet Credit!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-1">
                Win instant ZAR store credit credited to your patient wallet: 🍒 R20, 🍏 R30, 🍊 R50, 🔔 R100, or ⭐ R500 Jackpot!
              </p>
            </div>
          </div>

          <button
            onClick={onOpenJackpot}
            className="px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-350 hover:to-amber-450 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>🎰 Play Spin & Win Now</span>
          </button>
        </div>

      </div>
    </section>
  );
};
