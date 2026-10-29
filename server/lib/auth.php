<?php

function hh_b64url_decode(string $data): string
{
    $pad = strlen($data) % 4;
    if ($pad) {
        $data .= str_repeat('=', 4 - $pad);
    }
    return base64_decode(strtr($data, '-_', '+/')) ?: '';
}

function hh_cert_cache_path(): string
{
    $dir = dirname(__DIR__) . '/cache';
    if (!is_dir($dir)) {
        mkdir($dir, 0750, true);
    }
    return $dir . '/firebase-certs.json';
}

function hh_firebase_certs(): array
{
    $path = hh_cert_cache_path();
    if (is_file($path)) {
        $cached = json_decode((string) file_get_contents($path), true);
        if (is_array($cached) && ($cached['expires'] ?? 0) > time() && is_array($cached['certs'] ?? null)) {
            return $cached['certs'];
        }
    }
    $context = stream_context_create([
        'http' => ['timeout' => 8, 'header' => "Accept: application/json\r\n"],
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
    ]);
    $url = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
    $raw = @file_get_contents($url, false, $context);
    if ($raw === false) {
        if (is_file($path)) {
            $cached = json_decode((string) file_get_contents($path), true);
            if (is_array($cached['certs'] ?? null)) {
                return $cached['certs'];
            }
        }
        hh_fail(503, 'Could not fetch Firebase signing certificates.');
    }
    $certs = json_decode($raw, true);
    if (!is_array($certs)) {
        hh_fail(503, 'Firebase signing certificates were not valid JSON.');
    }
    $ttl = 3600;
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $header) {
            if (preg_match('/^cache-control:.*max-age=(\d+)/i', $header, $match)) {
                $ttl = max(60, (int) $match[1]);
            }
        }
    }
    file_put_contents($path, json_encode(['expires' => time() + $ttl, 'certs' => $certs]));
    return $certs;
}

function hh_verify_token(string $jwt): array
{
    $config = hh_config();
    if (!empty($config['dev_auth']) && str_starts_with($jwt, 'dev:')) {
        $bits = explode(':', $jwt, 3);
        if (count($bits) !== 3 || $bits[1] === '' || $bits[2] === '') {
            hh_fail(401, 'Dev token must look like dev:uid:email');
        }
        return ['sub' => $bits[1], 'email' => $bits[2], 'email_verified' => true];
    }

    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        hh_fail(401, 'Sign in again. The session token is malformed.');
    }
    $header = json_decode(hh_b64url_decode($parts[0]), true);
    $payload = json_decode(hh_b64url_decode($parts[1]), true);
    if (!is_array($header) || !is_array($payload)) {
        hh_fail(401, 'Sign in again. The session token could not be read.');
    }
    if (($header['alg'] ?? '') !== 'RS256' || empty($header['kid'])) {
        hh_fail(401, 'Sign in again. This token is not an RS256 Firebase token.');
    }
    $certs = hh_firebase_certs();
    $pem = $certs[$header['kid']] ?? null;
    if (!is_string($pem)) {
        hh_fail(401, 'Sign in again. The token signing key is not current.');
    }
    $publicKey = openssl_pkey_get_public($pem);
    if ($publicKey === false) {
        hh_fail(401, 'Sign in again. The signing certificate could not be read.');
    }
    $signature = hh_b64url_decode($parts[2]);
    $valid = openssl_verify($parts[0] . '.' . $parts[1], $signature, $publicKey, OPENSSL_ALGO_SHA256);
    if ($valid !== 1) {
        hh_fail(401, 'Sign in again. The session token signature is invalid.');
    }
    $project = $config['firebase_project_id'] ?? 'gemini-dream-477009';
    if (($payload['aud'] ?? '') !== $project) {
        hh_fail(401, 'This token is for a different Firebase project.');
    }
    if (($payload['iss'] ?? '') !== 'https://securetoken.google.com/' . $project) {
        hh_fail(401, 'This token was not issued by Firebase Auth.');
    }
    if ((int) ($payload['exp'] ?? 0) < time()) {
        hh_fail(401, 'The session has expired. Sign in again.');
    }
    if (empty($payload['sub'])) {
        hh_fail(401, 'The session token has no user id.');
    }
    return $payload;
}

function hh_bearer(): string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($header === '' && function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) {
                $header = $value;
                break;
            }
        }
    }
    if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $match)) {
        hh_fail(401, 'Sign in to continue.');
    }
    return $match[1];
}

function hh_user(): array
{
    $payload = hh_verify_token(hh_bearer());
    $email = strtolower(trim((string) ($payload['email'] ?? '')));
    $admin = false;
    if ($email !== '') {
        $stmt = hh_pdo()->prepare('SELECT 1 FROM admins WHERE LOWER(email) = ? LIMIT 1');
        $stmt->execute([$email]);
        $admin = (bool) $stmt->fetchColumn();
    }
    return [
        'uid' => (string) $payload['sub'],
        'email' => $email,
        'name' => (string) ($payload['name'] ?? ''),
        'admin' => $admin,
    ];
}

function hh_admin(): array
{
    $user = hh_user();
    if (!$user['admin']) {
        hh_fail(403, 'This account is not on the shop desk.');
    }
    return $user;
}
