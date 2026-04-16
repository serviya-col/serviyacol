'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import LegalModal from '@/components/LegalModal'

const CIUDADES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué', 'Neiva',
  'Villavicencio', 'Pasto',
]

const CATEGORIAS = [
  { id: 'Plomería',           icon: '🔧', desc: 'Tuberías, grifos, desagües'     },
  { id: 'Electricidad',       icon: '⚡', desc: 'Instalaciones, circuitos, luces' },
  { id: 'Cerrajería',         icon: '🔑', desc: 'Cerraduras, puertas, cajas'      },
  { id: 'Pintura',            icon: '🎨', desc: 'Interiores, exteriores, estuco'  },
  { id: 'Aire acondicionado', icon: '❄️', desc: 'Instalación y mantenimiento'     },
  { id: 'Jardinería',         icon: '🪴', desc: 'Poda, diseño, mantenimiento'     },
  { id: 'Limpieza',           icon: '🧹', desc: 'Hogares, oficinas, post-obra'    },
  { id: 'Otro',               icon: '🛠️', desc: 'Otro tipo de servicio'           },
]

function SolicitarForm() {
  const searchParams = useSearchParams()
  const categoriaParam = searchParams.get('categoria') || ''
  const ciudadParam    = searchParams.get('ciudad')    || ''

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    cliente_nombre: '', cliente_telefono: '', cliente_email: '',
    ciudad: ciudadParam, categoria: categoriaParam, descripcion: '', direccion: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [legalModal, setLegalModal] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email || ''
      if (!email) return
      setAuthEmail(email)
      setForm((f) => ({ ...f, cliente_email: email }))
    })
  }, [])

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const handleChange = (e) => set(e.target.name, e.target.value)

  const goNext = () => {
    if (!form.categoria || !form.ciudad) {
      setError('Por favor selecciona el servicio y tu ciudad.')
      return
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.cliente_nombre || !form.cliente_telefono || !form.descripcion) {
      setError('Por favor completa todos los campos obligatorios.')
      return
    }
    setLoading(true)
    const { error: dbError } = await supabase.from('solicitudes').insert([{
      cliente_nombre:   form.cliente_nombre,
      cliente_telefono: form.cliente_telefono,
      cliente_email:    form.cliente_email || null,
      ciudad:           form.ciudad,
      categoria:        form.categoria,
      descripcion:      form.descripcion,
      direccion:        form.direccion || null,
      estado:           'pendiente',
    }])
    setLoading(false)
    if (dbError) {
      setError('Error al enviar la solicitud. Intenta de nuevo.')
    } else {
      setSuccess(true)
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: form.categoria,
          ciudad: form.ciudad
        })
      }
    }
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-5 animate-bounce-soft">✅</div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Solicitud enviada!</h1>
        <p className="text-gray-500 mb-2">
          Recibimos tu solicitud de <strong>{form.categoria}</strong> en{' '}
          <strong>{form.ciudad}</strong>.
        </p>
        <p className="text-gray-500 mb-6">
          Te contactaremos al <strong>{form.cliente_telefono}</strong> en los próximos{' '}
          <strong>30 minutos</strong> con un técnico disponible.
        </p>
        <div className="bg-brand-pale rounded-2xl p-5 flex items-start gap-3 text-left mb-6">
          <span className="text-2xl flex-shrink-0">💬</span>
          <p className="text-sm text-brand font-medium">
            Si es urgente también puedes escribirnos directamente por{' '}
            <strong>WhatsApp</strong> usando el botón verde.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95"
        >
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold text-brand uppercase tracking-wider">Solicitar servicio</span>
        <h1 className="text-2xl font-extrabold text-gray-900 mt-1">¿Qué necesitas hoy?</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Cuéntanos y te conectamos con un técnico verificado en tu ciudad.
        </p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center mb-8">
        {[1, 2].map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 transition-all duration-300 ${
                step > s
                  ? 'bg-brand text-white'
                  : step === s
                  ? 'bg-brand text-white ring-4 ring-brand/20'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {step > s ? '✓' : s}
            </div>
            {i === 0 && (
              <div
                className={`h-1 flex-1 mx-2 rounded-full transition-all duration-500 ${
                  step > 1 ? 'bg-brand' : 'bg-gray-100'
                }`}
              />
            )}
          </div>
        ))}
        <div className="ml-2 text-xs font-medium text-gray-400">
          Paso {step} de 2
        </div>
      </div>

      {/* ── Step 1: Servicio + ciudad ── */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-base font-bold text-gray-800 mb-4">¿Qué tipo de servicio necesitas?</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                type="button"
                id={`cat-${c.id.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => set('categoria', c.id)}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                  form.categoria === c.id
                    ? 'border-brand bg-brand-pale shadow-md shadow-brand/10'
                    : 'border-gray-100 bg-white hover:border-brand/30 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1.5">{c.icon}</div>
                <p
                  className={`text-xs font-bold leading-tight ${
                    form.categoria === c.id ? 'text-brand' : 'text-gray-800'
                  }`}
                >
                  {c.id}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{c.desc}</p>
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ¿En qué ciudad estás? *
            </label>
            <select
              id="solicitar-ciudad"
              name="ciudad"
              value={form.ciudad}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">Selecciona tu ciudad</option>
              {CIUDADES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <button
            type="button"
            id="solicitar-next"
            onClick={goNext}
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Continuar
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Step 2: Datos de contacto ── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="animate-fade-in space-y-5">
          {/* Summary + back */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-gray-400 hover:text-brand flex items-center gap-1 transition-colors"
            >
              ← Atrás
            </button>
            <div className="flex items-center gap-2 bg-brand-pale text-brand text-xs font-bold px-3 py-1.5 rounded-full">
              {CATEGORIAS.find((c) => c.id === form.categoria)?.icon} {form.categoria} · {form.ciudad}
            </div>
          </div>

          <h2 className="text-base font-bold text-gray-800">Tus datos de contacto</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre *</label>
              <input
                id="solicitar-nombre"
                name="cliente_nombre"
                value={form.cliente_nombre}
                onChange={handleChange}
                required
                placeholder="Ej: María González"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                id="solicitar-telefono"
                name="cliente_telefono"
                value={form.cliente_telefono}
                onChange={handleChange}
                required
                placeholder="Ej: 3001234567"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              id="solicitar-email"
              name="cliente_email"
              value={form.cliente_email}
              onChange={handleChange}
              type="email"
              placeholder="correo@ejemplo.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
            />
            {authEmail && (
              <p className="text-xs text-emerald-600 mt-1">
                Detectamos tu cuenta activa. Este correo vinculará la solicitud a tu panel de cliente.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Describe el problema *
            </label>
            <textarea
              id="solicitar-descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Ej: Se me tapó el desagüe del baño y el agua no baja. Necesito alguien hoy si es posible..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección aproximada <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              id="solicitar-direccion"
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              placeholder="Barrio o dirección"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
            />
          </div>

          {/* Price info */}
          <div className="bg-brand-pale rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💡</span>
            <div>
              <p className="text-sm font-bold text-gray-800">Costo de la visita: $50.000 COP</p>
              <p className="text-xs text-gray-600 mt-0.5">
                El técnico llega, evalúa y te cotiza. Solo pagas el trabajo si aceptas la
                cotización. Garantía de 30 días incluida.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            id="solicitar-submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
          >
            {loading ? 'Enviando solicitud...' : 'Solicitar técnico ahora →'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Al enviar aceptas nuestros{' '}
            <button type="button" onClick={() => setLegalModal('terminos')} className="text-brand hover:underline">Términos y Condiciones</button> y nuestra{' '}
            <button type="button" onClick={() => setLegalModal('privacidad')} className="text-brand hover:underline">Política de Privacidad</button>.
            Tu información es privada y segura. 🔒
          </p>
        </form>
      )}

      <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
    </div>
  )
}

export default function SolicitarPage() {
  return (
    <>
      <Navbar />
      <Suspense
        fallback={
          <div className="p-10 text-center text-gray-400">Cargando...</div>
        }
      >
        <SolicitarForm />
      </Suspense>
    </>
  )
}
