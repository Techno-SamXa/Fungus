<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
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
    } else {
        // Verificar JWT real
        $token = str_replace('Bearer ', '', $authHeader);
        $decoded = verifyJWT($token);
        
        if (!$decoded) {
            http_response_code(401);
            echo json_encode(['error' => 'Token inválido']);
            exit;
        }
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            // Verificar si se solicita una venta específica por ID
            if (isset($_GET['id']) && is_numeric($_GET['id'])) {
                $id = (int)$_GET['id'];
                
                // Obtener venta específica
                $query = "SELECT v.*, c.nombre as comprador_nombre, c.email as comprador_email, c.rut as comprador_rut 
                         FROM ventas v 
                         LEFT JOIN compradores c ON v.comprador_id = c.id 
                         WHERE v.id = ?";
                $stmt = $db->prepare($query);
                $stmt->execute([$id]);
                $venta = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($venta) {
                    // Cargar detalles de la venta específica
                    $detalleQuery = "SELECT dv.*, p.name as producto_nombre 
                                    FROM detalle_ventas dv 
                                    LEFT JOIN products p ON dv.producto_id = p.id 
                                    WHERE dv.venta_id = ?";
                    $detalleStmt = $db->prepare($detalleQuery);
                    $detalleStmt->execute([$id]);
                    $detalles = $detalleStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Formatear detalles como items
                    $venta['items'] = array_map(function($detalle) {
                        return [
                            'id' => $detalle['id'],
                            'producto_id' => $detalle['producto_id'],
                            'producto_nombre' => $detalle['producto_nombre'],
                            'cantidad' => (int)$detalle['cantidad'],
                            'precio_unitario' => (float)$detalle['precio_unitario'],
                            'descuento' => 0, // Por ahora no manejamos descuentos en detalle_ventas
                            'subtotal' => (float)$detalle['subtotal']
                        ];
                    }, $detalles);
                    
                    echo json_encode($venta);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Venta no encontrada']);
                }
            } else {
                // Obtener todas las ventas
                $query = "SELECT v.*, c.nombre as comprador_nombre, c.email as comprador_email, c.rut as comprador_rut 
                         FROM ventas v 
                         LEFT JOIN compradores c ON v.comprador_id = c.id 
                         ORDER BY v.fecha_venta DESC 
                         LIMIT 50";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $ventas = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Cargar detalles para cada venta
                foreach ($ventas as &$venta) {
                    $detalleQuery = "SELECT dv.*, p.name as producto_nombre 
                                    FROM detalle_ventas dv 
                                    LEFT JOIN products p ON dv.producto_id = p.id 
                                    WHERE dv.venta_id = ?";
                    $detalleStmt = $db->prepare($detalleQuery);
                    $detalleStmt->execute([$venta['id']]);
                    $detalles = $detalleStmt->fetchAll(PDO::FETCH_ASSOC);
                    
                    // Formatear detalles como items
                    $venta['items'] = array_map(function($detalle) {
                        return [
                            'id' => $detalle['id'],
                            'producto_id' => $detalle['producto_id'],
                            'producto_nombre' => $detalle['producto_nombre'],
                            'cantidad' => (int)$detalle['cantidad'],
                            'precio_unitario' => (float)$detalle['precio_unitario'],
                            'descuento' => 0, // Por ahora no manejamos descuentos en detalle_ventas
                            'subtotal' => (float)$detalle['subtotal']
                        ];
                    }, $detalles);
                }
                
                echo json_encode([
                    'success' => true,
                    'data' => $ventas,
                    'total' => count($ventas)
                ]);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['comprador_id']) || !isset($input['total']) || !isset($input['detalles'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos incompletos']);
                exit;
            }
            
            $db->beginTransaction();
            
            try {
                // Insertar venta
                $ventaQuery = "INSERT INTO ventas (comprador_id, total, estado, fecha_venta, notas) 
                              VALUES (?, ?, ?, NOW(), ?)";
                $ventaStmt = $db->prepare($ventaQuery);
                $ventaStmt->execute([
                    $input['comprador_id'],
                    $input['total'],
                    $input['estado'] ?? 'pendiente',
                    $input['notas'] ?? ''
                ]);
                
                $ventaId = $db->lastInsertId();
                
                // Insertar detalles
                foreach ($input['detalles'] as $detalle) {
                    $detalleQuery = "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
                                    VALUES (?, ?, ?, ?, ?)";
                    $detalleStmt = $db->prepare($detalleQuery);
                    $detalleStmt->execute([
                        $ventaId,
                        $detalle['producto_id'],
                        $detalle['cantidad'],
                        $detalle['precio_unitario'],
                        $detalle['subtotal']
                    ]);
                }
                
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Venta creada exitosamente',
                    'id' => $ventaId
                ]);
                
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            break;
            
        case 'PUT':
            // Actualizar venta existente
            $pathInfo = $_SERVER['PATH_INFO'] ?? '';
            $segments = explode('/', trim($pathInfo, '/'));
            
            // Debug: Log para verificar PATH_INFO
            error_log("PUT Request - PATH_INFO: " . $pathInfo);
            error_log("PUT Request - Segments: " . json_encode($segments));
            
            if (count($segments) < 2 || !is_numeric($segments[1])) {
                http_response_code(400);
                echo json_encode([
                    'error' => 'ID de venta requerido',
                    'debug' => [
                        'pathInfo' => $pathInfo,
                        'segments' => $segments,
                        'segmentCount' => count($segments)
                    ]
                ]);
                exit;
            }
            
            $ventaId = (int)$segments[1];
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['comprador_id']) || !isset($input['total'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos incompletos']);
                exit;
            }
            
            $db->beginTransaction();
            
            try {
                // Actualizar venta
                $ventaQuery = "UPDATE ventas SET comprador_id = ?, total = ?, estado = ?, notas = ?, updated_at = NOW() 
                              WHERE id = ?";
                $ventaStmt = $db->prepare($ventaQuery);
                $ventaStmt->execute([
                    $input['comprador_id'],
                    $input['total'],
                    $input['estado'] ?? 'pendiente',
                    $input['notas'] ?? '',
                    $ventaId
                ]);
                
                // Eliminar detalles existentes
                $deleteDetallesQuery = "DELETE FROM detalle_ventas WHERE venta_id = ?";
                $deleteStmt = $db->prepare($deleteDetallesQuery);
                $deleteStmt->execute([$ventaId]);
                
                // Insertar nuevos detalles
                if (isset($input['detalles']) && is_array($input['detalles'])) {
                    foreach ($input['detalles'] as $detalle) {
                        $detalleQuery = "INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario, subtotal) 
                                        VALUES (?, ?, ?, ?, ?)";
                        $detalleStmt = $db->prepare($detalleQuery);
                        $detalleStmt->execute([
                            $ventaId,
                            $detalle['producto_id'],
                            $detalle['cantidad'],
                            $detalle['precio_unitario'],
                            $detalle['subtotal']
                        ]);
                    }
                }
                
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Venta actualizada exitosamente'
                ]);
                
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            break;
            
        case 'DELETE':
            // Eliminar venta
            $pathInfo = $_SERVER['PATH_INFO'] ?? '';
            $segments = explode('/', trim($pathInfo, '/'));
            
            if (count($segments) < 2 || !is_numeric($segments[1])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de venta requerido']);
                exit;
            }
            
            $ventaId = (int)$segments[1];
            
            $db->beginTransaction();
            
            try {
                // Eliminar detalles primero (por la clave foránea)
                $deleteDetallesQuery = "DELETE FROM detalle_ventas WHERE venta_id = ?";
                $deleteStmt = $db->prepare($deleteDetallesQuery);
                $deleteStmt->execute([$ventaId]);
                
                // Eliminar venta
                $deleteVentaQuery = "DELETE FROM ventas WHERE id = ?";
                $deleteVentaStmt = $db->prepare($deleteVentaQuery);
                $deleteVentaStmt->execute([$ventaId]);
                
                if ($deleteVentaStmt->rowCount() === 0) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Venta no encontrada']);
                    $db->rollBack();
                    exit;
                }
                
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Venta eliminada exitosamente'
                ]);
                
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>