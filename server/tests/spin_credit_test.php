<?php

/**
 * Daily spin limit and store-credit application.
 * Run: php server/tests/spin_credit_test.php
 */

require dirname(__DIR__) . '/lib/bootstrap.php';
require dirname(__DIR__) . '/lib/shop.php';

function hh_test_expect(bool $ok, string $message): void
{
    if (!$ok) {
        throw new RuntimeException($message);
    }
    echo "ok: {$message}\n";
}

function hh_test_rng(array $values): callable
{
    return static function (int $min, int $max) use (&$values): int {
        if (!$values) {
            throw new RuntimeException('rng exhausted');
        }
        $next = array_shift($values);
        if ($next < $min || $next > $max) {
            throw new RuntimeException("rng {$next} outside {$min}..{$max}");
        }
        return $next;
    };
}

function hh_test_migrate(): void
{
    $db = hh_config()['db'];
    $mysqli = new mysqli($db['host'], $db['user'], $db['pass'], $db['name']);
    if ($mysqli->connect_errno) {
        throw new RuntimeException($mysqli->connect_error);
    }
    $mysqli->set_charset($db['charset'] ?? 'utf8mb4');
    $sql = file_get_contents(dirname(__DIR__) . '/migrations/2026-10-28-spin-credit.sql');
    if ($sql === false || !$mysqli->multi_query($sql)) {
        throw new RuntimeException($mysqli->error);
    }
    do {
        if ($result = $mysqli->store_result()) {
            $result->free();
        }
    } while ($mysqli->more_results() && $mysqli->next_result());
    if ($mysqli->errno) {
        throw new RuntimeException($mysqli->error);
    }
}

function hh_test_roll(): void
{
    $cherry = hh_spin_roll(hh_test_rng([1, 55]));
    hh_test_expect($cherry['symbols'] === ['cherry', 'cherry', 'cherry'] && $cherry['payout'] === 20.0, 'cherry win is R20');
    $apple = hh_spin_roll(hh_test_rng([1, 80]));
    hh_test_expect($apple['payout'] === 30.0, 'apple win is R30');
    $orange = hh_spin_roll(hh_test_rng([1, 93]));
    hh_test_expect($orange['payout'] === 50.0, 'orange win is R50');
    $bell = hh_spin_roll(hh_test_rng([1800, 99]));
    hh_test_expect($bell['payout'] === 100.0, 'bell win is R100');
    $star = hh_spin_roll(hh_test_rng([1, 100]));
    hh_test_expect($star['symbols'] === ['star', 'star', 'star'] && $star['payout'] === 500.0, 'star win is R500');
    $miss = hh_spin_roll(hh_test_rng([10000, 100, 1, 0, 0, 0]));
    hh_test_expect($miss['payout'] === 0.0 && count(array_unique($miss['symbols'])) === 2, 'a losing spin pays nothing');

    $small = hh_credit_portion(100, 30);
    hh_test_expect($small['applied'] === 30.0 && $small['total'] === 70.0 && $small['balanceAfter'] === 0.0, 'credit covers part of an order');
    $full = hh_credit_portion(10, 50);
    hh_test_expect($full['applied'] === 10.0 && $full['total'] === 0.0 && $full['balanceAfter'] === 40.0, 'credit larger than the order leaves a remainder');
    $none = hh_credit_portion(0, 50);
    hh_test_expect($none['applied'] === 0.0 && $none['total'] === 0.0 && $none['balanceAfter'] === 50.0, 'a zero total takes no credit');
    $negative = hh_credit_portion(-5, -8);
    hh_test_expect($negative['applied'] === 0.0 && $negative['total'] === 0.0 && $negative['balanceAfter'] === 0.0, 'negative inputs cannot create a negative total');
}

function hh_test_set_balance(PDO $pdo, string $uid, float $amount): void
{
    $pdo->prepare('INSERT INTO store_credit (user_uid, balance) VALUES (?, ?) ON DUPLICATE KEY UPDATE balance = VALUES(balance)')
        ->execute([$uid, $amount]);
}

function hh_test_balance(PDO $pdo, string $uid): float
{
    $stmt = $pdo->prepare('SELECT balance FROM store_credit WHERE user_uid = ?');
    $stmt->execute([$uid]);
    $amount = $stmt->fetchColumn();
    return $amount === false ? 0.0 : (float) $amount;
}

