<?php
// ==========================================================================
// CAPSULE TRACKER - TOGGLE GEOFENCE STATE API
// ==========================================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!isset($data['id']) || !isset($data['isActive'])) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Zone ID and isActive state are required.'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE geofences SET is_active = :isActive WHERE id = :id");
    $stmt->execute([
        'isActive' => $data['isActive'] ? 1 : 0,
        'id'       => (int)$data['id']
    ]);

    echo json_encode([
        'status'  => 'success',
        'message' => 'Geofence status updated.'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Database update failed: ' . $e->getMessage()
    ]);
}
?>