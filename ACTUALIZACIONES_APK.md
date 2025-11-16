# 🔄 Sistema de Actualizaciones Automáticas del APK

## 🎯 Resumen Ejecutivo

> **Solo haces 1 APK inicial. Después, NUNCA más necesitas reinstalar. Los técnicos reciben actualizaciones automáticamente.**

### **El Flujo Simple:**

```
┌─────────────────────────────────────────────────────────────┐
│  1. Haces cambios en el código                              │
│  2. Creas un Release en GitHub con el nuevo APK             │
│  3. Actualizas la versión en el backend                     │
│  4. Los técnicos reciben la actualización automáticamente   │
│     (sin desinstalar, sin perder datos)                     │
└─────────────────────────────────────────────────────────────┘
```

### **¿Cómo lo reciben los técnicos?**

**Automático (cada 30 minutos):**
- La app detecta que hay nueva versión
- Muestra un cuadro de diálogo
- El técnico acepta
- Se descarga e instala solo

**Manual (botón en Perfil):**
- El técnico presiona "Buscar Actualizaciones"
- Si hay nueva versión, aparece el diálogo
- Acepta y se actualiza

**✨ Sin desinstalar, sin perder datos, sin complicaciones**

---

## 📋 Resumen

Sistema de actualizaciones OTA (Over-The-Air) para la app móvil de AquaPool que permite actualizar el APK sin desinstalar, usando GitHub Releases.

---

## 🎯 Características

- ✅ Detección automática de nuevas versiones cada 30 minutos
- ✅ Descarga e instalación de APK en segundo plano
- ✅ Notificación al usuario para actualizar
- ✅ Actualizaciones opcionales o obligatorias
- ✅ No requiere desinstalar la app
- ✅ Se integra con GitHub Releases

---

## 🚀 Cómo Funciona

### **1. Flujo Automático:**

1. La app verifica cada 30 minutos si hay actualizaciones
2. Si hay una nueva versión, muestra un diálogo al usuario
3. El usuario acepta actualizar
4. La app descarga el APK en segundo plano
5. Abre el instalador de Android automáticamente
6. El usuario confirma la instalación
7. La app se actualiza sin perder datos

### **2. Flujo Manual:**

1. El técnico va a **Perfil** en la app
2. Presiona **"Buscar Actualizaciones"**
3. Si hay actualización, aparece un diálogo
4. Sigue el proceso de instalación

---

## 📝 Cómo Publicar una Nueva Versión

> ⚠️ **IMPORTANTE**: Solo necesitas generar 1 APK inicial. Después de eso, NUNCA más necesitas desinstalar/reinstalar. Los usuarios reciben actualizaciones automáticamente.

---

### **🎬 Primera Vez (Solo se hace UNA VEZ):**

#### **1. Generar el APK Inicial (v1.0.0)**

```bash
cd /Users/fabi/Desktop/AQP-Root/AQP-App
npx eas-cli build --platform android --profile preview
```

#### **2. Instalar en los Dispositivos**
- Descarga el APK
- Instálalo en los dispositivos de los técnicos
- **Listo! Nunca más necesitas reinstalar**

---

### **🔄 Actualizaciones Futuras (SIN Reinstalar):**

#### **Paso 1: Hacer tus cambios en el código**
- Agrega features, correcciones, mejoras
- Haz commit y push a GitHub

