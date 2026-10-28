import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { PRODUCTS } from '../src/data/products.ts';
import { productToFirestore } from '../src/lib/productMap.ts';
import { initAdmin } from './admin-app.ts';

initAdmin();

const resetStock = process.argv.includes('--reset-stock');
const db = getFirestore();

let created = 0;
let updated = 0;

for (const product of PRODUCTS) {
  const ref = db.collection('products').doc(product.id);
  const existing = await ref.get();
  const payload = productToFirestore(product);
  if (existing.exists && !resetStock) {
    delete payload.stock;
    delete payload.inStock;
    updated += 1;
  } else {
    created += 1;
  }
  await ref.set({ ...payload, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  console.log(`${existing.exists ? 'updated' : 'created'} ${product.id}`);
}

console.log(`Seed finished. ${created} written with stock, ${updated} refreshed without changing stock.`);
console.log('Re-run with --reset-stock to overwrite on-hand quantities from src/data/products.ts.');
