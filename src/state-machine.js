const sessionManager = require('./session-manager');

// 3. MOCK DATA ACCORDING TO SPECIFICATION (§3)
const MOCK_COLABORADORES = {
  '1010101010': { nombre: 'Laura Martínez', cargo: 'Analista de Compras', venceContrato: '31/12/2026', vacacionesDias: 12, fechaCorte: '30/11/2026', evaluacion: 'Sobresaliente (92/100)', monedasCultura: 8, activo: true },
  '2020202020': { nombre: 'Carlos Ramírez', cargo: 'Auxiliar de Bodega', venceContrato: '15/08/2026', vacacionesDias: 5, fechaCorte: '30/11/2026', evaluacion: 'Satisfactorio (81/100)', monedasCultura: 8, activo: true },
  '3030303030': { nombre: 'Andrea Gómez', cargo: 'Coordinadora Comercial', venceContrato: 'Indefinido', vacacionesDias: 20, fechaCorte: '30/11/2026', evaluacion: 'Excelente (96/100)', monedasCultura: 8, activo: true },
  '4040404040': { nombre: 'Colaborador Inactivo', cargo: 'Sin cargo', activo: false }
};

const MOCK_EXCOLABORADORES = {
  '5050505050': { nombre: 'María Fernanda Ruiz', cargoFinal: 'Auxiliar Administrativa', periodo: '15/03/2021 – 30/09/2024' },
  '6060606060': { nombre: 'Juan Camilo Herrera', cargoFinal: 'Asesor Comercial', periodo: '01/06/2019 – 15/01/2025' }
};

const MOCK_CANDIDATOS = {
  '7070707070': { nombre: 'Diana Salazar', vacante: 'Analista de Talento Humano', activo: true, etapa: 'Pruebas técnicas' },
  '8080808080': { nombre: 'Sebastián Ortiz', vacante: 'Coordinador Logístico', activo: false, etapa: 'Proceso finalizado' }
};

