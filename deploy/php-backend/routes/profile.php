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
    // Obtener token del header Authorization
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($authHeader)) {
        http_response_code(401);
        echo json_encode(['error' => 'Token de autorización requerido']);
        exit();
    }
    
    // Extraer token (formato: "Bearer <token>")
    if (strpos($authHeader, 'Bearer ') !== 0) {
        http_response_code(401);
        echo json_encode(['error' => 'Formato de token inválido']);
        exit();
    }
    
    $token = substr($authHeader, 7); // Remover "Bearer "
    
    // Decodificar y validar token JWT
    try {
        $payload = JWT::decode($token);
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
    $stmt = $pdo->prepare('
        SELECT id, username, email, full_name, is_verified, created_at, updated_at 
        FROM users 
        WHERE id = ?
    ');
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
            COUNT(CASE WHEN action = "login" AND success = TRUE THEN 1 END) as successful_logins,
            COUNT(CASE WHEN action = "login" AND success = FALSE THEN 1 END) as failed_logins,
            MAX(CASE WHEN action = "login" AND success = TRUE THEN created_at END) as last_login,
            MIN(CASE WHEN action = "register" THEN created_at END) as registration_date
        FROM auth_logs 
        WHERE user_id = ?
    ');
    $stmt->execute([$user_id]);
    $stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Obtener sesiones activas
    $stmt = $pdo->prepare('
        SELECT COUNT(*) as active_sessions
        FROM user_sessions 
        WHERE user_id = ? AND expires_at > NOW()
    ');
    $stmt->execute([$user_id]);
    $sessions = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Obtener actividad reciente
    $stmt = $pdo->prepare('
        SELECT action, success, ip_address, created_at
        FROM auth_logs 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ');
    $stmt->execute([$user_id]);
    $recent_activity = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
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
            'successful_logins' => (int)$stats['successful_logins'],
            'failed_logins' => (int)$stats['failed_logins'],
            'last_login' => $stats['last_login'],
            'registration_date' => $stats['registration_date'],
            'active_sessions' => (int)$sessions['active_sessions']
        ],
        'recent_activity' => array_map(function($activity) {
            return [
                'action' => $activity['action'],
                'success' => (bool)$activity['success'],
                'ip_address' => $activity['ip_address'],
                'created_at' => $activity['created_at']
            ];
        }, $recent_activity)
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