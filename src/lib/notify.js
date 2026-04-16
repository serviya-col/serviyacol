/**
 * ServiYa — Sistema de notificaciones centralizado
 * Resend (email) + Meta WhatsApp Cloud API
 *
 * Uso: import { notifyBienvenidaCliente, ... } from '@/lib/notify'
 * Todas las funciones son fire-and-forget seguras (no lanzan excepción).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.serviyacol.com'
const RESEND_API = 'https://api.resend.com/emails'
const WA_API = 'https://graph.facebook.com/v19.0'

// ─── Utilidades ────────────────────────────────────────────────────────────────

function normalizePhone(phone) {
  if (!phone) return null
  const d = String(phone).replace(/\D/g, '')
  if (d.startsWith('57') && d.length >= 11) return d
  if (d.length === 10 && d.startsWith('3')) return `57${d}`
  return d.length >= 10 ? d : null
}

// ─── Transports ────────────────────────────────────────────────────────────────

async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY
  if (!key || !to || !html) return
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'ServiYa <notificaciones@serviyacol.com>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    })
    if (!res.ok) console.warn('[notify:email] Resend error', res.status, await res.text())
  } catch (e) {
    console.warn('[notify:email] Exception:', e.message)
  }
}

async function sendWhatsApp({ phone, templateName, bodyParams = [], buttonParams = [] }) {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token   = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneId || !token || !phone || !templateName) return

  const waPhone = normalizePhone(phone)
  if (!waPhone) { console.warn('[notify:wa] Invalid phone:', phone); return }

  try {
    const components = []
    
    // Cuerpo del mensaje
    if (bodyParams.length) {
      components.push({
        type: 'body',
        parameters: bodyParams.map(p => ({ type: 'text', text: String(p) })),
      })
    }

    // Botón con link dinámico (si aplica)
    if (buttonParams.length) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: buttonParams.map(p => ({ type: 'text', text: String(p).replace(/^https?:\/\//, '') })),
      })
    }

    const body = {
      messaging_product: 'whatsapp',
      to: waPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'es' },
        components,
      },
    }

    const res = await fetch(`${WA_API}/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) console.warn('[notify:wa] Meta API error', res.status, await res.text())
  } catch (e) {
    console.warn('[notify:wa] Exception:', e.message)
  }
}

// ─── High-level notification functions ─────────────────────────────────────────

/** Nuevo cliente registrado */
export async function notifyBienvenidaCliente({ nombre, email, telefono }) {
  await Promise.all([
    sendEmail({
      to: email,
      subject: '¡Bienvenido/a a ServiYa! 🎉',
      html: tplBienvenidaCliente(nombre),
    }),
    sendWhatsApp({
      phone: telefono,
      templateName: process.env.WHATSAPP_TPL_BIENVENIDA_CLIENTE || 'serviya_bienvenida_cliente',
      bodyParams: [nombre],
    }),
    // Admin
    sendEmail({
      to: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      subject: `🆕 Nuevo cliente: ${nombre}`,
      html: tplAdminNuevoUsuario('Cliente', nombre, email, telefono),
    }),
  ])
}

/** Nuevo técnico registrado */
export async function notifyBienvenidaTecnico({ nombre, email, telefono }) {
  await Promise.all([
    sendEmail({
      to: email,
      subject: '¡Bienvenido/a a ServiYa Técnicos! 🔧',
      html: tplBienvenidaTecnico(nombre),
    }),
    sendWhatsApp({
      phone: telefono,
      templateName: process.env.WHATSAPP_TPL_BIENVENIDA_TECNICO || 'serviya_bienvenida_tecnico',
      bodyParams: [nombre],
    }),
    // Admin email
    sendEmail({
      to: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      subject: `🔧 Nuevo técnico pendiente verificación: ${nombre}`,
      html: tplAdminNuevoUsuario('Técnico', nombre, email, telefono),
    }),
    // Admin WhatsApp
    sendWhatsApp({
      phone: process.env.ADMIN_WHATSAPP,
      templateName: process.env.WHATSAPP_TPL_ADMIN_NUEVO_TECNICO || 'serviya_admin_nuevo_tecnico',
      bodyParams: [nombre, email || '—', telefono || '—'],
    }),
  ])
}

