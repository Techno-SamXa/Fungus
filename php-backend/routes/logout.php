<?php
/**
 * Endpoint de logout de usuarios
 * POST /api/logout
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit();
}

try {
    // Obtener token del header Authorization
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    $user_id = null;
    $username = 'unknown';
    
    // Si hay token, intentar decodificarlo para obtener info del usuario
    if (!empty($authHeader) && strpos($authHeader, 'Bearer ') === 0) {
        $token = substr($authHeader, 7); // Remover "Bearer "
        
        try {
            $payload = JWT::decode($token);
            $user_id = $payload['user_id'] ?? null;
            $username = $payload['username'] ?? 'unknown';
        } catch (Exception $e) {
            // Token inválido o expirado, pero continuamos con el logout
        }
    }
    
    // Obtener datos JSON del request (puede incluir session_token)
    $input = json_decode(file_get_contents('php://input'), true);
    $session_token = $input['session_token'] ?? null;
    
    // Conectar a la base de datos
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Si tenemos user_id, eliminar todas las sesiones del usuario
    if ($user_id) {
        // Eliminar sesiones activas del usuario
        $stmt = $pdo->prepare('DELETE FROM user_sessions WHERE user_id = ?');
        $stmt->execute([$user_id]);
        $deleted_sessions = $stmt->rowCount();
        
        // Registrar logout en logs
        $stmt = $pdo->prepare('
            INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success, details, created_at) 
            VALUES (?, "logout", ?, ?, TRUE, ?, NOW())
        ');
        $stmt->execute([
            $user_id,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            "Sesiones eliminadas: {$deleted_sessions}"
        ]);
        
        $message = "Logout exitoso para usuario {$username}";
        
    } elseif ($session_token) {
        // Si solo tenemos session_token, eliminar esa sesión específica
        $stmt = $pdo->prepare('DELETE FROM user_sessions WHERE token_hash = ?');
        $stmt->execute([hash('sha256', $session_token)]);
        $deleted_sessions = $stmt->rowCount();
        
        // Registrar logout en logs (sin user_id)
        $stmt = $pdo->prepare('
            INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success, details, created_at) 
            VALUES (NULL, "logout", ?, ?, TRUE, "Sesión específica eliminada", NOW())
        ');
        $stmt->execute([
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
        
        $message = $deleted_sessions > 0 ? 'Sesión cerrada exitosamente' : 'Sesión ya expirada o inválida';
        
    } else {
        // Logout sin token válido
        $stmt = $pdo->prepare('
            INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success, details, created_at) 
            VALUES (NULL, "logout", ?, ?, TRUE, "Logout sin token válido", NOW())
        ');
        $stmt->execute([
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
        
        $message = 'Logout procesado';
    }
    
    // Limpiar sesiones expiradas de la base de datos
    $stmt = $pdo->prepare('DELETE FROM user_sessions WHERE expires_at < NOW()');
    $stmt->execute();
    $expired_cleaned = $stmt->rowCount();
    
    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'details' => [
            'user_sessions_deleted' => $deleted_sessions ?? 0,
            'expired_sessions_cleaned' => $expired_cleaned,
            'user_id' => $user_id,
            'username' => $username
        ]
    ]);
    
} catch (PDOException $e) {
    error_log('Error de base de datos en logout: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos']);
    
} catch (Exception $e) {
    error_log('Error en logout: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}
?>