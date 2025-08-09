#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando build de producción...');

// 1. Build del frontend
console.log('📦 Building frontend...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend buildeado exitosamente');
} catch (error) {
  console.error('❌ Error al buildear frontend:', error.message);
  process.exit(1);
}

// 2. Crear directorio de despliegue
const deployDir = path.join(__dirname, 'deploy');
if (fs.existsSync(deployDir)) {
  fs.rmSync(deployDir, { recursive: true });
}
fs.mkdirSync(deployDir);
fs.mkdirSync(path.join(deployDir, 'frontend'));
fs.mkdirSync(path.join(deployDir, 'backend'));

console.log('📁 Directorio de despliegue creado');

// 3. Copiar archivos del frontend
console.log('📋 Copiando archivos del frontend...');
const copyRecursive = (src, dest) => {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
};

copyRecursive(path.join(__dirname, 'dist'), path.join(deployDir, 'frontend'));
console.log('✅ Archivos del frontend copiados');

// 4. Copiar archivos del backend
console.log('📋 Copiando archivos del backend...');
const backendFiles = [
  'config',
  'middleware', 
  'routes',
  'scripts',
  'package.json',
  'server.js',
  '.env.production'
];

backendFiles.forEach(file => {
  const srcPath = path.join(__dirname, 'server', file);
  const destPath = path.join(deployDir, 'backend', file);
  
  if (fs.existsSync(srcPath)) {
    if (fs.statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
});

console.log('✅ Archivos del backend copiados');

// 5. Crear archivo .htaccess para el frontend
console.log('📝 Creando .htaccess...');
const htaccessContent = `RewriteEngine On

# Proxy para API (ajustar según tu configuración)
RewriteRule ^api/(.*)$ http://localhost:3001/api/$1 [P,L]

# Fallback para SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Seguridad
<Files ".env*">
  Order allow,deny
  Deny from all
</Files>

# Compresión
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache
<IfModule mod_expires.c>
  ExpiresActive on
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
</IfModule>`;

fs.writeFileSync(path.join(deployDir, 'frontend', '.htaccess'), htaccessContent);
console.log('✅ .htaccess creado');

// 6. Crear README de despliegue
console.log('📝 Creando instrucciones de despliegue...');
const deployInstructions = `# Instrucciones de Despliegue

## Frontend
1. Sube todos los archivos de la carpeta 'frontend/' a tu directorio public_html en cPanel
2. Asegúrate de que el archivo .htaccess se haya subido correctamente

## Backend
1. Sube todos los archivos de la carpeta 'backend/' a un directorio fuera de public_html (ej: /home/usuario/nodejs/)
2. Edita el archivo .env.production con tus credenciales reales
3. En cPanel, ve a "Node.js App" y configura:
   - Directorio: /nodejs/ (o donde hayas subido los archivos)
   - Archivo de inicio: server.js
   - Variables de entorno: NODE_ENV=production
4. Instala dependencias: npm install --production
5. Inicializa la base de datos: node scripts/init-database.js
6. Inicia la aplicación: npm run prod

## Verificación
- Frontend: https://tu-dominio.com
- Backend health: https://tu-dominio.com/api/health

¡Recuerda actualizar las URLs y credenciales en .env.production!`;

fs.writeFileSync(path.join(deployDir, 'DEPLOY_INSTRUCTIONS.txt'), deployInstructions);

console.log('🎉 Build de producción completado!');
console.log('📁 Archivos listos en la carpeta "deploy/"');
console.log('📖 Lee DEPLOY_INSTRUCTIONS.txt para las instrucciones de despliegue');