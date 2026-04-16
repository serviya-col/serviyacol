'use client'
import TerminosContent from './TerminosContent'
import PrivacidadContent from './PrivacidadContent'
import { useEffect } from 'react'

export default function LegalModal({ type, onClose }) {
  useEffect(() => {
    // Prevent scrolling on the main page when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  if (!type) return null

  return (
    <div className="fixed inset-0 z-[100] bg-[#071A14] overflow-y-auto w-full h-full animate-fade-in text-gray-200">
      <div className="min-h-screen font-sans selection:bg-emerald-500/30">
        <nav className="border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <span className="text-xl font-black tracking-tighter">
              <span className="text-emerald-500">Servi</span>Ya
            </span>
            <button 
              onClick={onClose} 
              className="text-xs sm:text-sm text-white font-semibold bg-white/10 hover:bg-white/20 px-3 sm:px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <span>✕</span> Cerrar
            </button>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <header className="mb-10 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
              {type === 'terminos' ? (
                <>Términos y <span className="text-emerald-500">Condiciones</span></>
              ) : (
                <>Política de <span className="text-emerald-500">Privacidad</span></>
              )}
            </h1>
            <p className="text-gray-400 text-sm sm:text-lg">
               {type === 'terminos' ? 'Última actualización: 16 de abril, 2026' : 'Habeas Data — Ley 1581 de 2012'}
            </p>
          </header>
          {type === 'terminos' ? <TerminosContent /> : <PrivacidadContent />}
        </main>
      </div>
    </div>
  )
}
