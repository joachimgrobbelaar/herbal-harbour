import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { PRODUCTS } from '../data/products';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { toProduct } from '../lib/productMap';
import type { CartItem, Product, StoredCartLine } from '../types';

const GUEST_CART_KEY = 'herbal_harbour_guest_cart';

export type CatalogSource = 'firestore' | 'unseeded' | 'offline';

interface ShopContextValue {
  products: Product[];
  allProducts: Product[];
  catalogReady: boolean;
  catalogSource: CatalogSource;
  cartItems: CartItem[];
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
    return parsed.filter((item) => item?.product?.id && item.quantity > 0 && typeof item.product.price === 'number').map((item) => ({
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
    items.push({ product, quantity, selectedWeight: line.selectedWeight });
  }
  return items;
}

function mergeCarts(remote: CartItem[], local: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const item of [...remote, ...local]) {
    const existing = map.get(item.product.id);
    const combined = (existing?.quantity || 0) + item.quantity;
    const stock = item.product.stock;
    map.set(item.product.id, {
      product: item.product,
      quantity: stock > 0 ? Math.min(combined, stock) : combined,
      selectedWeight: item.selectedWeight || existing?.selectedWeight,
    });
  }
  return [...map.values()];
}

const mergeLocks = new Map<string, Promise<CartItem[]>>();

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS);
  const [catalogSource, setCatalogSource] = useState<CatalogSource>(db ? 'offline' : 'offline');
  const [catalogReady, setCatalogReady] = useState(!db);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadGuestCart());
  const [cartReady, setCartReady] = useState(false);
  const productsRef = useRef(products);
  productsRef.current = products;
  const cartRef = useRef(cartItems);
  cartRef.current = cartItems;
  const hadAccount = useRef(false);

  useEffect(() => {
    if (!db) {
      setProducts(PRODUCTS);
      setAllProducts(PRODUCTS);
      setCatalogSource('offline');
      setCatalogReady(true);
      return;
    }
    return onSnapshot(collection(db, 'products'), (snap) => {
      if (snap.empty) {
        setProducts(PRODUCTS);
        setAllProducts(PRODUCTS);
        setCatalogSource('unseeded');
      } else {
        const all = snap.docs.map((entry) => toProduct(entry.id, entry.data() as Record<string, unknown>));
        all.sort((a, b) => a.name.localeCompare(b.name));
        setAllProducts(all);
        setProducts(all.filter((product) => product.active));
        setCatalogSource('firestore');
      }
      setCatalogReady(true);
    }, () => {
      setProducts(PRODUCTS);
      setAllProducts(PRODUCTS);
      setCatalogSource('offline');
      setCatalogReady(true);
    });
  }, []);

  useEffect(() => {
    setCartItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const live = productsRef.current.find((product) => product.id === item.product.id);
        if (!live) return item;
        const quantity = live.stock > 0 ? Math.min(item.quantity, live.stock) : item.quantity;
        if (
          live.stock === item.product.stock &&
          live.price === item.product.price &&
          live.name === item.product.name &&
          live.inStock === item.product.inStock &&
          quantity === item.quantity
        ) {
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
    if (!user || !db) {
      mergeLocks.clear();
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
    if (!mergeLocks.has(uid)) {
      mergeLocks.set(uid, (async () => {
        const snap = await getDoc(doc(db, 'carts', uid));
        const remote = hydrateLines((snap.data()?.items || []) as StoredCartLine[], productsRef.current);
        const guest = loadGuestCart();
        const merged = mergeCarts(remote, guest);
        localStorage.removeItem(GUEST_CART_KEY);
        await setDoc(doc(db, 'carts', uid), {
          userId: uid,
          items: serialize(merged),
          updatedAt: serverTimestamp(),
        });
        return merged;
      })());
    }
    mergeLocks.get(uid)!.then((merged) => {
      if (!cancelled) {
        setCartItems(merged);
        setCartReady(true);
      }
    }).catch(() => {
      if (!cancelled) setCartReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, catalogReady]);

  useEffect(() => {
    if (!cartReady || authLoading) return;
    if (!user || !db) {
      saveGuestCart(cartItems);
      return;
    }
    const database = db;
    const uid = user.uid;
    const handle = window.setTimeout(() => {
      setDoc(doc(database, 'carts', uid), {
        userId: uid,
        items: serialize(cartItems),
        updatedAt: serverTimestamp(),
      }).catch(() => {
        /* cart still lives in memory; the next edit retries */
      });
    }, 300);
    return () => window.clearTimeout(handle);
  }, [cartItems, cartReady, authLoading, user]);

  const value = useMemo<ShopContextValue>(() => ({
    products,
    allProducts,
    catalogReady,
    catalogSource,
    cartItems,
    addToCart(product, quantity = 1, weight) {
      const qty = Math.max(1, Math.floor(quantity));
      if (product.stock <= 0) {
        return { ok: false, message: `${product.name} is out of stock` };
      }
      const existing = cartRef.current.find((item) => item.product.id === product.id);
      const desired = (existing?.quantity || 0) + qty;
      if ((existing?.quantity || 0) >= product.stock) {
        return { ok: false, message: `Only ${product.stock} of ${product.name} available` };
      }
      const nextQty = Math.min(desired, product.stock);
      setCartItems((prev) => {
        const index = prev.findIndex((item) => item.product.id === product.id);
        if (index === -1) {
          return [...prev, { product, quantity: nextQty, selectedWeight: weight || 'Standard' }];
        }
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          product,
          quantity: nextQty,
          selectedWeight: weight || copy[index].selectedWeight,
        };
        return copy;
      });
      if (nextQty < desired) {
        return { ok: true, message: `Only ${product.stock} in stock — cart updated to ${nextQty}` };
      }
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
  }), [products, allProducts, catalogReady, catalogSource, cartItems]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used within ShopProvider');
  return ctx;
}
