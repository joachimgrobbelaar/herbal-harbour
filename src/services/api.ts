import { auth, API_BASE } from '../lib/firebase';
import type { Product, ShopOrder, StockMovement, StoredCartLine } from '../types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (init.auth !== false && auth.currentUser) {
    headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'The shop API is not reachable.');
  }
  const text = await response.text();
  const data = text ? JSON.parse(text) as { error?: string } : {};
  if (!response.ok) {
    throw new ApiError(response.status, data.error || `The shop API returned ${response.status}.`);
  }
  return data as T;
}

export function orderFromApi(data: ShopOrder): ShopOrder {
  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : null,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
  };
}

export function movementFromApi(data: StockMovement): StockMovement {
  return { ...data, createdAt: data.createdAt ? new Date(data.createdAt) : null };
}

export async function fetchCatalogue(all = false): Promise<Product[]> {
  const path = all ? '/admin/products' : '/products';
  const data = await api<{ products: Product[] }>(path, { auth: all });
  return data.products;
}

export async function fetchCart(): Promise<StoredCartLine[]> {
  const data = await api<{ items: StoredCartLine[] }>('/cart');
  return data.items;
}

export async function saveCart(items: StoredCartLine[]): Promise<StoredCartLine[]> {
  const data = await api<{ items: StoredCartLine[] }>('/cart', { method: 'PUT', body: { items } });
  return data.items;
}

export async function mergeCart(items: StoredCartLine[]): Promise<StoredCartLine[]> {
  const data = await api<{ items: StoredCartLine[] }>('/cart/merge', { body: { items } });
  return data.items;
}
