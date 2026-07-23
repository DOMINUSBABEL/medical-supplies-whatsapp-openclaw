#!/bin/bash
echo "========================================================================"
echo "  🔄 ACTUALIZANDO AGENTE WHATSAPP OPENCLAW A LA ÚLTIMA VERSIÓN"
echo "========================================================================"
echo ""
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "[1/3] Descargando últimos cambios desde el repositorio GitHub..."
git pull origin master
echo ""

echo "[2/3] Verificando e instalando dependencias..."
npm install
echo ""

echo "[3/3] Iniciando el Agente Conversacional en la versión más reciente..."
npm start
