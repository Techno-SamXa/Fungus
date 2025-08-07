<?php
/**
 * Script para probar la API mediante requests HTTP
 */

echo "🌐 PRUEBA DE API HTTP\n";
echo "===================\n\n";

// Función para hacer requests HTTP
function makeRequest($url, $method = 'GET', $data = null, $headers = []) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            $headers[] = 'Content-Type: application/json';
        }
    }
    
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    return [
        'response' => $response,
        'http_code' => $httpCode,
        'error' => $error
    ];
}

$baseUrl = 'http://localhost:8000';

try {
    // 1. Probar health check
    echo "🏥 PROBANDO HEALTH CHECK\n";
    $result = makeRequest($baseUrl . '/health');
    
    if ($result['http_code'] === 200) {
        echo "✅ Health check OK\n";
        $healthData = json_decode($result['response'], true);
        echo "   - Status: {$healthData['status']}\n";
        echo "   - Server: {$healthData['server']}\n";
        echo "   - Timestamp: {$healthData['timestamp']}\n";
    } else {
        echo "❌ Health check falló - HTTP {$result['http_code']}\n";
        echo "   Error: {$result['error']}\n";
    }
    
    // 2. Probar registro de usuario
    echo "\n👤 PROBANDO REGISTRO DE USUARIO\n";
    $userData = [
        'username' => 'testuser_' . time(),
        'email' => 'test' . time() . '@example.com',
        'password' => 'TestPassword123!',
        'full_name' => 'Usuario de Prueba API'
    ];
    
    echo "   - Username: {$userData['username']}\n";
    echo "   - Email: {$userData['email']}\n";
    
    $result = makeRequest($baseUrl . '/register', 'POST', $userData);
    
    if ($result['http_code'] === 201) {
        echo "✅ Registro exitoso\n";
        $registerData = json_decode($result['response'], true);
        
        if (isset($registerData['token'])) {
            echo "🎫 Token JWT recibido\n";
            $token = $registerData['token'];
            
            // 3. Probar login
            echo "\n🔑 PROBANDO LOGIN\n";
            $loginData = [
                'username' => $userData['username'],
                'password' => $userData['password']
            ];
            
            $result = makeRequest($baseUrl . '/login', 'POST', $loginData);
            
            if ($result['http_code'] === 200) {
                echo "✅ Login exitoso\n";
                $loginResponse = json_decode($result['response'], true);
                
                if (isset($loginResponse['token'])) {
                    echo "🎫 Nuevo token JWT recibido\n";
                    $newToken = $loginResponse['token'];
                    
                    // 4. Probar obtener perfil
                    echo "\n👤 PROBANDO OBTENER PERFIL\n";
                    $headers = ['Authorization: Bearer ' . $newToken];
                    $result = makeRequest($baseUrl . '/profile', 'GET', null, $headers);
                    
                    if ($result['http_code'] === 200) {
                        echo "✅ Perfil obtenido correctamente\n";
                        $profileData = json_decode($result['response'], true);
                        echo "   - Username: {$profileData['user']['username']}\n";
                        echo "   - Email: {$profileData['user']['email']}\n";
                        echo "   - Nombre: {$profileData['user']['full_name']}\n";
                        
                        // 5. Probar logout
                        echo "\n🚪 PROBANDO LOGOUT\n";
                        $result = makeRequest($baseUrl . '/logout', 'POST', null, $headers);
                        
                        if ($result['http_code'] === 200) {
                            echo "✅ Logout exitoso\n";
                        } else {
                            echo "❌ Error en logout - HTTP {$result['http_code']}\n";
                            echo "   Response: {$result['response']}\n";
                        }
                        
                    } else {
                        echo "❌ Error al obtener perfil - HTTP {$result['http_code']}\n";
                        echo "   Response: {$result['response']}\n";
                    }
                } else {
                    echo "❌ No se recibió token en login\n";
                }
            } else {
                echo "❌ Error en login - HTTP {$result['http_code']}\n";
                echo "   Response: {$result['response']}\n";
            }
        } else {
            echo "❌ No se recibió token en registro\n";
            echo "   Response: {$result['response']}\n";
        }
    } else {
        echo "❌ Error en registro - HTTP {$result['http_code']}\n";
        echo "   Response: {$result['response']}\n";
    }
    
} catch (Exception $e) {
    echo "❌ ERROR EN PRUEBA DE API:\n";
    echo "Mensaje: " . $e->getMessage() . "\n";
}

echo "\n===================\n";
echo "Prueba completada: " . date('Y-m-d H:i:s') . "\n";

// Mostrar estado del servidor
echo "\n🖥️  ESTADO DEL SERVIDOR:\n";
$result = makeRequest($baseUrl . '/health');
if ($result['http_code'] === 200) {
    echo "✅ Servidor PHP funcionando correctamente\n";
    echo "   URL: $baseUrl\n";
} else {
    echo "❌ Servidor no responde\n";
    echo "   Verificar que esté ejecutándose: php -S localhost:8000\n";
}
?>