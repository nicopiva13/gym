<?php
// SEGURIDAD CRÍTICA: Expone password_hash de todos los usuarios. Solo CLI o dev.
if (php_sapi_name() !== 'cli' && getenv('APP_ENV') !== 'development') {
    http_response_code(403);
    die('Forbidden');
}

require_once __DIR__ . '/api/config/database.php';
$db = (new Database())->getConnection();
$stmt = $db->query("SELECT id, username, role, active, password_hash FROM users");
$users = $stmt->fetchAll();
print_r($users);

foreach ($users as $u) {
    echo "Check '1234' for {$u['username']}: " . (password_verify('1234', $u['password_hash']) ? 'OK' : 'FAIL') . "\n";
}
