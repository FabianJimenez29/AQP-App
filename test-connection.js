#!/usr/bin/env node

/**
 * Script de prueba de conexión para AQP-App
 * Verifica que el tunnel de Cloudflare esté funcionando correctamente
 */

const https = require('https');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const TUNNEL_URL = 'https://api.reportacr.lat';
const API_BASE_PATH = '/api';

console.log(`\n${colors.bright}${colors.cyan}╔════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}║   🔌 Test de Conexión - AQP Mobile App   ║${colors.reset}`);
console.log(`${colors.bright}${colors.cyan}╚════════════════════════════════════════════╝${colors.reset}\n`);

console.log(`${colors.blue}📡 Tunnel:${colors.reset} aqp-backend-tunnel`);
console.log(`${colors.blue}🌐 URL:${colors.reset} ${TUNNEL_URL}`);
console.log(`${colors.blue}🔧 Puerto Backend:${colors.reset} 3002`);
console.log(`${colors.blue}📍 Base Path:${colors.reset} ${API_BASE_PATH}\n`);

function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const url = `${TUNNEL_URL}${API_BASE_PATH}${path}`;
    console.log(`${colors.yellow}⏳ Probando:${colors.reset} ${description}`);
    console.log(`   ${colors.cyan}${url}${colors.reset}`);

    const startTime = Date.now();
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const duration = Date.now() - startTime;
        
        if (res.statusCode === 200) {
          console.log(`   ${colors.green}✅ ÉXITO${colors.reset} (${res.statusCode}) - ${duration}ms`);
          
          try {
            const json = JSON.parse(data);
            if (json.version) {
              console.log(`   ${colors.blue}📦 Versión:${colors.reset} ${json.version}`);
            }
            if (json.status) {
              console.log(`   ${colors.blue}📊 Estado:${colors.reset} ${json.status}`);
            }
          } catch (e) {
            // No es JSON, está bien
          }
          
          resolve({ success: true, status: res.statusCode, duration });
        } else {
          console.log(`   ${colors.red}❌ ERROR${colors.reset} (${res.statusCode}) - ${duration}ms`);
          resolve({ success: false, status: res.statusCode, duration });
        }
      });
    }).on('error', (err) => {
      const duration = Date.now() - startTime;
      console.log(`   ${colors.red}❌ ERROR DE CONEXIÓN${colors.reset} - ${duration}ms`);
      console.log(`   ${colors.red}${err.message}${colors.reset}`);
      resolve({ success: false, error: err.message, duration });
    });
  });
}

async function runTests() {
  const tests = [
    { path: '/health', desc: 'Health Check' },
    { path: '/version', desc: 'Version Info' },
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.path, test.desc);
    results.push(result);
    console.log('');
  }

  // Resumen
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  console.log(`${colors.bright}📊 RESUMEN${colors.reset}\n`);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgDuration = results.reduce((acc, r) => acc + (r.duration || 0), 0) / results.length;
  
  console.log(`${colors.green}✅ Exitosos:${colors.reset} ${successful}/${results.length}`);
  console.log(`${colors.red}❌ Fallidos:${colors.reset} ${failed}/${results.length}`);
  console.log(`${colors.blue}⚡ Tiempo promedio:${colors.reset} ${Math.round(avgDuration)}ms\n`);
  
  if (successful === results.length) {
    console.log(`${colors.green}${colors.bright}🎉 ¡TODOS LOS TESTS PASARON!${colors.reset}`);
    console.log(`${colors.green}La app móvil puede conectarse correctamente al backend.${colors.reset}\n`);
  } else {
    console.log(`${colors.red}${colors.bright}⚠️  ALGUNOS TESTS FALLARON${colors.reset}`);
    console.log(`${colors.yellow}Verifica que:${colors.reset}`);
    console.log(`  1. El backend esté corriendo (pm2 status)`);
    console.log(`  2. El tunnel esté activo (cloudflared tunnel list)`);
    console.log(`  3. El puerto 3002 esté abierto\n`);
  }
  
  console.log(`${colors.cyan}═══════════════════════════════════════════${colors.reset}\n`);
  
  // Próximos pasos
  console.log(`${colors.bright}📱 PRÓXIMOS PASOS PARA LA APP MÓVIL:${colors.reset}\n`);
  console.log(`  1. ${colors.blue}Reiniciar Metro Bundler:${colors.reset}`);
  console.log(`     ${colors.cyan}npx expo start -c${colors.reset}\n`);
  console.log(`  2. ${colors.blue}Verificar .env:${colors.reset}`);
  console.log(`     ${colors.cyan}CLOUDFLARE_TUNNEL_URL=${TUNNEL_URL}${colors.reset}`);
  console.log(`     ${colors.cyan}USE_CLOUDFLARE_TUNNEL=true${colors.reset}\n`);
  console.log(`  3. ${colors.blue}Compilar nueva versión:${colors.reset}`);
  console.log(`     ${colors.cyan}eas build --platform android --profile production${colors.reset}\n`);
}

runTests().catch(console.error);