```bash
cd /Users/fabi/Desktop/AQP-Root/AQP-App
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

#### **Paso 2: Actualizar la Versión**

Edita `/AQP-App/app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Incrementa el número
    ...
  }
}
```

Edita `/AQP-App/services/updateService.ts`:
```typescript
private currentVersion = '1.0.1'; // Debe coincidir con app.json
```

```bash
git add app.json services/updateService.ts
git commit -m "chore: bump version to 1.0.1"
git push origin main
```

#### **Paso 3: Generar el Nuevo APK**

```bash
npx eas-cli build --platform android --profile preview
```

Espera 5-10 minutos. EAS te dará una URL.

#### **Paso 4: Crear Release en GitHub**

```bash
# Crear tag
git tag v1.0.1
git push origin v1.0.1
```

Luego en GitHub:
1. Ve a: https://github.com/FabianJimenez29/AQP-App/releases
2. Click **"Create a new release"**
3. Selecciona el tag: `v1.0.1`
4. Título: `v1.0.1`
5. Descripción:
   ```
   ## 🆕 Novedades
   - Nueva funcionalidad X
   - Mejora en Y
   
   ## 🐛 Correcciones
   - Arreglado bug Z
   ```
6. **Descarga el APK de EAS y súbelo al Release**
7. Copia la URL del APK (botón derecho → Copiar enlace)
8. Click **"Publish release"**

#### **Paso 5: Actualizar el Backend**

Edita `/AQP-backend/src/routes/app-version.js`:

```javascript
const latestVersion = {
  version: '1.0.1', // Nueva versión
  downloadUrl: 'https://github.com/FabianJimenez29/AQP-App/releases/download/v1.0.1/aquapool.apk',
  releaseNotes: 'Nueva funcionalidad X, mejora en Y, arreglado bug Z',
  mandatory: false, // false = opcional, true = obligatorio
};
```

```bash
cd /Users/fabi/Desktop/AQP-Root/AQP-backend
git add src/routes/app-version.js
git commit -m "chore: update app version to 1.0.1"
git push
pm2 restart aqp-backend
```

#### **Paso 6: Los Usuarios Reciben la Actualización Automáticamente**

**Automático (30 minutos):**
- La app verifica sola cada 30 minutos
- Muestra diálogo: "Nueva versión 1.0.1 disponible"
- Usuario acepta → Se descarga e instala automáticamente

**Manual:**
- Usuario va a **Perfil**
- Presiona **"Buscar Actualizaciones"**
- Aparece el diálogo si hay actualización
- Acepta → Se descarga e instala

**✨ No necesita desinstalar, no pierde datos, no necesita reinstalar**

---

## ✅ Verificación

### **Opción 1: Esperar 30 minutos (Automático)**
1. Los técnicos usan la app normalmente
2. Después de 30 minutos, aparece automáticamente:
   ```
   📱 Nueva versión 1.0.1 disponible
   
   Nueva funcionalidad X, mejora en Y
   
   [Cancelar] [Actualizar]
   ```
3. Presionan **"Actualizar"**
4. La app descarga e instala la nueva versión
5. **Listo! Sin desinstalar nada**

### **Opción 2: Buscar Manualmente**
1. El técnico abre la app
2. Va a **Perfil** (última pestaña)
3. Presiona **"Buscar Actualizaciones"**
4. Si hay actualización, aparece el mismo diálogo
5. Acepta y se actualiza

### **⚠️ Importante:**
- **NO necesitas pedirles que desinstalen la app**
- **NO necesitas enviarles un nuevo APK**
- **NO pierden sus datos ni sesión**
- Solo aparece el diálogo, aceptan, y listo

---

## 🔧 Configuración

### **Cambiar el intervalo de verificación:**

En `/AQP-App/App.tsx`:

```typescript
// Cambiar de 30 minutos a otro valor
updateService.startAutoCheck(60); // 60 minutos
```

### **Forzar actualización obligatoria:**

En `/AQP-backend/src/routes/app-version.js`:

```javascript
const latestVersion = {
  version: '1.0.1',
  downloadUrl: '...',
  releaseNotes: '...',
  mandatory: true, // ← Cambiar a true
};
```

Cuando `mandatory: true`, el usuario NO puede cancelar la actualización.

---

## 🐛 Solución de Problemas

### **"No detecta la nueva versión"**

1. Verifica que el backend esté actualizado
2. Verifica la URL del APK en GitHub Releases
3. Prueba manualmente: Perfil → Buscar Actualizaciones

### **"Error al descargar"**

1. Verifica que la URL del APK sea pública
2. Verifica que el APK exista en GitHub Releases
3. Verifica la conexión a internet del dispositivo

### **"Error al instalar"**

1. Verifica que el APK esté firmado correctamente
2. Verifica que los permisos estén habilitados:
   - Settings → Apps → AquaPool → Permisos
   - Habilitar "Instalar apps desconocidas"

---

## 📊 Endpoints del Backend

### **GET /api/app-version/latest**

Obtiene información de la última versión del APK.

**Response:**
```json
{
  "version": "1.0.1",
  "downloadUrl": "https://github.com/.../aquapool.apk",
  "releaseNotes": "Mejoras y correcciones",
  "mandatory": false
}
```

---

## 🎯 Roadmap

- [ ] Mostrar barra de progreso durante la descarga
- [ ] Historial de actualizaciones
- [ ] Actualización en segundo plano sin interrumpir al usuario
- [ ] Rollback automático si falla la instalación
- [ ] Notificaciones push cuando hay nueva versión

---

## ⚠️ Notas Importantes

1. **Este sistema NO afecta las actualizaciones del backend** (sistema separado)
2. **El usuario debe aceptar la instalación** manualmente (limitación de Android)
3. **Requiere permisos** de instalación de apps desconocidas
4. **Los datos de la app se mantienen** al actualizar

---

## ❓ Preguntas Frecuentes

### **¿Tengo que generar un APK cada vez?**
**Sí**, pero solo lo subes a GitHub. Los técnicos NO necesitan instalarlo manualmente.

### **¿Los técnicos necesitan desinstalar la app?**
**NO**. Nunca. La actualización se instala sobre la versión existente.

### **¿Pierden sus datos al actualizar?**
**NO**. Todo se mantiene: sesión, configuración, datos locales.

### **¿Puedo forzar una actualización obligatoria?**
**Sí**. En el backend, cambia `mandatory: true`. El técnico NO podrá cancelar.

### **¿Qué pasa si el técnico no acepta la actualización?**
Si es `mandatory: false`, puede cancelar. Pero se le volverá a preguntar en 30 minutos.

### **¿Cómo sé cuántos técnicos han actualizado?**
Por ahora, debes preguntarles. En el futuro se puede agregar un reporte en el admin panel.

### **¿Funciona sin internet?**
NO. Necesita internet para descargar la actualización. Pero una vez descargada, se instala offline.

### **¿Puedo probar la actualización antes de publicarla?**
Sí. Sube el APK a un Release como "Pre-release" en GitHub. Actualiza el backend solo en desarrollo.

### **¿Qué pasa si el APK está corrupto?**
Android no permitirá instalarlo. El técnico verá un error y seguirá con la versión anterior.

### **¿Cuánto espacio necesita en el teléfono?**
Aproximadamente el doble del tamaño del APK (uno para descargar, uno para instalar).

---

## 🔧 Configuración Avanzada

### **Cambiar el intervalo de verificación:**

En `/AQP-App/App.tsx`:

```typescript
// Cambiar de 30 minutos a otro valor
updateService.startAutoCheck(60); // 60 minutos
updateService.startAutoCheck(5);  // 5 minutos (para pruebas)
```

### **Desactivar verificación automática:**

Comenta esta línea en `/AQP-App/App.tsx`:
```typescript
// updateService.startAutoCheck(30);
```

Los técnicos solo podrán actualizar manualmente desde el botón en Perfil.

---

## 🧪 Modo de Prueba

Para probar actualizaciones rápidamente:

1. **Cambia el intervalo a 1 minuto:**
   ```typescript
   updateService.startAutoCheck(1);
   ```

2. **Genera un APK de prueba:**
   - Version: 1.0.0-test
   - Sube a GitHub como Pre-release

3. **Actualiza el backend en modo desarrollo**

4. **Espera 1 minuto en la app**

5. **Debería aparecer el diálogo de actualización**

---

## 🔧 Configuración

### **Cambiar el intervalo de verificación:**

En `/AQP-App/App.tsx`:

```typescript
// Cambiar de 30 minutos a otro valor
updateService.startAutoCheck(60); // 60 minutos
```

### **Forzar actualización obligatoria:**

En `/AQP-backend/src/routes/app-version.js`:

```javascript
const latestVersion = {
  version: '1.0.1',
  downloadUrl: '...',
  releaseNotes: '...',
  mandatory: true, // ← Cambiar a true
};
```

Cuando `mandatory: true`, el usuario NO puede cancelar la actualización.

---

## 📞 Soporte

Si tienes problemas, contacta al equipo de desarrollo.
