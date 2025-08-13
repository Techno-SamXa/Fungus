<?php
// Configuración JWT
class JWT {
    private static $secret_key = 'fungus_secret_key_2024_super_secure_change_in_production';
    private static $algorithm = 'HS256';
    private static $expires_in = 86400; // 24 horas en segundos
    
    /**
     * Detecta si estamos en modo desarrollo
     */
    private static function isDevelopmentMode() {
        // Verificar si estamos en localhost o si hay variables de desarrollo
        $isLocalhost = isset($_SERVER['HTTP_HOST']) && 
                      (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false || 
                       strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false);
        
        // También verificar si hay un archivo .env con modo desarrollo
        $envFile = __DIR__ . '/../.env';
        if (file_exists($envFile)) {
            $envContent = file_get_contents($envFile);
            if (strpos($envContent, 'ENVIRONMENT=development') !== false) {
                return true;
            }
        }
        
        return $isLocalhost;
    }
    
    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => self::$algorithm]);
        $payload['exp'] = time() + self::$expires_in;
        $payload['iat'] = time();
        $payload = json_encode($payload);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secret_key, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    public static function decode($jwt) {
        // Manejar tokens de desarrollo
        if (self::isDevelopmentMode() && $jwt === 'dev-token-123') {
            return [
                'user_id' => 1,
                'username' => 'dev-user',
                'email' => 'dev@example.com',
                'iat' => time(),
                'exp' => time() + 86400 // 24 horas
            ];
        }
        
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            throw new Exception('Token JWT inválido');
        }
        
        list($base64Header, $base64Payload, $base64Signature) = $parts;
        
        // Verificar firma
        $signature = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Signature));
        $expectedSignature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secret_key, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            throw new Exception('Firma JWT inválida');
        }
        
        // Decodificar payload
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $base64Payload)), true);
        
        // Verificar expiración
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            throw new Exception('Token JWT expirado');
        }
        
        return $payload;
    }
    
    public static function getAuthToken() {
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            return null;
        }
        
        $authHeader = $headers['Authorization'];
        if (strpos($authHeader, 'Bearer ') !== 0) {
            return null;
        }
        
        return substr($authHeader, 7);
    }
    
    public static function validateToken() {
        try {
            $token = self::getAuthToken();
            if (!$token) {
                throw new Exception('Token no proporcionado');
            }
            
            $payload = self::decode($token);
            return $payload;
        } catch (Exception $e) {
            throw new Exception('Token inválido: ' . $e->getMessage());
        }
    }
}

// Función helper para verificar JWT
function verifyJWT($token) {
    try {
        $payload = JWT::decode($token);
        return $payload;
    } catch (Exception $e) {
        return false;
    }
}

// Función helper para obtener headers en diferentes servidores
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}
?>