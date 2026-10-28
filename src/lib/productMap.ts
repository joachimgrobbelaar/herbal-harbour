import { Product, ProductCategory, StrainType } from '../types';
import { DEFAULT_LOW_STOCK } from './shopConfig';

const CATEGORIES: ProductCategory[] = ['flower', 'seeds', 'tinctures', 'edibles', 'concentrates', 'topicals'];
const STRAINS: StrainType[] = ['Sativa', 'Indica', 'Hybrid', 'CBD-Rich'];

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function toProduct(id: string, data: Record<string, unknown>): Product {
  const category = CATEGORIES.includes(data.category as ProductCategory)
    ? (data.category as ProductCategory)
    : 'flower';
  const strainType = STRAINS.includes(data.strainType as StrainType)
    ? (data.strainType as StrainType)
    : 'Hybrid';
  const stock = Math.max(0, Math.floor(asNumber(data.stock, 0)));
  const active = data.active !== false;
  return {
    id,
    name: asString(data.name, 'Untitled'),
    subtitle: asString(data.subtitle),
    category,
    categoryLabel: asString(data.categoryLabel, category),
    strainType,
    price: asNumber(data.price, 0),
    originalPrice: data.originalPrice == null ? undefined : asNumber(data.originalPrice),
    rating: asNumber(data.rating, 0),
    reviewCount: asNumber(data.reviewCount, 0),
    thc: asString(data.thc, '—'),
    cbd: asString(data.cbd, '—'),
    terpenes: asStringList(data.terpenes),
    effects: asStringList(data.effects),
    medicalUses: asStringList(data.medicalUses),
    description: asString(data.description),
    dosageGuide: asString(data.dosageGuide),
    stock,
    lowStockThreshold: Math.max(0, Math.floor(asNumber(data.lowStockThreshold, DEFAULT_LOW_STOCK))),
    inStock: stock > 0 && data.inStock !== false,
    active,
    isSale: Boolean(data.isSale),
    isBestSeller: Boolean(data.isBestSeller),
    badge: data.badge ? asString(data.badge) : undefined,
    labTestedDate: asString(data.labTestedDate),
    batchNumber: asString(data.batchNumber),
    imageUrl: asString(data.imageUrl),
    colorGradient: asString(data.colorGradient, 'from-emerald-100 to-amber-100'),
  };
}

export function productToFirestore(product: Product): Record<string, unknown> {
  return {
    name: product.name,
    subtitle: product.subtitle,
    category: product.category,
    categoryLabel: product.categoryLabel,
    strainType: product.strainType,
    price: product.price,
    originalPrice: product.originalPrice ?? null,
    rating: product.rating,
    reviewCount: product.reviewCount,
    thc: product.thc,
    cbd: product.cbd,
    terpenes: product.terpenes,
    effects: product.effects,
    medicalUses: product.medicalUses,
    description: product.description,
    dosageGuide: product.dosageGuide,
    stock: Math.max(0, Math.floor(product.stock)),
    lowStockThreshold: Math.max(0, Math.floor(product.lowStockThreshold || DEFAULT_LOW_STOCK)),
    inStock: product.stock > 0,
    active: product.active !== false,
    isSale: Boolean(product.isSale),
    isBestSeller: Boolean(product.isBestSeller),
    badge: product.badge || null,
    labTestedDate: product.labTestedDate,
    batchNumber: product.batchNumber,
    imageUrl: product.imageUrl,
    colorGradient: product.colorGradient,
  };
}

export function isLowStock(product: Product): boolean {
  return product.active !== false && product.stock <= product.lowStockThreshold;
}
