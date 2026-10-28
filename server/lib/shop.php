<?php

function hh_coupons(): array
{
    return [
        'HARBOUR5' => ['percent' => 5, 'min' => 800],
        'HARBOUR10' => ['percent' => 10, 'min' => 0],
        'GREEN10' => ['percent' => 10, 'min' => 0],
        'ORANGE15' => ['percent' => 15, 'min' => 0],
        'GREENHERB15' => ['percent' => 15, 'min' => 0],
        'CITRUS20' => ['percent' => 20, 'min' => 500],
        'FREESHIP' => ['percent' => 0, 'min' => 0, 'free_ship' => true],
        'JACKPOT25' => ['percent' => 25, 'min' => 0],
        'VIPHARBOUR' => ['percent' => 15, 'min' => 0],
    ];
}

function hh_quote(float $subtotal, ?string $couponCode): array
{
    $config = hh_config();
    $discount = 0.0;
    $freeShip = $subtotal >= (float) $config['free_shipping_over'];
    if ($couponCode) {
        $code = strtoupper(trim($couponCode));
        $coupon = hh_coupons()[$code] ?? null;
        if (!$coupon) {
            throw new RuntimeException('That promo code is not valid.');
        }
        if ($subtotal < (float) $coupon['min']) {
            throw new RuntimeException($code . ' needs a spend of R ' . number_format((float) $coupon['min'], 2, '.', ''));
        }
        if (!empty($coupon['free_ship'])) {
            $freeShip = true;
        } else {
            $discount = round($subtotal * ((float) $coupon['percent'] / 100), 2);
        }
    }
    $shipping = ($subtotal <= 0 || $freeShip) ? 0.0 : (float) $config['delivery_fee'];
    $total = max(0, round($subtotal - $discount + $shipping, 2));
    return ['discount' => $discount, 'shipping' => $shipping, 'total' => $total];
}

function hh_lines(array $items): array
{
    $grouped = [];
    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }
        $id = (string) ($item['productId'] ?? $item['id'] ?? '');
        $qty = (int) ($item['quantity'] ?? 0);
        if ($id === '' || $qty <= 0) {
            continue;
        }
        if (!isset($grouped[$id])) {
            $grouped[$id] = ['productId' => $id, 'quantity' => 0, 'selectedWeight' => null];
        }
        $grouped[$id]['quantity'] += $qty;
        if (!empty($item['selectedWeight'])) {
            $grouped[$id]['selectedWeight'] = (string) $item['selectedWeight'];
        }
    }
    if (!$grouped) {
        hh_fail(400, 'Add at least one item.');
    }
    ksort($grouped);
    return $grouped;
}

function hh_order_payload(array $order, array $items): array
{
    return [
        'id' => (string) $order['id'],
        'orderNumber' => $order['order_number'],
        'userId' => $order['user_uid'],
        'customerName' => $order['customer_name'],
        'email' => $order['email'],
        'phone' => $order['phone'],
        'address' => $order['address'],
        'city' => $order['city'],
        'postalCode' => $order['postal_code'],
        'province' => $order['province'],
        'notes' => (string) ($order['notes'] ?? ''),
        'paymentMethod' => $order['payment_method'],
        'channel' => $order['channel'],
        'status' => $order['status'],
        'items' => $items,
        'quantities' => array_column($items, 'quantity', 'productId'),
        'subtotal' => (float) $order['subtotal'],
        'discount' => (float) $order['discount'],
        'shipping' => (float) $order['shipping'],
        'total' => (float) $order['total'],
        'stockApplied' => true,
        'createdAt' => hh_iso($order['created_at']),
        'updatedAt' => hh_iso($order['updated_at']),
    ];
}

