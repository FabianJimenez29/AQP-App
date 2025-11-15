# 📱 Guía para Generar APK de AQP-App

Esta guía te ayudará a crear un archivo APK para instalar la aplicación en tablets Android.

## 🚀 Opción 1: Build con EAS (Recomendado)

### Prerrequisitos
- Cuenta de Expo (gratis): https://expo.dev/signup
- Node.js instalado
- Proyecto configurado

### Paso 1: Login en Expo
```bash
npx eas-cli login
```
Ingresa tu usuario y contraseña de Expo.

### Paso 2: Configurar el proyecto (solo la primera vez)
```bash
npx eas build:configure
```

### Paso 3: Generar el APK
```bash
# Para testing (más rápido):
npx eas build --platform android --profile preview

# Para producción (optimizado):
npx eas build --platform android --profile production
```

### Paso 4: Descargar el APK
1. El build se ejecuta en la nube de Expo
2. Recibirás un link por email y en la terminal
3. Descarga el APK desde: https://expo.dev/accounts/[tu-usuario]/projects/AQP-App/builds
4. Transfiere el APK a tu tablet

### Paso 5: Instalar en la Tablet
1. Habilita "Orígenes desconocidos" en la tablet:
   - Configuración → Seguridad → Orígenes desconocidos
2. Transfiere el APK (USB, email, o descarga directa)
3. Abre el archivo APK en la tablet
4. Toca "Instalar"

---

## 🛠️ Opción 2: Build Local (Más complejo)

### Prerrequisitos
- Android Studio instalado
- JDK 17 o superior
- Android SDK configurado

### Paso 1: Instalar dependencias
```bash
npm install
```

### Paso 2: Pre-build (genera carpeta android/)
```bash
npx expo prebuild --platform android
```

### Paso 3: Generar APK
```bash
cd android
./gradlew assembleRelease
```

El APK estará en:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 📝 Notas Importantes

### ✅ La App NO necesita servidor local
- La aplicación se conecta directamente a: `https://api.reportacr.lat`
- Configurado en el archivo `.env`
- Solo necesitas conexión a internet en la tablet

### 🔐 Configuración de API
La URL del backend está en `.env`:
```env
CLOUDFLARE_TUNNEL_URL=https://api.reportacr.lat
API_BASE_PATH=/api
USE_CLOUDFLARE_TUNNEL=true
```

### 📦 Tamaño del APK
- Preview: ~50-70 MB
- Production: ~30-50 MB (optimizado)

### 🔄 Actualizaciones
Para actualizar la app:
1. Incrementa la versión en `app.json`
2. Genera un nuevo APK
3. Instala sobre la versión anterior (mantiene datos)

---

## 🐛 Solución de Problemas

### Error: "App not installed"
- Desinstala la versión anterior completamente
- Reinicia la tablet
- Intenta de nuevo

### Error: "Parse error"
- El APK está corrupto
- Vuelve a descargar
- Verifica que sea compatible con tu versión de Android

### App se cierra inmediatamente
- Verifica que tengas conexión a internet
- Revisa que la URL del backend esté correcta
- Comprueba los permisos de la app en Configuración

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `npx eas build:list`
2. Verifica la configuración en `app.json`
3. Consulta la documentación de EAS: https://docs.expo.dev/build/introduction/
