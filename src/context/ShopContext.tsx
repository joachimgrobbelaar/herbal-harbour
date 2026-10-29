import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PRODUCTS } from '../data/products';
import { useAuth } from './AuthContext';
import { toProduct } from '../lib/productMap';
import { fetchCart, fetchPublicCatalogue, mergeCart, saveCart } from '../services/api';
import type { CartItem, Product, StoredCartLine } from '../types';

const GUEST_CART_KEY = 'herbal_harbour_guest_cart';

export type CatalogSource = 'live' | 'offline';

interface ShopContextValue {
  products: Product[];
  allProducts: Product[];
  catalogReady: boolean;
  catalogSource: CatalogSource;
  cartItems: CartItem[];
  refreshCatalog: () => Promise<void>;
  addToCart: (product: Product, quantity?: number, weight?: string) => { ok: boolean; message: string };
  updateQuantity: (productId: string, quantity: number) => { ok: boolean; message: string };
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

function loadGuestCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item?.product?.id && item.quantity > 0).map((item) => ({
      ...item,
      product: {
        ...item.product,
        stock: Math.max(0, Math.floor(Number(item.product.stock) || 0)),
        lowStockThreshold: Math.max(0, Math.floor(Number(item.product.lowStockThreshold) || 5)),
        active: item.product.active !== false,
        inStock: Math.max(0, Math.floor(Number(item.product.stock) || 0)) > 0,
      },
    }));
  } catch {
    return [];
  }
}

function saveGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function serialize(items: CartItem[]): StoredCartLine[] {
  return items.map((item) => ({
    productId: item.product.id,
    quantity: item.quantity,
    ...(item.selectedWeight ? { selectedWeight: item.selectedWeight } : {}),
  }));
}

