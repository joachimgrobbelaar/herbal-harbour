<?php
/**
 * Optional cron. DirectAdmin → Cron Jobs, every 10 minutes:
 *   php /home/USER/domains/api.herbalharbour.co.za/public_html/cron/sync-sheet.php
 * Does nothing unless config.php sheets.spreadsheet_id and a service-account JSON are set.
 * The shop does not depend on this. Excel can refresh export.php instead.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__) . '/lib/bootstrap.php';
require dirname(__DIR__) . '/lib/xlsx.php';

$config = hh_config();
$sheetId = trim((string) ($config['sheets']['spreadsheet_id'] ?? ''));
$raw = $config['sheets']['service_account_json'] ?? '';
if ($sheetId === '') {
    $value = hh_pdo()->query("SELECT setting_value FROM settings WHERE setting_key = 'spreadsheet_id'")->fetchColumn();
    $sheetId = trim((string) $value);
}
if ($sheetId === '' || $raw === '') {
    fwrite(STDOUT, "Sheets sync skipped. Set sheets.spreadsheet_id and sheets.service_account_json in config.php.\n");
    exit(0);
}
$creds = str_starts_with(trim($raw), '{') ? json_decode($raw, true) : json_decode((string) file_get_contents($raw), true);
if (!is_array($creds) || empty($creds['client_email']) || empty($creds['private_key'])) {
    fwrite(STDERR, "Service account JSON is incomplete.\n");
    exit(1);
}

function hh_b64url(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

$now = time();
$claim = hh_b64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
$body = hh_b64url(json_encode([
    'iss' => $creds['client_email'],
    'scope' => 'https://www.googleapis.com/auth/spreadsheets',
    'aud' => 'https://oauth2.googleapis.com/token',
    'iat' => $now,
    'exp' => $now + 3600,
]));
$unsigned = $claim . '.' . $body;
openssl_sign($unsigned, $signature, $creds['private_key'], OPENSSL_ALGO_SHA256);
$jwt = $unsigned . '.' . hh_b64url($signature);

$tokenResponse = file_get_contents('https://oauth2.googleapis.com/token', false, stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]),
        'timeout' => 15,
    ],
]));
$token = json_decode((string) $tokenResponse, true)['access_token'] ?? '';
if ($token === '') {
    fwrite(STDERR, "Could not mint a Google access token.\n");
    exit(1);
}

$tables = hh_export_tables('all');
$titles = ['Products' => 'Products', 'Orders' => 'Orders', 'StockMovements' => 'StockMovements'];
foreach ($tables as $title => $rows) {
    $range = rawurlencode($title . '!A1');
    $url = 'https://sheets.googleapis.com/v4/spreadsheets/' . rawurlencode($sheetId) . '/values/' . $range . '?valueInputOption=RAW';
    $payload = json_encode(['range' => $title . '!A1', 'majorDimension' => 'ROWS', 'values' => $rows]);
    $result = file_get_contents($url, false, stream_context_create([
        'http' => [
            'method' => 'PUT',
            'header' => "Authorization: Bearer {$token}\r\nContent-Type: application/json\r\n",
            'content' => $payload,
            'timeout' => 20,
            'ignore_errors' => true,
        ],
    ]));
    if ($result === false || !str_contains((string) $result, 'updatedRange') && !str_contains((string) $result, 'updatedCells')) {
        fwrite(STDERR, "Sheet update failed for {$title}: {$result}\n");
        exit(1);
    }
    fwrite(STDOUT, "Updated {$title}\n");
}
