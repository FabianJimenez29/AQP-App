# 🔄 Flujo Visual de Actualizaciones

## 📱 Primera Instalación (Solo 1 vez)

```
┌─────────────┐
│  DESARROLLO │
└──────┬──────┘
       │
       │ 1. Genera APK inicial (v1.0.0)
       ↓
┌─────────────┐
│   GITHUB    │ (Opcional: Release v1.0.0)
└──────┬──────┘
       │
       │ 2. Descarga APK
       ↓
┌─────────────┐
│  TÉCNICO    │ Instala APK manualmente
└─────────────┘

✅ Listo! Nunca más necesita reinstalar manualmente
```

---

## 🚀 Actualización Normal (Todas las siguientes)

```
┌─────────────┐
│  DESARROLLO │
└──────┬──────┘
       │
       │ 1. Haces cambios en el código
       │ 2. Subes a GitHub
       ↓
┌─────────────┐
│   GITHUB    │
└──────┬──────┘
       │
       │ 3. Incrementas versión (1.0.1)
       │ 4. Generas nuevo APK
       │ 5. Creas Release con el APK
       ↓
┌─────────────┐
│   BACKEND   │
└──────┬──────┘
       │
       │ 6. Actualizas app-version.js
       │    - version: "1.0.1"
       │    - downloadUrl: "github.com/.../aquapool.apk"
       │ 7. Push y restart backend
       ↓
┌─────────────┐
│ TÉCNICO APP │
└──────┬──────┘
       │
       │ 8a. Automático (cada 30 min)
       │     La app detecta nueva versión
       │
       │ 8b. Manual
       │     Usuario: Perfil → "Buscar Actualizaciones"
       ↓
┌─────────────────────────────────┐
│  Cuadro de Diálogo:             │
│                                  │
│  📱 Nueva versión 1.0.1          │
│                                  │
│  Notas del release...            │
│                                  │
│  [Cancelar]    [Actualizar]     │
└─────────────┬───────────────────┘
              │
              │ Usuario presiona "Actualizar"
              ↓
┌─────────────────────────────────┐
│  1. Descarga APK de GitHub      │
│  2. Instala sobre versión actual│
│  3. Mantiene todos los datos    │
│  4. App se reinicia actualizada │
└─────────────────────────────────┘

✅ Técnico tiene la nueva versión
   Sin desinstalar, sin perder datos
```

---

## 🎯 Comparación: Antes vs Ahora

### **❌ ANTES (Sin sistema de actualizaciones):**

```
Para cada actualización:

1. Generas APK
2. Envías APK a cada técnico
3. Técnico desinstala app vieja
4. Técnico instala app nueva
5. Técnico pierde sesión
6. Técnico debe volver a loguearse
7. Configuraciones se pierden

❌ Requiere: Coordinación, tiempo, comunicación
❌ Riesgo: Errores, técnicos con versiones viejas
```

### **✅ AHORA (Con sistema de actualizaciones):**

```
Para cada actualización:

1. Generas APK
2. Subes a GitHub Release
3. Actualizas backend
4. Técnicos reciben notificación automática
5. Aceptan actualización
6. App se actualiza sola
7. Todo se mantiene (sesión, datos, config)

✅ Requiere: Solo 3 pasos de tu parte
✅ Técnicos: Solo aceptar la actualización
✅ Automático, sin coordinación
```

---

## 🔄 Estados de Versión

### **Estado 1: App Actualizada**

```
Técnico tiene v1.0.1
Backend tiene v1.0.1

→ No pasa nada
→ App funciona normalmente
```

### **Estado 2: Actualización Disponible (Opcional)**

```
Técnico tiene v1.0.1
Backend tiene v1.0.2 (mandatory: false)

→ Cada 30 min aparece diálogo
→ Técnico puede cancelar
→ App sigue funcionando normal
→ Se pregunta de nuevo en 30 min
```

### **Estado 3: Actualización Obligatoria**

```
Técnico tiene v1.0.1
Backend tiene v1.0.2 (mandatory: true)

→ Aparece diálogo sin botón "Cancelar"
→ Técnico DEBE actualizar
→ App no funciona hasta actualizar
```

---

## 📊 Línea de Tiempo de una Actualización

