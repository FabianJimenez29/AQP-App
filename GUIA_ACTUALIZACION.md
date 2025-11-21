# 📱 Guía de Actualización de la App

## Proceso Manual de Actualización

### Paso 1: Preparar la nueva versión

```bash
# Hacer commit de los cambios pendientes
git add .
git commit -m "feat: Descripción de los cambios"
```

### Paso 2: Actualizar la versión

```bash
# Opción A: Actualizar versión manualmente
# Editar estos 3 archivos:
# - AQP-App/app.json → "version": "1.0.X"
# - AQP-App/services/updateService.ts → private currentVersion = '1.0.X'
# - AQP-backend/src/routes/app-version.js → version: '1.0.X' y downloadUrl

# Opción B: Usar el script (solo actualiza app.json y updateService.ts)
npm run app:bump
# Elige: patch (1.0.9 → 1.0.10), minor (1.0.9 → 1.1.0), o major (1.0.9 → 2.0.0)
```

### Paso 3: Hacer build del APK

```bash
# Iniciar el build
eas build --platform android --profile production

# Espera a que termine el build
# Te dará una URL como: https://expo.dev/artifacts/...
```

### Paso 4: Crear release en GitHub

1. Ve a: https://github.com/FabianJimenez29/AQP-App/releases/new
2. Tag version: `v1.0.X` (ejemplo: `v1.0.10`)
3. Release title: `v1.0.X - Descripción breve`
4. Descripción: Escribe los cambios importantes
5. **Descarga el APK** del link que te dio EAS
6. **Arrastra el APK** a la sección de archivos del release
7. Espera a que suba
8. Click en "Publish release"
9. **Copia la URL del APK** (botón derecho en el archivo → Copiar enlace)

### Paso 5: Actualizar el backend

Edita `AQP-backend/src/routes/app-version.js`:

```javascript
const latestVersion = {
  version: '1.0.X',  // ← La nueva versión
  downloadUrl: 'https://github.com/FabianJimenez29/AQP-App/releases/download/v1.0.X/aquapool-v1.0.X.apk',  // ← URL del APK
  releaseNotes: 'Descripción de los cambios',
  mandatory: false  // true = obligatorio, false = opcional
};
```

### Paso 6: Crear tag y push

```bash
# En AQP-App
cd AQP-App
git add .
git commit -m "chore: Release v1.0.X"
git tag v1.0.X
git push origin main
git push origin v1.0.X

# En AQP-backend
cd ../AQP-backend
git add .
git commit -m "chore: Actualizar versión disponible a 1.0.X"
git push origin main
```

### Paso 7: Desplegar en el servidor

**Opción A: Conexión SSH manual**
```bash
ssh root@138.197.82.182
cd /root/AQP-backend
git pull
pm2 restart aqp-backend
exit
```

**Opción B: Usar control remoto (RECOMENDADO)**
```bash
cd AQP-backend
npm run remote
# Elige opción: 5. Full Deploy (git pull + restart)
```

---

## ✅ Verificar que funcionó

1. Abre la app en tu celular
2. Ve a Perfil → "Buscar Actualizaciones"
3. Debe aparecer: "Nueva versión 1.0.X disponible"
4. Click en "Actualizar"
5. Se descarga el APK y te pide instalar
6. ¡Listo!

---

## 🔧 Control Remoto del Servidor

El backend tiene un script para controlar el servidor remotamente:

```bash
cd AQP-backend
npm run remote
```

**Opciones disponibles:**
- `1` - Reiniciar servidor
- `2` - Ver estado del servidor (memoria, CPU, uptime)
- `3` - Ver logs del servidor
- `4` - Hacer git pull
- `5` - Full Deploy (git pull + restart)
- `6` - Salir

**Credenciales:** Usa tu email y contraseña de admin

---

## 📋 Resumen Rápido

1. ✏️  Editar versión en 3 archivos
2. 🏗️  Build: `eas build --platform android --profile production`
3. 📦 Crear release en GitHub y subir APK
4. 🔄 Actualizar backend con nueva versión y URL
5. 🏷️  Tag: `git tag v1.0.X && git push --tags`
6. 🚀 Deploy: `npm run remote` → opción 5

---

## ⚠️ Notas Importantes

- **Siempre** incrementa la versión correctamente
- **Siempre** espera a que el build termine antes de crear el release
- **Siempre** verifica que la URL del APK sea correcta
- **Siempre** haz deploy del backend después de actualizar
- El sistema compara versiones: 1.0.10 > 1.0.9 > 1.0.8
- Si mandatory=true, el usuario NO puede cancelar la actualización
