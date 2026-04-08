<?php
require_once __DIR__ . '/api/config/database.php';

try {
    // Connect without db first to reset
    $tmpConn = new PDO("mysql:host=localhost;charset=utf8", "root", "1234");
    $tmpConn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $tmpConn->exec("SET FOREIGN_KEY_CHECKS = 0");
    $tmpConn->exec("DROP DATABASE IF EXISTS gym");
    $tmpConn->exec("CREATE DATABASE gym");
    
    // Now use the regular Database class
    $db = (new Database())->getConnection();
    
    $sql = file_get_contents(__DIR__ . '/tmp/final_schema.sql');
    
    // Remove comments
    $sql = preg_replace('/--.*$/m', '', $sql);
    $sql = preg_replace('/\/\*.*?\*\//s', '', $sql);
    
    // Desactivar FK checks para migración limpia
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    // Split statements better
    $statements = array_filter(array_map('trim', explode(';', $sql)));
    foreach ($statements as $s) {
        if (!empty($s)) {
            try {
                $db->exec($s);
            } catch (Exception $e) {
                // If table already exists, ignore if we dropped them, but log errors
                echo "Error on statement near: " . substr($s, 0, 50) . " : " . $e->getMessage() . "\n";
            }
        }
    }
    
    $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "Schema migrated successfully to 'gym' database.\n";
    
    // Insertar un administrador por defecto si no existe
    $pass = password_hash('1234', PASSWORD_DEFAULT);
    $db->exec("INSERT IGNORE INTO users (name, lastname, email, username, password_hash, role, active) VALUES ('Admin', 'Owner', 'admin@gym.com', 'admin', '$pass', 'owner', 1)");
    $db->exec("INSERT IGNORE INTO users (name, lastname, email, username, password_hash, role, active) VALUES ('Trainer', 'One', 'trainer@gym.com', 'trainer1', '$pass', 'trainer', 1)");
    
    echo "Seed data (Admin/Trainer) created.\n";

} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
}
