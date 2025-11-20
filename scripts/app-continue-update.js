#!/usr/bin/env node

/**
 * Script para continuar el proceso de actualización desde el paso del release
 * Útil cuando el script principal falló o se canceló
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
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
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║   🔄 CONTINUAR ACTUALIZACIÓN DE LA APP      ║');
  console.log('╚═══════════════════════════════════════════════╝\n');

  const appDir = process.cwd();
  const backendDir = path.join(appDir, '..', 'AQP-backend');

  // Leer versión actual
  const appJsonPath = path.join(appDir, 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const currentVersion = appJson.expo.version;

  console.log(`📱 Versión actual: ${currentVersion}\n`);

  // Verificar si el release existe
  console.log('📦 Asegúrate de que el release esté creado en GitHub:');
  console.log(`   https://github.com/FabianJimenez29/AQP-App/releases/tag/v${currentVersion}\n`);

  const releaseExists = await question('¿El release ya está creado? (s/n): ');
  
  if (releaseExists.toLowerCase() !== 's') {
    console.log('\n⚠️  Por favor, crea el release primero:');
    console.log(`1. Ve a: https://github.com/FabianJimenez29/AQP-App/releases/new`);
    console.log(`2. Tag: v${currentVersion}`);
    console.log(`3. Sube el APK: aquapool-v${currentVersion}.apk`);
    console.log(`4. Publica el release`);
    console.log(`5. Vuelve a ejecutar este script\n`);
    rl.close();
    return;
  }

  const apkUrl = `https://github.com/FabianJimenez29/AQP-App/releases/download/v${currentVersion}/aquapool-v${currentVersion}.apk`;
  console.log(`\n✅ URL del APK: ${apkUrl}\n`);

  // Actualizar backend
  console.log('🔄 Actualizando backend...');
  const appVersionPath = path.join(backendDir, 'src', 'routes', 'app-version.js');
  
  let appVersionContent = fs.readFileSync(appVersionPath, 'utf8');
  appVersionContent = appVersionContent.replace(
    /version: ['"][\d.]+['"]/,
    `version: '${currentVersion}'`
  );
  appVersionContent = appVersionContent.replace(
    /downloadUrl: ['"].*?['"]/,
    `downloadUrl: '${apkUrl}'`
  );
  fs.writeFileSync(appVersionPath, appVersionContent);
  console.log('✅ Backend actualizado\n');

  // Commit del backend
  console.log('💾 Commiteando backend...');
  execCommand(`git add ${appVersionPath}`, backendDir);
  execCommand(`git commit -m "chore(app): Update mobile app version to ${currentVersion}"`, backendDir);
  console.log('✅ Backend commiteado\n');

  // Verificar si el tag ya existe
  try {
    execSync(`git tag -l v${currentVersion}`, { encoding: 'utf8', cwd: appDir });
    const tagExists = execSync(`git tag -l v${currentVersion}`, { encoding: 'utf8', cwd: appDir }).trim();
    
    if (!tagExists) {
      console.log('🏷️  Creando tag...');
      execCommand(`git tag v${currentVersion}`);
    } else {
      console.log('⚠️  El tag ya existe, saltando...');
    }
  } catch (error) {
    console.log('🏷️  Creando tag...');
    execCommand(`git tag v${currentVersion}`);
  }

  // Push de app y backend
  console.log('\n🚀 Haciendo push...');
  execCommand('git push', appDir);
  execCommand(`git push origin v${currentVersion}`, appDir);
  execCommand('git push', backendDir);
  console.log('✅ Todo pusheado\n');

  // Deploy al servidor
  console.log('🌐 Desplegando en el servidor...');
  const deployScript = path.join(backendDir, 'scripts', 'auto-deploy.js');
  
  const autoDeployContent = `
const fetch = require('node-fetch');

async function deploy() {
  try {
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
  
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║   ✅ ACTUALIZACIÓN COMPLETADA               ║');
  console.log('╚═══════════════════════════════════════════════╝\n');
  
  console.log(`📱 Versión: ${currentVersion}`);
  console.log(`📦 APK: ${apkUrl}`);
  console.log(`✅ Backend desplegado en servidor\n`);
  console.log('🎉 Los usuarios recibirán la notificación de actualización!\n');
  
  rl.close();
}

main().catch(error => {
  console.error('\n❌ Error fatal:', error);
  rl.close();
  process.exit(1);
});
