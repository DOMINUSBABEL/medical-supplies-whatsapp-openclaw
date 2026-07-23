const readline = require('readline');
const { processWhatsAppMessage, getWelcomeMessage } = require('./state-machine');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const TEST_JID = '573001234567@s.whatsapp.net';

console.log('\n===============================================================');
console.log('📱 SIMULADOR EN CONSOLA: WHATSAPP BOT - MEDICAL SUPPLIES');
console.log('===============================================================');
console.log('Simulando conversación entrante desde el número +57 300 123 4567...\n');

// Mostrar mensaje inicial
console.log('🤖 BOT WHATSAPP:\n---------------------------------------------------------------');
console.log(getWelcomeMessage());
console.log('---------------------------------------------------------------\n');

function promptUser() {
  rl.question('👤 TÚ (Escribe tu mensaje o respuesta): ', (answer) => {
    if (answer.trim().toLowerCase() === 'exit' || answer.trim().toLowerCase() === 'salir') {
      console.log('\n👋 Simulación terminada.');
      rl.close();
      return;
    }

    const reply = processWhatsAppMessage(TEST_JID, answer);

    console.log('\n🤖 BOT WHATSAPP:\n---------------------------------------------------------------');
    console.log(reply);
    console.log('---------------------------------------------------------------\n');

    promptUser();
  });
}

promptUser();
