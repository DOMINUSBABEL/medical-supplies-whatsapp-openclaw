const sessionManager = require('./session-manager');

// Base de Datos Ficticia Institucional de Medical Supplies
const DEMO_EMPLOYEES = {
  '1010101010': { nombre: 'Carlos Andrés Pérez', cargo: 'Analista de Quirófano', tipo: 'colaborador', vacacionesDias: 14, monedasCultura: 2 },
  '2020202020': { nombre: 'María Fernanda Gómez', cargo: 'Coordinadora Logística Médica', tipo: 'colaborador', vacacionesDias: 8, monedasCultura: 3 },
  '3030303030': { nombre: 'Juan Esteban Restrepo', cargo: 'Especialista en Equipos Quirúrgicos', tipo: 'colaborador', vacacionesDias: 22, monedasCultura: 1 },
  '5050505050': { nombre: 'Roberto Silva', cargo: 'Excolaborador (Planta Quirúrgica)', tipo: 'excolaborador', vacacionesDias: 0, monedasCultura: 0 },
  '7070707070': { nombre: 'Laura Botero', cargo: 'Candidata Selección (Enfermera Jefe)', tipo: 'candidato', vacacionesDias: 0, monedasCultura: 0 }
};

function processWhatsAppMessage(senderJid, textInput) {
  const session = sessionManager.getSession(senderJid);
  const text = (textInput || '').trim();
  const lower = text.toLowerCase();

  // Comandos globales de reinicio o menú
  if (lower === 'reiniciar' || lower === 'inicio' || lower === 'reset') {
    sessionManager.resetSession(senderJid);
    return getWelcomeMessage();
  }

  const state = session.flowState;

  // 1. WELCOME & USER TYPE SELECTION
  if (state === 'ask_user_type') {
    if (text === '1' || lower.includes('colaborador')) {
      sessionManager.updateSession(senderJid, { flowState: 'ask_habeas' });
      return `🔒 *Tratamiento de Datos Personales (Habeas Data)*\n\nConforme a la *Ley 1581 de 2012*, para consultar tu información institucional requerimos tu autorización para el tratamiento de datos personales.\n\nEscribe el número de tu elección:\n\n*1.* Sí, autorizo el tratamiento de mis datos\n*2.* No autorizo`;
    }

    if (text === '2' || lower.includes('externo') || lower.includes('candidato') || lower.includes('excolaborador')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_externos', currentCategory: 'external' });
      return getExternosMenu();
    }

    return getWelcomeMessage();
  }

  // 2. HABEAS DATA
  if (state === 'ask_habeas') {
    if (text === '1' || lower.includes('si') || lower.includes('sí') || lower.includes('autorizo')) {
      sessionManager.updateSession(senderJid, { flowState: 'ask_cedula' });
      return `📄 *Identificación del Colaborador*\n\nPor favor ingresa tu *Número de Cédula de Ciudadanía* (solo números, entre 6 y 10 dígitos).\n\n💡 *Tip Demo:* Puedes usar una de las cédulas de prueba:\n• *1010101010* (Carlos Pérez - Quirófano)\n• *2020202020* (María Gómez - Logística)\n• *3030303030* (Juan Restrepo - Equipos)`;
    }

    if (text === '2' || lower.includes('no')) {
      sessionManager.updateSession(senderJid, { flowState: 'ended', currentCategory: 'ended' });
      return `Entendemos tu decisión. Por regulaciones legales no podemos procesar tu solicitud sin autorización de datos.\n\n¡Gracias por comunicarte con *Medical Supplies*! Que tengas un excelente día. ✨`;
    }

    return `Opción no válida. Por favor responde:\n\n*1.* Sí, autorizo\n*2.* No autorizo`;
  }

  // 3. CEDULA VALIDATION
  if (state === 'ask_cedula') {
    const cedula = text.replace(/\D/g, '');
    if (cedula.length < 6 || cedula.length > 10) {
      return `⚠️ La cédula ingresada debe contener entre 6 y 10 dígitos numéricos.\n\nPor favor intenta nuevamente digitando tu cédula (ej. *1010101010*):`;
    }

    let emp = DEMO_EMPLOYEES[cedula];
    if (!emp) {
      emp = { nombre: 'Colaborador Medical Supplies', cargo: 'Personal de Planta', tipo: 'colaborador', vacacionesDias: 15, monedasCultura: 2 };
    }

    sessionManager.updateSession(senderJid, {
      flowState: 'main_menu',
      currentCategory: 'menu_principal',
      employee: emp
    });

    return `✅ *¡Bienvenido(a), ${emp.nombre}!*\n💼 Cargo: _${emp.cargo}_\n\n¿En qué trámite o consulta de Talento Humano podemos ayudarte hoy?\n\n` + getMainMenuText();
  }

  // 4. MAIN MENU & GENERAL COMMANDS
  if (state === 'main_menu' || lower === 'menu') {
    if (text === '1' || lower.includes('consulta')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_consultas', currentCategory: 'payroll' });
      return getConsultasMenu();
    }

    if (text === '2' || lower.includes('reporte') || lower.includes('novedad')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_reportes', currentCategory: 'accident' });
      return getReportesMenu();
    }

    if (text === '3' || lower.includes('institucional') || lower.includes('rit') || lower.includes('etica')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_institucional', currentCategory: 'ethics' });
      return getInstitucionalMenu();
    }

    if (text === '4' || lower.includes('evento') || lower.includes('formacion') || lower.includes('bienestar')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_eventos', currentCategory: 'events' });
      return getEventosMenu();
    }

    if (text === '5' || lower.includes('finalizar') || lower.includes('salir')) {
      sessionManager.updateSession(senderJid, { flowState: 'ended', currentCategory: 'ended' });
      const empName = session.employee ? session.employee.nombre : '';
      return `Gracias por comunicarte con el *Asistente Virtual de Talento Humano de Medical Supplies*${empName ? `, *${empName}*` : ''}.\n\nTu solicitud ha sido gestionada correctamente. ¡Que tengas un excelente día! ✨`;
    }
  }

  // 5. SUBMENU: CONSULTAS
  if (state === 'menu_consultas') {
    if (text === '1' || lower.includes('comprobante') || lower.includes('nomina')) {
      return `📄 *Comprobante de Nómina Digital*\n\nHemos generado tu último desprendible de pago disponible.\n\n📌 *Estado:* Pagado vía transferencia electrónica\n📅 *Período:* Quincena actual\n\nPuedes descargarlo directamente en la intranet de Talento Humano o escribir *menu* para volver.`;
    }

    if (text === '2' || lower.includes('vacaciones')) {
      const vac = session.employee ? session.employee.vacacionesDias : 14;
      return `🌴 *Saldos de Vacaciones Acumuladas*\n\nColaborador: *${session.employee?.nombre || 'Colaborador'}*\n==============================\n📊 *Días Hábiles Disponibles:* ${vac} días\n📅 *Período:* 2025 - 2026\n==============================\n[🟩🟩🟩🟩🟩🟩🟩⬜⬜⬜] 70% Acumulado\n\n💡 *Recuerda:* Debes solicitar tus vacaciones con mínimo 15 días de anticipación.\n\nResponde:\n*1.* Deseo solicitar o programar mi período de vacaciones\n*2.* Volver al menú principal`;
    }

    if (text === '3' || lower.includes('moneda') || lower.includes('beneficio')) {
      const mon = session.employee ? session.employee.monedasCultura : 2;
      return `🪙 *Moneda de Cultura Medical Supplies*\n\nSaldo actual: *${mon} ${mon === 1 ? 'moneda' : 'monedas'} disponible(s)*\nVigencia: _Hasta el 31/12/2026_\n\n💡 Puedes redimir tu moneda en actividades culturales o jornadas de descanso acordadas.\n\nResponde:\n*1.* Reservar 1 moneda de cultura\n*2.* Volver al menú principal`;
    }

    if (text === '4' || lower.includes('escucha') || lower.includes('psicolog')) {
      return `🎧 *Zona de Escucha Virtual (Acompañamiento Psicológico)*\n\nUn espacio 100% confidencial y remoto con la psicóloga *Daniela Ríos* de Bienestar Laboral.\n\nResponde:\n*1.* Agendar cita orientativa vía Teams\n*2.* Escribir directo al correo (dani.rios@medicalsupplies.example.com)\n*3.* Volver al menú principal`;
    }

    if (text === '5' || lower.includes('cesantia')) {
      sessionManager.updateSession(senderJid, { flowState: 'sub_cesantias', currentCategory: 'cesantias' });
      return `🏦 *Trámite de Retiro de Cesantías*\n\nSelecciona el motivo del trámite:\n\n*1.* Compra / Mejora de Vivienda\n*2.* Pago de Educación Superior\n*3.* Terminación de Contrato\n*4.* Volver al menú principal`;
    }

    if (text === '6' || lower.includes('menu')) {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return getMainMenuText();
    }
  }

  // 6. SUBMENU: REPORTES SST
  if (state === 'menu_reportes') {
    if (text === '1' || lower.includes('accidente') || lower.includes('sst')) {
      const rad = 'SST-' + Math.floor(100000 + Math.random() * 900000);
      return `🚨 *PROTOCOLO DE EMERGENCIA Y ACCIDENTE DE TRABAJO (SST)*\n\n📌 *Radicado de Atención Inmediata:* \`${rad}\`\n\n1. Si la persona requiere asistencia médica urgente, acude al puesto de primeros auxilios o marca la ext. *#911*.\n2. El comité de COPASST y la Brigada de Emergencia han sido notificados automáticamente.\n\nEscribe *menu* para volver al menú principal.`;
    }

    if (text === '2' || lower.includes('ausentismo') || lower.includes('incapacidad')) {
      return `🏥 *Reporte de Ausentismo o Incapacidad Médica*\n\nPor favor adjunta la imagen o PDF del certificado emitido por la EPS o solicita a tu médico tratante enviar la radicación al correo: \`incapacidades@medicalsupplies.example.com\`\n\nEscribe *menu* para volver al menú principal.`;
    }

    if (text === '3' || lower.includes('menu')) {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return getMainMenuText();
    }
  }

  // 7. EXTERNAL USERS MENU
  if (state === 'menu_externos') {
    if (text === '1' || lower.includes('vacante')) {
      return `💼 *Convocatorias Laborales Abiertas (Medical Supplies)*\n\n1. *Enfermero(a) Jefe Quirúrgico* - Sede Principal (Tiempo Completo)\n2. *Analista de Garantía de Calidad Dispositivos Médicos*\n3. *Auxiliar Logístico de Distribución Quirúrgica*\n\nPara postularte envía tu hoja de vida a: \`seleccion@medicalsupplies.example.com\` con el asunto de la vacante.`;
    }

    if (text === '2' || lower.includes('cert')) {
      return `📜 *Solicitud de Certificado Laboral Ex-empleados*\n\nPor favor envía un correo a \`talento.humano@medicalsupplies.example.com\` adjuntando copia de tu documento de identidad y las fechas aproximadas de tu vinculación. La certificación se expedirá en un plazo máximo de 3 días hábiles.`;
    }

    if (text === '3' || lower.includes('seguimiento')) {
      return `🔍 *Seguimiento a Proceso de Selección*\n\nDigita tu número de documento para consultar la etapa actual de tu postulación o escribe a la analista de selección asignada.`;
    }
  }

  // Fallback por defecto ante texto no comprendido
  return `No hemos comprendido tu opción. Por favor responde escribiendo una de las opciones numéricas o escribe la palabra *menu* para volver al menú principal.\n\n` + getMainMenuText();
}

