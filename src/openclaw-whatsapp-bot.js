const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const { processWhatsAppMessage } = require('./state-machine');
const configManager = require('./config-manager');
const { runOnboardingWizard } = require('./onboarding-wizard');

const AUTH_FOLDER = path.join(__dirname, '..', 'whatsapp_auth_info');

async function startOpenClawWhatsAppBot() {
  console.log('\n========================================================================');
  console.log(`🚀 INICIANDO MOTOR WHATSAPP AGENT - ${configManager.get('companyName').toUpperCase()}`);
  console.log('========================================================================\n');

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📲 Escanea este código QR con el WhatsApp de tu teléfono para vincular el Agente Conversacional:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log(`❌ Conexión cerrada debido a: ${lastDisconnect?.error?.message || 'Desconexión'}. Reconectando: ${shouldReconnect}`);
      if (shouldReconnect) {
        startOpenClawWhatsAppBot();
      }
    } else if (connection === 'open') {
      const userJid = sock.user ? sock.user.id.replace(/:.*@/, '@') : 'Número X Vinculado';
      console.log(`\n✅ CONEXIÓN EXITOSA CON EL PROTOCOLO DE WHATSAPP`);
      console.log(`📱 Número Vinculado: [${userJid}]`);
      console.log(`🏢 Empresa: ${configManager.get('companyName')}`);
      console.log(`🤖 Agente: ${configManager.get('botName')}`);
      console.log(`⚙️ Modo de Respuesta: ${configManager.get('autoReplyMode').toUpperCase()}`);
      console.log(`💬 Escuchando mensajes entrantes en tiempo real con soporte de imágenes y emojis...\n`);
    }
  });

  // Intercepción y filtrado de mensajes en tiempo real
  sock.ev.on('messages.upsert', async (m) => {
    try {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        if (msg.key.fromMe) continue;
        const senderJid = msg.key.remoteJid;

        // Filtrar difusiones masivas y grupos (@g.us / status@broadcast)
        if (senderJid.endsWith('@g.us') || senderJid.includes('broadcast')) continue;

        // Verificar autorización según la configuración de Onboarding (All vs Whitelist)
        const cleanSenderNumber = senderJid.replace('@s.whatsapp.net', '');
        if (!configManager.isNumberAuthorized(cleanSenderNumber)) {
          console.log(`🛡️ [Filtro Whitelist] Mensaje ignorado de [${cleanSenderNumber}] (No está en la lista blanca).`);
          continue;
        }

        const messageText = msg.message?.conversation ||
                           msg.message?.extendedTextMessage?.text ||
                           msg.message?.buttonsResponseMessage?.selectedButtonId ||
                           msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId;

        if (!messageText) continue;

        console.log(`📩 Mensaje recibido de [${cleanSenderNumber}]: "${messageText}"`);

        // Procesar flujo en la máquina de estados
        const responseObj = processWhatsAppMessage(senderJid, messageText);
        const textContent = typeof responseObj === 'string' ? responseObj : responseObj.text;
        const imageUrl = typeof responseObj === 'object' ? responseObj.imageUrl : null;

        // Si el modo es manual, solo imprimir la respuesta sugerida
        if (configManager.get('autoReplyMode') === 'manual') {
          console.log(`🖐️ [Modo Manual Active] Respuesta generada para [${cleanSenderNumber}]:\n${textContent}\n`);
          continue;
        }

        // Responder en WhatsApp con Imagen o Texto según corresponda
        if (imageUrl) {
          await sock.sendMessage(senderJid, {
            image: { url: imageUrl },
            caption: textContent
          }, { quoted: msg });
          console.log(`🖼️ Logo e imagen corporativa enviada a [${cleanSenderNumber}]`);
        } else {
          await sock.sendMessage(senderJid, {
            text: textContent
          }, { quoted: msg });
        }
        console.log(`🤖 Respuesta enviada exitosamente a [${cleanSenderNumber}]`);
      }
    } catch (err) {
      console.error('[OpenClaw Bot] Error procesando mensaje de WhatsApp:', err);
    }
  });
}

function startSimulator() {
  const { processWhatsAppMessage, getM01Welcome } = require('./state-machine');
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const TEST_JID = '573001234567@s.whatsapp.net';

  console.log('\n===============================================================');
  console.log('📱 SIMULADOR DE CONSOLA - AGENTE WHATSAPP');
  console.log('===============================================================\n');
  console.log('🤖 BOT WHATSAPP:\n' + getM01Welcome() + '\n');

  function promptUser() {
    rl.question('👤 TÚ: ', (ans) => {
      if (ans.trim().toLowerCase() === 'exit' || ans.trim().toLowerCase() === 'salir') {
        rl.close();
        process.exit(0);
      }
      const res = processWhatsAppMessage(TEST_JID, ans);
      const text = typeof res === 'string' ? res : res.text;
      const img = typeof res === 'object' && res.imageUrl ? ` [🖼️ Imagen: ${res.imageUrl}]` : '';
      console.log('\n🤖 BOT WHATSAPP' + img + ':\n' + text + '\n');
      promptUser();
    });
  }
  promptUser();
}

// Iniciar Onboarding Wizard interactivo al arrancar el script
if (require.main === module) {
  runOnboardingWizard(
    () => startOpenClawWhatsAppBot(),
    () => startSimulator()
  );
}

module.exports = { startOpenClawWhatsAppBot };
