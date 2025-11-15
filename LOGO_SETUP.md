# 🎨 Configuración de Logo y Nombre de la App

## 📝 Nombre de la Aplicación

### En `app.json`:
```json
{
  "expo": {
    "name": "AquaPool",  // ← Este es el nombre que aparece debajo del ícono
    "slug": "aquapool-app"  // ← URL amigable para Expo
  }
}
```

---

## 🖼️ Imágenes Requeridas

### **1. Ícono Principal de la App**
📍 **Ubicación**: `assets/images/icon.png`
📐 **Dimensiones**: **1024x1024 px** (cuadrado)
📋 **Formato**: PNG con fondo
🎯 **Uso**: Ícono que se ve en la pantalla de inicio del teléfono/tablet

**Recomendaciones**:
- Fondo sólido o con diseño
- Logo centrado
- Sin bordes transparentes (se agregan automáticamente)

---

### **2. Íconos Android Adaptive**

#### a) **Foreground (Logo)**
📍 **Ubicación**: `assets/images/android-icon-foreground.png`
📐 **Dimensiones**: **1024x1024 px**
📋 **Formato**: PNG **CON TRANSPARENCIA**
🎯 **Uso**: El logo que va encima del fondo

**Recomendaciones**:
- Solo el logo, sin fondo
- Centrado
- Dejar margen de ~30% alrededor (zona segura)

#### b) **Background (Fondo)**
📍 **Ubicación**: `assets/images/android-icon-background.png`
📐 **Dimensiones**: **1024x1024 px**
📋 **Formato**: PNG
🎯 **Uso**: Color o diseño de fondo del ícono

**Recomendaciones**:
- Color sólido o patrón simple
- Ejemplo: `#0284c7` (azul de tu app)
- Sin logo ni texto

#### c) **Monochrome (Opcional)**
📍 **Ubicación**: `assets/images/android-icon-monochrome.png`
📐 **Dimensiones**: **1024x1024 px**
📋 **Formato**: PNG en blanco y negro
🎯 **Uso**: Para íconos temáticos de Android 13+

---

### **3. Splash Screen (Pantalla de Carga)**
📍 **Ubicación**: `assets/images/splash-icon.png`
📐 **Dimensiones**: Recomendado **1200x1200 px** o mayor
📋 **Formato**: PNG con transparencia
🎯 **Uso**: Logo que aparece al abrir la app

**Configuración en `app.json`**:
```json
{
  "plugins": [
    [
      "expo-splash-screen",
      {
        "image": "./assets/images/splash-icon.png",
        "imageWidth": 200,  // ← Tamaño del logo en pantalla
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"  // ← Color de fondo
      }
    ]
  ]
}
```

---

### **4. Favicon (Para Web - Opcional)**
📍 **Ubicación**: `assets/images/favicon.png`
📐 **Dimensiones**: **48x48 px** o **96x96 px**
📋 **Formato**: PNG
🎯 **Uso**: Ícono en el navegador (si usas versión web)

---

## 🎨 Crear Imágenes desde tu Logo Actual

### **Opción 1: Usar tus logos existentes**

Ya tienes estos archivos:
- `AQPL.png` → Usa como base
- `AQPLogoBlack.png` → Para monochrome

### **Opción 2: Herramienta automática**

1. Ve a: **https://www.appicon.co/** (gratis)
2. Sube tu logo de **1024x1024 px**
3. Descarga el paquete para Android/iOS
4. Reemplaza los archivos en `assets/images/`

### **Opción 3: Generador de Expo (Recomendado)**

```bash
# Instalar herramienta
npm install -g sharp-cli

# Desde tu logo base (1024x1024)
npx expo-icon --icon-color "#0284c7"
```

---

## 🔄 Después de Cambiar las Imágenes

### 1. Limpiar caché
```bash
npm run clear
```

### 2. Verificar en desarrollo
```bash
npm start
```

### 3. Regenerar build
```bash
npm run build:preview
```

---

## 📱 Ejemplo de Configuración Completa

### `app.json`:
```json
{
  "expo": {
    "name": "AquaPool",
    "slug": "aquapool-app",
    "version": "1.0.0",
    "icon": "./assets/images/icon.png",
    
    "android": {
      "package": "com.aquapool.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png",
        "backgroundColor": "#0284c7",
        "monochromeImage": "./assets/images/android-icon-monochrome.png"
      }
    },
    
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

---

## ✅ Checklist

- [ ] `icon.png` - 1024x1024 con fondo
- [ ] `android-icon-foreground.png` - 1024x1024 transparente (solo logo)
- [ ] `android-icon-background.png` - 1024x1024 color sólido
- [ ] `android-icon-monochrome.png` - 1024x1024 blanco/negro
- [ ] `splash-icon.png` - 1200x1200+ transparente
- [ ] Nombre actualizado en `app.json`
- [ ] Caché limpiado con `npm run clear`
- [ ] Build generado con nuevo logo

---

## 🎯 Recomendaciones de Diseño

### Para el Logo Principal:
- ✅ Simple y reconocible
- ✅ Funciona en tamaños pequeños (48x48)
- ✅ Colores de tu marca
- ✅ Sin texto muy pequeño
- ❌ Evita detalles finos
- ❌ Evita texto muy largo

### Colores Sugeridos (de tu app):
- **Primario**: `#0284c7` (Azul)
- **Secundario**: `#0891b2` (Cyan)
- **Fondo claro**: `#ffffff`
- **Fondo oscuro**: `#1f2937`

---

## 📦 Archivos Actuales Detectados

```
assets/images/
├── AQPL.png ✅ (Usar como base)
├── AQPLogoBlack.png ✅ (Para monochrome)
├── icon.png ← Reemplazar con logo final
├── android-icon-foreground.png ← Logo transparente
├── android-icon-background.png ← Color de fondo
├── android-icon-monochrome.png ← Logo B/N
└── splash-icon.png ← Logo para splash
```

---

## 🚀 Próximo Paso

Una vez que tengas tus imágenes listas:
1. Reemplázalas en `assets/images/`
2. Ejecuta: `npm run clear`
3. Genera el APK: `npm run build:preview`
