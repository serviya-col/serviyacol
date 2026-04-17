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

// ── GA4 helper ────────────────────────────────────────────────────────────────
function trackGA4(event, params = {}) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, params)
  }
}

function SolicitarForm() {
  const searchParams  = useSearchParams()
  const categoriaParam = searchParams.get('categoria') || ''
  const ciudadParam    = searchParams.get('ciudad')    || ''

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    cliente_nombre: '', cliente_telefono: '', cliente_email: '',
    ciudad: ciudadParam, categoria: categoriaParam, descripcion: '', direccion: '',
  })
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [legalModal, setLegalModal] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email || ''
      if (!email) return
      setAuthEmail(email)
      setForm((f) => ({ ...f, cliente_email: email }))
    })
    // GA4: inicio del flujo
    trackGA4('view_item_list', { item_list_name: 'Servicios disponibles' })
  }, [])

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const handleChange = (e) => set(e.target.name, e.target.value)

  const handleSelectCategoria = (catId) => {
    set('categoria', catId)
    // GA4: seleccionar servicio
    trackGA4('select_content', {
      content_type: 'service',
      item_id:      catId,
    })
  }

  const goNext = () => {
    if (!form.categoria || !form.ciudad) {
      setError('Por favor selecciona el servicio y tu ciudad.')
      return
    }
    setError('')
    // GA4: inicio de checkout
    trackGA4('begin_checkout', {
      currency: 'COP',
      value:    50000,
      items: [{ item_name: form.categoria, item_category: form.ciudad }],
    })
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
      // GA4: lead generado ✅
      trackGA4('generate_lead', {
        currency: 'COP',
        value:    50000,
        items: [{ item_name: form.categoria, item_category: form.ciudad }],
      })
      // Meta Pixel
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', { content_name: form.categoria, ciudad: form.ciudad })
      }
      setSuccess(true)
      // Notificar al Admin
      fetch('/api/notify/nueva-solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitud: {
            tipo_servicio: form.categoria,
            categoria:     form.categoria,
            ciudad:        form.ciudad,
            urgencia:      'Normal',
            descripcion:   form.descripcion,
          },
          clienteNombre: form.cliente_nombre,
        }),
      }).catch(() => {})
    }
  }

  /* ── Pantalla de éxito premium ─────────────────────────────────────────── */
  if (success) {
    const catIcon = CATEGORIAS.find(c => c.id === form.categoria)?.icon || '🛠️'
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Animación de check */}
          <div className="flex justify-center mb-8">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full bg-emerald-100 animate-ping opacity-30" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">¡Solicitud recibida!</h1>
            <p className="text-gray-500 text-sm">Nuestro equipo ya está buscando el técnico ideal para ti</p>
          </div>

          {/* Resumen de la solicitud */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Resumen de tu solicitud</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl flex-shrink-0">
                  {catIcon}
                </div>
                <div>
                  <p className="text-xs text-gray-400">Servicio solicitado</p>
                  <p className="font-bold text-gray-800">{form.categoria}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">📍</div>
                <div>
                  <p className="text-xs text-gray-400">Ciudad</p>
                  <p className="font-bold text-gray-800">{form.ciudad}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl flex-shrink-0">👤</div>
                <div>
                  <p className="text-xs text-gray-400">Contacto</p>
                  <p className="font-bold text-gray-800">{form.cliente_nombre} · {form.cliente_telefono}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline de próximos pasos */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 mb-5">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4">¿Qué sigue?</p>
            <div className="space-y-3">
              {[
                { time: 'En minutos',    icon: '🔔', txt: 'Te asignamos un técnico verificado en tu zona'  },
                { time: '< 30 min',      icon: '📱', txt: `El técnico te contacta al ${form.cliente_telefono}` },
                { time: 'A tu horario',  icon: '🏠', txt: 'El técnico llega, evalúa y te cotiza sin compromiso' },
              ].map((paso, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-emerald-200 flex items-center justify-center text-base flex-shrink-0 shadow-sm">{paso.icon}</div>
                  <div className="pt-0.5">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">{paso.time}</span>
                    <p className="text-xs text-gray-700 mt-1 leading-relaxed">{paso.txt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`https://wa.me/573138537261?text=Hola, solicité un ${form.categoria} en ${form.ciudad} para ${form.cliente_nombre}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm"
            >
              <span>💬</span> WhatsApp
            </a>
            <Link
              href="/cliente"
              className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm"
            >
              Ver mi panel
            </Link>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            ¿Necesitas algo más? <Link href="/" className="text-brand font-semibold hover:underline">Volver al inicio</Link>
          </p>
        </div>
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
                onClick={() => handleSelectCategoria(c.id)}
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
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                Enviando solicitud...
              </span>
            ) : 'Solicitar técnico ahora →'}
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
