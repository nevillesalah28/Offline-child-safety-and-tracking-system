<?php
// ==========================================================================
// CAPSULE TRACKER - FETCH GEOFENCES API
// ==========================================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db.php';

try {
    $stmt = $pdo->query("
        SELECT id, name, type, center_lat, center_lng, radius, is_active 
        FROM geofences 
        ORDER BY id DESC
    ");
    $geofences = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted = array_map(function($zone) {
        return [
            'id'        => (int)$zone['id'],
            'name'      => $zone['name'],
            'type'      => $zone['type'],
            'centerLat' => (float)$zone['center_lat'],
            'centerLng' => (float)$zone['center_lng'],
            'radius'    => (int)$zone['radius'],
            'isActive'  => (bool)$zone['is_active']
        ];
    }, $geofences);

    echo json_encode([
        'status'    => 'success',
        'geofences' => $formatted
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to retrieve geofences: ' . $e->getMessage()
    ]);
}
?>