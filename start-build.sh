#!/bin/bash

echo "🚀 Iniciando build de AQP-App v1.0.4..."
echo ""
echo "📍 Directorio actual: $(pwd)"
echo "📦 Verificando app.json..."

if [ ! -f "app.json" ]; then
    echo "❌ Error: app.json no encontrado"
    exit 1
fi

echo "✅ app.json encontrado"
echo ""
echo "🔨 Iniciando build con EAS..."
echo "⏱️  Este proceso tomará entre 10-20 minutos"
echo ""

eas build --platform android --profile production
