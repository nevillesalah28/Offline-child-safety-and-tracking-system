<?php
// ==========================================================================
// CAPSULE TRACKER - GET TRACKING HISTORY & ROUTE PLAYBACK API
// ==========================================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    // Optional Date Filter from GET request (e.g., ?date=2026-08-12)
    $selectedDate = isset($_GET['date']) && !empty($_GET['date']) ? $_GET['date'] : null;

    if ($selectedDate) {
        // Query telemetry logs for a specific date
        $telemetryStmt = $pdo->prepare("
            SELECT 
                id, 
                device_id,
                latitude AS lat, 
                longitude AS lng, 
                speed,
                battery_level,
                heart_rate, 
                spo2, 
                tamper_status,
                sos_active,
                DATE_FORMAT(recorded_at, '%H:%i:%s') AS time,
                recorded_at
            FROM telemetry_logs 
            WHERE DATE(recorded_at) = :selectedDate
            ORDER BY recorded_at ASC
        ");
        $telemetryStmt->execute(['selectedDate' => $selectedDate]);

        // Query alert logs for the same date
        $alertStmt = $pdo->prepare("
            SELECT 
                id, 
                alert_type, 
                message, 
                latitude AS lat, 
                longitude AS lng, 
                DATE_FORMAT(triggered_at, '%H:%i:%s') AS time,
                triggered_at
            FROM alert_logs 
            WHERE DATE(triggered_at) = :selectedDate
            ORDER BY triggered_at ASC
        ");
        $alertStmt->execute(['selectedDate' => $selectedDate]);

    } else {
        // Fetch all telemetry if no date filter is applied
        $telemetryStmt = $pdo->query("
            SELECT 
                id, 
                device_id,
                latitude AS lat, 
                longitude AS lng, 
                speed,
                battery_level,
                heart_rate, 
                spo2, 
                tamper_status,
                sos_active,
                DATE_FORMAT(recorded_at, '%H:%i:%s') AS time,
                recorded_at
            FROM telemetry_logs 
            ORDER BY recorded_at ASC
        ");

        $alertStmt = $pdo->query("
            SELECT 
                id, 
                alert_type, 
                message, 
                latitude AS lat, 
                longitude AS lng, 
                DATE_FORMAT(triggered_at, '%H:%i:%s') AS time,
                triggered_at
            FROM alert_logs 
            ORDER BY triggered_at ASC
        ");
    }

    $telemetryLogs = $telemetryStmt->fetchAll(PDO::FETCH_ASSOC);
    $alertLogs     = $alertStmt->fetchAll(PDO::FETCH_ASSOC);

    // Cast numeric values for clean JSON output
    $formattedTelemetry = array_map(function($log) {
        return [
            'id'           => (int)$log['id'],
            'deviceId'     => $log['device_id'],
            'lat'          => (float)$log['lat'],
            'lng'          => (float)$log['lng'],
            'speed'        => (float)$log['speed'],
            'batteryLevel' => (int)$log['battery_level'],
            'heartRate'    => (int)$log['heart_rate'],
            'spo2'         => (int)$log['spo2'],
            'tamperStatus' => (bool)$log['tamper_status'],
            'sosActive'    => (bool)$log['sos_active'],
            'time'         => $log['time'],
            'recordedAt'   => $log['recorded_at']
        ];
    }, $telemetryLogs);

    $formattedAlerts = array_map(function($alert) {
        return [
            'id'          => (int)$alert['id'],
            'type'        => $alert['alert_type'],
            'message'     => $alert['message'],
            'lat'         => $alert['lat'] !== null ? (float)$alert['lat'] : null,
            'lng'         => $alert['lng'] !== null ? (float)$alert['lng'] : null,
            'time'        => $alert['time'],
            'triggeredAt' => $alert['triggered_at']
        ];
    }, $alertLogs);

    // Return combined JSON payload
    echo json_encode([
        'status' => 'success',
        'count'  => count($formattedTelemetry),
        'data'   => [
            'route'  => $formattedTelemetry,
            'alerts' => $formattedAlerts
        ]
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to fetch history logs: ' . $e->getMessage()
    ]);
}
?>