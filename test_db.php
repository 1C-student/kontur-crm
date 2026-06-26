<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';
$port = '5432';
$dbname = 'kontur_crm';
$user = 'postgre';
$password = 'postgres';

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')");
    $tableExists = $stmt->fetchColumn();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Подключено к БД',
        'table_users_exists' => $tableExists
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Ошибка БД: ' . $e->getMessage()
    ]);
}
?>