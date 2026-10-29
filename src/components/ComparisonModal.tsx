import React from 'react';
import { X, Scale, Trash2, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { ProductArtwork } from './ProductArtwork';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRemoveProduct: (id: string) => void;
  onAddToCart: (product: Product) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  products,
  onRemoveProduct,
  onAddToCart
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-[#143329] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold font-heading">
              Side-by-Side Strain & Cannabinoid Comparison
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-x-auto">
          {products.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Scale className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h4 className="text-base font-bold text-slate-700 mb-1">No strains added for comparison</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Click the scale icon on any product card in the dispensary catalog to compare THC, CBD, terpenes, and therapeutic effects.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-[#143329] text-white text-xs font-bold uppercase tracking-wider"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse min-w-[500px]">
              <thead>
                <tr>
                  <th className="p-3 bg-slate-50 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-1/4">
                    Attribute
                  </th>
                  {products.map((p) => (
                    <th key={p.id} className="p-3 bg-slate-50 border-b border-slate-200 text-center w-1/4">
                      <div className="relative flex flex-col items-center">
                        <button
                          onClick={() => onRemoveProduct(p.id)}
                          className="absolute -top-1 -right-1 text-slate-400 hover:text-rose-500 p-1"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 p-1 mb-2">
                          <ProductArtwork category={p.category} name={p.name} imageUrl={p.imageUrl} className="w-full h-full" />
                        </div>
                        <span className="font-bold text-slate-900 text-sm font-heading">{p.name}</span>
                        <span className="font-mono font-bold text-emerald-800 text-xs mt-0.5">R {p.price.toFixed(2)}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Category</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 text-center text-slate-800 font-medium">{p.categoryLabel}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Lineage / Type</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        {p.strainType}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">THC Content</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 text-center font-mono font-bold text-slate-900">{p.thc}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">CBD Content</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 text-center font-mono font-bold text-slate-900">{p.cbd}</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Dominant Terpenes</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 text-center text-slate-700">
                      {p.terpenes.join(' • ')}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Stock</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 text-center text-slate-700">
                      {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500 bg-slate-50/50">Action</td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 text-center">
                      <button
                        onClick={() => onAddToCart(p)}
                        className="px-4 py-2 rounded-full bg-[#1e8755] hover:bg-[#166c43] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Add to Cart
                      </button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};
