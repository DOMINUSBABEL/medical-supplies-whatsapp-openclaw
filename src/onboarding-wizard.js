const readline = require('readline');
const fs = require('fs');
const path = require('path');
const configManager = require('./config-manager');

const AUTH_FOLDER = path.join(__dirname, '..', 'whatsapp_auth_info');

function clearScreen() {
  process.stdout.write('\x1Bc');
}

function showBanner() {
  console.log(`
========================================================================
  🤖 OPENCLAW WHATSAPP AGENT - MEDICAL SUPPLIES TALENTO HUMANO
========================================================================
  [Empresa]: ${configManager.get('companyName')}
  [Agente]:  ${configManager.get('botName')}
  [Modo]:    ${configManager.get('autoReplyMode').toUpperCase()} (${
    configManager.get('autoReplyMode') === 'all' 
      ? 'Responde a todos los chats de WhatsApp' 
      : configManager.get('autoReplyMode') === 'whitelist' 
      ? 'Solo responde a números autorizados en Whitelist' 
      : 'Requiere confirmación'
  })
  [Sesión]:  ${fs.existsSync(AUTH_FOLDER) ? '✅ Sesión Guardada / Vinculada' : '⚠️ Sin Vinculación (Se requerirá Código QR)'}
========================================================================
`);
}

function runOnboardingWizard(onStartServerCallback, onRunSimulatorCallback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  function mainMenu() {
    clearScreen();
    showBanner();

    console.log(`📋 MENÚ DE ONBOARDING & CONFIGURACIÓN DEL AGENTE:\n`);
    console.log(`  [1] 🚀 INICIAR SERVIDOR DEL AGENTE WHATSAPP EN VIVO`);
    console.log(`  [2] ⚙️  Configurar Modo de Respuesta (Todos vs. Whitelist)`);
    console.log(`  [3] 📱 Gestionar Lista Blanca (Whitelist de Números Autorizados)`);
    console.log(`  [4] 🏢 Personalizar Empresa y Nombre del Asistente`);
    console.log(`  [5] 🔄 Resetear Vinculación de WhatsApp (Forzar nuevo Código QR)`);
    console.log(`  [6] 🖥️  Ejecutar Simulador Interactivo de Consola`);
    console.log(`  [7] 📊 Ver Detalle de Configuración Actual`);
    console.log(`  [0] ❌ Salir\n`);

    rl.question('👉 Selecciona una opción (0-7): ', (choice) => {
      const option = choice.trim();

      switch (option) {
        case '1':
          rl.close();
          console.log('\n🚀 Iniciando motor de comunicación WhatsApp...\n');
          onStartServerCallback();
          break;

        case '2':
          configureReplyMode(rl, mainMenu);
          break;

        case '3':
          manageWhitelist(rl, mainMenu);
          break;

        case '4':
          configureCompany(rl, mainMenu);
          break;

        case '5':
          resetAuthSession(rl, mainMenu);
          break;

        case '6':
          rl.close();
          onRunSimulatorCallback();
          break;

        case '7':
          showCurrentConfig(rl, mainMenu);
          break;

        case '0':
          console.log('\n👋 Saliendo del Onboarding de OpenClaw. ¡Hasta pronto!\n');
          rl.close();
          process.exit(0);
          break;

        default:
          console.log('\n⚠️ Opción no válida. Presiona Enter para intentar nuevamente...');
          rl.question('', () => mainMenu());
          break;
      }
    });
  }

  mainMenu();
}

function configureReplyMode(rl, backCallback) {
  clearScreen();
  showBanner();
  console.log(`⚙️  CONFIGURACIÓN DEL MODO DE RESPUESTA AUTOMÁTICA:\n`);
  console.log(`  1. 🌐 Modo Abierto (ALL): Responde a cualquier usuario que escriba al número X.`);
  console.log(`  2. 🔒 Modo Whitelist: Solo responde a números autorizados en la lista blanca.`);
  console.log(`  3. 🖐️ Modo Manual: Muestra mensajes en consola sin auto-responder.\n`);

  rl.question('👉 Elige el modo (1, 2 o 3): ', (ans) => {
    const val = ans.trim();
    if (val === '1') {
      configManager.set('autoReplyMode', 'all');
      console.log('\n✅ Modo establecido en: RESPONDER A TODOS LOS CHATS');
    } else if (val === '2') {
      configManager.set('autoReplyMode', 'whitelist');
      console.log('\n✅ Modo establecido en: SOLO LISTA BLANCA (WHITELIST)');
    } else if (val === '3') {
      configManager.set('autoReplyMode', 'manual');
      console.log('\n✅ Modo establecido en: CONFIRMACIÓN MANUAL');
    } else {
      console.log('\n⚠️ Selección no válida.');
    }
    rl.question('\nPresiona Enter para volver...', () => backCallback());
  });
}

