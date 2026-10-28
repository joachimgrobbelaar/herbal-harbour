import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getDb } from '../lib/firebase';

export async function adjustStock(input: {
  productId: string;
  delta: number;
  reason: string;
  userId: string;
}): Promise<number> {
  const delta = Math.trunc(input.delta);
  if (!delta) throw new Error('Enter a stock change other than zero.');
  if (!input.reason.trim()) throw new Error('Add a reason for the stock adjustment.');
  const db = getDb();
  const ref = doc(db, 'products', input.productId);
  let stockAfter = 0;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Product not found.');
    const prev = Math.floor(Number(snap.data().stock) || 0);
    const next = prev + delta;
    if (next < 0) throw new Error(`Cannot remove ${Math.abs(delta)}. Only ${prev} on hand.`);
    stockAfter = next;
    tx.update(ref, {
      stock: next,
      inStock: next > 0,
      updatedAt: serverTimestamp(),
    });
    tx.set(doc(collection(db, 'stockMovements')), {
      productId: input.productId,
      productName: String(snap.data().name || input.productId),
      delta,
      stockAfter: next,
      reason: input.reason.trim(),
      channel: 'adjustment',
      userId: input.userId,
      createdAt: serverTimestamp(),
    });
  });
  return stockAfter;
}
