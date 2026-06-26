<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

session_start();

// ===== ПОДКЛЮЧЕНИЕ К БД =====
$host = 'localhost';
$port = '5432';
$dbname = 'kontur_crm';
$user = 'postgres';
$password = 'postgres';

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Ошибка БД: ' . $e->getMessage()]);
    exit;
}

$action = $_GET['action'] ?? '';

// ===== ME =====
if ($action === 'me') {
    if (isset($_SESSION['user'])) {
        echo json_encode(['success' => true, 'user' => $_SESSION['user']]);
    } else {
        echo json_encode(['success' => false]);
    }
    exit;
}

// ===== LOGIN (без хэша) =====
if ($action === 'login') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['email']) || !isset($input['password'])) {
        echo json_encode(['success' => false, 'message' => 'Введите email и пароль']);
        exit;
    }
    
    $email = trim($input['email']);
    $pass = trim($input['password']);
    
    try {
        // Ищем пользователя по email
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Сравниваем пароль как есть (без хэша)
        if ($user && $user['password'] === $pass) {
            $_SESSION['user'] = [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'] ?? 'user'
            ];
            echo json_encode(['success' => true, 'role' => $user['role'] ?? 'user', 'message' => 'Вход выполнен']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Неверный email или пароль']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка: ' . $e->getMessage()]);
    }
    exit;
}

// ===== REGISTER (без хэша) =====
if ($action === 'register') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'Нет данных']);
        exit;
    }
    
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $pass = trim($input['password'] ?? '');
    
    if (empty($name) || empty($email) || empty($pass)) {
        echo json_encode(['success' => false, 'message' => 'Заполните все поля']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Email уже зарегистрирован']);
            exit;
        }
        
        // Сохраняем пароль как есть (без хэша)
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')");
        $stmt->execute([$name, $email, $pass]);
        
        echo json_encode(['success' => true, 'message' => 'Регистрация успешна']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка: ' . $e->getMessage()]);
    }
    exit;
}

// ===== LOGOUT =====
if ($action === 'logout') {
    session_destroy();
    echo json_encode(['success' => true]);
    exit;
}

// ===== CREATE REQUEST =====
if ($action === 'create_request') {
    if (!isset($_SESSION['user'])) {
        echo json_encode(['success' => false, 'message' => 'Авторизуйтесь']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'Нет данных']);
        exit;
    }
    
    $name = trim($input['name'] ?? '');
    $phone = trim($input['phone'] ?? '');
    $service = trim($input['service'] ?? '');
    $comment = trim($input['comment'] ?? '');
    
    if (empty($name) || empty($phone) || empty($service)) {
        echo json_encode(['success' => false, 'message' => 'Заполните обязательные поля']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("INSERT INTO requests (user_id, name, phone, service, comment) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$_SESSION['user']['id'], $name, $phone, $service, $comment]);
        echo json_encode(['success' => true, 'message' => 'Заявка отправлена']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка: ' . $e->getMessage()]);
    }
    exit;
}

// ===== ADMIN REQUESTS =====
if ($action === 'admin_requests') {
    if (!isset($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
        echo json_encode(['success' => false, 'message' => 'Доступ запрещён']);
        exit;
    }
    
    $status = $_GET['status'] ?? 'all';
    $order = $_GET['order'] ?? 'desc';
    
    try {
        $sql = "SELECT r.*, u.name as user_name, u.email as user_email 
                FROM requests r 
                JOIN users u ON r.user_id = u.id";
        
        if ($status !== 'all') {
            $sql .= " WHERE r.status = :status";
        }
        $sql .= " ORDER BY r.created_at " . ($order === 'asc' ? 'ASC' : 'DESC');
        
        $stmt = $pdo->prepare($sql);
        if ($status !== 'all') {
            $stmt->bindValue(':status', $status);
        }
        $stmt->execute();
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'requests' => $requests]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка: ' . $e->getMessage()]);
    }
    exit;
}

// ===== UPDATE STATUS =====
if ($action === 'update_status') {
    if (!isset($_SESSION['user']) || ($_SESSION['user']['role'] ?? '') !== 'admin') {
        echo json_encode(['success' => false, 'message' => 'Доступ запрещён']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'Нет данных']);
        exit;
    }
    
    $id = $input['id'] ?? 0;
    $status = $input['status'] ?? '';
    
    $allowed = ['new', 'processed', 'completed', 'canceled'];
    if (!in_array($status, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Неверный статус']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE requests SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
        echo json_encode(['success' => true, 'message' => 'Статус обновлён']);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Ошибка: ' . $e->getMessage()]);
    }
    exit;
}

// ===== ПО УМОЛЧАНИЮ =====
echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
?>