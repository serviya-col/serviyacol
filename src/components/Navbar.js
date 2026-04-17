'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Logo from '@/components/Logo'


export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close on escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100'
            : 'bg-white border-b border-gray-100'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center" aria-label="ServiYa — inicio">
            <Logo />
          </Link>


          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            <Link href="/#como-funciona" className="text-sm text-gray-500 hover:text-brand transition-colors font-medium">¿Cómo funciona?</Link>
            <Link href="/#servicios" className="text-sm text-gray-500 hover:text-brand transition-colors font-medium">Servicios</Link>
            <Link href="/#faq" className="text-sm text-gray-500 hover:text-brand transition-colors font-medium">FAQ</Link>
            <Link href="/cliente" className="text-sm text-gray-500 hover:text-brand transition-colors font-medium">Mi panel</Link>
            <Link href="/tecnico" className="text-sm text-gray-500 hover:text-brand transition-colors font-medium">Para técnicos</Link>
            <Link href="/solicitar" className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-brand/20 active:scale-95">
              Solicitar técnico
            </Link>
          </div>

          {/* Mobile hamburger — bigger touch target */}
          <button
            className="md:hidden p-3 -mr-2 rounded-xl hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            <div className={`w-5 h-0.5 bg-gray-700 rounded transition-all duration-300 ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
            <div className={`w-5 h-0.5 bg-gray-700 rounded my-[5px] transition-all duration-300 ${open ? 'opacity-0 scale-x-0' : ''}`} />
            <div className={`w-5 h-0.5 bg-gray-700 rounded transition-all duration-300 ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
          </button>
        </div>

        {/* Mobile menu — slide down */}
        {open && (
          <div className="md:hidden border-t border-gray-100 bg-white/98 backdrop-blur-sm px-4 py-3 flex flex-col gap-1 animate-slide-down">
            <Link href="/#como-funciona" className="text-sm text-gray-700 font-medium py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] flex items-center" onClick={() => setOpen(false)}>¿Cómo funciona?</Link>
            <Link href="/#servicios" className="text-sm text-gray-700 font-medium py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] flex items-center" onClick={() => setOpen(false)}>Servicios</Link>
            <Link href="/#faq" className="text-sm text-gray-700 font-medium py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] flex items-center" onClick={() => setOpen(false)}>FAQ</Link>
            <Link href="/cliente" className="text-sm text-gray-700 font-medium py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] flex items-center" onClick={() => setOpen(false)}>Mi panel de cliente</Link>
            <Link href="/tecnico" className="text-sm text-gray-700 font-medium py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors min-h-[44px] flex items-center" onClick={() => setOpen(false)}>Para técnicos</Link>
            <div className="border-t border-gray-100 mt-2 pt-3 pb-1">
              <Link href="/solicitar" className="bg-brand text-white text-sm font-bold px-4 py-3.5 rounded-xl text-center hover:bg-brand-dark transition-colors block min-h-[44px] flex items-center justify-center" onClick={() => setOpen(false)}>
                🔧 Solicitar técnico ahora
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Overlay to close menu on outside tap */}
      {open && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
