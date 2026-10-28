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

export interface Coupon {
  code: string;
  discountPercent: number;
  description: string;
  minSpend?: number;
}

export interface OrderDetails {
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  date: string;
  trackingNumber: string;
}
