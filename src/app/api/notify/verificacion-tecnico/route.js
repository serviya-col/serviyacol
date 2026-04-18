import { NextResponse } from 'next/server'
import { notifyTecnicoVerificado } from '@/lib/notify'

/**
 * POST /api/notify/verificacion-tecnico
 * Body: { tecnico: { nombre, email, telefono } }
 * Llamado desde admin/page.js cuando el admin verifica la cuenta de un técnico.
 */
export async function POST(req) {
  try {
    const { tecnico } = await req.json()
    if (!tecnico?.email) {
      return NextResponse.json({ error: 'Faltan datos del técnico.' }, { status: 400 })
    }
    await notifyTecnicoVerificado({
      nombre:   tecnico.nombre   || 'Técnico',
      email:    tecnico.email,
      telefono: tecnico.telefono || null,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/notify/verificacion-tecnico]', err)
    return NextResponse.json({ ok: true }) // fire-and-forget — no bloquear al admin
  }
}