function hh_test_database(): void
{
    hh_test_migrate();
    $pdo = hh_pdo();
    $uid = 'spin-credit-test-user';
    $user = ['uid' => $uid, 'email' => 'spin-test@example.com', 'name' => 'Spin Test', 'admin' => false];
    $product = $pdo->query('SELECT id, stock, price, name FROM products WHERE active = 1 AND stock >= 3 ORDER BY stock DESC LIMIT 1')->fetch();
    if (!$product) {
        throw new RuntimeException('Need an active product with stock of at least 3.');
    }
    $productId = (string) $product['id'];
    $stockBefore = (int) $product['stock'];
    $orderIds = [];

    $wipe = static function () use ($pdo, $uid, $productId, $stockBefore, &$orderIds): void {
        foreach ($orderIds as $orderId) {
            $pdo->prepare('DELETE FROM stock_movements WHERE order_id = ?')->execute([$orderId]);
            $pdo->prepare('DELETE FROM order_items WHERE order_id = ?')->execute([$orderId]);
            $pdo->prepare('DELETE FROM orders WHERE id = ?')->execute([$orderId]);
        }
        $pdo->prepare('UPDATE products SET stock = ?, in_stock = ? WHERE id = ?')->execute([$stockBefore, $stockBefore > 0 ? 1 : 0, $productId]);
        $pdo->prepare('DELETE FROM spins WHERE user_uid = ?')->execute([$uid]);
        $pdo->prepare('DELETE FROM store_credit_ledger WHERE user_uid = ?')->execute([$uid]);
        $pdo->prepare('DELETE FROM store_credit WHERE user_uid = ?')->execute([$uid]);
    };

    try {
        $wipe();
        $orderIds = [];
        $yesterday = (new DateTimeImmutable('yesterday', new DateTimeZone('Africa/Johannesburg')))->format('Y-m-d');
        $pdo->prepare('INSERT INTO spins (user_uid, spun_on, reel_1, reel_2, reel_3, payout) VALUES (?, ?, ?, ?, ?, 0)')
            ->execute([$uid, $yesterday, 'cherry', 'apple', 'orange']);
        $first = hh_spin($user);
        hh_test_expect(isset($first['symbols']) && $first['spunToday'] === true, 'a spin from yesterday does not use today');
        $blocked = false;
        try {
            hh_spin($user);
        } catch (RuntimeException $error) {
            $blocked = str_contains($error->getMessage(), 'free spin');
        }
        hh_test_expect($blocked, 'a second spin on the same day is rejected');
        $count = $pdo->prepare('SELECT COUNT(*) FROM spins WHERE user_uid = ? AND spun_on = ?');
        $count->execute([$uid, hh_shop_today()]);
        hh_test_expect((int) $count->fetchColumn() === 1, 'only one spin row exists for today');

        $price = round((float) $product['price'], 2);
        $config = hh_config();
        $shipping = $price >= (float) $config['free_shipping_over'] ? 0.0 : (float) $config['delivery_fee'];
        $payable = round($price + $shipping, 2);
        $body = [
            'customerName' => 'Spin Test',
            'email' => 'spin-test@example.com',
            'phone' => '0000000000',
            'address' => 'Test street',
            'city' => 'Cape Town',
            'postalCode' => '8001',
            'province' => 'Western Cape',
            'items' => [['productId' => $productId, 'quantity' => 1]],
        ];

        hh_test_set_balance($pdo, $uid, 40);
        $partial = hh_place_order($user, $body, 'online');
        $orderIds[] = (int) $partial['id'];
        $expectedPartial = hh_credit_portion($payable, 40);
        hh_test_expect(
            (float) $partial['creditApplied'] === $expectedPartial['applied']
            && (float) $partial['total'] === $expectedPartial['total']
            && hh_test_balance($pdo, $uid) === $expectedPartial['balanceAfter']
            && (float) $partial['total'] >= 0
            && hh_test_balance($pdo, $uid) >= 0,
            'checkout applies R40 without a negative total'
        );

        $large = round($payable + 80, 2);
        hh_test_set_balance($pdo, $uid, $large);
        $covered = hh_place_order($user, $body, 'online');
        $orderIds[] = (int) $covered['id'];
        hh_test_expect(
            (float) $covered['total'] === 0.0
            && (float) $covered['creditApplied'] === $payable
            && hh_test_balance($pdo, $uid) === 80.0,
            'credit larger than the order leaves the total at zero'
        );

        $pos = hh_place_order($user, $body, 'pos');
        $orderIds[] = (int) $pos['id'];
        hh_test_expect(
            (float) $pos['creditApplied'] === 0.0
            && (float) $pos['total'] === $price
            && hh_test_balance($pdo, $uid) === 80.0,
            'in-store sales do not spend online store credit'
        );

        hh_set_status($user, (int) $covered['id'], 'cancelled', false);
        hh_test_expect(hh_test_balance($pdo, $uid) === round(80 + $payable, 2), 'cancelling an order returns its store credit');
    } finally {
        $wipe();
    }
}

try {
    hh_test_roll();
    hh_test_database();
    echo "spin credit tests passed\n";
} catch (Throwable $error) {
    fwrite(STDERR, 'FAIL: ' . $error->getMessage() . "\n");
    exit(1);
}
