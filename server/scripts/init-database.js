const { query, testConnection, closePool } = require('../config/database');

const createTables = async () => {
  try {
    console.log('🚀 Iniciando configuración de base de datos...');
    
    // Probar conexión
    const connected = await testConnection();
    if (!connected) {
      throw new Error('No se pudo establecer conexión con la base de datos');
    }

    // Crear tabla de usuarios
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        role ENUM('admin', 'user') DEFAULT 'user',
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await query(createUsersTable);
    console.log('✅ Tabla "users" creada/verificada correctamente');

    // Crear tabla de sesiones (opcional, para manejo avanzado de sesiones)
    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_token_hash (token_hash),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await query(createSessionsTable);
    console.log('✅ Tabla "user_sessions" creada/verificada correctamente');

    // Crear tabla de logs de autenticación
    const createAuthLogsTable = `
      CREATE TABLE IF NOT EXISTS auth_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        username VARCHAR(50),
        action ENUM('login_success', 'login_failed', 'register', 'logout') NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await query(createAuthLogsTable);
    console.log('✅ Tabla "auth_logs" creada/verificada correctamente');

    // Verificar si existe un usuario admin por defecto
    const adminExists = await query('SELECT id FROM users WHERE username = ? OR email = ?', ['admin', 'admin@fungus.com']);
    
    if (adminExists.length === 0) {
      const bcrypt = require('bcryptjs');
      const defaultPassword = 'Admin123!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 12);
      
      await query(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@fungus.com', hashedPassword, 'admin']
      );
      
      console.log('✅ Usuario administrador creado:');
      console.log('   Username: admin');
      console.log('   Email: admin@fungus.com');
      console.log('   Password: Admin123!');
      console.log('   ⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }

    console.log('🎉 Base de datos configurada correctamente!');
    console.log('\n📊 Resumen de tablas creadas:');
    console.log('   - users: Información de usuarios');
    console.log('   - user_sessions: Sesiones activas');
    console.log('   - auth_logs: Logs de autenticación');
    
  } catch (error) {
    console.error('❌ Error configurando base de datos:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  createTables();
}

module.exports = { createTables };