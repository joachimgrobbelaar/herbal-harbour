<?php

function hh_shop_today(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone('Africa/Johannesburg')))->format('Y-m-d');
}

/** Symbol code => store credit in rand. About 18% of spins win. */
function hh_spin_symbols(): array
{
    return [
        'cherry' => 20.0,
        'apple' => 30.0,
        'orange' => 50.0,
        'bell' => 100.0,
        'star' => 500.0,
    ];
}

function hh_spin_roll(?callable $rng = null): array
{
    $rng = $rng ?? static fn (int $min, int $max): int => random_int($min, $max);
    $codes = array_keys(hh_spin_symbols());
    $prizes = hh_spin_symbols();
    $win = $rng(1, 10000) <= 1800;
    if (!$win) {
        $tease = $rng(1, 100) <= 40 ? 'star' : $codes[$rng(0, count($codes) - 1)];
        $others = array_values(array_filter($codes, static fn (string $code): bool => $code !== $tease));
        $miss = $others[$rng(0, count($others) - 1)];
        $reels = [$tease, $tease, $miss];
        for ($i = count($reels) - 1; $i > 0; $i--) {
            $j = $rng(0, $i);
            $swap = $reels[$i];
            $reels[$i] = $reels[$j];
            $reels[$j] = $swap;
        }
        return ['symbols' => $reels, 'payout' => 0.0];
    }
    $band = $rng(1, 100);
    if ($band <= 55) {
        $chosen = 'cherry';
    } elseif ($band <= 80) {
        $chosen = 'apple';
    } elseif ($band <= 93) {
        $chosen = 'orange';
    } elseif ($band <= 99) {
        $chosen = 'bell';
    } else {
        $chosen = 'star';
    }
    return ['symbols' => [$chosen, $chosen, $chosen], 'payout' => $prizes[$chosen]];
}

/** How much of a payable total store credit can cover. Totals stay at zero or above. */
function hh_credit_portion(float $payable, float $balance): array
{
    $payable = round(max(0, $payable), 2);
    $balance = round(max(0, $balance), 2);
    $applied = round(min($balance, $payable), 2);
    return [
        'applied' => $applied,
        'total' => round($payable - $applied, 2),
        'balanceAfter' => round($balance - $applied, 2),
    ];
}

function hh_credit_status(string $uid): array
{
    try {
        $pdo = hh_pdo();
        $balance = $pdo->prepare('SELECT balance FROM store_credit WHERE user_uid = ?');
        $balance->execute([$uid]);
        $amount = $balance->fetchColumn();
        $spun = $pdo->prepare('SELECT 1 FROM spins WHERE user_uid = ? AND spun_on = ? LIMIT 1');
        $spun->execute([$uid, hh_shop_today()]);
        return [
            'creditBalance' => $amount === false ? 0.0 : (float) $amount,
            'spunToday' => (bool) $spun->fetchColumn(),
        ];
    } catch (PDOException $error) {
        return ['creditBalance' => 0.0, 'spunToday' => false];
    }
}

function hh_account(array $user): array
{
    return array_merge($user, hh_credit_status($user['uid']));
}

function hh_credit_locked_balance(PDO $pdo, string $uid): float
{
    $stmt = $pdo->prepare('SELECT balance FROM store_credit WHERE user_uid = ? FOR UPDATE');
    $stmt->execute([$uid]);
    $amount = $stmt->fetchColumn();
    return $amount === false ? 0.0 : (float) $amount;
}

function hh_credit_change(PDO $pdo, string $uid, float $delta, string $reason, ?int $spinId, ?int $orderId): float
{
    $next = round(hh_credit_locked_balance($pdo, $uid) + $delta, 2);
    if ($next < 0) {
        throw new RuntimeException('Store credit cannot go below zero.');
    }
    $exists = $pdo->prepare('SELECT 1 FROM store_credit WHERE user_uid = ?');
    $exists->execute([$uid]);
    if ($exists->fetchColumn()) {
        $pdo->prepare('UPDATE store_credit SET balance = ? WHERE user_uid = ?')->execute([$next, $uid]);
    } else {
        $pdo->prepare('INSERT INTO store_credit (user_uid, balance) VALUES (?, ?)')->execute([$uid, $next]);
    }
    $pdo->prepare('INSERT INTO store_credit_ledger (user_uid, amount, balance_after, reason, spin_id, order_id) VALUES (?, ?, ?, ?, ?, ?)')
        ->execute([$uid, round($delta, 2), $next, $reason, $spinId, $orderId]);
    return $next;
}

function hh_spin(array $user): array
{
    $pdo = hh_pdo();
    $uid = (string) $user['uid'];
    $today = hh_shop_today();
    $pdo->beginTransaction();
    try {
        $check = $pdo->prepare('SELECT id FROM spins WHERE user_uid = ? AND spun_on = ? FOR UPDATE');
        $check->execute([$uid, $today]);
        if ($check->fetch()) {
            $pdo->commit();
            throw new RuntimeException('You already used today\'s free spin.');
        }
        $roll = hh_spin_roll();
        $insert = $pdo->prepare('INSERT INTO spins (user_uid, spun_on, reel_1, reel_2, reel_3, payout) VALUES (?, ?, ?, ?, ?, ?)');
        $insert->execute([$uid, $today, $roll['symbols'][0], $roll['symbols'][1], $roll['symbols'][2], $roll['payout']]);
        $spinId = (int) $pdo->lastInsertId();
        $balance = hh_credit_locked_balance($pdo, $uid);
        if ($roll['payout'] > 0) {
            $balance = hh_credit_change($pdo, $uid, (float) $roll['payout'], 'spin', $spinId, null);
        }
        $pdo->commit();
        return [
            'symbols' => $roll['symbols'],
            'payout' => (float) $roll['payout'],
            'creditBalance' => $balance,
            'spunToday' => true,
        ];
    } catch (RuntimeException $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    } catch (PDOException $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        if ((int) ($error->errorInfo[1] ?? 0) === 1062) {
            throw new RuntimeException('You already used today\'s free spin.');
        }
        throw $error;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $error;
    }
}
