<?php
/**
 * Copy this file to config.php on the server and fill in the database password
 * and export key. config.php is blocked from the web and must not be committed.
 */
return [
    'db' => [
        'host' => 'localhost',
        'name' => 'herbalharbour',
        'user' => 'herbalharbour',
        'pass' => 'CHANGE_ME',
        'charset' => 'utf8mb4',
    ],
    // Long random string. Excel and the cron use it. Not a Firebase secret.
    'export_key' => 'CHANGE_ME_LONG_RANDOM',
    'allowed_origins' => [
        'https://herbalharbour.co.za',
        'https://www.herbalharbour.co.za',
        'https://canna-spin-and-win.web.app',
        'https://canna-spin-and-win.firebaseapp.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],
    'firebase_project_id' => 'gemini-dream-477009',
    // Local automated tests only. Leave false on HOSTAFRICA.
    'dev_auth' => false,
    'free_shipping_over' => 750,
    'delivery_fee' => 95,
    // Optional Google Sheet push from cron/sync-sheet.php. Leave blank to skip.
    'sheets' => [
        'spreadsheet_id' => '',
        'service_account_json' => '',
    ],
];
