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

// 4. Copiar archivos del backend PHP
console.log('📋 Copiando archivos del backend PHP...');
const backendFiles = [
  '.env',
  'index.php',
  'init-database.php',
  '.htaccess',
  'README.md'
];

const backendDirs = [
  'config',
  'routes'
];

const phpBackendDir = path.join(__dirname, 'php-backend');
const backendDeployDir = path.join(deployDir, 'php-backend');
fs.mkdirSync(backendDeployDir);

// Copiar archivos individuales del backend PHP
backendFiles.forEach(file => {
  const srcPath = path.join(phpBackendDir, file);
  const destPath = path.join(backendDeployDir, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
  }
});

// Copiar directorios del backend PHP
backendDirs.forEach(dir => {
  const srcPath = path.join(phpBackendDir, dir);
  const destPath = path.join(backendDeployDir, dir);
  if (fs.existsSync(srcPath)) {
    copyRecursive(srcPath, destPath);
  }
});

console.log('✅ Archivos del backend PHP copiados');

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

## Backend PHP
1. Sube todos los archivos de la carpeta 'php-backend/' a: public_html/php-backend/
2. Edita el archivo .env con tus credenciales reales de base de datos
3. Ejecuta el script de inicialización: php init-database.php

## Verificación
- Frontend: https://tu-dominio.com/admin/
- Backend test: https://tu-dominio.com/php-backend/test-connection.php
- API login: https://tu-dominio.com/php-backend/login

## Configuración Adicional
- Asegúrate de que tu hosting soporte PHP 7.4+
- Verifica que las extensiones PDO y PDO_MySQL estén habilitadas
- Configura las variables de entorno en el archivo .env del backend PHP

**NOTA: Este proyecto usa backend PHP, no Node.js**`;

fs.writeFileSync(path.join(deployDir, 'DEPLOY_INSTRUCTIONS.txt'), deployInstructions);

console.log('🎉 Build de producción completado!');
console.log('📁 Archivos listos en la carpeta "deploy/"');
console.log('📖 Lee DEPLOY_INSTRUCTIONS.txt para las instrucciones de despliegue');