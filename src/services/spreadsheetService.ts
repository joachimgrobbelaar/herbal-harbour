import * as XLSX from 'xlsx';
import { Product, ProductCategory, StrainType } from '../types';

export interface SpreadsheetParseResult {
  products: Product[];
  totalRows: number;
  validCount: number;
  categoriesFound: string[];
  saleCount: number;
  errors: string[];
}

const CATEGORY_MODELS: Record<ProductCategory, string> = {
  flower: 'assets/models/weed_nug_1.glb',
  psilocybin: 'assets/models/psilocybin_mushroom.glb',
  seeds: 'assets/models/seed.glb',
  tinctures: 'assets/models/vape_pen.glb',
  edibles: 'assets/models/brownie_01.glb',
  concentrates: 'assets/models/glass_bong.glb',
  topicals: 'assets/models/cream_bottle.glb'
};

const CATEGORY_IMAGES: Record<ProductCategory, string> = {
  flower: 'assets/products/tangerine-dream.jpg',
  psilocybin: 'assets/products/golden-teacher.jpg',
  seeds: 'assets/products/durban-seeds.jpg',
  tinctures: 'assets/products/cbd-oil.jpg',
  edibles: 'assets/products/gummies.jpg',
  concentrates: 'assets/products/rosin.jpg',
  topicals: 'assets/products/balm.jpg'
};

/**
 * Extracts Google Sheet ID from URL or bare ID
 */
export function extractSheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9-_]{20,60}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Parses raw 2D array of rows into typed Product records
 */
