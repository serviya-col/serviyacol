// Componente footer compartido para todos los paneles
export default function PanelFooter({ role = 'panel' }) {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-10 border-t border-gray-100 bg-white/60 backdrop-blur-sm">
      <div className="px-4 py-6 max-w-5xl mx-auto">
        {/* Logo + tagline */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="text-lg font-extrabold text-gray-900">
                <span className="text-emerald-600">Servi</span>Ya
              </span>
              <p className="text-xs text-gray-400 mt-0.5">Técnicos verificados a domicilio en Colombia</p>
            </div>
            {/* Links de contacto — wrap on mobile */}
            <div className="flex flex-wrap gap-x-4 gap-y-3">
              <a
                href="https://wa.me/573138537261?text=Hola+ServiYa+%F0%9F%91%8B"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition-colors min-h-[44px] sm:min-h-0"
              >
                <span className="text-base">💬</span> WhatsApp soporte
              </a>
              <a
                href="mailto:soporte@serviyacol.com"
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition-colors min-h-[44px] sm:min-h-0"
              >
                <span className="text-base">✉️</span> soporte@serviyacol.com
              </a>
            </div>
          </div>

          {/* Divider + legal */}
          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-[10px] text-gray-300">
              © {year} ServiYa · Renting Amc Agency · NIT 1075293497-7
            </p>
            <div className="flex items-center gap-3">
              <a href="/terminos" className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors py-1">Términos</a>
              <span className="text-gray-200">·</span>
              <a href="/privacidad" className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors py-1">Privacidad</a>
              <span className="text-gray-200">·</span>
              <span className="text-[10px] text-gray-300">v1.0.0</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
