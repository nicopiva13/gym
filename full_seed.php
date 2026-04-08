<?php
// SEGURIDAD CRÍTICA: Este script ELIMINA Y RECREA datos. NUNCA debe ejecutarse desde web en producción.
if (php_sapi_name() !== 'cli' && getenv('APP_ENV') !== 'development') {
    http_response_code(403);
    die('Forbidden');
}

/**
 * FIX SCHEMA + FULL SEED
 * Alters schema to use flexible VARCHAR instead of rigid ENUMs
 * Then seeds proper test data
 */
require_once __DIR__ . '/api/config/database.php';

$db = (new Database())->getConnection();

echo "=== FIXING SCHEMA ===\n";

// Fix exercises muscle_group - change from ENUM to VARCHAR
try {
    $db->exec("ALTER TABLE exercises MODIFY COLUMN muscle_group VARCHAR(50) NOT NULL DEFAULT 'other'");
    echo "✓ Fixed exercises.muscle_group to VARCHAR\n";
} catch(Exception $e) { echo "Already ok: {$e->getMessage()}\n"; }

// Fix exercises measurement_type - change from ENUM to VARCHAR
try {
    $db->exec("ALTER TABLE exercises MODIFY COLUMN measurement_type VARCHAR(20) NOT NULL DEFAULT 'reps'");
    echo "✓ Fixed exercises.measurement_type to VARCHAR\n";
} catch(Exception $e) { echo "Already ok: {$e->getMessage()}\n"; }

// Fix plan_days day_of_week - change from ENUM to TINYINT for numeric ordering
try {
    $db->exec("ALTER TABLE plan_days MODIFY COLUMN day_of_week TINYINT UNSIGNED NOT NULL DEFAULT 1");
    echo "✓ Fixed plan_days.day_of_week to TINYINT\n";
} catch(Exception $e) { echo "Already ok: {$e->getMessage()}\n"; }

echo "\n=== SEEDING DATA ===\n";

$db->exec("SET FOREIGN_KEY_CHECKS = 0");

// Clean tables
$tables = [
    'weekly_goals', 'attendances', 'client_training_plans', 'plan_day_exercises',
    'plan_days', 'training_plans', 'client_memberships', 'payments', 'clients',
    'exercises', 'membership_plans', 'gym_settings'
];
foreach ($tables as $t) {
    $db->exec("TRUNCATE TABLE `$t`");
    echo "  Truncated $t\n";
}

// Reset user passwords
$hash = password_hash('1234', PASSWORD_DEFAULT);
$db->exec("UPDATE users SET password_hash = '$hash' WHERE 1=1");
echo "✓ Reset all passwords to '1234'\n";

