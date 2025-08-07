const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware para verificar JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acceso requerido' 
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fungus_secret_key_2024');
    
    // Verificar que el usuario existe y está activo
    const users = await query(
      'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    const user = users[0];
    
    if (!user.is_active) {
      return res.status(401).json({ 
        success: false, 
        message: 'Cuenta desactivada' 
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
};

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Acceso denegado. Se requieren permisos de administrador' 
    });
  }
};

// Middleware para logging de autenticación
const logAuthAttempt = async (userId, username, action, req) => {
  try {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    await query(
      'INSERT INTO auth_logs (user_id, username, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
      [userId, username, action, ip, userAgent]
    );
  } catch (error) {
    console.error('Error logging auth attempt:', error);
  }
};

// Función para generar JWT token
const generateToken = (userId, username) => {
  return jwt.sign(
    { 
      userId, 
      username,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET || 'fungus_secret_key_2024',
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    }
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  logAuthAttempt,
  generateToken
};