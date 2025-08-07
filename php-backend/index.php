<?php
// Configuración de CORS y headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: http://localhost:8081');
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