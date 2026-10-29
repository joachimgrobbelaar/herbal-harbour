<?php
// Used only by `php -S` locally. Shared hosting uses .htaccess instead.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if ($path === '/export.php') {
    require __DIR__ . '/export.php';
    return true;
}
require __DIR__ . '/index.php';
return true;
