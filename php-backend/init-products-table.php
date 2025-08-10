<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $pdo = $database->getMainConnection();
    
    // Crear tabla de productos
    $sql = "
        CREATE TABLE IF NOT EXISTS products (
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
    
    echo "Tabla 'products' creada exitosamente.\n";
    
    // Insertar algunos productos de ejemplo
    $sampleProducts = [
        [
            'name' => 'Hongo Reishi',
            'description' => 'Grano colonizado',
            'price' => 7990.00,
            'stock' => 50,
            'dimensions' => '500 gr.'
        ],
        [
            'name' => 'Blue Oyster',
            'description' => 'Viales',
            'price' => 25000.00,
            'stock' => 30,
            'dimensions' => '10 ml'
        ],
        [
            'name' => 'Black Pearl King',
            'description' => 'Grano colonizado',
            'price' => 17800.00,
            'stock' => 25,
            'dimensions' => '2.5 kilos'
        ],
        [
            'name' => 'Chestnuts',
            'description' => 'Grano colonizado',
            'price' => 8200.00,
            'stock' => 40,
            'dimensions' => '900 gr'
        ],
        [
            'name' => 'Bolsas Mushbags 320x500x0.08mm',
            'description' => 'Bolsas especializadas para cultivo de hongos',
            'price' => 15900.00,
            'stock' => 100,
            'dimensions' => '320x500x0.08mm'
        ]
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO products (name, description, price, stock, dimensions, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    foreach ($sampleProducts as $product) {
        $stmt->execute([
            $product['name'],
            $product['description'],
            $product['price'],
            $product['stock'],
            $product['dimensions']
        ]);
    }
    
    echo "Productos de ejemplo insertados exitosamente.\n";
    
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>