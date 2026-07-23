# 🤖 Agente Conversacional de WhatsApp Autónomo (OpenClaw)
> **Medical Supplies Corp (mscorp.com.co) · Asistente Virtual de Talento Humano**
> *Sistema independiente ejecutable en cualquier terminal o computador remoto*

[![NodeJS](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org)
[![Baileys Protocol](https://img.shields.io/badge/Protocol-Baileys%20WebSocket-blue.svg)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-ISC-purple.svg)](#)

---

## 📌 Visión General

Este repositorio contiene la **implementación autónoma e independiente** del agente conversacional de Talento Humano para **Medical Supplies Corp** ([mscorp.com.co](https://mscorp.com.co/)). Permite desplegar un asistente inteligente que responde automáticamente mensajes de WhatsApp en tiempo real desde cualquier terminal en cualquier computadora (Windows, Linux o macOS), **sin depender de entornos IDE ni herramientas externas**.

---

## 🚀 Despliegue en un Nuevo Computador (Paso a Paso)

### 1. Clonar el Repositorio
Abre tu consola/terminal en la nueva computadora y ejecuta:
```bash
git clone https://github.com/DOMINUSBABEL/medical-supplies-whatsapp-openclaw.git
cd medical-supplies-whatsapp-openclaw
```

### 2. Ejecutar de forma 1-Click (Autónoma)

- **En Windows**:
  Simplemente haz doble clic en `start-standalone.bat` o ejecuta en PowerShell:
  ```powershell
  .\start-standalone.bat
  ```

- **En Linux / macOS**:
  Otorga permisos y ejecuta:
  ```bash
  chmod +x start-standalone.sh
  ./start-standalone.sh
  ```

---

## 🔄 Cómo Actualizar a la Última Versión en Dispositivos Existentes

Si ya tienes el proyecto instalado en otra computadora y deseas **actualizarlo a la versión más reciente** publicada en GitHub:

### Opción 1-Click Automática:

- **En Windows**:
  Haz doble clic en `update-latest.bat` o ejecuta en PowerShell:
  ```powershell
  .\update-latest.bat
  ```

- **En Linux / macOS**:
  ```bash
  chmod +x update-latest.sh
  ./update-latest.sh
  ```

### Opción Manual mediante Comandos:
Abre la terminal en la carpeta del proyecto en el dispositivo remoto y ejecuta:
```bash
git pull origin master
npm install
npm start
```

---

## 🖥️ Menú de Onboarding Interactivo

Al arrancar el sistema en el equipo remoto, se abrirá de forma automática el **Dashboard de Onboarding**:

```text
========================================================================
  🤖 OPENCLAW WHATSAPP AGENT - MEDICAL SUPPLIES TALENTO HUMANO
========================================================================
  [Empresa]: Medical Supplies Corp (mscorp.com.co)
  [Agente]:  Asistente Virtual de Talento Humano · MS Corp
  [Modo]:    ALL (Responde a todos los chats de WhatsApp)
========================================================================

📋 MENÚ DE ONBOARDING & CONFIGURACIÓN DEL AGENTE:

  [1] 🚀 INICIAR SERVIDOR DEL AGENTE WHATSAPP EN VIVO
  [2] ⚙️  Configurar Modo de Respuesta (Todos vs. Whitelist)
  [3] 📱 Gestionar Lista Blanca (Whitelist de Números Autorizados)
  [4] 🏢 Personalizar Empresa y Nombre del Asistente
  [5] 🔄 Resetear Vinculación de WhatsApp (Forzar nuevo Código QR)
  [6] 🖥️  Ejecutar Simulador Interactivo de Consola
  [7] 📊 Ver Detalle de Configuración Actual
  [0] ❌ Salir
```

1. Selecciona la opción **`1`** para iniciar el servidor de WhatsApp.
2. Si es la primera vez que se ejecuta en esa computadora, la consola proyectará un **Código QR**.
3. Abre WhatsApp en el celular -> **Dispositivos Vinculados** -> **Vincular un dispositivo** y escanea el QR.
4. El agente estará listo operando de forma autónoma.

---

## 📂 Estructura Interna del Proyecto

```text
medical-supplies-whatsapp-openclaw/
├── src/
│   ├── openclaw-whatsapp-bot.js  # Servidor principal Baileys & socket listener
│   ├── onboarding-wizard.js      # Dashboard interactivo CLI onboarding
│   ├── state-machine.js          # Lógica conversacional, menúes y tarjetas ASCII
│   ├── session-manager.js        # Aislamiento de sesiones en disco
│   ├── config-manager.js         # Gestor de configuración persistente
│   └── simulator-cli.js          # Simulador de terminal sin celular
├── start-standalone.bat          # Lanzador automático 1-Click para Windows
├── start-standalone.sh           # Lanzador automático 1-Click para Linux/macOS
├── update-latest.bat             # Actualizador automático 1-Click para Windows
├── update-latest.sh              # Actualizador automático 1-Click para Linux/macOS
├── .gitignore                    # Exclusión de llaves privadas y node_modules
├── package.json
└── README.md
```
