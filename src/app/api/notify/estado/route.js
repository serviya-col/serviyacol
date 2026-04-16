import { NextResponse } from 'next/server'
import { notifyTecnicoEnCamino, notifyServicioCompletado } from '@/lib/notify'

/**
 * POST /api/notify/estado
 * Body: { nuevoEstado: 'en_curso'|'completada', solicitud, tecnico, cliente }
 * Llamado desde tecnico/page.js cuando el técnico actualiza el estado.
 */
export async function POST(req) {
  try {
    const { nuevoEstado, solicitud, tecnico, cliente } = await req.json()
    if (!nuevoEstado || !solicitud || !tecnico) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 })
    }

    if (nuevoEstado === 'en_curso') {
      await notifyTecnicoEnCamino({ solicitud, tecnico, cliente })
    } else if (nuevoEstado === 'completada') {
      await notifyServicioCompletado({ solicitud, tecnico, cliente })
    }
    // Otros estados (pendiente, cancelada) no generan notificación aquí

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/notify/estado]', err)
    return NextResponse.json({ ok: true })
  }
}
