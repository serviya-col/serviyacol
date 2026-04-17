'use client'
import Link from 'next/link'
import TerminosContent from '@/components/TerminosContent'
import Logo from '@/components/Logo'


export default function TerminosPage() {
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
            Términos y <span className="text-emerald-500">Condiciones</span>
          </h1>
          <p className="text-gray-400 text-lg">Última actualización: 16 de abril, 2026</p>
        </header>

        <TerminosContent />

      </main>

      <footer className="border-t border-white/5 py-10 text-center opacity-50 text-xs">
        <p>© {new Date().getFullYear()} ServiYa by Renting Amc Agency. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
