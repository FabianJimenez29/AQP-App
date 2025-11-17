export const API_CONFIG = {
   WINDOWS_SERVER_IP: process.env.SERVER_IP || 'localhost',
   PORT: process.env.SERVER_PORT || 3000,

   get WINDOWS_API_URL() {
      return `http://${this.WINDOWS_SERVER_IP}:${this.PORT}/api`;
   },

   DEVELOPMENT_URL: `http://${process.env.SERVER_IP || 'localhost'}:${process.env.SERVER_PORT || 3000}/api`,
   PRODUCTION_URL: `http://${process.env.SERVER_IP || 'localhost'}:${process.env.SERVER_PORT || 3000}/api`,
};

export const FALLBACK_IPS = [
   'localhost',
];


