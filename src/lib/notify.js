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

/** Admin notificado cuando técnico crea un cobro */
export async function notifyAdminCobroCreado({ cobro }) {
  await Promise.all([
    sendEmail({
      to: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      subject: `💳 Nuevo cobro creado — ${cobro.tecnico_nombre} → ${cobro.cliente_nombre} — $${cobro.valor_total?.toLocaleString('es-CO')} COP`,
      html: tplAdminCobroCreado(cobro),
    }),
    sendWhatsApp({
      phone: process.env.ADMIN_WHATSAPP,
      templateName: process.env.WHATSAPP_TPL_ADMIN_COBRO || 'serviya_admin_cobro_creado',
      bodyParams: [
        cobro.tecnico_nombre || '—',
        cobro.cliente_nombre || '—',
        `$${cobro.valor_total?.toLocaleString('es-CO')} COP`,
        cobro.referencia || '—',
      ],
    }),
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
// Design system: slate background, white card, emerald brand, clean info rows

const YEAR = new Date().getFullYear()

function shell({ headerEmoji = '', headerTitle = '', headerSubtitle = '', body = '' }) {
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>ServiYa</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

  <!-- HEADER -->
  <tr><td style="background:linear-gradient(145deg,#052e16 0%,#064e3b 50%,#065f46 100%);border-radius:14px 14px 0 0;padding:32px 40px 28px;text-align:center;">
    ${headerEmoji ? `<div style="font-size:40px;line-height:1;margin-bottom:14px;">${headerEmoji}</div>` : ''}
    <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;line-height:1;margin-bottom:4px;">
      <span style="color:#6ee7b7;">Servi</span>Ya
    </div>
    ${headerTitle ? `<p style="color:#ffffff;font-size:17px;font-weight:700;margin:12px 0 0;line-height:1.3;">${headerTitle}</p>` : ''}
    ${headerSubtitle ? `<p style="color:rgba(255,255,255,0.60);font-size:12px;margin:6px 0 0;line-height:1.5;font-weight:500;">${headerSubtitle}</p>` : ''}
  </td></tr>

  <!-- BODY -->
  <tr><td style="background:#ffffff;padding:36px 40px;">
    ${body}
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 14px 14px;padding:20px 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding-bottom:10px;">
        <a href="${SITE_URL}" style="color:#059669;font-size:12px;font-weight:600;text-decoration:none;margin:0 10px;">🌐 serviyacol.com</a>
        <span style="color:#cbd5e1;font-size:12px;">|</span>
        <a href="mailto:soporte@serviyacol.com" style="color:#059669;font-size:12px;font-weight:600;text-decoration:none;margin:0 10px;">✉️ soporte@serviyacol.com</a>
      </td></tr>
      <tr><td align="center">
        <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.7;">
          © ${YEAR} ServiYa · Técnicos verificados de confianza en Colombia<br>
          Este mensaje fue generado automáticamente, no respondas a este correo.
        </p>
      </td></tr>
    </table>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

function ctaBtn(label, url, bg = '#059669') {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
  <tr><td align="center">
    <a href="${url}" style="display:inline-block;background:${bg};color:#ffffff;font-weight:700;font-size:15px;padding:14px 40px;border-radius:10px;text-decoration:none;letter-spacing:0.1px;">${label}</a>
  </td></tr>
</table>`
}

function infoTable(rows) {
  const rowsHtml = rows.map((r, i) => `
    <tr>
      <td style="padding:10px 16px;background:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};border-bottom:1px solid #f1f5f9;width:34%;vertical-align:top;">
        <span style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;">${r[0]}</span>
      </td>
      <td style="padding:10px 16px;background:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};border-bottom:1px solid #f1f5f9;">
        <span style="color:#0f172a;font-size:13px;font-weight:500;line-height:1.5;">${r[1] || '—'}</span>
      </td>
    </tr>`).join('')
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;margin:20px 0;">${rowsHtml}</table>`
}

function highlight(text, bg = '#f0fdf4', border = '#bbf7d0', color = '#064e3b') {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr><td style="background:${bg};border-left:4px solid ${border};border-radius:0 8px 8px 0;padding:14px 18px;">
    <p style="color:${color};font-size:13px;line-height:1.65;margin:0;">${text}</p>
  </td></tr>
</table>`
}

function bigAmount(label, amount, ref = '') {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
  <tr><td align="center" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac;border-radius:12px;padding:28px 20px;">
    <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;margin:0 0 8px;">${label}</p>
    <p style="color:#064e3b;font-size:38px;font-weight:900;margin:0;line-height:1;">${amount}</p>
    ${ref ? `<p style="color:#94a3b8;font-size:11px;font-family:monospace;margin:10px 0 0;">${ref}</p>` : ''}
  </td></tr>
</table>`
}

// ── Templates ────────────────────────────────────────────────────────────────────

function tplBienvenidaCliente(nombre) {
  return shell({
    headerEmoji: '🎉',
    headerTitle: '¡Bienvenido/a a ServiYa!',
    headerSubtitle: 'Tu cuenta fue creada exitosamente',
    body: `
      <p style="color:#0f172a;font-size:15px;font-weight:600;margin:0 0 6px;">Hola, ${nombre} 👋</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Gracias por unirte a <strong style="color:#059669;">ServiYa</strong>. Somos la plataforma que conecta hogares y empresas con los mejores técnicos verificados de Colombia.
      </p>
      ${highlight(`
        <strong style="display:block;margin-bottom:8px;">¿Qué puedes hacer ahora?</strong>
        ✅ &nbsp;Solicitar técnicos en más de 8 categorías<br>
        ⚡ &nbsp;Recibir respuesta en menos de 1 hora<br>
        💳 &nbsp;Pago 100% seguro en línea<br>
        🛡️ &nbsp;Garantía de satisfacción de 30 días
      `)}
      ${ctaBtn('Solicitar un técnico ahora →', `${SITE_URL}/solicitar`)}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">
        ¿Tienes preguntas? Escríbenos a <a href="mailto:soporte@serviyacol.com" style="color:#059669;font-weight:600;">soporte@serviyacol.com</a>
      </p>
    `
  })
}

function tplBienvenidaTecnico(nombre) {
  return shell({
    headerEmoji: '🔧',
    headerTitle: '¡Bienvenido/a al equipo!',
    headerSubtitle: 'Tu registro como técnico fue recibido',
    body: `
      <p style="color:#0f172a;font-size:15px;font-weight:600;margin:0 0 6px;">Hola, ${nombre} 👋</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
        Tu perfil de técnico fue creado en <strong style="color:#059669;">ServiYa</strong>. Nuestro equipo revisará tu documentación en las próximas 24 horas.
      </p>
      ${highlight(`
        <strong style="display:block;margin-bottom:8px;">⏳ Próximos pasos:</strong>
        1. Nuestro equipo revisará tu cédula y datos de perfil.<br>
        2. Recibirás un correo cuando tu cuenta esté <strong>verificada ✅</strong><br>
        3. Podrás ver y aceptar solicitudes de clientes en tu ciudad.
      `, '#fffbeb', '#fde68a', '#92400e')}
      ${ctaBtn('Ir a mi panel de técnico →', `${SITE_URL}/tecnico`, '#0369a1')}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">
        ¿Tienes dudas? Escríbenos a <a href="mailto:soporte@serviyacol.com" style="color:#059669;font-weight:600;">soporte@serviyacol.com</a>
      </p>
    `
  })
}

function tplAdminNuevoUsuario(tipo, nombre, email, telefono) {
  const esTecnico = tipo === 'Técnico'
  return shell({
    headerEmoji: esTecnico ? '👷' : '🧑‍💼',
    headerTitle: `Nuevo ${tipo} registrado`,
    headerSubtitle: 'Acción requerida en el panel de administración',
    body: `
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Se registró un nuevo <strong>${tipo}</strong> en la plataforma. Aquí está la información:
      </p>
      ${infoTable([
        ['Nombre completo', nombre],
        ['Correo electrónico', email || '—'],
        ['Teléfono / WhatsApp', telefono || '—'],
        ['Tipo de perfil', tipo],
      ])}
      ${esTecnico ? highlight(
        '🔍 <strong>Este técnico requiere verificación de identidad.</strong> Revisa su cédula y datos antes de activarlo en la plataforma.',
        '#fef3c7', '#fde68a', '#92400e'
      ) : ''}
      ${ctaBtn(`Ver en el panel de admin →`, `${SITE_URL}/admin`, esTecnico ? '#7c3aed' : '#059669')}
    `
  })
}

function tplAdminNuevaSolicitud(solicitud, clienteNombre) {
  return shell({
    headerEmoji: '📋',
    headerTitle: 'Nueva solicitud de servicio',
    headerSubtitle: `Cliente: ${clienteNombre}`,
    body: `
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Un cliente acaba de enviar una nueva solicitud de servicio. Asigna un técnico disponible lo antes posible.
      </p>
      ${infoTable([
        ['Cliente', clienteNombre],
        ['Servicio solicitado', solicitud.tipo_servicio || solicitud.categoria || '—'],
        ['Ciudad', solicitud.ciudad || '—'],
        ['Descripción', solicitud.descripcion || '—'],
      ])}
      ${ctaBtn('Gestionar solicitud →', `${SITE_URL}/admin`, '#7c3aed')}
    `
  })
}

function tplTecnicoAsignado(solicitud, tecnico, cliente) {
  return shell({
    headerEmoji: '🎉',
    headerTitle: '¡Nuevo trabajo asignado!',
    headerSubtitle: `Servicio: ${solicitud.tipo_servicio || solicitud.categoria}`,
    body: `
      <p style="color:#0f172a;font-size:15px;font-weight:600;margin:0 0 6px;">Hola, ${tecnico.nombre} 👋</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        Te acaban de asignar una nueva solicitud de servicio. Coordina la visita con el cliente lo antes posible.
      </p>
      ${infoTable([
        ['Servicio', solicitud.tipo_servicio || solicitud.categoria || '—'],
        ['Ciudad', solicitud.ciudad || '—'],
        ['Nombre del cliente', cliente?.nombre || '—'],
        ['Teléfono del cliente', cliente?.telefono || '—'],
        ['Descripción', solicitud.descripcion || '—'],
      ])}
      ${highlight('📞 <strong>Consejo:</strong> Contacta al cliente a la brevedad para coordinar la visita y generar confianza.')}
      ${ctaBtn('Ver mis trabajos →', `${SITE_URL}/tecnico`)}
    `
  })
}

function tplClienteTecnicoAsignado(solicitud, tecnico, cliente) {
  return shell({
    headerEmoji: '🔔',
    headerTitle: '¡Tu técnico fue asignado!',
    headerSubtitle: `Servicio: ${solicitud.tipo_servicio || solicitud.categoria}`,
    body: `
      <p style="color:#0f172a;font-size:15px;font-weight:600;margin:0 0 6px;">Hola, ${cliente?.nombre || 'Cliente'} 👋</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        ¡Buenas noticias! Encontramos al técnico ideal para tu solicitud.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;border:1px solid #d1fae5;margin:0 0 20px;">
        <tr><td style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);padding:22px 24px;">
          <p style="color:#065f46;font-size:17px;font-weight:800;margin:0 0 4px;">👷 ${tecnico.nombre}</p>
          <p style="color:#059669;font-size:12px;font-weight:600;margin:0 0 14px;">${tecnico.categoria || 'Técnico verificado'} · ${tecnico.ciudad || ''}</p>
          <p style="color:#374151;font-size:13px;margin:0 0 4px;">
            📞 <a href="tel:+57${(tecnico.telefono||'').replace(/\D/g,'')}" style="color:#065f46;font-weight:700;text-decoration:none;">${tecnico.telefono || '—'}</a>
          </p>
          <p style="color:#374151;font-size:13px;margin:0;">📍 ${solicitud.ciudad || '—'}</p>
        </td></tr>
      </table>
      ${highlight('✅ El técnico se pondrá en contacto contigo pronto. Recuerda que tienes <strong>garantía de satisfacción de 30 días</strong> incluida.')}
    `
  })
}

function tplClienteEnCamino(solicitud, tecnico, cliente) {
  return shell({
    headerEmoji: '🚗',
    headerTitle: '¡Tu técnico está en camino!',
    headerSubtitle: 'Prepárate para recibirlo',
    body: `
      <p style="color:#0f172a;font-size:15px;font-weight:600;margin:0 0 6px;">Hola, ${cliente?.nombre || 'Cliente'} 👋</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        <strong>${tecnico?.nombre}</strong> ya está en camino. ¡Asegúrate de estar disponible para recibirlo!
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr><td align="center" style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:1px solid #bfdbfe;border-radius:12px;padding:28px 20px;">
          <p style="color:#1e40af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;margin:0 0 12px;">Contacta a tu técnico directamente</p>
          <a href="tel:+57${(tecnico?.telefono||'').replace(/\D/g,'')}" style="display:inline-block;background:#1d4ed8;color:#fff;font-size:20px;font-weight:800;padding:12px 28px;border-radius:10px;text-decoration:none;">
            📞 ${tecnico?.telefono || '—'}
          </a>
        </td></tr>
      </table>
      ${infoTable([
        ['Técnico', tecnico?.nombre || '—'],
        ['Servicio', solicitud?.tipo_servicio || solicitud?.categoria || '—'],
      ])}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">
        ¿Algún inconveniente? <a href="mailto:soporte@serviyacol.com" style="color:#059669;font-weight:600;">soporte@serviyacol.com</a>
      </p>
    `
  })
}

function tplClienteServicioCompletado(solicitud, tecnico, cliente) {
  return shell({
    headerEmoji: '⭐',
    headerTitle: 'Servicio completado',
    headerSubtitle: `Técnico: ${tecnico?.nombre || ''}`,
    body: `
      <p style="color:#0f172a;font-size:15px;font-weight:600;margin:0 0 6px;">Hola, ${cliente?.nombre || 'Cliente'} 👋</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        <strong>${tecnico?.nombre}</strong> ha completado tu solicitud de <strong>${solicitud?.tipo_servicio || solicitud?.categoria}</strong>. ¡Gracias por confiar en ServiYa!
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr><td align="center" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:32px 20px;">
          <p style="font-size:50px;margin:0 0 12px;line-height:1;">🏆</p>
          <p style="color:#065f46;font-size:17px;font-weight:800;margin:0 0 4px;">Trabajo finalizado con éxito</p>
          <p style="color:#059669;font-size:13px;margin:0;">Garantía de satisfacción incluida por 30 días</p>
        </td></tr>
      </table>
      ${highlight('💬 <strong>¿Cómo fue tu experiencia?</strong> Tu opinión es muy valiosa para nosotros y ayuda a mejorar el servicio. Escríbenos a <a href="mailto:soporte@serviyacol.com" style="color:#065f46;font-weight:600;">soporte@serviyacol.com</a>')}
    `
  })
}

function tplClienteCobro(cobro) {
  return shell({
    headerEmoji: '💳',
    headerTitle: 'Link de pago seguro',
    headerSubtitle: `De: ${cobro.tecnico_nombre}`,
    body: `
      <p style="color:#0f172a;font-size:15px;font-weight:600;margin:0 0 6px;">Hola, ${cobro.cliente_nombre} 👋</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        Tu técnico <strong>${cobro.tecnico_nombre}</strong> ha generado el resumen de cobro por el servicio realizado.
      </p>
      ${bigAmount('Total a pagar', `$${cobro.valor_total?.toLocaleString('es-CO')} COP`, `Ref: ${cobro.referencia || '—'}`)}
      ${infoTable([
        ['Técnico', cobro.tecnico_nombre || '—'],
        ['Servicio realizado', cobro.descripcion || '—'],
      ])}
      ${ctaBtn('💳 Pagar ahora de forma segura', cobro.bold_link || SITE_URL)}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <p style="color:#94a3b8;font-size:12px;margin:0 0 6px;">Métodos de pago aceptados</p>
          <p style="color:#64748b;font-size:13px;font-weight:600;margin:0;">💳 Tarjeta &nbsp;·&nbsp; 🏦 PSE &nbsp;·&nbsp; 📱 Nequi &nbsp;·&nbsp; 🔒 Bancolombia</p>
        </td></tr>
      </table>
    `
  })
}

function tplClientePagoConfirmado(cobro) {
  return shell({
    headerEmoji: '🎉',
    headerTitle: '¡Pago confirmado!',
    headerSubtitle: `Referencia: ${cobro.referencia || '—'}`,
    body: `
      <p style="color:#0f172a;font-size:15px;font-weight:600;margin:0 0 6px;">Hola, ${cobro.cliente_nombre} 👋</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        Tu pago fue procesado exitosamente. Guarda este correo como comprobante de tu transacción.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
        <tr><td align="center" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #86efac;border-radius:12px;padding:28px 20px;">
          <p style="font-size:40px;margin:0 0 10px;line-height:1;">✅</p>
          <p style="color:#064e3b;font-size:34px;font-weight:900;margin:0 0 4px;line-height:1;">$${cobro.valor_total?.toLocaleString('es-CO')} COP</p>
          <p style="color:#059669;font-size:13px;font-weight:600;margin:0;">Pago confirmado exitosamente</p>
        </td></tr>
      </table>
      ${infoTable([
        ['Referencia de pago', cobro.referencia || '—'],
        ['Servicio', cobro.descripcion || '—'],
        ['Técnico', cobro.tecnico_nombre || '—'],
      ])}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">
        ¿Algún problema con tu pago? <a href="mailto:soporte@serviyacol.com" style="color:#059669;font-weight:600;">soporte@serviyacol.com</a>
      </p>
    `
  })
}

function tplTecnicoPagoRecibido(cobro) {
  return shell({
    headerEmoji: '💰',
    headerTitle: '¡Pago recibido!',
    headerSubtitle: `Cliente: ${cobro.cliente_nombre || '—'}`,
    body: `
      <p style="color:#0f172a;font-size:15px;font-weight:600;margin:0 0 6px;">Hola, ${cobro.tecnico_nombre} 👋</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        ¡El cliente acaba de pagar! ServiYa procesará tu transferencia en los próximos días hábiles.
      </p>
      ${infoTable([
        ['Servicio', cobro.descripcion || '—'],
        ['Cliente', cobro.cliente_nombre || '—'],
        ['Referencia', cobro.referencia || '—'],
        ['Total cobrado al cliente', `$${cobro.valor_total?.toLocaleString('es-CO')} COP`],
        ['Comisión ServiYa (15%)', `-$${cobro.valor_comision?.toLocaleString('es-CO')} COP`],
      ])}
      ${bigAmount('Lo que recibes', `$${cobro.valor_tecnico?.toLocaleString('es-CO')} COP`)}
    `
  })
}

function tplTecnicoPagado(tecnico, cobro) {
  return shell({
    headerEmoji: '✅',
    headerTitle: 'Transferencia realizada',
    headerSubtitle: 'ServiYa depositó tu pago',
    body: `
      <p style="color:#0f172a;font-size:15px;font-weight:600;margin:0 0 6px;">Hola, ${tecnico.nombre} 👋</p>
      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 20px;">
        ServiYa ha realizado la transferencia a tu cuenta bancaria registrada. Revisa tu saldo en los próximos minutos.
      </p>
      ${bigAmount('Monto transferido', `$${cobro.valor_tecnico?.toLocaleString('es-CO')} COP`, cobro.referencia ? `Ref: ${cobro.referencia}` : '')}
      ${highlight('✨ <strong>¡Gracias por tu excelente trabajo!</strong> Seguimos contando contigo para brindar el mejor servicio a nuestros clientes en Colombia.')}
    `
  })
}

function tplAdminPagoConfirmado(cobro) {
  return shell({
    headerEmoji: '💸',
    headerTitle: 'Pago confirmado por Bold',
    headerSubtitle: `Ref: ${cobro.referencia || '—'}`,
    body: `
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Bold confirmó un pago exitoso. Aquí está el resumen completo de la transacción:
      </p>
      ${infoTable([
        ['Referencia', cobro.referencia || '—'],
        ['Cliente', cobro.cliente_nombre || '—'],
        ['Técnico', cobro.tecnico_nombre || '—'],
        ['Descripción del servicio', cobro.descripcion || '—'],
        ['Total pagado por cliente', `$${cobro.valor_total?.toLocaleString('es-CO')} COP`],
        ['Comisión ServiYa', `$${cobro.valor_comision?.toLocaleString('es-CO')} COP`],
        ['Para el técnico', `$${cobro.valor_tecnico?.toLocaleString('es-CO')} COP`],
      ])}
      ${ctaBtn('Ver en el panel de admin →', `${SITE_URL}/admin`, '#7c3aed')}
    `
  })
}

function tplAdminCobroCreado(cobro) {
  return shell({
    headerEmoji: '💳',
    headerTitle: 'Nuevo cobro generado',
    headerSubtitle: `Técnico: ${cobro.tecnico_nombre || '—'} → Cliente: ${cobro.cliente_nombre || '—'}`,
    body: `
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Un técnico acaba de generar un link de pago. Aquí está el resumen del cobro:
      </p>
      ${infoTable([
        ['Técnico', cobro.tecnico_nombre || '—'],
        ['Cliente', cobro.cliente_nombre || '—'],
        ['Servicio', cobro.descripcion || '—'],
        ['Referencia', cobro.referencia || '—'],
        ['Total a cobrar', `$${cobro.valor_total?.toLocaleString('es-CO')} COP`],
        ['Comisión ServiYa (15%)', `$${cobro.valor_comision?.toLocaleString('es-CO')} COP`],
        ['Para el técnico', `$${cobro.valor_tecnico?.toLocaleString('es-CO')} COP`],
      ])}
      ${cobro.bold_link ? highlight(`🔗 <strong>Link de pago generado:</strong> <a href="${cobro.bold_link}" style="color:#059669;word-break:break-all;">${cobro.bold_link}</a>`) : ''}
      ${ctaBtn('Ver cobros en el panel →', `${SITE_URL}/admin`, '#7c3aed')}
    `
  })
}
