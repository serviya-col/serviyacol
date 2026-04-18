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

const DISPON_CFG = {
  disponible:       { label: 'Disponible',    dot: 'bg-emerald-400', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ocupado:          { label: 'Ocupado',        dot: 'bg-amber-400',   cls: 'text-amber-700 bg-amber-50 border-amber-200'       },
  fuera_de_servicio:{ label: 'No disponible',  dot: 'bg-red-400',     cls: 'text-red-700 bg-red-50 border-red-200'             },
}

function trackGA4(event, params = {}) {
  if (typeof window !== 'undefined' && window.gtag) window.gtag('event', event, params)
}

// ── Tarjeta de técnico ───────────────────────────────────────────────────────
function TecnicoCard({ tec, selected, onSelect }) {
  const dispon = DISPON_CFG[tec.disponibilidad] || DISPON_CFG.disponible
  const isAvailable = tec.disponibilidad === 'disponible'
  const initials = (tec.nombre || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={() => isAvailable && onSelect(tec)}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 relative ${
        !isAvailable
          ? 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50'
          : selected
          ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10 scale-[1.01]'
          : 'border-gray-100 bg-white hover:border-emerald-300 hover:shadow-md hover:scale-[1.005] active:scale-100'
      }`}
    >
      {/* Selected badge */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow">
          ✓
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar / foto */}
        {tec.foto_perfil_url ? (
          <img
            src={tec.foto_perfil_url}
            alt={tec.nombre}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-gray-100"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0 shadow-sm">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-bold text-gray-900 text-sm truncate">{tec.nombre}</p>
          </div>

          {/* Disponibilidad badge */}
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${dispon.cls} mb-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dispon.dot} ${isAvailable ? 'animate-pulse' : ''}`} />
            {dispon.label}
          </span>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            <span>📍 {tec.ciudad}</span>
            {tec.experiencia_anos > 0 && <span>🏆 {tec.experiencia_anos} años</span>}
            {tec.rating && <span>⭐ {tec.rating}</span>}
          </div>
        </div>
      </div>

      {/* Tarifa */}
      {tec.tarifa_visita && isAvailable && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">Tarifa de visita</span>
          <span className="text-sm font-bold text-emerald-700">
            ${Number(tec.tarifa_visita).toLocaleString('es-CO')} COP
          </span>
        </div>
      )}
    </button>
  )
}

