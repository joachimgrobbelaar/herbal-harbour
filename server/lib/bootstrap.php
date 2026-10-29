<?php

function hh_read_config(): ?array
{
    static $loaded = false;
    static $config = null;
    if ($loaded) {
        return $config;
    }
    $loaded = true;
    $path = dirname(__DIR__) . '/config.php';
    if (!is_file($path)) {
        return null;
    }
    $read = require $path;
    $config = is_array($read) ? $read : null;
    return $config;
}

function hh_config(): array
{
    $config = hh_read_config();
    if (!is_array($config)) {
        hh_fail(500, 'config.php is missing. Copy config.sample.php to config.php.');
    }
    return $config;
}

function hh_pdo(): PDO
{
    static $pdo;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $db = hh_config()['db'];
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', $db['host'], $db['name'], $db['charset'] ?? 'utf8mb4');
    $pdo = new PDO($dsn, $db['user'], $db['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    return $pdo;
}

function hh_json($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hh_fail(int $status, string $message): void
{
    hh_json(['error' => $message], $status);
}

function hh_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        hh_fail(400, 'Send a JSON object.');
    }
    return $data;
}

function hh_path(): string
{
    if (!empty($_GET['route'])) {
        return '/' . trim((string) $_GET['route'], '/');
    }
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $uri = preg_replace('#/index\.php#', '', $uri) ?? $uri;
    $uri = preg_replace('#^/api(?=/|$)#', '', $uri) ?? $uri;
    $path = '/' . trim($uri, '/');
    return $path === '/' ? '/' : $path;
}

function hh_cors(): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = [
        'https://herbalharbour.co.za',
        'https://www.herbalharbour.co.za',
        'https://canna-spin-and-win.web.app',
        'https://canna-spin-and-win.firebaseapp.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ];
    $config = hh_read_config();
    if (is_array($config['allowed_origins'] ?? null)) {
        $allowed = $config['allowed_origins'];
    }
    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Max-Age: 600');
    }
    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
    if ($origin !== '' && !in_array($origin, $allowed, true)) {
        hh_fail(403, 'This origin is not allowed to call the shop API.');
    }
}

function hh_list($value): array
{
    if (is_array($value)) {
        return array_values(array_filter($value, 'is_string'));
    }
    if (is_string($value) && $value !== '') {
        $decoded = json_decode($value, true);
        return is_array($decoded) ? array_values(array_filter($decoded, 'is_string')) : [];
    }
    return [];
}

function hh_product(array $row): array
{
    $stock = (int) $row['stock'];
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'subtitle' => $row['subtitle'],
        'category' => $row['category'],
        'categoryLabel' => $row['category_label'],
        'strainType' => $row['strain_type'],
        'price' => (float) $row['price'],
        'originalPrice' => $row['original_price'] === null ? null : (float) $row['original_price'],
        'rating' => (float) $row['rating'],
        'reviewCount' => (int) $row['review_count'],
        'thc' => $row['thc'],
        'cbd' => $row['cbd'],
        'terpenes' => hh_list($row['terpenes']),
        'effects' => hh_list($row['effects']),
        'medicalUses' => hh_list($row['medical_uses']),
        'description' => (string) $row['description'],
        'dosageGuide' => (string) $row['dosage_guide'],
        'stock' => $stock,
        'lowStockThreshold' => (int) $row['low_stock_threshold'],
        'inStock' => $stock > 0 && (int) $row['active'] === 1,
        'active' => (int) $row['active'] === 1,
        'isSale' => (int) $row['is_sale'] === 1,
        'isBestSeller' => (int) $row['is_best_seller'] === 1,
        'badge' => $row['badge'],
        'labTestedDate' => (string) $row['lab_tested_date'],
        'batchNumber' => (string) $row['batch_number'],
        'imageUrl' => (string) $row['image_url'],
        'colorGradient' => (string) ($row['color_gradient'] ?: 'from-emerald-100 to-amber-100'),
    ];
}

function hh_iso($value): ?string
{
    if (!$value) {
        return null;
    }
    $time = strtotime((string) $value);
    return $time ? gmdate('c', $time) : null;
}
