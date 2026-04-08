<?php
// SEGURIDAD: Este script NUNCA debe estar accesible en producción.
// Bloquear si no es CLI o si no es ambiente de desarrollo.
if (php_sapi_name() !== 'cli' && getenv('APP_ENV') !== 'development') {
    http_response_code(403);
    die('Forbidden');
}

require_once __DIR__ . '/api/config/database.php';
$db = (new Database())->getConnection();

echo "--- USERS ---\n";
print_r($db->query("SELECT id, username, role FROM users")->fetchAll());

echo "\n--- CLIENTS ---\n";
print_r($db->query("SELECT id, name, lastname, dni FROM clients")->fetchAll());

echo "\n--- TRAINING PLANS ---\n";
print_r($db->query("SELECT id, name FROM training_plans")->fetchAll());

echo "\n--- ASSIGNED PLANS ---\n";
print_r($db->query("SELECT * FROM client_training_plans")->fetchAll());