// 5. RADICADO GENERATOR (§5)
function generateRadicado(prefix) {
  const year = new Date().getFullYear();
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${num}`;
}

// 4. CEDULA VALIDATION (§4)
function validateCedula(rawInput) {
  if (!rawInput || rawInput.trim() === '') {
    return { valid: false, error: 'No recibimos ningún dato. Por favor escribe tu *número de cédula* usando solo dígitos (sin puntos ni espacios).' };
  }
  const cleaned = rawInput.replace(/[\.\s\-]/g, '');
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'La cédula solo debe contener *números* (0-9). No incluyas letras ni caracteres especiales. Por favor inténtalo nuevamente.' };
  }
  if (cleaned.length < 6) {
    return { valid: false, error: `El número ingresado es muy corto (*${cleaned.length} dígitos*). Una cédula válida tiene entre *6 y 10 dígitos*. Por favor verifica e inténtalo nuevamente.` };
  }
  if (cleaned.length > 10) {
    return { valid: false, error: `El número ingresado es demasiado largo (*${cleaned.length} dígitos*). Una cédula válida tiene entre *6 y 10 dígitos*. Por favor verifica e inténtalo nuevamente.` };
  }
  return { valid: true, cedula: cleaned };
}

// 7. STATE MACHINE MAIN HANDLER (§7)
function processWhatsAppMessage(senderJid, textInput) {
  const session = sessionManager.getSession(senderJid);
  const text = (textInput || '').trim();
  const lower = text.toLowerCase();

  // Reset or Global restart
  if (lower === 'reiniciar' || lower === 'inicio' || lower === 'reset') {
    sessionManager.resetSession(senderJid);
    return getM01Welcome();
  }

  // If conversation already ended and user types anything, restart
  if (session.flowState === 'ended' || session.flowState === 'not_active' || session.flowState === 'consent_denied' || session.flowState === 'ext_denied') {
    sessionManager.resetSession(senderJid);
    return getM01Welcome();
  }

  const state = session.flowState;

  // -------------------------------------------------------------
  // 7.1 welcome -> profile_select
  // -------------------------------------------------------------
  if (state === 'welcome' || state === 'profile_select' || state === 'ask_user_type') {
    if (text === '1' || lower.includes('colaborador')) {
      sessionManager.updateSession(senderJid, { flowState: 'ask_cedula', profile: 'colaborador' });
      return `Para continuar, por favor ingresa tu *número de cédula* sin puntos ni espacios.`;
    }

    if (text === '2' || lower.includes('externo') || lower.includes('candidato') || lower.includes('excolaborador')) {
      sessionManager.updateSession(senderJid, { flowState: 'ext_consent', profile: 'externo' });
      return `Bienvenido. Para gestionar tu solicitud, Medical Supplies requiere procesar tus datos bajo nuestra *política de tratamiento de datos personales* (Ley 1581 de 2012).\n\n¿Autorizas el tratamiento de tus datos para continuar?\n\n*1.* Sí, autorizo\n*2.* No autorizo`;
    }

    return getM01Welcome();
  }

  // -------------------------------------------------------------
  // 7.2 RUTA COLABORADOR: ask_cedula & validating
  // -------------------------------------------------------------
  if (state === 'ask_cedula') {
    const valResult = validateCedula(text);
    if (!valResult.valid) {
      return valResult.error;
    }

    const cedula = valResult.cedula;
    const emp = MOCK_COLABORADORES[cedula];

    if (!emp || !emp.activo) {
      sessionManager.updateSession(senderJid, { flowState: 'not_active' });
      return `No encontramos un colaborador activo asociado al número de cédula ingresado.\nPor seguridad, este canal está habilitado únicamente para *empleados activos* de Medical Supplies.\nSi consideras que esto es un error, por favor comunícate directamente con el área de *Talento Humano*.`;
    }

    sessionManager.updateSession(senderJid, {
      flowState: 'data_consent',
      employee: { ...emp, cedula }
    });

    return `Hola, *${emp.nombre}*. Hemos validado tu información correctamente.\n\nAntes de continuar, necesitamos tu autorización para el *tratamiento de datos personales*.\nMedical Supplies tratará tus datos únicamente para gestionar tus consultas, solicitudes, reportes y trámites internos relacionados con Talento Humano, de acuerdo con nuestra política de tratamiento de datos personales.\n\n¿Autorizas el tratamiento de tus datos personales para continuar?\n\n*1.* Sí, autorizo\n*2.* No autorizo`;
  }

  // data_consent
  if (state === 'data_consent') {
    if (text === '1' || lower.includes('si') || lower.includes('sí') || lower.includes('autorizo')) {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu', currentCategory: 'menu_principal' });
      const name = session.employee?.nombre || 'Colaborador';
      return `Gracias, *${name}*. Tu autorización ha sido registrada. Ahora cuéntame qué necesitas realizar.\n\n*${name}*, selecciona una opción:\n\n` + getMainMenuText();
    }

    if (text === '2' || lower.includes('no')) {
      sessionManager.updateSession(senderJid, { flowState: 'consent_denied' });
      return `Entendemos tu decisión.\nPara proteger tus datos personales, no podremos continuar con la atención por este canal.\nSi necesitas apoyo, puedes comunicarte directamente con el área de *Talento Humano* de Medical Supplies.\nGracias por contactarnos.`;
    }

    return `Por favor selecciona una opción válida:\n\n*1.* Sí, autorizo\n*2.* No autorizo`;
  }

  // -------------------------------------------------------------
  // 7.2 main_menu (post-consentimiento)
  // -------------------------------------------------------------
  if (state === 'main_menu' || lower === 'menu') {
    const name = session.employee?.nombre || 'Colaborador';

    if (text === '1' || lower.includes('consulta')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_consultas', currentCategory: 'payroll' });
      return getConsultasMenuText(name);
    }

    if (text === '2' || lower.includes('reporte')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_reportes', currentCategory: 'accident' });
      return getReportesMenuText(name);
    }

    if (text === '3' || lower.includes('institucional')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_institucional', currentCategory: 'ethics' });
      return getInstitucionalMenuText(name);
    }

    if (text === '4' || lower.includes('evento') || lower.includes('formacion') || lower.includes('bienestar')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_eventos', currentCategory: 'events' });
      return getEventosMenuText(name);
    }

    if (text === '5' || lower.includes('finalizar')) {
      sessionManager.updateSession(senderJid, { flowState: 'ended' });
      return getEndedMessage(name);
    }

    return `La opción ingresada no es válida. Por favor selecciona una de las opciones disponibles en el menú.\n\n` + getMainMenuText();
  }

  // -------------------------------------------------------------
  // 7.3 SUBMENÚ CONSULTAS (menu_consultas)
  // -------------------------------------------------------------
  if (state === 'menu_consultas') {
    const name = session.employee?.nombre || 'Colaborador';
    const cedula = session.employee?.cedula || '1010101010';

    if (text === '1' || lower.includes('comprobante')) {
      sessionManager.updateSession(senderJid, { flowState: 'sub_comprobante' });
      return `Has seleccionado: *Comprobante de nómina*. Por favor selecciona el periodo:\n\n*1.* Último comprobante disponible\n*2.* Comprobante de un mes específico\n*3.* Volver al menú anterior`;
    }

    if (text === '2' || lower.includes('certificado')) {
      sessionManager.updateSession(senderJid, { flowState: 'sub_certificado' });
      return `Has seleccionado: *Certificado laboral*. Selecciona el tipo:\n\n*1.* Certificado laboral general\n*2.* Certificado con salario\n*3.* Certificado dirigido a una entidad\n*4.* Volver al menú anterior`;
    }

    if (text === '3' || lower.includes('vacaciones')) {
      sessionManager.updateSession(senderJid, { flowState: 'vacaciones_ask' });
      const dias = session.employee?.vacacionesDias || 12;
      const corte = session.employee?.fechaCorte || '30/11/2026';
      return `Has seleccionado: *Saldos de vacaciones*. Estamos consultando tu saldo disponible...\n\nAquí tienes tu saldo, *${name}*:\n\n🌴 *Vacaciones disponibles*\n📊 *${dias} ${dias === 1 ? 'día disponible' : 'días disponibles'}*\n📅 Corte: ${corte}\n💡 _Recuerda coordinar con tu jefe directo antes de programar._\n\n¿Ya pensaste cuándo te gustaría programarlas?\n\n*1.* Sí, quiero programarlas\n*2.* Aún no`;
    }

    if (text === '4' || lower.includes('contrato')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      const fecha = session.employee?.venceContrato || '31/12/2026';
      return `*${name}*, la fecha de vencimiento registrada para tu contrato es: 📅 *${fecha}*.\n\n` + getAfterActionPrompt();
    }

    if (text === '5' || lower.includes('planilla')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `✅ Tu planilla de seguridad social está disponible para descarga:\n🔗 https://medicalsupplies.example.com/planilla/${cedula}.pdf\n\n` + getAfterActionPrompt();
    }

    if (text === '6' || lower.includes('cesantias')) {
      sessionManager.updateSession(senderJid, { flowState: 'sub_cesantias' });
      return `Por favor selecciona el motivo del retiro:\n\n*1.* Vivienda\n*2.* Educación\n*3.* Terminación de contrato\n*4.* Otro motivo\n*5.* Volver al menú anterior`;
    }

    if (text === '7' || lower.includes('evaluacion')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      const ev = session.employee?.evaluacion || 'Sobresaliente (92/100)';
      return `📊 *Periodo:* 2025-2026\n🏆 *Resultado de evaluación de desempeño:* ${ev}\n\n` + getAfterActionPrompt();
    }

    if (text === '8' || lower.includes('beneficio')) {
      sessionManager.updateSession(senderJid, { flowState: 'beneficios_menu' });
      return `*${name}*, estos son tus beneficios. ¿Cuál quieres explorar?\n\n*1.* 🪙 Moneda de cultura\n*2.* 🎧 Zona de escucha (virtual)\n*3.* Ver todos los beneficios\n*4.* Volver al menú de consultas`;
    }

    if (text === '9' || lower.includes('volver')) {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return getMainMenuText();
    }
  }

  // sub_comprobante
  if (state === 'sub_comprobante') {
    const cedula = session.employee?.cedula || '1010101010';
    if (text === '1' || lower.includes('ultimo')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `📄 Tu desprendible de nómina está disponible:\n🔗 https://medicalsupplies.example.com/nomina/${cedula}-último.pdf\n\n` + getAfterActionPrompt();
    }
    if (text === '2' || lower.includes('mes')) {
      sessionManager.updateSession(senderJid, { flowState: 'comprobante_mes' });
      return `Por favor escribe el *mes y año* del comprobante que requieres (ejemplo: *mayo 2026*):`;
    }
    if (text === '3' || lower.includes('volver')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_consultas' });
      return getConsultasMenuText(session.employee?.nombre || 'Colaborador');
    }
  }

  if (state === 'comprobante_mes') {
    const cedula = session.employee?.cedula || '1010101010';
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return `📄 Tu desprendible de nómina de *${text}* está disponible:\n🔗 https://medicalsupplies.example.com/nomina/${cedula}-${encodeURIComponent(text)}.pdf\n\n` + getAfterActionPrompt();
  }

  // sub_certificado
  if (state === 'sub_certificado') {
    const cedula = session.employee?.cedula || '1010101010';
    if (text === '1' || text === '2' || lower.includes('general') || lower.includes('salario')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `✅ Tu certificado estará disponible para descarga:\n🔗 https://medicalsupplies.example.com/certificados/${cedula}.pdf\n\n` + getAfterActionPrompt();
    }
    if (text === '3' || lower.includes('entidad')) {
      sessionManager.updateSession(senderJid, { flowState: 'certificado_entidad' });
      return `Por favor escribe el *nombre completo de la entidad* a la cual va dirigido el certificado laboral:`;
    }
    if (text === '4' || lower.includes('volver')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_consultas' });
      return getConsultasMenuText(session.employee?.nombre || 'Colaborador');
    }
  }

  if (state === 'certificado_entidad') {
    const cedula = session.employee?.cedula || '1010101010';
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return `✅ Tu certificado dirigido a *${text}* está disponible para descarga:\n🔗 https://medicalsupplies.example.com/certificados/${cedula}.pdf\n\n` + getAfterActionPrompt();
  }

  // vacaciones_ask
  if (state === 'vacaciones_ask') {
    const name = session.employee?.nombre || 'Colaborador';
    if (text === '1' || lower.includes('si') || lower.includes('sí')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `📄 Excelente. Puedes descargar e imprimir el formato oficial de solicitud de vacaciones en el siguiente enlace:\n🔗 https://medicalsupplies.example.com/formatos/solicitud-vacaciones.pdf\n\n` + getAfterActionPrompt();
    }
    if (text === '2' || lower.includes('no')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `Perfecto, *${name}*. Cuando definas las fechas puedes volver a este canal para descargar tu formato.\n\n` + getAfterActionPrompt();
    }
  }

  // sub_cesantias
  if (state === 'sub_cesantias') {
    let requisitos = '';
    if (text === '1' || lower.includes('vivienda')) {
      requisitos = `• Promesa de compraventa o escritura del inmueble\n• Certificado de tradición y libertad (no mayor a 30 días)\n• Carta de solicitud firmada`;
    } else if (text === '2' || lower.includes('educacion')) {
      requisitos = `• Recibo de matrícula o factura\n• Certificado de matrícula vigente\n• Carta de solicitud firmada`;
    } else if (text === '3' || lower.includes('terminacion')) {
      requisitos = `• Carta de retiro o terminación de contrato\n• Paz y salvo institucional`;
    } else if (text === '4' || lower.includes('otro')) {
      requisitos = `• Carta explicativa del motivo\n• Soportes correspondientes según el caso`;
    } else if (text === '5' || lower.includes('volver')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_consultas' });
      return getConsultasMenuText(session.employee?.nombre || 'Colaborador');
    }

    if (requisitos) {
      sessionManager.updateSession(senderJid, { flowState: 'cesantias_iniciar', tempData: { motivo: text } });
      return `📌 *Requisitos para retiro de cesantías:*\n${requisitos}\n\n¿Deseas iniciar la solicitud de retiro de cesantías?\n\n*1.* Sí, iniciar solicitud\n*2.* No, volver al menú principal`;
    }
  }

  if (state === 'cesantias_iniciar') {
    if (text === '1' || lower.includes('si') || lower.includes('sí')) {
      const rad = generateRadicado('CES');
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `✅ Solicitud de retiro de cesantías radicada exitosamente.\n📌 *Radicado:* \`${rad}\`\n\nRecibirás las instrucciones de entrega de documentos en tu correo corporativo.\n\n` + getAfterActionPrompt();
    }
    sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
    return getMainMenuText();
  }

  // beneficios_menu
  if (state === 'beneficios_menu') {
    const name = session.employee?.nombre || 'Colaborador';
    if (text === '1' || lower.includes('moneda')) {
      sessionManager.updateSession(senderJid, { flowState: 'moneda_menu' });
      const mon = session.employee?.monedasCultura || 8;
      return `🪙 *Moneda de Cultura*\n📊 *${mon} ${mon === 1 ? 'moneda disponible' : 'monedas disponibles'}*\n📅 Vigencia hasta el 31/12/2026\n💡 _Puedes redimirlas en actividades culturales avaladas por la compañía._\n\n¿Deseas reservar una moneda?\n\n*1.* Reservar 1 moneda de cultura\n*2.* Volver al menú de beneficios`;
    }

    if (text === '2' || lower.includes('escucha')) {
      sessionManager.updateSession(senderJid, { flowState: 'zona_escucha' });
      return `🎧 *Zona de Escucha*\nAcompañamiento con Daniela Ríos (Psicóloga · Bienestar Laboral)\n🔒 _Espacio confidencial · 100% virtual_\n\nTe enlazo con *Dani*, nuestra psicóloga del área de Bienestar. Ella te contactará por este mismo canal en breve.\n\n🔗 Sala virtual: https://meet.medicalsupplies.example.com/zona-escucha/dani\n\nSi lo prefieres, puedes escribirle directamente a *dani.rios@medicalsupplies.example.com*.\n\n*1.* Volver al menú principal\n*2.* Finalizar conversación`;
    }

    if (text === '3' || lower.includes('ver_todos')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `🎁 *Beneficios vigentes para colaboradores de Medical Supplies:*\n• Plan complementario de salud\n• Auxilio educativo para hijos\n• Día libre de cumpleaños\n• Descuentos con aliados comerciales\n• Programa de bienestar mental\n• Moneda de cultura\n• Zona de escucha (acompañamiento psicológico)\n\n🔗 Más información: https://medicalsupplies.example.com/beneficios\n\n` + getAfterActionPrompt();
    }

    if (text === '4' || lower.includes('volver')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_consultas' });
      return getConsultasMenuText(name);
    }
  }

  // moneda_menu & fecha
  if (state === 'moneda_menu') {
    if (text === '1' || lower.includes('reservar')) {
      sessionManager.updateSession(senderJid, { flowState: 'moneda_reservar_fecha' });
      return `Por favor escribe la *fecha solicitada* para redimir tu moneda de cultura en formato \`dd/mm/aaaa\` (ejemplo: *15/07/2026*):`;
    }
    sessionManager.updateSession(senderJid, { flowState: 'beneficios_menu' });
    return `*${session.employee?.nombre}*, estos son tus beneficios. ¿Cuál quieres explorar?\n\n*1.* 🪙 Moneda de cultura\n*2.* 🎧 Zona de escucha (virtual)\n*3.* Ver todos los beneficios\n*4.* Volver al menú de consultas`;
  }

  if (state === 'moneda_reservar_fecha') {
    const rad = generateRadicado('CULT');
    const name = session.employee?.nombre || 'Colaborador';
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return `¡Listo, *${name}*! Hemos reservado *1 moneda de cultura* para el día *${text}*.\n📌 *Radicado:* \`${rad}\`.\n\n` + getAfterActionPrompt();
  }

  if (state === 'zona_escucha') {
    if (text === '1' || lower.includes('menu')) {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return getMainMenuText();
    }
    sessionManager.updateSession(senderJid, { flowState: 'ended' });
    return getEndedMessage(session.employee?.nombre || '');
  }

  // -------------------------------------------------------------
  // 7.4 SUBMENÚ REPORTES (menu_reportes)
  // -------------------------------------------------------------
  if (state === 'menu_reportes') {
    const name = session.employee?.nombre || 'Colaborador';

    if (text === '1' || lower.includes('ausentismo')) {
      sessionManager.updateSession(senderJid, { flowState: 'ausentismo_tipo' });
      return `Has seleccionado: *Reportar un ausentismo*. Por favor selecciona el tipo:\n\n*1.* Incapacidad médica\n*2.* Cita médica\n*3.* Calamidad doméstica\n*4.* Permiso personal\n*5.* Otro motivo\n*6.* Volver al menú anterior`;
    }

    if (text === '2' || lower.includes('accidente')) {
      sessionManager.updateSession(senderJid, { flowState: 'accidente_info' });
      return `Has seleccionado: *Reportar un accidente de trabajo*.\n\n⚠️ *Si necesitas atención médica inmediata o tu salud está en riesgo, comunícate de inmediato con tu jefe directo, el área de SST o acude al centro médico correspondiente.*\n\nPor favor responde en un solo mensaje la siguiente información:\n• Fecha del accidente\n• Hora aproximada\n• Lugar donde ocurrió\n• Descripción breve de lo sucedido\n• Parte del cuerpo afectada\n• Nombre del jefe directo o persona informada`;
    }

    if (text === '3' || lower.includes('novedad')) {
      sessionManager.updateSession(senderJid, { flowState: 'novedad_tipo' });
      return `Has seleccionado: *Reportar una novedad de nómina*. Selecciona el tipo de novedad:\n\n*1.* Diferencia en el pago\n*2.* Descuento no reconocido\n*3.* Horas extras no reflejadas\n*4.* Incapacidad no registrada\n*5.* Auxilio o beneficio no reflejado\n*6.* Otro caso\n*7.* Volver al menú anterior`;
    }

    if (text === '4' || lower.includes('volver')) {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return getMainMenuText();
    }
  }

  // ausentismo multi-step
  if (state === 'ausentismo_tipo') {
    let tipo = text;
    if (text === '1') tipo = 'Incapacidad médica';
    if (text === '2') tipo = 'Cita médica';
    if (text === '3') tipo = 'Calamidad doméstica';
    if (text === '4') tipo = 'Permiso personal';
    if (text === '5') tipo = 'Otro motivo';
    if (text === '6' || lower.includes('volver')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_reportes' });
      return getReportesMenuText(session.employee?.nombre || 'Colaborador');
    }

    sessionManager.updateSession(senderJid, { flowState: 'ausentismo_inicio', tempData: { tipo } });
    return `Escribe la *fecha de inicio* del ausentismo en formato \`dd/mm/aaaa\` (ejemplo: *10/06/2026*):`;
  }

  if (state === 'ausentismo_inicio') {
    const temp = session.tempData || {};
    sessionManager.updateSession(senderJid, { flowState: 'ausentismo_fin', tempData: { ...temp, inicio: text } });
    return `Escribe la *fecha de finalización* del ausentismo en formato \`dd/mm/aaaa\` (ejemplo: *12/06/2026*):`;
  }

  if (state === 'ausentismo_fin') {
    const temp = session.tempData || {};
    sessionManager.updateSession(senderJid, { flowState: 'ausentismo_soporte', tempData: { ...temp, fin: text } });
    return `Escribe el *nombre del archivo o documento soporte* de la incapacidad/permiso (o escribe la palabra *omitir*):`;
  }

  if (state === 'ausentismo_soporte') {
    const temp = session.tempData || {};
    const rad = generateRadicado('AUS');
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return `✅ Ausentismo registrado correctamente.\n📌 *Radicado:* \`${rad}\`\n\n• *Tipo:* ${temp.tipo}\n• *Desde:* ${temp.inicio}\n• *Hasta:* ${temp.fin}\n• *Soporte:* ${text}\n\n` + getAfterActionPrompt();
  }

  // accidente_info
  if (state === 'accidente_info') {
    const rad = generateRadicado('AT');
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return `✅ Reporte de accidente de trabajo registrado de manera prioritaria.\n📌 *Radicado SST:* \`${rad}\`\n\nEl equipo de SST y la Brigada de Emergencia han sido notificados.\n\n` + getAfterActionPrompt();
  }

  // novedad multi-step
  if (state === 'novedad_tipo') {
    let tipo = text;
    if (text === '1') tipo = 'Diferencia en el pago';
    if (text === '2') tipo = 'Descuento no reconocido';
    if (text === '3') tipo = 'Horas extras no reflejadas';
    if (text === '4') tipo = 'Incapacidad no registrada';
    if (text === '5') tipo = 'Auxilio o beneficio no reflejado';
    if (text === '6') tipo = 'Otro caso';
    if (text === '7' || lower.includes('volver')) {
      sessionManager.updateSession(senderJid, { flowState: 'menu_reportes' });
      return getReportesMenuText(session.employee?.nombre || 'Colaborador');
    }

    sessionManager.updateSession(senderJid, { flowState: 'novedad_desc', tempData: { tipo } });
    return `Escribe una *descripción detallada* de la novedad de nómina observada:`;
  }

  if (state === 'novedad_desc') {
    const rad = generateRadicado('NOM');
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return `✅ Novedad de nómina radicada exitosamente.\n📌 *Radicado:* \`${rad}\`\nEl área de Nómina revisará tu caso y se comunicará contigo.\n\n` + getAfterActionPrompt();
  }

  // -------------------------------------------------------------
  // 7.5 SUBMENÚ INSTITUCIONAL (menu_institucional)
  // -------------------------------------------------------------
  if (state === 'menu_institucional') {
    if (text === '1' || lower.includes('rit')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `El *Reglamento Interno de Trabajo* contiene las normas, derechos, deberes y disposiciones que regulan la relación laboral dentro de Medical Supplies.\n🔗 https://medicalsupplies.example.com/rit.pdf\n\n` + getAfterActionPrompt();
    }
    if (text === '2' || lower.includes('etica')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `Este programa promueve una cultura basada en la integridad, la transparencia y el cumplimiento de las normas internas y externas.\n🔗 https://medicalsupplies.example.com/etica\n\n` + getAfterActionPrompt();
    }
    if (text === '3' || lower.includes('cocola')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `🤝 *Comité de Convivencia Laboral (COCOLA):*\n• Andrea Gómez (Presidenta)\n• Carlos Ramírez (Secretario)\n• Diana López (Vocal)\n• Jorge Pérez (Vocal)\n\n` + getAfterActionPrompt();
    }
    if (text === '4' || lower.includes('copasst')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `⛑️ *Comité Paritario SST (COPASST):*\n• Laura Martínez (Presidenta)\n• Mauricio Vega (Secretario)\n• Sandra Ríos (Vocal)\n• Felipe Torres (Vocal)\n\n` + getAfterActionPrompt();
    }
    if (text === '5' || lower.includes('brigada')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `🚑 *Brigada de Emergencias:*\n• Jefe de brigada: Andrés Mejía\n• Primeros auxilios: Paula Niño\n• Evacuación: Camilo Suárez\n• Control de incendios: Natalia Acosta\n\n` + getAfterActionPrompt();
    }
    if (text === '6' || lower.includes('boletin')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `📰 Conoce el último boletín institucional:\n🔗 https://medicalsupplies.example.com/boletin\n\n` + getAfterActionPrompt();
    }
    if (text === '7' || lower.includes('calendario')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `📅 Calendario institucional activo:\n🔗 https://medicalsupplies.example.com/calendario\n\n` + getAfterActionPrompt();
    }
    if (text === '8' || lower.includes('volver')) {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return getMainMenuText();
    }
  }

  // -------------------------------------------------------------
  // 7.6 SUBMENÚ EVENTOS (menu_eventos)
  // -------------------------------------------------------------
  if (state === 'menu_eventos') {
    if (text === '1' || lower.includes('bienestar')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `🌿 *Próximos Eventos de Bienestar:*\n• Pausa activa guiada — 📅 12/06/2026 10:00 a.m. — Auditorio principal\n• 🧘 Taller de manejo del estrés — 📅 20/06/2026 3:00 p.m. — Virtual (Zoom)\n\n` + getAfterActionPrompt();
    }
    if (text === '2' || lower.includes('formacion')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `📚 *Próximas Capacitaciones:*\n• 📘 Excel Avanzado — 15/06/2026 2:00 p.m. — 💻 Virtual\n• 🛡️ Protección de datos personales — 25/06/2026 9:00 a.m. — Híbrida\n\n` + getAfterActionPrompt();
    }
    if (text === '3' || lower.includes('sst')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `🦺 *Eventos SST:*\n• Simulacro de evacuación — 18/06/2026 11:00 a.m. — Sede principal\n• 🚑 Capacitación en primeros auxilios — 28/06/2026 10:00 a.m. — Auditorio principal\n\n` + getAfterActionPrompt();
    }
    if (text === '4' || lower.includes('calendario')) {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return `📅 *Calendario General:* https://medicalsupplies.example.com/calendario\n\n` + getAfterActionPrompt();
    }
    if (text === '5' || lower.includes('volver')) {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return getMainMenuText();
    }
  }

  // -------------------------------------------------------------
  // 7.7 RUTA EXTERNO: ext_consent & ext_menu
  // -------------------------------------------------------------
  if (state === 'ext_consent') {
    if (text === '1' || lower.includes('si') || lower.includes('sí')) {
      sessionManager.updateSession(senderJid, { flowState: 'ext_menu', currentCategory: 'external' });
      return `Gracias por tu autorización. Por favor selecciona la opción que deseas gestionar:\n\n*1.* Conocer convocatorias laborales abiertas (Vacantes)\n*2.* Solicitar certificado laboral (Excolaboradores)\n*3.* Hacer seguimiento a mi proceso de selección\n*4.* Finalizar conversación`;
    }

    if (text === '2' || lower.includes('no')) {
      sessionManager.updateSession(senderJid, { flowState: 'ext_denied' });
      return `Entendemos tu decisión. Para proteger tus datos, no podemos continuar la atención por este canal automatizado.\nPuedes contactar directamente a *recepción* en nuestras oficinas físicas. ¡Feliz día!`;
    }

    return `Por favor selecciona una opción válida:\n\n*1.* Sí, autorizo\n*2.* No autorizo`;
  }

  if (state === 'ext_menu') {
    if (text === '1' || lower.includes('vacante')) {
      sessionManager.updateSession(senderJid, { flowState: 'ext_vacantes' });
      return `Currently tenemos vacantes disponibles en nuestras diferentes áreas. Puedes consultar los perfiles y postularte en nuestro portal de empleo autorizado:\n\n🔗 https://medicalsupplies.example.com/empleos\n\n*1.* Volver al menú de externos\n*2.* Finalizar conversación`;
    }

    if (text === '2' || lower.includes('cert')) {
      sessionManager.updateSession(senderJid, { flowState: 'ext_cert_cedula' });
      return `Por favor ingresa tu *número de cédula* sin puntos ni espacios para verificar tu histórico de excolaborador:`;
    }

    if (text === '3' || lower.includes('seguimiento')) {
      sessionManager.updateSession(senderJid, { flowState: 'ext_seguimiento_cedula' });
      return `Por favor ingresa tu *número de cédula* sin puntos ni espacios para consultar tu proceso de selección:`;
    }

    if (text === '4' || lower.includes('finalizar')) {
      sessionManager.updateSession(senderJid, { flowState: 'ended' });
      return getEndedMessage('');
    }
  }

  if (state === 'ext_vacantes') {
    if (text === '1' || lower.includes('menu') || lower.includes('volver')) {
      sessionManager.updateSession(senderJid, { flowState: 'ext_menu' });
      return getExternosMenuText();
    }
    sessionManager.updateSession(senderJid, { flowState: 'ended' });
    return getEndedMessage('');
  }

  if (state === 'ext_cert_cedula') {
    const valResult = validateCedula(text);
    if (!valResult.valid) {
      return valResult.error;
    }
    const ced = valResult.cedula;
    const ex = MOCK_EXCOLABORADORES[ced];

    if (ex) {
      sessionManager.updateSession(senderJid, { flowState: 'ext_menu' });
      return `✅ Registro encontrado:\n• *Nombre:* ${ex.nombre}\n• *Cargo final:* ${ex.cargoFinal}\n• *Periodo:* ${ex.periodo}\n\nDescarga tu certificado histórico aquí:\n🔗 https://medicalsupplies.example.com/certificados-hist/${ced}.pdf\n\n¿Deseas realizar otra consulta?`;
    } else {
      sessionManager.updateSession(senderJid, { flowState: 'ext_cert_escalado', tempData: { cedula: ced } });
      return `No hemos encontrado un registro automático inmediato.\nPor favor, escribe tu *nombre completo* y un *correo electrónico* de contacto en un solo mensaje para escalar tu caso con un analista.`;
    }
  }

  if (state === 'ext_cert_escalado') {
    const rad = generateRadicado('EXT-CERT');
    sessionManager.updateSession(senderJid, { flowState: 'ext_menu' });
    return `✅ Caso escalado con éxito.\n📌 *Radicado:* \`${rad}\`\nTe enviaremos el documento en un plazo máximo de *3 días hábiles* al correo suministrado.\n\n¿Deseas realizar otra consulta?\n\n` + getExternosMenuText();
  }

  if (state === 'ext_seguimiento_cedula') {
    const valResult = validateCedula(text);
    if (!valResult.valid) {
      return valResult.error;
    }
    const ced = valResult.cedula;
    const cand = MOCK_CANDIDATOS[ced];

    sessionManager.updateSession(senderJid, { flowState: 'ext_menu' });

    if (!cand) {
      return `No encontramos un proceso de selección asociado a esta cédula.\n🔗 Conoce nuevas vacantes en: https://medicalsupplies.example.com/empleos\n\n¿Deseas realizar otra consulta?\n\n` + getExternosMenuText();
    }

    if (cand.activo) {
      return `Hola, *${cand.nombre}*. Actualmente te encuentras *activo* en el proceso para la vacante de *${cand.vacante}*.\n*Estado actual:* ${cand.etapa}.\nNuestro equipo de Selección se pondrá en contacto contigo si avanzas a la siguiente etapa. ¡Muchos éxitos!\n\n¿Deseas realizar otra consulta?\n\n` + getExternosMenuText();
    } else {
      return `Hola, *${cand.nombre}*. Agradecemos tu postulación para la vacante de *${cand.vacante}*.\nEn esta ocasión, el proceso ha avanzado con otro perfil que se ajustaba con mayor exactitud a los requerimientos... Mantendremos tu hoja de vida en nuestra base de datos para futuras oportunidades.\n\n¿Deseas realizar otra consulta?\n\n` + getExternosMenuText();
    }
  }

  // -------------------------------------------------------------
  // 7.8 after_action
  // -------------------------------------------------------------
  if (state === 'after_action') {
    if (text === '1' || lower.includes('menu')) {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return getMainMenuText();
    }
    if (text === '2' || lower.includes('finalizar')) {
      sessionManager.updateSession(senderJid, { flowState: 'ended' });
      return getEndedMessage(session.employee?.nombre || '');
    }
    return `¿Deseas realizar otra solicitud?\n\n*1.* Sí, volver al menú principal\n*2.* No, finalizar conversación`;
  }

  // Fallback
  return `La opción ingresada no es válida. Por favor selecciona una de las opciones disponibles en el menú.\n\n` + getMainMenuText();
}

