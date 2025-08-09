# Guía de Despliegue para cPanel

## Frontend (Archivos Estáticos)

### 1. Archivos a subir
Sube todos los archivos de la carpeta `dist/` al directorio `public_html/admin/` de tu cPanel:
- `index.html`
- `assets/` (carpeta completa)
- `.htaccess`

### 2. Configuración del dominio
Tu aplicación estará disponible en `https://tu-dominio.com/admin/`

## Backend (PHP)

### 1. Requisitos previos
- cPanel con soporte para PHP 7.4+
- Acceso a MySQL/MariaDB
- Extensiones PHP: PDO, PDO_MySQL, JSON

### 2. Archivos a subir
Sube toda la carpeta `php-backend/` a `public_html/admin/api/` en cPanel:

```
public_html/admin/api/
├── config/
├── routes/
├── .env
├── index.php
├── init-database.php
└── ...
```

### 3. Configuración de la base de datos

1. **Crear base de datos en cPanel:**
   - Ve a "Bases de datos MySQL"
   - Crea una nueva base de datos
   - Crea un usuario y asígnalo a la base de datos

2. **Actualizar .env:**
```env
# Datos de tu base de datos en cPanel
DB_HOST=localhost
DB_USER=cpanel_usuario_db
DB_PASSWORD=tu_password_seguro
DB_NAME=cpanel_nombre_db
DB_PORT=3306

# JWT Secret (generar uno seguro)
JWT_SECRET=tu_jwt_secret_super_seguro_para_produccion_2024
```

### 4. Instalación en cPanel

1. **Verificar requisitos PHP:**
   - PHP 7.4 o superior
   - Extensiones: PDO, PDO_MySQL, JSON

2. **Inicializar base de datos:**
```bash
php init-database.php
```

### 5. Configuración de proxy (incluida)

El archivo `.htaccess` ya incluye la configuración necesaria para que el frontend se comunique con el backend:

```apache
RewriteEngine On

# Proxy para API - redirige a la subcarpeta api/
RewriteRule ^api/(.*)$ /admin/api/$1 [L]

# Fallback para SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/admin/api/
RewriteRule . /admin/index.html [L]
```

### 6. Variables de entorno importantes

- `DB_*`: Credenciales de base de datos
- `JWT_SECRET`: Clave secreta para JWT

### 7. Verificación

1. **Frontend:** Visita `https://tu-dominio.com/admin/`
2. **Backend:** Verifica `https://tu-dominio.com/admin/api/test-connection.php`
3. **Base de datos:** Prueba el registro/login

## Notas importantes

- Cambia todas las credenciales por defecto
- Usa HTTPS en producción
- Configura backups regulares de la base de datos
- Monitorea los logs de la aplicación
- Verifica que las extensiones PHP requeridas estén habilitadas

## Solución de problemas

- **Error 500:** Revisa los logs de PHP en cPanel
- **Error de conexión DB:** Verifica credenciales en `.env`
- **Error de permisos:** Verifica permisos de archivos (644) y carpetas (755)
- **Archivos no encontrados:** Verifica que los archivos estén en `public_html`