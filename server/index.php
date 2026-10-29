<?php

require __DIR__ . '/lib/bootstrap.php';
hh_cors();

require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/shop.php';

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $path = hh_path();
    $pdo = hh_pdo();

    if ($method === 'GET' && $path === '/health') {
        hh_json(['ok' => true, 'service' => 'herbal-harbour-api']);
    }

    if ($method === 'GET' && $path === '/products') {
        $rows = $pdo->query('SELECT * FROM products WHERE active = 1 ORDER BY name')->fetchAll();
        hh_json(['products' => array_map('hh_product', $rows)]);
    }

    if ($method === 'GET' && $path === '/admin/products') {
        hh_admin();
        $rows = $pdo->query('SELECT * FROM products ORDER BY name')->fetchAll();
        hh_json(['products' => array_map('hh_product', $rows)]);
    }

    if ($method === 'GET' && $path === '/me') {
        hh_json(hh_account(hh_user()));
    }

    if ($method === 'POST' && $path === '/spin') {
        try {
            hh_json(hh_spin(hh_user()));
        } catch (RuntimeException $error) {
            hh_fail(409, $error->getMessage());
        }
    }

    if ($method === 'GET' && $path === '/cart') {
        hh_json(hh_read_cart(hh_user()['uid']));
    }

    if ($method === 'PUT' && $path === '/cart') {
        $user = hh_user();
        hh_json(hh_save_cart($user['uid'], hh_body()['items'] ?? [], false));
    }

    if ($method === 'POST' && $path === '/cart/merge') {
        $user = hh_user();
        hh_json(hh_save_cart($user['uid'], hh_body()['items'] ?? [], true));
    }

    if ($method === 'POST' && $path === '/checkout') {
        hh_json(hh_place_order(hh_user(), hh_body(), 'online'), 201);
    }

    if ($method === 'GET' && $path === '/orders/mine') {
        $user = hh_user();
        $stmt = $pdo->prepare('SELECT id FROM orders WHERE user_uid = ? ORDER BY created_at DESC');
        $stmt->execute([$user['uid']]);
        $orders = [];
        foreach ($stmt as $row) {
            $orders[] = hh_load_order((int) $row['id']);
        }
        hh_json(['orders' => $orders]);
    }

    if ($method === 'POST' && preg_match('#^/orders/(\d+)/cancel$#', $path, $match)) {
        hh_json(hh_set_status(hh_user(), (int) $match[1], 'cancelled', false));
    }

    if ($method === 'GET' && $path === '/admin/orders') {
        hh_admin();
        $orders = [];
        foreach ($pdo->query('SELECT id FROM orders ORDER BY created_at DESC LIMIT 200') as $row) {
            $orders[] = hh_load_order((int) $row['id']);
        }
        hh_json(['orders' => $orders]);
    }

    if ($method === 'POST' && preg_match('#^/admin/orders/(\d+)/status$#', $path, $match)) {
        $admin = hh_admin();
        $status = (string) (hh_body()['status'] ?? '');
        hh_json(hh_set_status($admin, (int) $match[1], $status, true));
    }

    if ($method === 'POST' && $path === '/admin/pos') {
        hh_json(hh_place_order(hh_admin(), hh_body(), 'pos'), 201);
    }

    if ($method === 'POST' && $path === '/admin/products') {
        $admin = hh_admin();
        hh_json(hh_save_product(hh_body(), null, $admin['uid']), 201);
    }

    if (($method === 'PUT' || $method === 'POST') && preg_match('#^/admin/products/([A-Za-z0-9_-]+)$#', $path, $match) && $method === 'PUT') {
        $admin = hh_admin();
        hh_json(hh_save_product(hh_body(), $match[1], $admin['uid']));
    }

    if ($method === 'DELETE' && preg_match('#^/admin/products/([A-Za-z0-9_-]+)$#', $path, $match)) {
        hh_admin();
        $pdo->prepare('DELETE FROM products WHERE id = ?')->execute([$match[1]]);
        hh_json(['ok' => true]);
    }

    if ($method === 'POST' && $path === '/admin/stock') {
        $admin = hh_admin();
        $body = hh_body();
        $stock = hh_adjust_stock((string) ($body['productId'] ?? ''), (int) ($body['delta'] ?? 0), (string) ($body['reason'] ?? ''), $admin['uid']);
        hh_json(['stock' => $stock]);
    }

    if ($method === 'GET' && $path === '/admin/movements') {
        hh_admin();
        $rows = [];
        foreach ($pdo->query('SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 300') as $movement) {
            $rows[] = [
                'id' => (string) $movement['id'],
                'productId' => $movement['product_id'],
                'productName' => $movement['product_name'],
                'delta' => (int) $movement['delta'],
                'stockAfter' => (int) $movement['stock_after'],
                'reason' => $movement['reason'],
                'channel' => $movement['channel'],
                'orderId' => $movement['order_id'] ? (string) $movement['order_id'] : null,
                'userId' => $movement['user_uid'],
                'createdAt' => hh_iso($movement['created_at']),
            ];
        }
        hh_json(['movements' => $rows]);
    }

    if ($method === 'GET' && $path === '/admin/low-stock') {
        hh_admin();
        $rows = $pdo->query('SELECT * FROM products WHERE active = 1 AND stock <= low_stock_threshold ORDER BY stock ASC')->fetchAll();
        hh_json(['products' => array_map('hh_product', $rows)]);
    }

    if ($method === 'GET' && $path === '/admin/settings') {
        hh_admin();
        $sheet = $pdo->query("SELECT setting_value FROM settings WHERE setting_key = 'spreadsheet_id'")->fetchColumn();
        hh_json(['spreadsheetId' => $sheet ?: '']);
    }

    if ($method === 'PUT' && $path === '/admin/settings') {
        hh_admin();
        $id = trim((string) (hh_body()['spreadsheetId'] ?? ''));
        $pdo->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (\'spreadsheet_id\', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)')->execute([$id]);
        hh_json(['spreadsheetId' => $id]);
    }

    hh_fail(404, 'No such shop API route.');
} catch (PDOException $error) {
    hh_fail(500, 'The shop database is not ready. Import schema.sql and seed.sql.');
} catch (Throwable $error) {
    hh_fail(500, $error->getMessage() !== '' ? $error->getMessage() : 'The shop API failed.');
}
