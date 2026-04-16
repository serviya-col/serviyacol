import { NextResponse } from 'next/server'
import { notifyTecnicoPagado } from '@/lib/notify'

/**
 * POST /api/notify/pago-tecnico
 * Body: { tecnico: { nombre, email, telefono }, cobro: { referencia, valor_tecnico, descripcion } }
 * Llamado desde admin/page.js cuando el admin marca el pago al técnico como realizado.
 */
export async function POST(req) {
  try {
    const { tecnico, cobro } = await req.json()
    if (!tecnico || !cobro) {
      return NextResponse.json({ error: 'Faltan datos.' }, { status: 400 })
    }
    await notifyTecnicoPagado({ tecnico, cobro })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/notify/pago-tecnico]', err)
    return NextResponse.json({ ok: true })
  }
}
