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

// Verificar si es un token mock de desarrollo
$authHeader = $headers['Authorization'];
if ($authHeader === 'Bearer dev-token-123' || strpos($authHeader, 'Bearer dev-mock-token-') === 0) {
    // Token mock de desarrollo, permitir acceso
    $payload = (object)['user_id' => 1, 'username' => 'admin'];
} else {
    try {
        $payload = JWT::validateToken();
        // Token válido, continuar
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido: ' . $e->getMessage()]);
        exit();
    }
}

// Función para manejar subida de imágenes
function handleImageUpload($file) {
    $uploadDir = __DIR__ . '/../uploads/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($file['type'], $allowedTypes)) {
        throw new Exception('Tipo de archivo no permitido');
    }
    
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxSize) {
        throw new Exception('El archivo es demasiado grande');
    }
    
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return '/uploads/' . $filename;
    } else {
        throw new Exception('Error al subir el archivo');
    }
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $database = new Database();
    $pdo = $database->getMainConnection();
    
    switch ($method) {
        case 'GET':
            // Obtener todos los productos
            $stmt = $pdo->query("SELECT * FROM products ORDER BY created_at DESC");
            $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convertir tipos de datos
            foreach ($products as &$product) {
                $product['price'] = (float) $product['price'];
                $product['stock'] = (int) $product['stock'];
            }
            
            echo json_encode($products);
            break;
            
        case 'POST':
            // Crear nuevo producto
            $input = null;
            $imageUrl = null;
            
            // Verificar si es FormData (con imagen) o JSON
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                // Procesar FormData con imagen
                $input = $_POST;
                $imageUrl = handleImageUpload($_FILES['image']);
            } else {
                // Procesar JSON
                $input = json_decode(file_get_contents('php://input'), true);
                $imageUrl = $input['image'] ?? null;
            }
            
            if (!$input || !isset($input['name']) || !isset($input['price'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nombre y precio son requeridos']);
                exit();
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO products (name, description, price, stock, dimensions, image, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            ");
            
            $stmt->execute([
                $input['name'],
                $input['description'] ?? '',
                (float) $input['price'],
                (int) ($input['stock'] ?? 0),
                $input['dimensions'] ?? '',
                $imageUrl
            ]);
            
            $productId = $pdo->lastInsertId();
            
            // Obtener el producto creado
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Convertir tipos de datos
            $product['price'] = (float) $product['price'];
            $product['stock'] = (int) $product['stock'];
            
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
            
            $input = null;
            $imageUrl = null;
            
            // Verificar si es FormData (con imagen) o JSON
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                // Procesar FormData con imagen
                $input = $_POST;
                $imageUrl = handleImageUpload($_FILES['image']);
            } else {
                // Procesar JSON
                $input = json_decode(file_get_contents('php://input'), true);
                $imageUrl = $input['image'] ?? null;
            }
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos requeridos']);
                exit();
            }
            
            // Si hay nueva imagen, actualizar con imagen; si no, mantener la existente
            if ($imageUrl) {
                $stmt = $pdo->prepare("
                    UPDATE products 
                    SET name = ?, description = ?, price = ?, stock = ?, dimensions = ?, image = ?, updated_at = NOW()
                    WHERE id = ?
                ");
                
                $stmt->execute([
                    $input['name'],
                    $input['description'] ?? '',
                    (float) $input['price'],
                    (int) ($input['stock'] ?? 0),
                    $input['dimensions'] ?? '',
                    $imageUrl,
                    $productId
                ]);
            } else {
                $stmt = $pdo->prepare("
                    UPDATE products 
                    SET name = ?, description = ?, price = ?, stock = ?, dimensions = ?, updated_at = NOW()
                    WHERE id = ?
                ");
                
                $stmt->execute([
                    $input['name'],
                    $input['description'] ?? '',
                    (float) $input['price'],
                    (int) ($input['stock'] ?? 0),
                    $input['dimensions'] ?? '',
                    $productId
                ]);
            }
            
            // Obtener el producto actualizado
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$productId]);
            $product = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$product) {
                http_response_code(404);
                echo json_encode(['error' => 'Producto no encontrado']);
                exit();
            }
            
            // Convertir tipos de datos
            $product['price'] = (float) $product['price'];
            $product['stock'] = (int) $product['stock'];
            
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