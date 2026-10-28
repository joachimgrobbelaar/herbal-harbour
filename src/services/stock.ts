import type { StockMovement } from '../types';
import { api, movementFromApi } from './api';

export async function adjustStock(input: { productId: string; delta: number; reason: string }): Promise<number> {
  const data = await api<{ stock: number }>('/admin/stock', { body: input });
  return data.stock;
}

export async function fetchMovements(): Promise<StockMovement[]> {
  const data = await api<{ movements: StockMovement[] }>('/admin/movements');
  return data.movements.map(movementFromApi);
}