function getWelcomeMessage() {
  return `👋 ¡Hola! Te damos la bienvenida al *Asistente Virtual de Talento Humano* de *Medical Supplies*.\n\nPor favor indica tu tipo de vinculación respondiendo con el número correspondiente:\n\n*1.* Soy Colaborador Activo de Medical Supplies\n*2.* Soy Personal Externo (candidatos, excolaboradores o terceros)`;
}

function getMainMenuText() {
  return `📌 *Menú Principal de Talento Humano*\n\n*1.* Realizar una consulta (Nómina, Vacaciones, Certificados, Beneficios)\n*2.* Reportar una novedad o situación (Accidente SST, Ausentismo)\n*3.* Consultar información institucional (RIT, Ética, COCOLA, COPASST)\n*4.* Ver eventos, bienestar y formación (Calendario, Capacitaciones)\n*5.* Finalizar conversación\n\n_Responde digitando el número de la opción (1, 2, 3, 4 o 5)_`;
}

function getConsultasMenu() {
  return `📊 *Submenú de Consultas*\n\n*1.* Comprobante de nómina\n*2.* Saldos de vacaciones\n*3.* Monedas de cultura\n*4.* Zona de escucha (Psicología virtual)\n*5.* Retiro de cesantías\n*6.* Volver al menú principal`;
}

function getReportesMenu() {
  return `🚨 *Submenú de Reportes & Novedades*\n\n*1.* Reportar un accidente de trabajo (SST Protocolo 24/7)\n*2.* Reportar ausentismo o incapacidad médica\n*3.* Volver al menú principal`;
}

function getInstitucionalMenu() {
  return `⚖️ *Información Institucional & Ética*\n\n*1.* Reglamento Interno de Trabajo (RIT)\n*2.* Programa de Transparencia y Ética\n*3.* Integrantes COCOLA & COPASST\n*4.* Volver al menú principal`;
}

function getEventosMenu() {
  return `🎓 *Eventos, Bienestar & Formación*\n\n*1.* Calendario de actividades quincenal\n*2.* Próximas capacitaciones de bioseguridad\n*3.* Volver al menú principal`;
}

function getExternosMenu() {
  return `🌐 *Portal de Personal Externo & Selección*\n\n*1.* Conocer convocatorias laborales abiertas (Vacantes)\n*2.* Solicitar certificado laboral (Excolaboradores)\n*3.* Hacer seguimiento a mi proceso de selección`;
}

module.exports = {
  processWhatsAppMessage,
  getWelcomeMessage
};
