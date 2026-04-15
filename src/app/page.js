import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import TestimonialCard from '@/components/TestimonialCard'
import HeroSearch from '@/components/HeroSearch'

const CATEGORIAS = [
  { nombre: 'Plomería',           icon: '🔧', color: 'from-emerald-50 to-teal-50',   hover: 'hover:border-emerald-300', count: '1.200+', precio: 'Desde $50.000' },
  { nombre: 'Electricidad',       icon: '⚡', color: 'from-amber-50  to-yellow-50',  hover: 'hover:border-amber-300',   count: '980+',   precio: 'Desde $50.000' },
  { nombre: 'Cerrajería',         icon: '🔑', color: 'from-purple-50 to-violet-50',  hover: 'hover:border-purple-300',  count: '640+',   precio: 'Desde $50.000' },
  { nombre: 'Pintura',            icon: '🎨', color: 'from-rose-50   to-pink-50',    hover: 'hover:border-rose-300',    count: '520+',   precio: 'Desde $60.000' },
  { nombre: 'Aire acondicionado', icon: '❄️', color: 'from-blue-50   to-cyan-50',    hover: 'hover:border-blue-300',    count: '310+',   precio: 'Desde $70.000' },
  { nombre: 'Jardinería',         icon: '🪴', color: 'from-green-50  to-lime-50',    hover: 'hover:border-green-300',   count: '280+',   precio: 'Desde $80.000' },
  { nombre: 'Limpieza',           icon: '🧹', color: 'from-orange-50 to-amber-50',   hover: 'hover:border-orange-300',  count: '900+',   precio: 'Desde $60.000' },
  { nombre: 'Más servicios',      icon: '➕', color: 'from-gray-50   to-slate-50',   hover: 'hover:border-gray-300',    count: 'Próximo', precio: '' },
]

const PASOS = [
  { icon: '🔍', title: 'Elige el servicio',     desc: 'Selecciona qué necesitas y en qué ciudad estás.',                              tiempo: '< 2 min'  },
  { icon: '👤', title: 'Ve técnicos disponibles', desc: 'Compara perfiles, reseñas y tarifas de técnicos verificados cerca de ti.',    tiempo: '< 5 min'  },
  { icon: '📅', title: 'Agenda y confirma',      desc: 'Elige la hora que te quede mejor. Paga solo la visita de diagnóstico.',       tiempo: 'Inmediato' },
  { icon: '✅', title: 'El técnico llega',        desc: 'Recibe al profesional, acepta la cotización y disfruta el servicio con garantía.', tiempo: '< 1 hora' },
]

const TESTIMONIOS = [
  {
    nombre: 'Laura Martínez',
    ciudad: 'Bogotá',
    servicio: 'Plomería',
    texto: 'El plomero llegó en 40 minutos. Muy profesional, diagnosticó el problema de inmediato y el precio fue justo. Definitivamente volvería a usar ServiYa.',
    rating: 5,
  },
  {
    nombre: 'Jorge Ramírez',
    ciudad: 'Medellín',
    servicio: 'Electricidad',
    texto: 'Necesitaba un electricista urgente y en menos de una hora ya tenía el problema resuelto. Explicó todo antes de empezar. Excelente experiencia.',
    rating: 5,
  },
  {
    nombre: 'Camila Vargas',
    ciudad: 'Cali',
    servicio: 'Limpieza',
    texto: 'Llegaron puntuales, el trabajo quedó perfecto y me dieron garantía de 7 días. Muy recomendado para quien necesite un servicio confiable y rápido.',
    rating: 5,
  },
]

