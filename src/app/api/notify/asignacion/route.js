import { NextResponse } from 'next/server'
import { notifyTecnicoAsignado } from '@/lib/notify'

/**
 * POST /api/notify/asignacion
 * Body: { solicitud, tecnico, cliente }
 * Llamado desde admin/page.js cuando se asigna un técnico a una solicitud.
 */
export async function POST(req) {
  try {
    const { solicitud, tecnico, cliente } = await req.json()
    if (!solicitud || !tecnico) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 })
    }
    await notifyTecnicoAsignado({ solicitud, tecnico, cliente })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/notify/asignacion]', err)
    return NextResponse.json({ ok: true })
  }
}
