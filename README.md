# 🤖 Agente Conversacional de WhatsApp Autónomo (OpenClaw)
> **Medical Supplies · Asistente Virtual de Talento Humano**
> *Sistema independiente ejecutable en cualquier terminal o computador remoto*

[![NodeJS](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org)
[![Baileys Protocol](https://img.shields.io/badge/Protocol-Baileys%20WebSocket-blue.svg)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-ISC-purple.svg)](#)

---

## 📌 Visión General

Este repositorio contiene la **implementación autónoma e independiente** del agente conversacional de Talento Humano para **Medical Supplies**. Permite desplegar un asistente inteligente que responde automáticamente mensajes de WhatsApp en tiempo real desde cualquier terminal en cualquier computadora (Windows, Linux o macOS), **sin depender de entornos IDE ni herramientas externas**.

---

## 🛠️ Requisitos Previos en cualquier PC

1. **Node.js** v18.0.0 o superior ([Descargar Node.js](https://nodejs.org)).
2. **Git** ([Descargar Git](https://git-scm.com)).
3. Un teléfono móvil con WhatsApp activo para escanear el Código QR inicial.

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

- **Ejecución estándar manual con Node.js**:
  ```bash
  npm install
  npm start
  ```

---

## 🖥️ Menú de Onboarding Interactivo

Al arrancar el sistema en el nuevo equipo, se abrirá de forma automática el **Dashboard de Onboarding**:

```text
========================================================================
  🤖 OPENCLAW WHATSAPP AGENT - MEDICAL SUPPLIES TALENTO HUMANO
========================================================================
  [Empresa]: Medical Supplies
  [Agente]:  Asistente Virtual de Talento Humano
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

## 💡 Cédulas de Prueba Institucionales

| Cédula Demo | Nombre | Cargo | Días Vacaciones |
| :--- | :--- | :--- | :--- |
| **`1010101010`** | Carlos Andrés Pérez | Analista de Quirófano | 14 Días |
| **`2020202020`** | María Fernanda Gómez | Coordinadora Logística Médica | 8 Días |
| **`3030303030`** | Juan Esteban Restrepo | Especialista Equipos Quirúrgicos | 22 Días |
| **`5050505050`** | Roberto Silva | Excolaborador | Trámites Ex-empleados |
| **`7070707070`** | Laura Botero | Candidata Selección | Seguimiento Vacante |

---

## 📂 Estructura Interna del Proyecto

```text
medical-supplies-whatsapp-openclaw/
├── src/
│   ├── openclaw-whatsapp-bot.js  # Servidor principal Baileys & socket listener
│   ├── onboarding-wizard.js      # Dashboard interactivo CLI onboarding
│   ├── state-machine.js          # Lógica conversacional, menúes y tarjetas
│   ├── session-manager.js        # Aislamiento de sesiones persistentes
│   ├── config-manager.js         # Gestor de configuración persistente
│   └── simulator-cli.js          # Simulador de terminal sin celular
├── start-standalone.bat          # Lanzador automático 1-Click para Windows
├── start-standalone.sh           # Lanzador automático 1-Click para Linux/macOS
├── .gitignore                    # Exclusión de llaves privadas y node_modules
├── package.json
└── README.md
```

---

## 🔒 Licencia y Seguridad
Este proyecto excluye automáticamente del control de versiones las carpetas de credenciales (`whatsapp_auth_info/`) y sesiones privadas para garantizar que no se compartan tokens ni claves secretas al clonar en otro equipo.
