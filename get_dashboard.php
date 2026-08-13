<?php
// ==========================================================================
// CAPSULE TRACKER - LIVE DASHBOARD DATA API
// ==========================================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    // 1. Fetch latest telemetry record from wristband
    $telemetryStmt = $pdo->query("
        SELECT * FROM telemetry_logs 
        ORDER BY recorded_at DESC, id DESC 
        LIMIT 1
    ");
    $latestTelemetry = $telemetryStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Fetch unresolved active alerts
    $alertsStmt = $pdo->query("
        SELECT * FROM alert_logs 
        WHERE is_resolved = 0 
        ORDER BY triggered_at DESC 
        LIMIT 5
    ");
    $unresolvedAlerts = $alertsStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Return structured JSON payload
    echo json_encode([
        'status'    => 'success',
        'telemetry' => $latestTelemetry ? [
            'deviceId'     => $latestTelemetry['device_id'],
            'latitude'     => (float)$latestTelemetry['latitude'],
            'longitude'    => (float)$latestTelemetry['longitude'],
            'speed'        => (float)$latestTelemetry['speed'],
            'batteryLevel' => (int)$latestTelemetry['battery_level'],
            'heartRate'    => (int)$latestTelemetry['heart_rate'],
            'spo2'         => (int)$latestTelemetry['spo2'],
            'tamperStatus' => (bool)$latestTelemetry['tamper_status'],
            'sosActive'    => (bool)$latestTelemetry['sos_active'],
            'recordedAt'   => $latestTelemetry['recorded_at']
        ] : null,
        'alerts'    => array_map(function($alert) {
            return [
                'id'          => (int)$alert['id'],
                'type'        => $alert['alert_type'],
                'message'     => $alert['message'],
                'latitude'    => $alert['latitude'] !== null ? (float)$alert['latitude'] : null,
                'longitude'   => $alert['longitude'] !== null ? (float)$alert['longitude'] : null,
                'triggeredAt' => $alert['triggered_at']
            ];
        }, $unresolvedAlerts)
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to load dashboard telemetry: ' . $e->getMessage()
    ]);
}
?>