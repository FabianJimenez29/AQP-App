# 📱 Guía de Actualización de la App Móvil v1.0.4

## 🚀 Proceso Completo de Actualización

Esta guía te ayudará a actualizar la aplicación móvil con todos los cambios del nuevo tunnel.

---

## ✅ PASO 1: Verificar Estado Actual

### 1.1 Verificar Backend
```bash
cd /Users/fabi/Desktop/AQP-Root/AQP-backend
pm2 status
curl https://api.reportacr.lat/api/health
```

Deberías ver:
- Backend corriendo en puerto 3002
- Response con `"status": "OK"`
- `"version": "1.1.16"` o superior

### 1.2 Verificar Tunnel
```bash
cloudflared tunnel list
```

Deberías ver `aqp-backend-tunnel` activo.

---

## 🔧 PASO 2: Preparar el Build

### 2.1 Revisar Cambios
```bash
cd /Users/fabi/Desktop/AQP-Root/AQP-App
git status
```

### 2.2 Hacer Commit (Opcional pero recomendado)
```bash
git add .
git commit -m "feat: v1.0.4 - Migración a aqp-backend-tunnel (puerto 3002)"
git push origin main
```

### 2.3 Ejecutar Script de Build
```bash
cd /Users/fabi/Desktop/AQP-Root/AQP-App
./build-and-deploy.sh
```

El script te guiará a través del proceso y verificará:
- ✅ Configuración del .env
- ✅ Conexión al backend
- ✅ Versiones correctas en los archivos
- ✅ Dependencias instaladas

---

## 📦 PASO 3: Build del APK

### Opción A: Build con EAS (Recomendado)

**Ventajas:**
- Build en la nube
- No requiere Android SDK local
- APK firmado automáticamente
- Notificación por email cuando esté listo

**Comandos:**
```bash
# Si no tienes EAS instalado
npm install -g eas-cli

# Login (solo la primera vez)
eas login

# Iniciar build
eas build --platform android --profile production
```

**Tiempo estimado:** 10-20 minutos

El APK estará disponible en:
https://expo.dev/accounts/jotix/projects/aquapool-app/builds

### Opción B: Build Local

**Requisitos:**
- Android SDK configurado
- JDK instalado
- Variables de entorno configuradas

**Comando:**
```bash
npm run build:local
```

El APK se generará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🌐 PASO 4: Subir el APK

### 4.1 Opción: GitHub Release

```bash
# Crear tag
git tag -a v1.0.4 -m "Version 1.0.4 - Tunnel update"
git push origin v1.0.4

# Ir a GitHub
# https://github.com/FabianJimenez29/AQP-App/releases/new
# - Crear nueva release
# - Tag: v1.0.4
# - Título: "v1.0.4 - Actualización del Tunnel"
# - Descripción: Copiar desde CHANGELOG-v1.0.4.md
# - Subir el APK
```

### 4.2 Opción: Servidor Web

```bash
# Copiar APK al servidor
scp app-release.apk user@server:/path/to/downloads/

# O usar el backend local
cp app-release.apk /Users/fabi/Desktop/AQP-Root/AQP-backend/uploads/apks/aquapool-v1.0.4.apk
```

---

## 🔄 PASO 5: Actualizar Backend

### 5.1 Crear/Actualizar registro en la base de datos

Necesitas actualizar la tabla de versiones de la app en el backend para que el sistema de auto-actualización funcione.

**Opción 1: Usando la API del Admin**
1. Ir al Admin Dashboard
2. Sección "Configuración"
3. "Versiones de App"
4. Agregar nueva versión:
   - Versión: 1.0.4
   - URL de descarga: (la URL donde subiste el APK)
   - Notas: Copiar desde CHANGELOG-v1.0.4.md
   - Obligatoria: No (o Sí si quieres forzar)

**Opción 2: Manualmente en la DB**
```sql
INSERT INTO app_versions (
  version,
  download_url,
  release_notes,
  mandatory,
  created_at
) VALUES (
  '1.0.4',
  'https://tu-servidor.com/downloads/aquapool-v1.0.4.apk',
  'Actualización del Cloudflare Tunnel',
  false,
  NOW()
);
```

### 5.2 Verificar desde la app

En la app, el servicio `updateService.ts` verificará automáticamente:
- Cada 30 minutos
- Al abrir la app
- Manualmente desde el perfil

---

## 🧪 PASO 6: Probar la Actualización

### 6.1 Test Manual

1. Instalar la versión anterior (1.0.3) en un dispositivo
2. Abrir la app
3. Esperar la notificación de actualización
4. Confirmar instalación
5. Verificar que la nueva versión (1.0.4) se instale correctamente

### 6.2 Test de Conexión

Una vez instalada la v1.0.4:

```bash
# Desde el dispositivo o emulador, verificar logs
adb logcat | grep -i "api\|tunnel\|connection"
```

La app debería conectarse a:
- `https://api.reportacr.lat/api`
- Puerto backend: 3002

---

## 📋 PASO 7: Checklist Final

Antes de considerar completada la actualización:

- [ ] Backend corriendo en puerto 3002
- [ ] Tunnel `aqp-backend-tunnel` activo
- [ ] APK compilado exitosamente
- [ ] APK subido a servidor/GitHub
- [ ] Base de datos actualizada con nueva versión
- [ ] Test manual exitoso
- [ ] Conexión al nuevo tunnel verificada
- [ ] Logs sin errores
- [ ] Todas las funcionalidades trabajando:
  - [ ] Login
  - [ ] Dashboard
  - [ ] Crear reportes
  - [ ] Historial
  - [ ] Productos
  - [ ] Carrito
  - [ ] Perfil

---

## 🆘 Solución de Problemas

### Problema: Build falla con EAS

**Solución:**
```bash
# Limpiar y reintentar
rm -rf node_modules .expo
npm install
eas build --platform android --profile production --clear-cache
```

### Problema: APK no se descarga en la app

**Solución:**
1. Verificar que la URL de descarga sea accesible
2. Verificar permisos en el servidor
3. Revisar logs del backend: `pm2 logs aqp-backend`

### Problema: App no detecta actualización

**Solución:**
1. Verificar tabla `app_versions` en la base de datos
2. Verificar que la versión en updateService.ts sea correcta (1.0.4)
3. Forzar check desde la app (ir a Perfil → revisar actualizaciones)

### Problema: Error de conexión después de actualizar

**Solución:**
1. Verificar .env en la app tiene la URL correcta
2. Reinstalar la app completamente
3. Limpiar caché del dispositivo

---

## 📞 Contacto

Si encuentras problemas durante el proceso:
1. Revisar los logs del backend: `pm2 logs aqp-backend`
2. Revisar los logs del tunnel: `cloudflared tunnel info aqp-backend-tunnel`
3. Consultar este documento
4. Revisar CHANGELOG-v1.0.4.md para detalles de los cambios

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, los usuarios con la app instalada recibirán automáticamente una notificación para actualizar a la versión 1.0.4.

**Tiempo total estimado:** 30-45 minutos (dependiendo del método de build)
