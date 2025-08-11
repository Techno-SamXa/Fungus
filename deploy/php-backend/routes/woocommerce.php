<?php
// Configuración CORS
header('Content-Type: application/json');
// Configurar CORS dinámicamente
$allowed_origins = [
    'http://localhost:8080',
    'https://fungusmycelium.cl'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://localhost:8080');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Configuración JWT para tienda real
require_once __DIR__ . '/../config/jwt.php';

// Verificar token JWT
try {
    $payload = JWT::validateToken();
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

// Configuración de WooCommerce API
$woocommerce_url = 'https://fungusmycelium.cl'; // URL de tu tienda WooCommerce
$consumer_key = 'ck_c7e7b89ce957ef3dd9a852d27dca2859e20a8282';
$consumer_secret = 'cs_14a1dc149c1eddad162812ac1b0c4463b1c53bd6';

// Modo demo para pruebas (cambiar a false para usar la tienda real)
$demo_mode = false;

function makeWooCommerceRequest($endpoint, $method = 'GET', $data = null) {
    global $woocommerce_url, $consumer_key, $consumer_secret;
    
    $url = $woocommerce_url . '/wp-json/wc/v3/' . $endpoint;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_USERPWD, $consumer_key . ':' . $consumer_secret);
    curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        }
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        }
    } elseif ($method === 'DELETE') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    }
    
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response === false) {
        return ['error' => 'Error de conexión con WooCommerce'];
    }
    
    $decoded_response = json_decode($response, true);
    
    if ($http_code >= 400) {
        return ['error' => $decoded_response['message'] ?? 'Error en la API de WooCommerce', 'code' => $http_code];
    }
    
    return $decoded_response;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Datos de prueba simulados
function getDemoProducts() {
    return [
        [
            'id' => 1,
            'name' => 'Hongos Shiitake Premium',
            'description' => 'Hongos shiitake frescos de cultivo orgánico, perfectos para cocinar.',
            'price' => 8500,
            'regular_price' => 8500,
            'sale_price' => null,
            'stock_quantity' => 25,
            'stock_status' => 'instock',
            'manage_stock' => true,
            'sku' => 'SHII-001',
            'weight' => '250',
            'dimensions' => ['length' => '15', 'width' => '10', 'height' => '5'],
            'image' => null,
            'categories' => ['Hongos', 'Orgánicos'],
            'status' => 'publish',
            'created_at' => '2024-01-15T10:00:00',
            'updated_at' => '2024-01-20T15:30:00'
        ],
        [
            'id' => 2,
            'name' => 'Kit de Cultivo Oyster',
            'description' => 'Kit completo para cultivar hongos ostra en casa. Incluye sustrato e instrucciones.',
            'price' => 12000,
            'regular_price' => 15000,
            'sale_price' => 12000,
            'stock_quantity' => 15,
            'stock_status' => 'instock',
            'manage_stock' => true,
            'sku' => 'KIT-OYS-001',
            'weight' => '500',
            'dimensions' => ['length' => '20', 'width' => '15', 'height' => '10'],
            'image' => null,
            'categories' => ['Kits', 'Cultivo'],
            'status' => 'publish',
            'created_at' => '2024-01-10T09:00:00',
            'updated_at' => '2024-01-18T14:20:00'
        ],
        [
            'id' => 3,
            'name' => 'Hongos Portobello Gigantes',
            'description' => 'Hongos portobello de gran tamaño, ideales para asar o rellenar.',
            'price' => 6500,
            'regular_price' => 6500,
            'sale_price' => null,
            'stock_quantity' => 0,
            'stock_status' => 'outofstock',
            'manage_stock' => true,
            'sku' => 'PORT-001',
            'weight' => '300',
            'dimensions' => ['length' => '12', 'width' => '12', 'height' => '8'],
            'image' => null,
            'categories' => ['Hongos', 'Premium'],
            'status' => 'publish',
            'created_at' => '2024-01-12T11:30:00',
            'updated_at' => '2024-01-22T16:45:00'
        ],
        [
            'id' => 4,
            'name' => 'Sustrato para Hongos',
            'description' => 'Sustrato especializado para el cultivo de hongos comestibles.',
            'price' => 4500,
            'regular_price' => 4500,
            'sale_price' => null,
            'stock_quantity' => 50,
            'stock_status' => 'instock',
            'manage_stock' => true,
            'sku' => 'SUST-001',
            'weight' => '1000',
            'dimensions' => ['length' => '25', 'width' => '20', 'height' => '15'],
            'image' => null,
            'categories' => ['Insumos', 'Cultivo'],
            'status' => 'publish',
            'created_at' => '2024-01-08T08:15:00',
            'updated_at' => '2024-01-19T13:10:00'
        ],
        [
            'id' => 5,
            'name' => 'Hongos Enoki Frescos',
            'description' => 'Hongos enoki delicados y frescos, perfectos para sopas y ensaladas.',
            'price' => 7200,
            'regular_price' => 7200,
            'sale_price' => null,
            'stock_quantity' => 18,
            'stock_status' => 'instock',
            'manage_stock' => true,
            'sku' => 'ENOK-001',
            'weight' => '150',
            'dimensions' => ['length' => '10', 'width' => '8', 'height' => '12'],
            'image' => null,
            'categories' => ['Hongos', 'Frescos'],
            'status' => 'publish',
            'created_at' => '2024-01-14T12:45:00',
            'updated_at' => '2024-01-21T17:20:00'
        ]
    ];
}

