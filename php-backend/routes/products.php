<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar autenticación
$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Token de autorización requerido']);
    exit();
}

try {
    $payload = JWT::validateToken();
    // Token válido, continuar
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Token inválido: ' . $e->getMessage()]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    $database = new Database();
    $pdo = $database->getMainConnection();
    
    switch ($method) {
        case 'GET':
            // Obtener todos los productos
            $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($products);
            break;
            
        case 'POST':
            // Crear nuevo producto
            if (!isset($input['name']) || !isset($input['price'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nombre y precio son requeridos']);
                exit();
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO products (name, description, price, stock, dimensions, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $input['name'],
                $input['description'] ?? '',
                $input['price'],
                $input['stock'] ?? 0,
                $input['dimensions'] ?? ''
            ]);
            
            $productId = $pdo->lastInsertId();
            
            // Obtener el producto creado
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            http_response_code(201);
            echo json_encode($product);
            break;
            
        case 'PUT':
            // Actualizar producto
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID del producto requerido']);
                exit();
            }
            
            $productId = $_GET['id'];
            
            $stmt = $pdo->prepare("
                UPDATE products 
                SET name = ?, description = ?, price = ?, stock = ?, dimensions = ?, updated_at = NOW()
                WHERE id = ?
            ");
            
            $stmt->execute([
                $input['name'],
                $input['description'] ?? '',
                $input['price'],
                $input['stock'] ?? 0,
                $input['dimensions'] ?? '',
                $productId
            ]);
            
            // Obtener el producto actualizado
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                http_response_code(404);
                echo json_encode(['error' => 'Producto no encontrado']);
                exit();
            }
            
            echo json_encode($product);
            break;
            
        case 'DELETE':
            // Eliminar producto
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID del producto requerido']);
                exit();
            }
            
            $productId = $_GET['id'];
            
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            
            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Producto no encontrado']);
                exit();
            }
            
            echo json_encode(['message' => 'Producto eliminado correctamente']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
}
?>