const FAQS = [
  {
    q: '¿Cuánto cuesta solicitar un técnico?',
    a: 'La visita de diagnóstico tiene un costo fijo de $50.000 COP. El técnico evalúa el problema y te entrega una cotización detallada. Si aceptas, el trabajo comienza. Si no, solo pagas la visita.',
  },
  {
    q: '¿Cómo verifican a los técnicos?',
    a: 'Todos nuestros técnicos pasan por verificación de identidad, antecedentes judiciales y validación de experiencia. Solo los aprobados pueden recibir solicitudes en la plataforma.',
  },
  {
    q: '¿Hay garantía del servicio?',
    a: 'Sí. Todos los servicios realizados a través de ServiYa tienen garantía de 30 días. Si algo falla o no quedas satisfecho, el técnico vuelve sin costo adicional.',
  },
  {
    q: '¿En qué ciudades están disponibles?',
    a: 'Actualmente cubrimos Bogotá, Medellín, Cali, Barranquilla, Cartagena, Bucaramanga, Pereira, Manizales, Ibagué, Neiva, Villavicencio y Pasto. Próximamente más ciudades.',
  },
  {
    q: '¿Puedo pagar en línea?',
    a: 'Sí. Contamos con pago seguro a través de Wompi (tarjeta débito, crédito, PSE y Nequi). También puedes pagar directamente al técnico en efectivo.',
  },
]