// Gym Settings
$db->exec("INSERT INTO gym_settings (setting_key, setting_value) VALUES 
('gym_name', 'IRON GYM'),
('membership_alert_days', '7'),
('check_in_max_per_day', '1')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
echo "✓ Gym settings seeded\n";

// Membership Plans
$db->exec("INSERT INTO membership_plans (id, name, description, price, duration_days, active) VALUES
(1, 'Musculación', 'Acceso libre a sala de pesas, L-V', 5000.00, 30, 1),
(2, 'Full Pass', 'Pesas + todas las clases grupales + fin de semana', 8000.00, 30, 1)");
echo "✓ Membership plans seeded\n";

// Clients
$db->exec("INSERT INTO clients (id, trainer_id, name, lastname, dni, email, phone, goal, active) VALUES
(1, 2, 'Juan', 'Perez', '33333333', 'juan@test.com', '1155555555', 'Ganar masa muscular e incrementar fuerza en tren superior', 1),
(2, 2, 'Maria', 'Gomez', '44444444', 'maria@test.com', '1166666666', 'Bajar de peso y tonificar piernas y glúteos', 1)");
echo "✓ 2 clients seeded\n";

// Memberships (Juan: 30 days active, Maria: 5 days = "soon")
$today = date('Y-m-d');
$end30 = date('Y-m-d', strtotime('+30 days'));
$end5 = date('Y-m-d', strtotime('+5 days'));
$db->exec("INSERT INTO client_memberships (client_id, plan_id, start_date, end_date, status) VALUES
(1, 2, '$today', '$end30', 'active'),
(2, 1, '$today', '$end5', 'active')");
echo "✓ Memberships seeded (Juan=30d, Maria=5d próxima a vencer)\n";

// Exercises (muscle_group and measurement_type now as VARCHAR)
$db->exec("INSERT INTO exercises (id, trainer_id, name, muscle_group, measurement_type, description, youtube_url, active) VALUES
(1, 2, 'Press de Banca', 'Pecho', 'reps', 'Ejercicio fundamental para desarrollar el pecho', 'https://www.youtube.com/watch?v=rT7DgCr-3pg', 1),
(2, 2, 'Sentadilla', 'Piernas', 'reps', 'Ejercicio básico de fuerza para piernas', 'https://www.youtube.com/watch?v=ultWZbUMPL8', 1),
(3, 2, 'Peso Muerto', 'Espalda', 'reps', 'Ejercicio compuesto para espalda y piernas', NULL, 1),
(4, 2, 'Dominadas', 'Espalda', 'reps', 'Tracción vertical con peso corporal', NULL, 1),
(5, 2, 'Press Militar', 'Hombros', 'reps', 'Press de hombros con barra o mancuernas', NULL, 1),
(6, 2, 'Plancha Frontal', 'Core', 'time', 'Isometría frontal para core', NULL, 1),
(7, 2, 'Curl de Bíceps', 'Brazos', 'reps', 'Curl alternado con mancuernas', NULL, 1),
(8, 2, 'Extensión de Tríceps', 'Brazos', 'reps', 'Con polea alta o barra', NULL, 1),
(9, 2, 'Remo con Barra', 'Espalda', 'reps', 'Remo horizontal con barra', NULL, 1),
(10, 2, 'Elevaciones Laterales', 'Hombros', 'reps', 'Para deltoides medios', NULL, 1)");
echo "✓ 10 exercises seeded\n";

// Training Plan 1 (active, for Juan and Maria)
$db->exec("INSERT INTO training_plans (id, trainer_id, name, description, status) VALUES
(1, 2, 'PPL Principiante S1', 'Plan Push/Pull/Legs para principiantes - Fase 1. Enfoque en técnica y adaptación.', 'active')");
echo "✓ Training plan seeded\n";

// Plan Days (day_of_week: 1=Lunes, 2=Martes, ..., 5=Viernes)
$db->exec("INSERT INTO plan_days (id, training_plan_id, day_of_week, label) VALUES
(1, 1, 1, 'Lunes'),
(2, 1, 2, 'Martes'),
(3, 1, 3, 'Miércoles'),
(4, 1, 4, 'Jueves'),
(5, 1, 5, 'Viernes')");
echo "✓ 5 plan days seeded\n";

// Plan Day Exercises (comprehensive)
$db->exec("INSERT INTO plan_day_exercises (plan_day_id, exercise_id, sort_order, sets, reps, weight_kg, weight_is_free, rest_seconds, notes) VALUES
-- Lunes: Push (Pecho, Hombros, Tríceps)
(1, 1, 1, 4, 8, 60.00, 0, 90, 'Bajar despacio 3 segundos, pausa 1 segundo abajo'),
(1, 5, 2, 3, 10, 40.00, 0, 75, 'Mantener core activo'),
(1, 8, 3, 3, 12, 20.00, 0, 60, NULL),
-- Martes: Pull (Espalda, Bíceps)
(2, 3, 1, 4, 5, 80.00, 0, 120, 'Mantener espalda recta todo el movimiento'),
(2, 4, 2, 3, 8, 0.00, 1, 90, 'Peso corporal, agarre prono ancho'),
(2, 7, 3, 3, 12, 15.00, 0, 60, NULL),
-- Miércoles: Legs
(3, 2, 1, 4, 8, 80.00, 0, 120, 'Descender hasta paralelo o más profundo'),
(3, 9, 2, 3, 10, 50.00, 0, 90, NULL),
(3, 6, 3, 3, 45, 0.00, 1, 45, '45 segundos por serie, sin apoyo de rodillas'),
-- Jueves: Push B
(4, 1, 1, 3, 10, 55.00, 0, 90, 'Peso levemente menor que Lunes'),
(4, 10, 2, 4, 15, 8.00, 0, 60, 'Codos fijos, sin balancear'),
(4, 8, 3, 3, 12, 18.00, 0, 60, NULL),
-- Viernes: Pull B + Full Body finisher
(5, 3, 1, 3, 6, 85.00, 0, 120, NULL),
(5, 4, 2, 3, 6, 0.00, 1, 90, 'Intentar agregar 1 rep vs martes'),
(5, 2, 3, 3, 12, 60.00, 0, 90, 'Peso ligero, foco en quema')");
echo "✓ Plan day exercises seeded\n";

// Assign plan to both clients
$db->exec("INSERT INTO client_training_plans (client_id, training_plan_id, start_date, active) VALUES
(1, 1, '$today', 1),
(2, 1, '$today', 1)");
echo "✓ Plan assigned to both clients\n";

// Attendance records (realistic history)
$db->exec("INSERT INTO attendances (client_id, registered_by, check_in) VALUES
(1, 2, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(1, 2, DATE_SUB(NOW(), INTERVAL 3 DAY)),
(1, 2, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 2, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(1, 2, DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 2, DATE_SUB(NOW(), INTERVAL 2 DAY)),
(2, 2, DATE_SUB(NOW(), INTERVAL 4 DAY)),
(2, 2, DATE_SUB(NOW(), INTERVAL 6 DAY))");
echo "✓ Attendance records seeded\n";

// Weekly goals
$weekStart = date('Y-m-d', strtotime('monday this week'));
$lastWeek = date('Y-m-d', strtotime('monday last week'));
$twoWeeksAgo = date('Y-m-d', strtotime('monday 2 weeks ago'));
$db->exec("INSERT INTO weekly_goals (client_id, trainer_id, week_start, met_goal, note) VALUES
(1, 2, '$weekStart', 0, 'Semana en progreso'),
(1, 2, '$lastWeek', 1, 'Excelente semana, cumplió todos los ejercicios. Mejoró en sentadilla.'),
(1, 2, '$twoWeeksAgo', 1, 'Completó 4 de 5 días. Buen ritmo.'),
(2, 2, '$lastWeek', 1, 'Muy buen desempeño, bajó 500g'),
(2, 2, '$twoWeeksAgo', 0, 'Faltó martes y jueves')");
echo "✓ Weekly goals seeded\n";

$db->exec("SET FOREIGN_KEY_CHECKS = 1");
echo "\n✅ SEED COMPLETED SUCCESSFULLY!\n";
echo "=========================\n";
echo "Trainer: trainer1 / 1234\n";
echo "Admin:   admin / 1234\n";
echo "Client 1 DNI: 33333333 (Juan Perez)\n";
echo "Client 2 DNI: 44444444 (Maria Gomez)\n";