// MESSAGES & PROMPTS SPECIFICATION MATCH (§7)
function getM01Welcome() {
  return `Hola, bienvenido al canal institucional de *Talento Humano* de Medical Supplies.\n\nSoy tu asistente virtual de Talento Humano y estoy aquí para ayudarte con consultas, reportes y solicitudes.\n\nPara brindarte una mejor atención, por favor selecciona tu perfil:\n\n*1.* Soy Colaborador Activo de Medical Supplies\n*2.* Soy Personal Externo (candidatos, excolaboradores o terceros)`;
}

function getMainMenuText() {
  return `*1.* Realizar una consulta\n*2.* Reportar una novedad o situación\n*3.* Consultar información institucional\n*4.* Ver eventos, bienestar y formación\n*5.* Finalizar conversación`;
}

function getConsultasMenuText(name) {
  return `*${name}*, selecciona la consulta que deseas realizar:\n\n*1.* Comprobante de nómina\n*2.* Certificado laboral\n*3.* Saldos de vacaciones\n*4.* Fecha de vencimiento de mi contrato\n*5.* Descargar planilla de seguridad social\n*6.* Retiro de cesantías\n*7.* Resultado de evaluación de desempeño\n*8.* Beneficios\n*9.* Volver al menú anterior`;
}

function getReportesMenuText(name) {
  return `*${name}*, selecciona el reporte que deseas realizar:\n\n*1.* Reportar un ausentismo\n*2.* Reportar un accidente de trabajo\n*3.* Reportar una novedad de nómina\n*4.* Volver al menú anterior`;
}

