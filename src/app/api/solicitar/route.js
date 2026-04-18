import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyTecnicoAsignado, notifyNuevaSolicitud } from '@/lib/notify'

// Admin client — puede leer/escribir sin restricción de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * POST /api/solicitar
 * Crea una solicitud. Si viene con tecnico_id:
 *   - Asigna el técnico automáticamente (estado = 'asignada')
 *   - Marca al técnico como 'ocupado' de forma atómica
 *   - Envía notificaciones al técnico y al cliente
 * Si no viene con tecnico_id:
 *   - Crea la solicitud en estado 'pendiente' para asignación manual
 *   - Notifica al admin
 */
export async function POST(req) {
  try {
    const body = await req.json()
    const {
      cliente_nombre, cliente_telefono, cliente_email,
      ciudad, categoria, descripcion, direccion,
      tecnico_id,
    } = body

    // Validación mínima
    if (!cliente_nombre || !cliente_telefono || !ciudad || !categoria || !descripcion) {
      return NextResponse.json({ error: 'Faltan campos obligatorios.' }, { status: 400 })
    }

    // ── Con técnico elegido: asignación automática ────────────────────────────
    if (tecnico_id) {
      // 1. Verificar que el técnico sigue disponible (race condition prevention)
      const { data: tec, error: tecErr } = await supabaseAdmin
        .from('tecnicos')
        .select('id, nombre, email, telefono, ciudad, categoria, disponibilidad, verificado')
        .eq('id', tecnico_id)
        .single()

      if (tecErr || !tec) {
        return NextResponse.json({ error: 'Técnico no encontrado.' }, { status: 404 })
      }
      if (!tec.verificado) {
        return NextResponse.json({ error: 'Este técnico no está verificado.' }, { status: 400 })
      }
      if (tec.disponibilidad !== 'disponible') {
        return NextResponse.json(
          { error: 'El técnico ya no está disponible. Por favor elige otro.', code: 'TECNICO_OCUPADO' },
          { status: 409 }
        )
      }

      // 2. Crear solicitud asignada
      const { data: solicitud, error: solErr } = await supabaseAdmin
        .from('solicitudes')
        .insert([{
          cliente_nombre:       cliente_nombre.trim(),
          cliente_telefono:     cliente_telefono.trim(),
          cliente_email:        cliente_email?.trim() || null,
          ciudad,
          categoria,
          descripcion:          descripcion.trim(),
          direccion:            direccion?.trim() || null,
          tecnico_id,
          tecnico_preferido_id: tecnico_id,
          estado:               'asignada',
        }])
        .select('*')
        .single()

      if (solErr) {
        console.error('[api/solicitar] insert solicitud error:', solErr)
        return NextResponse.json({ error: 'Error al crear la solicitud.' }, { status: 500 })
      }

      // 3. Marcar técnico como ocupado (atómico — solo si sigue disponible)
      const { error: updErr } = await supabaseAdmin
        .from('tecnicos')
        .update({ disponibilidad: 'ocupado' })
        .eq('id', tecnico_id)
        .eq('disponibilidad', 'disponible') // guard contra race condition

      if (updErr) {
        console.warn('[api/solicitar] No se pudo marcar técnico como ocupado:', updErr)
        // No falla el request — la solicitud ya fue creada
      }

      // 4. Notificaciones (fire-and-forget)
      try {
        await notifyTecnicoAsignado({
          solicitud: {
            tipo_servicio: categoria,
            ciudad,
            descripcion,
            direccion: direccion || '',
          },
          tecnico: {
            nombre:   tec.nombre,
            email:    tec.email,
            telefono: tec.telefono,
          },
          cliente: {
            nombre:    cliente_nombre,
            telefono:  cliente_telefono,
            email:     cliente_email || '',
          },
        })
      } catch (notifyErr) {
        console.warn('[api/solicitar] Notify error:', notifyErr.message)
      }

      return NextResponse.json({ ok: true, solicitud_id: solicitud.id, asignada: true })
    }

    // ── Sin técnico: solicitud pendiente (asignación manual por admin) ─────────
    const { data: solicitud, error: solErr } = await supabaseAdmin
      .from('solicitudes')
      .insert([{
        cliente_nombre:   cliente_nombre.trim(),
        cliente_telefono: cliente_telefono.trim(),
        cliente_email:    cliente_email?.trim() || null,
        ciudad,
        categoria,
        descripcion:      descripcion.trim(),
        direccion:        direccion?.trim() || null,
        estado:           'pendiente',
      }])
      .select('*')
      .single()

    if (solErr) {
      console.error('[api/solicitar] insert solicitud pendiente error:', solErr)
      return NextResponse.json({ error: 'Error al crear la solicitud.' }, { status: 500 })
    }

    // Notificar al admin
    try {
      await notifyNuevaSolicitud({
        solicitud: {
          tipo_servicio: categoria,
          categoria,
          ciudad,
          urgencia: 'Normal',
          descripcion,
        },
        clienteNombre: cliente_nombre,
      })
    } catch (e) {
      console.warn('[api/solicitar] Admin notify error:', e.message)
    }

    return NextResponse.json({ ok: true, solicitud_id: solicitud.id, asignada: false })

  } catch (err) {
    console.error('[api/solicitar] Unhandled error:', err)
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 })
  }
}
