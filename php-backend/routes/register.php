<?php
/**
 * Endpoint de registro de usuarios
 * POST /api/register
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
    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    // Validaciones básicas
    if (empty($username) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['error' => 'Todos los campos son obligatorios']);
        exit();
    }
    
    // Validar longitud del username
    if (strlen($username) < 3) {
        http_response_code(400);
        echo json_encode(['error' => 'El nombre de usuario debe tener al menos 3 caracteres']);
        exit();
    }
    
    // Validar formato de email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Formato de email inválido']);
        exit();
    }
    
    // Validar fortaleza de contraseña
    if (strlen($password) < 8) {
        http_response_code(400);
        echo json_encode(['error' => 'La contraseña debe tener al menos 8 caracteres']);
        exit();
    }
    
    // Validar que la contraseña tenga los requisitos de seguridad
    $hasUpper = preg_match('/[A-Z]/', $password);
    $hasLower = preg_match('/[a-z]/', $password);
    $hasNumber = preg_match('/\d/', $password);
    $hasSpecial = preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password);
    
    if (!$hasUpper || !$hasLower || !$hasNumber || !$hasSpecial) {
        http_response_code(400);
        echo json_encode([
            'error' => 'La contraseña debe contener al menos: una mayúscula, una minúscula, un número y un carácter especial'
        ]);
        exit();
    }
    
    // Conectar a la base de datos de usuarios
    $database = new Database();
    $pdo = $database->getUserConnection();
    
    // Verificar si el usuario ya existe
    $stmt = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ?');
    $stmt->execute([$username, $email]);
    
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'El nombre de usuario o email ya están registrados']);
        exit();
    }
    
    // Hash de la contraseña
    $password_hash = password_hash($password, PASSWORD_DEFAULT);
    
    // Generar token de verificación
    $verification_token = bin2hex(random_bytes(32));
    
    // Insertar nuevo usuario
    $stmt = $pdo->prepare('
        INSERT INTO users (username, email, password_hash, verification_token, created_at, updated_at) 
        VALUES (?, ?, ?, ?, NOW(), NOW())
    ');
    
    if ($stmt->execute([$username, $email, $password_hash, $verification_token])) {
        $user_id = $pdo->lastInsertId();
        
        // Registrar en logs de autenticación
        $stmt = $pdo->prepare('
            INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success, created_at) 
            VALUES (?, "register", ?, ?, TRUE, NOW())
        ');
        $stmt->execute([
            $user_id,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ]);
        
        // Generar JWT token para auto-login
        $token = JWT::encode([
            'user_id' => $user_id,
            'username' => $username,
            'email' => $email
        ]);
        
        // Crear sesión en base de datos
        $session_token = bin2hex(random_bytes(32));
        $expires_at = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        $stmt = $pdo->prepare('
            INSERT INTO user_sessions (user_id, token_hash, expires_at, created_at) 
            VALUES (?, ?, ?, NOW())
        ');
        $stmt->execute([$user_id, hash('sha256', $session_token), $expires_at]);
        
        // Respuesta exitosa
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Usuario registrado exitosamente',
            'user' => [
                'id' => $user_id,
                'username' => $username,
                'email' => $email,
                'is_verified' => false
            ],
            'token' => $token,
            'session_token' => $session_token
        ]);
        
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error interno al crear el usuario']);
    }
    
} catch (PDOException $e) {
    error_log('Error de base de datos en registro: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos']);
    
} catch (Exception $e) {
    error_log('Error en registro: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Error interno del servidor']);
}
?>