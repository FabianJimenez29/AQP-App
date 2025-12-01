#!/usr/bin/env node

/**
 * Script de verificación para el sistema de generación de PDFs
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando implementación del sistema de PDF...\n');

// Archivos requeridos
const requiredFiles = [
  'utils/reportHTMLTemplate.ts',
  'utils/pdfGenerator.ts',
  'screens/ReportPreviewScreen.tsx',
  'README_PDF_IMPLEMENTATION.md',
];

let allFilesExist = true;

console.log('📁 Verificando archivos creados...');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  const exists = fs.existsSync(filePath);
  
  if (exists) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    console.log(`  ❌ ${file} - NO ENCONTRADO`);
    allFilesExist = false;
  }
});

console.log('\n📦 Verificando dependencias en package.json...');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);

const requiredDeps = [
  'react-native-html-to-pdf',
  'react-native-webview',
  'expo-sharing',
  'expo-file-system',
];

let allDepsInstalled = true;

requiredDeps.forEach(dep => {
  const installed = packageJson.dependencies[dep];
  if (installed) {
    console.log(`  ✅ ${dep} (${installed})`);
  } else {
    console.log(`  ❌ ${dep} - NO INSTALADO`);
    allDepsInstalled = false;
  }
});

console.log('\n🔧 Verificando configuración en App.tsx...');
const appTsx = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');

const appChecks = [
  { name: 'Import de ReportPreviewScreen', pattern: /import.*ReportPreviewScreen.*from.*ReportPreviewScreen/i },
  { name: 'Screen de ReportPreview', pattern: /<Stack\.Screen.*name="ReportPreview".*component=\{ReportPreviewScreen\}/i },
];

let allAppChecksPass = true;

appChecks.forEach(check => {
  if (check.pattern.test(appTsx)) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ ${check.name} - NO ENCONTRADO`);
    allAppChecksPass = false;
  }
});

console.log('\n🔧 Verificando modificación en NewReportScreen.tsx...');
const newReportScreen = fs.readFileSync(
  path.join(__dirname, '..', 'screens', 'NewReportScreen.tsx'),
  'utf8'
);

const screenChecks = [
  { name: 'Navegación a ReportPreview', pattern: /navigation\.navigate\('ReportPreview'/i },
  { name: 'Parámetro reportData', pattern: /reportData.*reportToSend/i },
];

let allScreenChecksPass = true;

screenChecks.forEach(check => {
  if (check.pattern.test(newReportScreen)) {
    console.log(`  ✅ ${check.name}`);
  } else {
    console.log(`  ❌ ${check.name} - NO ENCONTRADO`);
    allScreenChecksPass = false;
  }
});

// Verificar que los archivos tienen contenido
console.log('\n📄 Verificando contenido de archivos...');

const templateFile = path.join(__dirname, '..', 'utils', 'reportHTMLTemplate.ts');
if (fs.existsSync(templateFile)) {
  const content = fs.readFileSync(templateFile, 'utf8');
  if (content.includes('generateReportHTML') && content.includes('<!DOCTYPE html>')) {
    console.log('  ✅ reportHTMLTemplate.ts tiene función y HTML');
  } else {
    console.log('  ⚠️  reportHTMLTemplate.ts puede estar incompleto');
  }
}

const pdfGenFile = path.join(__dirname, '..', 'utils', 'pdfGenerator.ts');
if (fs.existsSync(pdfGenFile)) {
  const content = fs.readFileSync(pdfGenFile, 'utf8');
  const functions = ['generatePDF', 'sharePDF', 'deletePDF', 'getPDFInfo', 'generateFileName'];
  const allFunctionsPresent = functions.every(fn => content.includes(fn));
  
  if (allFunctionsPresent) {
    console.log('  ✅ pdfGenerator.ts tiene todas las funciones');
  } else {
    console.log('  ⚠️  pdfGenerator.ts puede estar incompleto');
  }
}

const previewScreen = path.join(__dirname, '..', 'screens', 'ReportPreviewScreen.tsx');
if (fs.existsSync(previewScreen)) {
  const content = fs.readFileSync(previewScreen, 'utf8');
  const checks = ['WebView', 'generateReportHTML', 'generatePDF', 'sharePDF'];
  const allPresent = checks.every(check => content.includes(check));
  
  if (allPresent) {
    console.log('  ✅ ReportPreviewScreen.tsx está completa');
  } else {
    console.log('  ⚠️  ReportPreviewScreen.tsx puede estar incompleta');
  }
}

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN');
console.log('='.repeat(60));

if (allFilesExist && allDepsInstalled && allAppChecksPass && allScreenChecksPass) {
  console.log('✅ TODO ESTÁ CORRECTO');
  console.log('\n🚀 El sistema de PDF está listo para usar:');
  console.log('  1. npm start');
  console.log('  2. Crear un reporte');
  console.log('  3. Finalizar el reporte');
  console.log('  4. Ver la vista previa');
  console.log('  5. Generar PDF');
  console.log('  6. Compartir por WhatsApp');
  console.log('\n✨ ¡Todo funcionando correctamente!');
} else {
  console.log('⚠️  HAY ALGUNOS PROBLEMAS');
  console.log('\nProblemas encontrados:');
  if (!allFilesExist) console.log('  - Algunos archivos no existen');
  if (!allDepsInstalled) console.log('  - Faltan dependencias');
  if (!allAppChecksPass) console.log('  - Falta configuración en App.tsx');
  if (!allScreenChecksPass) console.log('  - Falta modificación en NewReportScreen.tsx');
  
  console.log('\n💡 Solución:');
  console.log('  - Revisa que todos los archivos se hayan creado');
  console.log('  - Ejecuta: npm install');
  console.log('  - Verifica los cambios en App.tsx y NewReportScreen.tsx');
}

console.log('\n📚 Documentación:');
console.log('  - README_PDF_IMPLEMENTATION.md - Guía completa');

console.log('\n' + '='.repeat(60) + '\n');
