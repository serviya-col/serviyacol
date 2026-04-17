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

    // Bold: firma = Base64( HMAC-SHA256( Base64(rawBody), secretKey ) )
    let firmaValida = true
    if (secretKey && secretKey !== 'REEMPLAZAR_CON_TU_WEBHOOK_SECRET_BOLD') {
      try {
        const encodedBody = Buffer.from(rawBody, 'utf-8').toString('base64')
        const hmacBuffer = crypto
          .createHmac('sha256', secretKey)
          .update(encodedBody)
          .digest() // raw bytes
        const calculatedBase64 = hmacBuffer.toString('base64')

        // Comparar en Base64 (longitudes siempre iguales → timingSafeEqual seguro)
        if (receivedSignature.length > 0) {
          const receivedBuf   = Buffer.from(receivedSignature, 'base64')
          const calculatedBuf = Buffer.from(calculatedBase64,  'base64')
          firmaValida = receivedBuf.length === calculatedBuf.length &&
            crypto.timingSafeEqual(receivedBuf, calculatedBuf)
        }
        // Si Bold no envía firma (raro), dejamos pasar
      } catch {
        firmaValida = false
      }
    }

    if (!firmaValida) {
      console.warn('Bold webhook: firma inválida. Received:', receivedSignature?.substring(0, 20))
      return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
    }

    // ── 3. Parsear el evento ────────────────────────────────────────────────
    const event = JSON.parse(rawBody)
    const tipo  = event.type // SALE_APPROVED | SALE_REJECTED | VOID_APPROVED | VOID_REJECTED

    const referencia    = event.data?.metadata?.reference || event.subject || ''
    const boldPaymentId = event.data?.payment_id || ''

    if (!referencia) {
      console.warn('Bold webhook: sin referencia en el evento')
      return NextResponse.json({ ok: true }) // 200 para que Bold no reintente
    }

    // ── 4. Mapear tipo → estado ─────────────────────────────────────────────
    let nuevoEstadoCobro = null

    if (tipo === 'SALE_APPROVED') {
      nuevoEstadoCobro = 'pagado'
    } else if (tipo === 'SALE_REJECTED' || tipo === 'VOID_APPROVED') {
      nuevoEstadoCobro = 'fallido'
    }

    if (!nuevoEstadoCobro) {
      console.log(`Bold webhook: tipo no manejado: ${tipo}`)
      return NextResponse.json({ ok: true })
    }

    // ── 5. Actualizar cobro en Supabase ─────────────────────────────────────
    const updateData = { estado: nuevoEstadoCobro }
    if (boldPaymentId) updateData.bold_payment_id = boldPaymentId
    if (nuevoEstadoCobro === 'pagado') updateData.fecha_pago = new Date().toISOString()

    const { error: updateErr } = await supabaseAdmin
      .from('cobros')
      .update(updateData)
      .eq('referencia', referencia)

    if (updateErr) {
      console.error('Supabase update error en webhook:', updateErr)
      return NextResponse.json({ ok: true }) // 200 igual para evitar reintentos
    }

    console.log(`Cobro ${referencia} → ${nuevoEstadoCobro}`)

    // ── 6. Obtener cobro completo para acciones secundarias ─────────────────
    const { data: cobro } = await supabaseAdmin
      .from('cobros')
      .select('*')
      .eq('referencia', referencia)
      .single()

    if (!cobro) {
      return NextResponse.json({ ok: true })
    }

    // ── 7. Actualizar la solicitud vinculada (si existe) ────────────────────
    // Estrategia: buscar por solicitud_id primero, luego por tecnico_id + cliente_telefono
    if (cobro.solicitud_id) {
      // Columna directa (si fue vinculada al crear el cobro)
      const nuevoEstadoSolicitud = nuevoEstadoCobro === 'pagado' ? 'completada' : 'cancelada'
      await supabaseAdmin
        .from('solicitudes')
        .update({ estado: nuevoEstadoSolicitud })
        .eq('id', cobro.solicitud_id)
      console.log(`Solicitud ${cobro.solicitud_id} → ${nuevoEstadoSolicitud}`)
    } else if (cobro.tecnico_id && cobro.cliente_telefono) {
      // Fallback: buscar la solicitud más reciente asignada a este técnico con este cliente
      const nuevoEstadoSolicitud = nuevoEstadoCobro === 'pagado' ? 'completada' : 'cancelada'
      const { data: sols } = await supabaseAdmin
        .from('solicitudes')
        .select('id, estado')
        .eq('tecnico_id', cobro.tecnico_id)
        .eq('cliente_telefono', cobro.cliente_telefono)
        .in('estado', ['asignada', 'en_curso'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (sols && sols.length > 0) {
        await supabaseAdmin
          .from('solicitudes')
          .update({ estado: nuevoEstadoSolicitud })
          .eq('id', sols[0].id)
        console.log(`Solicitud ${sols[0].id} → ${nuevoEstadoSolicitud} (por teléfono)`)
      }
    }

    // ── 8. Notificaciones y tracking (solo en pagos aprobados) ──────────────
    if (nuevoEstadoCobro === 'pagado') {
      try {
        // Adjuntar datos del técnico para la notificación
        if (cobro.tecnico_id) {
          const { data: tec } = await supabaseAdmin
            .from('tecnicos')
            .select('email, telefono')
            .eq('id', cobro.tecnico_id)
            .single()
          if (tec) {
            cobro.tecnico_email    = tec.email
            cobro.tecnico_telefono = cobro.tecnico_telefono || tec.telefono
          }
        }

        await notifyPagoConfirmado({ cobro })

        // Track Meta Purchase via CAPI
        const { sendMetaEvent } = await import('@/lib/meta-capi')
        await sendMetaEvent('Purchase', {
          currency: 'COP',
          value: cobro.valor_total,
          content_name: cobro.descripcion || 'Servicio ServiYa',
          order_id: cobro.referencia,
        }, {
          email:    cobro.tecnico_email,
          telefono: cobro.tecnico_telefono,
        })
      } catch (notifyErr) {
        console.warn('Notify/Meta error:', notifyErr.message)
      }
    }

    // ── 9. Responder 200 (Bold requiere < 2 segundos) ───────────────────────
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('bold-webhook error:', err)
    return NextResponse.json({ ok: true }) // 200 siempre para evitar reintentos
  }
}
