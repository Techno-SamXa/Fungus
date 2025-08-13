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

$authHeader = $headers['Authorization'];
if (!preg_match('/Bearer\s+(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['error' => 'Formato de token inválido']);
    exit();
}

$token = $matches[1];

try {
    $payload = JWT::validateToken();
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Token inválido o expirado']);
        exit();
    }
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => 'Error de autenticación: ' . $e->getMessage()]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Obtener cotización específica con detalles
                $id = $_GET['id'];
                
                // Obtener datos principales de la cotización
                $stmt = $db->prepare("
                    SELECT c.*, comp.nombre as comprador_nombre, comp.email as comprador_email,
                           comp.telefono as comprador_telefono, comp.direccion as comprador_direccion
                    FROM cotizaciones c
                    LEFT JOIN compradores comp ON c.comprador_id = comp.id
                    WHERE c.id = ?
                ");
                $stmt->execute([$id]);
                $cotizacion = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$cotizacion) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Cotización no encontrada']);
                    exit();
                }
                
                // Obtener detalles de la cotización (productos e insumos)
                $stmt = $db->prepare("
                    SELECT dc.*, 
                           CASE 
                               WHEN dc.tipo_item = 'producto' THEN p.name
                               WHEN dc.tipo_item = 'insumo' THEN i.name
                           END as item_nombre,
                           CASE 
                               WHEN dc.tipo_item = 'producto' THEN p.description
                               WHEN dc.tipo_item = 'insumo' THEN i.description
                           END as item_descripcion,
                           CASE 
                               WHEN dc.tipo_item = 'producto' THEN p.image
                               WHEN dc.tipo_item = 'insumo' THEN i.image
                           END as item_imagen
                    FROM detalle_cotizaciones dc
                    LEFT JOIN products p ON dc.tipo_item = 'producto' AND dc.item_id = p.id
                    LEFT JOIN insumos i ON dc.tipo_item = 'insumo' AND dc.item_id = i.id
                    WHERE dc.cotizacion_id = ?
                    ORDER BY dc.id
                ");
                $stmt->execute([$id]);
                $detalles = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Procesar los datos
                $cotizacion['subtotal'] = (float)$cotizacion['subtotal'];
                $cotizacion['descuento'] = (float)$cotizacion['descuento'];
                $cotizacion['impuestos'] = (float)$cotizacion['impuestos'];
                $cotizacion['total'] = (float)$cotizacion['total'];
                
                $cotizacion['items'] = array_map(function($item) {
                    return [
                        'id' => $item['id'],
                        'tipo_item' => $item['tipo_item'],
                        'item_id' => $item['item_id'],
                        'item_nombre' => $item['item_nombre'],
                        'item_descripcion' => $item['item_descripcion'],
                        'item_imagen' => $item['item_imagen'],
                        'cantidad' => (int)$item['cantidad'],
                        'precio_unitario' => (float)$item['precio_unitario'],
                        'descuento' => (float)$item['descuento'],
                        'subtotal' => (float)$item['subtotal']
                    ];
                }, $detalles);
                
                echo json_encode($cotizacion);
                
            } else {
                // Obtener todas las cotizaciones
                $stmt = $db->prepare("
                    SELECT c.*, comp.nombre as comprador_nombre, comp.email as comprador_email
                    FROM cotizaciones c
                    LEFT JOIN compradores comp ON c.comprador_id = comp.id
                    ORDER BY c.created_at DESC, c.id DESC
                ");
                $stmt->execute();
                $cotizaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Procesar los datos
                $cotizaciones = array_map(function($cotizacion) {
                    $cotizacion['subtotal'] = (float)$cotizacion['subtotal'];
                    $cotizacion['descuento'] = (float)$cotizacion['descuento'];
                    $cotizacion['impuestos'] = (float)$cotizacion['impuestos'];
                    $cotizacion['total'] = (float)$cotizacion['total'];
                    return $cotizacion;
                }, $cotizaciones);
                
                echo json_encode(['data' => $cotizaciones]);
            }
            break;
            
        case 'POST':
            // Crear nueva cotización
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos de entrada requeridos']);
                exit();
            }
            
            // Validar campos requeridos
            $requiredFields = ['numero_cotizacion', 'comprador_id', 'fecha_cotizacion', 'items'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['error' => "Campo requerido: $field"]);
                    exit();
                }
            }
            
            $db->beginTransaction();
            
            try {
                // Insertar cotización principal
                $stmt = $db->prepare("
                    INSERT INTO cotizaciones (numero_cotizacion, comprador_id, fecha_cotizacion, fecha_vencimiento, 
                                            subtotal, descuento, impuestos, total, estado, observaciones, notas, imagen)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                
                $stmt->execute([
                    $input['numero_cotizacion'],
                    $input['comprador_id'],
                    $input['fecha_cotizacion'],
                    $input['fecha_vencimiento'] ?? null,
                    $input['subtotal'] ?? 0,
                    $input['descuento'] ?? 0,
                    $input['impuestos'] ?? 0,
                    $input['total'] ?? 0,
                    $input['estado'] ?? 'borrador',
                    $input['observaciones'] ?? null,
                    $input['notas'] ?? null,
                    $input['imagen'] ?? null
                ]);
                
                $cotizacionId = $db->lastInsertId();
                
                // Insertar items de la cotización
                $stmt = $db->prepare("
                    INSERT INTO detalle_cotizaciones (cotizacion_id, tipo_item, item_id, cantidad, precio_unitario, descuento, subtotal)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");
                
                foreach ($input['items'] as $item) {
                    $stmt->execute([
                        $cotizacionId,
                        $item['tipo_item'],
                        $item['item_id'],
                        $item['cantidad'],
                        $item['precio_unitario'],
                        $item['descuento'] ?? 0,
                        $item['subtotal']
                    ]);
                }
                
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Cotización creada exitosamente',
                    'id' => $cotizacionId
                ]);
                
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            break;
            
        case 'PUT':
            // Actualizar cotización existente
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de cotización requerido']);
                exit();
            }
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Datos de entrada requeridos']);
                exit();
            }
            
            $id = $_GET['id'];
            $db->beginTransaction();
            
            try {
                // Actualizar cotización principal
                $stmt = $db->prepare("
                    UPDATE cotizaciones SET 
                        numero_cotizacion = ?, comprador_id = ?, fecha_cotizacion = ?, fecha_vencimiento = ?,
                        subtotal = ?, descuento = ?, impuestos = ?, total = ?, estado = ?,
                        observaciones = ?, notas = ?, imagen = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ");
                
                $stmt->execute([
                    $input['numero_cotizacion'],
                    $input['comprador_id'],
                    $input['fecha_cotizacion'],
                    $input['fecha_vencimiento'] ?? null,
                    $input['subtotal'] ?? 0,
                    $input['descuento'] ?? 0,
                    $input['impuestos'] ?? 0,
                    $input['total'] ?? 0,
                    $input['estado'] ?? 'borrador',
                    $input['observaciones'] ?? null,
                    $input['notas'] ?? null,
                    $input['imagen'] ?? null,
                    $id
                ]);
                
                // Eliminar items existentes
                $stmt = $db->prepare("DELETE FROM detalle_cotizaciones WHERE cotizacion_id = ?");
                $stmt->execute([$id]);
                
                // Insertar nuevos items
                if (isset($input['items']) && is_array($input['items'])) {
                    $stmt = $db->prepare("
                        INSERT INTO detalle_cotizaciones (cotizacion_id, tipo_item, item_id, cantidad, precio_unitario, descuento, subtotal)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    ");
                    
                    foreach ($input['items'] as $item) {
                        $stmt->execute([
                            $id,
                            $item['tipo_item'],
                            $item['item_id'],
                            $item['cantidad'],
                            $item['precio_unitario'],
                            $item['descuento'] ?? 0,
                            $item['subtotal']
                        ]);
                    }
                }
                
                $db->commit();
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Cotización actualizada exitosamente'
                ]);
                
            } catch (Exception $e) {
                $db->rollBack();
                throw $e;
            }
            break;
            
        case 'DELETE':
            // Eliminar cotización
            if (!isset($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID de cotización requerido']);
                exit();
            }
            
            $id = $_GET['id'];
            
            $stmt = $db->prepare("DELETE FROM cotizaciones WHERE id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() > 0) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Cotización eliminada exitosamente'
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Cotización no encontrada']);
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