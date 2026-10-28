import { CartItem, CartQuote, Coupon } from '../types';
import { FREE_SHIPPING_THRESHOLD, STANDARD_DELIVERY_FEE } from './shopConfig';

export const VALID_COUPONS: Record<string, { percent: number; desc: string; minSpend?: number; freeShip?: boolean }> = {
  HARBOUR5: { percent: 5, desc: '5% OFF Storewide', minSpend: 800 },
  HARBOUR10: { percent: 10, desc: '10% OFF Storewide' },
  GREEN10: { percent: 10, desc: '10% OFF Green Apple Win' },
  ORANGE15: { percent: 15, desc: '15% OFF Citrus Win' },
  GREENHERB15: { percent: 15, desc: '15% OFF Storewide' },
  CITRUS20: { percent: 20, desc: '20% OFF Orders over R500', minSpend: 500 },
  FREESHIP: { percent: 0, desc: 'FREE Nationwide Courier', freeShip: true },
  JACKPOT25: { percent: 25, desc: '25% RARE JACKPOT WINNER' },
  VIPHARBOUR: { percent: 15, desc: '15% VIP Dispatch Club Discount' },
};

export function couponFromCode(code: string): Coupon | null {
  const match = VALID_COUPONS[code.trim().toUpperCase()];
  if (!match) return null;
  return {
    code: code.trim().toUpperCase(),
    discountPercent: match.percent,
    description: match.desc,
    minSpend: match.minSpend,
  };
}

export function quoteCart(items: CartItem[], coupon: Coupon | null): CartQuote {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const meetsMinimum = !coupon?.minSpend || subtotal >= coupon.minSpend;
  const freeShipCoupon = Boolean(coupon && coupon.code === 'FREESHIP' && meetsMinimum);
  let discount = 0;
  if (coupon && meetsMinimum && coupon.code !== 'FREESHIP') {
    discount = (subtotal * coupon.discountPercent) / 100;
  }
  const deliveryFeeWaived = items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD || freeShipCoupon;
  const shipping = items.length === 0 ? 0 : deliveryFeeWaived ? 0 : STANDARD_DELIVERY_FEE;
  const total = Math.max(0, subtotal - discount + shipping);
  return { subtotal, discount, shipping, total, deliveryFeeWaived };
}

export function formatZar(amount: number): string {
  return `R ${amount.toFixed(2)}`;
}
