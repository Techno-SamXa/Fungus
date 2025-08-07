# Backend PHP para Fungus Dashboard

## Requisitos
- PHP 7.4 o superior
- Extensión PDO MySQL
- Servidor web (Apache/Nginx) o usar el servidor integrado de PHP

## Instalación de PHP en Windows

### Opción 1: XAMPP (Recomendado)
1. Descargar XAMPP desde https://www.apachefriends.org/
2. Instalar XAMPP
3. Iniciar Apache desde el panel de control de XAMPP
4. Copiar la carpeta `php-backend` a `C:\xampp\htdocs\`

### Opción 2: PHP Standalone
1. Descargar PHP desde https://windows.php.net/download/
2. Extraer en `C:\php`
3. Agregar `C:\php` al PATH del sistema
4. Copiar `php.ini-development` a `php.ini`
5. Habilitar extensiones necesarias en `php.ini`:
   ```
   extension=pdo_mysql
   extension=openssl
   ```

## Configuración

### 1. Inicializar Base de Datos
```bash
php init-database.php
```

### 2. Iniciar Servidor

#### Con XAMPP:
- Copiar `php-backend` a `C:\xampp\htdocs\`
- Acceder a `http://localhost/php-backend`

#### Con PHP integrado:
```bash
cd php-backend
php -S localhost:8000
```

#### Con servidor web:
- Configurar DocumentRoot apuntando a la carpeta `php-backend`
- Asegurar que `.htaccess` esté habilitado

## Endpoints Disponibles

- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/profile` - Perfil del usuario (requiere token)
- `POST /api/auth/logout` - Cerrar sesión
- `GET /health` - Estado del servidor

## Configuración del Frontend

El archivo `vite.config.ts` ya está configurado para usar el backend PHP:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost/php-backend', // Para XAMPP
    // target: 'http://localhost:8000', // Para servidor integrado
    changeOrigin: true,
    secure: false,
  },
}
```

## Estructura de Archivos

```
php-backend/
├── config/
│   ├── database.php    # Configuración de base de datos
│   └── jwt.php         # Manejo de JWT
├── routes/
│   └── auth.php        # Rutas de autenticación
├── .htaccess           # Configuración Apache
├── index.php           # Punto de entrada
├── init-database.php   # Script de inicialización
└── README.md           # Este archivo
```

## Características

- ✅ Autenticación JWT
- ✅ Registro y login de usuarios
- ✅ Validación de datos
- ✅ Logs de autenticación
- ✅ Manejo de errores
- ✅ CORS configurado
- ✅ Conexión segura a MySQL
- ✅ Hash de contraseñas con bcrypt

## Troubleshooting

### Error: "Access denied for user"
- Verificar credenciales en `config/database.php`
- Asegurar que el usuario MySQL tenga permisos
- Verificar configuración de Remote MySQL en cPanel

### Error: "PHP not found"
- Instalar PHP siguiendo las instrucciones arriba
- Verificar que PHP esté en el PATH

### Error de CORS
- Verificar configuración en `.htaccess`
- Asegurar que el servidor web soporte mod_rewrite