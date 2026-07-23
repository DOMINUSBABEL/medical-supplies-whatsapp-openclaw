const { processWhatsAppMessage, getM01Welcome } = require('../src/state-machine');
const sessionManager = require('../src/session-manager');
const jid = '573132371329@s.whatsapp.net';
sessionManager.resetSession(jid);

console.log('=== PASO 1: USUARIO ESCRIBE "Hola" ===');
console.log(processWhatsAppMessage(jid, 'Hola').text);
console.log('ESTADO:', sessionManager.getSession(jid).flowState);

console.log('\n=== PASO 2: USUARIO SELECCIONA "1" (Colaborador) ===');
console.log(processWhatsAppMessage(jid, '1').text);
console.log('ESTADO:', sessionManager.getSession(jid).flowState);

console.log('\n=== PASO 3: USUARIO INGRESA CÉDULA "1010101010" ===');
console.log(processWhatsAppMessage(jid, '1010101010').text);
console.log('ESTADO:', sessionManager.getSession(jid).flowState);

console.log('\n=== PASO 4: USUARIO SELECCIONA "1" (Autorizo Habeas Data) ===');
console.log(processWhatsAppMessage(jid, '1').text);
console.log('ESTADO:', sessionManager.getSession(jid).flowState);
