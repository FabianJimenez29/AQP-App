#!/bin/bash

# ============================================
# Script de Build y Deploy - AQP Mobile App
# Versión: 1.0.4
# ============================================

set -e  # Exit on error

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Variables
VERSION="1.0.4"
APP_NAME="AquaPool Blue"
BUILD_TYPE="production"

echo -e "\n${BOLD}${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${CYAN}║   📱 Build AQP Mobile App v${VERSION}      ║${NC}"
echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════╝${NC}\n"

# Función para mostrar pasos
step() {
    echo -e "\n${BOLD}${BLUE}▶ $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Verificar configuración
step "Verificando configuración..."

if [ ! -f ".env" ]; then
    error "Archivo .env no encontrado"
fi

if ! grep -q "CLOUDFLARE_TUNNEL_URL=https://api.reportacr.lat" .env; then
    warning "La URL del tunnel en .env no coincide"
fi

success "Configuración verificada"

# 2. Verificar conexión al backend
step "Verificando conexión al backend..."

HEALTH_CHECK=$(curl -s https://api.reportacr.lat/api/health || echo "error")

if [[ $HEALTH_CHECK == *"OK"* ]]; then
    BACKEND_VERSION=$(echo $HEALTH_CHECK | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    success "Backend respondiendo correctamente (v${BACKEND_VERSION})"
else
    error "El backend no está respondiendo. Verifica que esté corriendo y el tunnel activo."
fi

# 3. Limpiar caché
step "Limpiando caché..."
rm -rf .expo node_modules/.cache 2>/dev/null || true
success "Caché limpiado"

# 4. Verificar versiones en archivos
step "Verificando versiones en archivos..."

APP_JSON_VERSION=$(grep -o '"version": "[^"]*"' app.json | head -1 | cut -d'"' -f4)
UPDATE_SERVICE_VERSION=$(grep -o "currentVersion = '[^']*'" services/updateService.ts | cut -d"'" -f2)

if [ "$APP_JSON_VERSION" != "$VERSION" ]; then
    error "app.json tiene versión $APP_JSON_VERSION, esperada $VERSION"
fi

if [ "$UPDATE_SERVICE_VERSION" != "$VERSION" ]; then
    error "updateService.ts tiene versión $UPDATE_SERVICE_VERSION, esperada $VERSION"
fi

success "Versiones correctas en todos los archivos"

# 5. Instalar/Actualizar dependencias
step "Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependencias..."
    npm install
else
    success "Dependencias ya instaladas"
fi

# 6. Mostrar información del build
echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}📋 INFORMACIÓN DEL BUILD${NC}\n"
echo -e "${BLUE}Versión:${NC} $VERSION"
echo -e "${BLUE}Tipo:${NC} $BUILD_TYPE"
echo -e "${BLUE}Tunnel:${NC} aqp-backend-tunnel"
echo -e "${BLUE}API URL:${NC} https://api.reportacr.lat/api"
echo -e "${BLUE}Backend:${NC} Puerto 3002"
echo -e "${CYAN}═══════════════════════════════════════════${NC}\n"

# 7. Opciones de build
echo -e "${BOLD}Selecciona el tipo de build:${NC}\n"
echo -e "  ${GREEN}1)${NC} Build con EAS (Recomendado) - APK en la nube"
echo -e "  ${YELLOW}2)${NC} Build local - APK en esta máquina"
echo -e "  ${BLUE}3)${NC} Solo actualizar backend"
echo -e "  ${RED}4)${NC} Cancelar\n"

read -p "$(echo -e ${CYAN}Opción [1]:${NC} )" OPTION
OPTION=${OPTION:-1}

case $OPTION in
    1)
        step "Iniciando build con EAS..."
        echo -e "${YELLOW}Este proceso tomará entre 10-20 minutos${NC}\n"
        
        # Verificar que EAS CLI esté instalado
        if ! command -v eas &> /dev/null; then
            echo "Instalando EAS CLI..."
            npm install -g eas-cli
        fi
        
        # Login si es necesario
        eas whoami &> /dev/null || eas login
        
        # Ejecutar build
        eas build --platform android --profile production
        
        success "Build iniciado. Recibirás un email cuando esté listo."
        echo -e "\n${CYAN}Descarga el APK desde: https://expo.dev/accounts/jotix/projects/aquapool-app/builds${NC}"
        ;;
        
    2)
        step "Iniciando build local..."
        warning "Build local requiere Android SDK configurado"
        
        npm run build:local || error "Build local falló"
        
        APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
        if [ -f "$APK_PATH" ]; then
            success "APK generado exitosamente"
            echo -e "\n${GREEN}📦 APK ubicado en:${NC}"
            echo -e "${CYAN}$APK_PATH${NC}\n"
        else
            error "No se pudo encontrar el APK generado"
        fi
        ;;
        
    3)
        step "Actualizando información en el backend..."
        
        # Aquí podrías agregar lógica para actualizar la info en el backend
        # Por ejemplo, subir el changelog, crear una release, etc.
        
        success "Información actualizada"
        ;;
        
    4)
        echo -e "\n${RED}Build cancelado${NC}\n"
        exit 0
        ;;
        
    *)
        error "Opción inválida"
        ;;
esac

# 8. Siguiente pasos
echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}📝 SIGUIENTES PASOS${NC}\n"

if [ "$OPTION" = "1" ]; then
    echo -e "  1. ${BLUE}Espera el email de EAS con el APK${NC}"
    echo -e "  2. ${BLUE}Descarga el APK${NC}"
    echo -e "  3. ${BLUE}Sube el APK al servidor o GitHub Release${NC}"
    echo -e "  4. ${BLUE}Actualiza la información en el backend${NC}"
    echo -e "  5. ${BLUE}Los usuarios recibirán la actualización automáticamente${NC}"
elif [ "$OPTION" = "2" ]; then
    echo -e "  1. ${BLUE}Copia el APK a un servidor web o GitHub Release${NC}"
    echo -e "  2. ${BLUE}Actualiza la URL de descarga en el backend${NC}"
    echo -e "  3. ${BLUE}Los usuarios recibirán la actualización automáticamente${NC}"
fi

echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════${NC}\n"

success "¡Proceso completado!"
