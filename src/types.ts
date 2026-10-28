export type StrainType = 'Sativa' | 'Indica' | 'Hybrid' | 'CBD-Rich';

export type ProductCategory =
  | 'flower'
  | 'seeds'
  | 'tinctures'
  | 'edibles'
  | 'concentrates'
  | 'topicals';

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  category: ProductCategory;
  categoryLabel: string;
  strainType: StrainType;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  thc: string;
  cbd: string;
  terpenes: string[];
  effects: string[];
  medicalUses: string[];
  description: string;
  dosageGuide: string;
  inStock: boolean;
  /** Units available to sell. Stock is counted per catalogue item, not per weight label. */
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  isSale?: boolean;
  isBestSeller?: boolean;
  badge?: string;
  labTestedDate: string;
  batchNumber: string;
  imageUrl: string;
  colorGradient: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedWeight?: string;
}

export interface StoredCartLine {
  productId: string;
  quantity: number;
  selectedWeight?: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
  minSpend?: number;
}

export type OrderStatus = 'pending' | 'paid' | 'collected' | 'cancelled';
export type OrderChannel = 'online' | 'pos';
export type PaymentMethod = 'eft' | 'pay_on_collection';
export type StockChannel = OrderChannel | 'adjustment' | 'cancel';

export interface OrderLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  selectedWeight?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  isSignedIn: boolean;
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  notes: string;
  paymentMethod: PaymentMethod;
  channel: OrderChannel;
  status: OrderStatus;
  items: OrderLine[];
  quantities: Record<string, number>;
  subtotal: number;
  discount: number;
  shipping: number;
  creditApplied?: number;
  total: number;
  stockApplied: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  delta: number;
  stockAfter: number;
  reason: string;
  channel: StockChannel;
  orderId?: string;
  userId: string;
  createdAt: Date | null;
}

export interface CheckoutDetails {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  notes: string;
  paymentMethod: PaymentMethod;
}

export interface CartQuote {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  deliveryFeeWaived: boolean;
}
