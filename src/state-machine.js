const sessionManager = require('./session-manager');

// LOGO OFICIAL DE MEDICAL SUPPLIES CORP (mscorp.com.co)
const COMPANY_LOGO_URL = 'https://mscorp.com.co/wp-content/uploads/2025/11/Logo.png';

// 3. MOCK DATA ACCORDING TO SPECIFICATION & REAL CORPORATE INFO (mscorp.com.co)
const MOCK_COLABORADORES = {
  '1010101010': { nombre: 'Laura Martínez', cargo: 'Analista de Compras Insumos Médicos', venceContrato: '31/12/2026', vacacionesDias: 12, fechaCorte: '30/11/2026', evaluacion: 'Sobresaliente (92/100)', monedasCultura: 8, activo: true },
  '2020202020': { nombre: 'Carlos Ramírez', cargo: 'Auxiliar de Bodega Dispositivos', venceContrato: '15/08/2026', vacacionesDias: 5, fechaCorte: '30/11/2026', evaluacion: 'Satisfactorio (81/100)', monedasCultura: 8, activo: true },
  '3030303030': { nombre: 'Andrea Gómez', cargo: 'Coordinadora Comercial MS Corp', venceContrato: 'Indefinido', vacacionesDias: 20, fechaCorte: '30/11/2026', evaluacion: 'Excelente (96/100)', monedasCultura: 8, activo: true },
  '4040404040': { nombre: 'Colaborador Inactivo', cargo: 'Sin cargo', activo: false }
};

const MOCK_EXCOLABORADORES = {
  '5050505050': { nombre: 'María Fernanda Ruiz', cargoFinal: 'Auxiliar Administrativa', periodo: '15/03/2021 – 30/09/2024' },
  '6060606060': { nombre: 'Juan Camilo Herrera', cargoFinal: 'Asesor Comercial', periodo: '01/06/2019 – 15/01/2025' }
};

const MOCK_CANDIDATOS = {
  '7070707070': { nombre: 'Diana Salazar', vacante: 'Analista de Talento Humano MS Corp', activo: true, etapa: 'Pruebas técnicas' },
  '8080808080': { nombre: 'Sebastián Ortiz', vacante: 'Coordinador Logístico de Dispositivos', activo: false, etapa: 'Proceso finalizado' }
};

// HELPER FOR FLEXIBLE OPTION MATCHING (NUMBERS, KEYWORDS & EMOJIS)
function matchInput(rawInput, mappings) {
  if (!rawInput) return null;
  const clean = rawInput.trim().toLowerCase();

  // Si el texto ingresado es un número de cédula válido (6 a 10 dígitos), NO matchear con opciones de menú como "1"
  if (/^\d{6,10}$/.test(clean)) {
    return null;
  }

  for (const [key, aliases] of Object.entries(mappings)) {
    if (aliases.some(alias => clean === alias || (alias.length > 2 && clean.includes(alias)))) {
      return key;
    }
  }
  return null;
}

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

// FORMAT RESPONSE (RETURNS OBJECT WITH TEXT AND OPTIONAL IMAGE URL)
function formatResponse(text, sendImage = false) {
  return {
    text,
    imageUrl: sendImage ? COMPANY_LOGO_URL : null
  };
}

