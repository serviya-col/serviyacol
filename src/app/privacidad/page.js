'use client'
import Link from 'next/link'
import PrivacidadContent from '@/components/PrivacidadContent'
import Logo from '@/components/Logo'


export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#071A14] text-gray-200 font-sans selection:bg-emerald-500/30">
      {/* Header / Nav Simple */}
      <nav className="border-b border-white/5 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity" aria-label="ServiYa — inicio">
            <Logo variant="white" />
          </Link>

          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            Volver al inicio
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Política de <span className="text-emerald-500">Privacidad</span>
          </h1>
          <p className="text-gray-400 text-lg">Habeas Data — Ley 1581 de 2012</p>
        </header>

        <PrivacidadContent />

      </main>

      <footer className="border-t border-white/5 py-10 text-center opacity-50 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} ServiYa by Renting Amc Agency. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
