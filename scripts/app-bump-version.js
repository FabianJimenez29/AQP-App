#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Obtener el tipo de versión del argumento (patch, minor, major)
const versionType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('❌ Tipo de versión inválido. Use: patch, minor o major');
  console.log('\nEjemplos:');
  console.log('  npm run app:bump patch  (1.0.3 → 1.0.4)');
  console.log('  npm run app:bump minor  (1.0.3 → 1.1.0)');
  console.log('  npm run app:bump major  (1.0.3 → 2.0.0)');
  process.exit(1);
}

// Rutas de los archivos
const appJsonPath = path.join(__dirname, '..', 'app.json');
const updateServicePath = path.join(__dirname, '..', 'services', 'updateService.ts');

// Leer app.json
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const currentVersion = appJson.expo.version;

// Parsear versión actual
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Calcular nueva versión
let newVersion;
switch (versionType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`\n📱 Actualizando versión de la APP MÓVIL: ${currentVersion} → ${newVersion}\n`);

// Actualizar app.json
appJson.expo.version = newVersion;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
console.log('✅ Actualizado: app.json');

// Actualizar updateService.ts
let updateServiceContent = fs.readFileSync(updateServicePath, 'utf8');
updateServiceContent = updateServiceContent.replace(
  /private currentVersion = ['"][\d.]+['"]/,
  `private currentVersion = '${newVersion}'`
);
fs.writeFileSync(updateServicePath, updateServiceContent);
console.log('✅ Actualizado: services/updateService.ts');

console.log(`\n🎉 Versión de la APP actualizada exitosamente a ${newVersion}\n`);

// Hacer commit y push automáticamente
try {
  console.log('📝 Haciendo commit...');
  execSync('git add app.json services/updateService.ts', { stdio: 'inherit' });
  execSync(`git commit -m "chore(app): Bump app version to ${newVersion}"`, { stdio: 'inherit' });
  
  console.log('🚀 Haciendo push...');
  execSync('git push', { stdio: 'inherit' });
  
  console.log(`🏷️  Creando tag v${newVersion}...`);
  execSync(`git tag v${newVersion}`, { stdio: 'inherit' });
  execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
  
  console.log('\n✅ Cambios subidos exitosamente\n');
  console.log('📋 Próximos pasos:');
  console.log('   1. npx eas-cli build --platform android --profile production');
  console.log('   2. Esperar a que termine el build (5-10 min)');
  console.log('   3. Crear release en GitHub con el APK');
  console.log('   4. npm run app:update-backend (para actualizar automáticamente)\n');
  
} catch (error) {
  console.error('\n❌ Error al hacer commit/push:', error.message);
  console.log('\n📋 Hazlo manualmente:');
  console.log('   git add app.json services/updateService.ts');
  console.log(`   git commit -m "chore(app): Bump app version to ${newVersion}"`);
  console.log('   git push');
  console.log(`   git tag v${newVersion}`);
  console.log(`   git push origin v${newVersion}\n`);
  process.exit(1);
}