switch ($method) {
    case 'GET':
        // Obtener productos
        if ($demo_mode) {
            // Modo de prueba - usar datos simulados
            $products = getDemoProducts();
            echo json_encode($products);
        } else {
            // Modo real - conectar con WooCommerce
            $page = $_GET['page'] ?? 1;
            $per_page = $_GET['per_page'] ?? 20;
            $search = $_GET['search'] ?? '';
            
            $endpoint = "products?page={$page}&per_page={$per_page}";
            if ($search) {
                $endpoint .= "&search=" . urlencode($search);
            }
            
            $products = makeWooCommerceRequest($endpoint);
            
            if (isset($products['error'])) {
                http_response_code($products['code'] ?? 500);
                echo json_encode($products);
            } else {
                // Formatear productos para el frontend
                $formatted_products = array_map(function($product) {
                    return [
                        'id' => $product['id'],
                        'name' => $product['name'],
                        'description' => strip_tags($product['short_description'] ?: $product['description']),
                        'price' => floatval($product['price']),
                        'regular_price' => floatval($product['regular_price']),
                        'sale_price' => $product['sale_price'] ? floatval($product['sale_price']) : null,
                        'stock_quantity' => $product['stock_quantity'],
                        'stock_status' => $product['stock_status'],
                        'manage_stock' => $product['manage_stock'],
                        'sku' => $product['sku'],
                        'weight' => $product['weight'],
                        'dimensions' => $product['dimensions'],
                        'image' => $product['images'][0]['src'] ?? null,
                        'categories' => array_map(function($cat) { return $cat['name']; }, $product['categories']),
                        'status' => $product['status'],
                        'created_at' => $product['date_created'],
                        'updated_at' => $product['date_modified']
                    ];
                }, $products);
                
                echo json_encode($formatted_products);
            }
        }
        break;
        
    case 'PUT':
        // Actualizar stock de producto
        if (isset($path_parts[2]) && is_numeric($path_parts[2])) {
            $product_id = intval($path_parts[2]);
            $input = json_decode(file_get_contents('php://input'), true);
            
            $update_data = [];
            if (isset($input['stock_quantity'])) {
                $update_data['stock_quantity'] = intval($input['stock_quantity']);
            }
            if (isset($input['stock_status'])) {
                $update_data['stock_status'] = $input['stock_status'];
            }
            
            if (empty($update_data)) {
                http_response_code(400);
                echo json_encode(['error' => 'No hay datos para actualizar']);
                break;
            }
            
            if ($demo_mode) {
                // Modo de prueba - simular actualización
                $demo_products = getDemoProducts();
                $product_found = null;
                
                foreach ($demo_products as $product) {
                    if ($product['id'] == $product_id) {
                        $product_found = $product;
                        break;
                    }
                }
                
                if ($product_found) {
                    // Simular actualización exitosa
                    $updated_product = $product_found;
                    if (isset($update_data['stock_quantity'])) {
                        $updated_product['stock_quantity'] = $update_data['stock_quantity'];
                    }
                    if (isset($update_data['stock_status'])) {
                        $updated_product['stock_status'] = $update_data['stock_status'];
                    }
                    
                    echo json_encode([
                        'message' => 'Stock actualizado correctamente (modo demo)',
                        'product' => [
                            'id' => $updated_product['id'],
                            'name' => $updated_product['name'],
                            'stock_quantity' => $updated_product['stock_quantity'],
                            'stock_status' => $updated_product['stock_status']
                        ]
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Producto no encontrado']);
                }
            } else {
                // Modo real - conectar con WooCommerce
                $result = makeWooCommerceRequest("products/{$product_id}", 'PUT', $update_data);
                
                if (isset($result['error'])) {
                    http_response_code($result['code'] ?? 500);
                    echo json_encode($result);
                } else {
                    echo json_encode([
                        'message' => 'Stock actualizado correctamente',
                        'product' => [
                            'id' => $result['id'],
                            'name' => $result['name'],
                            'stock_quantity' => $result['stock_quantity'],
                            'stock_status' => $result['stock_status']
                        ]
                    ]);
                }
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'ID de producto requerido']);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}
?>