/** Admin asigna técnico a solicitud */
export async function notifyTecnicoAsignado({ solicitud, tecnico, cliente }) {
  await Promise.all([
    // → Técnico (email)
    sendEmail({
      to: tecnico.email,
      subject: `🎉 Te asignaron una solicitud: ${solicitud.tipo_servicio}`,
      html: tplTecnicoAsignado(solicitud, tecnico, cliente),
    }),
    // → Técnico (WhatsApp)
    sendWhatsApp({
      phone: tecnico.telefono,
      templateName: process.env.WHATSAPP_TPL_TECNICO_ASIGNADO || 'serviya_tecnico_asignado',
      bodyParams: [tecnico.nombre, solicitud.tipo_servicio, cliente?.nombre || '—', solicitud.ciudad || '—'],
    }),
    // → Cliente (email)
    ...(cliente?.email ? [sendEmail({
      to: cliente.email,
      subject: `✅ Tu técnico está asignado — ${solicitud.tipo_servicio}`,
      html: tplClienteTecnicoAsignado(solicitud, tecnico, cliente),
    })] : []),
    // → Cliente (WhatsApp)
    ...(cliente?.telefono ? [sendWhatsApp({
      phone: cliente.telefono,
      templateName: process.env.WHATSAPP_TPL_CLIENTE_ASIGNADO || 'serviya_cliente_tecnico_asignado',
      bodyParams: [cliente.nombre, tecnico.nombre, solicitud.tipo_servicio, tecnico.telefono || '—'],
    })] : []),
  ])
}

/** Técnico indica que está en camino (estado: en_curso) */
export async function notifyTecnicoEnCamino({ solicitud, tecnico, cliente }) {
  await Promise.all([
    ...(cliente?.email ? [sendEmail({
      to: cliente.email,
      subject: `🚗 Tu técnico está en camino — ${tecnico.nombre}`,
      html: tplClienteEnCamino(solicitud, tecnico, cliente),
    })] : []),
    ...(cliente?.telefono ? [sendWhatsApp({
      phone: cliente.telefono,
      templateName: process.env.WHATSAPP_TPL_EN_CAMINO || 'serviya_tecnico_en_camino',
      bodyParams: [cliente.nombre, tecnico.nombre, tecnico.telefono || '—'],
    })] : []),
  ])
}

/** Servicio completado */
export async function notifyServicioCompletado({ solicitud, tecnico, cliente }) {
  await Promise.all([
    ...(cliente?.email ? [sendEmail({
      to: cliente.email,
      subject: `⭐ Servicio completado — ${solicitud.tipo_servicio}`,
      html: tplClienteServicioCompletado(solicitud, tecnico, cliente),
    })] : []),
    ...(cliente?.telefono ? [sendWhatsApp({
      phone: cliente.telefono,
      templateName: process.env.WHATSAPP_TPL_COMPLETADO_CLIENTE || 'serviya_servicio_completado_cliente',
      bodyParams: [cliente.nombre, tecnico.nombre, solicitud.tipo_servicio],
    })] : []),
    // Técnico también recibe WA de confirmación
    ...(tecnico?.telefono ? [sendWhatsApp({
      phone: tecnico.telefono,
      templateName: process.env.WHATSAPP_TPL_COMPLETADO_TECNICO || 'serviya_servicio_completado_tecnico',
      bodyParams: [tecnico.nombre, solicitud.tipo_servicio],
    })] : []),
  ])
}

