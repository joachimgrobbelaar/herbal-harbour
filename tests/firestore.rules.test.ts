import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, describe, it } from 'node:test';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, runTransaction, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const hostPort = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const [host, portString] = hostPort.split(':');

let testEnv: RulesTestEnvironment;

function onlineOrder(userId: string, quantities: Record<string, number>) {
  return {
    orderNumber: 'HH-TEST01',
    userId,
    customerName: 'Test Patient',
    email: 'patient@example.com',
    phone: '0820000000',
    address: '1 Harbour Road',
    city: 'Cape Town',
    postalCode: '8001',
    province: 'Western Cape',
    notes: '',
    paymentMethod: 'eft',
    channel: 'online',
    status: 'pending',
    items: Object.entries(quantities).map(([productId, quantity]) => ({
      productId,
      name: 'Tangerine Dream',
      price: 180,
      quantity,
    })),
    quantities,
    subtotal: 180,
    discount: 0,
    shipping: 0,
    total: 180,
    stockApplied: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function seedProduct(stock = 10) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'products', 'flower'), {
      name: 'Tangerine Dream',
      price: 180,
      stock,
      inStock: stock > 0,
      active: true,
    });
  });
}

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-herbal-harbour',
    firestore: {
      rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
      host,
      port: Number(portString),
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await seedProduct();
});

describe('catalogue and roles', () => {
  it('lets anyone read products and blocks anonymous writes', async () => {
    const guest = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(guest, 'products', 'flower')));
    await assertFails(updateDoc(doc(guest, 'products', 'flower'), { price: 1 }));
  });

  it('stops a customer editing price or granting themselves admin', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(updateDoc(doc(alice, 'products', 'flower'), { price: 1 }));
    await assertFails(setDoc(doc(alice, 'roles', 'alice'), { admin: true }));
  });

  it('lets a roles document or custom claim administer products', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'roles', 'manager'), { admin: true, email: 'manager@example.com' });
    });
    const manager = testEnv.authenticatedContext('manager').firestore();
    const owner = testEnv.authenticatedContext('owner', { admin: true }).firestore();
    await assertSucceeds(updateDoc(doc(manager, 'products', 'flower'), { price: 200 }));
    await assertSucceeds(updateDoc(doc(owner, 'products', 'flower'), { name: 'Renamed' }));
  });
});

describe('carts and orders', () => {
  it('keeps carts and orders private to the owner', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    await assertSucceeds(setDoc(doc(alice, 'carts', 'alice'), { userId: 'alice', items: [] }));
    await assertFails(getDoc(doc(bob, 'carts', 'alice')));
    await assertSucceeds(setDoc(doc(alice, 'orders', 'a1'), onlineOrder('alice', { flower: 1 })));
    await assertFails(getDoc(doc(bob, 'orders', 'a1')));
    await assertFails(setDoc(doc(alice, 'orders', 'spoof'), onlineOrder('bob', { flower: 1 })));
    await assertFails(setDoc(doc(alice, 'orders', 'pos'), {
      ...onlineOrder('alice', { flower: 1 }),
      channel: 'pos',
      status: 'paid',
    }));
  });
});

describe('stock transactions', () => {
  it('decrements stock only together with a matching new online order', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(runTransaction(db, async (tx) => {
      tx.set(doc(db, 'orders', 'order1'), onlineOrder('alice', { flower: 2 }));
      tx.update(doc(db, 'products', 'flower'), {
        stock: 8,
        inStock: true,
        updatedAt: serverTimestamp(),
        lastStockOrderId: 'order1',
      });
      tx.set(doc(db, 'stockMovements', 'move1'), {
        productId: 'flower',
        productName: 'Tangerine Dream',
        delta: -2,
        stockAfter: 8,
        reason: 'Online order',
        channel: 'online',
        orderId: 'order1',
        userId: 'alice',
        createdAt: serverTimestamp(),
      });
    }));

    await assertFails(updateDoc(doc(db, 'products', 'flower'), {
      stock: 7,
      inStock: true,
      updatedAt: serverTimestamp(),
      lastStockOrderId: 'order1',
    }));

    await assertFails(runTransaction(db, async (tx) => {
      tx.set(doc(db, 'orders', 'order2'), onlineOrder('alice', { flower: 1 }));
      tx.update(doc(db, 'products', 'flower'), {
        stock: 4,
        inStock: true,
        updatedAt: serverTimestamp(),
        lastStockOrderId: 'order2',
      });
    }));
  });

  it('restocks when the buyer cancels, and only once', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'products', 'flower'), { name: 'Tangerine Dream', price: 180, stock: 8, inStock: true, active: true, lastStockOrderId: 'order1' });
      await setDoc(doc(db, 'orders', 'order1'), {
        ...onlineOrder('alice', { flower: 2 }),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    const db = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(runTransaction(db, async (tx) => {
      tx.update(doc(db, 'orders', 'order1'), {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
        cancelledAt: serverTimestamp(),
      });
      tx.update(doc(db, 'products', 'flower'), {
        stock: 10,
        inStock: true,
        updatedAt: serverTimestamp(),
        lastStockOrderId: 'order1',
      });
      tx.set(doc(db, 'stockMovements', 'restock1'), {
        productId: 'flower',
        productName: 'Tangerine Dream',
        delta: 2,
        stockAfter: 10,
        reason: 'Order cancelled',
        channel: 'cancel',
        orderId: 'order1',
        userId: 'alice',
        createdAt: serverTimestamp(),
      });
    }));

    await assertFails(runTransaction(db, async (tx) => {
      tx.update(doc(db, 'products', 'flower'), {
        stock: 12,
        inStock: true,
        updatedAt: serverTimestamp(),
        lastStockOrderId: 'order1',
      });
    }));
    await assertFails(updateDoc(doc(db, 'orders', 'order1'), { status: 'paid', paidAt: serverTimestamp(), updatedAt: serverTimestamp() }));
  });

  it('lets an admin record a POS sale and read the movement log', async () => {
    const admin = testEnv.authenticatedContext('owner', { admin: true }).firestore();
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(setDoc(doc(admin, 'orders', 'pos1'), {
      orderNumber: 'HH-POS001',
      userId: 'owner',
      customerName: 'Walk-in',
      email: 'pos@herbalharbour.co.za',
      phone: 'in-store',
      paymentMethod: 'pay_on_collection',
      channel: 'pos',
      status: 'paid',
      items: [{ productId: 'flower', name: 'Tangerine Dream', price: 180, quantity: 1 }],
      quantities: { flower: 1 },
      subtotal: 180,
      discount: 0,
      shipping: 0,
      total: 180,
      stockApplied: true,
      notes: 'Point of sale',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    await assertSucceeds(updateDoc(doc(admin, 'products', 'flower'), { stock: 9, inStock: true }));
    await assertSucceeds(setDoc(doc(admin, 'stockMovements', 'pos-move'), {
      productId: 'flower',
      productName: 'Tangerine Dream',
      delta: -1,
      stockAfter: 9,
      reason: 'In-store sale',
      channel: 'pos',
      orderId: 'pos1',
      userId: 'owner',
      createdAt: serverTimestamp(),
    }));
    await assertSucceeds(getDoc(doc(admin, 'stockMovements', 'pos-move')));
    await assertFails(getDoc(doc(alice, 'stockMovements', 'pos-move')));
    await assertSucceeds(setDoc(doc(admin, 'config', 'sheets'), { spreadsheetId: 'sheet-id', updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(alice, 'config', 'sheets'), { spreadsheetId: 'nope', updatedAt: serverTimestamp() }));
  });
});
