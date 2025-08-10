<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $pdo = $database->getMainConnection();
    
    // Crear tabla de insumos
    $sql = "
        CREATE TABLE IF NOT EXISTS insumos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            stock INT DEFAULT 0,
            dimensions VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ";
    
    $pdo->exec($sql);
    
    echo "Tabla 'insumos' creada exitosamente.\n";
    
    // Insertar algunos insumos de ejemplo
    $sampleInsumos = [
        [
            'name' => 'Alcohol 99%',
            'description' => 'Material de laboratorio',
            'price' => 4000.00,
            'stock' => 15,
            'dimensions' => '1 litro'
        ],
        [
            'name' => 'Anafe doble completa',
            'description' => 'Equipamiento',
            'price' => 75000.00,
            'stock' => 3,
            'dimensions' => '60x40x15cm'
        ],
        [
            'name' => 'Asesoría Personalizada',
            'description' => 'Servicio',
            'price' => 420168.00,
            'stock' => 1,
            'dimensions' => 'Consultoría'
        ],
        [
            'name' => 'Barra Magnética',
            'description' => 'Material de laboratorio',
            'price' => 1500.00,
            'stock' => 8,
            'dimensions' => '3cm'
        ],
        [
            'name' => 'Bolsas Mushbags 320x500x0.08mm',
            'description' => 'Mushbags grandes',
            'price' => 915.00,
            'stock' => 200,
            'dimensions' => '320x500x0.08mm'
        ],
        [
            'name' => 'Botella de laboratorio',
            'description' => 'Material de laboratorio',
            'price' => 7800.00,
            'stock' => 12,
            'dimensions' => '500ml'
        ],
        [
            'name' => 'Bushing inovidable M1/2',
            'description' => 'Toma para generador de vapor pasteurizadora nueva',
            'price' => 2780.00,
            'stock' => 5,
            'dimensions' => 'M1/2'
        ],
        [
            'name' => 'Caja de agua 18 G',
            'description' => 'Material de laboratorio',
            'price' => 5500.00,
            'stock' => 10,
            'dimensions' => '18 galones'
        ],
        [
            'name' => 'Caja de jeringa',
            'description' => 'Material de laboratorio',
            'price' => 9000.00,
            'stock' => 25,
            'dimensions' => 'Caja x100'
        ],
        [
            'name' => 'Caja de obturadoras',
            'description' => 'Material de laboratorio',
            'price' => 6500.00,
            'stock' => 15,
            'dimensions' => 'Caja x50'
        ],
        [
            'name' => 'Cajas 14C 430x320x70 S/MP',
            'description' => 'Cajas de carton para envios',
            'price' => 1390.00,
            'stock' => 100,
            'dimensions' => '430x320x70mm'
        ],
        [
            'name' => 'Carpa Indoor',
            'description' => 'Equipamiento',
            'price' => 2300000.00,
            'stock' => 1,
            'dimensions' => '2x2x2m'
        ]
    ];
    
    // Verificar si ya existen insumos
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM insumos");
    $checkStmt->execute();
    $count = $checkStmt->fetchColumn();
    
    if ($count == 0) {
        echo "Insertando insumos de ejemplo...\n";
        
        $insertStmt = $pdo->prepare("
            INSERT INTO insumos (name, description, price, stock, dimensions) 
            VALUES (?, ?, ?, ?, ?)
        ");
        
        foreach ($sampleInsumos as $insumo) {
            $insertStmt->execute([
                $insumo['name'],
                $insumo['description'],
                $insumo['price'],
                $insumo['stock'],
                $insumo['dimensions']
            ]);
        }
        
        echo "Insumos de ejemplo insertados exitosamente.\n";
    } else {
        echo "La tabla ya contiene insumos. No se insertaron datos de ejemplo.\n";
    }
    
    echo "\n✅ Configuración de tabla 'insumos' completada.\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>