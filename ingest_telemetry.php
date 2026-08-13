<?php
// ==========================================================================
// CAPSULE TRACKER - TELEMETRY INGESTION & GEOFENCE ENFORCEMENT
// ==========================================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

// Haversine formula to calculate distance in meters between two lat/lng points
function calculateDistanceMeters($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371000; // Earth radius in meters

    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);

    $a = sin($dLat / 2) * sin($dLat / 2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon / 2) * sin($dLon / 2);

    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

    return $earthRadius * $c;
}

// Accept raw JSON payload sent over SIM800L GPRS HTTP POST
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || !isset($data['latitude']) || !isset($data['longitude'])) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Invalid telemetry payload. Latitude and Longitude required.'
    ]);
    exit();
}

$deviceId  = $data['device_id'] ?? 'WRISTBAND_01';
$lat       = (float)$data['latitude'];
$lng       = (float)$data['longitude'];
$speed     = (float)($data['speed'] ?? 0.0);
$battery   = (int)($data['battery_level'] ?? 100);
$heartRate = (int)($data['heart_rate'] ?? 75);
$spo2      = (int)($data['spo2'] ?? 98);
$tamper    = !empty($data['tamper_status']) ? 1 : 0;
$sos       = !empty($data['sos_active']) ? 1 : 0;

try {
    $pdo->beginTransaction();

    // 1. Log telemetry record into MySQL
    $stmt = $pdo->prepare("
        INSERT INTO telemetry_logs 
        (device_id, latitude, longitude, speed, battery_level, heart_rate, spo2, tamper_status, sos_active) 
        VALUES (:device, :lat, :lng, :speed, :battery, :hr, :spo2, :tamper, :sos)
    ");

    $stmt->execute([
        'device'  => $deviceId,
        'lat'     => $lat,
        'lng'     => $lng,
        'speed'   => $speed,
        'battery' => $battery,
        'hr'      => $heartRate,
        'spo2'    => $spo2,
        'tamper'  => $tamper,
        'sos'     => $sos
    ]);

    $generatedAlerts = [];

    // 2. Immediate Hardware Alerts (SOS & Strap Tamper)
    if ($sos) {
        $alertStmt = $pdo->prepare("INSERT INTO alert_logs (device_id, alert_type, message, latitude, longitude) VALUES (:device, 'SOS_PANIC', 'EMERGENCY: Panic button pressed on wristband!', :lat, :lng)");
        $alertStmt->execute(['device' => $deviceId, 'lat' => $lat, 'lng' => $lng]);
        $generatedAlerts[] = 'SOS_PANIC';
    }

    if ($tamper) {
        $alertStmt = $pdo->prepare("INSERT INTO alert_logs (device_id, alert_type, message, latitude, longitude) VALUES (:device, 'TAMPER', 'WARNING: Wristband strap tamper sensor triggered!', :lat, :lng)");
        $alertStmt->execute(['device' => $deviceId, 'lat' => $lat, 'lng' => $lng]);
        $generatedAlerts[] = 'TAMPER';
    }

    // 3. Geofence Evaluation Engine
    $fenceStmt = $pdo->query("SELECT id, name, type, center_lat, center_lng, radius FROM geofences WHERE is_active = 1");
    $activeFences = $fenceStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($activeFences as $fence) {
        $distance = calculateDistanceMeters($lat, $lng, (float)$fence['center_lat'], (float)$fence['center_lng']);
        $radius   = (int)$fence['radius'];

        // Safe Zone Breach: Outside safe boundary
        if ($fence['type'] === 'safe' && $distance > $radius) {
            $msg = sprintf("GEOFENCE EXIT: Device left safe area '%s' (Distance: %dm, Radius: %dm)", $fence['name'], round($distance), $radius);
            
            $alertStmt = $pdo->prepare("INSERT INTO alert_logs (device_id, alert_type, message, latitude, longitude) VALUES (:device, 'GEOFENCE_EXIT', :msg, :lat, :lng)");
            $alertStmt->execute(['device' => $deviceId, 'msg' => $msg, 'lat' => $lat, 'lng' => $lng]);
            $generatedAlerts[] = "EXIT: {$fence['name']}";
        }

        // Danger Zone Breach: Inside dangerous boundary
        if ($fence['type'] === 'danger' && $distance <= $radius) {
            $msg = sprintf("DANGER ZONE ENTRY: Device entered risk area '%s' (Distance: %dm)", $fence['name'], round($distance));
            
            $alertStmt = $pdo->prepare("INSERT INTO alert_logs (device_id, alert_type, message, latitude, longitude) VALUES (:device, 'GEOFENCE_ENTRY', :msg, :lat, :lng)");
            $alertStmt->execute(['device' => $deviceId, 'msg' => $msg, 'lat' => $lat, 'lng' => $lng]);
            $generatedAlerts[] = "ENTRY: {$fence['name']}";
        }
    }

    $pdo->commit();

    echo json_encode([
        'status'         => 'success',
        'message'        => 'Telemetry logged successfully.',
        'alerts_created' => $generatedAlerts
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode([
        'status'  => 'error',
        'message' => 'Telemetry ingestion failed: ' . $e->getMessage()
    ]);
}
?>