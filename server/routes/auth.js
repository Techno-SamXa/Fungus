const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, logAuthAttempt, generateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting para endpoints de autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validaciones
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
  body('email')
    .isEmail()
    .withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un carácter especial')
];

const loginValidation = [
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es requerido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// POST /api/auth/register - Registro de usuario
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUsers = await query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      await logAuthAttempt(null, username, 'register_failed', req);
      return res.status(409).json({
        success: false,
        message: 'El nombre de usuario o email ya está en uso'
      });
    }

    // Hash de la contraseña
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insertar nuevo usuario
    const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    const userId = result.insertId;

    // Log del registro exitoso
    await logAuthAttempt(userId, username, 'register', req);

    // Generar token JWT
    const token = generateToken(userId, username);

    // Obtener datos del usuario para respuesta
    const newUser = await query(
      'SELECT id, username, email, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: newUser[0]
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/login - Inicio de sesión
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    // Verificar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Buscar usuario por username o email
    const users = await query(
      'SELECT id, username, email, password_hash, is_verified, role FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      await logAuthAttempt(null, username, 'login_failed', req);
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    const user = users[0];

    // Verificar si la cuenta está verificada
    if (!user.is_verified) {
      await logAuthAttempt(user.id, username, 'login_failed', req);
      return res.status(401).json({
        success: false,
        message: 'Cuenta no verificada. Por favor verifica tu email.'
      });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      await logAuthAttempt(user.id, username, 'login_failed', req);
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

    // Actualizar timestamp de última actualización
    await query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Log del login exitoso
    await logAuthAttempt(user.id, user.username, 'login_success', req);

    // Generar token JWT
    const token = generateToken(user.id, user.username);

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/verify - Verificar token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // El middleware authenticateToken ya verificó el token y agregó req.user
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Log del logout
    await logAuthAttempt(req.user.id, req.user.username, 'logout', req);

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/profile - Obtener perfil del usuario
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const users = await query(
      'SELECT id, username, email, created_at, last_login, role FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;