function hh_load_order(int $id): array
{
    $pdo = hh_pdo();
    $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ?');
    $stmt->execute([$id]);
    $order = $stmt->fetch();
    if (!$order) {
        hh_fail(404, 'Order not found.');
    }
    $items = $pdo->prepare('SELECT product_id, name, price, quantity, selected_weight FROM order_items WHERE order_id = ?');
    $items->execute([$id]);
    $lines = [];
    foreach ($items as $item) {
        $line = [
            'productId' => $item['product_id'],
            'name' => $item['name'],
            'price' => (float) $item['price'],
            'quantity' => (int) $item['quantity'],
        ];
        if ($item['selected_weight']) {
            $line['selectedWeight'] = $item['selected_weight'];
        }
        $lines[] = $line;
    }
    return hh_order_payload($order, $lines);
}

function hh_movement(PDO $pdo, array $product, int $delta, int $stockAfter, string $reason, string $channel, ?int $orderId, string $uid): void
{
    $stmt = $pdo->prepare('INSERT INTO stock_movements (product_id, product_name, delta, stock_after, reason, channel, order_id, user_uid) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$product['id'], $product['name'], $delta, $stockAfter, $reason, $channel, $orderId, $uid]);
}

function hh_place_order(array $user, array $body, string $channel): array
{
    $lines = hh_lines($body['items'] ?? []);
    if ($channel === 'online') {
        foreach (['customerName' => 'Name', 'email' => 'Email', 'phone' => 'Phone', 'address' => 'Address'] as $field => $label) {
            if (trim((string) ($body[$field] ?? '')) === '') {
                hh_fail(400, $label . ' is required.');
            }
        }
    }
    $pdo = hh_pdo();
    $pdo->beginTransaction();
    try {
        $locked = [];
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ? FOR UPDATE');
        foreach ($lines as $line) {
            $stmt->execute([$line['productId']]);
            $product = $stmt->fetch();
            if (!$product || (int) $product['active'] !== 1) {
                throw new RuntimeException(($product['name'] ?? 'An item') . ' is no longer for sale.');
            }
            if ((int) $product['stock'] < $line['quantity']) {
                $stock = (int) $product['stock'];
                $name = $product['name'];
                throw new RuntimeException($stock <= 0 ? $name . ' is out of stock.' : 'Only ' . $stock . ' of ' . $name . ' left.');
            }
            $locked[] = ['product' => $product, 'line' => $line];
        }
        $subtotal = 0.0;
        foreach ($locked as $row) {
            $subtotal += (float) $row['product']['price'] * $row['line']['quantity'];
        }
        $subtotal = round($subtotal, 2);
        if ($channel === 'pos') {
            $quote = ['discount' => 0.0, 'shipping' => 0.0, 'total' => $subtotal];
            $status = ($body['status'] ?? 'paid') === 'pending' ? 'pending' : (($body['status'] ?? '') === 'collected' ? 'collected' : 'paid');
            $payment = ($body['paymentMethod'] ?? '') === 'eft' ? 'eft' : 'pay_on_collection';
        } else {
            $quote = hh_quote($subtotal, $body['coupon'] ?? null);
            $status = 'pending';
            $payment = ($body['paymentMethod'] ?? '') === 'pay_on_collection' ? 'pay_on_collection' : 'eft';
        }
        $insert = $pdo->prepare('INSERT INTO orders (order_number, user_uid, customer_name, email, phone, address, city, postal_code, province, notes, payment_method, channel, status, subtotal, discount, shipping, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $insert->execute([
            'HH-TEMP',
            $user['uid'],
            trim((string) ($body['customerName'] ?? ($channel === 'pos' ? 'Walk-in' : ''))),
            trim((string) ($body['email'] ?? $user['email'])),
            trim((string) ($body['phone'] ?? '')),
            trim((string) ($body['address'] ?? ($channel === 'pos' ? 'In-store collection' : ''))),
            trim((string) ($body['city'] ?? ($channel === 'pos' ? 'Cape Town' : ''))),
            trim((string) ($body['postalCode'] ?? ($channel === 'pos' ? '8001' : ''))),
            trim((string) ($body['province'] ?? ($channel === 'pos' ? 'Western Cape' : ''))),
            trim((string) ($body['notes'] ?? '')),
            $payment,
            $channel,
            $status,
            $subtotal,
            $quote['discount'],
            $quote['shipping'],
            $quote['total'],
        ]);
        $orderId = (int) $pdo->lastInsertId();
        $number = 'HH-' . str_pad((string) $orderId, 6, '0', STR_PAD_LEFT);
        $pdo->prepare('UPDATE orders SET order_number = ? WHERE id = ?')->execute([$number, $orderId]);
        $itemStmt = $pdo->prepare('INSERT INTO order_items (order_id, product_id, name, price, quantity, selected_weight) VALUES (?, ?, ?, ?, ?, ?)');
        $stockStmt = $pdo->prepare('UPDATE products SET stock = ?, in_stock = ? WHERE id = ?');
        foreach ($locked as $row) {
            $next = (int) $row['product']['stock'] - $row['line']['quantity'];
            $itemStmt->execute([
                $orderId,
                $row['product']['id'],
                $row['product']['name'],
                $row['product']['price'],
                $row['line']['quantity'],
                $row['line']['selectedWeight'],
            ]);
            $stockStmt->execute([$next, $next > 0 ? 1 : 0, $row['product']['id']]);
            hh_movement($pdo, $row['product'], -$row['line']['quantity'], $next, $channel === 'pos' ? 'In-store sale' : 'Online order', $channel, $orderId, $user['uid']);
        }
        if ($channel === 'online') {
            $pdo->prepare('DELETE FROM cart_items WHERE user_uid = ?')->execute([$user['uid']]);
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $message = $error instanceof RuntimeException ? $error->getMessage() : 'Could not place the order.';
        hh_fail(409, $message);
    }
    return hh_load_order($orderId);
}

function hh_set_status(array $actor, int $orderId, string $status, bool $admin): array
{
    $allowed = ['paid', 'collected', 'cancelled'];
    if (!in_array($status, $allowed, true)) {
        hh_fail(400, 'Status must be paid, collected, or cancelled.');
    }
    $pdo = hh_pdo();
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE id = ? FOR UPDATE');
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        if (!$order) {
            throw new RuntimeException('Order not found.');
        }
        if (!$admin && $order['user_uid'] !== $actor['uid']) {
            throw new RuntimeException('This is not your order.');
        }
        $from = $order['status'];
        $ok = ($from === 'pending' && in_array($status, ['paid', 'collected', 'cancelled'], true))
            || ($from === 'paid' && in_array($status, ['collected', 'cancelled'], true));
        if (!$admin && !($from === 'pending' && $status === 'cancelled')) {
            throw new RuntimeException('You can only cancel a pending order.');
        }
        if (!$ok) {
            throw new RuntimeException('This order can no longer move to ' . $status . '.');
        }
        if ($status === 'cancelled') {
            $items = $pdo->prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?');
            $items->execute([$orderId]);
            $lock = $pdo->prepare('SELECT * FROM products WHERE id = ? FOR UPDATE');
            $update = $pdo->prepare('UPDATE products SET stock = ?, in_stock = ? WHERE id = ?');
            foreach ($items as $item) {
                $lock->execute([$item['product_id']]);
                $product = $lock->fetch();
                if (!$product) {
                    continue;
                }
                $next = (int) $product['stock'] + (int) $item['quantity'];
                $update->execute([$next, 1, $product['id']]);
                hh_movement($pdo, $product, (int) $item['quantity'], $next, 'Order cancelled — stock returned', 'cancel', $orderId, $actor['uid']);
            }
        }
        $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$status, $orderId]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $message = $error instanceof RuntimeException ? $error->getMessage() : 'Could not update the order.';
        $statusCode = str_contains($message, 'not your order') ? 403 : 409;
        hh_fail($statusCode, $message);
    }
    return hh_load_order($orderId);
}

