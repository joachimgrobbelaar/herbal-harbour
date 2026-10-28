import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type Timestamp } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { google, type sheets_v4 } from 'googleapis';

initializeApp();

// Deploy in the same region as the Firestore database. Change this if the
// database is created somewhere else (Firebase console → Firestore → location).
setGlobalOptions({ region: 'europe-west1', memory: '256MiB', timeoutSeconds: 60, maxInstances: 5 });

const spreadsheetParam = defineString('SHEETS_SPREADSHEET_ID', { default: '' });

const PRODUCTS_HEADERS = ['id', 'name', 'category', 'strainType', 'price', 'stock', 'lowStockThreshold', 'inStock', 'active', 'updatedAt'];
const ORDERS_HEADERS = ['id', 'orderNumber', 'createdAt', 'channel', 'status', 'customerName', 'email', 'phone', 'paymentMethod', 'subtotal', 'discount', 'shipping', 'total', 'itemsSummary'];
const MOVEMENT_HEADERS = ['id', 'createdAt', 'productId', 'productName', 'delta', 'stockAfter', 'reason', 'channel', 'orderId', 'userId'];

type Cell = string | number | boolean;

function iso(value: unknown): string {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  return '';
}

async function spreadsheetId(): Promise<string> {
  const fromEnv = (spreadsheetParam.value() || process.env.SHEETS_SPREADSHEET_ID || '').trim();
  if (fromEnv) return fromEnv;
  const snap = await getFirestore().doc('config/sheets').get();
  return String(snap.get('spreadsheetId') || '').trim();
}

function sheetsClient() {
  const raw = process.env.SHEETS_SERVICE_ACCOUNT;
  const auth = raw
    ? new google.auth.GoogleAuth({
        credentials: JSON.parse(raw) as Record<string, string>,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })
    : new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
  return google.sheets({ version: 'v4', auth });
}

async function ensureTab(sheets: sheets_v4.Sheets, id: string, title: string, headers: string[]) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: id });
  const exists = meta.data.sheets?.some((sheet) => sheet.properties?.title === title);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: id,
      requestBody: { requests: [{ addSheet: { properties: { title } } }] },
    });
  }
  const head = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${title}!1:1` });
  if (!head.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: `${title}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    });
  }
}

async function upsert(title: string, headers: string[], idValue: string, row: Cell[]) {
  const id = await spreadsheetId();
  if (!id) {
    logger.info('Sheets sync skipped: set SHEETS_SPREADSHEET_ID or Firestore config/sheets.spreadsheetId.');
    return;
  }
  const sheets = sheetsClient();
  await ensureTab(sheets, id, title, headers);
  const column = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${title}!A:A` });
  const values = column.data.values || [];
  const index = values.findIndex((entry, rowIndex) => rowIndex > 0 && entry[0] === idValue);
  if (index === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: id,
      range: `${title}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });
    return;
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: id,
    range: `${title}!A${index + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
}

async function sync(work: () => Promise<void>) {
  try {
    await work();
  } catch (error) {
    const status = typeof error === 'object' && error && 'code' in error ? Number((error as { code: number }).code) : 0;
    logger.error('Google Sheets sync failed', error);
    if (status === 403 || status === 404) return;
    throw error;
  }
}

export const syncProductToSheet = onDocumentWritten('products/{productId}', async (event) => {
  const id = event.params.productId;
  const after = event.data?.after?.data();
  await sync(async () => {
    if (!after) {
      await upsert('Products', PRODUCTS_HEADERS, id, [id, '', '', '', '', '', '', '', 'deleted', '']);
      return;
    }
    await upsert('Products', PRODUCTS_HEADERS, id, [
      id,
      String(after.name || ''),
      String(after.category || ''),
      String(after.strainType || ''),
      Number(after.price) || 0,
      Number(after.stock) || 0,
      Number(after.lowStockThreshold) || 0,
      Boolean(after.inStock),
      after.active !== false,
      iso(after.updatedAt),
    ]);
  });
});

export const syncOrderToSheet = onDocumentWritten('orders/{orderId}', async (event) => {
  const id = event.params.orderId;
  const after = event.data?.after?.data();
  if (!after) return;
  const items = Array.isArray(after.items)
    ? after.items.map((item: { quantity?: number; name?: string }) => `${item.quantity || 0}x ${item.name || ''}`).join('; ')
    : '';
  await sync(() => upsert('Orders', ORDERS_HEADERS, id, [
    id,
    String(after.orderNumber || ''),
    iso(after.createdAt),
    String(after.channel || ''),
    String(after.status || ''),
    String(after.customerName || ''),
    String(after.email || ''),
    String(after.phone || ''),
    String(after.paymentMethod || ''),
    Number(after.subtotal) || 0,
    Number(after.discount) || 0,
    Number(after.shipping) || 0,
    Number(after.total) || 0,
    items,
  ]));
});

export const syncMovementToSheet = onDocumentWritten('stockMovements/{movementId}', async (event) => {
  const id = event.params.movementId;
  const after = event.data?.after?.data();
  if (!after) return;
  await sync(() => upsert('StockMovements', MOVEMENT_HEADERS, id, [
    id,
    iso(after.createdAt),
    String(after.productId || ''),
    String(after.productName || ''),
    Number(after.delta) || 0,
    Number(after.stockAfter) || 0,
    String(after.reason || ''),
    String(after.channel || ''),
    String(after.orderId || ''),
    String(after.userId || ''),
  ]));
});
