<?php
// Script para inicializar la base de datos
require_once 'config/database.php';

echo "🚀 Iniciando configuración de base de datos PHP...\n";

try {
    $database = new Database();
    
    // Probar conexión
    echo "🔍 Verificando conexión a la base de datos...\n";
    $conn = $database->getConnection();
    echo "✅ Conexión exitosa a MySQL\n";
    
    // Crear tablas
    echo "📋 Creando tablas...\n";
    if ($database->createTables()) {
        echo "✅ Tablas creadas exitosamente\n";
        
        // Verificar tablas creadas
        $stmt = $conn->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        echo "📊 Tablas disponibles:\n";
        foreach ($tables as $table) {
            echo "   - $table\n";
        }
        
        echo "\n🎉 Base de datos configurada correctamente\n";
        echo "🌐 Backend PHP listo para usar\n";
        
    } else {
        echo "❌ Error creando tablas\n";
        exit(1);
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "💡 Asegúrate de que:\n";
    echo "   - Los datos de conexión sean correctos\n";
    echo "   - El servidor MySQL esté funcionando\n";
    echo "   - El usuario tenga permisos para crear tablas\n";
    exit(1);
}
?>