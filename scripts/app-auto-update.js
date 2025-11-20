#!/usr/bin/env node

/**
 * 🚀 SISTEMA DE ACTUALIZACIÓN AUTOMÁTICA DE LA APP
 * 
 * Flujo completo:
 * 1. Commit de cambios pendientes
 * 2. Bump de versión (patch/minor/major)
 * 3. Actualizar backend localmente
 * 4. Build APK con EAS
 * 5. Esperar input del usuario con URL del release
 * 6. Actualizar backend con URL del APK
 * 7. Git tag y push
 * 8. Deploy automático al servidor (git pull + restart)
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

function log(message, emoji = '📱') {
  console.log(`${emoji} ${message}`);
}

function execCommand(command, cwd = process.cwd()) {
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Error ejecutando: ${command}`);
    return false;
  }
}

async function main() {
  const versionType = process.argv[2] || 'patch';

  if (!['patch', 'minor', 'major'].includes(versionType)) {
    console.error('❌ Tipo de versión inválido. Use: patch, minor o major');
    process.exit(1);
  }

  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║                                               ║');
  console.log('║   🚀 ACTUALIZACIÓN AUTOMÁTICA DE LA APP     ║');
  console.log('║                                               ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const appDir = process.cwd();
  const backendDir = path.join(appDir, '..', 'AQP-backend');

  // PASO 1: Commit de cambios pendientes en la app
  log('PASO 1: Verificando cambios pendientes...', '📝');
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      log('Cambios detectados. Haciendo commit...', '💾');
      const commitMsg = await question('Mensaje del commit (Enter para usar default): ');
      const finalMsg = commitMsg.trim() || `chore: Update app before ${versionType} version bump`;
      execCommand(`git add .`);
      execCommand(`git commit -m "${finalMsg}"`);
      execCommand('git push');
      log('✅ Cambios commiteados y pusheados\n');
    } else {
      log('✅ No hay cambios pendientes\n');
    }
  } catch (error) {
    log('⚠️  Error verificando git status, continuando...\n', '⚠️');
  }

  // PASO 2: Bump de versión
  log('PASO 2: Incrementando versión...', '🔢');
  const appJsonPath = path.join(appDir, 'app.json');
  const updateServicePath = path.join(appDir, 'services', 'updateService.ts');
  
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const currentVersion = appJson.expo.version;
  
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  let newVersion;
  
  switch (versionType) {
    case 'major': newVersion = `${major + 1}.0.0`; break;
    case 'minor': newVersion = `${major}.${minor + 1}.0`; break;
    case 'patch': newVersion = `${major}.${minor}.${patch + 1}`; break;
  }
  
  log(`Versión: ${currentVersion} → ${newVersion}\n`, '📱');
  
  // Actualizar app.json
  appJson.expo.version = newVersion;
  fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  
  // Actualizar updateService.ts
  let updateServiceContent = fs.readFileSync(updateServicePath, 'utf8');
  updateServiceContent = updateServiceContent.replace(
    /private currentVersion = ['"][\d.]+['"]/,
    `private currentVersion = '${newVersion}'`
  );
  fs.writeFileSync(updateServicePath, updateServiceContent);
  
  log('✅ Archivos actualizados\n');

  // PASO 3: Actualizar backend localmente
  log('PASO 3: Actualizando backend local...', '🔧');
  const appVersionPath = path.join(backendDir, 'src', 'routes', 'app-version.js');
  
  let appVersionContent = fs.readFileSync(appVersionPath, 'utf8');
  appVersionContent = appVersionContent.replace(
    /version: ['"][\d.]+['"]/,
    `version: '${newVersion}'`
  );
  // Temporalmente ponemos URL vacía
  appVersionContent = appVersionContent.replace(
    /downloadUrl: ['"].*?['"]/,
    `downloadUrl: 'https://github.com/FabianJimenez29/AQP-App/releases/download/v${newVersion}/aquapool-v${newVersion}.apk'`
  );
  fs.writeFileSync(appVersionPath, appVersionContent);
  log('✅ Backend actualizado\n');

  // PASO 4: Commit de cambios de versión
  log('PASO 4: Commiteando cambios de versión...', '💾');
  execCommand(`git add app.json services/updateService.ts`);
  execCommand(`git commit -m "chore(app): Bump app version to ${newVersion}"`);
  log('✅ Commit creado\n');

  // PASO 5: Build APK
  log('PASO 5: Iniciando build de APK...', '🏗️');
  console.log('⏳ Este proceso tomará 5-10 minutos...\n');
  
  const buildResult = execCommand('eas build --platform android --profile production --non-interactive');
  
  if (!buildResult) {
    console.error('❌ Error en el build. Abortando...');
    process.exit(1);
  }
  
  log('✅ Build completado\n', '✅');

  // PASO 6: Esperar URL del release
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║                                               ║');
  console.log('║   📦 CREA EL RELEASE EN GITHUB               ║');
  console.log('║                                               ║');
  console.log('╚═══════════════════════════════════════════════╝\n');
  console.log(`1. Ve a: https://github.com/FabianJimenez29/AQP-App/releases/new`);
  console.log(`2. Tag: v${newVersion}`);
  console.log(`3. Sube el APK descargado de EAS`);
  console.log(`4. Nombre del archivo: aquapool-v${newVersion}.apk`);
  console.log(`5. Publica el release\n`);
  
  let releaseUrl;
  let apkUrl;
  
  while (true) {
    releaseUrl = await question('Pega la URL del release aquí (debe incluir /releases/tag/ o /releases/download/): ');
    
    // Aceptar URL del release o URL del APK
    if (releaseUrl.includes('/releases/tag/') || releaseUrl.includes('/releases/download/')) {
      // Si pegó la URL del APK, extraer la versión y construir la URL correcta
      if (releaseUrl.includes('/releases/download/')) {
        log('✅ URL del APK detectada, extrayendo información...', '🔍');
      }
      
      apkUrl = `https://github.com/FabianJimenez29/AQP-App/releases/download/v${newVersion}/aquapool-v${newVersion}.apk`;
      log(`✅ URL del APK: ${apkUrl}\n`);
      break;
    } else {
      console.error('❌ URL inválida. Debe incluir /releases/tag/ o /releases/download/');
      console.log('Ejemplos válidos:');
      console.log(`  - https://github.com/FabianJimenez29/AQP-App/releases/tag/v${newVersion}`);
      console.log(`  - https://github.com/FabianJimenez29/AQP-App/releases/download/v${newVersion}/aquapool-v${newVersion}.apk\n`);
      
      const retry = await question('¿Intentar de nuevo? (s/n): ');
      if (retry.toLowerCase() !== 's') {
        console.log('\n⚠️  Proceso cancelado. Los cambios ya están commiteados.');
        console.log('Para continuar manualmente:');
        console.log(`1. Asegúrate de que el release esté creado en GitHub`);
        console.log(`2. Actualiza el backend: cd ../AQP-backend && vim src/routes/app-version.js`);
        console.log(`3. Push del backend: git add . && git commit -m "chore(app): Update to ${newVersion}" && git push`);
        console.log(`4. Tag y push de la app: git tag v${newVersion} && git push && git push origin v${newVersion}`);
        console.log(`5. Deploy al servidor: npm run remote → opción 5\n`);
        process.exit(0);
      }
    }
  }

  // PASO 7: Actualizar backend con URL final
  log('PASO 7: Actualizando backend con URL del APK...', '🔄');
  appVersionContent = fs.readFileSync(appVersionPath, 'utf8');
  appVersionContent = appVersionContent.replace(
    /downloadUrl: ['"].*?['"]/,
    `downloadUrl: '${apkUrl}'`
  );
  fs.writeFileSync(appVersionPath, appVersionContent);
  log('✅ Backend actualizado con URL del APK\n');

  // PASO 8: Commit del backend
  log('PASO 8: Commiteando cambios del backend...', '💾');
  execCommand(`git add ${appVersionPath}`, backendDir);
  execCommand(`git commit -m "chore(app): Update mobile app version to ${newVersion}"`, backendDir);
  log('✅ Backend commiteado\n');

  // PASO 9: Tag y push de la app
  log('PASO 9: Creando tag y haciendo push...', '🏷️');
  execCommand(`git tag v${newVersion}`);
  execCommand('git push');
  execCommand(`git push origin v${newVersion}`);
  log('✅ App pusheada con tag\n');

  // PASO 10: Push del backend
  log('PASO 10: Pusheando backend...', '🚀');
  execCommand('git push', backendDir);
  log('✅ Backend pusheado\n');

  // PASO 11: Deploy automático al servidor
  log('PASO 11: Desplegando en el servidor...', '🌐');
  console.log('⏳ Ejecutando git pull y restart en el servidor...\n');
  
  try {
    // Usar el sistema de comandos remotos
    const { spawn } = require('child_process');
    const deployScript = path.join(backendDir, 'scripts', 'auto-deploy.js');
    
    // Crear script temporal de deploy
    const autoDeployContent = `
const fetch = require('node-fetch');

async function deploy() {
  try {
    // Login
    const loginRes = await fetch('https://api.reportacr.lat/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'fabian@aquapool.com',
        password: 'fabian29'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    // Deploy
    const deployRes = await fetch('https://api.reportacr.lat/api/remote-admin/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify({})
    });

    const deployData = await deployRes.json();
    console.log('✅ Deploy exitoso:', deployData.message);
  } catch (error) {
    console.error('❌ Error en deploy:', error.message);
  }
}

deploy();
`;
    
    fs.writeFileSync(deployScript, autoDeployContent);
    execCommand(`node ${deployScript}`, backendDir);
    
    log('✅ Servidor actualizado y reiniciado\n', '✅');
    
  } catch (error) {
    log('⚠️  No se pudo hacer deploy automático', '⚠️');
    console.log('Hazlo manualmente: ssh root@138.197.82.182 "cd /root/AQP-backend && git pull && pm2 restart aqp-backend"\n');
  }

  // RESUMEN FINAL
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║                                               ║');
  console.log('║   ✅ ACTUALIZACIÓN COMPLETADA               ║');
  console.log('║                                               ║');
  console.log('╚═══════════════════════════════════════════════╝\n');
  
  console.log(`📱 Nueva versión: ${newVersion}`);
  console.log(`📦 APK: ${apkUrl}`);
  console.log(`🔗 Release: ${releaseUrl}`);
  console.log(`✅ Backend desplegado en servidor\n`);
  console.log('🎉 Los usuarios recibirán la notificación de actualización!\n');
  
  rl.close();
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  rl.close();
  process.exit(1);
});