function getInstitucionalMenuText(name) {
  return `*${name}*, selecciona la información que deseas consultar:\n\n*1.* Conoce el RIT\n*2.* Programa de Transparencia y Ética\n*3.* Miembros COCOLA\n*4.* Miembros COPASST\n*5.* Miembros Brigada de Emergencia\n*6.* Boletín institucional\n*7.* Conoce el calendario interno\n*8.* Volver al menú anterior`;
}

function getEventosMenuText(name) {
  return `*${name}*, selecciona la información de eventos que deseas consultar:\n\n*1.* Próximos eventos de bienestar\n*2.* Próximos eventos de formación\n*3.* Eventos SST\n*4.* Conoce el calendario interno\n*5.* Volver al menú anterior`;
}

function getExternosMenuText() {
  return `Por favor selecciona la opción que deseas gestionar:\n\n*1.* Conocer convocatorias laborales abiertas (Vacantes)\n*2.* Solicitar certificado laboral (Excolaboradores)\n*3.* Hacer seguimiento a mi proceso de selección\n*4.* Finalizar conversación`;
}

function getAfterActionPrompt() {
  return `¿Deseas realizar otra solicitud?\n\n*1.* Sí, volver al menú principal\n*2.* No, finalizar conversación`;
}

function getEndedMessage(name) {
  return `Gracias por comunicarte con el *asistente virtual de Talento Humano* de Medical Supplies${name ? `, *${name}*` : ''}.\n\nTu solicitud ha sido gestionada correctamente.\n\nRecuerda que este canal está disponible para apoyarte con consultas, reportes y trámites internos.\n\nQue tengas un excelente día. 👋`;
}

module.exports = {
  processWhatsAppMessage,
  getM01Welcome
};
