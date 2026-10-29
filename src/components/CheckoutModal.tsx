import React, { useEffect, useState } from 'react';
import { X, Lock, CheckCircle2, Building2, Store, ArrowLeft, Sprout, HeartHandshake } from 'lucide-react';
import { CartItem, CheckoutDetails, Coupon, PaymentMethod, ShopOrder } from '../types';
import { applyStoreCredit, quoteCart, formatZar } from '../lib/pricing';
import { EFT_DETAILS, PAYMENT_LABELS } from '../lib/shopConfig';
import { calculateRoundUp, recordCharityDonation } from '../lib/charity';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  activeCoupon: Coupon | null;
  customerName: string;
  customerEmail: string;
  storeCredit: number | null;
  onPlaceOrder: (details: CheckoutDetails) => Promise<ShopOrder>;
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
  customerName,
  customerEmail,
  storeCredit,
  onPlaceOrder,
}) => {
  const [formData, setFormData] = useState<CheckoutDetails>({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    province: 'Western Cape',
    notes: '',
    paymentMethod: 'eft',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ShopOrder | null>(null);
  const [roundUpForCharity, setRoundUpForCharity] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setConfirmedOrder(null);
    setError(null);
    setRoundUpForCharity(false);
    setFormData((prev) => ({
      ...prev,
      customerName: customerName || prev.customerName,
      email: customerEmail || prev.email,
    }));
  }, [isOpen, customerName, customerEmail]);

  if (!isOpen) return null;

  const quote = applyStoreCredit(quoteCart(items, activeCoupon).total, storeCredit);
  const cartQuote = quoteCart(items, activeCoupon);
  const oversold = items.filter((item) => item.product.stock < item.quantity || item.product.stock <= 0);
  const { roundedTotal, donationAmount } = calculateRoundUp(quote.total);
  const finalPayableTotal = roundUpForCharity ? roundedTotal : quote.total;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (oversold.length) {
      setError(`${oversold[0].product.name} does not have enough stock. Update the cart and try again.`);
      return;
    }
    setIsSubmitting(true);
    try {
      const orderPayload: CheckoutDetails = {
        ...formData,
        charityDonation: roundUpForCharity ? donationAmount : undefined,
        charityId: roundUpForCharity ? 'fynbos' : undefined,
      };
      const order = await onPlaceOrder(orderPayload);
      if (roundUpForCharity && donationAmount > 0) {
        recordCharityDonation(donationAmount, 'fynbos', 'checkout_roundup', customerEmail, customerEmail);
      }
      setConfirmedOrder(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place the order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="bg-[#143329] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold font-heading">
              {confirmedOrder ? 'Order received' : 'Checkout · pay by EFT or on collection'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-300 hover:text-white" aria-label="Close checkout">
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          <div className="p-6 sm:p-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 text-center font-heading">Order {confirmedOrder.orderNumber}</h2>
            <p className="text-xs text-slate-500 text-center max-w-md mx-auto mt-2 mb-6">
              This order is <strong>{confirmedOrder.status}</strong>. Nothing has been charged online.
              {confirmedOrder.paymentMethod === 'eft'
                ? ' Pay by EFT and use the order number as the reference. The shop marks it paid once the transfer shows.'
                : ' Pay when you collect the order in store.'}
            </p>
            {confirmedOrder.paymentMethod === 'eft' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-1 mb-4">
                <p><span className="text-slate-500">Account name:</span> {EFT_DETAILS.accountName}</p>
                <p><span className="text-slate-500">Bank:</span> {EFT_DETAILS.bank}</p>
                <p><span className="text-slate-500">Account:</span> <span className="font-mono">{EFT_DETAILS.accountNumber}</span></p>
                <p><span className="text-slate-500">Branch:</span> <span className="font-mono">{EFT_DETAILS.branchCode}</span></p>
                <p><span className="text-slate-500">Reference:</span> <strong className="font-mono">{confirmedOrder.orderNumber}</strong></p>
                {(confirmedOrder.creditApplied ?? 0) > 0 && (
                  <p><span className="text-slate-500">Store credit:</span> <strong>- {formatZar(confirmedOrder.creditApplied ?? 0)}</strong>. This cannot be cashed out.</p>
                )}
                <p><span className="text-slate-500">Amount:</span> <strong>{formatZar(confirmedOrder.total)}</strong></p>
              </div>
            )}
            <button onClick={onClose} className="w-full py-3 rounded-full bg-[#1e8755] text-white text-xs font-bold uppercase">
              Back to the shop
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="block">
                <span className="text-slate-600 font-medium">Full name *</span>
                <input required value={formData.customerName} onChange={(event) => setFormData({ ...formData, customerName: event.target.value })} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600" />
              </label>
              <label className="block">
                <span className="text-slate-600 font-medium">Phone *</span>
                <input required value={formData.phone} onChange={(event) => setFormData({ ...formData, phone: event.target.value })} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-slate-600 font-medium">Email *</span>
                <input required type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-slate-600 font-medium">Street address *</span>
                <input required value={formData.address} onChange={(event) => setFormData({ ...formData, address: event.target.value })} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600" />
              </label>
              <label className="block">
                <span className="text-slate-600 font-medium">City *</span>
                <input required value={formData.city} onChange={(event) => setFormData({ ...formData, city: event.target.value })} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600" />
              </label>
              <label className="block">
                <span className="text-slate-600 font-medium">Province *</span>
                <select value={formData.province} onChange={(event) => setFormData({ ...formData, province: event.target.value })} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600 bg-white">
                  {SA_PROVINCES.map((province) => <option key={province}>{province}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-slate-600 font-medium">Postal code *</span>
                <input required value={formData.postalCode} onChange={(event) => setFormData({ ...formData, postalCode: event.target.value })} className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-emerald-600" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {([
                ['eft', 'EFT bank transfer', Building2],
                ['pay_on_collection', 'Pay on collection', Store],
              ] as const).map(([id, label, Icon]) => (
                <label key={id} className={`p-3 rounded-xl border cursor-pointer ${formData.paymentMethod === id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <Icon className="w-4 h-4 text-emerald-700" />
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={formData.paymentMethod === id}
                      onChange={() => setFormData({ ...formData, paymentMethod: id as PaymentMethod })}
                    />
                  </div>
                  <span className="font-semibold">{label}</span>
                  <span className="block text-[11px] text-slate-500 mt-1">{PAYMENT_LABELS[id]}</span>
                </label>
              ))}
            </div>

            <ul className="text-xs text-slate-600 space-y-1">
              {items.map((item) => (
                <li key={item.product.id} className="flex justify-between">
                  <span>{item.quantity} × {item.product.name}</span>
                  <span className="font-mono">{formatZar(item.product.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            {/* Green Initiative Round-Up Option */}
            <div className="p-4 rounded-2xl bg-[#f0f7f1] border border-[#d2e8d6] transition-all">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={roundUpForCharity}
                  onChange={(e) => setRoundUpForCharity(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-emerald-600 accent-emerald-700 cursor-pointer"
                />
                <div className="text-xs min-w-0">
                  <span className="font-bold text-forest-900 flex items-center gap-1.5 flex-wrap">
                    <Sprout className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    Round up my order to the nearest R10 for charity (+{formatZar(donationAmount)})
                  </span>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    100% of this contribution goes to SANParks Fynbos Conservation and indigenous medicinal plant research in South Africa.
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-slate-50 -mx-6 sm:-mx-8 px-6 sm:px-8 py-4 space-y-2">
              {quote.creditApplied > 0 && (
                <div className="flex justify-between text-xs text-emerald-800">
                  <span>Store credit on R {cartQuote.total.toFixed(2)}</span>
                  <span className="font-mono">- {formatZar(quote.creditApplied)}</span>
                </div>
              )}
              {roundUpForCharity && donationAmount > 0 && (
                <div className="flex justify-between text-xs text-forest-700 font-bold">
                  <span className="flex items-center gap-1">
                    <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                    Green Initiative donation
                  </span>
                  <span className="font-mono">+ {formatZar(donationAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold">
                <span>Total due</span>
                <span className="font-mono">{formatZar(finalPayableTotal)}</span>
              </div>
              {storeCredit !== null && storeCredit > 0 && (
                <p className="text-[11px] text-slate-500">Store credit cannot be cashed out. The shop applies it when the order is placed.</p>
              )}
              {error && <p className="text-xs text-rose-700">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-5 py-3 rounded-full border border-slate-300 text-xs font-bold">
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                  Back
                </button>
                <button type="submit" disabled={isSubmitting || items.length === 0} className="flex-1 py-3 rounded-full bg-[#1e8755] text-white text-xs font-bold uppercase disabled:opacity-60 cursor-pointer">
                  {isSubmitting ? 'Reserving stock…' : `Place order · ${formatZar(finalPayableTotal)}`}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
