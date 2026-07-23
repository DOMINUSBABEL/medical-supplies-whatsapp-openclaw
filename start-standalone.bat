@echo off
title OpenClaw WhatsApp Agent - Medical Supplies
color 0A
echo ========================================================================
echo   🚀 INICIANDO AGENTE CONVERSACIONAL DE WHATSAPP AUTÓNOMO
echo ========================================================================
echo.
cd /d "%~dp0"

if not exist node_modules (
    echo [INFO] Detectada primera ejecución. Instalando dependencias de Node.js...
    call npm install
    echo.
)

echo [INFO] Abriendo Dashboard de Onboarding del Agente...
call npm start
pause
