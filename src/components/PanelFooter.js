// Componente footer compartido para todos los paneles
export default function PanelFooter({ role = 'panel' }) {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-8 border-t border-gray-100 bg-white/60 backdrop-blur-sm">
      <div className="px-4 py-5 max-w-5xl mx-auto">
        {/* Logo + tagline */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-lg font-extrabold text-gray-900">
              <span className="text-emerald-600">Servi</span>Ya
            </span>
            <p className="text-xs text-gray-400 mt-0.5">Técnicos verificados a domicilio en Colombia</p>
          </div>
          {/* Links de contacto */}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a
              href="https://wa.me/573001234567?text=Hola+ServiYa+%F0%9F%91%8B"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <span className="text-base">💬</span> WhatsApp soporte
            </a>
            <a
              href="mailto:soporte@serviyacol.com"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <span className="text-base">✉️</span> soporte@serviyacol.com
            </a>
            <a
              href="https://www.serviyacol.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <span className="text-base">🌐</span> serviyacol.com
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-gray-300">
            © {year} ServiYa · Todos los derechos reservados · NIT 901.XXX.XXX-X
          </p>
          <div className="flex items-center gap-3">
            <a href="/terminos" className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors">Términos</a>
            <span className="text-gray-200">·</span>
            <a href="/privacidad" className="text-[10px] text-gray-300 hover:text-gray-500 transition-colors">Privacidad</a>
            <span className="text-gray-200">·</span>
            <span className="text-[10px] text-gray-300">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
