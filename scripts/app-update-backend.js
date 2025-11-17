#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Leer la versión actual de la app
const appJsonPath = path.join(__dirname, '..', 'app.json');
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const currentVersion = appJson.expo.version;

console.log(`\n🔍 Buscando release v${currentVersion} en GitHub...\n`);

// Configuración de GitHub
const GITHUB_OWNER = 'FabianJimenez29';
const GITHUB_REPO = 'AQP-App';

// Función para obtener el último release desde GitHub
function getLatestRelease() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/v${currentVersion}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Función principal
async function updateBackend() {
  try {
    // Obtener información del release
    const release = await getLatestRelease();
    
    // Buscar el archivo APK en los assets
    const apkAsset = release.assets.find(asset => 
      asset.name.includes('.apk') && asset.name.includes(currentVersion)
    );

    if (!apkAsset) {
      console.error('❌ No se encontró el APK en el release');
      console.log('\n📋 Asegúrate de:');
      console.log('   1. Haber creado el release en GitHub');
      console.log('   2. Haber subido el APK al release');
      console.log(`   3. El nombre del APK contenga: v${currentVersion}`);
      process.exit(1);
    }

    const downloadUrl = apkAsset.browser_download_url;
    console.log(`✅ APK encontrado: ${apkAsset.name}`);
    console.log(`📦 URL: ${downloadUrl}\n`);

    // Ruta al archivo del backend
    const backendPath = path.join(__dirname, '..', '..', 'AQP-backend', 'src', 'routes', 'app-version.js');
    
    if (!fs.existsSync(backendPath)) {
      console.error('❌ No se encontró el archivo del backend');
      console.log(`   Ruta esperada: ${backendPath}`);
      process.exit(1);
    }

    // Leer el archivo del backend
    let backendContent = fs.readFileSync(backendPath, 'utf8');

    // Actualizar la información
    const releaseNotes = release.body || 'Actualización de la aplicación móvil';
    const cleanNotes = releaseNotes.split('\n')[0].replace(/[#*]/g, '').trim();

    // Reemplazar la configuración
    backendContent = backendContent.replace(
      /const latestVersion = \{[\s\S]*?\};/,
      `const latestVersion = {
  version: '${currentVersion}',
  downloadUrl: '${downloadUrl}',
  releaseNotes: '${cleanNotes}',
  mandatory: false, // Si es true, el usuario no puede cancelar la actualización
};`
    );

    // Guardar el archivo
    fs.writeFileSync(backendPath, backendContent);
    console.log('✅ Actualizado: AQP-backend/src/routes/app-version.js\n');

    // Hacer commit y push en el backend
    try {
      const backendDir = path.join(__dirname, '..', '..', 'AQP-backend');
      
      console.log('📝 Haciendo commit en el backend...');
      execSync('git add src/routes/app-version.js', { cwd: backendDir, stdio: 'inherit' });
      execSync(`git commit -m "chore(app): Update mobile app version to ${currentVersion}"`, { cwd: backendDir, stdio: 'inherit' });
      
      console.log('🚀 Haciendo push del backend...');
      execSync('git push', { cwd: backendDir, stdio: 'inherit' });
      
      console.log('\n✅ Backend actualizado exitosamente\n');
      console.log('📋 Próximo paso:');
      console.log('   - Reiniciar el servidor backend: pm2 restart aqp-backend\n');
      console.log('🎉 ¡Actualización completada! Los usuarios ahora recibirán la notificación de actualización.\n');
      
    } catch (error) {
      console.error('\n❌ Error al hacer commit/push del backend:', error.message);
      console.log('\n📋 Hazlo manualmente:');
      console.log('   cd ../AQP-backend');
      console.log('   git add src/routes/app-version.js');
      console.log(`   git commit -m "chore(app): Update mobile app version to ${currentVersion}"`);
      console.log('   git push');
      console.log('   pm2 restart aqp-backend\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Verifica que:');
    console.log(`   1. Existe el release v${currentVersion} en GitHub`);
    console.log('   2. El release contiene el archivo APK');
    console.log('   3. Tienes conexión a internet\n');
    process.exit(1);
  }
}

// Ejecutar
updateBackend();
