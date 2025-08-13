<?php
// Configuración de headers
header('Content-Type: application/json');

// Configurar CORS para servidor de desarrollo PHP (no procesa .htaccess)
$allowed_origins = [
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:5173',  // Vite dev server
    'https://fungusmycelium.cl'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Fallback para desarrollo local (Vite)
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Incluir archivos de configuración
require_once 'config/database.php';
require_once 'config/jwt.php';
require_once 'routes/auth.php';

// Obtener la ruta solicitada
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Remover el prefijo del path si existe
$path = str_replace('/php-backend', '', $path);

// Configurar PATH_INFO para rutas con parámetros
if (preg_match('#^(/ventas|/compradores|/products|/insumos|/compras|/proveedores)(/.*)?$#', $path, $matches)) {
    $_SERVER['PATH_INFO'] = $matches[2] ?? '';
    $path = $matches[1];
}

// Servir archivos estáticos de la carpeta uploads
if (strpos($path, '/uploads/') === 0) {
    $file_path = __DIR__ . $path;
    if (file_exists($file_path) && is_file($file_path)) {
        $mime_type = mime_content_type($file_path);
        header('Content-Type: ' . $mime_type);
        header('Content-Length: ' . filesize($file_path));
        readfile($file_path);
        exit();
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Archivo no encontrado']);
        exit();
    }
}

// Router simple
switch ($path) {
    case '/register':
    case '/api/register':
    case '/api/auth/register':
    case '/auth/register':
        if ($method === 'POST') {
            include 'routes/register.php';
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/login':
    case '/api/login':
    case '/api/auth/login':
    case '/auth/login':
        if ($method === 'POST') {
            include 'routes/login.php';
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/profile':
    case '/api/profile':
    case '/api/auth/profile':
    case '/auth/profile':
        if ($method === 'GET') {
            include 'routes/profile.php';
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/logout':
    case '/api/logout':
    case '/api/auth/logout':
    case '/auth/logout':
        if ($method === 'POST') {
            include 'routes/logout.php';
        } else {
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
        }
        break;
        
    case '/products':
    case '/api/products':
        include 'routes/products.php';
        break;
        
    case '/woocommerce':
    case '/api/woocommerce':
        include 'routes/woocommerce.php';
        break;
        
    case '/insumos':
    case '/api/insumos':
        include 'routes/insumos.php';
        break;
        
    case '/compradores':
    case '/api/compradores':
        include 'routes/compradores.php';
        break;
        
    case '/ventas':
    case '/api/ventas':
        include 'routes/ventas.php';
        break;
        
    case '/compras':
    case '/api/compras':
        include 'routes/compras.php';
        break;
        
    case '/proveedores':
    case '/api/proveedores':
        include 'routes/proveedores.php';
        break;
        
    case '/cotizaciones':
    case '/api/cotizaciones':
        include 'routes/cotizaciones.php';
        break;
        
    case '/health':
        echo json_encode([
            'status' => 'OK',
            'timestamp' => date('Y-m-d H:i:s'),
            'server' => 'PHP Backend'
        ]);
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint no encontrado']);
        break;
}
?>