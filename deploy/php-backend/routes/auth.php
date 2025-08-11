<?php
// Rutas de autenticación

function handleRegister() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['username']) || !isset($input['email']) || !isset($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos']);
            return;
        }
        
        $username = trim($input['username']);
        $email = trim($input['email']);
        $password = $input['password'];
        $fullName = isset($input['fullName']) ? trim($input['fullName']) : '';
        
        // Validaciones
        if (strlen($username) < 3) {
            http_response_code(400);
            echo json_encode(['error' => 'El nombre de usuario debe tener al menos 3 caracteres']);
            return;
        }
        
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['error' => 'Email inválido']);
            return;
        }
        
        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'La contraseña debe tener al menos 6 caracteres']);
            return;
        }
        
        $database = new Database();
        $conn = $database->getUserConnection();
        
        // Verificar si el usuario ya existe
        $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'El usuario o email ya existe']);
            return;
        }
        
        // Crear usuario
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $verificationToken = bin2hex(random_bytes(32));
        
        $stmt = $conn->prepare("
            INSERT INTO users (username, email, password_hash, full_name, verification_token) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([$username, $email, $passwordHash, $fullName, $verificationToken]);
        $userId = $conn->lastInsertId();
        
        // Log de registro
        logAuthAction($conn, $userId, 'register', true, 'Usuario registrado exitosamente');
        
        // Generar JWT
        $token = JWT::encode([
            'user_id' => $userId,
            'username' => $username,
            'email' => $email
        ]);
        
        http_response_code(201);
        echo json_encode([
            'message' => 'Usuario registrado exitosamente',
            'token' => $token,
            'user' => [
                'id' => $userId,
                'username' => $username,
                'email' => $email,
                'fullName' => $fullName,
                'isVerified' => false
            ]
        ]);
        
    } catch (Exception $e) {
        error_log('Error en registro: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error interno del servidor']);
    }
}

function handleLogin() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['username']) || !isset($input['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Credenciales incompletas']);
            return;
        }
        
        $username = trim($input['username']);
        $password = $input['password'];
        
        $database = new Database();
        $conn = $database->getUserConnection();
        
        // Buscar usuario
        $stmt = $conn->prepare("
            SELECT id, username, email, password_hash, full_name, is_verified 
            FROM users 
            WHERE username = ? OR email = ?
        ");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            logAuthAction($conn, null, 'login', false, 'Credenciales inválidas: ' . $username);
            http_response_code(401);
            echo json_encode(['error' => 'Credenciales inválidas']);
            return;
        }
        
        // Log de login exitoso
        logAuthAction($conn, $user['id'], 'login', true, 'Login exitoso');
        
        // Generar JWT
        $token = JWT::encode([
            'user_id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email']
        ]);
        
        echo json_encode([
            'message' => 'Login exitoso',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'fullName' => $user['full_name'],
                'isVerified' => (bool)$user['is_verified']
            ]
        ]);
        
    } catch (Exception $e) {
        error_log('Error en login: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Error interno del servidor']);
    }
}

function handleProfile() {
    try {
        $payload = JWT::validateToken();
        
        $database = new Database();
        $conn = $database->getUserConnection();
        
        $stmt = $conn->prepare("
            SELECT id, username, email, full_name, is_verified, created_at 
            FROM users 
            WHERE id = ?
        ");
        $stmt->execute([$payload['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(['error' => 'Usuario no encontrado']);
            return;
        }
        
        echo json_encode([
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'fullName' => $user['full_name'],
                'isVerified' => (bool)$user['is_verified'],
                'createdAt' => $user['created_at']
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function handleLogout() {
    try {
        $payload = JWT::validateToken();
        
        $database = new Database();
        $conn = $database->getConnection();
        
        // Log de logout
        logAuthAction($conn, $payload['user_id'], 'logout', true, 'Logout exitoso');
        
        echo json_encode(['message' => 'Logout exitoso']);
        
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => $e->getMessage()]);
    }
}

function logAuthAction($conn, $userId, $action, $success, $details = '') {
    try {
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        $stmt = $conn->prepare("
            INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success, details) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([$userId, $action, $ipAddress, $userAgent, $success, $details]);
    } catch (Exception $e) {
        error_log('Error logging auth action: ' . $e->getMessage());
    }
}
?>