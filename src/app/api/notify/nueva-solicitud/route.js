import { NextResponse } from 'next/server'
import { notifyNuevaSolicitud } from '@/lib/notify'

export async function POST(req) {
  try {
    const { solicitud, clienteNombre } = await req.json()
    if (!solicitud || !clienteNombre) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    await notifyNuevaSolicitud({ solicitud, clienteNombre })
    
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error al notificar nueva solicitud:', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
