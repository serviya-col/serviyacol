'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function PagoExitosoContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || ''

  const [cobro, setCobro]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ref) { setLoading(false); return }
    supabase
      .from('cobros')
      .select('referencia, descripcion, valor_total, tecnico_nombre, created_at')
      .eq('referencia', ref)
      .single()
      .then(({ data }) => { setCobro(data); setLoading(false) })
  }, [ref])

  function formatCOP(v) {
    return '$' + Number(v || 0).toLocaleString('es-CO')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-[#071A14] to-[#0D2B1E]">

      {/* Ícono animado */}
      <div className="w-28 h-28 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-6 animate-bounce-once">
        <svg className="w-14 h-14 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      <h1 className="text-3xl font-extrabold text-white mb-2 text-center">¡Pago recibido!</h1>
      <p className="text-white/60 text-center mb-8 max-w-xs">
        Tu pago fue procesado exitosamente. El técnico ha sido notificado.
      </p>

      {loading ? (
        <span className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin block mb-8" />
      ) : cobro ? (
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 space-y-3">
          <div className="flex justify-between">
            <span className="text-white/50 text-sm">Referencia</span>
            <span className="text-emerald-300 font-mono text-sm font-bold">{cobro.referencia}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50 text-sm">Servicio</span>
            <span className="text-white text-sm font-medium text-right max-w-[60%]">{cobro.descripcion}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50 text-sm">Técnico</span>
            <span className="text-white text-sm">{cobro.tecnico_nombre}</span>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3">
            <span className="text-white font-bold">Total pagado</span>
            <span className="text-emerald-400 font-extrabold text-xl">{formatCOP(cobro.valor_total)}</span>
          </div>
        </div>
      ) : ref ? (
        <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-center">
          <p className="text-white/50 text-sm">Referencia: <span className="text-emerald-300 font-mono">{ref}</span></p>
        </div>
      ) : null}

      <div className="w-full max-w-sm space-y-3">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💬</span>
          <p className="text-sm text-emerald-200">
            Recibirás una confirmación y el técnico coordinará contigo los detalles del servicio.
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3.5 rounded-2xl transition-all text-sm"
        >
          Ir a ServiYa →
        </Link>
      </div>
    </div>
  )
}

export default function PagoExitosoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#071A14] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin block" />
      </div>
    }>
      <PagoExitosoContent />
    </Suspense>
  )
}
