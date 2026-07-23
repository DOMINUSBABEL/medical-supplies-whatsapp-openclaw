#!/bin/bash
echo "========================================================================"
echo "  🚀 INICIANDO AGENTE CONVERSACIONAL DE WHATSAPP AUTÓNOMO (OPENCLAW)"
echo "========================================================================"
echo ""
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if [ ! -d "node_modules" ]; then
    echo "[INFO] Detectada primera ejecución. Instalando dependencias..."
    npm install
    echo ""
fi

echo "[INFO] Abriendo Dashboard de Onboarding..."
npm start