/** Cobro creado — link de pago al cliente */
export async function notifyCobroCreado({ cobro }) {
  await Promise.all([
    // Email al cliente solo si ingresó email
    ...(cobro.cliente_email ? [sendEmail({
      to: cobro.cliente_email,
      subject: `💳 Link de pago: $${cobro.valor_total?.toLocaleString('es-CO')} COP — ServiYa`,
      html: tplClienteCobro(cobro),
    })] : []),
    // WhatsApp al cliente (siempre, si tiene teléfono)
    ...(cobro.cliente_telefono ? [sendWhatsApp({
      phone: cobro.cliente_telefono,
      templateName: process.env.WHATSAPP_TPL_COBRO_CREADO || 'serviya_cobro_link_pago',
      bodyParams: [
        cobro.cliente_nombre,
        cobro.tecnico_nombre,
        `$${cobro.valor_total?.toLocaleString('es-CO')} COP`,
        cobro.bold_link || SITE_URL
      ],
    })] : []),
  ])
}

/** Pago confirmado por Bold webhook (SALE_APPROVED) */
export async function notifyPagoConfirmado({ cobro }) {
  await Promise.all([
    // Email al cliente
    ...(cobro.cliente_email ? [sendEmail({
      to: cobro.cliente_email,
      subject: `✅ Pago confirmado — Ref: ${cobro.referencia}`,
      html: tplClientePagoConfirmado(cobro),
    })] : []),
    // Email al técnico
    ...(cobro.tecnico_email ? [sendEmail({
      to: cobro.tecnico_email,
      subject: `💰 Pago recibido — $${cobro.valor_tecnico?.toLocaleString('es-CO')} COP`,
      html: tplTecnicoPagoRecibido(cobro),
    })] : []),
    // WA al técnico
    ...(cobro.tecnico_telefono ? [sendWhatsApp({
      phone: cobro.tecnico_telefono,
      templateName: process.env.WHATSAPP_TPL_PAGO_RECIBIDO || 'serviya_pago_recibido_tecnico',
      bodyParams: [cobro.tecnico_nombre || 'Técnico', cobro.descripcion || 'servicio', `$${cobro.valor_tecnico?.toLocaleString('es-CO')} COP`],
    })] : []),
    // Email al admin
    sendEmail({
      to: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      subject: `💸 Pago Bold confirmado — ${cobro.referencia} — $${cobro.valor_total?.toLocaleString('es-CO')} COP`,
      html: tplAdminPagoConfirmado(cobro),
    }),
  ])
}

/** Admin marca al técnico como pagado */
export async function notifyTecnicoPagado({ tecnico, cobro }) {
  await Promise.all([
    sendEmail({
      to: tecnico.email,
      subject: `✅ ServiYa te transfirió $${cobro.valor_tecnico?.toLocaleString('es-CO')} COP`,
      html: tplTecnicoPagado(tecnico, cobro),
    }),
    sendWhatsApp({
      phone: tecnico.telefono,
      templateName: process.env.WHATSAPP_TPL_PAGO_TRANSFERIDO || 'serviya_pago_transferido_tecnico',
      bodyParams: [tecnico.nombre, `$${cobro.valor_tecnico?.toLocaleString('es-CO')} COP`, cobro.referencia || '—'],
    }),
  ])
}

/** Nueva solicitud creada — notifica al admin */
export async function notifyNuevaSolicitud({ solicitud, clienteNombre }) {
  await Promise.all([
    sendEmail({
      to: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      subject: `📋 Nueva solicitud: ${solicitud.tipo_servicio} — ${clienteNombre}`,
      html: tplAdminNuevaSolicitud(solicitud, clienteNombre),
    }),
    sendWhatsApp({
      phone: process.env.ADMIN_WHATSAPP,
      templateName: process.env.WHATSAPP_TPL_ADMIN_SOLICITUD || 'serviya_admin_nueva_solicitud',
      bodyParams: [clienteNombre, solicitud.tipo_servicio, solicitud.ciudad || '—'],
    }),
  ])
}

