const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || '50.87.185.24',
  user: process.env.DB_USER || 'ubtrodmy_Admin',
  password: '(?9g&^tP#0Lwf\\!?1RHOPk4cTiX1Ps^KcGV', // Contraseña hardcodeada que funciona
  database: process.env.DB_NAME || 'ubtrodmy_Users',
  port: parseInt(process.env.DB_PORT) || 3306,
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 60000,
};

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return false;
  }
};

// Función para ejecutar queries
const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando query:', error.message);
    throw error;
  }
};

// Función para cerrar el pool de conexiones
const closePool = async () => {
  try {
    await pool.end();
    console.log('Pool de conexiones cerrado');
  } catch (error) {
    console.error('Error cerrando pool:', error.message);
  }
};

module.exports = {
  pool,
  query,
  testConnection,
  closePool
};