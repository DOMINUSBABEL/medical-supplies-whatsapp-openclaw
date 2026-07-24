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

// COLA DE MENSAJES SECUENCIAL PER-USUARIO (ANTI-SOLAPAMIENTO Y DELAY HUMANO)
const messageQueues = new Map();

function enqueueMessage(senderJid, taskFn) {
  if (!messageQueues.has(senderJid)) {
    messageQueues.set(senderJid, Promise.resolve());
  }
  const currentQueue = messageQueues.get(senderJid);
  const nextQueue = currentQueue
    .then(async () => {
      try {
        await taskFn();
      } catch (err) {
        console.error(`[Queue Error ${senderJid}]:`, err.message || err);
      }
    })
    .finally(() => {
      // Limpieza de cola cuando finalizan todas las tareas del usuario
      if (messageQueues.get(senderJid) === nextQueue) {
        messageQueues.delete(senderJid);
      }
    });
  messageQueues.set(senderJid, nextQueue);
}

// CONTROL DE RECONEXIÓN CON EXPONENTIAL BACKOFF (EVITA LOOPS INFINITOS SI NO HAY INTERNET)
let reconnectAttempts = 0;
let isConnecting = false;

async function startOpenClawWhatsAppBot() {
  if (isConnecting) return;
  isConnecting = true;

  console.log('\n========================================================================');
  console.log(`🚀 INICIANDO MOTOR WHATSAPP AGENT - ${configManager.get('companyName').toUpperCase()}`);
  console.log('========================================================================\n');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      generateHighQualityLinkPreview: true,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('📲 Escanea este código QR con el WhatsApp de tu teléfono para vincular el Agente Conversacional:\n');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        isConnecting = false;
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = (statusCode !== DisconnectReason.loggedOut);
        
        reconnectAttempts++;
        const backoffMs = Math.min(5000 * Math.pow(1.5, reconnectAttempts - 1), 60000);

        console.log(`⚠️ Conexión cerrada (${lastDisconnect?.error?.message || 'Desconexión'}). Reintentando en ${(backoffMs / 1000).toFixed(1)}s (Intento #${reconnectAttempts})...`);

        if (shouldReconnect) {
          setTimeout(() => {
            startOpenClawWhatsAppBot();
          }, backoffMs);
        } else {
          console.log('❌ Sesión cerrada por el usuario o token expirado. Por favor reinicia la vinculación con opción 5.');
        }
      } else if (connection === 'open') {
        isConnecting = false;
        reconnectAttempts = 0; // Resetear intentos al conectar exitosamente
        const userJid = sock.user ? sock.user.id.replace(/:.*@/, '@') : 'Número X Vinculado';
        console.log(`\n✅ CONEXIÓN EXITOSA CON EL PROTOCOLO DE WHATSAPP`);
        console.log(`📱 Número Vinculado: [${userJid}]`);
        console.log(`🏢 Empresa: ${configManager.get('companyName')}`);
        console.log(`🤖 Agente: ${configManager.get('botName')}`);
        console.log(`🔑 Comando de Activación Requerido: "!Hola"`);
        console.log(`⚙️ Modo de Respuesta: ${configManager.get('autoReplyMode').toUpperCase()}`);
        console.log(`⏱️ Delay entre respuestas: 5 Segundos (Simulación Humana & Anti-solapamiento)`);
        console.log(`💬 Escuchando mensajes entrantes en tiempo real...\n`);
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
          const cleanSenderNumber = senderJid.replace('@s.whatsapp.net', '').replace(/@.*$/, '');
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

          // Encolar y procesar con delay estricto de 5 segundos para evitar solapamientos
          enqueueMessage(senderJid, async () => {
            // Verificar si el mensaje activa o continúa la conversación
            const responseObj = processWhatsAppMessage(senderJid, messageText);
            if (!responseObj) {
              console.log(`🤫 [Mensaje Ignorado] [${cleanSenderNumber}]: "${messageText}" (Se requiere "!Hola" para activar el asistente)`);
              return;
            }

            // 1. Mostrar estado "escribiendo..." en WhatsApp
            try {
              await sock.sendPresenceUpdate('composing', senderJid);
            } catch (e) {}

            // 2. Esperar 5 segundos exactos (delay humano entre respuesta y solicitud)
            await new Promise(resolve => setTimeout(resolve, 5000));

            const textContent = typeof responseObj === 'string' ? responseObj : responseObj.text;
            const imageUrl = typeof responseObj === 'object' ? responseObj.imageUrl : null;

            // Si el modo es manual, solo imprimir la respuesta sugerida
            if (configManager.get('autoReplyMode') === 'manual') {
              console.log(`🖐️ [Modo Manual Active] Respuesta generada para [${cleanSenderNumber}]:\n${textContent}\n`);
              return;
            }

            // 3. Enviar mensaje por WhatsApp con tolerancia a fallos de imagen
            let sentSuccessfully = false;
            if (imageUrl) {
              try {
                await sock.sendMessage(senderJid, {
                  image: { url: imageUrl },
                  caption: textContent
                }, { quoted: msg });
                sentSuccessfully = true;
                console.log(`🖼️ Imagen corporativa y texto enviados a [${cleanSenderNumber}] (5s delay)`);
              } catch (imgErr) {
                console.warn(`⚠️ No se pudo enviar imagen (${imgErr.message}). Enviando solo texto...`);
              }
            }

            if (!sentSuccessfully) {
              await sock.sendMessage(senderJid, {
                text: textContent
              }, { quoted: msg });
              console.log(`🤖 Respuesta de texto enviada a [${cleanSenderNumber}] (5s delay)`);
            }

            // 4. Restablecer estado de presencia
            try {
              await sock.sendPresenceUpdate('paused', senderJid);
            } catch (e) {}
          });
        }
      } catch (err) {
        console.error('[OpenClaw Bot] Error procesando mensaje de WhatsApp:', err.message || err);
      }
    });

  } catch (initErr) {
    isConnecting = false;
    console.error('❌ Error inicializando bot WhatsApp:', initErr.message);
    setTimeout(() => startOpenClawWhatsAppBot(), 10000);
  }
}

function startSimulator() {
  const { processWhatsAppMessage } = require('./state-machine');
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const TEST_JID = '573001234567@s.whatsapp.net';

  console.log('\n===============================================================');
  console.log('📱 SIMULADOR DE CONSOLA - AGENTE WHATSAPP (MEDICAL SUPPLIES CORP)');
  console.log('===============================================================');
  console.log('💡 Escribe "!Hola" para iniciar la conversación con el asistente.\n');

  function promptUser() {
    rl.question('👤 TÚ: ', (ans) => {
      if (ans.trim().toLowerCase() === 'exit' || ans.trim().toLowerCase() === 'salir') {
        rl.close();
        process.exit(0);
      }
      const res = processWhatsAppMessage(TEST_JID, ans);
      if (!res) {
        console.log('🤫 [Bot en reposo: Mensaje ignorado. Escribe "!Hola" para activar]');
        promptUser();
        return;
      }
      console.log('⏳ (Simulando delay de 5 segundos en consola...)');
      setTimeout(() => {
        const text = typeof res === 'string' ? res : res.text;
        const img = typeof res === 'object' && res.imageUrl ? ` [🖼️ Imagen: ${res.imageUrl}]` : '';
        console.log('\n🤖 BOT WHATSAPP' + img + ':\n' + text + '\n');
        promptUser();
      }, 5000);
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
