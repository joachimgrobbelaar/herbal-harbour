import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// products.ts is imported via tsx from the npm script. This file is the fallback runner.
const require = createRequire(import.meta.url);
void require;

const { PRODUCTS } = await import('../src/data/products.ts');

function sqlString(value) {
  return `'${String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

const rows = PRODUCTS.map((product) => {
  const values = [
    sqlString(product.id),
    sqlString(product.name),
    sqlString(product.subtitle),
    sqlString(product.category),
    sqlString(product.categoryLabel),
    sqlString(product.strainType),
    product.price,
    product.originalPrice ?? 'NULL',
    product.rating,
    product.reviewCount,
    sqlString(product.thc),
    sqlString(product.cbd),
    sqlString(JSON.stringify(product.terpenes)),
    sqlString(JSON.stringify(product.effects)),
    sqlString(JSON.stringify(product.medicalUses)),
    sqlString(product.description),
    sqlString(product.dosageGuide),
    product.stock,
    product.lowStockThreshold,
    product.stock > 0 ? 1 : 0,
    product.active === false ? 0 : 1,
    product.isSale ? 1 : 0,
    product.isBestSeller ? 1 : 0,
    product.badge ? sqlString(product.badge) : 'NULL',
    sqlString(product.labTestedDate),
    sqlString(product.batchNumber),
    sqlString(product.imageUrl),
    sqlString(product.colorGradient),
  ];
  return `  (${values.join(', ')})`;
});

const sql = `-- Catalogue seed for Herbal Harbour. Import after schema.sql.
SET NAMES utf8mb4;

INSERT IGNORE INTO admins (email) VALUES ('joachimgrobbelaar@gmail.com');

INSERT INTO products (
  id, name, subtitle, category, category_label, strain_type, price, original_price, rating, review_count,
  thc, cbd, terpenes, effects, medical_uses, description, dosage_guide, stock, low_stock_threshold, in_stock,
  active, is_sale, is_best_seller, badge, lab_tested_date, batch_number, image_url, color_gradient
) VALUES
${rows.join(',\n')}
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  subtitle = VALUES(subtitle),
  price = VALUES(price),
  original_price = VALUES(original_price),
  description = VALUES(description),
  stock = VALUES(stock),
  in_stock = VALUES(in_stock),
  active = VALUES(active);
`;

writeFileSync(new URL('../server/seed.sql', import.meta.url), sql);
console.log(`Wrote ${PRODUCTS.length} products`);
