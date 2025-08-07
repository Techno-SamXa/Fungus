const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de seguridad
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8081',
  credentials: true
}));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Demasiadas solicitudes desde esta IP'
});
app.use(globalLimiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando correctamente (modo temporal)'
  });
});

// Rutas temporales de autenticación (sin base de datos)
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  // Simulación de registro exitoso
  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente (modo temporal)',
    user: {
      id: 1,
      username,
      email,
      role: 'user',
      created_at: new Date().toISOString()
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simulación de login exitoso
  if (username && password) {
    res.json({
      success: true,
      message: 'Login exitoso (modo temporal)',
      user: {
        id: 1,
        username,
        email: `${username}@example.com`,
        role: 'user',
        created_at: new Date().toISOString()
      },
      token: 'temp-jwt-token-' + Date.now()
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Credenciales requeridas'
    });
  }
});

app.post('/api/auth/verify', (req, res) => {
  const { token } = req.body;
  
  if (token && token.startsWith('temp-jwt-token-')) {
    res.json({
      success: true,
      user: {
        id: 1,
        username: 'usuario_temp',
        email: 'usuario@example.com',
        role: 'user',
        created_at: new Date().toISOString()
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
});

app.get('/api/auth/profile', (req, res) => {
  res.json({
    success: true,
    user: {
      id: 1,
      username: 'usuario_temp',
      email: 'usuario@example.com',
      role: 'user',
      created_at: new Date().toISOString()
    }
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor en modo temporal...');
    console.log('⚠️  NOTA: Este servidor funciona sin base de datos para pruebas');
    
    app.listen(PORT, () => {
      console.log(`✅ Servidor corriendo en puerto ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log('📋 Endpoints disponibles:');
      console.log('   - POST /api/auth/register');
      console.log('   - POST /api/auth/login');
      console.log('   - POST /api/auth/verify');
      console.log('   - POST /api/auth/logout');
      console.log('   - GET /api/auth/profile');
      console.log('   - GET /health');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error.message);
    process.exit(1);
  }
};

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 Cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
startServer();

module.exports = app;