// 7. STATE MACHINE MAIN HANDLER (§7)
function processWhatsAppMessage(senderJid, textInput) {
  const session = sessionManager.getSession(senderJid);
  const text = (textInput || '').trim();
  const lower = text.toLowerCase();

  // Reset or Global restart triggers
  if (lower === 'reiniciar' || lower === 'reset') {
    sessionManager.resetSession(senderJid);
    return formatResponse(getM01Welcome(), true);
  }

  // If conversation already ended and user types anything, restart with welcome
  if (session.flowState === 'ended' || session.flowState === 'not_active' || session.flowState === 'consent_denied' || session.flowState === 'ext_denied') {
    sessionManager.resetSession(senderJid);
    return formatResponse(getM01Welcome(), true);
  }

  const state = session.flowState;

  // -------------------------------------------------------------
  // 7.1 welcome / profile_select
  // -------------------------------------------------------------
  if (state === 'welcome' || state === 'profile_select' || state === 'ask_user_type') {
    const profileChoice = matchInput(text, {
      colaborador: ['1', 'colaborador', 'empleado', 'activo', '👨‍💼', '💼', '🙋‍♂️', '🙋‍♀️'],
      externo: ['2', 'externo', 'candidato', 'excolaborador', 'tercero', '👥', '🌐', '👤']
    });

    if (profileChoice === 'colaborador') {
      sessionManager.updateSession(senderJid, { flowState: 'ask_cedula', profile: 'colaborador' });
      return formatResponse(`👨‍💼 *Identificación de Colaborador MS Corp*\n\nPara continuar, por favor ingresa tu *número de cédula* (entre 6 y 10 dígitos, solo números, sin puntos ni espacios).\n\n_Ejemplo: 1010101010_`);
    }

    if (profileChoice === 'externo') {
      sessionManager.updateSession(senderJid, { flowState: 'ext_consent', profile: 'externo' });
      return formatResponse(`👥 *Portal Institucional de Personal Externo*\n\nBienvenido a Medical Supplies Corp (mscorp.com.co).\nPara gestionar tu solicitud, requerimos procesar tus datos bajo nuestra *política de tratamiento de datos personales* (Ley 1581 de 2012).\n\n¿Autorizas el tratamiento de tus datos para continuar?\n\nPuedes responder enviando el *número*, *emoji* o la *palabra clave*:\n\n*1.* ✅ Sí, autorizo\n*2.* ❌ No autorizo`);
    }

    return formatResponse(getM01Welcome(), true);
  }

  // -------------------------------------------------------------
  // 7.2 RUTA COLABORADOR: ask_cedula & validating (CON UNIFICACIÓN DE CADENA)
  // -------------------------------------------------------------
  if (state === 'ask_cedula') {
    // BUGFIX: Si el usuario vuelve a enviar "1", "colaborador" o saludos mientras está en ask_cedula,
    // NO tratar "1" como error de cédula corta ni trabar la cadena de mensajes.
    const optionRepeat = matchInput(text, {
      colaborador: ['1', 'colaborador', 'empleado', '👨‍💼', '💼'],
      greeting: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', '👋']
    });

    if (optionRepeat) {
      return formatResponse(`📌 *Identificación de Colaborador MS Corp*\n\nEstamos esperando tu *número de cédula* para validar tu perfil de empleado activo.\n\nPor favor ingresa únicamente los dígitos de tu cédula (ej. *1010101010*):`);
    }

    const valResult = validateCedula(text);
    if (!valResult.valid) {
      return formatResponse(valResult.error);
    }

    const cedula = valResult.cedula;
    const emp = MOCK_COLABORADORES[cedula];

    if (!emp || !emp.activo) {
      sessionManager.updateSession(senderJid, { flowState: 'not_active' });
      return formatResponse(`🚫 *Consulta de Colaborador*\n\nNo encontramos un colaborador activo asociado al número de cédula *${cedula}*.\n\nPor seguridad, este canal está habilitado únicamente para *empleados activos* de Medical Supplies Corp (https://mscorp.com.co).\n\nSi consideras que esto es un error, por favor comunícate directamente con el área de *Talento Humano*.`);
    }

    sessionManager.updateSession(senderJid, {
      flowState: 'data_consent',
      employee: { ...emp, cedula }
    });

    return formatResponse(`✅ *Validación Exitosa*\n\nHola, *${emp.nombre}* (${emp.cargo}). Hemos verificado tu registro en MS Corp.\n\nAntes de continuar, necesitamos tu autorización para el *tratamiento de datos personales*.\nMedical Supplies tratará tus datos únicamente para gestionar tus consultas, solicitudes, reportes y trámites internos relacionados con Talento Humano.\n\n¿Autorizas el tratamiento de tus datos personales para continuar?\n\nPuedes responder enviando el *número*, *emoji* o la *palabra clave*:\n\n*1.* ✅ Sí, autorizo\n*2.* ❌ No autorizo`);
  }

  // data_consent
  if (state === 'data_consent') {
    const consentChoice = matchInput(text, {
      yes: ['1', 'si', 'sí', 'autorizo', 'acepto', '✅', '👍', '✔️'],
      no: ['2', 'no', 'rechazo', 'denegar', '❌', '👎', '✖️']
    });

    if (consentChoice === 'yes') {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu', currentCategory: 'menu_principal' });
      const name = session.employee?.nombre || 'Colaborador';
      return formatResponse(`Gracias, *${name}*. Tu autorización ha sido registrada.\n\n*${name}*, selecciona la opción que deseas realizar:\n\n` + getMainMenuText(), true);
    }

    if (consentChoice === 'no') {
      sessionManager.updateSession(senderJid, { flowState: 'consent_denied' });
      return formatResponse(`Entendemos tu decisión.\nPara proteger tus datos personales, no podremos continuar con la atención por este canal automatizado.\nSi necesitas apoyo, puedes comunicarte directamente con el área de *Talento Humano* de Medical Supplies Corp (https://mscorp.com.co).\nGracias por contactarnos.`);
    }

    return formatResponse(`Por favor selecciona una opción válida:\n\n*1.* ✅ Sí, autorizo\n*2.* ❌ No autorizo`);
  }

  // -------------------------------------------------------------
  // 7.2 main_menu (post-consentimiento)
  // -------------------------------------------------------------
  if (state === 'main_menu' || lower === 'menu') {
    const name = session.employee?.nombre || 'Colaborador';

    const menuChoice = matchInput(text, {
      consulta: ['1', 'consulta', 'consultas', 'comprobante', 'vacaciones', 'nómina', 'nomina', '📄', '📋', '🔍'],
      reporte: ['2', 'reporte', 'reportes', 'novedad', 'accidente', 'ausentismo', '⚠️', '🚨', '📝', '⚡'],
      institucional: ['3', 'institucional', 'rit', 'copasst', 'cocola', 'brigada', 'boletin', 'boletín', '🏢', '🏛️', '📜'],
      eventos: ['4', 'evento', 'eventos', 'bienestar', 'formacion', 'formación', 'calendario', '🎉', '📅', '🎓', '🧘'],
      finalizar: ['5', 'finalizar', 'salir', 'terminar', 'adios', 'adiós', 'chao', 'gracias', '❌', '🚪', '👋']
    });

    if (menuChoice === 'consulta') {
      sessionManager.updateSession(senderJid, { flowState: 'menu_consultas', currentCategory: 'payroll' });
      return formatResponse(getConsultasMenuText(name));
    }

    if (menuChoice === 'reporte') {
      sessionManager.updateSession(senderJid, { flowState: 'menu_reportes', currentCategory: 'accident' });
      return formatResponse(getReportesMenuText(name));
    }

    if (menuChoice === 'institucional') {
      sessionManager.updateSession(senderJid, { flowState: 'menu_institucional', currentCategory: 'ethics' });
      return formatResponse(getInstitucionalMenuText(name));
    }

    if (menuChoice === 'eventos') {
      sessionManager.updateSession(senderJid, { flowState: 'menu_eventos', currentCategory: 'events' });
      return formatResponse(getEventosMenuText(name));
    }

    if (menuChoice === 'finalizar') {
      sessionManager.updateSession(senderJid, { flowState: 'ended' });
      return formatResponse(getEndedMessage(name));
    }

    return formatResponse(`La opción ingresada no es válida. Por favor selecciona una de las opciones disponibles enviando el *número* (1-5), el *emoji* o la *palabra clave*:\n\n` + getMainMenuText());
  }

  // -------------------------------------------------------------
  // 7.3 SUBMENÚ CONSULTAS (menu_consultas)
  // -------------------------------------------------------------
  if (state === 'menu_consultas') {
    const name = session.employee?.nombre || 'Colaborador';

    const consultaChoice = matchInput(text, {
      comprobante: ['1', 'comprobante', 'desprendible', 'recibo'],
      certificado: ['2', 'certificado', 'laboral', 'carta'],
      vacaciones: ['3', 'vacaciones', 'saldo', 'descanso', '🌴'],
      contrato: ['4', 'contrato', 'vencimiento', 'fecha'],
      planilla: ['5', 'planilla', 'seguridad social', 'eps', 'arl'],
      cesantias: ['6', 'cesantias', 'cesantías', 'retiro', '💰'],
      evaluacion: ['7', 'evaluacion', 'evaluación', 'desempeño', '🏆'],
      beneficios: ['8', 'beneficio', 'beneficios', 'moneda', 'escucha', '🎁'],
      volver: ['9', 'volver', 'menu', 'atras', 'atrás', '⬅️']
    });

    if (consultaChoice === 'comprobante') {
      sessionManager.updateSession(senderJid, { flowState: 'sub_comprobante' });
      return formatResponse(`📄 *Comprobante de Nómina*\n\nPor favor selecciona el periodo deseado enviando el *número* o *emoji*:\n\n*1.* 📑 Último comprobante disponible\n*2.* 📅 Comprobante de un mes específico\n*3.* ⬅️ Volver al menú anterior`);
    }

    if (consultaChoice === 'certificado') {
      sessionManager.updateSession(senderJid, { flowState: 'sub_certificado' });
      return formatResponse(`📋 *Certificado Laboral MS Corp*\n\nSelecciona el tipo de certificado requerido:\n\n*1.* 📄 Certificado laboral general\n*2.* 💵 Certificado con salario\n*3.* 🏛️ Certificado dirigido a una entidad específica\n*4.* ⬅️ Volver al menú anterior`);
    }

    if (consultaChoice === 'vacaciones') {
      sessionManager.updateSession(senderJid, { flowState: 'vacaciones_ask' });
      const dias = session.employee?.vacacionesDias || 12;
      const corte = session.employee?.fechaCorte || '30/11/2026';
      return formatResponse(`🌴 *Saldos de Vacaciones Medical Supplies*\n\nHola, *${name}*. Consultamos tu saldo oficial:\n\n📊 *${dias} ${dias === 1 ? 'día disponible' : 'días disponibles'}*\n📅 Fecha de corte: ${corte}\n💡 _Recuerda coordinar con tu jefe directo antes de solicitar fechas._\n\n¿Deseas descargar el formato de solicitud?\n\n*1.* ✅ Sí, quiero programarlas\n*2.* ❌ Aún no`);
    }

    if (consultaChoice === 'contrato') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      const fecha = session.employee?.venceContrato || '31/12/2026';
      return formatResponse(`📄 *Información de Contrato MS Corp*\n\n*${name}*, la fecha registrada para la terminación/renovación de tu contrato es: 📅 *${fecha}*.\n\n` + getAfterActionPrompt());
    }

    if (consultaChoice === 'planilla') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`✅ *Planilla de Seguridad Social*\n\nTu planilla integrada de liquidación aportes está disponible para descarga en el portal oficial:\n🔗 https://mscorp.com.co/\n\n` + getAfterActionPrompt());
    }

    if (consultaChoice === 'cesantias') {
      sessionManager.updateSession(senderJid, { flowState: 'sub_cesantias' });
      return formatResponse(`💰 *Retiro de Cesantías MS Corp*\n\nPor favor selecciona el motivo del retiro:\n\n*1.* 🏠 Vivienda (compra, mejora o liberación de hipoteca)\n*2.* 🎓 Educación (superior o técnica)\n*3.* 📄 Terminación de contrato\n*4.* 📋 Otro motivo\n*5.* ⬅️ Volver al menú anterior`);
    }

    if (consultaChoice === 'evaluacion') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      const ev = session.employee?.evaluacion || 'Sobresaliente (92/100)';
      return formatResponse(`📊 *Evaluación de Desempeño MS Corp*\n\n• *Periodo evaluado:* 2025-2026\n• *Calificación obtenida:* 🏆 *${ev}*\n\n` + getAfterActionPrompt());
    }

    if (consultaChoice === 'beneficios') {
      sessionManager.updateSession(senderJid, { flowState: 'beneficios_menu' });
      return formatResponse(`🎁 *Beneficios Corporativos Medical Supplies*\n\n*${name}*, estos son tus beneficios disponibles. ¿Cuál deseas explorar?\n\n*1.* 🪙 Moneda de cultura\n*2.* 🎧 Zona de escucha (acompañamiento psicológico virtual)\n*3.* 🌟 Ver todos los beneficios corporativos\n*4.* ⬅️ Volver al menú de consultas`);
    }

    if (consultaChoice === 'volver') {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return formatResponse(getMainMenuText());
    }
  }

  // sub_comprobante
  if (state === 'sub_comprobante') {
    if (text === '1' || lower.includes('ultimo') || lower.includes('último') || text === '📑') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`📄 Tu desprendible de nómina más reciente está disponible para descarga en:\n🔗 https://mscorp.com.co/\n\n` + getAfterActionPrompt());
    }
    if (text === '2' || lower.includes('mes') || text === '📅') {
      sessionManager.updateSession(senderJid, { flowState: 'comprobante_mes' });
      return formatResponse(`Por favor escribe el *mes y año* del comprobante que requieres (ejemplo: *mayo 2026*):`);
    }
    if (text === '3' || lower.includes('volver') || text === '⬅️') {
      sessionManager.updateSession(senderJid, { flowState: 'menu_consultas' });
      return formatResponse(getConsultasMenuText(session.employee?.nombre || 'Colaborador'));
    }
  }

  if (state === 'comprobante_mes') {
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return formatResponse(`📄 Tu desprendible de nómina correspondiente a *${text}* está disponible para descarga en:\n🔗 https://mscorp.com.co/\n\n` + getAfterActionPrompt());
  }

  // sub_certificado
  if (state === 'sub_certificado') {
    if (text === '1' || text === '2' || lower.includes('general') || lower.includes('salario') || text === '📄' || text === '💵') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`✅ Tu certificado laboral ha sido generado exitosamente y se encuentra listo para descarga en:\n🔗 https://mscorp.com.co/\n\n` + getAfterActionPrompt());
    }
    if (text === '3' || lower.includes('entidad') || text === '🏛️') {
      sessionManager.updateSession(senderJid, { flowState: 'certificado_entidad' });
      return formatResponse(`Por favor escribe el *nombre completo de la entidad* a la cual va dirigido el certificado laboral:`);
    }
    if (text === '4' || lower.includes('volver') || text === '⬅️') {
      sessionManager.updateSession(senderJid, { flowState: 'menu_consultas' });
      return formatResponse(getConsultasMenuText(session.employee?.nombre || 'Colaborador'));
    }
  }

  if (state === 'certificado_entidad') {
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return formatResponse(`✅ Tu certificado laboral personalizado dirigido a *${text}* está disponible para descarga en:\n🔗 https://mscorp.com.co/\n\n` + getAfterActionPrompt());
  }

  // vacaciones_ask
  if (state === 'vacaciones_ask') {
    const name = session.employee?.nombre || 'Colaborador';
    const choice = matchInput(text, {
      yes: ['1', 'si', 'sí', 'quiero', '✅', '👍'],
      no: ['2', 'no', 'aun no', 'aún no', '❌', '👎']
    });

    if (choice === 'yes') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`📄 Excelente. Puedes descargar e imprimir el formato oficial de solicitud de vacaciones en el siguiente enlace:\n🔗 https://mscorp.com.co/\n\n` + getAfterActionPrompt());
    }
    if (choice === 'no') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`Perfecto, *${name}*. Cuando tengas listas tus fechas de descanso puedes volver a este canal para descargar tu formato.\n\n` + getAfterActionPrompt());
    }
  }

  // sub_cesantias
  if (state === 'sub_cesantias') {
    let requisitos = '';
    const choice = matchInput(text, {
      vivienda: ['1', 'vivienda', 'casa', '🏠'],
      educacion: ['2', 'educacion', 'educación', 'estudio', '🎓'],
      terminacion: ['3', 'terminacion', 'terminación', 'contrato', '📄'],
      otro: ['4', 'otro', 'motivo', '📋'],
      volver: ['5', 'volver', 'menu', '⬅️']
    });

    if (choice === 'vivienda') {
      requisitos = `• Promesa de compraventa o escritura del inmueble\n• Certificado de tradición y libertad (no mayor a 30 días)\n• Carta de solicitud firmada`;
    } else if (choice === 'educacion') {
      requisitos = `• Recibo de matrícula o factura de pago\n• Certificado de matrícula vigente\n• Carta de solicitud firmada`;
    } else if (choice === 'terminacion') {
      requisitos = `• Carta de retiro o terminación de contrato\n• Paz y salvo institucional MS Corp`;
    } else if (choice === 'otro') {
      requisitos = `• Carta explicativa del motivo\n• Soportes correspondientes según el caso`;
    } else if (choice === 'volver') {
      sessionManager.updateSession(senderJid, { flowState: 'menu_consultas' });
      return formatResponse(getConsultasMenuText(session.employee?.nombre || 'Colaborador'));
    }

    if (requisitos) {
      sessionManager.updateSession(senderJid, { flowState: 'cesantias_iniciar', tempData: { motivo: text } });
      return formatResponse(`📌 *Requisitos para Retiro de Cesantías:*\n\n${requisitos}\n\n¿Deseas iniciar el trámite de retiro?\n\n*1.* ✅ Sí, iniciar solicitud\n*2.* ⬅️ No, volver al menú principal`);
    }
  }

  if (state === 'cesantias_iniciar') {
    const choice = matchInput(text, {
      yes: ['1', 'si', 'sí', 'iniciar', '✅', '👍'],
      no: ['2', 'no', 'volver', '⬅️', '❌']
    });

    if (choice === 'yes') {
      const rad = generateRadicado('CES');
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`✅ Solicitud de retiro de cesantías radicada exitosamente.\n📌 *Radicado:* \`${rad}\`\n\nRecibirás las instrucciones de entrega de documentos soporte en tu correo corporativo MS Corp.\n\n` + getAfterActionPrompt());
    }
    sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
    return formatResponse(getMainMenuText());
  }

  // beneficios_menu
  if (state === 'beneficios_menu') {
    const name = session.employee?.nombre || 'Colaborador';
    const choice = matchInput(text, {
      moneda: ['1', 'moneda', 'cultura', '🪙'],
      escucha: ['2', 'escucha', 'psicologa', 'psicóloga', '🎧'],
      todos: ['3', 'todos', 'ver', '🌟'],
      volver: ['4', 'volver', 'consultas', '⬅️']
    });

    if (choice === 'moneda') {
      sessionManager.updateSession(senderJid, { flowState: 'moneda_menu' });
      const mon = session.employee?.monedasCultura || 8;
      return formatResponse(`🪙 *Moneda de Cultura Medical Supplies*\n\n📊 *${mon} ${mon === 1 ? 'moneda disponible' : 'monedas disponibles'}*\n📅 Vigencia: 31/12/2026\n💡 _Redimible en actividades culturales y de integración corporativa._\n\n¿Deseas reservar 1 moneda?\n\n*1.* 🪙 Reservar 1 moneda de cultura\n*2.* ⬅️ Volver al menú de beneficios`);
    }

    if (choice === 'escucha') {
      sessionManager.updateSession(senderJid, { flowState: 'zona_escucha' });
      return formatResponse(`🎧 *Zona de Escucha Virtual*\nAcompañamiento personal con Daniela Ríos (Psicóloga · Bienestar Laboral Medical Supplies Corp)\n🔒 _Espacio 100% confidencial_\n\nTe estamos enlazando con *Dani*. Ella te responderá por este canal en breve.\n\n🔗 Sala virtual: https://mscorp.com.co/\n\n*1.* 🏠 Volver al menú principal\n*2.* 🚪 Finalizar conversación`);
    }

    if (choice === 'todos') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`🎁 *Beneficios Corporativos MS Corp:*\n• Plan complementario de salud\n• Auxilio educativo para hijos\n• Día libre de cumpleaños\n• Descuentos con aliados comerciales (Fundación Santa Fe, Shaio, Las Américas, etc.)\n• Programa de bienestar mental\n• Moneda de cultura\n• Zona de escucha (acompañamiento psicológico)\n\n🔗 Más información: https://mscorp.com.co/\n\n` + getAfterActionPrompt());
    }

    if (choice === 'volver') {
      sessionManager.updateSession(senderJid, { flowState: 'menu_consultas' });
      return formatResponse(getConsultasMenuText(name));
    }
  }

  // moneda_menu & fecha
  if (state === 'moneda_menu') {
    if (text === '1' || lower.includes('reservar') || text === '🪙') {
      sessionManager.updateSession(senderJid, { flowState: 'moneda_reservar_fecha' });
      return formatResponse(`Por favor escribe la *fecha solicitada* para redimir tu moneda de cultura en formato \`dd/mm/aaaa\` (ejemplo: *15/07/2026*):`);
    }
    sessionManager.updateSession(senderJid, { flowState: 'beneficios_menu' });
    return formatResponse(`*${session.employee?.nombre}*, estos son tus beneficios. ¿Cuál quieres explorar?\n\n*1.* 🪙 Moneda de cultura\n*2.* 🎧 Zona de escucha (virtual)\n*3.* 🌟 Ver todos los beneficios\n*4.* ⬅️ Volver al menú de consultas`);
  }

  if (state === 'moneda_reservar_fecha') {
    const rad = generateRadicado('CULT');
    const name = session.employee?.nombre || 'Colaborador';
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return formatResponse(`¡Listo, *${name}*! Hemos reservado *1 moneda de cultura* para el día *${text}*.\n📌 *Radicado:* \`${rad}\`.\n\n` + getAfterActionPrompt());
  }

  if (state === 'zona_escucha') {
    if (text === '1' || lower.includes('menu') || text === '🏠') {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return formatResponse(getMainMenuText());
    }
    sessionManager.updateSession(senderJid, { flowState: 'ended' });
    return formatResponse(getEndedMessage(session.employee?.nombre || ''));
  }

  // -------------------------------------------------------------
  // 7.4 SUBMENÚ REPORTES (menu_reportes)
  // -------------------------------------------------------------
  if (state === 'menu_reportes') {
    const reportChoice = matchInput(text, {
      ausentismo: ['1', 'ausentismo', 'incapacidad', 'cita', 'permiso', '🤒'],
      accidente: ['2', 'accidente', 'sst', 'emergencia', 'caida', 'caída', '🚨', '⚠️'],
      novedad: ['3', 'novedad', 'nomina', 'nómina', 'pago', 'descuento', '💵', '📝'],
      volver: ['4', 'volver', 'menu', '⬅️']
    });

    if (reportChoice === 'ausentismo') {
      sessionManager.updateSession(senderJid, { flowState: 'ausentismo_tipo' });
      return formatResponse(`🤒 *Reporte de Ausentismo Laboral*\n\nPor favor selecciona el tipo de ausentismo:\n\n*1.* 🏥 Incapacidad médica\n*2.* 🩺 Cita médica\n*3.* 🏠 Calamidad doméstica\n*4.* 📋 Permiso personal\n*5.* ❓ Otro motivo\n*6.* ⬅️ Volver al menú anterior`);
    }

    if (reportChoice === 'accidente') {
      sessionManager.updateSession(senderJid, { flowState: 'accidente_info' });
      return formatResponse(`🚨 *Reporte de Accidente de Trabajo (SST MS Corp)*\n\n⚠️ *Si necesitas atención médica inmediata o tu salud está en riesgo, comunícate de inmediato con tu jefe directo, el área de SST o acude al centro médico correspondiente.*\n\nPor favor responde en un solo mensaje la siguiente información:\n• Fecha del accidente\n• Hora aproximada\n• Lugar exacto en planta o sede\n• Descripción breve de lo sucedido\n• Parte del cuerpo afectada\n• Nombre del jefe directo o brigadista informado`);
    }

    if (reportChoice === 'novedad') {
      sessionManager.updateSession(senderJid, { flowState: 'novedad_tipo' });
      return formatResponse(`💵 *Reporte de Novedad de Nómina*\n\nSelecciona el tipo de novedad observada:\n\n*1.* 📉 Diferencia en el pago recibido\n*2.* 🏷️ Descuento no reconocido\n*3.* ⏰ Horas extras no reflejadas\n*4.* 🏥 Incapacidad no registrada\n*5.* 🎁 Auxilio o beneficio no reflejado\n*6.* 📋 Otro caso\n*7.* ⬅️ Volver al menú anterior`);
    }

    if (reportChoice === 'volver') {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return formatResponse(getMainMenuText());
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
    if (text === '6' || lower.includes('volver') || text === '⬅️') {
      sessionManager.updateSession(senderJid, { flowState: 'menu_reportes' });
      return formatResponse(getReportesMenuText(session.employee?.nombre || 'Colaborador'));
    }

    sessionManager.updateSession(senderJid, { flowState: 'ausentismo_inicio', tempData: { tipo } });
    return formatResponse(`Escribe la *fecha de inicio* del ausentismo en formato \`dd/mm/aaaa\` (ejemplo: *10/06/2026*):`);
  }

  if (state === 'ausentismo_inicio') {
    const temp = session.tempData || {};
    sessionManager.updateSession(senderJid, { flowState: 'ausentismo_fin', tempData: { ...temp, inicio: text } });
    return formatResponse(`Escribe la *fecha de finalización* del ausentismo en formato \`dd/mm/aaaa\` (ejemplo: *12/06/2026*):`);
  }

  if (state === 'ausentismo_fin') {
    const temp = session.tempData || {};
    sessionManager.updateSession(senderJid, { flowState: 'ausentismo_soporte', tempData: { ...temp, fin: text } });
    return formatResponse(`Escribe el *nombre del archivo o documento soporte* de la incapacidad/permiso (o escribe la palabra *omitir*):`);
  }

  if (state === 'ausentismo_soporte') {
    const temp = session.tempData || {};
    const rad = generateRadicado('AUS');
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return formatResponse(`✅ Ausentismo registrado correctamente.\n📌 *Radicado:* \`${rad}\`\n\n• *Tipo:* ${temp.tipo}\n• *Desde:* ${temp.inicio}\n• *Hasta:* ${temp.fin}\n• *Soporte:* ${text}\n\n` + getAfterActionPrompt());
  }

  // accidente_info
  if (state === 'accidente_info') {
    const rad = generateRadicado('AT');
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return formatResponse(`✅ Reporte de accidente de trabajo registrado de manera prioritaria.\n📌 *Radicado SST:* \`${rad}\`\n\nEl equipo de SST y la Brigada de Emergencia de Medical Supplies Corp han sido notificados.\n\n` + getAfterActionPrompt());
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
    if (text === '7' || lower.includes('volver') || text === '⬅️') {
      sessionManager.updateSession(senderJid, { flowState: 'menu_reportes' });
      return formatResponse(getReportesMenuText(session.employee?.nombre || 'Colaborador'));
    }

    sessionManager.updateSession(senderJid, { flowState: 'novedad_desc', tempData: { tipo } });
    return formatResponse(`Escribe una *descripción detallada* de la novedad de nómina observada:`);
  }

  if (state === 'novedad_desc') {
    const rad = generateRadicado('NOM');
    sessionManager.updateSession(senderJid, { flowState: 'after_action' });
    return formatResponse(`✅ Novedad de nómina radicada exitosamente.\n📌 *Radicado:* \`${rad}\`\nEl área de Nómina revisará tu caso y se comunicará contigo.\n\n` + getAfterActionPrompt());
  }

  // -------------------------------------------------------------
  // 7.5 SUBMENÚ INSTITUCIONAL (menu_institucional)
  // -------------------------------------------------------------
  if (state === 'menu_institucional') {
    const choice = matchInput(text, {
      rit: ['1', 'rit', 'reglamento', '📜'],
      etica: ['2', 'etica', 'ética', 'transparencia', '⚖️'],
      cocola: ['3', 'cocola', 'convivencia', '🤝'],
      copasst: ['4', 'copasst', 'paritario', '⛑️'],
      brigada: ['5', 'brigada', 'emergencia', '🚑'],
      boletin: ['6', 'boletin', 'boletín', 'noticias', '📰'],
      calendario: ['7', 'calendario', 'fechas', '📅'],
      volver: ['8', 'volver', 'menu', '⬅️']
    });

    if (choice === 'rit') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`📜 *Reglamento Interno de Trabajo MS Corp*\n\nContiene las normas, derechos, deberes y disposiciones laborales oficiales.\n🔗 https://mscorp.com.co/\n\n` + getAfterActionPrompt());
    }
    if (choice === 'etica') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`⚖️ *Programa de Transparencia y Ética MS Corp*\n\nPromueve una cultura corporativa de integridad y cumplimiento de normas.\n🔗 https://mscorp.com.co/\n\n` + getAfterActionPrompt());
    }
    if (choice === 'cocola') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`🤝 *Comité de Convivencia Laboral (COCOLA MS Corp):*\n• Andrea Gómez (Presidenta)\n• Carlos Ramírez (Secretario)\n• Diana López (Vocal)\n• Jorge Pérez (Vocal)\n\n` + getAfterActionPrompt());
    }
    if (choice === 'copasst') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`⛑️ *Comité Paritario SST (COPASST MS Corp):*\n• Laura Martínez (Presidenta)\n• Mauricio Vega (Secretario)\n• Sandra Ríos (Vocal)\n• Felipe Torres (Vocal)\n\n` + getAfterActionPrompt());
    }
    if (choice === 'brigada') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`🚑 *Brigada de Emergencias MS Corp:*\n• Jefe de brigada: Andrés Mejía\n• Primeros auxilios: Paula Niño\n• Evacuación: Camilo Suárez\n• Control de incendios: Natalia Acosta\n\n` + getAfterActionPrompt());
    }
    if (choice === 'boletin') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`📰 *Boletín Informativo Institucional:*\n🔗 https://mscorp.com.co/\n\n` + getAfterActionPrompt());
    }
    if (choice === 'calendario') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`📅 *Calendario Corporativo Activo:*\n🔗 https://mscorp.com.co/\n\n` + getAfterActionPrompt());
    }
    if (choice === 'volver') {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return formatResponse(getMainMenuText());
    }
  }

  // -------------------------------------------------------------
  // 7.6 SUBMENÚ EVENTOS (menu_eventos)
  // -------------------------------------------------------------
  if (state === 'menu_eventos') {
    const choice = matchInput(text, {
      bienestar: ['1', 'bienestar', 'pausa', 'estres', 'estrés', '🌿'],
      formacion: ['2', 'formacion', 'formación', 'excel', 'datos', '📚'],
      sst: ['3', 'sst', 'simulacro', 'auxilios', '🦺'],
      calendario: ['4', 'calendario', 'fechas', '📅'],
      volver: ['5', 'volver', 'menu', '⬅️']
    });

    if (choice === 'bienestar') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`🌿 *Próximos Eventos de Bienestar MS Corp:*\n• Pausa activa guiada — 📅 12/06/2026 10:00 a.m. — Auditorio principal\n• 🧘 Taller de manejo del estrés — 📅 20/06/2026 3:00 p.m. — Virtual\n\n` + getAfterActionPrompt());
    }
    if (choice === 'formacion') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`📚 *Próximas Capacitaciones:*\n• 📘 Excel Avanzado — 15/06/2026 2:00 p.m. — Virtual\n• 🛡️ Protección de datos personales — 25/06/2026 9:00 a.m. — Híbrida\n\n` + getAfterActionPrompt());
    }
    if (choice === 'sst') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`🦺 *Eventos SST MS Corp:*\n• Simulacro de evacuación — 18/06/2026 11:00 a.m. — Sede principal\n• 🚑 Capacitación en primeros auxilios — 28/06/2026 10:00 a.m. — Auditorio\n\n` + getAfterActionPrompt());
    }
    if (choice === 'calendario') {
      sessionManager.updateSession(senderJid, { flowState: 'after_action' });
      return formatResponse(`📅 *Calendario General:* https://mscorp.com.co/\n\n` + getAfterActionPrompt());
    }
    if (choice === 'volver') {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return formatResponse(getMainMenuText());
    }
  }

  // -------------------------------------------------------------
  // 7.7 RUTA EXTERNO: ext_consent & ext_menu
  // -------------------------------------------------------------
  if (state === 'ext_consent') {
    const choice = matchInput(text, {
      yes: ['1', 'si', 'sí', 'autorizo', '✅', '👍'],
      no: ['2', 'no', 'rechazo', '❌', '👎']
    });

    if (choice === 'yes') {
      sessionManager.updateSession(senderJid, { flowState: 'ext_menu', currentCategory: 'external' });
      return formatResponse(`Gracias por tu autorización. Por favor selecciona la opción que deseas gestionar:\n\n` + getExternosMenuText());
    }

    if (choice === 'no') {
      sessionManager.updateSession(senderJid, { flowState: 'ext_denied' });
      return formatResponse(`Entendemos tu decisión. Para proteger tus datos, no podemos continuar la atención por este canal automatizado.\nPuedes contactar directamente a recepción en nuestras oficinas de Medical Supplies. ¡Feliz día!`);
    }

    return formatResponse(`Por favor selecciona una opción válida:\n\n*1.* ✅ Sí, autorizo\n*2.* ❌ No autorizo`);
  }

  if (state === 'ext_menu') {
    const choice = matchInput(text, {
      vacante: ['1', 'vacante', 'vacantes', 'empleo', 'trabajo', '💼'],
      cert: ['2', 'cert', 'certificado', 'excolaborador', 'exempleado', '📄'],
      seguimiento: ['3', 'seguimiento', 'proceso', 'candidato', '🔍'],
      finalizar: ['4', 'finalizar', 'salir', '❌', '👋']
    });

    if (choice === 'vacante') {
      sessionManager.updateSession(senderJid, { flowState: 'ext_vacantes' });
      return formatResponse(`💼 *Convocatorias Abiertas MS Corp*\n\nActualmente tenemos vacantes en áreas de dispositivos médicos. Puedes consultar los perfiles y postularte en nuestro portal oficial:\n\n🔗 https://mscorp.com.co/\n\n*1.* ⬅️ Volver al menú de externos\n*2.* 🚪 Finalizar conversación`);
    }

    if (choice === 'cert') {
      sessionManager.updateSession(senderJid, { flowState: 'ext_cert_cedula' });
      return formatResponse(`📄 *Certificado de Excolaborador*\n\nPor favor ingresa tu *número de cédula* sin puntos ni espacios para verificar tu historial:`);
    }

    if (choice === 'seguimiento') {
      sessionManager.updateSession(senderJid, { flowState: 'ext_seguimiento_cedula' });
      return formatResponse(`🔍 *Seguimiento a Proceso de Selección*\n\nPor favor ingresa tu *número de cédula* sin puntos ni espacios para consultar el estado de tu postulación:`);
    }

    if (choice === 'finalizar') {
      sessionManager.updateSession(senderJid, { flowState: 'ended' });
      return formatResponse(getEndedMessage(''));
    }
  }

  if (state === 'ext_vacantes') {
    if (text === '1' || lower.includes('menu') || text === '⬅️') {
      sessionManager.updateSession(senderJid, { flowState: 'ext_menu' });
      return formatResponse(getExternosMenuText());
    }
    sessionManager.updateSession(senderJid, { flowState: 'ended' });
    return formatResponse(getEndedMessage(''));
  }

  if (state === 'ext_cert_cedula') {
    const valResult = validateCedula(text);
    if (!valResult.valid) {
      return formatResponse(valResult.error);
    }
    const ced = valResult.cedula;
    const ex = MOCK_EXCOLABORADORES[ced];

    if (ex) {
      sessionManager.updateSession(senderJid, { flowState: 'ext_menu' });
      return formatResponse(`✅ *Registro Encontrado en Medical Supplies Corp*\n\n• *Nombre:* ${ex.nombre}\n• *Cargo final:* ${ex.cargoFinal}\n• *Periodo:* ${ex.periodo}\n\nDescarga tu certificado histórico aquí:\n🔗 https://mscorp.com.co/\n\n¿Deseas realizar otra consulta?\n\n` + getExternosMenuText());
    } else {
      sessionManager.updateSession(senderJid, { flowState: 'ext_cert_escalado', tempData: { cedula: ced } });
      return formatResponse(`No hemos encontrado un registro automático inmediato.\nPor favor, escribe tu *nombre completo* y un *correo electrónico* de contacto en un solo mensaje para escalar tu caso con un analista de Talento Humano:`);
    }
  }

  if (state === 'ext_cert_escalado') {
    const rad = generateRadicado('EXT-CERT');
    sessionManager.updateSession(senderJid, { flowState: 'ext_menu' });
    return formatResponse(`✅ *Caso Escalado con Éxito*\n\n📌 *Radicado:* \`${rad}\`\nTe enviaremos el documento en un plazo máximo de *3 días hábiles* al correo suministrado.\n\n¿Deseas realizar otra consulta?\n\n` + getExternosMenuText());
  }

  if (state === 'ext_seguimiento_cedula') {
    const valResult = validateCedula(text);
    if (!valResult.valid) {
      return formatResponse(valResult.error);
    }
    const ced = valResult.cedula;
    const cand = MOCK_CANDIDATOS[ced];

    sessionManager.updateSession(senderJid, { flowState: 'ext_menu' });

    if (!cand) {
      return formatResponse(`No encontramos un proceso de selección activo asociado a esta cédula.\n🔗 Conoce nuevas vacantes en: https://mscorp.com.co/\n\n¿Deseas realizar otra consulta?\n\n` + getExternosMenuText());
    }

    if (cand.activo) {
      return formatResponse(`Hola, *${cand.nombre}*. Actualmente te encuentras *activo* en el proceso para la vacante de *${cand.vacante}*.\n\n• *Estado actual:* ${cand.etapa}.\n\nNuestro equipo de Selección se pondrá en contacto contigo si avanzas a la siguiente etapa. ¡Muchos éxitos!\n\n¿Deseas realizar otra consulta?\n\n` + getExternosMenuText());
    } else {
      return formatResponse(`Hola, *${cand.nombre}*. Agradecemos tu postulación para la vacante de *${cand.vacante}*.\nEn esta ocasión, el proceso ha avanzado con otro perfil que se ajustaba con mayor exactitud a los requerimientos actuales... Mantendremos tu hoja de vida en nuestra base de datos para futuras oportunidades.\n\n¿Deseas realizar otra consulta?\n\n` + getExternosMenuText());
    }
  }

  // -------------------------------------------------------------
  // 7.8 after_action
  // -------------------------------------------------------------
  if (state === 'after_action') {
    const choice = matchInput(text, {
      yes: ['1', 'si', 'sí', 'menu', 'menú', 'volver', '✅', '👍'],
      no: ['2', 'no', 'finalizar', 'salir', '❌', '👋']
    });

    if (choice === 'yes') {
      sessionManager.updateSession(senderJid, { flowState: 'main_menu' });
      return formatResponse(getMainMenuText());
    }
    if (choice === 'no') {
      sessionManager.updateSession(senderJid, { flowState: 'ended' });
      return formatResponse(getEndedMessage(session.employee?.nombre || ''));
    }
    return formatResponse(`¿Deseas realizar otra solicitud?\n\nPuedes responder enviando el *número* o *emoji*:\n\n*1.* ✅ Sí, volver al menú principal\n*2.* ❌ No, finalizar conversación`);
  }

  // Fallback
  return formatResponse(`La opción ingresada no es válida. Por favor selecciona una de las opciones disponibles:\n\n` + getMainMenuText());
}