function hh_save_cart(string $uid, array $items, bool $merge): array
{
    $lines = [];
    foreach ($items as $item) {
        if (!is_array($item)) {
            continue;
        }
        $id = (string) ($item['productId'] ?? '');
        $qty = (int) ($item['quantity'] ?? 0);
        if ($id === '' || $qty <= 0) {
            continue;
        }
        if (!isset($lines[$id])) {
            $lines[$id] = ['productId' => $id, 'quantity' => 0, 'selectedWeight' => $item['selectedWeight'] ?? null];
        }
        $lines[$id]['quantity'] += $qty;
        if (!empty($item['selectedWeight'])) {
            $lines[$id]['selectedWeight'] = $item['selectedWeight'];
        }
    }
    $pdo = hh_pdo();
    $pdo->beginTransaction();
    $pdo->prepare('INSERT IGNORE INTO carts (user_uid) VALUES (?)')->execute([$uid]);
    if ($merge) {
        $existing = $pdo->prepare('SELECT product_id, quantity, selected_weight FROM cart_items WHERE user_uid = ?');
        $existing->execute([$uid]);
        foreach ($existing as $row) {
            $id = $row['product_id'];
            if (!isset($lines[$id])) {
                $lines[$id] = ['productId' => $id, 'quantity' => 0, 'selectedWeight' => $row['selected_weight']];
            }
            $lines[$id]['quantity'] += (int) $row['quantity'];
        }
    }
    $pdo->prepare('DELETE FROM cart_items WHERE user_uid = ?')->execute([$uid]);
    $stock = $pdo->prepare('SELECT stock FROM products WHERE id = ? AND active = 1');
    $insert = $pdo->prepare('INSERT INTO cart_items (user_uid, product_id, quantity, selected_weight) VALUES (?, ?, ?, ?)');
    $saved = [];
    foreach ($lines as $line) {
        $stock->execute([$line['productId']]);
        $available = $stock->fetchColumn();
        if ($available === false) {
            continue;
        }
        $qty = min($line['quantity'], max(0, (int) $available));
        if ($qty <= 0) {
            continue;
        }
        $insert->execute([$uid, $line['productId'], $qty, $line['selectedWeight']]);
        $saved[] = ['productId' => $line['productId'], 'quantity' => $qty, 'selectedWeight' => $line['selectedWeight']];
    }
    $pdo->commit();
    return ['items' => $saved];
}

