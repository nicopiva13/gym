<?php
require_once __DIR__ . '/api/config/database.php';
$db = (new Database())->getConnection();

foreach(['exercises','membership_plans','clients'] as $t) {
    echo "$t:\n";
    foreach($db->query("SHOW COLUMNS FROM $t")->fetchAll() as $c) {
        echo "  {$c['Field']} - {$c['Type']}\n";
    }
    echo "\n";
}
