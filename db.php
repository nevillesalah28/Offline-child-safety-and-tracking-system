<?php
// ==========================================================================
// CAPSULE TRACKER - DATABASE CONNECTION (PDO)
// ==========================================================================

$host     = '127.0.0.1';
$db       = 'capsule_tracker';
$user     = 'root';
$pass     = ''; // Default XAMPP password is blank
$charset  = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on SQL errors
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Fetch associative arrays
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Disable emulation for true prepared statements
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Return JSON error response if connection fails
    header('Content-Type: application/json');
    echo json_encode([
        'status'  => 'error',
        'message' => 'Database connection failed: ' . $e->getMessage()
    ]);
    exit();
}
?>