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
                // Obtener comprador específico
                $id = $_GET['id'];
                $query = "SELECT * FROM compradores WHERE id = :id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':id', $id);
                $stmt->execute();
                
                $comprador = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($comprador) {
                    echo json_encode($comprador);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Comprador no encontrado']);
                }
            } else {
                // Obtener todos los compradores
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
                
                // Contar total
                $countQuery = "SELECT COUNT(*) as total FROM compradores $whereClause";
                $countStmt = $db->prepare($countQuery);
                foreach ($params as $key => $value) {
                    $countStmt->bindValue($key, $value);
                }
                $countStmt->execute();
                $totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                // Obtener datos paginados
                $query = "SELECT * FROM compradores $whereClause ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
                $stmt = $db->prepare($query);
                
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value);
                }
                $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
                
                $stmt->execute();
                $compradores = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'data' => $compradores,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => (int)$totalCount,
                        'pages' => ceil($totalCount / $limit)
                    ]
                ]);
            }
            break;
            
        case 'POST':
            // Crear nuevo comprador
            $input = json_decode(file_get_contents('php://input'), true);
            
            $required_fields = ['nombre', 'email'];
            foreach ($required_fields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Campo requerido: $field"]);
                    exit;
                }
            }
            
            $query = "INSERT INTO compradores (nombre, email, rut, telefono, direccion, ciudad, pais, notas, activo) 
                     VALUES (:nombre, :email, :rut, :telefono, :direccion, :ciudad, :pais, :notas, :activo)";
            
            $stmt = $db->prepare($query);
            $stmt->bindValue(':nombre', $input['nombre']);
            $stmt->bindValue(':email', $input['email']);
            $stmt->bindValue(':rut', $input['rut'] ?? null);
            $stmt->bindValue(':telefono', $input['telefono'] ?? null);
            $stmt->bindValue(':direccion', $input['direccion'] ?? null);
            $stmt->bindValue(':ciudad', $input['ciudad'] ?? null);
            $stmt->bindValue(':pais', $input['pais'] ?? 'Chile');
            $stmt->bindValue(':notas', $input['notas'] ?? null);
            $stmt->bindValue(':activo', $input['activo'] ?? true, PDO::PARAM_BOOL);
            
            if ($stmt->execute()) {
                $newId = $db->lastInsertId();
                echo json_encode(['id' => $newId, 'message' => 'Comprador creado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al crear comprador']);
            }
            break;
            
        case 'PUT':
            // Actualizar comprador
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID requerido']);
                exit;
            }
            
            $id = $_GET['id'];
            $input = json_decode(file_get_contents('php://input'), true);
            
            $query = "UPDATE compradores SET 
                     nombre = :nombre, 
                     email = :email, 
                     rut = :rut, 
                     telefono = :telefono, 
                     direccion = :direccion, 
                     ciudad = :ciudad, 
                     pais = :pais, 
                     notas = :notas, 
                     activo = :activo,
                     updated_at = CURRENT_TIMESTAMP
                     WHERE id = :id";
            
            $stmt = $db->prepare($query);
            
            // Asignar valores a variables para bindParam
            $nombre = $input['nombre'];
            $email = $input['email'];
            $rut = $input['rut'] ?? null;
            $telefono = $input['telefono'] ?? null;
            $direccion = $input['direccion'] ?? null;
            $ciudad = $input['ciudad'] ?? null;
            $pais = $input['pais'] ?? 'Chile';
            $notas = $input['notas'] ?? null;
            $activo = $input['activo'] ?? true;
            
            $stmt->bindParam(':id', $id);
            $stmt->bindParam(':nombre', $nombre);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':rut', $rut);
            $stmt->bindParam(':telefono', $telefono);
            $stmt->bindParam(':direccion', $direccion);
            $stmt->bindParam(':ciudad', $ciudad);
            $stmt->bindParam(':pais', $pais);
            $stmt->bindParam(':notas', $notas);
            $stmt->bindParam(':activo', $activo, PDO::PARAM_BOOL);
            
            if ($stmt->execute()) {
                echo json_encode(['message' => 'Comprador actualizado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al actualizar comprador']);
            }
            break;
            
        case 'DELETE':
            // Eliminar comprador
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID requerido']);
                exit;
            }
            
            $id = $_GET['id'];
            $query = "DELETE FROM compradores WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $id);
            
            if ($stmt->execute()) {
                echo json_encode(['message' => 'Comprador eliminado exitosamente']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Error al eliminar comprador']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
    
} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
}
?>