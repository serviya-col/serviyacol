'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PanelFooter from '@/components/PanelFooter'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

const ESTADO_CFG = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-amber-50  text-amber-700  border border-amber-200'   },
  asignada:   { label: 'Asignada',   cls: 'bg-blue-50   text-blue-700   border border-blue-200'    },
  en_curso:   { label: 'En curso',   cls: 'bg-purple-50 text-purple-700 border border-purple-200'  },
  completada: { label: 'Completada', cls: 'bg-green-50  text-green-700  border border-green-200'   },
  cancelada:  { label: 'Cancelada',  cls: 'bg-red-50    text-red-700    border border-red-200'     },
}
const SIGUIENTE_ESTADO = { asignada: 'en_curso', en_curso: 'completada' }
const CAT_ICONS = { Plomería:'🔧', Electricidad:'⚡', Cerrajería:'🔑', Pintura:'🎨', 'Aire acondicionado':'❄️', Jardinería:'🪴', Limpieza:'🧹', Otro:'🛠️' }

function Badge({ estado }) {
  const cfg = ESTADO_CFG[estado] || { label: estado, cls: 'bg-gray-50 text-gray-600 border border-gray-200' }
  return <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onSuccess }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) { setLoading(false); setError('Correo o contraseña incorrectos.'); return }

    if (data?.user?.email && ADMIN_EMAIL && data.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      await supabase.auth.signOut()
      setLoading(false)
      setError('Esta cuenta pertenece al administrador. Ingresa por el panel /admin.')
      return
    }

    // Verificar que tiene perfil de técnico
    const { data: tecnico, error: dbErr } = await supabase
      .from('tecnicos')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single()

    if (dbErr || !tecnico) {
      const { data: cliente } = await supabase
        .from('clientes')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .maybeSingle()

      setLoading(false)
      await supabase.auth.signOut()
      if (cliente) {
        setError('Tu cuenta está registrada como cliente. Ingresa por el panel /cliente.')
      } else {
        setError('No encontramos un perfil técnico con este correo. Regístrate como técnico para continuar.')
      }
      return
    }

    setLoading(false)
    onSuccess(data.user, tecnico)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071A14] to-[#0A3D2E] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl font-extrabold text-white"><span className="text-emerald-400">Servi</span>Ya</span>
          <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-semibold">Panel de Técnico</p>
        </div>
        <div className="bg-white/8 backdrop-blur-md border border-white/12 rounded-3xl p-7">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="tu@correo.com"
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 pr-14 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-xs font-medium"
                >{showPass ? 'Ocultar' : 'Ver'}</button>
              </div>
            </div>
            {error && <div className="bg-red-900/30 border border-red-500/25 text-red-300 text-xs px-4 py-3 rounded-xl">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all"
            >{loading ? 'Verificando...' : 'Ingresar a mi panel'}</button>
          </form>
          <p className="text-xs text-white/30 text-center mt-5">
            ¿Aún no tienes cuenta?{' '}
            <Link href="/registro-tecnico" className="text-emerald-400 hover:underline font-semibold">Regístrate aquí</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar / Mobile Nav ──────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, tecnico, disponiblesCount, onLogout }) {
  const nav = [
    { id: 'dashboard',   icon: '🏠', label: 'Mi panel'       },
    { id: 'disponibles', icon: '📋', label: 'Disponibles', badge: disponiblesCount },
    { id: 'mias',        icon: '✅', label: 'Mis solicitudes' },
    { id: 'perfil',      icon: '👤', label: 'Mi perfil'       },
  ]
  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 bg-[#0A1A14] flex-col min-h-screen sticky top-0 flex-shrink-0 border-r border-white/5">
        <div className="px-5 py-5 border-b border-white/8">
          <span className="text-xl font-extrabold text-white"><span className="text-emerald-400">Servi</span>Ya</span>
          <span className="text-white/25 text-xs ml-2">Técnico</span>
        </div>
        {/* Tecnico info */}
        <div className="px-5 py-4 border-b border-white/8">
          <div className="w-10 h-10 rounded-full bg-emerald-600/20 overflow-hidden flex items-center justify-center text-emerald-400 font-extrabold text-lg mb-2">
            {tecnico?.foto_perfil_url ? (
              <img src={tecnico.foto_perfil_url} alt={tecnico?.nombre || 'Técnico'} className="w-full h-full object-cover" />
            ) : (
              <span>{tecnico?.nombre?.charAt(0) || '?'}</span>
            )}
          </div>
          <p className="text-sm font-bold text-white truncate">{tecnico?.nombre}</p>
          <p className="text-xs text-white/30 truncate">{tecnico?.categoria} · {tecnico?.ciudad}</p>
          <div className="mt-1.5">
            {tecnico?.verificado
              ? <span className="text-xs bg-green-500/20 text-green-400 font-semibold px-2 py-0.5 rounded-full">✓ Verificado</span>
              : <span className="text-xs bg-amber-500/20 text-amber-400 font-semibold px-2 py-0.5 rounded-full">⏳ En revisión</span>
            }
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} disabled={!tecnico?.verificado && item.id !== 'perfil'}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left disabled:opacity-30 disabled:cursor-not-allowed ${
                view === item.id ? 'bg-emerald-600/20 text-emerald-400' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/8 space-y-2">
          <Link
            href="/tecnico/cobrar"
            className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-emerald-900/30"
          >
            💳 Cobrar servicio
          </Link>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
          ><span>🚪</span> Cerrar sesión</button>
        </div>
      </aside>

      {/* ── Mobile: sticky top header ──────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A1A14]/95 backdrop-blur-md border-b border-white/8 flex items-center px-4 py-3 gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-600/20 overflow-hidden flex items-center justify-center text-emerald-400 font-extrabold text-base flex-shrink-0">
          {tecnico?.foto_perfil_url
            ? <img src={tecnico.foto_perfil_url} alt={tecnico.nombre} className="w-full h-full object-cover" />
            : <span>{tecnico?.nombre?.charAt(0) || '?'}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{tecnico?.nombre}</p>
          <p className="text-xs text-white/40 truncate">{tecnico?.categoria}</p>
        </div>
        {tecnico?.verificado
          ? <span className="text-[10px] bg-green-500/20 text-green-400 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">✓ Activo</span>
          : <span className="text-[10px] bg-amber-500/20 text-amber-400 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">⏳ Revisión</span>
        }
        <button onClick={onLogout} className="text-white/30 hover:text-red-400 transition-colors p-1 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>
    </>
  )
}

/* ── Mobile bottom tab bar ───────────────────────────────────────────────── */
function TecnicoBottomNav({ view, setView, disponiblesCount, verificado }) {
  const tabs = [
    { id: 'dashboard',   icon: '🏠', label: 'Panel'      },
    { id: 'disponibles', icon: '📋', label: 'Disponibles', badge: disponiblesCount },
    { id: 'mias',        icon: '✅', label: 'Mis trabajos' },
    { id: 'perfil',      icon: '👤', label: 'Perfil'      },
  ]
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A1A14]/95 backdrop-blur-md border-t border-white/8 flex">
      {tabs.map(tab => (
        <button key={tab.id}
          onClick={() => setView(tab.id)}
          disabled={!verificado && tab.id !== 'perfil'}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-all disabled:opacity-30 ${
            view === tab.id ? 'text-emerald-400' : 'text-white/30'
          }`}
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          <span className={`text-[10px] font-semibold leading-none mt-0.5`}>{tab.label}</span>
          {tab.badge > 0 && (
            <span className="absolute top-1.5 right-[calc(50%-10px)] bg-emerald-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
              {tab.badge}
            </span>
          )}
          {view === tab.id && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />}
        </button>
      ))}
    </nav>
  )
}


// ─── Dashboard Técnico ────────────────────────────────────────────────────────
function DashboardView({ tecnico, misSolicitudes, disponiblesCount, setView }) {
  const kpis = [
    { icon: '📋', label: 'Disponibles en mi ciudad', value: disponiblesCount,                                              color: 'text-blue-600'    },
    { icon: '🔄', label: 'En curso',                  value: misSolicitudes.filter(s => s.estado === 'en_curso').length,   color: 'text-purple-600'  },
    { icon: '✅', label: 'Completadas',               value: misSolicitudes.filter(s => s.estado === 'completada').length, color: 'text-emerald-600' },
    { icon: '⭐', label: 'Mi calificación',           value: tecnico.rating ? `${tecnico.rating} ★` : 'N/A',              color: 'text-amber-600'   },
  ]

  if (!tecnico.verificado) return (
    <div className="p-6 max-w-lg mx-auto text-center py-20">
      <div className="text-6xl mb-5">⏳</div>
      <h2 className="text-xl font-extrabold text-gray-900 mb-2">Tu cuenta está en revisión</h2>
      <p className="text-gray-500 mb-5">El equipo ServiYa está verificando tu identidad. Te notificaremos cuando tu cuenta esté activa y puedas empezar a recibir clientes.</p>
      <div className="bg-brand-pale rounded-2xl p-5 text-sm text-brand font-medium text-left">
        <p className="font-bold mb-2">Mientras tanto puedes:</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-brand/80">
          <li>Revisar tu perfil y completar tu descripción</li>
          <li>Actualizar tu tarifa de visita</li>
          <li>Contactarnos por WhatsApp si tienes dudas</li>
        </ul>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-900">Hola, {tecnico.nombre.split(' ')[0]}! 👋</h2>
        <p className="text-sm text-gray-400 mt-0.5">Bienvenido a tu panel de ServiYa</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-7">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="text-xl mb-3">{k.icon}</div>
            <div className={`text-3xl font-extrabold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-400 mt-1">{k.label}</div>
          </div>
        ))}
      </div>
      {disponiblesCount > 0 && (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4 mb-5">
          <div className="text-3xl">🔔</div>
          <div className="flex-1">
            <p className="font-bold text-emerald-800">¡Hay {disponiblesCount} solicitudes disponibles en {tecnico.ciudad}!</p>
            <p className="text-sm text-emerald-600/80 mt-0.5">Acepta solicitudes antes de que otro técnico las tome.</p>
          </div>
          <button onClick={() => setView('disponibles')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all flex-shrink-0"
          >Ver solicitudes →</button>
        </div>
      )}

      {/* Cobrar CTA */}
      <Link href="/tecnico/cobrar"
        className="flex items-center gap-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-2xl p-5 mb-5 transition-all active:scale-95 shadow-lg shadow-emerald-900/30"
      >
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">💳</div>
        <div className="flex-1">
          <p className="font-extrabold text-white text-base">Cobrar un servicio</p>
          <p className="text-emerald-100/80 text-sm mt-0.5">Genera un link de pago y envíalo al cliente por WhatsApp</p>
        </div>
        <svg className="w-5 h-5 text-white/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
      {/* Info perfil quick */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-bold text-gray-700 mb-3">Mi información</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Especialidad', value: tecnico.categoria },
            { label: 'Ciudad',       value: tecnico.ciudad    },
            { label: 'Experiencia',  value: `${tecnico.experiencia_anos || 0} años` },
            { label: 'Tarifa visita', value: `$${(tecnico.tarifa_visita || 50000).toLocaleString('es-CO')}` },
          ].map(info => (
            <div key={info.label}>
              <p className="text-xs text-gray-400">{info.label}</p>
              <p className="font-semibold text-gray-800">{info.value}</p>
            </div>
          ))}
        </div>
        <button onClick={() => setView('perfil')} className="mt-4 text-xs text-emerald-600 font-semibold hover:underline">Editar mi perfil →</button>
      </div>
    </div>
  )
}

// ─── Solicitudes disponibles ──────────────────────────────────────────────────
function DisponiblesView({ disponibles, onAceptar }) {
  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-gray-900">Solicitudes disponibles</h2>
        <p className="text-sm text-gray-400 mt-0.5">Solicitudes pendientes en tu ciudad — sé el primero en aceptar</p>
      </div>
      {disponibles.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-gray-500 font-medium">No hay solicitudes disponibles en tu ciudad por ahora.</p>
          <p className="text-sm text-gray-400 mt-1">Te notificaremos cuando llegue una nueva.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disponibles.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{CAT_ICONS[s.categoria] || '🛠️'}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{s.categoria}</p>
                    <p className="text-xs text-gray-400">{s.ciudad}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(s.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2 leading-relaxed line-clamp-3">{s.descripcion}</p>
              {s.direccion && <p className="text-xs text-gray-400 mb-4">📍 {s.direccion}</p>}
              <button onClick={() => onAceptar(s.id)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-xl transition-all active:scale-95"
              >Aceptar solicitud ✓</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mis solicitudes ──────────────────────────────────────────────────────────
function MiasSolicitudesView({ solicitudes, onUpdateEstado }) {
  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-gray-900">Mis solicitudes</h2>
        <p className="text-sm text-gray-400 mt-0.5">Solicitudes que has aceptado</p>
      </div>
      {solicitudes.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 font-medium">Aún no has aceptado ninguna solicitud.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map(s => {
            const siguiente = SIGUIENTE_ESTADO[s.estado]
            return (
              <div key={s.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${s.estado === 'completada' ? 'border-green-100 opacity-75' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{CAT_ICONS[s.categoria] || '🛠️'}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{s.categoria}</p>
                      <p className="text-xs text-gray-400">{s.ciudad}</p>
                    </div>
                  </div>
                  <Badge estado={s.estado} />
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{s.descripcion}</p>
                <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-center gap-3">
                  <span className="text-lg">👤</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{s.cliente_nombre}</p>
                    <a href={`tel:${s.cliente_telefono}`} className="text-sm text-emerald-600 font-bold hover:underline">{s.cliente_telefono}</a>
                  </div>
                  <a href={`https://wa.me/57${s.cliente_telefono}?text=Hola ${s.cliente_nombre}, soy tu técnico de ServiYa para ${s.categoria}`}
                    target="_blank" rel="noopener noreferrer"
                    className="ml-auto bg-[#25D366] text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                  >WhatsApp</a>
                </div>
                {siguiente && s.estado !== 'cancelada' && (
                  <button onClick={() => onUpdateEstado(s.id, siguiente)}
                    className={`w-full text-sm font-bold py-2.5 rounded-xl transition-all active:scale-95 ${
                      siguiente === 'en_curso' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {siguiente === 'en_curso' ? '▶ Marcar como "En curso"' : '✓ Marcar como completada'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Mi perfil ────────────────────────────────────────────────────────────────
function PerfilView({ tecnico, pago, onUpdatePerfil, onUpdatePago }) {
  const [descripcion, setDesc]   = useState(tecnico.descripcion || '')
  const [tarifa, setTarifa]      = useState(tecnico.tarifa_visita || 50000)
  const [fotoPerfil, setFotoPerfil] = useState(tecnico.foto_perfil_url || '')
  const [bancoNombre, setBancoNombre] = useState(pago?.banco_nombre || '')
  const [tipoCuenta, setTipoCuenta] = useState(pago?.tipo_cuenta || '')
  const [numeroCuenta, setNumeroCuenta] = useState(pago?.numero_cuenta || '')
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [saving, setSaving]      = useState(false)
  const [saved, setSaved]        = useState(false)

  const onUploadFoto = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) return

    setUploadingFoto(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `perfiles/${tecnico.id}-${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase
      .storage
      .from('documentos-tecnicos')
      .upload(path, file, { cacheControl: '3600', upsert: true })

    if (!uploadErr) {
      const { data } = supabase.storage.from('documentos-tecnicos').getPublicUrl(path)
      setFotoPerfil(data.publicUrl)
    }
    setUploadingFoto(false)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    await onUpdatePerfil({
      descripcion,
      tarifa_visita: parseInt(tarifa, 10),
      foto_perfil_url: fotoPerfil || null,
    })
    await onUpdatePago({
      banco_nombre: bancoNombre.trim(),
      tipo_cuenta: tipoCuenta,
      numero_cuenta: numeroCuenta.trim(),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-gray-900">Mi perfil</h2>
        <p className="text-sm text-gray-400 mt-0.5">Información visible para tus clientes</p>
      </div>

      {/* Info de solo lectura */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 overflow-hidden flex items-center justify-center text-emerald-700 font-extrabold text-2xl">
            {fotoPerfil
              ? <img src={fotoPerfil} alt={tecnico.nombre} className="w-full h-full object-cover" />
              : tecnico.nombre.charAt(0)
            }
          </div>
          <div>
            <p className="text-lg font-extrabold text-gray-900">{tecnico.nombre}</p>
            <p className="text-sm text-gray-500">{tecnico.categoria} en {tecnico.ciudad}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-50 pt-4">
          {[
            { label: 'Teléfono',     value: tecnico.telefono       },
            { label: 'Email',        value: tecnico.email          },
            { label: 'Experiencia',  value: `${tecnico.experiencia_anos || 0} años` },
            { label: 'Estado',       value: tecnico.verificado ? '✓ Verificado' : '⏳ En revisión' },
            { label: 'Banco',        value: pago?.banco_nombre || 'Sin configurar' },
            { label: 'Cuenta',       value: pago?.numero_cuenta ? `${pago.tipo_cuenta || 'Cuenta'} • ${pago.numero_cuenta}` : 'Sin configurar' },
          ].map(info => (
            <div key={info.label}>
              <p className="text-xs text-gray-400">{info.label}</p>
              <p className="font-semibold text-gray-800 text-xs">{info.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Editable */}
      <form onSubmit={save} className="space-y-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-bold text-gray-700">Editar información</p>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Foto de perfil</label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center text-gray-500 text-sm font-bold">
              {fotoPerfil ? <img src={fotoPerfil} alt="Foto de perfil" className="w-full h-full object-cover" /> : 'Sin foto'}
            </div>
            <label className="text-xs font-semibold text-emerald-700 cursor-pointer">
              {uploadingFoto ? 'Subiendo foto...' : 'Subir foto (JPG/PNG, máx 2MB)'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => onUploadFoto(e.target.files?.[0])}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Sobre ti</label>
          <textarea rows={4} value={descripcion} onChange={e => setDesc(e.target.value)}
            placeholder="Describe tu experiencia, especializaciones..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tarifa de visita (COP)</label>
          <input type="number" min="0" value={tarifa} onChange={e => setTarifa(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <p className="text-xs text-gray-400 mt-1">Lo que cobras por el diagnóstico</p>
        </div>
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-bold text-gray-700 mb-3">Datos bancarios para pagos</p>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Banco</label>
              <input
                value={bancoNombre}
                onChange={e => setBancoNombre(e.target.value)}
                placeholder="Ej: Bancolombia"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de cuenta</label>
              <select
                value={tipoCuenta}
                onChange={e => setTipoCuenta(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Seleccionar tipo</option>
                <option value="ahorros">Ahorros</option>
                <option value="corriente">Corriente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Número de cuenta</label>
              <input
                value={numeroCuenta}
                onChange={e => setNumeroCuenta(e.target.value.replace(/\s/g, ''))}
                inputMode="numeric"
                placeholder="Ej: 1234567890"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
        <button type="submit" disabled={saving}
          className={`w-full font-bold py-3 rounded-xl transition-all disabled:opacity-60 ${saved ? 'bg-green-500 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
        >{saving ? 'Guardando...' : saved ? '✓ Guardado!' : 'Guardar cambios'}</button>
      </form>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function TecnicoPage() {
  const [user, setUser]           = useState(null)
  const [tecnico, setTecnico]     = useState(null)
  const [pago, setPago]           = useState(null)
  const [authLoading, setAL]      = useState(true)
  const [view, setView]           = useState('dashboard')
  const [disponibles, setDisp]    = useState([])
  const [misSols, setMisSols]     = useState([])

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: tec } = await supabase.from('tecnicos').select('*').eq('auth_user_id', session.user.id).single()
        if (tec) {
          const { data: pagoData } = await supabase.from('tecnico_pagos').select('*').eq('tecnico_id', tec.id).maybeSingle()
          setUser(session.user)
          setTecnico(tec)
          setPago(pagoData || null)
        }
      }
      setAL(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (!session) { setUser(null); setTecnico(null); setPago(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch data when tecnico loaded
  useEffect(() => {
    if (!tecnico) return
    Promise.all([
      supabase.from('solicitudes').select('*')
        .eq('ciudad', tecnico.ciudad)
        .eq('estado', 'pendiente')
        .is('tecnico_id', null)
        .order('created_at', { ascending: false }),
      supabase.from('solicitudes').select('*')
        .eq('tecnico_id', tecnico.id)
        .order('created_at', { ascending: false }),
    ]).then(([{ data: d }, { data: m }]) => {
      setDisp(d || [])
      setMisSols(m || [])
    })
  }, [tecnico])

  const onLogin = async (u, t) => {
    setUser(u)
    setTecnico(t)
    const { data: pagoData } = await supabase.from('tecnico_pagos').select('*').eq('tecnico_id', t.id).maybeSingle()
    setPago(pagoData || null)
  }

  const aceptar = async (solicitudId) => {
    const { error } = await supabase.from('solicitudes')
      .update({ tecnico_id: tecnico.id, estado: 'asignada' })
      .eq('id', solicitudId)
      .is('tecnico_id', null)
    if (!error) {
      const accepted = disponibles.find(s => s.id === solicitudId)
      setDisp(prev => prev.filter(s => s.id !== solicitudId))
      if (accepted) setMisSols(prev => [{ ...accepted, tecnico_id: tecnico.id, estado: 'asignada' }, ...prev])
    }
  }

  const updateEstado = async (solicitudId, estado) => {
    await supabase.from('solicitudes').update({ estado }).eq('id', solicitudId).eq('tecnico_id', tecnico.id)
    setMisSols(prev => prev.map(s => s.id === solicitudId ? { ...s, estado } : s))
    // Notificar cambio de estado relevante
    if (estado === 'en_curso' || estado === 'completada') {
      const sol = misSols.find(s => s.id === solicitudId)
      if (sol) {
        fetch('/api/notify/estado', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nuevoEstado: estado,
            solicitud: sol,
            tecnico: { nombre: tecnico.nombre, email: tecnico.email, telefono: tecnico.telefono, categoria: tecnico.categoria, ciudad: tecnico.ciudad },
            cliente: { nombre: sol.cliente_nombre || null, email: sol.cliente_email || null, telefono: sol.cliente_telefono || null },
          }),
        }).catch(() => {})
      }
    }
  }

  const updatePerfil = async (campos) => {
    await supabase.from('tecnicos').update(campos).eq('id', tecnico.id).eq('auth_user_id', user.id)
    setTecnico(prev => ({ ...prev, ...campos }))
  }

  const updatePago = async (campos) => {
    if (!campos.banco_nombre || !campos.tipo_cuenta || !campos.numero_cuenta) return
    const payload = { tecnico_id: tecnico.id, ...campos }
    await supabase.from('tecnico_pagos').upsert(payload, { onConflict: 'tecnico_id' })
    setPago(prev => ({ ...(prev || { tecnico_id: tecnico.id }), ...campos }))
  }

  const logout = async () => { await supabase.auth.signOut(); setUser(null); setTecnico(null); setPago(null) }

  if (authLoading) return (
    <div className="min-h-screen bg-[#071A14] flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin block" />
    </div>
  )
  if (!user || !tecnico) return <LoginScreen onSuccess={onLogin} />

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar view={view} setView={setView} tecnico={tecnico} disponiblesCount={disponibles.length} onLogout={logout} />
      {/* Mobile bottom nav */}
      <TecnicoBottomNav view={view} setView={setView} disponiblesCount={disponibles.length} verificado={tecnico?.verificado} />
      {/* Floating Cobrar button — mobile only */}
      {tecnico?.verificado && (
        <Link
          href="/tecnico/cobrar"
          className="md:hidden fixed bottom-20 right-4 z-50 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-3.5 rounded-2xl shadow-xl shadow-emerald-900/50 flex items-center gap-2 text-sm active:scale-95 transition-all"
        >
          💳 Cobrar
        </Link>
      )}
      {/* pt-14 on mobile: space for fixed header. pb-28 on mobile: space for bottom nav + FAB */}
      <main className="flex-1 min-h-screen overflow-auto pt-14 pb-28 md:pt-0 md:pb-0">
        {view === 'dashboard'   && <DashboardView tecnico={tecnico} misSolicitudes={misSols} disponiblesCount={disponibles.length} setView={setView} />}
        {view === 'disponibles' && <DisponiblesView disponibles={disponibles} onAceptar={aceptar} />}
        {view === 'mias'        && <MiasSolicitudesView solicitudes={misSols} onUpdateEstado={updateEstado} />}
        {view === 'perfil'      && <PerfilView tecnico={tecnico} pago={pago} onUpdatePerfil={updatePerfil} onUpdatePago={updatePago} />}
        <PanelFooter role="tecnico" />
      </main>
    </div>
  )
}
