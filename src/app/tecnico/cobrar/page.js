'use client'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

// ─── Utilidades ────────────────────────────────────────────────────────────────
function formatCOP(num) {
  if (!num || isNaN(num)) return '$0'
  return '$' + Math.round(num).toLocaleString('es-CO')
}

function parseCOP(str) {
  return parseInt(str.replace(/\D/g, '')) || 0
}

// ─── Componente principal ───────────────────────────────────────────────────────
export default function CobrarPage() {
  const router = useRouter()

  const [tecnico, setTecnico] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [form, setForm] = useState({
    cliente_nombre:   '',
    cliente_telefono: '',
    cliente_email:    '',
    descripcion:      '',
    valor_raw:        '',
  })

  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [resultado, setResultado]   = useState(null) // { bold_link, whatsapp_link, referencia, resumen }

  // Cargar datos del técnico autenticado
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/tecnico'); return }

      const { data: tec } = await supabase
        .from('tecnicos')
        .select('id, nombre, telefono, ciudad')
        .eq('auth_user_id', user.id)
        .single()

      if (!tec) { router.push('/tecnico'); return }

      setTecnico(tec)
      setAuthLoading(false)
    })()
  }, [router])

  // Cálculos en tiempo real
  const valor = parseCOP(form.valor_raw)
  const comision = useMemo(() => Math.round(valor * 0.15), [valor])
  const paraTecnico = useMemo(() => valor - comision, [valor, comision])

  const handleValorChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    setForm(f => ({ ...f, valor_raw: raw ? Number(raw).toLocaleString('es-CO') : '' }))
  }

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.cliente_nombre.trim()) return setError('Ingresa el nombre del cliente.')
    if (!form.cliente_telefono.trim()) return setError('Ingresa el teléfono/WhatsApp del cliente.')
    if (!form.descripcion.trim()) return setError('Describe el trabajo realizado.')
    if (valor < 1000) return setError('El valor mínimo es $1.000 COP.')

    setLoading(true)

    const res = await fetch('/api/crear-cobro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tecnico_id:       tecnico.id,
        tecnico_nombre:   tecnico.nombre,
        tecnico_telefono: tecnico.telefono || '',
        cliente_nombre:   form.cliente_nombre.trim(),
        cliente_telefono: form.cliente_telefono.trim(),
        cliente_email:    form.cliente_email.trim() || null,
        descripcion:      form.descripcion.trim(),
        valor_total:      valor,
        ciudad:           tecnico.ciudad || '',
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok || !data.ok) {
      setError(data.error || 'Error al generar el link de pago.')
      return
    }

    setResultado(data)
  }

  // ── Loading auth ──────────────────────────────────────────────────────────
  if (authLoading) return (
    <div className="min-h-screen bg-[#071A14] flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin block" />
    </div>
  )

  // ── Pantalla de resultado ─────────────────────────────────────────────────
  if (resultado) {
    const { bold_link, whatsapp_link, referencia, resumen } = resultado
    return (
      <div className="min-h-screen bg-[#071A14] flex flex-col items-center justify-center px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-400">
            <span className="text-4xl">🔗</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">¡Link generado!</h1>
          <p className="text-emerald-300 text-sm">Ref: {referencia}</p>
        </div>

        {/* Desglose de montos */}
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-5 mb-5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-sm">Cliente paga</span>
            <span className="text-white font-bold text-lg">{formatCOP(resumen.valor_total)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-white/10 pt-3">
            <span className="text-white/60 text-sm">ServiYa ({resumen.porcentaje}% comisión)</span>
            <span className="text-amber-400 font-semibold">- {formatCOP(resumen.valor_comision)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-emerald-400/30 pt-3">
            <span className="text-emerald-300 font-bold text-sm">Tú recibes</span>
            <span className="text-emerald-400 font-extrabold text-xl">{formatCOP(resumen.valor_tecnico)}</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="w-full max-w-sm space-y-3">
          <a
            href={whatsapp_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all text-lg shadow-lg shadow-green-900/40"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.151-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Enviar al cliente por WhatsApp
          </a>

          <a
            href={bold_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white font-semibold py-3.5 rounded-2xl transition-all"
          >
            🔗 Ver link de pago
          </a>

          <button
            onClick={() => { setResultado(null); setForm({ cliente_nombre: '', cliente_telefono: '', cliente_email: '', descripcion: '', valor_raw: '' }) }}
            className="w-full text-white/50 text-sm py-2 hover:text-white transition-colors"
          >
            ← Crear otro cobro
          </button>
        </div>
      </div>
    )
  }

  // ── Formulario principal ──────────────────────────────────────────────────
  return (
    <>
      {/* Header fijo mobile */}
      <div className="sticky top-0 z-50 bg-[#071A14] border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <Link href="/tecnico" className="text-white/50 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-base font-bold text-white">Generar cobro</h1>
          <p className="text-xs text-emerald-400">{tecnico?.nombre}</p>
        </div>
        <div className="ml-auto">
          <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-full font-semibold">
            ServiYa Pay
          </span>
        </div>
      </div>

      <div className="min-h-screen bg-[#0A1A14]">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 pt-5 pb-28 space-y-5">

          {/* ── Card: Cliente ─────────────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Datos del cliente</p>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Nombre completo *</label>
              <input
                name="cliente_nombre"
                value={form.cliente_nombre}
                onChange={handleChange}
                placeholder="Ej: María García"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">WhatsApp del cliente *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">🇨🇴 +57</span>
                <input
                  name="cliente_telefono"
                  value={form.cliente_telefono}
                  onChange={handleChange}
                  placeholder="3001234567"
                  type="tel"
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pr-4 pl-16 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-white/30 mt-1">Le enviarás el link directamente a este número.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                Correo del cliente <span className="text-white/30 font-normal">(opcional — para envío por email)</span>
              </label>
              <input
                name="cliente_email"
                type="email"
                value={form.cliente_email}
                onChange={handleChange}
                placeholder="cliente@correo.com"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* ── Card: Servicio ────────────────────────────────────── */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Servicio realizado</p>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Descripción del trabajo *</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={3}
                placeholder="Ej: Instalación de toma corriente doble en habitación principal..."
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-1.5">Valor del trabajo (COP) *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-bold text-lg">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.valor_raw}
                  onChange={handleValorChange}
                  placeholder="0"
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-4 pr-4 pl-10 text-white placeholder-white/30 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all tracking-tight"
                />
              </div>
            </div>
          </div>

          {/* ── Preview comisión en tiempo real ──────────────────── */}
          {valor >= 1000 && (
            <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Desglose del cobro</p>
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm">Cliente paga</span>
                <span className="text-white font-bold text-lg">{formatCOP(valor)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-sm">Comisión ServiYa (15%)</span>
                <span className="text-amber-400 font-semibold">- {formatCOP(comision)}</span>
              </div>
              <div className="border-t border-emerald-500/30 pt-3 flex justify-between items-center">
                <span className="text-emerald-300 font-bold">Tú recibes</span>
                <span className="text-emerald-400 font-extrabold text-2xl">{formatCOP(paraTecnico)}</span>
              </div>
            </div>
          )}

          {/* ── Error ─────────────────────────────────────────────── */}
          {error && (
            <div className="bg-red-500/10 border border-red-400/30 text-red-300 text-sm px-4 py-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}

          {/* ── Botón submit (fijo abajo en mobile) ───────────────── */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0A1A14]/95 backdrop-blur-sm border-t border-white/10">
            <button
              type="submit"
              disabled={loading || valor < 1000}
              className="w-full max-w-lg mx-auto block bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-lg transition-all active:scale-95 shadow-lg shadow-emerald-900/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generando link...
                </span>
              ) : (
                '🔗 Generar link de pago'
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
