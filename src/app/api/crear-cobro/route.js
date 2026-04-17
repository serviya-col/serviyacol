import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { notifyCobroCreado, notifyAdminCobroCreado } from '@/lib/notify'


const BOLD_API_URL = 'https://integrations.api.bold.co'
const COMISION_PCT = 15

function generarReferencia() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let codigo = ''
  for (let i = 0; i < 5; i++) {
    codigo += chars[Math.floor(Math.random() * chars.length)]
  }
  return `SY-${codigo}-${Date.now()}`
}

export async function POST(req) {
  try {
    const body = await req.json()
    const {
    tecnico_id,
      tecnico_nombre,
      tecnico_telefono,
      cliente_nombre,
      cliente_telefono,
      cliente_email,
      descripcion,
      valor_total,
      ciudad,
    } = body

    // Validaciones básicas
    if (!tecnico_nombre || !cliente_nombre || !descripcion || !valor_total) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
    }

    const monto = parseInt(valor_total)
    if (isNaN(monto) || monto < 1000) {
      return NextResponse.json({ error: 'El valor mínimo es $1.000 COP.' }, { status: 400 })
    }

    // Calcular comisión
    const valor_comision = Math.round(monto * (COMISION_PCT / 100))
    const valor_tecnico  = monto - valor_comision
    const referencia     = generarReferencia()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.serviyacol.com'

    // ── Crear link de pago Bold (Checkout URL) ─────────────────────────────
    // Usamos la llave de identidad para generar el link de pago de Bold.
    // El formato es: https://checkout.bold.co/payment/link/{identityKey}
    // con parámetros de la transacción en la URL.
    const boldIdentityKey = process.env.BOLD_IDENTITY_KEY || ''
    const boldSecretKey   = process.env.BOLD_API_KEY || process.env.BOLD_WEBHOOK_SECRET || ''

    let boldLink = null
    let boldPaymentLinkId = `SY-${referencia}`

    if (boldIdentityKey) {
      // Bold Checkout URL — funciona con la llave de identidad directamente
      // Documentación: https://bold.co/developers/checkout
      const params = new URLSearchParams({
        amount: monto,
        currency: 'COP',
        reference: referencia,
        description: `ServiYa: ${descripcion.substring(0, 80)}`,
        redirect_url: `${siteUrl}/pago-exitoso?ref=${referencia}`,
        integrity_signature: '', // Se puede omitir en modo básico
      })
      boldLink = `https://checkout.bold.co/payment/link/${boldIdentityKey}?${params.toString()}`
      boldPaymentLinkId = referencia
    } else {
      // Fallback — link placeholder para modo demo
      boldLink          = `${siteUrl}/pago-demo?ref=${referencia}`
      boldPaymentLinkId = `DEMO-${referencia}`
    }


    // ── Guardar cobro en Supabase ──────────────────────────────────────────
    const { error: dbError } = await supabaseAdmin.from('cobros').insert([{
      referencia,
      tecnico_id:           tecnico_id || null,
      tecnico_nombre,
      tecnico_telefono,
      cliente_nombre,
      cliente_telefono,
      cliente_email:        cliente_email || null,
      ciudad:               ciudad || null,
      descripcion,
      valor_total:          monto,
      porcentaje_comision:  COMISION_PCT,
      valor_comision,
      valor_tecnico,
      estado:               'pendiente',
      bold_payment_link_id: boldPaymentLinkId,
      bold_link:            boldLink,
    }])

    if (dbError) {
      console.error('Supabase insert error:', dbError)
      return NextResponse.json(
        { error: 'Error al registrar el cobro. Intenta de nuevo.' },
        { status: 500 }
      )
    }

    // ── Armar link de WhatsApp ─────────────────────────────────────────────
    const clienteTel = cliente_telefono.replace(/\D/g, '')
    const waNumber   = clienteTel.startsWith('57') ? clienteTel : `57${clienteTel}`

    const waMsg = encodeURIComponent(
      `Hola ${cliente_nombre} 👋, soy ${tecnico_nombre} de ServiYa.\n\n` +
      `Te envío el link de pago seguro por el servicio de *${descripcion}*.\n\n` +
      `💰 Total a pagar: *$${monto.toLocaleString('es-CO')} COP*\n\n` +
      `🔒 Paga de forma segura aquí:\n${boldLink}\n\n` +
      `Puedes pagar con tarjeta, PSE, Nequi o Bancolombia. ¡Gracias!`
    )

    const whatsapp_link = `https://wa.me/${waNumber}?text=${waMsg}`

    // ── Notificar al cliente y al admin ───────────────────────────────────────
    const cobroData = {
      referencia, cliente_nombre, cliente_telefono, cliente_email: cliente_email || null,
      tecnico_nombre, descripcion, valor_total: monto, bold_link: boldLink,
      valor_comision, valor_tecnico,
    }
    notifyCobroCreado({ cobro: cobroData }).catch(() => {})

    // Notificar al admin (email + WhatsApp)
    notifyAdminCobroCreado({ cobro: cobroData }).catch(() => {})


    return NextResponse.json({
      ok: true,
      referencia,
      bold_link: boldLink,
      whatsapp_link,
      resumen: {
        valor_total:     monto,
        valor_comision,
        valor_tecnico,
        porcentaje:      COMISION_PCT,
      },
    })
  } catch (err) {
    console.error('crear-cobro error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