function manageWhitelist(rl, backCallback) {
  clearScreen();
  showBanner();
  const list = configManager.get('whitelistNumbers') || [];
  console.log(`📱 LISTA BLANCA DE NÚMEROS AUTORIZADOS:\n`);
  if (list.length === 0) {
    console.log(`  (La lista blanca está vacía actualmente)\n`);
  } else {
    list.forEach((num, index) => console.log(`  ${index + 1}. ${num}`));
    console.log('');
  }

  console.log(`  1. ➕ Agregar nuevo número de WhatsApp (ej. +573001234567)`);
  console.log(`  2. 🗑️  Limpiar toda la lista blanca`);
  console.log(`  3. ↩️  Volver al menú principal\n`);

  rl.question('👉 Elige una opción (1-3): ', (ans) => {
    const val = ans.trim();
    if (val === '1') {
      rl.question('\nEscribe el número telefónico (con código de país, ej: 573001234567): ', (phone) => {
        const clean = phone.replace(/\D/g, '');
        if (clean.length >= 8) {
          list.push(clean);
          configManager.set('whitelistNumbers', list);
          console.log(`\n✅ Número ${clean} agregado exitosamente a la Whitelist.`);
        } else {
          console.log(`\n⚠️ Número no válido.`);
        }
        rl.question('\nPresiona Enter para continuar...', () => manageWhitelist(rl, backCallback));
      });
    } else if (val === '2') {
      configManager.set('whitelistNumbers', []);
      console.log('\n🗑️ Whitelist limpiada.');
      rl.question('\nPresiona Enter para continuar...', () => manageWhitelist(rl, backCallback));
    } else {
      backCallback();
    }
  });
}

function configureCompany(rl, backCallback) {
  clearScreen();
  showBanner();
  console.log(`🏢 PERSONALIZACIÓN DE EMPRESA Y ASISTENTE:\n`);
  console.log(`  Nombre actual de la empresa:  "${configManager.get('companyName')}"`);
  console.log(`  Nombre actual del asistente: "${configManager.get('botName')}"\n`);

  rl.question('Escribe el nuevo nombre de la Empresa (o presiona Enter para mantener): ', (comp) => {
    if (comp.trim()) {
      configManager.set('companyName', comp.trim());
    }
    rl.question('Escribe el nuevo nombre del Asistente (o presiona Enter para mantener): ', (bot) => {
      if (bot.trim()) {
        configManager.set('botName', bot.trim());
      }
      console.log('\n✅ Cambios guardados correctamente.');
      rl.question('\nPresiona Enter para volver...', () => backCallback());
    });
  });
}

function resetAuthSession(rl, backCallback) {
  clearScreen();
  showBanner();
  console.log(`🔄 RESETEAR VINCULACIÓN DE WHATSAPP:\n`);
  console.log(`Esta acción eliminará las credenciales guardadas en "${AUTH_FOLDER}".`);
  console.log(`En la próxima ejecución se generará un NUEVO CÓDIGO QR para escanear.\n`);

  rl.question('¿Estás seguro de resetear la sesión? (s/n): ', (ans) => {
    if (ans.trim().toLowerCase() === 's' || ans.trim().toLowerCase() === 'si') {
      try {
        if (fs.existsSync(AUTH_FOLDER)) {
          fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
        }
        console.log('\n✅ Sesión de WhatsApp reseteada. En el próximo inicio se solicitará Código QR.');
      } catch (err) {
        console.error('\n❌ Error eliminando la sesión:', err.message);
      }
    } else {
      console.log('\nOperación cancelada.');
    }
    rl.question('\nPresiona Enter para volver...', () => backCallback());
  });
}

function showCurrentConfig(rl, backCallback) {
  clearScreen();
  showBanner();
  console.log(`📊 DETALLE DE CONFIGURACIÓN Y ESTADÍSTICAS:\n`);
  console.log(JSON.stringify(configManager.config, null, 2));
  console.log('\nPresiona Enter para volver...');
  rl.question('', () => backCallback());
}

module.exports = { runOnboardingWizard };
