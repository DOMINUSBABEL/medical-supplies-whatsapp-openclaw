@echo off
title Actualizar Agente WhatsApp OpenClaw - Medical Supplies
color 0B
echo ========================================================================
echo   🔄 ACTUALIZANDO AGENTE WHATSAPP OPENCLAW A LA ÚLTIMA VERSIÓN
echo ========================================================================
echo.
cd /d "%~dp0"

echo [1/3] Descargando últimos cambios desde el repositorio GitHub...
call git pull origin master
echo.

echo [2/3] Verificando e instalando nuevas dependencias...
call npm install
echo.

echo [3/3] Iniciando el Agente Conversacional en la versión más reciente...
echo.
call npm start
pause
