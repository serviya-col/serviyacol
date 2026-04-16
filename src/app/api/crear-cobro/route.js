import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { notifyCobroCreado } from '@/lib/notify'

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

    // ── Crear link de pago en Bold ─────────────────────────────────────────
    const boldKey = process.env.BOLD_API_KEY || ''

    let boldLink = null
    let boldPaymentLinkId = null

    if (boldKey && boldKey !== 'REEMPLAZAR_CON_TU_API_KEY_BOLD') {
      // Expiración: 72 horas en nanosegundos
      const expiration = (Date.now() + 72 * 60 * 60 * 1000) * 1e6

      const boldBody = {
        amount_type: 'CLOSE',
        amount: {
          currency: 'COP',
          total_amount: monto,
          tip_amount: 0,
        },
        reference: referencia,
        description: `ServiYa: ${descripcion.substring(0, 80)}`,
        expiration_date: Math.floor(expiration),
        callback_url: `${siteUrl}/pago-exitoso?ref=${referencia}`,
        payment_methods: ['CREDIT_CARD', 'PSE', 'NEQUI', 'BOTON_BANCOLOMBIA'],
      }

      const boldRes = await fetch(`${BOLD_API_URL}/online/link/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `x-api-key ${boldKey}`,
        },
        body: JSON.stringify(boldBody),
      })

      const boldData = await boldRes.json()

      if (boldRes.ok && boldData.payload?.url) {
        boldLink            = boldData.payload.url
        boldPaymentLinkId   = boldData.payload.payment_link
      } else {
        console.error('Bold API error:', boldData)
        return NextResponse.json(
          { error: 'Error al crear el link de pago en Bold. Verifica tu API key.' },
          { status: 502 }
        )
      }
    } else {
      // Modo demo sin API key — genera link placeholder
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

    // ── Notificar al cliente ───────────────────────────────────────────────────
    notifyCobroCreado({
      cobro: {
        referencia, cliente_nombre, cliente_telefono, cliente_email: cliente_email || null,
        tecnico_nombre, descripcion, valor_total: monto, bold_link: boldLink,
      },
    }).catch(() => {})

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
