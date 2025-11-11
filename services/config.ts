// ================================================================
// CONFIGURACIÓN DE API PARA SERVIDOR WINDOWS
// Archivo: services/config.ts
// ================================================================

export const API_CONFIG = {
  // 🔧 CONFIGURAR AQUÍ TU IP DE WINDOWS
  WINDOWS_SERVER_IP: 'TU_IP_WINDOWS_AQUI', // ⚠️ CAMBIAR por tu IP real
  PORT: 3000, // Puerto de tu servidor Windows
  
  // Configuración automática
  get WINDOWS_API_URL() {
    return `http://${this.WINDOWS_SERVER_IP}:${this.PORT}/api`;
  },
  
  // URLs para diferentes modos
  DEVELOPMENT_URL: 'http://localhost:3000/api',
  PRODUCTION_URL: 'http://localhost:3000/api',
};

// Lista de IPs para auto-detección
export const FALLBACK_IPS = [
  'TU_IP_WINDOWS_AQUI', // 🔧 Tu servidor Windows principal
  '192.168.1.100',      // IP común Windows
  '192.168.0.100',      // IP común Windows
  '192.168.1.1',        // Router
  '192.168.0.1',        // Router alternativo
  'localhost',          // Local
];

// ================================================================
// INSTRUCCIONES DE CONFIGURACIÓN:
// ================================================================

/* 
1. OBTENER TU IP DE WINDOWS:
   - Abre PowerShell en tu PC Windows
   - Ejecuta: ipconfig | findstr IPv4
   - Copia la IP que aparezca (ej: 192.168.1.100)

2. REEMPLAZAR EN ESTE ARCHIVO:
   - Cambia 'TU_IP_WINDOWS_AQUI' por tu IP real
   - Ejemplo: WINDOWS_SERVER_IP: '192.168.1.100'

3. VERIFICAR PUERTO:
   - Tu servidor Windows debe estar en puerto 3000
   - Si usas otro puerto, cámbialo en PORT: 3000

4. USAR NGROK (ACCESO EXTERNO):
   - Si usas ngrok: WINDOWS_SERVER_IP: 'abc123.ngrok.io'
   - Y cambiar PORT: 443 para HTTPS o 80 para HTTP
*/