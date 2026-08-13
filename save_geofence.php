<?php
// ==========================================================================
// CAPSULE TRACKER - SAVE NEW GEOFENCE API
// ==========================================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || empty($data['name']) || !isset($data['centerLat']) || !isset($data['centerLng'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid parameters. Zone name, latitude, and longitude are required.'
    ]);
    exit();
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO geofences (name, type, center_lat, center_lng, radius, is_active) 
        VALUES (:name, :type, :lat, :lng, :radius, 1)
    ");

    $stmt->execute([
        'name'   => trim($data['name']),
        'type'   => $data['type'] === 'danger' ? 'danger' : 'safe',
        'lat'    => (float)$data['centerLat'],
        'lng'    => (float)$data['centerLng'],
        'radius' => (int)($data['radius'] ?? 200)
    ]);

    $newId = $pdo->lastInsertId();

    echo json_encode([
        'status'  => 'success',
        'message' => 'Geofence boundary added successfully.',
        'id'      => (int)$newId
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to save geofence: ' . $e->getMessage()
    ]);
}
?>