export function convertRowsToProducts(rows: (string | number | boolean | null | undefined)[][]): Product[] {
  if (rows.length < 2) return [];

  // Locate headers (first non-empty row)
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i] || [];
    const textCells = row.filter((c) => c !== null && c !== undefined && String(c).trim().length > 0);
    if (textCells.length >= 2) {
      headerRowIdx = i;
      break;
    }
  }

  const rawHeaders = (rows[headerRowIdx] || []).map((h) => String(h || '').toLowerCase().trim());

  // Header column index matching
  const findCol = (terms: string[]) => {
    return rawHeaders.findIndex((h) => terms.some((term) => h.includes(term)));
  };

  const nameIdx = findCol(['name', 'title', 'product', 'item', 'strain name']);
  const priceIdx = findCol(['price', 'cost', 'zar', 'amount', 'selling', 'retail']);
  const origPriceIdx = findCol(['original', 'was', 'regular', 'rrp', 'before']);
  const saleIdx = findCol(['sale', 'on sale', 'promo', 'discount']);
  const catIdx = findCol(['cat', 'type', 'group', 'section']);
  const strainIdx = findCol(['strain', 'lineage', 'sativa', 'indica', 'variety']);
  const thcIdx = findCol(['thc', 'potency']);
  const cbdIdx = findCol(['cbd']);
  const descIdx = findCol(['desc', 'detail', 'info', 'note']);
  const stockIdx = findCol(['stock', 'avail', 'qty', 'quantity', 'inventory']);
  const imageIdx = findCol(['image', 'photo', 'picture', 'img']);
  const badgeIdx = findCol(['badge', 'tag', 'label']);
  const terpeneIdx = findCol(['terpene', 'terp']);
  const effectIdx = findCol(['effect', 'feeling']);

  const results: Product[] = [];

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const rawName = nameIdx !== -1 && row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
    if (!rawName) continue;

    // Parse current selling price
    let rawPrice = priceIdx !== -1 && row[priceIdx] !== undefined ? String(row[priceIdx]) : '180';
    rawPrice = rawPrice.replace(/[^0-9.]/g, '');
    const price = Math.max(1, parseFloat(rawPrice) || 180);

    // Parse original price or sale price
    let originalPrice: number | undefined = undefined;
    if (origPriceIdx !== -1 && row[origPriceIdx] !== undefined) {
      const rawOrig = String(row[origPriceIdx]).replace(/[^0-9.]/g, '');
      const parsedOrig = parseFloat(rawOrig);
      if (parsedOrig > price) originalPrice = parsedOrig;
    }

    // Determine On Sale status
    let isSale = false;
    if (saleIdx !== -1 && row[saleIdx] !== undefined) {
      const saleVal = String(row[saleIdx]).toLowerCase().trim();
      isSale = saleVal === 'true' || saleVal === 'yes' || saleVal === '1' || saleVal === 'sale' || saleVal === 'y';
    }
    if (originalPrice && originalPrice > price) {
      isSale = true;
    }

    // Determine category
    let category: ProductCategory = 'flower';
    const catStr = catIdx !== -1 && row[catIdx] !== undefined ? String(row[catIdx]).toLowerCase() : '';
    const nameLower = rawName.toLowerCase();

    if (catStr.includes('psilocybin') || catStr.includes('shroom') || catStr.includes('mushroom') || catStr.includes('mycology') || nameLower.includes('mushroom') || nameLower.includes('golden teacher')) {
      category = 'psilocybin';
    } else if (catStr.includes('seed') || nameLower.includes('seed') || nameLower.includes('autoflower') || nameLower.includes('fem')) {
      category = 'seeds';
    } else if (catStr.includes('oil') || catStr.includes('tincture') || catStr.includes('drop') || nameLower.includes('tincture') || nameLower.includes('drops')) {
      category = 'tinctures';
    } else if (catStr.includes('edible') || catStr.includes('gummy') || catStr.includes('brownie') || catStr.includes('chocolate') || nameLower.includes('gummies')) {
      category = 'edibles';
    } else if (catStr.includes('rosin') || catStr.includes('concentrate') || catStr.includes('extract') || catStr.includes('wax') || catStr.includes('shatter')) {
      category = 'concentrates';
    } else if (catStr.includes('balm') || catStr.includes('salve') || catStr.includes('cream') || catStr.includes('topical') || catStr.includes('lotion')) {
      category = 'topicals';
    } else {
      category = 'flower';
    }

    // Category Label
    const categoryLabels: Record<ProductCategory, string> = {
      flower: 'Craft Flower',
      psilocybin: 'Sacred Mycology & Microdosing',
      seeds: 'Medicinal Seeds',
      tinctures: 'CBD Tinctures',
      edibles: 'Edibles & Wellness',
      concentrates: 'Pure Concentrates',
      topicals: 'Topicals & Balms'
    };

    // Strain Type
    let strainType: StrainType = 'Hybrid';
    const strainStr = (strainIdx !== -1 && row[strainIdx] !== undefined ? String(row[strainIdx]) : '').toLowerCase();
    if (strainStr.includes('sativa') || nameLower.includes('sativa')) strainType = 'Sativa';
    else if (strainStr.includes('indica') || nameLower.includes('indica')) strainType = 'Indica';
    else if (strainStr.includes('cbd') || nameLower.includes('cbd')) strainType = 'CBD-Rich';

    // Cannabinoid percentages
    const rawThc = thcIdx !== -1 && row[thcIdx] !== undefined ? String(row[thcIdx]).trim() : '';
    const thc = rawThc ? (rawThc.includes('%') ? rawThc : `${rawThc}%`) : (category === 'psilocybin' ? '0.00%' : '18.00-24.00%');

    const rawCbd = cbdIdx !== -1 && row[cbdIdx] !== undefined ? String(row[cbdIdx]).trim() : '';
    const cbd = rawCbd ? (rawCbd.includes('%') ? rawCbd : `${rawCbd}%`) : (category === 'tinctures' ? '15.00-20.00%' : '0.10-1.00%');

    // Description & In-Stock
    const desc = descIdx !== -1 && row[descIdx] !== undefined ? String(row[descIdx]).trim() : `Premium grade ${rawName} carefully cured and lab tested for purity and therapeutic relief.`;
    
    let inStock = true;
    if (stockIdx !== -1 && row[stockIdx] !== undefined) {
      const stockVal = String(row[stockIdx]).toLowerCase().trim();
      if (stockVal === '0' || stockVal === 'out' || stockVal === 'no' || stockVal === 'false' || stockVal === 'out of stock') {
        inStock = false;
      }
    }

    // Image URL & 3D Model
    const customImage = imageIdx !== -1 && row[imageIdx] !== undefined ? String(row[imageIdx]).trim() : '';
    const imageUrl = customImage && customImage.startsWith('http') ? customImage : CATEGORY_IMAGES[category];
    const modelUrl = CATEGORY_MODELS[category];

    // Badge
    const customBadge = badgeIdx !== -1 && row[badgeIdx] !== undefined ? String(row[badgeIdx]).trim() : '';
    const badge = isSale ? 'Sale' : (customBadge || (r % 3 === 0 ? 'Fresh Harvest' : undefined));

    // Terpenes & Effects
    let terpenes = ['Myrcene', 'Caryophyllene', 'Limonene'];
    if (terpeneIdx !== -1 && row[terpeneIdx] !== undefined) {
      const rawTerps = String(row[terpeneIdx]).split(/[,;|]/).map((t) => t.trim()).filter(Boolean);
      if (rawTerps.length > 0) terpenes = rawTerps;
    }

    let effects = ['Relaxed', 'Therapeutic', 'Calm', 'Balanced'];
    if (effectIdx !== -1 && row[effectIdx] !== undefined) {
      const rawEff = String(row[effectIdx]).split(/[,;|]/).map((e) => e.trim()).filter(Boolean);
      if (rawEff.length > 0) effects = rawEff;
    }

    results.push({
      id: `sheet-${r}-${rawName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      name: rawName,
      subtitle: `${categoryLabels[category]} • Batch Certified`,
      category,
      categoryLabel: categoryLabels[category],
      strainType,
      price,
      originalPrice,
      rating: 4.9,
      reviewCount: 8 + (r * 7) % 35,
      thc,
      cbd,
      terpenes,
      effects,
      medicalUses: ['Stress Relief', 'Daily Wellness', 'Pain Support', 'Sleep Support'],
      description: desc,
      dosageGuide: 'Consult physician or start with micro-dose. Store in cool, dark place away from direct sunlight.',
      inStock,
      stock: inStock ? 25 : 0,
      lowStockThreshold: 5,
      active: true,
      isSale,
      isBestSeller: isSale || r % 4 === 0,
      badge,
      labTestedDate: 'Nov 2026',
      batchNumber: `HH-LIVE-${r.toString().padStart(3, '0')}`,
      imageUrl,
      modelUrl,
      colorGradient: isSale ? 'from-rose-100 to-amber-100' : 'from-emerald-100 to-teal-100'
    });
  }

  return results;
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV file directly using SheetJS
 */
export async function parseSpreadsheetFile(file: File): Promise<SpreadsheetParseResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });

  // Pick first worksheet or one named Products / Inventory
  let targetSheetName = workbook.SheetNames[0];
  for (const name of workbook.SheetNames) {
    const lower = name.toLowerCase();
    if (lower.includes('product') || lower.includes('item') || lower.includes('inventory') || lower.includes('sale') || lower.includes('sheet3')) {
      targetSheetName = name;
      break;
    }
  }

  const sheet = workbook.Sheets[targetSheetName];
  if (!sheet) {
    throw new Error('No readable sheet found in the uploaded workbook.');
  }

  // Convert to 2D array of raw values
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null | undefined)[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false
  });

  if (!rows || rows.length < 2) {
    throw new Error('Spreadsheet appears to be empty or missing header columns (Name, Price, Category).');
  }

  const products = convertRowsToProducts(rows);
  if (products.length === 0) {
    throw new Error('No valid products detected. Ensure your sheet has columns for Item Name and Price.');
  }

  const categoriesFound = Array.from(new Set(products.map((p) => p.categoryLabel)));
  const saleCount = products.filter((p) => p.isSale).length;

  return {
    products,
    totalRows: rows.length - 1,
    validCount: products.length,
    categoriesFound,
    saleCount,
    errors: []
  };
}

/**
 * Downloads a sample pre-formatted CSV template
 */
export function downloadSampleSpreadsheet(): void {
  const sampleData = [
    ['Name', 'Category', 'Strain', 'Price', 'Original Price', 'On Sale', 'THC', 'CBD', 'Stock', 'Description'],
    ['Durban Poison Heritage Cut', 'flower', 'Sativa', '195', '240', 'yes', '22%', '0.2%', 'In Stock', 'Legendary landrace sativa from the port of Durban, delivering clean energetic focus.'],
    ['Golden Teacher Sacred Capsules', 'psilocybin', 'Hybrid', '320', '390', 'yes', '0%', '0%', 'In Stock', 'Gentle microdose capsules crafted with organic ginger and lion\'s mane mushrooms.'],
    ['Full Spectrum CBD 1500mg Drops', 'tinctures', 'CBD-Rich', '290', '360', 'yes', '0.1%', '15%', 'In Stock', 'Organic MCT oil infused with supercritical CO2 extracted broad spectrum CBD.'],
    ['Malawi Gold Landrace Seeds (5pk)', 'seeds', 'Sativa', '350', '420', 'yes', '20%', '0.1%', 'In Stock', 'Heirloom South African landrace genetics bred for heavy resin production.'],
    ['Live Rosin Cold Cure 1g', 'concentrates', 'Hybrid', '450', '520', 'yes', '78%', '1.5%', 'In Stock', 'Solventless fresh frozen ice water hash extract cured at cool temperatures.'],
    ['Arnica & CBD Relief Balm (100ml)', 'topicals', 'CBD-Rich', '220', '260', 'yes', '0%', '5%', 'In Stock', 'Deep soothing botanical balm formulated for sore muscles and joint stiffness.']
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');
  
  XLSX.writeFile(wb, 'HerbalHarbour_Inventory_Template.xlsx');
}
