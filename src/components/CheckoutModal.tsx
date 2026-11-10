import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Truck,
  CreditCard,
  Banknote,
  Building2,
  Download,
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  QrCode,
} from 'lucide-react';
import { CartItem, Coupon, OrderDetails } from '../types';
import { requestGooglePayOrderPayment } from '../lib/googlePay';
import { generateWaybill } from '../services/shippingService';

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
  'Northern Cape',
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  activeCoupon,
  onOrderSuccess,
  userWalletBalance = 250,
  onOpenWallet,
}) => {
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupLocation, setPickupLocation] = useState<'waterfront' | 'gardens'>('waterfront');

  const [formData, setFormData] = useState({
    name: 'Herbal Harbour Member',
    email: 'member@herbalharbour.co.za',
    phone: '+27 82 459 1234',
    address: '14 Harbour View Close, Waterfront',
    city: 'Cape Town',
    postalCode: '8001',
    province: 'Western Cape',
    paymentMethod: 'google-pay',
    orderNotes: 'Please ring intercom or leave with front security if unavailable.',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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

  // Delivery fee is 0 for store pickup, free for orders >= R750 or with FREESHIP coupon
  const isFreeDelivery = fulfillmentType === 'pickup' || subtotal >= 750 || (activeCoupon && activeCoupon.code === 'FREESHIP');
  const deliveryFee = items.length === 0 ? 0 : isFreeDelivery ? 0 : 95;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      let paymentLabel = formData.paymentMethod.toUpperCase().replace('-', ' ');

      // If Google Pay was selected, invoke the native Google Pay prompt
      if (formData.paymentMethod === 'google-pay') {
        const orderTempId = `HH-${Math.floor(10000 + Math.random() * 90000)}`;
        const gpayResult = await requestGooglePayOrderPayment({
          amountZar: total,
          orderType: fulfillmentType,
          orderNumber: orderTempId,
        });
        if (!gpayResult.success) {
          throw new Error('Google Pay payment could not be authorized.');
        }
        paymentLabel = `GOOGLE PAY (${gpayResult.cardNetwork || 'Express Token'})`;
      }

      const orderNumber = `HH-${fulfillmentType === 'pickup' ? 'PU' : 'ZA'}-${Math.floor(10000 + Math.random() * 90000)}`;
      const pickupPin = Math.floor(1000 + Math.random() * 9000).toString();
      
      const newOrder: OrderDetails = {
        orderNumber,
        customerName: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: fulfillmentType === 'pickup' ? 'Dispensary Counter Collection' : formData.address,
        city: fulfillmentType === 'pickup' ? 'Cape Town' : formData.city,
        postalCode: fulfillmentType === 'pickup' ? '8001' : formData.postalCode,
        province: 'Western Cape',
        paymentMethod: paymentLabel,
        items: [...items],
        subtotal,
        discount: discountAmount,
        shipping: deliveryFee,
        total,
        date: new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }),
        trackingNumber: `TCG-${Math.floor(10000000 + Math.random() * 90000000)}`,
        fulfillmentType,
        pickupPin: fulfillmentType === 'pickup' ? pickupPin : undefined,
        pickupLocation:
          fulfillmentType === 'pickup'
            ? pickupLocation === 'waterfront'
              ? 'V&A Waterfront Dispensary (Shop 14, East Pier Rd)'
              : 'Gardens Dispensary (42 Kloof Street)'
            : undefined,
      };

      setConfirmedOrder(newOrder);
      onOrderSuccess(newOrder);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Payment processing failed. Please try another method.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        
        {/* Header bar */}
        <div className="bg-[#143329] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold font-heading">
              {confirmedOrder
                ? confirmedOrder.fulfillmentType === 'pickup'
                  ? 'Dispensary Collection Receipt'
                  : 'Order Confirmed'
                : '256-Bit Encrypted Secure Checkout'}
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
              {confirmedOrder.fulfillmentType === 'pickup' ? 'Ready For Counter Pickup' : 'Dispatched to Courier Network'}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1 mb-2 font-heading">
              Thank You For Your Order!
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              Your order <strong className="text-slate-800 font-mono">{confirmedOrder.orderNumber}</strong> has been logged. A confirmation SMS and digital invoice has been sent to <strong>{confirmedOrder.phone}</strong> and <strong>{confirmedOrder.email}</strong>.
            </p>

            {/* PICKUP SPECIFIC PIN CARD */}
            {confirmedOrder.fulfillmentType === 'pickup' && confirmedOrder.pickupPin && (
              <div className="bg-gradient-to-br from-emerald-900 to-[#102920] text-white rounded-2xl p-6 text-center mb-6 shadow-lg border border-emerald-700/50">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300 block mb-1">
                  Dispensary Counter Collection PIN
                </span>
                <div className="font-mono text-4xl sm:text-5xl font-black tracking-widest text-amber-300 my-2 select-all">
                  {confirmedOrder.pickupPin}
                </div>
                <p className="text-xs text-emerald-100 max-w-md mx-auto mt-2">
                  Present this 4-digit PIN and your ID at <strong>{confirmedOrder.pickupLocation}</strong>. Your prescription package is pre-packed and ready for collection!
                </p>
                <div className="mt-4 pt-3 border-t border-emerald-700/40 flex items-center justify-center gap-4 text-xs text-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-300" /> Mon - Sat: 09:00 - 18:00
                  </span>
                  <span>•</span>
                  <a
                    href="https://maps.google.com/?q=V%26A+Waterfront+Cape+Town"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-amber-300 hover:underline font-bold"
                  >
                    <MapPin className="w-3.5 h-3.5" /> View on Map <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Receipt Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left mb-6 space-y-3 text-xs">
              {confirmedOrder.fulfillmentType === 'delivery' ? (
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">The Courier Guy (TCG) Tracking:</span>
                  <a
                    href={`https://thecourierguy.co.za/tracking?waybill=${encodeURIComponent(confirmedOrder.trackingNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    {confirmedOrder.trackingNumber} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Collection Location:</span>
                  <span className="font-bold text-emerald-800">{confirmedOrder.pickupLocation}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-semibold text-slate-900">{confirmedOrder.customerName} ({confirmedOrder.phone})</span>
              </div>
              {confirmedOrder.fulfillmentType === 'delivery' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Address:</span>
                  <span className="text-slate-900 text-right max-w-xs">{confirmedOrder.address}, {confirmedOrder.city}, {confirmedOrder.province} {confirmedOrder.postalCode}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Gateway:</span>
                <span className="font-medium text-slate-800">{confirmedOrder.paymentMethod}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-[#112d23]">
                <span>Total Paid (ZAR):</span>
                <span className="font-mono tabular-nums">R {confirmedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Packaging / Guarantee reminder */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 mb-6 flex items-center gap-2.5 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {confirmedOrder.fulfillmentType === 'pickup' ? (
                  <><strong>Instant Counter Collection:</strong> Your botanical medicines are vacuum-sealed and held safely under climate-controlled storage until presented.</>
                ) : (
                  <><strong>Discreet Packaging Guarantee:</strong> Your order is vacuum-sealed in smell-proof inner foils and dispatched in a plain, unbranded brown courier box with generic return labels.</>
                )}
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
            
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* FULFILLMENT METHOD SELECTOR */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                <span>1. Select How You'd Like Your Order</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('pickup')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    fulfillmentType === 'pickup'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Store className={`w-5 h-5 mt-0.5 shrink-0 ${fulfillmentType === 'pickup' ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>🏪 Store Pickup</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full uppercase">Free</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                      V&A Waterfront or Gardens (Cape Town). Ready in 30 mins with SMS PIN.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType('delivery')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    fulfillmentType === 'delivery'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Truck className={`w-5 h-5 mt-0.5 shrink-0 ${fulfillmentType === 'delivery' ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>🚚 Discreet Courier</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {isFreeDelivery ? 'FREE' : 'R 95'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                      Nationwide overnight express. 100% smell-proof plain box.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Patient Details */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <span>2. Patient & Contact Information</span>
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
                  <label className="block text-slate-600 mb-1 font-medium">
                    Phone {fulfillmentType === 'pickup' ? '(for Collection SMS PIN) *' : '(for Courier Tracking SMS) *'}
                  </label>
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
                  <label className="block text-slate-600 mb-1 font-medium">Email Address (Invoice & Order Status) *</label>
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

            {/* PICKUP LOCATION CARD VS DELIVERY ADDRESS */}
            {fulfillmentType === 'pickup' ? (
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <span>3. Choose Dispensary Pickup Counter</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      pickupLocation === 'waterfront'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <MapPin className="w-4 h-4 text-emerald-700" /> V&A Waterfront
                      </span>
                      <input
                        type="radio"
                        name="pickupLocation"
                        checked={pickupLocation === 'waterfront'}
                        onChange={() => setPickupLocation('waterfront')}
                        className="accent-emerald-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal leading-snug">
                      Shop 14, East Pier Road, V&A Waterfront, Cape Town. Mon-Sat 09:00-18:00.
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      pickupLocation === 'gardens'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                        <MapPin className="w-4 h-4 text-emerald-700" /> Gardens Dispensary
                      </span>
                      <input
                        type="radio"
                        name="pickupLocation"
                        checked={pickupLocation === 'gardens'}
                        onChange={() => setPickupLocation('gardens')}
                        className="accent-emerald-600"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 font-normal leading-snug">
                      42 Kloof Street, Gardens, Cape Town. Mon-Sat 10:00-19:00.
                    </span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                  <span>3. South African Delivery Address</span>
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
            )}

            {/* Payment Method Selector */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
                <span>4. Payment Gateway</span>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Instant Verification Available
                </span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'google-pay', label: 'Google Pay (1-Click Express)', icon: CreditCard, badge: 'Popular' },
                  { id: 'instant-eft', label: 'Instant EFT (Capitec, FNB, Nedbank)', icon: Building2 },
                  { id: 'credit-card', label: 'Debit / Credit Card', icon: CreditCard },
                  {
                    id: fulfillmentType === 'pickup' ? 'counter-pay' : 'cod',
                    label: fulfillmentType === 'pickup' ? 'Pay upon Pickup (Cash/Card)' : 'Cash on Delivery',
                    icon: Banknote,
                  },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = formData.paymentMethod === pm.id;
                  return (
                    <label
                      key={pm.id}
                      className={`p-2.5 rounded-xl border cursor-pointer flex flex-col justify-between transition-all relative ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      {pm.badge && (
                        <span className="absolute -top-2 right-2 bg-emerald-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                          {pm.badge}
                        </span>
                      )}
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className="w-4 h-4 text-emerald-700" />
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={pm.id}
                          checked={isSelected}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          className="accent-emerald-600"
                        />
                      </div>
                      <span className="text-[11px] leading-snug">{pm.label}</span>
                    </label>
                  );
                })}
              </div>

              {formData.paymentMethod === 'google-pay' && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 text-white text-xs flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm tracking-tight text-white">G<span className="text-blue-400">o</span><span className="text-red-400">o</span><span className="text-yellow-400">g</span><span className="text-green-400">l</span><span className="text-red-400">e</span> Pay</span>
                    <span className="text-[11px] text-slate-300">
                      • {fulfillmentType === 'pickup' ? 'Instant contactless reservation for in-store pickup' : 'Instant biometric checkout with any linked card'}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold uppercase">
                    Zero Fees
                  </span>
                </div>
              )}
            </div>

            {/* Summary & Submit */}
            <div className="pt-4 border-t border-slate-200 bg-slate-50/80 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8">
              <div className="flex items-center justify-between text-sm mb-4">
                <div>
                  <span className="font-semibold text-slate-700 block">Total Payable:</span>
                  <span className="text-xs text-slate-500">
                    {fulfillmentType === 'pickup' ? 'Free In-Store Pickup Included' : isFreeDelivery ? 'Free Nationwide Courier Included' : 'Includes R 95 Discreet Courier'}
                  </span>
                </div>
                <span className="text-2xl font-black text-[#112d23] font-mono tabular-nums">
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
                    <span>Authorizing Secure Transaction...</span>
                  ) : formData.paymentMethod === 'google-pay' ? (
                    <span>Pay R {total.toFixed(2)} with Google Pay</span>
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
