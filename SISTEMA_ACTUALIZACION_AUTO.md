# 🚀 Sistema de Actualización Automatizada

## Uso Rápido

```bash
# Para cambios pequeños (bug fixes)
npm run updateApp:bump:patch

# Para nuevas funcionalidades
npm run updateApp:bump:minor

# Para cambios importantes
npm run updateApp:bump:major
```

## ¿Qué hace automáticamente?

### 1. Preparación (Automático)
- ✅ Hace commit de cambios pendientes
- ✅ Incrementa la versión en `app.json` y `updateService.ts`
- ✅ Actualiza el backend local con la nueva versión

### 2. Build (Automático)
- ✅ Inicia el build del APK con EAS
- ⏳ Espera a que termine el build (5-10 minutos)

### 3. Release (Manual - 1 minuto)
**El script pausará aquí y te pedirá:**

1. Ir a: https://github.com/FabianJimenez29/AQP-App/releases/new
2. Seleccionar el tag que se creó automáticamente (ej: `v1.0.9`)
3. Subir el APK descargado de EAS
4. Nombrar el archivo: `aquapool-v1.0.9.apk`
5. Publicar el release
6. Copiar la URL del release y pegarla en la consola

### 4. Deploy (Automático)
- ✅ Actualiza el backend con la URL del APK
- ✅ Crea el tag de git
- ✅ Hace push de todo (código + tags)
- ✅ Conecta al servidor remoto
- ✅ Ejecuta `git pull` en el servidor
- ✅ Reinicia PM2 automáticamente
- ✅ Los usuarios reciben notificación de actualización

## Ejemplo Completo

```bash
# 1. Ejecutar el comando
npm run updateApp:bump:patch

# 2. El script te preguntará:
# "Mensaje del commit (Enter para usar default):"
# → Puedes presionar Enter o escribir un mensaje

# 3. Esperar el build de EAS (5-10 min)
# El script mostrará el progreso en tiempo real

# 4. Cuando termine, el script pausará:
# "Pega la URL del release aquí:"
# → Ve a GitHub, crea el release, pega la URL

# 5. ¡Listo! El resto es automático
```

## Beneficios

- 🚀 **Un solo comando** para todo el proceso
- ⏱️ **Ahorra tiempo**: ~15 minutos → ~2 minutos (de trabajo activo)
- 🎯 **Sin errores**: Todo automatizado, no olvidas ningún paso
- 🌐 **Deploy remoto**: No necesitas SSH al servidor
- 📱 **Notificación instantánea**: Los usuarios reciben la actualización al momento

## Troubleshooting

### "Error en el build"
- Verifica que tienes EAS CLI configurado
- Asegúrate de tener conexión a internet
- Revisa los logs de EAS Build

### "Error en deploy remoto"
- Verifica que el servidor esté activo
- Confirma que tienes las credenciales correctas en el script
- Puedes hacer deploy manual: `npm run remote` → opción 5

### "No puedo crear el release"
- Asegúrate de estar logueado en GitHub
- Verifica que el tag se creó correctamente
- Puedes crear el release manualmente y pegar la URL

## Archivos Involucrados

- `scripts/app-auto-update.js` - Script principal
- `app.json` - Versión de la app
- `services/updateService.ts` - Versión en el servicio
- `AQP-backend/src/routes/app-version.js` - Versión en el backend

## Comandos Relacionados

```bash
# Sistema antiguo (manual)
npm run app:bump patch              # Solo incrementa versión
npm run app:update-backend          # Solo actualiza backend

# Sistema nuevo (automatizado)
npm run updateApp:bump:patch        # Todo el flujo completo
npm run updateApp:bump:minor        # Todo el flujo completo
npm run updateApp:bump:major        # Todo el flujo completo

# Control remoto del servidor
npm run remote                      # Panel de control interactivo
```

## Notas

- El script pausará en el paso del release para que subas el APK
- No necesitas hacer nada más después de pegar la URL del release
- El deploy remoto usa el sistema de comandos remotos del backend
- Si algo falla, el script te dirá exactamente qué hacer manualmente
