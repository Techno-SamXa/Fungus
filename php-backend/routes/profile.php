<?php
/**
 * Endpoint de perfil de usuario
 * GET /api/profile
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Solo permitir GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

try {
    // Verificar token de autorización
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
    }
    
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '');
    
    // Verificar token Bearer
    if (!$authHeader || !preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'Token de autorización requerido']);
        exit();
    }

    $token = $matches[1];

    // Decodificar y validar el JWT token
    try {
        $payload = JWT::decode($token);
        if (!$payload || !isset($payload['user_id'])) {
            throw new Exception('Token inválido');
        }
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido o expirado']);
        exit();
    }
    
    $user_id = $payload['user_id'] ?? null;
    
    if (!$user_id) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido']);
        exit();
    }
    
    // Conectar a la base de datos
    $database = new Database();
    $pdo = $database->getUserConnection();
    
    // Obtener información del usuario
    $stmt = $pdo->prepare('SELECT id, username, email, full_name, is_verified, created_at, updated_at FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'Usuario no encontrado']);
        exit();
    }
    
    // Obtener estadísticas de login del usuario
    $stmt = $pdo->prepare('
        SELECT 
            COUNT(CASE WHEN success = TRUE THEN 1 END) as total_logins,
            COUNT(CASE WHEN success = FALSE THEN 1 END) as failed_attempts,
            MAX(CASE WHEN success = TRUE THEN created_at END) as last_login
        FROM auth_logs 
        WHERE user_id = ? AND action = "login"
    ');
    $stmt->execute([$user_id]);
    $login_stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Calcular días desde la creación de la cuenta
    $account_created = new DateTime($user['created_at']);
    $now = new DateTime();
    $account_age_days = $now->diff($account_created)->days;
    
    $stats = [
        'total_logins' => (int)$login_stats['total_logins'],
        'last_login' => $login_stats['last_login'],
        'failed_attempts' => (int)$login_stats['failed_attempts'],
        'account_age_days' => $account_age_days
    ];
    
    // Obtener sesiones activas del usuario
    $stmt = $pdo->prepare('
        SELECT id, created_at, expires_at
        FROM user_sessions 
        WHERE user_id = ? AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 10
    ');
    $stmt->execute([$user_id]);
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Obtener actividad reciente del usuario
    $stmt = $pdo->prepare('
        SELECT action, ip_address, user_agent, success, details, created_at
        FROM auth_logs 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 20
    ');
    $stmt->execute([$user_id]);
    $recent_activity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convertir success a boolean para JSON
    foreach ($recent_activity as &$activity) {
        $activity['success'] = (bool)$activity['success'];
    }
    
    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => (int)$user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'full_name' => $user['full_name'],
            'is_verified' => (bool)$user['is_verified'],
            'created_at' => $user['created_at'],
            'updated_at' => $user['updated_at']
        ],
        'stats' => [
            'total_logins' => $stats['total_logins'],
            'failed_attempts' => $stats['failed_attempts'],
            'last_login' => $stats['last_login'],
            'account_age_days' => $stats['account_age_days']
        ],
        'sessions' => $sessions,
        'recent_activity' => $recent_activity
    ]);
    
} catch (PDOException $e) {
    error_log('Error de base de datos en perfil: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos']);
    
} catch (Exception $e) {
    error_log('Error en perfil: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}
?>