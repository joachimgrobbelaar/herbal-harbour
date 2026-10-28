import { Product, ProductCategory, StrainType } from '../types';

export interface GoogleSheetConfig {
  sheetUrl: string;
  sheetId: string;
  lastSynced?: string;
  enabled: boolean;
}

/**
 * Extracts Google Sheet ID from URL or bare ID
 */
export function extractSheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // If it's already an ID
  if (/^[a-zA-Z0-9-_]{20,60}$/.test(trimmed)) {
    return trimmed;
  }
  // Try regex for docs.google.com/spreadsheets/d/{id}
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Parses CSV text into array of rows
 */
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((f) => f.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Converts CSV rows to Product items
 */
export function convertRowsToProducts(rows: string[][]): Product[] {
  if (rows.length < 2) return [];

  // Identify column indices from header row
  const headers = rows[0].map((h) => h.toLowerCase().trim());
  
  const nameIdx = headers.findIndex((h) => h.includes('name') || h.includes('item') || h.includes('product') || h.includes('title'));
  const priceIdx = headers.findIndex((h) => h.includes('price') || h.includes('zar') || h.includes('cost') || h.includes('amount'));
  const categoryIdx = headers.findIndex((h) => h.includes('cat') || h.includes('type'));
  const strainIdx = headers.findIndex((h) => h.includes('strain') || h.includes('lineage') || h.includes('sativa') || h.includes('indica'));
  const thcIdx = headers.findIndex((h) => h.includes('thc'));
  const cbdIdx = headers.findIndex((h) => h.includes('cbd'));
  const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('detail') || h.includes('info'));
  const stockIdx = headers.findIndex((h) => h.includes('stock') || h.includes('avail'));

  const results: Product[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : `Item #${r}`;
    if (!name || name === '') continue;

    // Parse price
    let rawPrice = priceIdx !== -1 && row[priceIdx] ? row[priceIdx] : '150';
    // Remove R, $, commas, spaces
    rawPrice = rawPrice.replace(/[^0-9.]/g, '');
    const price = parseFloat(rawPrice) || 150;

    // Category
    let category: ProductCategory = 'flower';
    const catStr = categoryIdx !== -1 && row[categoryIdx] ? row[categoryIdx].toLowerCase() : '';
    if (catStr.includes('seed')) category = 'seeds';
    else if (catStr.includes('oil') || catStr.includes('tincture') || catStr.includes('drop')) category = 'tinctures';
    else if (catStr.includes('edible') || catStr.includes('gummy')) category = 'edibles';
    else if (catStr.includes('rosin') || catStr.includes('concentrate') || catStr.includes('extract') || catStr.includes('wax')) category = 'concentrates';
    else if (catStr.includes('balm') || catStr.includes('salve') || catStr.includes('cream') || catStr.includes('topical')) category = 'topicals';

    // Strain Type
    let strainType: StrainType = 'Hybrid';
    const strainStr = strainIdx !== -1 && row[strainIdx] ? row[strainIdx].toLowerCase() : '';
    if (strainStr.includes('sativa')) strainType = 'Sativa';
    else if (strainStr.includes('indica')) strainType = 'Indica';
    else if (strainStr.includes('cbd')) strainType = 'CBD-Rich';

    const thc = thcIdx !== -1 && row[thcIdx] ? row[thcIdx] : '18.00-22.00%';
    const cbd = cbdIdx !== -1 && row[cbdIdx] ? row[cbdIdx] : '0.10-1.00%';
    const desc = descIdx !== -1 && row[descIdx] ? row[descIdx] : 'Imported directly from synced Google Sheet inventory. Lab tested and certified.';
    let stock = 12;
    if (stockIdx !== -1 && row[stockIdx]) {
      const digits = row[stockIdx].replace(/[^0-9]/g, '');
      if (digits) stock = parseInt(digits, 10);
      else if (/out|no/i.test(row[stockIdx])) stock = 0;
    }
    const inStock = stock > 0;

    results.push({
      id: `gsheet-${r}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name,
      subtitle: `${category.toUpperCase()} • Synced from Google Sheets`,
      category,
      categoryLabel: category.charAt(0).toUpperCase() + category.slice(1),
      strainType,
      price,
      rating: 4.9,
      reviewCount: 12 + (r * 3) % 25,
      thc: thc.includes('%') ? thc : `${thc}%`,
      cbd: cbd.includes('%') ? cbd : `${cbd}%`,
      terpenes: ['Myrcene', 'Caryophyllene', 'Limonene'],
      effects: ['Relaxed', 'Therapeutic', 'Calm'],
      medicalUses: ['Stress Relief', 'Daily Wellness', 'Pain Support'],
      description: desc,
      dosageGuide: 'Consult physician or start with micro-dose. Store in cool, dark place.',
      inStock,
      stock,
      lowStockThreshold: 5,
      active: true,
      labTestedDate: 'Oct 2026',
      batchNumber: `GS-INV-${r.toString().padStart(3, '0')}`,
      imageUrl: '',
      colorGradient: 'from-emerald-100 to-amber-100'
    });
  }

  return results;
}

/**
 * Fetch and sync products from a public Google Sheet ID
 */
export async function fetchGoogleSheetProducts(sheetId: string): Promise<Product[]> {
  // Try Google's gviz CSV output endpoint (works on any sheet shared as 'Anyone with the link can view')
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
  
  try {
    const res = await fetch(gvizUrl);
    if (!res.ok) {
      throw new Error(`Google Sheets responded with HTTP ${res.status}`);
    }
    const csvData = await res.text();
    const rows = parseCSV(csvData);
    const products = convertRowsToProducts(rows);
    if (products.length === 0) {
      throw new Error('No items parsed from Google Sheet. Check your column headers (Name, Price, Category).');
    }
    return products;
  } catch (error: any) {
    // If CORS or restriction occurs, try the export endpoint
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    try {
      const res = await fetch(exportUrl);
      if (!res.ok) throw error;
      const csvData = await res.text();
      const rows = parseCSV(csvData);
      return convertRowsToProducts(rows);
    } catch {
      throw error;
    }
  }
}
