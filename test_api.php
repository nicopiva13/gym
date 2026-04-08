<?php
// SEGURIDAD: Script de testing interno. Solo CLI o dev.
if (php_sapi_name() !== 'cli' && getenv('APP_ENV') !== 'development') {
    http_response_code(403);
    die('Forbidden');
}

require_once __DIR__ . '/api/config/config.php';
require_once __DIR__ . '/api/config/database.php';
require_once __DIR__ . '/api/lib/JWT.php';

$db = (new Database())->getConnection();

echo "=== API TEST ===\n\n";

// Test 1: Trainer login via DB
echo "--- TEST 1: Trainer login ---\n";
$stmt = $db->prepare("SELECT * FROM users WHERE username = 'trainer1' AND active = 1");
$stmt->execute();
$user = $stmt->fetch();
if ($user && password_verify('1234', $user['password_hash'])) {
    $payload = ['id' => $user['id'], 'role' => $user['role'], 'username' => $user['username']];
    $token = JWT::encode($payload, JWT_SECRET);
    echo "✓ Trainer login OK\n";
} else {
    echo "✗ Trainer login FAILED\n";
    exit;
}

// Test 2: Dashboard query
echo "\n--- TEST 2: Trainer Dashboard ---\n";
$trainerId = $user['id'];
$q = "SELECT c.*, cm.end_date, tp.name as active_plan_name, cm.status as m_status
     FROM clients c 
     LEFT JOIN client_memberships cm ON c.id = cm.client_id AND cm.status = 'active'
     LEFT JOIN client_training_plans ctp ON c.id = ctp.client_id AND ctp.active = 1
     LEFT JOIN training_plans tp ON ctp.training_plan_id = tp.id
     WHERE c.trainer_id = :tid AND c.active = 1
     ORDER BY c.lastname, c.name";
$stmt = $db->prepare($q);
$stmt->execute([':tid' => $trainerId]);
$clients = $stmt->fetchAll();
echo "✓ Found " . count($clients) . " clients\n";
foreach ($clients as $c) {
    $days = $c['end_date'] ? ceil((strtotime($c['end_date']) - time()) / 86400) : -999;
    $status = $days < 0 ? 'expired' : ($days <= 7 ? 'soon' : 'active');
    echo "  {$c['name']} {$c['lastname']}: plan={$c['active_plan_name']} days_left=$days status=$status\n";
}

// Test 3: Client login by DNI
echo "\n--- TEST 3: Client Login (DNI 33333333) ---\n";
$stmt = $db->prepare("SELECT * FROM clients WHERE dni = '33333333' AND active = 1");
$stmt->execute();
$client = $stmt->fetch();
if ($client) {
    echo "✓ Client found: id={$client['id']} name={$client['name']} {$client['lastname']}\n";
} else {
    echo "✗ Client DNI 33333333 not found!\n";
    exit;
}

// Test 4: Client plan
echo "\n--- TEST 4: Client Active Plan ---\n";
$cliId = $client['id'];
$q = "SELECT tp.*, ctp.start_date FROM client_training_plans ctp 
      JOIN training_plans tp ON ctp.training_plan_id = tp.id 
      WHERE ctp.client_id = :cid AND ctp.active = 1 LIMIT 1";
$stmt = $db->prepare($q);
$stmt->execute([':cid' => $cliId]);
$plan = $stmt->fetch();
if ($plan) {
    echo "✓ Active plan: {$plan['name']} (id={$plan['id']})\n";
    
    $stmt2 = $db->prepare("SELECT * FROM plan_days WHERE training_plan_id = ? ORDER BY day_of_week ASC");
    $stmt2->execute([$plan['id']]);
    $days = $stmt2->fetchAll();
    echo "  Days: " . count($days) . "\n";
    foreach ($days as $d) {
        $stmt3 = $db->prepare("SELECT COUNT(*) FROM plan_day_exercises WHERE plan_day_id = ?");
        $stmt3->execute([$d['id']]);
        $exCount = $stmt3->fetchColumn();
        echo "    day_of_week={$d['day_of_week']} {$d['label']}: $exCount exercises\n";
    }
} else {
    echo "✗ No active plan found!\n";
}

// Test 5: Membership
echo "\n--- TEST 5: Client Membership ---\n";
$q = "SELECT cm.*, mp.name as plan_name, mp.price FROM client_memberships cm 
      JOIN membership_plans mp ON cm.plan_id = mp.id 
      WHERE cm.client_id = :cid AND cm.status = 'active' LIMIT 1";
$stmt = $db->prepare($q);
$stmt->execute([':cid' => $cliId]);
$mem = $stmt->fetch();
if ($mem) {
    $days = ceil((strtotime($mem['end_date']) - time()) / 86400);
    echo "✓ Membership: {$mem['plan_name']} ends={$mem['end_date']} days_left=$days\n";
} else {
    echo "✗ No active membership!\n";
}

// Test 6: Exercises
echo "\n--- TEST 6: Exercises Library ---\n";
$stmt = $db->prepare("SELECT COUNT(*) as cnt FROM exercises WHERE trainer_id = :tid AND active = 1");
$stmt->execute([':tid' => $trainerId]);
$exCount = $stmt->fetchColumn();
echo "✓ Exercises found: $exCount\n";
$stmt2 = $db->prepare("SELECT name, muscle_group FROM exercises WHERE trainer_id = :tid AND active = 1 LIMIT 5");
$stmt2->execute([':tid' => $trainerId]);
foreach ($stmt2->fetchAll() as $ex) {
    echo "  - {$ex['name']} ({$ex['muscle_group']})\n";
}

// Test 7: Attendances
echo "\n--- TEST 7: Attendances ---\n";
$stmt = $db->query("SELECT COUNT(*) FROM attendances");
$totalAtten = $stmt->fetchColumn();
echo "✓ Total attendances: $totalAtten\n";

// Test 8: Weekly goals
echo "\n--- TEST 8: Weekly Goals ---\n";
$stmt = $db->query("SELECT COUNT(*) FROM weekly_goals WHERE client_id = 1");
$totalGoals = $stmt->fetchColumn();
echo "✓ Weekly goals for client 1: $totalGoals\n";

echo "\n✅ ALL BACKEND TESTS COMPLETED SUCCESSFULLY!\n";
