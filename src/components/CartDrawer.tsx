import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Truck } from 'lucide-react';
import { CartItem, Coupon } from '../types';
import { ProductArtwork } from './ProductArtwork';
import { applyStoreCredit, formatZar, quoteCart } from '../lib/pricing';

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
  storeCredit: number | null;
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
  onOpenJackpot,
  storeCredit,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isOpen) return null;

  const FREE_SHIPPING_THRESHOLD = 750;
  const quote = quoteCart(items, activeCoupon);
  const credit = applyStoreCredit(quote.total, storeCredit);
  const subtotal = quote.subtotal;
  const discountAmount = quote.discount;
  const deliveryFee = quote.shipping;
  const isFreeDelivery = quote.deliveryFeeWaived && items.length > 0;
  const finalTotal = credit.total;
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

      <div className="absolute inset-0 flex justify-end items-end p-3 sm:p-5" onClick={onClose}>
        <div className="w-full max-w-md max-h-full overflow-y-auto bg-white shadow-2xl rounded-3xl flex flex-col" onClick={(event) => event.stopPropagation()}>
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-forest-900/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#143329] text-white flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-heading">
                    Cart
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
                    <strong className="text-forest-900 font-bold">Courier is free on this order.</strong>
                  ) : (
                    <span>Add <strong>R {remainingForFreeShipping.toFixed(2)}</strong> for free courier</span>
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
          <div className="p-5 space-y-3 bg-paper">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-6">
                  Add a product to check out. Courier is R95, free over R750.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-[#143329] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1a4034] transition-colors"
                >
                  Start Shopping
                </button>
                <button
                  onClick={() => { onClose(); onOpenJackpot(); }}
                  className="mt-4 text-xs font-bold text-forest-700 underline underline-offset-4"
                >
                  Spin & Win — one free spin a day
                </button>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-3.5 rounded-2xl border border-slate-100 bg-[#fafbfa] hover:border-slate-200 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                    <ProductArtwork category={product.category} name={product.name} imageUrl={product.imageUrl} className="w-full h-full" />
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
            <div className="p-5 border-t border-forest-900/10 bg-white">
              
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
                {credit.creditApplied > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Store credit</span>
                    <span className="font-mono tabular-nums">- {formatZar(credit.creditApplied)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Courier</span>
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
                  <span className="font-mono tabular-nums text-base">{formatZar(finalTotal)}</span>
                </div>
                {storeCredit !== null && (
                  <p className="text-[11px] text-slate-500 pt-1">
                    Unused store credit {formatZar(storeCredit)}. It comes off the next online order and cannot be cashed out.
                  </p>
                )}
              </div>

              {/* Primary Checkout Button & WhatsApp Order */}
              <div className="space-y-2">
                <button
                  onClick={onProceedToCheckout}
                  className="w-full py-3 px-6 rounded-full bg-[#1e8755] hover:bg-[#176d44] active:scale-98 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { onClose(); onOpenJackpot(); }}
                  className="w-full text-xs font-bold text-forest-700 underline underline-offset-4"
                >
                  Spin & Win — one free spin a day
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
