# 🚀 Sistema de Actualizaciones Automáticas - APP MÓVIL

Sistema automatizado para publicar nuevas versiones de la aplicación móvil.

---

## 📋 PROCESO COMPLETO (AUTOMATIZADO)

### 1️⃣ Incrementar Versión
```bash
npm run app:bump patch   # 1.0.3 → 1.0.4 (cambios pequeños)
npm run app:bump minor   # 1.0.3 → 1.1.0 (nuevas funcionalidades)
npm run app:bump major   # 1.0.3 → 2.0.0 (cambios importantes)
```

**Esto automáticamente:**
- ✅ Actualiza `app.json`
- ✅ Actualiza `services/updateService.ts`
- ✅ Hace commit y push
- ✅ Crea el tag de Git
- ✅ Sube el tag a GitHub

### 2️⃣ Generar el APK
```bash
npx eas-cli build --platform android --profile production
```
⏱️ Esperar 5-10 minutos hasta que termine

### 3️⃣ Crear Release en GitHub

1. Ir a: https://github.com/FabianJimenez29/AQP-App/releases/new
2. **Tag**: Seleccionar el tag que se creó (ejemplo: `v1.0.4`)
3. **Título**: `v1.0.4 - Descripción breve`
4. **Descripción**:
```markdown
## 🎉 Nueva versión

### Cambios
- ✅ [Lista de cambios]

### Mejoras
- [Mejoras realizadas]
```
5. **Subir el APK** descargado de EAS
6. **Nombre del archivo**: `aquapool-v1.0.4.apk`
7. Click en **"Publish release"**

### 4️⃣ Actualizar Backend Automáticamente
```bash
npm run app:update-backend
```

**Esto automáticamente:**
- ✅ Busca el release en GitHub
- ✅ Obtiene la URL del APK
- ✅ Actualiza `AQP-backend/src/routes/app-version.js`
- ✅ Hace commit y push del backend
- ✅ ¡Listo!

### 5️⃣ Reiniciar Servidor Backend
```bash
pm2 restart aqp-backend
```

---

## ⚡ RESUMEN SUPER RÁPIDO

```bash
# 1. Incrementar versión (patch/minor/major)
npm run app:bump patch

# 2. Generar APK
npx eas-cli build --platform android --profile production

# 3. Crear release en GitHub con el APK

# 4. Actualizar backend automáticamente
npm run app:update-backend

# 5. Reiniciar servidor
pm2 restart aqp-backend
```

---

## 🎯 EJEMPLOS DE USO

### Cambio pequeño (bug fix, corrección)
```bash
npm run app:bump patch
# 1.0.3 → 1.0.4
```

### Nueva funcionalidad
```bash
npm run app:bump minor
# 1.0.3 → 1.1.0
```

### Cambio mayor (rediseño, breaking changes)
```bash
npm run app:bump major
# 1.0.3 → 2.0.0
```

---

## ⚠️ IMPORTANTE

- Los scripts son **específicos para la APP MÓVIL**
- No interfieren con el sistema de versiones del backend
- El script `app:update-backend` busca el release en GitHub, así que asegúrate de:
  1. Crear el release primero
  2. Subir el APK al release
  3. Luego ejecutar el script

---

## 🔧 TROUBLESHOOTING

### El script app:update-backend falla
- ✅ Verifica que existe el release en GitHub
- ✅ Verifica que el APK está subido al release
- ✅ Verifica que tienes conexión a internet

### No encuentra el archivo del backend
- ✅ Verifica la estructura de carpetas:
```
AQP-Root/
  ├── AQP-App/          (aquí ejecutas los comandos)
  └── AQP-backend/      (aquí se actualiza automáticamente)
```

---

## 📝 NOTAS

- **app:bump**: Maneja versiones de la app móvil
- **app:update-backend**: Actualiza el backend con la info del release
- Ambos scripts son independientes del sistema de versiones del backend
- El backend mantiene su propio sistema de versiones (version.json)
