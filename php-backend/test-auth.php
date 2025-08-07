<?php
/**
 * Script para probar las funcionalidades de autenticación
 */

require_once 'config/database.php';
require_once 'config/jwt.php';
require_once 'routes/auth.php';

echo "🔐 PRUEBA DE SISTEMA DE AUTENTICACIÓN\n";
echo "=====================================\n\n";

try {
    // Simular datos de registro
    $testUser = [
        'username' => 'test_user_' . time(),
        'email' => 'test' . time() . '@example.com',
        'password' => 'TestPassword123!',
        'full_name' => 'Usuario de Prueba'
    ];
    
    echo "👤 PROBANDO REGISTRO DE USUARIO\n";
    echo "Usuario: {$testUser['username']}\n";
    echo "Email: {$testUser['email']}\n";
    
    // Simular request POST para registro
    $_POST = $testUser;
    $_SERVER['REQUEST_METHOD'] = 'POST';
    
    ob_start();
    $registerResult = handleRegister();
    $registerOutput = ob_get_clean();
    
    if ($registerResult) {
        echo "✅ Registro exitoso\n";
        $registerData = json_decode($registerOutput, true);
        
        if (isset($registerData['token'])) {
            echo "🎫 Token JWT generado correctamente\n";
            $token = $registerData['token'];
            
            // Probar validación de token
            echo "\n🔍 PROBANDO VALIDACIÓN DE TOKEN\n";
            $decoded = JWT::decode($token);
            
            if ($decoded && isset($decoded['user_id'])) {
                echo "✅ Token válido - User ID: {$decoded['user_id']}\n";
                
                // Probar login
                echo "\n🔑 PROBANDO LOGIN\n";
                $_POST = [
                    'username' => $testUser['username'],
                    'password' => $testUser['password']
                ];
                
                ob_start();
                $loginResult = handleLogin();
                $loginOutput = ob_get_clean();
                
                if ($loginResult) {
                    echo "✅ Login exitoso\n";
                    $loginData = json_decode($loginOutput, true);
                    
                    if (isset($loginData['token'])) {
                        echo "🎫 Nuevo token JWT generado en login\n";
                        
                        // Probar obtener perfil
                        echo "\n👤 PROBANDO OBTENER PERFIL\n";
                        $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $loginData['token'];
                        
                        ob_start();
                        $profileResult = handleProfile();
                        $profileOutput = ob_get_clean();
                        
                        if ($profileResult) {
                            echo "✅ Perfil obtenido correctamente\n";
                            $profileData = json_decode($profileOutput, true);
                            echo "   - Username: {$profileData['user']['username']}\n";
                            echo "   - Email: {$profileData['user']['email']}\n";
                            echo "   - Nombre: {$profileData['user']['full_name']}\n";
                        } else {
                            echo "❌ Error al obtener perfil\n";
                        }
                        
                        // Probar logout
                        echo "\n🚪 PROBANDO LOGOUT\n";
                        ob_start();
                        $logoutResult = handleLogout();
                        $logoutOutput = ob_get_clean();
                        
                        if ($logoutResult) {
                            echo "✅ Logout exitoso\n";
                        } else {
                            echo "❌ Error en logout\n";
                        }
                        
                    } else {
                        echo "❌ No se generó token en login\n";
                    }
                } else {
                    echo "❌ Error en login: $loginOutput\n";
                }
                
            } else {
                echo "❌ Token inválido\n";
            }
        } else {
            echo "❌ No se generó token en registro\n";
        }
    } else {
        echo "❌ Error en registro: $registerOutput\n";
    }
    
    // Limpiar usuario de prueba
    echo "\n🧹 LIMPIANDO DATOS DE PRUEBA\n";
    $database = new Database();
    $pdo = $database->getConnection();
    
    $stmt = $pdo->prepare("DELETE FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$testUser['username'], $testUser['email']]);
    
    $stmt = $pdo->prepare("DELETE FROM user_sessions WHERE user_id NOT IN (SELECT id FROM users)");
    $stmt->execute();
    
    $stmt = $pdo->prepare("DELETE FROM auth_logs WHERE username = ?");
    $stmt->execute([$testUser['username']]);
    
    echo "✅ Datos de prueba eliminados\n";
    
} catch (Exception $e) {
    echo "❌ ERROR EN PRUEBA DE AUTENTICACIÓN:\n";
    echo "Mensaje: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n=====================================\n";
echo "Prueba completada: " . date('Y-m-d H:i:s') . "\n";

// Mostrar estadísticas finales
echo "\n📊 ESTADÍSTICAS DE BASE DE DATOS:\n";
try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM users');
    $userCount = $stmt->fetch()['count'];
    echo "   - Usuarios registrados: $userCount\n";
    
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM user_sessions');
    $sessionCount = $stmt->fetch()['count'];
    echo "   - Sesiones activas: $sessionCount\n";
    
    $stmt = $pdo->query('SELECT COUNT(*) as count FROM auth_logs');
    $logCount = $stmt->fetch()['count'];
    echo "   - Logs de autenticación: $logCount\n";
    
} catch (Exception $e) {
    echo "Error al obtener estadísticas: " . $e->getMessage() . "\n";
}
?>