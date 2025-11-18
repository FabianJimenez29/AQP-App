# 🚀 Versión 1.0.4 - Actualización del Tunnel

**Fecha:** 17 de noviembre, 2025

## 🆕 Cambios Principales

### 🔧 Infraestructura
- **Nuevo Cloudflare Tunnel:** Migración a `aqp-backend-tunnel`
- **Puerto actualizado:** Backend ahora corre en puerto 3002 (antes 3001)
- **URL del API:** Mantiene `https://api.reportacr.lat/api`

### ⚡ Optimizaciones de Rendimiento
- Eliminados console.logs innecesarios que afectaban el rendimiento
- Limpieza de código duplicado y comentarios excesivos
- Optimización de llamadas al API

### 🧹 Limpieza de Código
- Eliminadas carpetas y archivos obsoletos:
  - `DISABLED_app-old-routes/`
  - `app-old-routes/`
  - `TestApp.tsx`
  - Archivos de configuración duplicados
- Código más limpio y mantenible

### 🛒 Funcionalidades Preservadas
- ✅ Sistema de productos completamente funcional
- ✅ Carrito de compras operativo
- ✅ Todas las pantallas principales trabajando correctamente

### 🔌 Conectividad
- Conexión optimizada al nuevo tunnel
- Mejor manejo de errores de red
- Logs de debug condicionados (solo cuando DEBUG_API=true)

## 📦 Archivos Principales Actualizados

### Backend
- `ecosystem.config.js` - Puerto 3002
- `src/app.js` - Configuración del servidor
- `.env.example` - Documentación actualizada

### Mobile App
- `.env` - Configuración del tunnel
- `services/api.ts` - Optimizaciones de rendimiento
- `services/updateService.ts` - Versión 1.0.4
- `app.json` - Versión 1.0.4
- `screens/ProductsScreen.tsx` - Nueva ubicación
- `screens/CartScreen.tsx` - Nueva ubicación

### Admin Dashboard
- `.env` - Configuración del tunnel
- `test-connection.html` - Nueva herramienta de prueba

## 🧪 Testing
- ✅ Health check funcionando
- ✅ Conexión al tunnel verificada
- ✅ Todas las funcionalidades principales probadas

## 📝 Notas de Actualización

### Para Usuarios:
- La actualización se instalará automáticamente
- No requiere acción del usuario
- Todas las funcionalidades permanecen iguales

### Para Desarrolladores:
- Verificar que el backend esté en puerto 3002
- Asegurar que el tunnel `aqp-backend-tunnel` esté activo
- Revisar logs si hay problemas de conectividad

## 🔗 URLs Importantes
- **API:** https://api.reportacr.lat/api
- **Health Check:** https://api.reportacr.lat/api/health
- **Version Info:** https://api.reportacr.lat/api/version

## ⚠️ Requisitos
- Backend debe estar corriendo en puerto 3002
- Cloudflare tunnel `aqp-backend-tunnel` debe estar activo
- Conexión a internet estable

---

**Instalación:** Automática al abrir la app
**Tamaño:** ~50MB
**Tiempo estimado:** 2-3 minutos