export default function Home() {
  return (
    <>
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative text-white overflow-hidden min-h-[540px] md:min-h-[620px] flex flex-col">
        {/* Imagen de fondo optimizada por Next.js */}
        <Image
          src="/hero-bg.png"
          alt="Técnico profesional ServiYa"
          fill
          priority
          quality={80}
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Overlay oscuro con degradado para legibilidad del texto */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#071A14]/85 via-[#0B2B21]/80 to-[#0E3A2D]/90" />
        {/* Overlay extra en mobile para más contraste */}
        <div className="absolute inset-0 bg-black/20 md:bg-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24 text-center flex-1 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-emerald-200 text-xs font-semibold px-4 py-2 rounded-full mb-6 animate-fade-in mx-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            Atención en Bogotá, Medellín, Cali y 9 ciudades más
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.08] mb-5 animate-slide-up">
            ¿Se dañó algo en casa?
            <br />
            <span className="text-gradient">Te conectamos con un técnico serio</span>
          </h1>

          <p className="text-white/80 text-base md:text-lg mb-8 max-w-2xl mx-auto animate-slide-up delay-200">
            Sin llamadas eternas ni improvisados. Cuéntanos qué necesitas y te ayudamos a conseguir
            soporte técnico confiable en tu ciudad.
          </p>

          <HeroSearch />

          <div className="flex flex-wrap items-center justify-center gap-5 mt-8 text-sm text-white/70 animate-fade-in delay-500">
            <span className="flex items-center gap-1.5">
              ⭐ <span className="text-white/90 font-semibold">4.8/5</span> en reseñas reales
            </span>
            <span className="text-white/20 hidden sm:block">|</span>
            <span className="flex items-center gap-1.5">🛡️ Perfiles verificados</span>
            <span className="text-white/20 hidden sm:block">|</span>
            <span className="flex items-center gap-1.5">📍 Cobertura en 12 ciudades</span>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-3 divide-x divide-gray-100">
          {[
            { n: '+8.400',  label: 'Técnicos activos'     },
            { n: '+32.000', label: 'Servicios realizados' },
            { n: '4.8 ★',  label: 'Calificación promedio' },
          ].map((s) => (
            <div key={s.label} className="py-6 text-center">
              <div className="text-2xl font-extrabold text-brand">{s.n}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TRUST BADGES ── */}
      <div className="bg-brand-pale/40 border-b border-brand-pale py-5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 px-4">
          {[
            { icon: '✅', title: 'Técnicos verificados',   sub: 'Identidad, antecedentes y experiencia validados' },
            { icon: '🛡️', title: 'Garantía 30 días',       sub: 'Si algo falla, volvemos sin costo adicional'     },
            { icon: '⚡', title: 'Respuesta en < 1 hora',  sub: 'Para urgencias del hogar y empresas'             },
          ].map((t) => (
            <div key={t.title} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-brand-pale flex items-center justify-center text-xl flex-shrink-0">
                {t.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                <p className="text-xs text-gray-500">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como-funciona" className="max-w-5xl mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-brand uppercase tracking-wider">Simple y rápido</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-2">¿Cómo funciona ServiYa?</h2>
          <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm">
            En minutos tienes un técnico en camino. Sin complicaciones.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {PASOS.map((p, i) => (
            <div key={p.title} className="text-center">
              {/* Step number badge */}
              <div className="relative inline-block mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-light to-brand text-white flex items-center justify-center mx-auto text-2xl shadow-lg shadow-brand/25">
                  {p.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-brand text-brand text-xs font-extrabold flex items-center justify-center shadow-sm">
                  {i + 1}
                </span>
              </div>
              <div className="inline-block bg-brand-pale text-brand text-xs font-bold px-3 py-1 rounded-full mb-2">
                {p.tiempo}
              </div>
              <h3 className="font-bold text-gray-800 text-sm mb-1">{p.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link
            href="/solicitar"
            id="how-it-works-cta"
            className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-brand/25 active:scale-95"
          >
            Solicitar mi técnico ahora
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── SERVICIOS ── */}
      <section id="servicios" className="bg-gray-50 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-bold text-brand uppercase tracking-wider">+8 categorías</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">Nuestros servicios</h2>
            </div>
            <Link href="/solicitar" className="text-sm text-brand font-semibold hover:underline hidden md:block">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIAS.map((c) => (
              <Link
                key={c.nombre}
                href={
                  c.nombre === 'Más servicios'
                    ? '/solicitar'
                    : `/solicitar?categoria=${encodeURIComponent(c.nombre)}`
                }
                className={`bg-gradient-to-br ${c.color} border border-gray-100 ${c.hover} rounded-2xl p-5 text-center card-lift group transition-all`}
              >
                <div className="text-3xl mb-3">{c.icon}</div>
                <p className="text-sm font-bold text-gray-800 group-hover:text-brand mb-0.5">{c.nombre}</p>
                <p className="text-xs text-gray-400">{c.count} técnicos</p>
                {c.precio && (
                  <p className="text-xs text-brand font-bold mt-1">{c.precio}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="bg-gradient-to-br from-[#071A14] to-[#0A3D2E] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Opiniones reales
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
              +2.300 familias ya confían en ServiYa
            </h2>
            <p className="text-white/50 mt-2 text-sm">
              Calificación promedio 4.8 ★ en más de 32.000 servicios realizados
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIOS.map((t) => (
              <TestimonialCard key={t.nombre} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA TÉCNICOS ── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-[#071A14] to-[#0A6E55] rounded-3xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: text */}
            <div className="p-8 md:p-12 text-white">
              <span className="inline-block bg-white/10 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full mb-5">
                Para técnicos y profesionales
              </span>
              <h2 className="text-3xl font-extrabold mb-3 leading-snug">
                ¿Tienes un oficio?<br />Genera más ingresos
              </h2>
              <p className="text-white/60 mb-6 text-sm leading-relaxed">
                Únete a más de 8.400 técnicos que ya reciben clientes a través de ServiYa.
                Gratis para registrarse. Sin cuota mensual.
              </p>
              <ul className="space-y-2.5 mb-8">
                {[
                  'Clientes verificados cerca de ti',
                  'Tú decides tu tarifa y horarios',
                  'Pagos seguros garantizados',
                  'Sin comisión hasta tu primer servicio',
                ].map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-sm text-white/80">
                    <span className="w-5 h-5 rounded-full bg-brand-light/30 flex items-center justify-center text-emerald-300 flex-shrink-0 text-xs font-bold">
                      ✓
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href="/registro-tecnico"
                id="tecnico-cta"
                className="inline-flex items-center gap-2 bg-white text-brand font-bold px-6 py-3.5 rounded-xl hover:bg-brand-pale transition-all hover:shadow-xl active:scale-95"
              >
                Registrarme gratis
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Right: stats */}
            <div className="p-8 md:p-12 bg-white/5 flex flex-col justify-center gap-7">
              {[
                { label: 'Ingreso promedio mensual',  value: '$2.500.000 COP', sub: 'de técnicos activos en ServiYa'          },
                { label: 'Servicios promedio al mes',  value: '18 servicios',   sub: 'por técnico verificado activo'           },
                { label: 'Clientes recurrentes',       value: '72%',            sub: 'vuelven a solicitar el mismo técnico'    },
              ].map((s) => (
                <div key={s.label} className="border-l-2 border-brand-light pl-5">
                  <p className="text-2xl font-extrabold text-white">{s.value}</p>
                  <p className="text-xs text-emerald-300 font-bold mt-0.5">{s.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-gray-50 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-brand uppercase tracking-wider">Preguntas frecuentes</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-2">
              Todo lo que necesitas saber
            </h2>
            <p className="text-gray-500 mt-2 text-sm">Antes de solicitar tu primer técnico</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-semibold text-gray-800 hover:text-brand transition-colors select-none">
                  {faq.q}
                  <span className="faq-icon flex-shrink-0 ml-3 w-7 h-7 rounded-full bg-gray-100 group-open:bg-brand-pale group-open:text-brand flex items-center justify-center text-gray-400 text-xl transition-all">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-1 text-sm text-gray-500 leading-relaxed border-t border-gray-50">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#071A14] text-white/60">
        <div className="max-w-5xl mx-auto px-4 pt-14 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <span className="text-2xl font-extrabold text-white">
                <span className="text-brand-light">Servi</span>Ya
              </span>
              <p className="text-xs leading-relaxed mt-3 max-w-[180px] text-white/50">
                Conectamos hogares con técnicos verificados en toda Colombia.
              </p>
              {/* Social icons */}
              <div className="flex gap-3 mt-4">
                {['Instagram', 'Facebook', 'TikTok'].map((red) => (
                  <a
                    key={red}
                    href="#"
                    aria-label={red}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-white/50 hover:text-white transition-colors"
                  >
                    {red[0]}
                  </a>
                ))}
              </div>
            </div>

            {/* Para clientes */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">Para clientes</p>
              <ul className="space-y-2.5">
                <li><Link href="/solicitar" className="text-xs hover:text-white transition-colors">Solicitar técnico</Link></li>
                <li><Link href="/#servicios" className="text-xs hover:text-white transition-colors">Ver servicios</Link></li>
                <li><Link href="/#como-funciona" className="text-xs hover:text-white transition-colors">Cómo funciona</Link></li>
                <li><Link href="/#faq" className="text-xs hover:text-white transition-colors">Preguntas frecuentes</Link></li>
              </ul>
            </div>

            {/* Para técnicos */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">Para técnicos</p>
              <ul className="space-y-2.5">
                <li><Link href="/registro-tecnico" className="text-xs hover:text-white transition-colors">Registrarme gratis</Link></li>
                <li><a href="#" className="text-xs hover:text-white transition-colors">Beneficios</a></li>
                <li><Link href="/#como-funciona" className="text-xs hover:text-white transition-colors">Cómo funciona</Link></li>
                <li><Link href="/tecnico" className="text-xs hover:text-white transition-colors">Panel de técnico</Link></li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-4">Empresa</p>
              <ul className="space-y-2.5">
                {['Sobre nosotros', 'Términos de uso', 'Privacidad', 'Contacto'].map((l) => (
                  <li key={l}>
                    <a href="#" className="text-xs hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <p>© 2026 ServiYa · Colombia · Todos los derechos reservados</p>
            <p>Hecho con ❤️ en Colombia 🇨🇴</p>
          </div>
        </div>
      </footer>
    </>
  )
}
