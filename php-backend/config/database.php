<?php
// Cargar variables de entorno
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// Configuración de la base de datos
class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    public $conn;
    
    public function __construct() {
        $this->host = $_ENV['DB_HOST'] ?? '50.87.185.24';
        $this->db_name = $_ENV['DB_NAME'] ?? 'ubtrodmy_Users';
        $this->username = $_ENV['DB_USER'] ?? 'ubtrodmy_Admin';
        $this->password = $_ENV['DB_PASSWORD'] ?? '(?9g&^tP#0Lwf\!?1RHOPk4cTiX1Ps^KcGV';
        $this->port = $_ENV['DB_PORT'] ?? 3306;
    }
    
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            error_log("Error de conexión: " . $exception->getMessage());
            throw new Exception("Error de conexión a la base de datos");
        }
        
        return $this->conn;
    }
    
    public function createTables() {
        try {
            $conn = $this->getConnection();
            
            // Crear tabla de usuarios
            $sql = "CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                is_verified BOOLEAN DEFAULT FALSE,
                verification_token VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )";
            
            $conn->exec($sql);
            
            // Crear tabla de sesiones/tokens
            $sql = "CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token_hash VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )";
            
            $conn->exec($sql);
            
            // Crear tabla de logs de autenticación
            $sql = "CREATE TABLE IF NOT EXISTS auth_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(50) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                success BOOLEAN DEFAULT TRUE,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )";
            
            $conn->exec($sql);
            
            return true;
        } catch(Exception $e) {
            error_log("Error creando tablas: " . $e->getMessage());
            return false;
        }
    }
}
?>