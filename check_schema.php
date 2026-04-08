<?php
// SEGURIDAD: Expone estructura del schema. Solo CLI o dev.
if (php_sapi_name() !== 'cli' && getenv('APP_ENV') !== 'development') {
    http_response_code(403);
    die('Forbidden');
}

require_once __DIR__ . '/api/config/database.php';
$db = (new Database())->getConnection();

echo "gym_settings columns:\n";
foreach($db->query('SHOW COLUMNS FROM gym_settings')->fetchAll() as $c) {
    echo "  {$c['Field']} - {$c['Type']}\n";
}

echo "\nplan_days columns:\n";
foreach($db->query('SHOW COLUMNS FROM plan_days')->fetchAll() as $c) {
    echo "  {$c['Field']} - {$c['Type']}\n";
}

echo "\nweekly_goals columns:\n";
foreach($db->query('SHOW COLUMNS FROM weekly_goals')->fetchAll() as $c) {
    echo "  {$c['Field']} - {$c['Type']}\n";
}
