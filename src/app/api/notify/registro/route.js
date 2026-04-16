import { NextResponse } from 'next/server'
import { notifyBienvenidaCliente, notifyBienvenidaTecnico } from '@/lib/notify'

/**
 * POST /api/notify/registro
 * Body: { tipo: 'cliente'|'tecnico', nombre, email, telefono }
 * Llamado desde el frontend justo después del registro exitoso.
 */
export async function POST(req) {
  try {
    const { tipo, nombre, email, telefono } = await req.json()
    if (!tipo || !nombre) {
      return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })
    }

    if (tipo === 'cliente') {
      await notifyBienvenidaCliente({ nombre, email, telefono })
    } else if (tipo === 'tecnico') {
      await notifyBienvenidaTecnico({ nombre, email, telefono })
    } else {
      return NextResponse.json({ error: 'Tipo inválido. Usa "cliente" o "tecnico".' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/notify/registro]', err)
    return NextResponse.json({ ok: true }) // No bloquear el flujo del usuario
  }
}
