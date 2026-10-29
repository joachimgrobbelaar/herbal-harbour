import { auth, API_BASE } from '../lib/firebase';
import type { Product, ShopOrder, StockMovement, StoredCartLine } from '../types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean; timeoutMs?: number } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (init.auth !== false && auth.currentUser) {
    headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
  }
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), init.timeoutMs ?? 10000);
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, 'The shop API is not reachable.');
  } finally {
    window.clearTimeout(timer);
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
  const data = await api<{ products: Product[] }>(path, { auth: all, timeoutMs: 10000 });
  return data.products;
}

/** Public catalogue only. Retries a slow or failed request before giving up. */
export async function fetchPublicCatalogue(): Promise<Product[]> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetchCatalogue(false);
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        await new Promise((resolve) => window.setTimeout(resolve, 400 * (attempt + 1)));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('The shop API is not reachable.');
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
