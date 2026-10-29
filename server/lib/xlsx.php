<?php

/** Minimal .xlsx writer. No Composer. One sheet of rows (first row is the header). */
function hh_xlsx(array $sheets): string
{
    if (!class_exists('ZipArchive')) {
        hh_fail(500, 'PHP zip is not enabled, so .xlsx export is unavailable. Use format=csv.');
    }
    $zip = new ZipArchive();
    $tmp = tempnam(sys_get_temp_dir(), 'hhx');
    $zip->open($tmp, ZipArchive::OVERWRITE);
    $overrides = '';
    $workbookSheets = '';
    $rels = '';
    $i = 1;
    foreach ($sheets as $name => $rows) {
        $safe = htmlspecialchars((string) $name, ENT_XML1);
        $workbookSheets .= '<sheet name="' . $safe . '" sheetId="' . $i . '" r:id="rId' . $i . '"/>';
        $rels .= '<Relationship Id="rId' . $i . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' . $i . '.xml"/>';
        $overrides .= '<Override PartName="/xl/worksheets/sheet' . $i . '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
        $zip->addFromString('xl/worksheets/sheet' . $i . '.xml', hh_sheet_xml($rows));
        $i++;
    }
    $zip->addFromString('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
' . $overrides . '</Types>');
    $zip->addFromString('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>');
    $zip->addFromString('xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' . $workbookSheets . '</sheets></workbook>');
    $zip->addFromString('xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' . $rels . '</Relationships>');
    $zip->close();
    $bytes = file_get_contents($tmp);
    unlink($tmp);
    return $bytes === false ? '' : $bytes;
}

function hh_sheet_xml(array $rows): string
{
    $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>';
    $r = 1;
    foreach ($rows as $row) {
        $xml .= '<row r="' . $r . '">';
        $c = 1;
        foreach ($row as $value) {
            $ref = hh_col($c) . $r;
            if (is_int($value) || is_float($value)) {
                $xml .= '<c r="' . $ref . '"><v>' . $value . '</v></c>';
            } else {
                $xml .= '<c r="' . $ref . '" t="inlineStr"><is><t>' . htmlspecialchars((string) $value, ENT_XML1) . '</t></is></c>';
            }
            $c++;
        }
        $xml .= '</row>';
        $r++;
    }
    return $xml . '</sheetData></worksheet>';
}

function hh_col(int $index): string
{
    $name = '';
    while ($index > 0) {
        $index--;
        $name = chr(65 + ($index % 26)) . $name;
        $index = intdiv($index, 26);
    }
    return $name;
}

function hh_export_tables(string $which): array
{
    $pdo = hh_pdo();
    $tables = [];
    if ($which === 'products' || $which === 'all') {
        $rows = [['id', 'name', 'category', 'strainType', 'price', 'stock', 'lowStockThreshold', 'inStock', 'active']];
        foreach ($pdo->query('SELECT * FROM products ORDER BY name') as $product) {
            $rows[] = [$product['id'], $product['name'], $product['category'], $product['strain_type'], (float) $product['price'], (int) $product['stock'], (int) $product['low_stock_threshold'], (int) $product['in_stock'], (int) $product['active']];
        }
        $tables['Products'] = $rows;
    }
    if ($which === 'orders' || $which === 'all') {
        $rows = [['id', 'orderNumber', 'createdAt', 'channel', 'status', 'customerName', 'email', 'phone', 'paymentMethod', 'subtotal', 'discount', 'shipping', 'creditApplied', 'total']];
        foreach ($pdo->query('SELECT * FROM orders ORDER BY created_at DESC') as $order) {
            $rows[] = [(int) $order['id'], $order['order_number'], $order['created_at'], $order['channel'], $order['status'], $order['customer_name'], $order['email'], $order['phone'], $order['payment_method'], (float) $order['subtotal'], (float) $order['discount'], (float) $order['shipping'], (float) ($order['credit_applied'] ?? 0), (float) $order['total']];
        }
        $tables['Orders'] = $rows;
    }
    if ($which === 'movements' || $which === 'all') {
        $rows = [['id', 'createdAt', 'productId', 'productName', 'delta', 'stockAfter', 'reason', 'channel', 'orderId', 'userId']];
        foreach ($pdo->query('SELECT * FROM stock_movements ORDER BY created_at DESC') as $movement) {
            $rows[] = [(int) $movement['id'], $movement['created_at'], $movement['product_id'], $movement['product_name'], (int) $movement['delta'], (int) $movement['stock_after'], $movement['reason'], $movement['channel'], $movement['order_id'], $movement['user_uid']];
        }
        $tables['StockMovements'] = $rows;
    }
    if (!$tables) {
        hh_fail(400, 'sheet must be products, orders, movements, or all.');
    }
    return $tables;
}

function hh_export_csv(array $rows): string
{
    $handle = fopen('php://temp', 'r+');
    foreach ($rows as $row) {
        fputcsv($handle, $row);
    }
    rewind($handle);
    $csv = stream_get_contents($handle);
    fclose($handle);
    return $csv === false ? '' : $csv;
}
