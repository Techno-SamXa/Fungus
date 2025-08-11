<?php
/**
 * Endpoint de login de usuarios
 * POST /api/login
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
    // Obtener datos JSON del request
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Datos JSON inválidos']);
        exit();
    }
    
    // Extraer y validar campos
    $login = trim($input['login'] ?? $input['username'] ?? $input['email'] ?? '');
    $password = $input['password'] ?? '';
    $remember_me = $input['remember_me'] ?? false;
    
    // Validaciones básicas
    if (empty($login) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Usuario/email y contraseña son obligatorios']);
        exit();
    }
    
    // Conectar a la base de datos de usuarios
    $database = new Database();
    $pdo = $database->getUserConnection();
    
    // Buscar usuario por username o email
    $stmt = $pdo->prepare('SELECT id, username, email, password_hash, is_verified FROM users WHERE username = ? OR email = ?');
    $stmt->execute([$login, $login]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Registrar intento de login
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    if (!$user) {
        // Usuario no encontrado
        $stmt = $pdo->prepare('
            INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success, details, created_at) 
            VALUES (NULL, "login_failed", ?, ?, FALSE, "Usuario no encontrado", NOW())
        ');
        $stmt->execute([$ip_address, $user_agent]);
        
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        exit();
    }
    
    // Verificar contraseña
    if (!password_verify($password, $user['password_hash'])) {
        // Contraseña incorrecta
        $stmt = $pdo->prepare('
            INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success, details, created_at) 
            VALUES (?, "login_failed", ?, ?, FALSE, "Contraseña incorrecta", NOW())
        ');
        $stmt->execute([$user['id'], $ip_address, $user_agent]);
        
        http_response_code(401);
        echo json_encode(['error' => 'Credenciales inválidas']);
        exit();
    }
    
    // Login exitoso - registrar en logs
    $stmt = $pdo->prepare('
        INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success, created_at) 
        VALUES (?, "login", ?, ?, TRUE, NOW())
    ');
    $stmt->execute([$user['id'], $ip_address, $user_agent]);
    
    // Generar JWT token
    $token_payload = [
        'user_id' => $user['id'],
        'username' => $user['username'],
        'email' => $user['email']
    ];
    
    // Ajustar duración del token según "remember me" (la clase JWT maneja la expiración internamente)
    $token = JWT::encode($token_payload);
    
    // Crear sesión en base de datos
    $session_token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', strtotime($remember_me ? '+30 days' : '+1 day'));
    
    // Limpiar sesiones expiradas del usuario
    $stmt = $pdo->prepare('DELETE FROM user_sessions WHERE user_id = ? AND expires_at < NOW()');
    $stmt->execute([$user['id']]);
    
    // Crear nueva sesión
    $stmt = $pdo->prepare('
        INSERT INTO user_sessions (user_id, token_hash, expires_at, created_at) 
        VALUES (?, ?, ?, NOW())
    ');
    $stmt->execute([$user['id'], hash('sha256', $session_token), $expires_at]);
    
    // Actualizar última actividad del usuario
    $stmt = $pdo->prepare('UPDATE users SET updated_at = NOW() WHERE id = ?');
    $stmt->execute([$user['id']]);
    
    // Obtener estadísticas de login del usuario
    $stmt = $pdo->prepare('
        SELECT 
            COUNT(*) as total_logins,
            MAX(created_at) as last_login
        FROM auth_logs 
        WHERE user_id = ? AND action = "login" AND success = TRUE
    ');
    $stmt->execute([$user['id']]);
    $login_stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Respuesta exitosa
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login exitoso',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'is_verified' => (bool)$user['is_verified']
        ],
        'token' => $token,
        'session_token' => $session_token,
        'expires_at' => $expires_at,
        'stats' => [
            'total_logins' => (int)$login_stats['total_logins'],
            'last_login' => $login_stats['last_login']
        ]
    ]);
    
} catch (PDOException $e) {
    error_log('Error de base de datos en login: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos']);
    
} catch (Exception $e) {
    error_log('Error en login: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}
?>