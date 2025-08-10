<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $pdo = $database->getMainConnection();
    
    // Verificar si la columna ya existe
    $stmt = $pdo->prepare("SHOW COLUMNS FROM insumos LIKE 'image'");
    $stmt->execute();
    $columnExists = $stmt->fetch();
    
    if (!$columnExists) {
        $pdo->exec('ALTER TABLE insumos ADD COLUMN image VARCHAR(500) DEFAULT NULL');
        echo "Campo 'image' agregado exitosamente a la tabla insumos.\n";
    } else {
        echo "El campo 'image' ya existe en la tabla insumos.\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>