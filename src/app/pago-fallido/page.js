'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function PagoFallidoContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || ''

  const [cobro, setCobro]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ref) { setLoading(false); return }
    supabase
      .from('cobros')
      .select('referencia, descripcion, valor_total, bold_link')
      .eq('referencia', ref)
      .single()
      .then(({ data }) => { setCobro(data); setLoading(false) })
  }, [ref])

  function formatCOP(v) {
    return '$' + Number(v || 0).toLocaleString('es-CO')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-[#1A0707] to-[#2B0D0D]">

      {/* Ícono */}
      <div className="w-28 h-28 rounded-full bg-red-500/10 border-2 border-red-400/50 flex items-center justify-center mb-6">
        <svg className="w-14 h-14 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>

      <h1 className="text-3xl font-extrabold text-white mb-2 text-center">Pago no completado</h1>
      <p className="text-white/50 text-center mb-8 max-w-xs">
        Hubo un problema procesando tu pago. Puedes intentarlo de nuevo con el mismo link.
      </p>

      {loading ? (
        <span className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin block mb-8" />
      ) : (
        <div className="w-full max-w-sm space-y-4 mb-8">
          {cobro && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Referencia</span>
                <span className="text-red-300 font-mono text-sm">{cobro.referencia}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50 text-sm">Servicio</span>
                <span className="text-white text-sm text-right max-w-[60%]">{cobro.descripcion}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3">
                <span className="text-white font-bold">Valor</span>
                <span className="text-white font-bold">{formatCOP(cobro.valor_total)}</span>
              </div>
            </div>
          )}

          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <p className="text-sm text-amber-200">
              Asegúrate que tu tarjeta tenga fondos suficientes o prueba con otro método de pago como PSE o Nequi.
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm space-y-3">
        {cobro?.bold_link && (
          <a
            href={cobro.bold_link}
            className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all text-lg"
          >
            🔄 Reintentar pago
          </a>
        )}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3.5 rounded-2xl transition-all text-sm"
        >
          Ir a ServiYa
        </Link>
      </div>
    </div>
  )
}

export default function PagoFallidoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1A0707] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin block" />
      </div>
    }>
      <PagoFallidoContent />
    </Suspense>
  )
}