function hydrateLines(lines: StoredCartLine[], catalog: Product[]): CartItem[] {
  const items: CartItem[] = [];
  for (const line of lines) {
    const product = catalog.find((entry) => entry.id === line.productId);
    if (!product) continue;
    const raw = Math.max(1, Math.floor(Number(line.quantity) || 1));
    const quantity = product.stock > 0 ? Math.min(raw, product.stock) : raw;
    if (quantity <= 0) continue;
    items.push({ product, quantity, selectedWeight: line.selectedWeight });
  }
  return items;
}

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS);
  const [catalogSource, setCatalogSource] = useState<CatalogSource>('offline');
  const [catalogReady, setCatalogReady] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadGuestCart());
  const [cartReady, setCartReady] = useState(false);
  const productsRef = useRef(products);
  productsRef.current = products;
  const sourceRef = useRef(catalogSource);
  sourceRef.current = catalogSource;
  const cartRef = useRef(cartItems);
  cartRef.current = cartItems;
  const hadAccount = useRef(false);
  const mergedUid = useRef<string | null>(null);

  const applyCatalogue = (rows: Product[], source: CatalogSource) => {
    const normalised = rows.map((row) => toProduct(row.id, row as unknown as Record<string, unknown>));
    normalised.sort((a, b) => a.name.localeCompare(b.name));
    setAllProducts(normalised);
    setProducts(normalised.filter((product) => product.active));
    setCatalogSource(source);
    setCatalogReady(true);
  };

  const refreshCatalog = async () => {
    try {
      const rows = await fetchPublicCatalogue();
      if (rows.length) {
        applyCatalogue(rows, 'live');
        return;
      }
      if (sourceRef.current !== 'live') applyCatalogue(PRODUCTS, 'offline');
    } catch {
      if (sourceRef.current !== 'live') applyCatalogue(PRODUCTS, 'offline');
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const rows = await fetchPublicCatalogue();
        if (cancelled) return;
        if (rows.length) {
          applyCatalogue(rows, 'live');
          return;
        }
        if (sourceRef.current !== 'live') applyCatalogue(PRODUCTS, 'offline');
      } catch {
        if (!cancelled && sourceRef.current !== 'live') applyCatalogue(PRODUCTS, 'offline');
      }
    };
    load();
    const timer = window.setInterval(load, 20000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [user?.uid]);

  useEffect(() => {
    setCartItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const live = productsRef.current.find((product) => product.id === item.product.id);
        if (!live) return item;
        const quantity = live.stock > 0 ? Math.min(item.quantity, live.stock) : item.quantity;
        if (live.stock === item.product.stock && live.price === item.product.price && live.name === item.product.name && quantity === item.quantity) {
          return item;
        }
        changed = true;
        return { ...item, product: live, quantity };
      });
      return changed ? next : prev;
    });
  }, [products]);

  useEffect(() => {
    if (authLoading || !catalogReady) return;
    if (!user) {
      mergedUid.current = null;
      if (hadAccount.current) {
        hadAccount.current = false;
        setCartItems(loadGuestCart());
      }
      setCartReady(true);
      return;
    }
    hadAccount.current = true;
    const uid = user.uid;
    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchCart();
        const guest = loadGuestCart();
        const merged = guest.length
          ? await mergeCart(serialize(guest))
          : remote;
        if (guest.length) localStorage.removeItem(GUEST_CART_KEY);
        if (cancelled) return;
        mergedUid.current = uid;
        setCartItems(hydrateLines(merged, productsRef.current));
      } catch {
        if (!cancelled) setCartItems(hydrateLines(serialize(loadGuestCart()), productsRef.current));
      } finally {
        if (!cancelled) setCartReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, catalogReady]);

  useEffect(() => {
    if (!cartReady || authLoading) return;
    if (!user) {
      saveGuestCart(cartItems);
      return;
    }
    if (mergedUid.current !== user.uid) return;
    const uid = user.uid;
    const handle = window.setTimeout(() => {
      saveCart(serialize(cartRef.current)).catch(() => {
        /* the next edit retries */
      });
      void uid;
    }, 300);
    return () => window.clearTimeout(handle);
  }, [cartItems, cartReady, authLoading, user]);

  const value = useMemo<ShopContextValue>(() => ({
    products,
    allProducts,
    catalogReady,
    catalogSource,
    cartItems,
    refreshCatalog,
    addToCart(product, quantity = 1, weight) {
      const qty = Math.max(1, Math.floor(quantity));
      if (product.stock <= 0) return { ok: false, message: `${product.name} is out of stock` };
      const existing = cartRef.current.find((item) => item.product.id === product.id);
      const desired = (existing?.quantity || 0) + qty;
      if ((existing?.quantity || 0) >= product.stock) {
        return { ok: false, message: `Only ${product.stock} of ${product.name} available` };
      }
      const nextQty = Math.min(desired, product.stock);
      setCartItems((prev) => {
        const index = prev.findIndex((item) => item.product.id === product.id);
        if (index === -1) return [...prev, { product, quantity: nextQty, selectedWeight: weight || 'Standard' }];
        const copy = [...prev];
        copy[index] = { ...copy[index], product, quantity: nextQty, selectedWeight: weight || copy[index].selectedWeight };
        return copy;
      });
      if (nextQty < desired) return { ok: true, message: `Only ${product.stock} in stock — cart updated to ${nextQty}` };
      return { ok: true, message: `Added ${product.name} to cart` };
    },
    updateQuantity(productId, quantity) {
      const current = cartRef.current.find((item) => item.product.id === productId);
      if (!current) return { ok: false, message: 'Item is not in the cart' };
      if (quantity <= 0) {
        setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
        return { ok: true, message: 'Removed from cart' };
      }
      const max = current.product.stock;
      if (max > 0 && quantity > max) {
        setCartItems((prev) => prev.map((item) => item.product.id === productId ? { ...item, quantity: max } : item));
        return { ok: false, message: `Only ${max} of ${current.product.name} available` };
      }
      setCartItems((prev) => prev.map((item) => item.product.id === productId ? { ...item, quantity } : item));
      return { ok: true, message: 'Quantity updated' };
    },
    removeFromCart(productId) {
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    },
    clearCart() {
      setCartItems([]);
    },
  }), [products, allProducts, catalogReady, catalogSource, cartItems, user]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}
