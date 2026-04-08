<?php
// SEGURIDAD CRÍTICA: Este script NUNCA debe estar accesible en producción.
// Ejecutar ÚNICAMENTE desde CLI. Bloquear acceso web.
if (php_sapi_name() !== 'cli' && getenv('APP_ENV') !== 'development') {
    http_response_code(403);
    die('Forbidden');
}

require_once __DIR__ . '/api/config/database.php';
$db = (new Database())->getConnection();

// CORRECCIÓN: Usar prepared statements en lugar de interpolación de string.
// La interpolación era segura aquí (password_hash no es user input) pero
// el patrón es peligroso y debe evitarse como norma.
$pass = password_hash('1234', PASSWORD_DEFAULT);

$stmt = $db->prepare("UPDATE users SET password_hash = :ph WHERE username = 'admin'");
$stmt->execute([':ph' => $pass]);

$stmt2 = $db->prepare("UPDATE users SET password_hash = :ph WHERE username = 'trainer1'");
$stmt2->execute([':ph' => $pass]);

echo "Admin & Trainer passwords updated to '1234'\n";
