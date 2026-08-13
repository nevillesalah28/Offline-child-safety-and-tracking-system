<?php
// ==========================================================================
// CAPSULE TRACKER - DELETE GEOFENCE API
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

if (!isset($data['id'])) {
    http_response_code(400);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Zone ID is required.'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("DELETE FROM geofences WHERE id = :id");
    $stmt->execute(['id' => (int)$data['id']]);

    echo json_encode([
        'status'  => 'success',
        'message' => 'Geofence removed successfully.'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to delete geofence: ' . $e->getMessage()
    ]);
}
?>