// ─── HTML Email Templates ──────────────────────────────────────────────────────

function shell(content) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ServiYa</title></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:32px 16px;"><tr><td align="center">
<table width="100%" style="max-width:540px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.09);">
<tr><td style="background:linear-gradient(135deg,#064e3b 0%,#059669 100%);padding:28px 32px;text-align:center;">
  <span style="color:#fff;font-size:26px;font-weight:900;font-family:'Segoe UI',sans-serif;letter-spacing:-0.5px;"><span style="color:#6ee7b7;">Servi</span>Ya</span>
  <p style="color:rgba(255,255,255,.65);font-size:11px;margin:5px 0 0;text-transform:uppercase;letter-spacing:2px;">Tu técnico de confianza</p>
</td></tr>
<tr><td style="padding:28px 32px;">${content}</td></tr>
<tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 32px;text-align:center;">
  <p style="color:#9ca3af;font-size:11px;margin:0;">© ${new Date().getFullYear()} ServiYa · <a href="${SITE_URL}" style="color:#059669;text-decoration:none;">serviyacol.com</a> · <a href="mailto:soporte@serviyacol.com" style="color:#059669;text-decoration:none;">soporte@serviyacol.com</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function cta(label, url, bg = '#059669') {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background:${bg};color:#ffffff;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;">${label}</a>
  </div>`
}

function infoRow(label, value, odd = false) {
  const bg = odd ? 'background:#f9fafb;' : ''
  return `<tr>
    <td style="padding:9px 0;${bg}color:#6b7280;font-size:13px;font-weight:600;width:130px;">${label}</td>
    <td style="padding:9px 0;${bg}color:#111827;font-size:13px;">${value || '—'}</td>
  </tr>`
}

// ── Templates ──────────────────────────────────────────────────────────────────

function tplBienvenidaCliente(nombre) {
  return shell(`
    <h2 style="color:#064e3b;font-size:22px;font-weight:800;margin:0 0 8px;">¡Hola, ${nombre}! 🎉</h2>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Bienvenido/a a <strong>ServiYa</strong>, la plataforma que conecta hogares y empresas con
      técnicos verificados de Colombia.
    </p>
    <div style="background:#f0fdf4;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="color:#065f46;font-weight:700;font-size:14px;margin:0 0 10px;">¿Qué puedes hacer?</p>
      <p style="color:#374151;font-size:13px;line-height:1.8;margin:0;">
        ✅ Solicitar técnicos para más de 8 categorías<br>
        ⚡ Respuesta en menos de 1 hora<br>
        🛡️ Garantía de satisfacción de 30 días<br>
        💳 Pago 100% seguro en línea
      </p>
    </div>
    ${cta('Solicitar un técnico ahora', `${SITE_URL}/solicitar`)}
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">¿Necesitas ayuda? <a href="mailto:soporte@serviyacol.com" style="color:#059669;">soporte@serviyacol.com</a></p>
  `)
}

function tplBienvenidaTecnico(nombre) {
  return shell(`
    <h2 style="color:#064e3b;font-size:22px;font-weight:800;margin:0 0 8px;">¡Bienvenido/a, ${nombre}! 🔧</h2>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Tu perfil de técnico en <strong>ServiYa</strong> fue creado exitosamente.
      Nuestro equipo revisará tu documentación en las próximas 24 horas.
    </p>
    <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:12px;padding:16px;margin:16px 0;">
      <p style="color:#92400e;font-weight:700;font-size:14px;margin:0 0 10px;">⏳ Próximos pasos</p>
      <p style="color:#374151;font-size:13px;line-height:1.8;margin:0;">
        1. Nuestro admin revisará tu cédula y datos<br>
        2. Recibirás un correo cuando seas verificado ✅<br>
        3. Podrás ver y aceptar solicitudes de clientes
      </p>
    </div>
    ${cta('Ver mi panel de técnico', `${SITE_URL}/tecnico`)}
  `)
}

function tplAdminNuevoUsuario(tipo, nombre, email, telefono) {
  return shell(`
    <h2 style="color:#064e3b;font-size:20px;font-weight:800;margin:0 0 20px;">🆕 Nuevo ${tipo} registrado</h2>
    <table width="100%" style="border-collapse:collapse;">
      ${infoRow('Tipo', tipo, true)}
      ${infoRow('Nombre', nombre)}
      ${infoRow('Email', email, true)}
      ${infoRow('Teléfono', telefono)}
    </table>
    ${tipo === 'Técnico' ? cta('Verificar técnico', `${SITE_URL}/admin`, '#7c3aed') : ''}
  `)
}

function tplAdminNuevaSolicitud(solicitud, clienteNombre) {
  return shell(`
    <h2 style="color:#064e3b;font-size:20px;font-weight:800;margin:0 0 20px;">📋 Nueva solicitud</h2>
    <table width="100%" style="border-collapse:collapse;">
      ${infoRow('Cliente', clienteNombre, true)}
      ${infoRow('Servicio', solicitud.tipo_servicio)}
      ${infoRow('Ciudad', solicitud.ciudad, true)}
      ${infoRow('Urgencia', solicitud.urgencia)}
      ${infoRow('Descripción', solicitud.descripcion, true)}
    </table>
    ${cta('Gestionar solicitudes', `${SITE_URL}/admin`, '#7c3aed')}
  `)
}

function tplTecnicoAsignado(solicitud, tecnico, cliente) {
  return shell(`
    <h2 style="color:#064e3b;font-size:22px;font-weight:800;margin:0 0 8px;">¡Tienes un nuevo trabajo! 🎉</h2>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">Hola <strong>${tecnico.nombre}</strong>, te han asignado la siguiente solicitud:</p>
    <div style="background:#f0fdf4;border-radius:12px;padding:18px;margin:16px 0;">
      <p style="color:#065f46;font-weight:800;font-size:16px;margin:0 0 12px;">📋 ${solicitud.tipo_servicio}</p>
      <table width="100%" style="border-collapse:collapse;font-size:13px;">
        ${infoRow('Cliente', cliente?.nombre)}
        ${infoRow('Teléfono', cliente?.telefono, true)}
        ${infoRow('Ciudad', solicitud.ciudad)}
        ${infoRow('Descripción', solicitud.descripcion, true)}
      </table>
    </div>
    ${cta('Ver detalles en mi panel', `${SITE_URL}/tecnico`)}
  `)
}

function tplClienteTecnicoAsignado(solicitud, tecnico, cliente) {
  return shell(`
    <h2 style="color:#064e3b;font-size:22px;font-weight:800;margin:0 0 8px;">¡Tu técnico fue asignado! ✅</h2>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">Hola <strong>${cliente.nombre}</strong>, encontramos el técnico ideal para tu solicitud de <em>${solicitud.tipo_servicio}</em>:</p>
    <div style="background:#f0fdf4;border-radius:12px;padding:18px;margin:16px 0;">
      <p style="color:#065f46;font-weight:800;font-size:18px;margin:0 0 4px;">${tecnico.nombre}</p>
      <p style="color:#6b7280;font-size:13px;margin:0 0 14px;">${tecnico.categoria || ''} · ${tecnico.ciudad || ''}</p>
      <table width="100%" style="border-collapse:collapse;font-size:13px;">
        ${infoRow('📞 Teléfono', tecnico.telefono)}
        ${infoRow('📍 Ciudad', solicitud.ciudad, true)}
      </table>
    </div>
    <p style="color:#374151;font-size:13px;text-align:center;">El técnico se pondrá en contacto contigo pronto.</p>
  `)
}

function tplClienteEnCamino(solicitud, tecnico, cliente) {
  return shell(`
    <h2 style="color:#064e3b;font-size:22px;font-weight:800;margin:0 0 8px;">🚗 ¡Tu técnico está en camino!</h2>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hola <strong>${cliente.nombre}</strong>, <strong>${tecnico.nombre}</strong> ya está en camino para tu solicitud de <em>${solicitud.tipo_servicio}</em>.
    </p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px;margin:16px 0;text-align:center;">
      <p style="color:#1e40af;font-weight:700;font-size:14px;margin:0 0 8px;">¿Necesitas hablar con el técnico?</p>
      <a href="tel:+57${(tecnico.telefono||'').replace(/\D/g,'')}" style="color:#1d4ed8;font-size:20px;font-weight:800;text-decoration:none;">📞 ${tecnico.telefono || '—'}</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;">¿Algún problema? Escríbenos a <a href="mailto:soporte@serviyacol.com" style="color:#059669;">soporte@serviyacol.com</a></p>
  `)
}

function tplClienteServicioCompletado(solicitud, tecnico, cliente) {
  return shell(`
    <h2 style="color:#064e3b;font-size:22px;font-weight:800;margin:0 0 8px;">⭐ Servicio completado</h2>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hola <strong>${cliente.nombre}</strong>, <strong>${tecnico.nombre}</strong> ha completado tu solicitud de <em>${solicitud.tipo_servicio}</em>. ¡Gracias por confiar en ServiYa!
    </p>
    <div style="background:#f0fdf4;border-radius:12px;padding:18px;margin:16px 0;text-align:center;">
      <span style="font-size:48px;">🏆</span>
      <p style="color:#065f46;font-weight:700;font-size:15px;margin:10px 0 0;">¡Trabajo finalizado con éxito!</p>
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;">¿Cómo fue tu experiencia? Cuéntanos: <a href="mailto:soporte@serviyacol.com" style="color:#059669;">soporte@serviyacol.com</a></p>
  `)
}

function tplClienteCobro(cobro) {
  return shell(`
    <h2 style="color:#064e3b;font-size:22px;font-weight:800;margin:0 0 8px;">💳 Link de pago seguro</h2>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hola <strong>${cobro.cliente_nombre}</strong>, <strong>${cobro.tecnico_nombre}</strong> te envía el link de pago por:
    </p>
    <div style="background:#f0fdf4;border-radius:12px;padding:18px;margin:16px 0;">
      <p style="color:#374151;font-size:13px;margin:0 0 6px;"><strong>Servicio:</strong> ${cobro.descripcion}</p>
      <p style="color:#374151;font-size:13px;margin:0 0 6px;"><strong>Técnico:</strong> ${cobro.tecnico_nombre}</p>
      <p style="color:#374151;font-size:13px;margin:0 0 12px;"><strong>Referencia:</strong> ${cobro.referencia}</p>
      <p style="color:#064e3b;font-size:28px;font-weight:900;margin:0;">💰 $${cobro.valor_total?.toLocaleString('es-CO')} COP</p>
    </div>
    ${cta('💳 Pagar ahora de forma segura', cobro.bold_link || SITE_URL)}
    <p style="color:#9ca3af;font-size:11px;text-align:center;">Tarjeta · PSE · Nequi · Bancolombia. 🔒 Pago 100% seguro.</p>
  `)
}

function tplClientePagoConfirmado(cobro) {
  return shell(`
    <h2 style="color:#064e3b;font-size:22px;font-weight:800;margin:0 0 8px;">✅ ¡Pago confirmado!</h2>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hola <strong>${cobro.cliente_nombre}</strong>, tu pago fue procesado exitosamente. Guarda este correo como comprobante.
    </p>
    <div style="background:#f0fdf4;border:1px solid #6ee7b7;border-radius:12px;padding:18px;margin:16px 0;">
      <table width="100%" style="border-collapse:collapse;">
        ${infoRow('Referencia', cobro.referencia, true)}
        ${infoRow('Servicio', cobro.descripcion)}
        ${infoRow('Técnico', cobro.tecnico_nombre, true)}
        ${infoRow('Total pagado', `<strong style="color:#064e3b;">$${cobro.valor_total?.toLocaleString('es-CO')} COP ✅</strong>`)}
      </table>
    </div>
    <p style="color:#9ca3af;font-size:12px;text-align:center;">¿Algún problema? <a href="mailto:soporte@serviyacol.com" style="color:#059669;">soporte@serviyacol.com</a></p>
  `)
}

function tplTecnicoPagoRecibido(cobro) {
  return shell(`
    <h2 style="color:#064e3b;font-size:22px;font-weight:800;margin:0 0 8px;">💰 ¡Pago recibido!</h2>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Hola <strong>${cobro.tecnico_nombre}</strong>, el cliente pagó tu servicio. ServiYa procesará tu transferencia próximamente.
    </p>
    <div style="background:#f0fdf4;border-radius:12px;padding:18px;margin:16px 0;">
      <table width="100%" style="border-collapse:collapse;">
        ${infoRow('Servicio', cobro.descripcion, true)}
        ${infoRow('Cliente', cobro.cliente_nombre)}
        ${infoRow('Referencia', cobro.referencia, true)}
        ${infoRow('Total cobrado', `$${cobro.valor_total?.toLocaleString('es-CO')} COP`)}
        ${infoRow('Comisión (15%)', `-$${cobro.valor_comision?.toLocaleString('es-CO')} COP`, true)}
      </table>
      <p style="color:#064e3b;font-size:24px;font-weight:900;margin:14px 0 0;border-top:1px solid #d1fae5;padding-top:14px;">
        Recibes: $${cobro.valor_tecnico?.toLocaleString('es-CO')} COP 🎉
      </p>
    </div>
  `)
}

function tplTecnicoPagado(tecnico, cobro) {
  return shell(`
    <h2 style="color:#064e3b;font-size:22px;font-weight:800;margin:0 0 8px;">✅ ServiYa te transfirió tu pago</h2>
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 16px;">Hola <strong>${tecnico.nombre}</strong>, se realizó la transferencia a tu cuenta bancaria registrada.</p>
    <div style="background:#f0fdf4;border:1px solid #6ee7b7;border-radius:12px;padding:20px;margin:16px 0;text-align:center;">
      <p style="color:#6b7280;font-size:13px;margin:0;">Monto transferido</p>
      <p style="color:#064e3b;font-size:36px;font-weight:900;margin:6px 0;">$${cobro.valor_tecnico?.toLocaleString('es-CO')} COP</p>
      <p style="color:#9ca3af;font-size:12px;margin:0;">Ref: ${cobro.referencia || '—'}</p>
    </div>
    <p style="color:#374151;font-size:13px;text-align:center;">Revisa tu cuenta bancaria. ¡Gracias por tu trabajo! 💚</p>
  `)
}

function tplAdminPagoConfirmado(cobro) {
  return shell(`
    <h2 style="color:#064e3b;font-size:20px;font-weight:800;margin:0 0 20px;">💸 Pago confirmado por Bold</h2>
    <table width="100%" style="border-collapse:collapse;">
      ${infoRow('Referencia', cobro.referencia, true)}
      ${infoRow('Cliente', cobro.cliente_nombre)}
      ${infoRow('Técnico', cobro.tecnico_nombre, true)}
      ${infoRow('Servicio', cobro.descripcion)}
      ${infoRow('Total', `<strong style="color:#064e3b;">$${cobro.valor_total?.toLocaleString('es-CO')} COP</strong>`, true)}
      ${infoRow('Comisión ServiYa', `<strong style="color:#059669;">$${cobro.valor_comision?.toLocaleString('es-CO')} COP</strong>`)}
      ${infoRow('Para técnico', `$${cobro.valor_tecnico?.toLocaleString('es-CO')} COP`, true)}
    </table>
    ${cta('Ver en panel admin', `${SITE_URL}/admin`, '#7c3aed')}
  `)
}
