import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, Truck, CreditCard, Banknote, Building2, Download, ArrowLeft } from 'lucide-react';
import { CartItem, Coupon, OrderDetails } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  activeCoupon: Coupon | null;
  onOrderSuccess: (order: OrderDetails) => void;
  userWalletBalance?: number;
  onOpenWallet?: () => void;
}

const SA_PROVINCES = [
  'Western Cape',
  'Gauteng',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape'
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  activeCoupon,
  onOrderSuccess,
  userWalletBalance = 250,
  onOpenWallet
}) => {
  const [formData, setFormData] = useState({
    name: 'Marnu Grobbelaar',
    email: 'joachimgrobbelaar@gmail.com',
    phone: '+27 82 459 1234',
    address: '14 Harbour View Close, Waterfront',
    city: 'Cape Town',
    postalCode: '8001',
    province: 'Western Cape',
    deliveryMethod: 'doorstep',
    paymentMethod: 'instant-eft',
    orderNotes: 'Please ring intercom or leave with front security if unavailable.'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderDetails | null>(null);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  let discountAmount = 0;
  if (activeCoupon) {
    if (activeCoupon.code === 'FREESHIP') {
      discountAmount = 0;
    } else {
      discountAmount = (subtotal * activeCoupon.discountPercent) / 100;
    }
  }

  const isFreeDelivery = subtotal >= 750 || (activeCoupon && activeCoupon.code === 'FREESHIP');
  const deliveryFee = items.length === 0 ? 0 : isFreeDelivery ? 0 : 95;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const newOrder: OrderDetails = {
        orderNumber: `HH-ZA-${Math.floor(10000 + Math.random() * 90000)}`,
        customerName: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        province: formData.province,
        paymentMethod: formData.paymentMethod.toUpperCase().replace('-', ' '),
        items: [...items],
        subtotal,
        discount: discountAmount,
        shipping: deliveryFee,
        total,
        date: new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }),
        trackingNumber: `RAM-TCG-${Math.floor(10000000 + Math.random() * 90000000)}`
      };

      setConfirmedOrder(newOrder);
      setIsSubmitting(false);
      onOrderSuccess(newOrder);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header bar */}
        <div className="bg-[#143329] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold font-heading">
              {confirmedOrder ? 'Order Confirmed' : '256-Bit Encrypted Discreet Checkout'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          // Order Receipt Confirmation View
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-semibold uppercase text-emerald-700 tracking-wider">
              Payment Confirmed & Verified
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1 mb-2 font-heading">
              Thank You For Your Order!
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              Your order <strong className="text-slate-800 font-mono">{confirmedOrder.orderNumber}</strong> has been received by Herbal Harbour dispatch. A confirmation email and tracking link has been sent to <strong>{confirmedOrder.email}</strong>.
            </p>

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left mb-6 space-y-3 text-xs">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Waybill Courier Tracking:</span>
                <span className="font-mono font-bold text-emerald-700">{confirmedOrder.trackingNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="font-semibold text-slate-900">{confirmedOrder.customerName} ({confirmedOrder.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="text-slate-900 text-right max-w-xs">{confirmedOrder.address}, {confirmedOrder.city}, {confirmedOrder.province} {confirmedOrder.postalCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Gateway:</span>
                <span className="font-medium text-slate-800">{confirmedOrder.paymentMethod}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-[#112d23]">
                <span>Total Paid (ZAR):</span>
                <span className="font-mono tabular-nums">R {confirmedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Discreet Packaging reminder */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 mb-6 flex items-center gap-2.5 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Discreet Packaging Guarantee:</strong> Your order is vacuum sealed in smell-proof inner foils and dispatched in a plain, unbranded brown courier box with generic return labels.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Print / Save Receipt
              </button>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-7 py-2.5 rounded-full bg-[#1e8755] hover:bg-[#166c43] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Back To Dispensary
              </button>
            </div>
          </div>
        ) : (
          // Checkout Input Form
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Customer Details */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <span>1. Patient & Contact Details</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
                    placeholder="e.g. Johan Smith"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Phone (for Courier SMS) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
                    placeholder="+27 82 123 4567"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 mb-1 font-medium">Email Address (Order Tracking) *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
                    placeholder="your.email@domain.co.za"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <span>2. South African Delivery Address</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="sm:col-span-3">
                  <label className="block text-slate-600 mb-1 font-medium">Street Address & Suburb *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
                    placeholder="Unit 4, 12 Kloof Street, Gardens"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">City / Town *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
                    placeholder="Cape Town"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Province *</label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none bg-white"
                  >
                    {SA_PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-medium">Postal Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
                    placeholder="8001"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <span>3. Payment Gateway</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'wallet', label: 'Patient Wallet (Google Pay balance)', icon: CreditCard },
                  { id: 'instant-eft', label: 'Instant EFT (Capitec / FNB / Nedbank)', icon: Building2 },
                  { id: 'credit-card', label: 'Debit / Credit Card (Visa, Mastercard)', icon: CreditCard },
                  { id: 'cod', label: 'Cash on Delivery (Cape Town / JHB)', icon: Banknote }
                ].map((pm) => {
                  const Icon = pm.icon;
                  return (
                    <label
                      key={pm.id}
                      className={`p-2.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                        formData.paymentMethod === pm.id
                          ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className="w-4 h-4 text-emerald-700" />
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pm.id}
                          checked={formData.paymentMethod === pm.id}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="accent-emerald-600"
                        />
                      </div>
                      <span className="text-[11px] leading-snug">{pm.label}</span>
                    </label>
                  );
                })}
              </div>

              {formData.paymentMethod === 'wallet' && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold text-emerald-900">Patient Wallet Balance: </span>
                    <strong className="font-mono text-emerald-800">R {userWalletBalance.toFixed(2)}</strong>
                    {userWalletBalance < total ? (
                      <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                        ⚠️ Insufficient balance (short by R {(total - userWalletBalance).toFixed(2)}). Please top up with Google Pay or select Instant EFT.
                      </p>
                    ) : (
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                        ✓ R {total.toFixed(2)} will be debited from your wallet upon order confirmation.
                      </p>
                    )}
                  </div>
                  {onOpenWallet && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenWallet();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shrink-0 cursor-pointer"
                    >
                      Google Pay Top-Up
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Summary & Submit */}
            <div className="pt-4 border-t border-slate-200 bg-slate-50/80 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8">
              <div className="flex items-center justify-between text-sm mb-4">
                <span className="font-semibold text-slate-700">Total Payable:</span>
                <span className="text-xl font-extrabold text-[#112d23] font-mono tabular-nums">
                  R {total.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-full border border-slate-300 text-slate-700 hover:bg-white text-xs font-bold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-full bg-[#1e8755] hover:bg-[#176d44] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <span>Processing Secure Order...</span>
                  ) : (
                    <span>Confirm Order & Pay R {total.toFixed(2)}</span>
                  )}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
