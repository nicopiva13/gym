<?php
// SEGURIDAD: Expone estructura completa de la base de datos. Solo CLI o dev.
if (php_sapi_name() !== 'cli' && getenv('APP_ENV') !== 'development') {
    http_response_code(403);
    die('Forbidden');
}

require_once __DIR__ . '/api/config/database.php';

$db = (new Database())->getConnection();

echo "=== QA DIAGNOSTIC REPORT ===\n\n";

// 1. Check tables
echo "--- TABLES ---\n";
$tables = ['users', 'clients', 'exercises', 'training_plans', 'plan_days', 
           'plan_day_exercises', 'client_training_plans', 'membership_plans', 
           'client_memberships', 'payments', 'attendances', 'weekly_goals', 'gym_settings'];
foreach ($tables as $t) {
    try {
        $count = $db->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        echo "  ✓ $t: $count rows\n";
    } catch (Exception $e) {
        echo "  ✗ $t: MISSING - " . $e->getMessage() . "\n";
    }
}

// 2. Users
echo "\n--- USERS ---\n";
$users = $db->query("SELECT id, username, role, active FROM users")->fetchAll();
foreach ($users as $u) {
    echo "  id={$u['id']} username={$u['username']} role={$u['role']} active={$u['active']}\n";
}

// 3. Clients  
echo "\n--- CLIENTS ---\n";
$clients = $db->query("SELECT id, name, lastname, dni, trainer_id, active FROM clients")->fetchAll();
foreach ($clients as $c) {
    echo "  id={$c['id']} name={$c['name']} {$c['lastname']} dni={$c['dni']} trainer_id={$c['trainer_id']} active={$c['active']}\n";
}

// 4. Exercises
echo "\n--- EXERCISES (count by trainer) ---\n";
$exCount = $db->query("SELECT trainer_id, COUNT(*) as cnt FROM exercises GROUP BY trainer_id")->fetchAll();
foreach ($exCount as $e) {
    echo "  trainer_id={$e['trainer_id']}: {$e['cnt']} exercises\n";
}

// 5. Training Plans
echo "\n--- TRAINING PLANS ---\n";
$plans = $db->query("SELECT id, name, trainer_id, status FROM training_plans")->fetchAll();
foreach ($plans as $p) {
    echo "  id={$p['id']} name={$p['name']} trainer={$p['trainer_id']} status={$p['status']}\n";
}

// 6. Plan assignments
echo "\n--- CLIENT TRAINING PLAN ASSIGNMENTS ---\n";
$assigns = $db->query("SELECT ctp.*, tp.name as plan_name FROM client_training_plans ctp JOIN training_plans tp ON ctp.training_plan_id = tp.id")->fetchAll();
foreach ($assigns as $a) {
    echo "  client_id={$a['client_id']} plan='{$a['plan_name']}' active={$a['active']} start={$a['start_date']}\n";
}

// 7. Memberships
echo "\n--- MEMBERSHIPS ---\n";
$mems = $db->query("SELECT cm.*, mp.name as plan_name FROM client_memberships cm JOIN membership_plans mp ON cm.plan_id = mp.id")->fetchAll();
foreach ($mems as $m) {
    $daysLeft = ceil((strtotime($m['end_date']) - time()) / 86400);
    echo "  client_id={$m['client_id']} plan='{$m['plan_name']}' status={$m['status']} end={$m['end_date']} days_left=$daysLeft\n";
}

// 8. Plan structure check
echo "\n--- PLAN DAYS & EXERCISES ---\n";
$planDays = $db->query("SELECT pd.*, tp.name as plan_name FROM plan_days pd JOIN training_plans tp ON pd.training_plan_id = tp.id ORDER BY pd.training_plan_id, pd.day_of_week")->fetchAll();
foreach ($planDays as $pd) {
    $exCount2 = $db->prepare("SELECT COUNT(*) FROM plan_day_exercises WHERE plan_day_id = ?");
    $exCount2->execute([$pd['id']]);
    $cnt = $exCount2->fetchColumn();
    echo "  plan='{$pd['plan_name']}' day={$pd['day_of_week']} ({$pd['label']}) exercises=$cnt\n";
}

// 9. Check for schema issues
echo "\n--- SCHEMA CHECKS ---\n";
$cols = $db->query("SHOW COLUMNS FROM plan_day_exercises")->fetchAll();
echo "  plan_day_exercises columns: " . implode(', ', array_column($cols, 'Field')) . "\n";

$cols2 = $db->query("SHOW COLUMNS FROM exercises")->fetchAll();
echo "  exercises columns: " . implode(', ', array_column($cols2, 'Field')) . "\n";

$cols3 = $db->query("SHOW COLUMNS FROM clients")->fetchAll();
echo "  clients columns: " . implode(', ', array_column($cols3, 'Field')) . "\n";

$cols4 = $db->query("SHOW COLUMNS FROM users")->fetchAll();
echo "  users columns: " . implode(', ', array_column($cols4, 'Field')) . "\n";

echo "\n=== END DIAGNOSTIC ===\n";
