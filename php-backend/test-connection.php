<?php
/**
 * Script para verificar el estado de la conexión a la base de datos
 */

require_once 'config/database.php';

echo "🔍 VERIFICACIÓN DE CONEXIÓN A BASE DE DATOS\n";
echo "================================================\n\n";

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    echo "✅ CONEXIÓN EXITOSA\n";
    echo "Host: " . $_ENV['DB_HOST'] ?? 'No definido' . "\n";
    echo "Puerto: " . $_ENV['DB_PORT'] ?? 'No definido' . "\n";
    echo "Base de datos: " . $_ENV['DB_NAME'] ?? 'No definido' . "\n";
    echo "Usuario: " . $_ENV['DB_USER'] ?? 'No definido' . "\n";
    echo "\n";
    
    // Verificar versión de MySQL
    $stmt = $pdo->query('SELECT VERSION() as version');
    $version = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "📊 Versión MySQL: " . $version['version'] . "\n";
    
    // Verificar tablas existentes
    echo "\n📋 TABLAS EN LA BASE DE DATOS:\n";
    $stmt = $pdo->query('SHOW TABLES');
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($tables)) {
        echo "⚠️  No se encontraron tablas\n";
    } else {
        foreach ($tables as $table) {
            echo "   - $table\n";
            
            // Contar registros en cada tabla
            $countStmt = $pdo->query("SELECT COUNT(*) as count FROM `$table`");
            $count = $countStmt->fetch(PDO::FETCH_ASSOC);
            echo "     (" . $count['count'] . " registros)\n";
        }
    }
    
    // Verificar estructura de tabla users
    echo "\n🏗️  ESTRUCTURA DE TABLA 'users':\n";
    try {
        $stmt = $pdo->query('DESCRIBE users');
        $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($columns as $column) {
            echo "   - {$column['Field']}: {$column['Type']}\n";
        }
    } catch (Exception $e) {
        echo "⚠️  Tabla 'users' no existe\n";
    }
    
    // Test de inserción (sin ejecutar)
    echo "\n🧪 TEST DE CONSULTAS:\n";
    $testQuery = "SELECT 1 as test";
    $stmt = $pdo->query($testQuery);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "   - Query básica: " . ($result['test'] == 1 ? '✅ OK' : '❌ Error') . "\n";
    
    echo "\n🎉 CONEXIÓN COMPLETAMENTE FUNCIONAL\n";
    
} catch (Exception $e) {
    echo "❌ ERROR DE CONEXIÓN:\n";
    echo "Mensaje: " . $e->getMessage() . "\n";
    echo "Código: " . $e->getCode() . "\n";
    echo "\n";
    
    // Información de debug
    echo "🔧 INFORMACIÓN DE DEBUG:\n";
    echo "Host configurado: " . ($_ENV['DB_HOST'] ?? 'No definido') . "\n";
    echo "Puerto configurado: " . ($_ENV['DB_PORT'] ?? 'No definido') . "\n";
    echo "Base de datos: " . ($_ENV['DB_NAME'] ?? 'No definido') . "\n";
    echo "Usuario: " . ($_ENV['DB_USER'] ?? 'No definido') . "\n";
    
    // Verificar si es problema de acceso remoto
    if (strpos($e->getMessage(), 'Access denied') !== false) {
        echo "\n💡 POSIBLE SOLUCIÓN:\n";
        echo "   - Verificar configuración de Remote MySQL en cPanel\n";
        echo "   - Agregar IP actual a la lista de hosts permitidos\n";
        echo "   - Verificar credenciales de usuario MySQL\n";
    }
}

echo "\n================================================\n";
echo "Verificación completada: " . date('Y-m-d H:i:s') . "\n";
?>