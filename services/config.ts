// ================================================================
// CONFIGURACIÓN DE API PARA SERVIDOR WINDOWS
// Archivo: services/config.ts
// ================================================================

export const API_CONFIG = {
   // IP dinámica: usa variable de entorno o localhost por defecto
   WINDOWS_SERVER_IP: process.env.SERVER_IP || 'localhost',
   PORT: process.env.SERVER_PORT || 3000,

   // Configuración automática
   get WINDOWS_API_URL() {
      return `http://${this.WINDOWS_SERVER_IP}:${this.PORT}/api`;
   },

   // URLs para diferentes modos
   DEVELOPMENT_URL: `http://${process.env.SERVER_IP || 'localhost'}:${process.env.SERVER_PORT || 3000}/api`,
   PRODUCTION_URL: `http://${process.env.SERVER_IP || 'localhost'}:${process.env.SERVER_PORT || 3000}/api`,
};

// Lista de IPs para auto-detección
export const FALLBACK_IPS = [
   'localhost', // Local
];