function hh_read_cart(string $uid): array
{
    $stmt = hh_pdo()->prepare('SELECT product_id AS productId, quantity, selected_weight AS selectedWeight FROM cart_items WHERE user_uid = ?');
    $stmt->execute([$uid]);
    return ['items' => $stmt->fetchAll()];
}

function hh_save_product(array $body, ?string $id, string $uid): array
{
    $name = trim((string) ($body['name'] ?? ''));
    if ($name === '') {
        hh_fail(400, 'Product name is required.');
    }
    $categories = ['flower', 'seeds', 'tinctures', 'edibles', 'concentrates', 'topicals'];
    $category = in_array($body['category'] ?? '', $categories, true) ? $body['category'] : 'flower';
    $strains = ['Sativa', 'Indica', 'Hybrid', 'CBD-Rich'];
    $strain = in_array($body['strainType'] ?? '', $strains, true) ? $body['strainType'] : 'Hybrid';
    $stock = max(0, (int) ($body['stock'] ?? 0));
    $pdo = hh_pdo();
    $pdo->beginTransaction();
    $creating = $id === null || $id === '';
    if ($creating) {
        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $name) ?? 'item');
        $id = 'prod-' . trim($slug, '-') . '-' . substr(bin2hex(random_bytes(3)), 0, 6);
        $previous = 0;
    } else {
        $stmt = $pdo->prepare('SELECT stock, name FROM products WHERE id = ? FOR UPDATE');
        $stmt->execute([$id]);
        $existing = $stmt->fetch();
        if (!$existing) {
            $pdo->rollBack();
            hh_fail(404, 'Product not found.');
        }
        $previous = (int) $existing['stock'];
    }
    $sql = 'INSERT INTO products (id, name, subtitle, category, category_label, strain_type, price, original_price, rating, review_count, thc, cbd, terpenes, effects, medical_uses, description, dosage_guide, stock, low_stock_threshold, in_stock, active, is_sale, is_best_seller, badge, lab_tested_date, batch_number, image_url, color_gradient)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE name=VALUES(name), subtitle=VALUES(subtitle), category=VALUES(category), category_label=VALUES(category_label), strain_type=VALUES(strain_type), price=VALUES(price), original_price=VALUES(original_price), rating=VALUES(rating), review_count=VALUES(review_count), thc=VALUES(thc), cbd=VALUES(cbd), terpenes=VALUES(terpenes), effects=VALUES(effects), medical_uses=VALUES(medical_uses), description=VALUES(description), dosage_guide=VALUES(dosage_guide), stock=VALUES(stock), low_stock_threshold=VALUES(low_stock_threshold), in_stock=VALUES(in_stock), active=VALUES(active), is_sale=VALUES(is_sale), is_best_seller=VALUES(is_best_seller), badge=VALUES(badge), lab_tested_date=VALUES(lab_tested_date), batch_number=VALUES(batch_number), image_url=VALUES(image_url), color_gradient=VALUES(color_gradient)';
    $pdo->prepare($sql)->execute([
        $id,
        $name,
        (string) ($body['subtitle'] ?? ''),
        $category,
        (string) ($body['categoryLabel'] ?? $category),
        $strain,
        round((float) ($body['price'] ?? 0), 2),
        isset($body['originalPrice']) && $body['originalPrice'] !== '' ? round((float) $body['originalPrice'], 2) : null,
        (float) ($body['rating'] ?? 0),
        (int) ($body['reviewCount'] ?? 0),
        (string) ($body['thc'] ?? ''),
        (string) ($body['cbd'] ?? ''),
        json_encode(hh_list($body['terpenes'] ?? [])),
        json_encode(hh_list($body['effects'] ?? [])),
        json_encode(hh_list($body['medicalUses'] ?? [])),
        (string) ($body['description'] ?? ''),
        (string) ($body['dosageGuide'] ?? ''),
        $stock,
        max(0, (int) ($body['lowStockThreshold'] ?? 5)),
        $stock > 0 ? 1 : 0,
        array_key_exists('active', $body) && $body['active'] === false ? 0 : 1,
        !empty($body['isSale']) ? 1 : 0,
        !empty($body['isBestSeller']) ? 1 : 0,
        $body['badge'] ?? null,
        (string) ($body['labTestedDate'] ?? ''),
        (string) ($body['batchNumber'] ?? ''),
        (string) ($body['imageUrl'] ?? ''),
        (string) ($body['colorGradient'] ?? 'from-emerald-100 to-amber-100'),
    ]);
    $delta = $stock - $previous;
    if ($delta !== 0) {
        hh_movement($pdo, ['id' => $id, 'name' => $name], $delta, $stock, $creating ? 'Opening stock' : 'Edited on the product form', 'adjustment', null, $uid);
    }
    $pdo->commit();
    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');
    $stmt->execute([$id]);
    return hh_product($stmt->fetch());
}

function hh_adjust_stock(string $productId, int $delta, string $reason, string $uid): int
{
    if ($delta === 0) {
        hh_fail(400, 'Enter a stock change other than zero.');
    }
    if (trim($reason) === '') {
        hh_fail(400, 'Add a reason for the stock adjustment.');
    }
    $pdo = hh_pdo();
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM products WHERE id = ? FOR UPDATE');
    $stmt->execute([$productId]);
    $product = $stmt->fetch();
    if (!$product) {
        $pdo->rollBack();
        hh_fail(404, 'Product not found.');
    }
    $next = (int) $product['stock'] + $delta;
    if ($next < 0) {
        $pdo->rollBack();
        hh_fail(409, 'Cannot remove ' . abs($delta) . '. Only ' . (int) $product['stock'] . ' on hand.');
    }
    $pdo->prepare('UPDATE products SET stock = ?, in_stock = ? WHERE id = ?')->execute([$next, $next > 0 ? 1 : 0, $productId]);
    hh_movement($pdo, $product, $delta, $next, trim($reason), 'adjustment', null, $uid);
    $pdo->commit();
    return $next;
}
