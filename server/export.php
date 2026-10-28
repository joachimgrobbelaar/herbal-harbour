<?php

require __DIR__ . '/lib/bootstrap.php';
hh_cors();

require __DIR__ . '/lib/xlsx.php';
$config = hh_config();
$key = (string) ($_GET['key'] ?? '');
if ($key === '' || !hash_equals((string) $config['export_key'], $key)) {
    hh_fail(401, 'Export key required.');
}
$sheet = (string) ($_GET['sheet'] ?? 'all');
$format = (string) ($_GET['format'] ?? 'csv');
$tables = hh_export_tables($sheet === '' ? 'all' : $sheet);

if ($format === 'xlsx' || $sheet === 'all') {
    header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    header('Content-Disposition: attachment; filename="herbal-harbour.xlsx"');
    echo hh_xlsx($tables);
    exit;
}

$rows = $tables[array_key_first($tables)];
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: inline; filename="' . $sheet . '.csv"');
echo hh_export_csv($rows);
