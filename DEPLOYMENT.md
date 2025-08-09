# Guía de Despliegue para cPanel

## Frontend (Archivos Estáticos)

### 1. Archivos a subir
Sube todos los archivos de la carpeta `dist/` al directorio `public_html/admin/` de tu cPanel:
- `index.html`
- `assets/` (carpeta completa)
- `.htaccess`

### 2. Configuración del dominio
Tu aplicación estará disponible en `https://tu-dominio.com/admin/`

## Backend (Node.js)

### 1. Requisitos previos
- cPanel con soporte para Node.js
- Acceso a MySQL/MariaDB
- Node.js versión 16 o superior

### 2. Archivos a subir
Sube toda la carpeta `server/` a `public_html/admin/api/` en cPanel:

```
public_html/admin/api/
├── config/
├── middleware/
├── routes/
├── scripts/
├── .env.production
├── package.json
├── server.js
└── ...
```

### 3. Configuración de la base de datos

1. **Crear base de datos en cPanel:**
   - Ve a "Bases de datos MySQL"
   - Crea una nueva base de datos
   - Crea un usuario y asígnalo a la base de datos

2. **Actualizar .env.production:**
```env
NODE_ENV=production
PORT=3001

# Datos de tu base de datos en cPanel
DB_HOST=localhost
DB_USER=cpanel_usuario_db
DB_PASSWORD=tu_password_seguro
DB_NAME=cpanel_nombre_db
DB_PORT=3306

# JWT Secret (generar uno seguro)
JWT_SECRET=tu_jwt_secret_super_seguro_para_produccion_2024

# CORS (tu dominio real)
CORS_ORIGIN=https://tu-dominio.com
FRONTEND_URL=https://tu-dominio.com
```

### 4. Instalación en cPanel

1. **Configurar Node.js App:**
   - Ve a "Node.js App" en cPanel
   - Crea nueva aplicación
   - Versión: 16+ 
   - Directorio de la aplicación: `public_html/admin/api/`
   - Archivo de inicio: `server.js`
   - Variables de entorno: `NODE_ENV=production`

2. **Instalar dependencias:**
```bash
npm install --production
```

3. **Inicializar base de datos:**
```bash
node scripts/init-database.js
```

4. **Iniciar aplicación:**
```bash
npm run prod
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

- `NODE_ENV=production`
- `PORT`: Puerto asignado por cPanel
- `DB_*`: Credenciales de base de datos
- `JWT_SECRET`: Clave secreta para JWT
- `CORS_ORIGIN`: Tu dominio de producción

### 7. Verificación

1. **Frontend:** Visita `https://tu-dominio.com/admin/`
2. **Backend:** Verifica `https://tu-dominio.com/admin/api/health`
3. **Base de datos:** Prueba el registro/login

## Notas importantes

- Cambia todas las credenciales por defecto
- Usa HTTPS en producción
- Configura backups regulares de la base de datos
- Monitorea los logs de la aplicación
- Considera usar PM2 para gestión de procesos si está disponible

## Solución de problemas

- **Error 500:** Revisa los logs de Node.js en cPanel
- **Error de conexión DB:** Verifica credenciales en `.env.production`
- **CORS errors:** Actualiza `CORS_ORIGIN` con tu dominio real
- **Archivos no encontrados:** Verifica que los archivos estén en `public_html`