// ── Formulario principal ─────────────────────────────────────────────────────
function SolicitarForm() {
  const searchParams   = useSearchParams()
  const categoriaParam = searchParams.get('categoria') || ''
  const ciudadParam    = searchParams.get('ciudad')    || ''

  const [step, setStep]   = useState(1)
  const [form, setForm]   = useState({
    cliente_nombre: '', cliente_telefono: '', cliente_email: '',
    ciudad: ciudadParam, categoria: categoriaParam,
    descripcion: '', direccion: '',
    tecnico_id: null,
  })
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null)
  const [tecnicos, setTecnicos]  = useState([])
  const [loadingTecs, setLoadingTecs] = useState(false)
  const [loading, setLoading]    = useState(false)
  const [success, setSuccess]    = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [error, setError]        = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [legalModal, setLegalModal] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email || ''
      if (!email) return
      setAuthEmail(email)
      setForm(f => ({ ...f, cliente_email: email }))
    })
    trackGA4('view_item_list', { item_list_name: 'Servicios disponibles' })
  }, [])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))
  const handleChange = (e) => set(e.target.name, e.target.value)

  const handleSelectCategoria = (catId) => {
    set('categoria', catId)
    trackGA4('select_content', { content_type: 'service', item_id: catId })
  }

  // ── Step 1 → 2: cargar técnicos ──────────────────────────────────────────
  const goToTecnicos = async () => {
    if (!form.categoria || !form.ciudad) {
      setError('Por favor selecciona el servicio y tu ciudad.')
      return
    }
    setError('')
    trackGA4('begin_checkout', {
      currency: 'COP', value: 50000,
      items: [{ item_name: form.categoria, item_category: form.ciudad }],
    })

    setLoadingTecs(true)
    setStep(2)

    const { data } = await supabase
      .from('tecnicos')
      .select('id, nombre, ciudad, categoria, disponibilidad, experiencia_anos, tarifa_visita, rating, foto_url, verificado')
      .eq('ciudad', form.ciudad)
      .eq('categoria', form.categoria)
      .eq('verificado', true)
      .eq('activo', true)
      .in('disponibilidad', ['disponible', 'ocupado']) // muestra ocupados (grayed) para transparencia
      .order('disponibilidad') // disponible primero
      .order('rating', { ascending: false })

    setTecnicos(data || [])
    setLoadingTecs(false)
  }

  // ── Step 2 → 3: elegir técnico o continuar sin ──────────────────────────
  const elegirTecnico = (tec) => {
    setTecnicoSeleccionado(tec)
    set('tecnico_id', tec.id)
    setStep(3)
  }

  const continuarSinTecnico = () => {
    setTecnicoSeleccionado(null)
    set('tecnico_id', null)
    setStep(3)
  }

  // ── Step 3: envío ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.cliente_nombre || !form.cliente_telefono || !form.descripcion) {
      setError('Por favor completa todos los campos obligatorios.')
      return
    }
    setLoading(true)

    const res = await fetch('/api/solicitar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_nombre:   form.cliente_nombre,
        cliente_telefono: form.cliente_telefono,
        cliente_email:    form.cliente_email || null,
        ciudad:           form.ciudad,
        categoria:        form.categoria,
        descripcion:      form.descripcion,
        direccion:        form.direccion || null,
        tecnico_id:       form.tecnico_id || null,
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (result.code === 'TECNICO_OCUPADO') {
        setError('El técnico que elegiste ya fue tomado por otro cliente. Por favor elige otro o continúa sin técnico.')
        setStep(2)
        // Recargar técnicos
        setLoadingTecs(true)
        const { data } = await supabase
          .from('tecnicos')
          .select('id, nombre, ciudad, categoria, disponibilidad, experiencia_anos, tarifa_visita, rating, foto_url, verificado')
          .eq('ciudad', form.ciudad).eq('categoria', form.categoria)
          .eq('verificado', true).eq('activo', true)
          .in('disponibilidad', ['disponible', 'ocupado'])
          .order('disponibilidad').order('rating', { ascending: false })
        setTecnicos(data || [])
        setLoadingTecs(false)
      } else {
        setError(result.error || 'Error al enviar la solicitud.')
      }
      return
    }

    // GA4 + Meta Pixel
    trackGA4('generate_lead', {
      currency: 'COP', value: 50000,
      items: [{ item_name: form.categoria, item_category: form.ciudad }],
    })
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', { content_name: form.categoria, ciudad: form.ciudad })
    }

    setSuccessData({ asignada: result.asignada, tecnico: tecnicoSeleccionado })
    setSuccess(true)
  }

  // ── Pantalla de éxito ────────────────────────────────────────────────────
  if (success) {
    const catIcon = CATEGORIAS.find(c => c.id === form.categoria)?.icon || '🛠️'
    const { asignada, tecnico } = successData || {}
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
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

          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
              {asignada ? '¡Técnico asignado!' : '¡Solicitud recibida!'}
            </h1>
            <p className="text-gray-500 text-sm">
              {asignada
                ? `${tecnico?.nombre} ya fue notificado y te contactará pronto.`
                : 'Nuestro equipo ya está buscando el técnico ideal para ti.'}
            </p>
          </div>

          {/* Tech card if assigned */}
          {asignada && tecnico && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0">
                {(tecnico.nombre || '?').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Tu técnico</p>
                <p className="font-bold text-gray-900">{tecnico.nombre}</p>
                {tecnico.tarifa_visita && (
                  <p className="text-xs text-gray-500">Tarifa visita: ${Number(tecnico.tarifa_visita).toLocaleString('es-CO')} COP</p>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Resumen de tu solicitud</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl flex-shrink-0">{catIcon}</div>
                <div>
                  <p className="text-xs text-gray-400">Servicio</p>
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

          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 mb-5">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-4">¿Qué sigue?</p>
            <div className="space-y-3">
              {(asignada ? [
                { time: 'Ahora',       icon: '✅', txt: `${tecnico?.nombre || 'El técnico'} fue notificado de tu solicitud` },
                { time: '< 30 min',   icon: '📱', txt: `Te contactará al ${form.cliente_telefono}` },
                { time: 'Sin sorpresas', icon: '💰', txt: 'Evalúa y cotiza antes de iniciar. Solo pagas si aceptas.' },
              ] : [
                { time: 'En minutos',    icon: '🔔', txt: 'Te asignamos un técnico verificado en tu zona'  },
                { time: '< 30 min',      icon: '📱', txt: `El técnico te contacta al ${form.cliente_telefono}` },
                { time: 'A tu horario',  icon: '🏠', txt: 'El técnico llega, evalúa y te cotiza sin compromiso' },
              ]).map((paso, i) => (
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

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`https://wa.me/526611310397?text=Hola, solicité un ${form.categoria} en ${form.ciudad} para ${form.cliente_nombre}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm"
            >
              💬 WhatsApp
            </a>
            <Link href="/cliente"
              className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-sm">
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

  // ── Progress bar ─────────────────────────────────────────────────────────
  const totalSteps = 3
  const stepLabels = ['Servicio', 'Técnico', 'Datos']

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <span className="text-xs font-bold text-brand uppercase tracking-wider">Solicitar servicio</span>
        <h1 className="text-2xl font-extrabold text-gray-900 mt-1">¿Qué necesitas hoy?</h1>
        <p className="text-gray-500 mt-1 text-sm">Cuéntanos y te conectamos con un técnico verificado en tu ciudad.</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center mb-8">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0 transition-all duration-300 ${
                step > s ? 'bg-brand text-white' : step === s ? 'bg-brand text-white ring-4 ring-brand/20' : 'bg-gray-100 text-gray-400'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-[10px] font-semibold hidden sm:block ${step >= s ? 'text-brand' : 'text-gray-300'}`}>
                {stepLabels[i]}
              </span>
            </div>
            {i < 2 && (
              <div className={`h-1 flex-1 mx-2 rounded-full transition-all duration-500 ${step > s ? 'bg-brand' : 'bg-gray-100'}`} />
            )}
          </div>
        ))}
        <div className="ml-3 text-xs font-medium text-gray-400 whitespace-nowrap">Paso {step} de {totalSteps}</div>
      </div>

      {/* ── Step 1: Servicio + Ciudad ── */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-base font-bold text-gray-800 mb-4">¿Qué tipo de servicio necesitas?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id} type="button"
                id={`cat-${c.id.toLowerCase().replace(/\s/g, '-')}`}
                onClick={() => handleSelectCategoria(c.id)}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                  form.categoria === c.id
                    ? 'border-brand bg-brand-pale shadow-md shadow-brand/10'
                    : 'border-gray-100 bg-white hover:border-brand/30 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1.5">{c.icon}</div>
                <p className={`text-xs font-bold leading-tight ${form.categoria === c.id ? 'text-brand' : 'text-gray-800'}`}>{c.id}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{c.desc}</p>
              </button>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">¿En qué ciudad estás? *</label>
            <select id="solicitar-ciudad" name="ciudad" value={form.ciudad} onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand">
              <option value="">Selecciona tu ciudad</option>
              {CIUDADES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          <button type="button" id="solicitar-next" onClick={goToTecnicos}
            className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            Ver técnicos disponibles
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Step 2: Descubrimiento de técnicos ── */}
      {step === 2 && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <button type="button" onClick={() => { setStep(1); setError('') }}
              className="text-sm text-gray-400 hover:text-brand flex items-center gap-1 transition-colors">
              ← Atrás
            </button>
            <div className="flex items-center gap-2 bg-brand-pale text-brand text-xs font-bold px-3 py-1.5 rounded-full">
              {CATEGORIAS.find(c => c.id === form.categoria)?.icon} {form.categoria} · {form.ciudad}
            </div>
          </div>

          <h2 className="text-base font-bold text-gray-900 mb-1">Técnicos disponibles para ti</h2>
          <p className="text-sm text-gray-500 mb-5">
            Elige un técnico o continúa sin seleccionar para que nuestro equipo lo asigne.
          </p>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          {loadingTecs ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-3 border-brand border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Buscando técnicos en {form.ciudad}...</p>
            </div>
          ) : tecnicos.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">🔍</div>
              <p className="font-bold text-gray-700 mb-1">No hay técnicos en esta zona aún</p>
              <p className="text-sm text-gray-400 mb-5">
                Estamos ampliando nuestra red. Tu solicitud será asignada manualmente por nuestro equipo.
              </p>
              <button type="button" onClick={continuarSinTecnico}
                className="bg-brand hover:bg-brand-dark text-white font-bold px-8 py-3 rounded-xl transition-all">
                Enviar solicitud de todas formas →
              </button>
            </div>
          ) : (
            <>
              {/* Disponibles */}
              {tecnicos.filter(t => t.disponibilidad === 'disponible').length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Disponibles ahora ({tecnicos.filter(t => t.disponibilidad === 'disponible').length})
                  </p>
                  <div className="space-y-3">
                    {tecnicos.filter(t => t.disponibilidad === 'disponible').map(tec => (
                      <TecnicoCard
                        key={tec.id} tec={tec}
                        selected={tecnicoSeleccionado?.id === tec.id}
                        onSelect={elegirTecnico}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Ocupados */}
              {tecnicos.filter(t => t.disponibilidad === 'ocupado').length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    En servicio ahora
                  </p>
                  <div className="space-y-3">
                    {tecnicos.filter(t => t.disponibilidad === 'ocupado').map(tec => (
                      <TecnicoCard key={tec.id} tec={tec} selected={false} onSelect={() => {}} />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={continuarSinTecnico}
                  className="flex-1 border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-bold py-3 rounded-xl transition-all text-sm">
                  Continuar sin elegir técnico
                </button>
                {tecnicoSeleccionado && (
                  <button type="button" onClick={() => setStep(3)}
                    className="flex-1 bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                    Continuar con {tecnicoSeleccionado.nombre.split(' ')[0]} →
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Step 3: Datos de contacto ── */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="animate-fade-in space-y-5">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => setStep(2)}
              className="text-sm text-gray-400 hover:text-brand flex items-center gap-1 transition-colors">
              ← Atrás
            </button>
            <div className="flex items-center gap-2 bg-brand-pale text-brand text-xs font-bold px-3 py-1.5 rounded-full">
              {CATEGORIAS.find((c) => c.id === form.categoria)?.icon} {form.categoria} · {form.ciudad}
            </div>
          </div>

          {/* Técnico elegido (si existe) */}
          {tecnicoSeleccionado && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-extrabold text-base flex-shrink-0">
                {(tecnicoSeleccionado.nombre || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-xs text-emerald-600 font-semibold">Técnico seleccionado</p>
                <p className="font-bold text-gray-900 text-sm">{tecnicoSeleccionado.nombre}</p>
              </div>
              <button type="button" onClick={() => { setTecnicoSeleccionado(null); set('tecnico_id', null) }}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors">✕ Cambiar</button>
            </div>
          )}

          <h2 className="text-base font-bold text-gray-800">Tus datos de contacto</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre *</label>
              <input id="solicitar-nombre" name="cliente_nombre" value={form.cliente_nombre} onChange={handleChange}
                required placeholder="Ej: María González"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp *</label>
              <input id="solicitar-telefono" name="cliente_telefono" value={form.cliente_telefono} onChange={handleChange}
                required placeholder="Ej: 3001234567"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico <span className="text-gray-400">(opcional)</span>
            </label>
            <input id="solicitar-email" name="cliente_email" value={form.cliente_email} onChange={handleChange}
              type="email" placeholder="correo@ejemplo.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow" />
            {authEmail && <p className="text-xs text-emerald-600 mt-1">Detectamos tu cuenta activa. Este correo vinculará la solicitud a tu panel de cliente.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Describe el problema *</label>
            <textarea id="solicitar-descripcion" name="descripcion" value={form.descripcion} onChange={handleChange}
              required rows={4}
              placeholder="Ej: Se me tapó el desagüe del baño y el agua no baja. Necesito alguien hoy si es posible..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none transition-shadow" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección aproximada <span className="text-gray-400">(opcional)</span>
            </label>
            <input id="solicitar-direccion" name="direccion" value={form.direccion} onChange={handleChange}
              placeholder="Barrio o dirección"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow" />
          </div>

          <div className="bg-brand-pale rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💡</span>
            <div>
              <p className="text-sm font-bold text-gray-800">Costo de la visita: $50.000 COP</p>
              <p className="text-xs text-gray-600 mt-0.5">
                El técnico llega, evalúa y te cotiza. Solo pagas el trabajo si aceptas la cotización. Garantía de 30 días incluida.
              </p>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}

          <button type="submit" id="solicitar-submit" disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                {form.tecnico_id ? 'Agendando técnico...' : 'Enviando solicitud...'}
              </span>
            ) : form.tecnico_id
              ? `Agendar con ${tecnicoSeleccionado?.nombre?.split(' ')[0]} →`
              : 'Solicitar técnico ahora →'}
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
      <Suspense fallback={<div className="p-10 text-center text-gray-400">Cargando...</div>}>
        <SolicitarForm />
      </Suspense>
    </>
  )
}
