require('dotenv').config();
const mysql = require('mysql2/promise');

console.log('🔍 Variables de entorno RAW:');
console.log('DB_PASSWORD raw:', JSON.stringify(process.env.DB_PASSWORD));

// Limpiar la contraseña removiendo comillas si existen
let cleanPassword = process.env.DB_PASSWORD || '(?9g&^tP#0Lwf\\!?1RHOPk4cTiX1Ps^KcGV';
if (cleanPassword.startsWith("'") && cleanPassword.endsWith("'")) {
  cleanPassword = cleanPassword.slice(1, -1);
}
if (cleanPassword.startsWith('"') && cleanPassword.endsWith('"')) {
  cleanPassword = cleanPassword.slice(1, -1);
}

console.log('Clean password:', JSON.stringify(cleanPassword));
console.log('Clean password length:', cleanPassword.length);

// Usar exactamente la misma lógica que database.js
const dbConfig = {
  host: process.env.DB_HOST || '50.87.185.24',
  user: process.env.DB_USER || 'ubtrodmy_Admin',
  password: cleanPassword,
  database: process.env.DB_NAME || 'ubtrodmy_Users',
  port: parseInt(process.env.DB_PORT) || 3306,
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 60000,
};

console.log('\n🔍 Configuración final:');
console.log('Host:', dbConfig.host);
console.log('User:', dbConfig.user);
console.log('Password length:', dbConfig.password.length);
console.log('Database:', dbConfig.database);
console.log('Port:', dbConfig.port);

async function testConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('\n✅ Conexión exitosa!');
    await connection.end();
  } catch (error) {
    console.log('\n❌ Error de conexión:', error.message);
  }
}

testConnection();