'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100'
          : 'bg-white border-b border-gray-100'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tight flex-shrink-0">
          <span className="text-brand">Servi</span>
          <span className="text-gray-900">Ya</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          <Link
            href="/#como-funciona"
            className="text-sm text-gray-500 hover:text-brand transition-colors font-medium"
          >
            ¿Cómo funciona?
          </Link>
          <Link
            href="/#servicios"
            className="text-sm text-gray-500 hover:text-brand transition-colors font-medium"
          >
            Servicios
          </Link>
          <Link
            href="/#faq"
            className="text-sm text-gray-500 hover:text-brand transition-colors font-medium"
          >
            FAQ
          </Link>
          <Link
            href="/cliente"
            className="text-sm text-gray-500 hover:text-brand transition-colors font-medium"
          >
            Mi panel
          </Link>
          <Link
            href="/tecnico"
            className="text-sm text-gray-500 hover:text-brand transition-colors font-medium"
          >
            Para técnicos
          </Link>
          <Link
            href="/solicitar"
            className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-brand/20 active:scale-95"
          >
            Solicitar técnico
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
        >
          <div
            className={`w-5 h-0.5 bg-gray-700 rounded transition-all duration-300 ${
              open ? 'rotate-45 translate-y-[6px]' : ''
            }`}
          />
          <div
            className={`w-5 h-0.5 bg-gray-700 rounded my-[5px] transition-all duration-300 ${
              open ? 'opacity-0 scale-x-0' : ''
            }`}
          />
          <div
            className={`w-5 h-0.5 bg-gray-700 rounded transition-all duration-300 ${
              open ? '-rotate-45 -translate-y-[6px]' : ''
            }`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 backdrop-blur-sm px-4 py-3 flex flex-col gap-1 animate-slide-down">
          <Link
            href="/#como-funciona"
            className="text-sm text-gray-700 font-medium py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            ¿Cómo funciona?
          </Link>
          <Link
            href="/#servicios"
            className="text-sm text-gray-700 font-medium py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            Servicios
          </Link>
          <Link
            href="/#faq"
            className="text-sm text-gray-700 font-medium py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            FAQ
          </Link>
          <Link
            href="/cliente"
            className="text-sm text-gray-700 font-medium py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            Mi panel
          </Link>
          <Link
            href="/tecnico"
            className="text-sm text-gray-700 font-medium py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors"
            onClick={() => setOpen(false)}
          >
            Para técnicos
          </Link>
          <Link
            href="/solicitar"
            className="mt-2 bg-brand text-white text-sm font-bold px-4 py-3 rounded-xl text-center hover:bg-brand-dark transition-colors"
            onClick={() => setOpen(false)}
          >
            Solicitar técnico
          </Link>
        </div>
      )}
    </nav>
  )
}
