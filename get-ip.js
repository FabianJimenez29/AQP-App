#!/usr/bin/env node
// Script para obtener la IP local actual
const { exec } = require('child_process');

console.log('🔍 Detectando IP local...\n');

// Detectar IP en macOS
exec('ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error detectando IP:', error.message);
    return;
  }

  const output = stdout.trim();
  const ipMatch = output.match(/inet\s+([\d.]+)/);
  
  if (ipMatch) {
    const ip = ipMatch[1];
    console.log(`✅ IP detectada: ${ip}`);
    console.log(`\n📝 Para actualizar tu app, cambia la IP en:`);
    console.log(`   services/api.ts línea ~10:`);
    console.log(`   return 'http://${ip}:3001/api';`);
    console.log(`\n🔗 URL completa: http://${ip}:3001`);
  } else {
    console.log('❌ No se pudo detectar la IP');
  }
});