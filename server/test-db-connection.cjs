const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function testConnection() {
  console.log('🔍 Probando conexión a la base de datos...');
  
  // Usar la contraseña exacta proporcionada por el usuario
  const password = '(?9g&^tP#0Lwf\\!?1RHOPk4cTiX1Ps^KcGV';
  
  console.log('Host:', process.env.DB_HOST);
  console.log('User:', process.env.DB_USER);
  console.log('Database:', process.env.DB_NAME);
  console.log('Port:', process.env.DB_PORT);
  console.log('Password length:', password.length);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: password,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Conexión exitosa a MySQL!');
    
    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Consulta de prueba exitosa:', rows);
    
    // Verificar si existen tablas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Tablas disponibles:', tables);
    
    await connection.end();
    console.log('✅ Conexión cerrada correctamente');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('❌ Código de error:', error.code);
    
    // Intentar con diferentes variaciones de la contraseña
    const variations = [
      '(?9g&^tP#0Lwf\\!?1RHOPk4cTiX1Ps^KcGV',
      '(?9g&^tP#0Lwf\!?1RHOPk4cTiX1Ps^KcGV',
      '(?9g&^tP#0Lwf!?1RHOPk4cTiX1Ps^KcGV'
    ];
    
    for (let i = 0; i < variations.length; i++) {
      console.log(`\n🔄 Probando variación ${i + 1}: ${variations[i]}`);
      try {
        const connection2 = await mysql.createConnection({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: variations[i],
          database: process.env.DB_NAME,
          port: process.env.DB_PORT,
          ssl: {
            rejectUnauthorized: false
          }
        });
        
        console.log(`✅ ¡Conexión exitosa con variación ${i + 1}!`);
        await connection2.end();
        break;
        
      } catch (error2) {
        console.error(`❌ Variación ${i + 1} falló:`, error2.message);
      }
    }
  }
}

testConnection();