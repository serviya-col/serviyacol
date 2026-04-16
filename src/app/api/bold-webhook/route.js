import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-server'
import { notifyPagoConfirmado } from '@/lib/notify'

export async function POST(req) {
  try {
    // ── 1. Leer raw body ────────────────────────────────────────────────────
    const rawBody = await req.text()

    // ── 2. Verificar firma HMAC-SHA256 de Bold ──────────────────────────────
    const receivedSignature = req.headers.get('x-bold-signature') || ''
    const secretKey = process.env.BOLD_WEBHOOK_SECRET || ''

    // Bold: codificar body en Base64, luego HMAC-SHA256 en hex
    const encodedBody = Buffer.from(rawBody, 'utf-8').toString('base64')
    const calculatedHmac = crypto
      .createHmac('sha256', secretKey)
      .update(encodedBody)
      .digest('hex')

    // En modo pruebas, secretKey es string vacío, por eso dejarmos pasar si está vacío
    const firmesValida =
      !secretKey ||
      secretKey === 'REEMPLAZAR_CON_TU_WEBHOOK_SECRET_BOLD' ||
      crypto.timingSafeEqual(
        Buffer.from(calculatedHmac, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      )

    if (!firmesValida) {
      console.warn('Bold webhook: firma inválida')
      return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
    }

    // ── 3. Parsear el evento ────────────────────────────────────────────────
    const event = JSON.parse(rawBody)
    const tipo  = event.type // SALE_APPROVED | SALE_REJECTED | VOID_APPROVED | VOID_REJECTED

    const referencia   = event.data?.metadata?.reference || event.subject || ''
    const boldPaymentId = event.data?.payment_id || ''

    if (!referencia) {
      console.warn('Bold webhook: sin referencia en el evento')
      return NextResponse.json({ ok: true }) // Responder 200 para que Bold no reintente
    }

    // ── 4. Actualizar estado en Supabase ────────────────────────────────────
    let nuevoEstado = null

    if (tipo === 'SALE_APPROVED') {
      nuevoEstado = 'pagado'
    } else if (tipo === 'SALE_REJECTED' || tipo === 'VOID_APPROVED') {
      nuevoEstado = 'fallido'
    }

    if (nuevoEstado) {
      const updateData = { estado: nuevoEstado }
      if (boldPaymentId) updateData.bold_payment_id = boldPaymentId
      if (nuevoEstado === 'pagado') updateData.fecha_pago = new Date().toISOString()

      const { error } = await supabaseAdmin
        .from('cobros')
        .update(updateData)
        .eq('referencia', referencia)

      if (error) {
        console.error('Supabase update error en webhook:', error)
      } else {
        console.log(`Cobro ${referencia} actualizado a ${nuevoEstado}`)

        // ── Notificar pago confirmado ────────────────────────────────────────
        if (nuevoEstado === 'pagado') {
          try {
            // Buscar el cobro completo + email del técnico
            const { data: cobro } = await supabaseAdmin
              .from('cobros').select('*').eq('referencia', referencia).single()

            if (cobro?.tecnico_id) {
              const { data: tec } = await supabaseAdmin
                .from('tecnicos').select('email, telefono').eq('id', cobro.tecnico_id).single()
              if (tec) {
                cobro.tecnico_email   = tec.email
                cobro.tecnico_telefono = cobro.tecnico_telefono || tec.telefono
              }
            }
            if (cobro) await notifyPagoConfirmado({ cobro })
          } catch (notifyErr) {
            console.warn('Notify pago error:', notifyErr.message)
          }
        }
      }
    }

    // ── 5. Responder 200 inmediatamente (Bold requiere < 2 segundos) ────────
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('bold-webhook error:', err)
    // Aún respondemos 200 para evitar reintentos en errores no críticos
    return NextResponse.json({ ok: true })
  }
}
