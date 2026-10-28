import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Truck, Sparkles, Check } from 'lucide-react';
import { CartItem, Coupon } from '../types';
import { ProductArtwork } from './ProductArtwork';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  activeCoupon: Coupon | null;
  onApplyCouponCode: (code: string) => string | null;
  onRemoveCoupon: () => void;
  onOpenJackpot: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  activeCoupon,
  onApplyCouponCode,
  onRemoveCoupon,
  onOpenJackpot
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  const FREE_SHIPPING_THRESHOLD = 750;
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  let discountAmount = 0;
  if (activeCoupon) {
    if (activeCoupon.code === 'FREESHIP') {
      discountAmount = 0; // handled via free delivery
    } else {
      discountAmount = (subtotal * activeCoupon.discountPercent) / 100;
    }
  }

  const isFreeDelivery = subtotal >= FREE_SHIPPING_THRESHOLD || (activeCoupon && activeCoupon.code === 'FREESHIP');
  const deliveryFee = items.length === 0 ? 0 : isFreeDelivery ? 0 : 95;
  const finalTotal = Math.max(0, subtotal - discountAmount + deliveryFee);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progressPercent = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const handleApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    if (!couponInput.trim()) return;

    const message = onApplyCouponCode(couponInput.trim().toUpperCase());
    if (!message) {
      setCouponInput('');
    } else {
      setCouponError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-200/80 bg-slate-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#143329] text-white flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-heading">
                    Dispensary Cart
                  </h2>
                  <span className="text-xs text-slate-500">
                    {items.length} {items.length === 1 ? 'item' : 'items'} in bag
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Free Shipping Progress bar */}
            <div className="bg-white rounded-xl p-3 border border-slate-200/60 shadow-2xs">
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  {isFreeDelivery ? (
                    <strong className="text-emerald-700 font-bold">You qualify for FREE Discreet Courier!</strong>
                  ) : (
                    <span>Add <strong>R {remainingForFreeShipping.toFixed(2)}</strong> for FREE Courier</span>
                  )}
                </span>
                <span className="text-[11px] font-mono text-slate-500">{progressPercent.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-[#1e8755] h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Explore our laboratory-tested medicinal strains, organic CBD oils, and exotic genetics.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-[#143329] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1a4034] transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-3.5 rounded-2xl border border-slate-100 bg-[#fafbfa] hover:border-slate-200 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0 border border-slate-200/60 p-1">
                    <ProductArtwork category={product.category} name={product.name} className="w-full h-full" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate font-heading">
                        {product.name}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(product.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-500 mb-2">
                      {product.strainType} • THC {product.thc.split('-')[0]}
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg px-2 py-0.5">
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-mono font-bold w-4 text-center">{quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                          disabled={product.stock > 0 && quantity >= product.stock}
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {product.stock > 0 && quantity >= product.stock && (
                        <span className="text-[10px] text-amber-700 font-semibold">Only {product.stock} in stock</span>
                      )}
                      {product.stock <= 0 && (
                        <span className="text-[10px] text-rose-700 font-semibold">Out of stock</span>
                      )}

                      <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono tabular-nums">
                        R {(product.price * quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-slate-50/80">
              
              {/* Promo Code Input / Active Voucher */}
              <div className="mb-4">
                {activeCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <div>
                        <strong className="font-mono">{activeCoupon.code}</strong> applied ({activeCoupon.description})
                      </div>
                    </div>
                    <button
                      onClick={onRemoveCoupon}
                      className="text-xs text-rose-500 hover:text-rose-700 underline font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <form onSubmit={handleApplyCode} className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Enter voucher / code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          className="w-full text-xs uppercase px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600 font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-3 py-2 rounded-xl bg-[#143329] text-white text-xs font-bold hover:bg-[#1c473a] transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                    {couponError && (
                      <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => { onClose(); onOpenJackpot(); }}
                      className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 mt-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      🎰 Play Spin & Win slot machine to win up to R500 Store Credit
                    </button>
                  </div>
                )}
              </div>

              {/* Price Calculation breakdown */}
              <div className="space-y-1.5 text-xs text-slate-600 mb-4 pb-4 border-b border-slate-200/80">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums text-slate-900">R {subtotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount ({activeCoupon?.code})</span>
                    <span className="font-mono tabular-nums">- R {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Nationwide Discreet Courier</span>
                  <span className="font-mono tabular-nums">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase text-[10px]">FREE</span>
                    ) : (
                      `R ${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-[#112d23] pt-2 border-t border-slate-200">
                  <span>Estimated Total</span>
                  <span className="font-mono tabular-nums text-base">R {finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Primary Checkout Button & WhatsApp Order */}
              <div className="space-y-2">
                <button
                  onClick={onProceedToCheckout}
                  className="w-full py-3 px-6 rounded-full bg-[#1e8755] hover:bg-[#176d44] active:scale-98 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Proceed to Encrypted Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href={`https://wa.me/27824591234?text=${encodeURIComponent(
                    `Hi Herbal Harbour! I'd like to order my cart items:\n` +
                    items.map((i) => `• ${i.quantity}x ${i.product.name} (R ${(i.product.price * i.quantity).toFixed(2)})`).join('\n') +
                    `\nTotal: R ${finalTotal.toFixed(2)}\nPlease confirm payment & discreet courier dispatch.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-full border border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                >
                  <span>💬 Instant Order Cart on WhatsApp</span>
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