// PROMPTS ENHANCED WITH LOGO, EMOJIS & MULTI-OPTION INPUT SUPPORT
function getM01Welcome() {
  return `🏥 *Medical Supplies Corp (mscorp.com.co)*\n*Canal Oficial de Talento Humano*\n\nSoy tu asistente virtual de Talento Humano y estoy aquí para ayudarte con consultas, reportes y trámites.\n\nPara brindarte una atención personalizada, por favor selecciona tu perfil enviando el *número*, *emoji* o la *palabra clave*:\n\n*1.* 👨‍💼 Soy Colaborador Activo de Medical Supplies\n*2.* 👥 Soy Personal Externo (candidatos, excolaboradores o terceros)`;
}

function getMainMenuText() {
  return `*1.* 📄 Realizar una consulta (nómina, certificado, vacaciones, cesantías)\n*2.* ⚠️ Reportar una novedad o situación (ausentismo, accidente, nómina)\n*3.* 🏢 Consultar información institucional (RIT, Ética, COPASST, COCOLA)\n*4.* 🎉 Ver eventos, bienestar y formación\n*5.* ❌ Finalizar conversación`;
}

function getConsultasMenuText(name) {
  return `*${name}*, selecciona la consulta que deseas realizar (responde con *número* o *emoji*):\n\n*1.* 📑 Comprobante de nómina\n*2.* 📋 Certificado laboral\n*3.* 🌴 Saldos de vacaciones\n*4.* 📅 Fecha de vencimiento de mi contrato\n*5.* 💳 Descargar planilla de seguridad social\n*6.* 💰 Retiro de cesantías\n*7.* 🏆 Resultado de evaluación de desempeño\n*8.* 🎁 Beneficios corporativos\n*9.* ⬅️ Volver al menú anterior`;
}

