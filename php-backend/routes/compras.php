<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

// Verificar token de autorización
$headers = [];
if (function_exists('getallheaders')) {
    $headers = getallheaders();
} else {
    foreach ($_SERVER as $name => $value) {
        if (substr($name, 0, 5) == 'HTTP_') {
            $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
        }
    }
}

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

// Inicializar conexión a la base de datos
$database = new Database();
$db = $database->getMainConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Obtener compra específica con detalles
                $id = $_GET['id'];
                $query = "SELECT c.*, p.nombre as proveedor_nombre, p.email as proveedor_email, p.rut as proveedor_rut 
                         FROM compras c 
                         LEFT JOIN proveedores p ON c.proveedor_id = p.id 
                         WHERE c.id = ?";
                $stmt = $db->prepare($query);
                $stmt->execute([$id]);
                $compra = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($compra) {
                    // Formatear totales principales
                    $compra['subtotal'] = (int)round($compra['subtotal']);
                    $compra['descuento'] = (int)round($compra['descuento']);
                    $compra['impuestos'] = (int)round($compra['impuestos']);
                    $compra['total'] = (int)round($compra['total']);
                    
                    // Cargar detalles de la compra (items)
                    $detalleQuery = "SELECT dc.*, i.name as insumo_nombre 
                                    FROM detalle_compras dc 
                                    LEFT JOIN insumos i ON dc.insumo_id = i.id 
                                    WHERE dc.compra_id = ?";
                    $detalleStmt = $db->prepare($detalleQuery);
                    $detalleStmt->execute([$compra['id']]);
                    $detalles = $detalleStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Formatear detalles como items
                    $compra['items'] = array_map(function($detalle) {
                        return [
                            'id' => $detalle['id'],
                            'insumo_id' => $detalle['insumo_id'],
                            'insumo_nombre' => $detalle['insumo_nombre'],
                            'cantidad' => (int)$detalle['cantidad'],
                            'precio_unitario' => (int)round($detalle['precio_unitario']),
                            'descuento' => (int)round($detalle['descuento']),
                            'subtotal' => (int)round($detalle['subtotal'])
                        ];
                    }, $detalles);
                    
                    echo json_encode($compra);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Compra no encontrada']);
                }
            } else {
                // Obtener todas las compras con paginación opcional
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
                $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
                
                // Primero obtener las compras básicas
                $query = "SELECT c.*, p.nombre as proveedor_nombre, p.email as proveedor_email, p.rut as proveedor_rut
                          FROM compras c 
                          LEFT JOIN proveedores p ON c.proveedor_id = p.id 
                          ORDER BY c.fecha_compra DESC 
                          LIMIT ?, ?";
                
                $stmt = $db->prepare($query);
                $stmt->bindValue(1, $offset, PDO::PARAM_INT);
                $stmt->bindValue(2, $limit, PDO::PARAM_INT);
                $stmt->execute();
                $compras = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Procesar cada compra para formatear totales y obtener items
                for ($i = 0; $i < count($compras); $i++) {
                    // Formatear totales principales
                    $compras[$i]['subtotal'] = (int)round($compras[$i]['subtotal']);
                    $compras[$i]['descuento'] = (int)round($compras[$i]['descuento']);
                    $compras[$i]['impuestos'] = (int)round($compras[$i]['impuestos']);
                    $compras[$i]['total'] = (int)round($compras[$i]['total']);
                    
                    // Obtener items de esta compra
                    $itemsQuery = "SELECT dc.insumo_id, i.name as insumo_nombre, dc.cantidad, 
                                          dc.precio_unitario, dc.descuento, dc.subtotal
                                   FROM detalle_compras dc
                                   LEFT JOIN insumos i ON dc.insumo_id = i.id
                                   WHERE dc.compra_id = ?";
                    
                    $itemsStmt = $db->prepare($itemsQuery);
                    $itemsStmt->execute([$compras[$i]['id']]);
                    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Formatear items
                    for ($j = 0; $j < count($items); $j++) {
                        $items[$j]['precio_unitario'] = (int)round($items[$j]['precio_unitario']);
                        $items[$j]['descuento'] = (int)round($items[$j]['descuento']);
                        $items[$j]['subtotal'] = (int)round($items[$j]['subtotal']);
                    }
                    
                    $compras[$i]['items'] = $items;
                }
                
                // Contar total de registros
                $countQuery = "SELECT COUNT(*) as total FROM compras";
                $countStmt = $db->prepare($countQuery);
                $countStmt->execute();
                $totalResult = $countStmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode([
                    'status' => 'success',
                    'data' => $compras,
                    'count' => count($compras),
                    'total' => (int)$totalResult['total'],
                    'offset' => $offset,
                    'limit' => $limit
                ]);
            }
            break;
            
        case 'POST':
            // Crear nueva compra
            $requiredFields = ['proveedor_id', 'fecha_compra', 'total', 'items'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Campo requerido: $field"]);
                    exit();
                }
            }
            
            // Generar número de documento automático
            $numeroDocumento = 'COM-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
            
            // Iniciar transacción
            $db->beginTransaction();
            
            try {
                // Insertar compra
                $insertQuery = "INSERT INTO compras (numero_documento, tipo_documento, proveedor_id, fecha_compra, subtotal, descuento, impuestos, total, estado, metodo_pago, observaciones, notas) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $stmt = $db->prepare($insertQuery);
                $stmt->execute([
                    $numeroDocumento,
                    $input['tipo_documento'] ?? 'factura',
                    $input['proveedor_id'],
                    $input['fecha_compra'],
                    $input['subtotal'] ?? 0,
                    $input['descuento'] ?? 0,
                    $input['impuestos'] ?? 0,
                    $input['total'],
                    $input['estado'] ?? 'pendiente',
                    $input['metodo_pago'] ?? '',
                    $input['observaciones'] ?? '',
                    $input['notas'] ?? ''
                ]);
                
                $compraId = $db->lastInsertId();
                
                // Insertar detalles de compra
                $insertDetalleQuery = "INSERT INTO detalle_compras (compra_id, insumo_id, cantidad, precio_unitario, descuento, subtotal) VALUES (?, ?, ?, ?, ?, ?)";
                $detalleStmt = $db->prepare($insertDetalleQuery);
                
                foreach ($input['items'] as $item) {
                    $detalleStmt->execute([
                        $compraId,
                        $item['insumo_id'],
                        $item['cantidad'],
                        $item['precio_unitario'],
                        $item['descuento'] ?? 0,
                        $item['subtotal']
                    ]);
                }
                
                $db->commit();
                
                // Obtener la compra creada con todos los datos
                $query = "SELECT c.*, p.nombre as proveedor_nombre, p.email as proveedor_email 
                         FROM compras c 
                         LEFT JOIN proveedores p ON c.proveedor_id = p.id 
                         WHERE c.id = ?";
                $stmt = $db->prepare($query);
                $stmt->execute([$compraId]);
                $compra = $stmt->fetch(PDO::FETCH_ASSOC);
                
                echo json_encode($compra);
                
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            break;
            
        case 'PUT':
            // Actualizar compra existente
            if (!isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de compra requerido']);
                exit();
            }
            
            // Iniciar transacción para actualizar compra y sus detalles
            $db->beginTransaction();
            
            try {
                // Actualizar datos principales de la compra
                $updateQuery = "UPDATE compras SET 
                               tipo_documento = ?, 
                               proveedor_id = ?, 
                               fecha_compra = ?, 
                               subtotal = ?, 
                               descuento = ?, 
                               impuestos = ?, 
                               total = ?, 
                               estado = ?, 
                               metodo_pago = ?, 
                               observaciones = ?, 
                               notas = ?, 
                               updated_at = CURRENT_TIMESTAMP 
                               WHERE id = ?";
                
                $stmt = $db->prepare($updateQuery);
                $result = $stmt->execute([
                    $input['tipo_documento'] ?? 'factura',
                    $input['proveedor_id'],
                    $input['fecha_compra'],
                    $input['subtotal'] ?? 0,
                    $input['descuento'] ?? 0,
                    $input['impuestos'] ?? 0,
                    $input['total'],
                    $input['estado'] ?? 'pendiente',
                    $input['metodo_pago'] ?? '',
                    $input['observaciones'] ?? '',
                    $input['notas'] ?? '',
                    $input['id']
                ]);
                
                // Si se proporcionan items, actualizar los detalles
                if (isset($input['items']) && is_array($input['items'])) {
                    // Eliminar detalles existentes
                    $deleteDetallesQuery = "DELETE FROM detalle_compras WHERE compra_id = ?";
                    $deleteStmt = $db->prepare($deleteDetallesQuery);
                    $deleteStmt->execute([$input['id']]);
                    
                    // Insertar nuevos detalles
                    $insertDetalleQuery = "INSERT INTO detalle_compras (compra_id, insumo_id, cantidad, precio_unitario, descuento, subtotal) VALUES (?, ?, ?, ?, ?, ?)";
                    $detalleStmt = $db->prepare($insertDetalleQuery);
                    
                    foreach ($input['items'] as $item) {
                        $detalleStmt->execute([
                            $input['id'],
                            $item['insumo_id'],
                            $item['cantidad'],
                            $item['precio_unitario'],
                            $item['descuento'] ?? 0,
                            $item['subtotal']
                        ]);
                    }
                }
                
                $db->commit();
                
                // Obtener la compra actualizada con sus items
                $query = "SELECT c.*, p.nombre as proveedor_nombre, p.email as proveedor_email, p.rut as proveedor_rut 
                         FROM compras c 
                         LEFT JOIN proveedores p ON c.proveedor_id = p.id 
                         WHERE c.id = ?";
                $stmt = $db->prepare($query);
                $stmt->execute([$input['id']]);
                $compra = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Formatear totales principales
                $compra['subtotal'] = (int)round($compra['subtotal']);
                $compra['descuento'] = (int)round($compra['descuento']);
                $compra['impuestos'] = (int)round($compra['impuestos']);
                $compra['total'] = (int)round($compra['total']);
                
                // Cargar detalles de la compra
                $detalleQuery = "SELECT dc.*, i.nombre as insumo_nombre 
                                FROM detalle_compras dc 
                                LEFT JOIN insumos i ON dc.insumo_id = i.id 
                                WHERE dc.compra_id = ?";
                $detalleStmt = $db->prepare($detalleQuery);
                $detalleStmt->execute([$input['id']]);
                $detalles = $detalleStmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Formatear detalles como items
                $compra['items'] = array_map(function($detalle) {
                    return [
                        'id' => $detalle['id'],
                        'insumo_id' => $detalle['insumo_id'],
                        'insumo_nombre' => $detalle['insumo_nombre'],
                        'cantidad' => (int)$detalle['cantidad'],
                        'precio_unitario' => (int)round($detalle['precio_unitario']),
                        'descuento' => (int)round($detalle['descuento']),
                        'subtotal' => (int)round($detalle['subtotal'])
                    ];
                }, $detalles);
                
                echo json_encode($compra);
                
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
            break;
            
        case 'DELETE':
            // Eliminar compra
            if (!isset($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de compra requerido']);
                exit();
            }
            
            // Iniciar transacción para eliminar compra y sus detalles
            $db->beginTransaction();
            
            try {
                // Eliminar detalles primero (por la clave foránea)
                $deleteDetallesQuery = "DELETE FROM detalle_compras WHERE compra_id = ?";
                $stmt = $db->prepare($deleteDetallesQuery);
                $stmt->execute([$input['id']]);
                
                // Eliminar compra
                $deleteQuery = "DELETE FROM compras WHERE id = ?";
                $stmt = $db->prepare($deleteQuery);
                $result = $stmt->execute([$input['id']]);
                
                $db->commit();
                
                if ($result) {
                    echo json_encode(['message' => 'Compra eliminada exitosamente']);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Compra no encontrada']);
                }
                
            } catch (Exception $e) {
                $db->rollback();
                throw $e;
            }
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