```
Hora 00:00
└─ Desarrollador: Genera APK v1.0.2
   └─ Sube a GitHub Release

Hora 00:10
└─ Desarrollador: Actualiza backend
   └─ pm2 restart aqp-backend

Hora 00:15
└─ Técnico 1: Abre la app
   └─ Presiona "Buscar Actualizaciones"
   └─ Ve el diálogo
   └─ Acepta
   └─ Se actualiza a v1.0.2 ✅

Hora 00:30
└─ Técnico 2: Está usando la app
   └─ Pasan 30 minutos desde última verificación
   └─ Aparece diálogo automático
   └─ Acepta
   └─ Se actualiza a v1.0.2 ✅

Hora 02:00
└─ Técnico 3: Abre la app por primera vez del día
   └─ Verifica al iniciar
   └─ Aparece diálogo
   └─ Acepta
   └─ Se actualiza a v1.0.2 ✅

Hora 12:00
└─ Todos los técnicos activos tienen v1.0.2 ✅
```

---

## 🎮 Casos de Uso

### **Caso 1: Corrección Urgente de Bug**

```
1. Detectas bug crítico
2. Corriges el código
3. Generas APK v1.0.3
4. Subes a GitHub
5. Actualizas backend con mandatory: true
6. En los próximos 30 minutos, TODOS los técnicos
   reciben actualización obligatoria
7. Bug corregido en todos los dispositivos
```

### **Caso 2: Nueva Funcionalidad (No Urgente)**

```
1. Agregas nueva feature
2. Generas APK v1.0.4
3. Subes a GitHub
4. Actualizas backend con mandatory: false
5. Técnicos actualizan cuando quieran
6. En 2-3 días, la mayoría tendrá la nueva versión
```

### **Caso 3: Actualización de Backend Requiere Nueva App**

```
1. Cambias API del backend
2. Actualizas código mobile para nueva API
3. Generas APK v1.1.0
4. Subes a GitHub
5. Actualizas backend con mandatory: true
6. ⚠️ No despliegues el backend hasta que veas
   que la mayoría tiene v1.1.0
7. Una vez actualizados, despliegas backend
```

---

## 🔍 Verificación de Actualización

### **Desde el Admin Panel (Futuro):**

```
┌──────────────────────────────────────┐
│  Versiones de App en Uso:           │
│                                      │
│  v1.0.2: 15 dispositivos (75%)      │
│  v1.0.1:  4 dispositivos (20%)      │
│  v1.0.0:  1 dispositivo  (5%)       │
│                                      │
│  Última versión: v1.0.2             │
└──────────────────────────────────────┘
```

*(Esto no está implementado aún, pero se puede agregar)*

---

## 🛠️ Solución de Problemas

### **Técnico no recibe actualización:**

```
1. ¿Tiene internet? → Necesita conexión
2. ¿Cuánto tiempo ha pasado? → Esperar 30 min
3. Probar manualmente → Perfil → Buscar Actualizaciones
4. Ver logs en el backend → ¿Se registró la petición?
5. Verificar GitHub Release → ¿APK está público?
```

### **Error al descargar:**

```
1. Verificar URL en app-version.js
2. Verificar que el Release sea público
3. Verificar espacio en el teléfono
4. Verificar conexión a internet
5. Intentar de nuevo
```

### **Error al instalar:**

```
1. Verificar permisos:
   Settings → Apps → AquaPool → Permisos
   → "Instalar apps desconocidas"

2. Verificar que el APK esté firmado correctamente

3. Verificar que no hay una versión superior instalada
```

---

## 🎯 Mejores Prácticas

### **✅ HACER:**
- Usar versionado semántico: 1.0.0 → 1.0.1 (patch), 1.1.0 (minor), 2.0.0 (major)
- Probar el APK antes de subirlo a GitHub
- Escribir release notes claros y descriptivos
- Usar `mandatory: false` para cambios menores
- Usar `mandatory: true` solo para correcciones críticas
- Esperar a que la mayoría actualice antes de cambios en el backend

### **❌ NO HACER:**
- No subir APKs sin probar
- No usar `mandatory: true` para features nuevas
- No cambiar el backend si depende de nueva versión de app
- No olvidar incrementar la versión
- No usar versiones duplicadas
- No eliminar Releases viejos de GitHub (histórico)

---

## 📈 Roadmap Futuro

- [ ] Dashboard en admin panel con versiones activas
- [ ] Notificaciones push cuando hay actualización
- [ ] Actualización silenciosa en segundo plano
- [ ] Rollback automático si falla
- [ ] A/B testing de versiones
- [ ] Analytics de adopción de versiones
- [ ] Pre-descarga de actualizaciones
- [ ] Delta updates (solo descargar cambios)
