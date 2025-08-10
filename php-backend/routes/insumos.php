<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'config/jwt.php';

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

try {
    $database = new Database();
    $pdo = $database->getMainConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    switch ($method) {
        case 'GET':
            // Obtener todos los insumos
            $stmt = $pdo->prepare("SELECT * FROM insumos ORDER BY created_at DESC");
            $stmt->execute();
            $insumos = $stmt->fetchAll();
            
            // Convertir precios a números
            foreach ($insumos as &$insumo) {
                $insumo['price'] = (float) $insumo['price'];
                $insumo['stock'] = (int) $insumo['stock'];
            }
            
            echo json_encode($insumos);
            break;
            
        case 'POST':
            // Crear nuevo insumo
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['name']) || !isset($input['price'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos incompletos']);
                exit();
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO insumos (name, description, price, stock, dimensions) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $result = $stmt->execute([
                $input['name'],
                $input['description'] ?? '',
                (float) $input['price'],
                (int) ($input['stock'] ?? 0),
                $input['dimensions'] ?? ''
            ]);
            
            if ($result) {
                $newId = $pdo->lastInsertId();
                $stmt = $pdo->prepare("SELECT * FROM insumos WHERE id = ?");
                $stmt->execute([$newId]);
                $newInsumo = $stmt->fetch();
                
                $newInsumo['price'] = (float) $newInsumo['price'];
                $newInsumo['stock'] = (int) $newInsumo['stock'];
                
                http_response_code(201);
                echo json_encode($newInsumo);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear el insumo']);
            }
            break;
            
        case 'PUT':
            // Actualizar insumo existente
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID del insumo requerido']);
                exit();
            }
            
            $stmt = $pdo->prepare("
                UPDATE insumos 
                SET name = ?, description = ?, price = ?, stock = ?, dimensions = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            
            $result = $stmt->execute([
                $input['name'],
                $input['description'] ?? '',
                (float) $input['price'],
                (int) ($input['stock'] ?? 0),
                $input['dimensions'] ?? '',
                $input['id']
            ]);
            
            if ($result) {
                $stmt = $pdo->prepare("SELECT * FROM insumos WHERE id = ?");
                $stmt->execute([$input['id']]);
                $updatedInsumo = $stmt->fetch();
                
                if ($updatedInsumo) {
                    $updatedInsumo['price'] = (float) $updatedInsumo['price'];
                    $updatedInsumo['stock'] = (int) $updatedInsumo['stock'];
                    echo json_encode($updatedInsumo);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Insumo no encontrado']);
                }
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar el insumo']);
            }
            break;
            
        case 'DELETE':
            // Eliminar insumo
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID del insumo requerido']);
                exit();
            }
            
            $stmt = $pdo->prepare("DELETE FROM insumos WHERE id = ?");
            $result = $stmt->execute([$input['id']]);
            
            if ($result) {
                echo json_encode(['message' => 'Insumo eliminado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al eliminar el insumo']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
}
?>