<?php
// ==========================================================================
// CAPSULE TRACKER - GET SYSTEM SETTINGS API
// ==========================================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db.php';

try {
    $stmt = $pdo->query("SELECT setting_key, setting_value FROM system_settings");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert key-value table rows into a clean JSON object
    $settings = [];
    foreach ($rows as $row) {
        $val = $row['setting_value'];
        
        // Parse boolean string representations into native PHP booleans
        if ($val === 'true') {
            $val = true;
        } elseif ($val === 'false') {
            $val = false;
        } elseif (is_numeric($val)) {
            $val = $val + 0; // Cast to integer or float
        }
        
        $settings[$row['setting_key']] = $val;
    }

    echo json_encode([
        'status'   => 'success',
        'settings' => $settings
    ]);

} catch (PDOException $e) {
    echo json_encode([
        'status'  => 'error',
        'message' => 'Failed to fetch system settings: ' . $e->getMessage()
    ]);
}
?>