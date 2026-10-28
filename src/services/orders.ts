import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import type {
  CartItem,
  CheckoutDetails,
  OrderChannel,
  OrderLine,
  OrderStatus,
  PaymentMethod,
  ShopOrder,
} from '../types';

export interface PlaceSaleInput {
  userId: string;
  channel: OrderChannel;
  status: Extract<OrderStatus, 'pending' | 'paid' | 'collected'>;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
  notes?: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

function aggregate(items: CartItem[]): Map<string, { item: CartItem; quantity: number }> {
  const map = new Map<string, { item: CartItem; quantity: number }>();
  for (const item of items) {
    const current = map.get(item.product.id);
    const quantity = (current?.quantity || 0) + item.quantity;
    map.set(item.product.id, { item, quantity });
  }
  return map;
}

function asDate(value: unknown): Date | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate();
  }
  return null;
}

export function orderFromSnapshot(id: string, data: Record<string, unknown>): ShopOrder {
  const items = Array.isArray(data.items) ? (data.items as OrderLine[]) : [];
  const quantities: Record<string, number> = {};
  if (data.quantities && typeof data.quantities === 'object') {
    for (const [key, value] of Object.entries(data.quantities as Record<string, unknown>)) {
      quantities[key] = Math.floor(Number(value) || 0);
    }
  }
  return {
    id,
    orderNumber: String(data.orderNumber || id),
    userId: String(data.userId || ''),
    customerName: String(data.customerName || ''),
    email: String(data.email || ''),
    phone: String(data.phone || ''),
    address: String(data.address || ''),
    city: String(data.city || ''),
    postalCode: String(data.postalCode || ''),
    province: String(data.province || ''),
    notes: String(data.notes || ''),
    paymentMethod: data.paymentMethod === 'pay_on_collection' ? 'pay_on_collection' : 'eft',
    channel: data.channel === 'pos' ? 'pos' : 'online',
    status: (['pending', 'paid', 'collected', 'cancelled'].includes(String(data.status))
      ? data.status
      : 'pending') as ShopOrder['status'],
    items,
    quantities,
    subtotal: Number(data.subtotal) || 0,
    discount: Number(data.discount) || 0,
    shipping: Number(data.shipping) || 0,
    total: Number(data.total) || 0,
    stockApplied: data.stockApplied !== false,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

/**
 * Creates an order and decrements stock in one transaction.
 * Online orders are created as pending. POS orders may be paid immediately.
 * Security rules only allow the stock decrease when it matches this new order.
 */
export async function placeSale(input: PlaceSaleInput): Promise<ShopOrder> {
  if (!input.items.length) throw new Error('Add at least one item before checking out.');
  const db = getDb();
  const grouped = aggregate(input.items);
  const orderRef = doc(collection(db, 'orders'));

  await runTransaction(db, async (tx) => {
    const reads: { id: string; quantity: number; name: string; price: number; weight?: string; stock: number; ref: ReturnType<typeof doc> }[] = [];
    for (const [productId, entry] of grouped) {
      const ref = doc(db, 'products', productId);
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error(`${entry.item.product.name} is no longer in the catalogue.`);
      const data = snap.data();
      const stock = Math.floor(Number(data.stock) || 0);
      if (data.active === false) throw new Error(`${entry.item.product.name} is not for sale.`);
      if (stock < entry.quantity) {
        throw new Error(stock <= 0
          ? `${entry.item.product.name} is out of stock.`
          : `Only ${stock} of ${entry.item.product.name} left.`);
      }
      reads.push({
        id: productId,
        quantity: entry.quantity,
        name: String(data.name || entry.item.product.name),
        price: Number(data.price ?? entry.item.product.price),
        weight: entry.item.selectedWeight,
        stock,
        ref,
      });
    }

    const quantities: Record<string, number> = {};
    const items: OrderLine[] = reads.map((row) => {
      quantities[row.id] = row.quantity;
      const line: OrderLine = {
        productId: row.id,
        name: row.name,
        price: row.price,
        quantity: row.quantity,
      };
      if (row.weight) line.selectedWeight = row.weight;
      return line;
    });

    const subtotal = items.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const orderNumber = `HH-${orderRef.id.slice(0, 6).toUpperCase()}`;

    tx.set(orderRef, {
      orderNumber,
      userId: input.userId,
      customerName: input.customerName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      postalCode: input.postalCode,
      province: input.province,
      notes: input.notes || '',
      paymentMethod: input.paymentMethod,
      channel: input.channel,
      status: input.status,
      items,
      quantities,
      subtotal,
      discount: input.discount,
      shipping: input.shipping,
      total: input.total,
      stockApplied: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    for (const row of reads) {
      const next = row.stock - row.quantity;
      tx.update(row.ref, {
        stock: next,
        inStock: next > 0,
        updatedAt: serverTimestamp(),
        lastStockOrderId: orderRef.id,
      });
      tx.set(doc(collection(db, 'stockMovements')), {
        productId: row.id,
        productName: row.name,
        delta: -row.quantity,
        stockAfter: next,
        reason: input.channel === 'pos' ? 'In-store sale' : 'Online order',
        channel: input.channel,
        orderId: orderRef.id,
        userId: input.userId,
        createdAt: serverTimestamp(),
      });
    }
  });

  return {
    id: orderRef.id,
    orderNumber: `HH-${orderRef.id.slice(0, 6).toUpperCase()}`,
    userId: input.userId,
    customerName: input.customerName,
    email: input.email,
    phone: input.phone,
    address: input.address,
    city: input.city,
    postalCode: input.postalCode,
    province: input.province,
    notes: input.notes || '',
    paymentMethod: input.paymentMethod,
    channel: input.channel,
    status: input.status,
    items: input.items.map((item) => ({
      productId: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      selectedWeight: item.selectedWeight,
    })),
    quantities: Object.fromEntries([...grouped.entries()].map(([id, entry]) => [id, entry.quantity])),
    subtotal: input.subtotal,
    discount: input.discount,
    shipping: input.shipping,
    total: input.total,
    stockApplied: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function checkoutToSale(
  userId: string,
  items: CartItem[],
  details: CheckoutDetails,
  amounts: { subtotal: number; discount: number; shipping: number; total: number }
): PlaceSaleInput {
  return {
    userId,
    channel: 'online',
    status: 'pending',
    paymentMethod: details.paymentMethod,
    items,
    customerName: details.customerName,
    email: details.email,
    phone: details.phone,
    address: details.address,
    city: details.city,
    postalCode: details.postalCode,
    province: details.province,
    notes: details.notes,
    ...amounts,
  };
}

/** Cancels a pending or paid order and returns the units to stock. */
export async function cancelOrder(orderId: string, actorId: string): Promise<void> {
  const db = getDb();
  const orderRef = doc(db, 'orders', orderId);
  await runTransaction(db, async (tx) => {
    const orderSnap = await tx.get(orderRef);
    if (!orderSnap.exists()) throw new Error('Order not found.');
    const order = orderSnap.data();
    if (order.status === 'cancelled') throw new Error('This order is already cancelled.');
    if (order.status === 'collected') throw new Error('Collected orders cannot be cancelled here.');
    if (order.status !== 'pending' && order.status !== 'paid') {
      throw new Error('This order can no longer be cancelled.');
    }
    const quantities = order.quantities as Record<string, number>;
    const productIds = Object.keys(quantities || {});
    const productSnaps = [];
    for (const productId of productIds) {
      const ref = doc(db, 'products', productId);
      const snap = await tx.get(ref);
      productSnaps.push({ productId, ref, snap, qty: Math.floor(Number(quantities[productId]) || 0) });
    }
    for (const row of productSnaps) {
      if (!row.snap.exists() || row.qty <= 0) continue;
      const prev = Math.floor(Number(row.snap.data().stock) || 0);
      const next = prev + row.qty;
      tx.update(row.ref, {
        stock: next,
        inStock: next > 0,
        updatedAt: serverTimestamp(),
        lastStockOrderId: orderId,
      });
      tx.set(doc(collection(db, 'stockMovements')), {
        productId: row.productId,
        productName: String(row.snap.data().name || row.productId),
        delta: row.qty,
        stockAfter: next,
        reason: 'Order cancelled — stock returned',
        channel: 'cancel',
        orderId,
        userId: actorId,
        createdAt: serverTimestamp(),
      });
    }
    tx.update(orderRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
      cancelledAt: serverTimestamp(),
    });
  });
}

/** Moves an order to paid or collected without touching stock. */
export async function markOrderStatus(orderId: string, status: 'paid' | 'collected'): Promise<void> {
  const db = getDb();
  const patch: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (status === 'paid') patch.paidAt = serverTimestamp();
  if (status === 'collected') patch.collectedAt = serverTimestamp();
  await updateDoc(doc(db, 'orders', orderId), patch);
}
