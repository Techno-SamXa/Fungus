<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

// Verificar token de autorización
$headers = getallheaders();
if (!isset($headers['Authorization'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Token de autorización requerido']);
    exit;
}

$authHeader = $headers['Authorization'];

// Verificar si es un token mock de desarrollo
if ($authHeader === 'Bearer dev-token-123' || strpos($authHeader, 'Bearer dev-mock-token-') === 0) {
    // Token mock de desarrollo, permitir acceso
    $payload = (object)['user_id' => 1, 'username' => 'admin'];
} else {
    try {
        $payload = JWT::validateToken();
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido: ' . $e->getMessage()]);
        exit;
    }
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Obtener proveedor específico
                $id = $_GET['id'];
                $query = "SELECT * FROM proveedores WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $id);
                $stmt->execute();
                
                $proveedor = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($proveedor) {
                    echo json_encode($proveedor);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Proveedor no encontrado']);
                }
            } else {
                // Obtener todos los proveedores
                $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
                $offset = ($page - 1) * $limit;
                
                // Filtros opcionales
                $search = isset($_GET['search']) ? $_GET['search'] : '';
                $activo = isset($_GET['activo']) ? $_GET['activo'] : null;
                
                $whereConditions = [];
                $params = [];
                
                if (!empty($search)) {
                    $whereConditions[] = "(nombre LIKE :search OR email LIKE :search OR rut LIKE :search OR ciudad LIKE :search)";
                    $params[':search'] = '%' . $search . '%';
                }
                
                if ($activo !== null) {
                    $whereConditions[] = "activo = :activo";
                    $params[':activo'] = $activo === 'true' ? 1 : 0;
                }
                
                $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
                
                // Consulta principal
                $query = "SELECT * FROM proveedores $whereClause ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
                $stmt = $db->prepare($query);
                
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                
                $stmt->execute();
                $proveedores = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Contar total de registros
                $countQuery = "SELECT COUNT(*) as total FROM proveedores $whereClause";
                $countStmt = $db->prepare($countQuery);
                foreach ($params as $key => $value) {
                    $countStmt->bindValue($key, $value);
                }
                $countStmt->execute();
                $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                echo json_encode([
                    'data' => $proveedores,
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'pages' => ceil($total / $limit)
                ]);
            }
            break;
            
        case 'POST':
            // Crear nuevo proveedor
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['nombre']) || !isset($input['email'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Nombre y email son requeridos']);
                break;
            }
            
            $query = "INSERT INTO proveedores (nombre, email, telefono, rut, direccion, ciudad, pais, notas, activo) 
                     VALUES (:nombre, :email, :telefono, :rut, :direccion, :ciudad, :pais, :notas, :activo)";
            
            $stmt = $db->prepare($query);
            $stmt->bindValue(':nombre', $input['nombre']);
            $stmt->bindValue(':email', $input['email']);
            $stmt->bindValue(':telefono', $input['telefono'] ?? null);
            $stmt->bindValue(':rut', $input['rut'] ?? null);
            $stmt->bindValue(':direccion', $input['direccion'] ?? null);
            $stmt->bindValue(':ciudad', $input['ciudad'] ?? null);
            $stmt->bindValue(':pais', $input['pais'] ?? 'Chile');
            $stmt->bindValue(':notas', $input['notas'] ?? null);
            $stmt->bindValue(':activo', isset($input['activo']) ? ($input['activo'] ? 1 : 0) : 1, PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                $newId = $db->lastInsertId();
                
                // Obtener el proveedor recién creado
                $selectQuery = "SELECT * FROM proveedores WHERE id = :id";
                $selectStmt = $db->prepare($selectQuery);
                $selectStmt->bindParam(':id', $newId);
                $selectStmt->execute();
                $newProveedor = $selectStmt->fetch(PDO::FETCH_ASSOC);
                
                http_response_code(201);
                echo json_encode($newProveedor);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear el proveedor']);
            }
            break;
            
        case 'PUT':
            // Actualizar proveedor existente
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID del proveedor es requerido']);
                break;
            }
            
            // Asignar valores a variables temporales para bindParam
            $id = $input['id'];
            $nombre = $input['nombre'] ?? '';
            $email = $input['email'] ?? '';
            $telefono = $input['telefono'] ?? null;
            $rut = $input['rut'] ?? null;
            $direccion = $input['direccion'] ?? null;
            $ciudad = $input['ciudad'] ?? null;
            $pais = $input['pais'] ?? 'Chile';
            $notas = $input['notas'] ?? null;
            $activo = isset($input['activo']) ? ($input['activo'] ? 1 : 0) : 1;
            
            $query = "UPDATE proveedores SET 
                     nombre = :nombre, 
                     email = :email, 
                     telefono = :telefono, 
                     rut = :rut, 
                     direccion = :direccion, 
                     ciudad = :ciudad, 
                     pais = :pais, 
                     notas = :notas, 
                     activo = :activo,
                     updated_at = CURRENT_TIMESTAMP 
                     WHERE id = :id";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':nombre', $nombre);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':telefono', $telefono);
            $stmt->bindParam(':rut', $rut);
            $stmt->bindParam(':direccion', $direccion);
            $stmt->bindParam(':ciudad', $ciudad);
            $stmt->bindParam(':pais', $pais);
            $stmt->bindParam(':notas', $notas);
            $stmt->bindParam(':activo', $activo);
            
            if ($stmt->execute()) {
                // Obtener el proveedor actualizado
                $selectQuery = "SELECT * FROM proveedores WHERE id = :id";
                $selectStmt = $db->prepare($selectQuery);
                $selectStmt->bindParam(':id', $id);
                $selectStmt->execute();
                $updatedProveedor = $selectStmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode($updatedProveedor);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar el proveedor']);
            }
            break;
            
        case 'DELETE':
            // Eliminar proveedor
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID del proveedor es requerido']);
                break;
            }
            
            $query = "DELETE FROM proveedores WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $input['id']);
            
            if ($stmt->execute()) {
                if ($stmt->rowCount() > 0) {
                    echo json_encode(['message' => 'Proveedor eliminado exitosamente']);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Proveedor no encontrado']);
                }
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al eliminar el proveedor']);
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