function getReportesMenuText(name) {
  return `*${name}*, selecciona el reporte que deseas realizar (responde con *número* o *emoji*):\n\n*1.* 🤒 Reportar un ausentismo\n*2.* 🚨 Reportar un accidente de trabajo (SST)\n*3.* 💵 Reportar una novedad de nómina\n*4.* ⬅️ Volver al menú anterior`;
}

function getInstitucionalMenuText(name) {
  return `*${name}*, selecciona la información institucional que deseas consultar:\n\n*1.* 📜 Conoce el RIT\n*2.* ⚖️ Programa de Transparencia y Ética\n*3.* 🤝 Miembros COCOLA\n*4.* ⛑️ Miembros COPASST\n*5.* 🚑 Miembros Brigada de Emergencia\n*6.* 📰 Boletín institucional\n*7.* 📅 Conoce el calendario interno\n*8.* ⬅️ Volver al menú anterior`;
}

function getEventosMenuText(name) {
  return `*${name}*, selecciona la información de eventos que deseas consultar:\n\n*1.* 🌿 Próximos eventos de bienestar\n*2.* 📚 Próximos eventos de formación\n*3.* 🦺 Eventos SST\n*4.* 📅 Conoce el calendario interno\n*5.* ⬅️ Volver al menú anterior`;
}

function getExternosMenuText() {
  return `Por favor selecciona la opción que deseas gestionar:\n\n*1.* 💼 Conocer convocatorias laborales abiertas (Vacantes MS Corp)\n*2.* 📄 Solicitar certificado laboral (Excolaboradores)\n*3.* 🔍 Hacer seguimiento a mi proceso de selección\n*4.* 🚪 Finalizar conversación`;
}

function getAfterActionPrompt() {
  return `¿Deseas realizar otra solicitud?\n\n*1.* ✅ Sí, volver al menú principal\n*2.* ❌ No, finalizar conversación`;
}

function getEndedMessage(name) {
  return `Gracias por comunicarte con el *asistente virtual de Talento Humano* de Medical Supplies Corp${name ? `, *${name}*` : ''}.\n\nTu solicitud ha sido gestionada correctamente.\n\nRecuerda que este canal está disponible para apoyarte en cualquier momento.\n\n🔗 Web Oficial: https://mscorp.com.co\n\nQue tengas un excelente día. 👋`;
}

module.exports = {
  processWhatsAppMessage,
  getM01Welcome,
  COMPANY_LOGO_URL
};
