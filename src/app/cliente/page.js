'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PanelFooter from '@/components/PanelFooter'
import Logo from '@/components/Logo'


const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

const ESTADO_CFG = {
  pendiente: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  asignada: { label: 'Asignada', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  en_curso: { label: 'En curso', cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
  completada: { label: 'Completada', cls: 'bg-green-50 text-green-700 border border-green-200' },
  cancelada: { label: 'Cancelada', cls: 'bg-red-50 text-red-700 border border-red-200' },
}

function Badge({ estado }) {
  const cfg = ESTADO_CFG[estado] || { label: estado, cls: 'bg-gray-50 text-gray-600 border border-gray-200' }
  return <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
}

function AuthScreen({ onSuccess, forcedError = '' }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (forcedError) setError(forcedError)
  }, [forcedError])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    if (mode === 'login') {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (authErr) {
        setError('No pudimos iniciar sesión. Verifica tus credenciales.')
        return
      }
      if (data?.user?.email && ADMIN_EMAIL && data.user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        await supabase.auth.signOut()
        setError('La cuenta administradora no puede ingresar al panel de cliente.')
        return
      }
      onSuccess(data.user)
      return
    }

    const { data, error: signErr } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (signErr) {
      setError(signErr.message || 'No se pudo crear la cuenta.')
      return
    }
    if (data.user) {
      setMessage('Cuenta creada. Si no entraste automáticamente, revisa tu correo para confirmar.')
      onSuccess(data.user)
      // Notificar bienvenida
      fetch('/api/notify/registro', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'cliente', nombre: email.split('@')[0], email, telefono: '' }),
      }).catch(() => {})
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071A14] to-[#0A3D2E] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo variant="white" />
          <p className="text-white/40 text-sm mt-2 uppercase tracking-widest font-semibold">Panel de Cliente</p>
        </div>

        <div className="bg-white/8 backdrop-blur-md border border-white/12 rounded-3xl p-7">
          <div className="bg-white/5 rounded-xl p-1 mb-5 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`text-xs font-semibold py-2 rounded-lg transition-all ${mode === 'login' ? 'bg-emerald-600 text-white' : 'text-white/60 hover:text-white'}`}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`text-xs font-semibold py-2 rounded-lg transition-all ${mode === 'register' ? 'bg-emerald-600 text-white' : 'text-white/60 hover:text-white'}`}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@correo.com"
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={6}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 pr-14 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-xs font-medium"
                >
                  {showPass ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
            {error && <div className="bg-red-900/30 border border-red-500/25 text-red-300 text-xs px-4 py-3 rounded-xl">{error}</div>}
            {message && <div className="bg-emerald-900/30 border border-emerald-500/25 text-emerald-200 text-xs px-4 py-3 rounded-xl">{message}</div>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all"
            >
              {loading ? 'Procesando...' : mode === 'login' ? 'Ingresar a mi panel' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function Sidebar({ view, setView, user, onLogout, totalSolicitudes }) {
  const nav = [
    { id: 'dashboard', icon: '🏠', label: 'Mi panel' },
    { id: 'solicitudes', icon: '📋', label: 'Mis solicitudes', badge: totalSolicitudes },
    { id: 'perfil', icon: '👤', label: 'Mi cuenta' },
  ]

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 bg-[#0A1A14] flex-col min-h-screen sticky top-0 flex-shrink-0 border-r border-white/5">
        <div className="px-5 py-5 border-b border-white/8 flex items-center gap-2">
          <Logo variant="white" />
          <span className="text-white/25 text-xs">Cliente</span>
        </div>

        <div className="px-5 py-4 border-b border-white/8">
          <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-extrabold text-lg mb-2">
            {user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <p className="text-xs text-white/30 truncate">Cuenta</p>
          <p className="text-sm font-bold text-white truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(item => (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
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
        <div className="px-3 py-4 border-t border-white/8">
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
          ><span>🚪</span> Cerrar sesión</button>
        </div>
      </aside>

      {/* ── Mobile: sticky top header ────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A1A14]/95 backdrop-blur-md border-b border-white/8 flex items-center justify-between px-4 py-3">
        <Logo variant="white" />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
            {user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <button onClick={onLogout} className="text-white/30 hover:text-red-400 transition-colors p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>
    </>
  )
}

function ClienteBottomNav({ view, setView, totalSolicitudes }) {
  const tabs = [
    { id: 'dashboard',   icon: '🏠', label: 'Panel'       },
    { id: 'solicitudes', icon: '📋', label: 'Solicitudes', badge: totalSolicitudes },
    { id: 'perfil',      icon: '👤', label: 'Mi cuenta'   },
  ]
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A1A14]/95 backdrop-blur-md border-t border-white/8 flex">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setView(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-all ${
            view === tab.id ? 'text-emerald-400' : 'text-white/30'
          }`}
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span className="text-[10px] font-semibold leading-none mt-0.5">{tab.label}</span>
          {tab.badge > 0 && (
            <span className="absolute top-1.5 right-[calc(50%-12px)] bg-emerald-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
              {tab.badge}
            </span>
          )}
          {view === tab.id && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />}
        </button>
      ))}
    </nav>
  )
}


function DashboardView({ user, solicitudes, setView }) {
  const kpis = [
    { icon: '📋', label: 'Total solicitudes', value: solicitudes.length, color: 'text-blue-600' },
    { icon: '⏳', label: 'Pendientes', value: solicitudes.filter(s => s.estado === 'pendiente' || s.estado === 'asignada').length, color: 'text-amber-600' },
    { icon: '🔧', label: 'En curso', value: solicitudes.filter(s => s.estado === 'en_curso').length, color: 'text-purple-600' },
    { icon: '✅', label: 'Completadas', value: solicitudes.filter(s => s.estado === 'completada').length, color: 'text-emerald-600' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-gray-900">Bienvenido 👋</h2>
        <p className="text-sm text-gray-400 mt-0.5">Panel de seguimiento para tus servicios</p>
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-gray-700">Solicitudes recientes</p>
          <button onClick={() => setView('solicitudes')} className="text-xs text-emerald-600 font-semibold hover:underline">Ver todas →</button>
        </div>
        {solicitudes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Aún no tienes solicitudes asociadas a tu cuenta.</p>
            <p className="text-xs text-gray-400 mt-1">Usa el mismo correo al solicitar en la web para verlas aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {solicitudes.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.categoria} · {s.ciudad}</p>
                  <p className="text-xs text-gray-400 truncate">{s.descripcion}</p>
                </div>
                <Badge estado={s.estado} />
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4 truncate">Cuenta: {user.email}</p>
      </div>
    </div>
  )
}

function SolicitudesView({ solicitudes, tecnicosById, onCancelar }) {
  if (solicitudes.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-lg font-extrabold text-gray-900 mb-2">No hay solicitudes para mostrar</h2>
          <p className="text-sm text-gray-500">Cuando solicites un servicio con este correo, aparecerá aquí.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-gray-900">Mis solicitudes</h2>
        <p className="text-sm text-gray-400 mt-0.5">Sigue el estado de cada servicio</p>
      </div>

      <div className="space-y-4">
        {solicitudes.map(s => {
          const tecnicoRaw = s.tecnico_id ? tecnicosById[s.tecnico_id] : null
          const tecnico = tecnicoRaw && tecnicoRaw.ciudad === s.ciudad ? tecnicoRaw : null
          const puedeCancelar = s.estado === 'pendiente' || s.estado === 'asignada'
          return (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-800">{s.categoria} · {s.ciudad}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Badge estado={s.estado} />
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-3">{s.descripcion}</p>
              {s.direccion && <p className="text-xs text-gray-400 mb-3">📍 {s.direccion}</p>}

              {tecnico ? (
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <p className="text-xs text-gray-400 mb-1">Técnico asignado</p>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 overflow-hidden flex items-center justify-center text-emerald-700 font-bold text-sm">
                      {tecnico.foto_perfil_url
                        ? <img src={tecnico.foto_perfil_url} alt={tecnico.nombre} className="w-full h-full object-cover" />
                        : tecnico.nombre?.charAt(0)
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{tecnico.nombre}</p>
                      <a href={`tel:${tecnico.telefono}`} className="text-sm text-emerald-600 font-bold hover:underline">{tecnico.telefono}</a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                  <p className="text-xs text-amber-700 font-medium">Aún no hay técnico asignado.</p>
                </div>
              )}

              {puedeCancelar && (
                <button
                  onClick={() => onCancelar(s.id)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold py-2.5 rounded-xl transition-all"
                >
                  Cancelar solicitud
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PerfilView({ user, cliente }) {
  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-gray-900">Mi cuenta</h2>
        <p className="text-sm text-gray-400 mt-0.5">Información vinculada a tu panel</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-extrabold text-2xl mb-3">
          {user?.email?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <p className="text-xs text-gray-400">Correo principal</p>
        <p className="text-base font-semibold text-gray-900 break-all">{user.email}</p>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Nombre</p>
            <p className="font-semibold text-gray-800">{cliente?.nombre || 'Sin definir'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Teléfono</p>
            <p className="font-semibold text-gray-800">{cliente?.telefono || 'Sin definir'}</p>
          </div>
        </div>
        <div className="bg-brand-pale rounded-xl p-4 mt-4">
          <p className="text-sm text-brand font-medium">
            Usa este mismo correo cuando crees solicitudes en la página pública para que se reflejen automáticamente en este panel.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ClientePage() {
  const [user, setUser] = useState(null)
  const [cliente, setCliente] = useState(null)
  const [accessError, setAccessError] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [view, setView] = useState('dashboard')
  const [solicitudes, setSolicitudes] = useState([])
  const [tecnicosById, setTecnicosById] = useState({})

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user?.id || !user?.email) {
      setCliente(null)
      setAccessError('')
      return
    }

    const ensureCliente = async () => {
      if (ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        await supabase.auth.signOut()
        setUser(null)
        setCliente(null)
        setAccessError('La cuenta administradora no puede ingresar al panel de cliente.')
        return
      }

      const { data: tecnicoProfile } = await supabase
        .from('tecnicos')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (tecnicoProfile) {
        await supabase.auth.signOut()
        setUser(null)
        setCliente(null)
        setAccessError('Tu cuenta está registrada como técnico. Usa el panel /tecnico.')
        return
      }

      const email = user.email.toLowerCase().trim()
      const { data: existing } = await supabase
        .from('clientes')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      if (existing) {
        if (existing.email !== email) {
          const { data: updated } = await supabase
            .from('clientes')
            .update({ email })
            .eq('id', existing.id)
            .select('*')
            .maybeSingle()
          setCliente(updated || existing)
          return
        }
        setCliente(existing)
        return
      }

      const { data: byEmail } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (byEmail) {
        const { data: linked } = await supabase
          .from('clientes')
          .update({ auth_user_id: user.id })
          .eq('id', byEmail.id)
          .select('*')
          .maybeSingle()
        setCliente(linked || byEmail)
        return
      }

      const { data: created } = await supabase
        .from('clientes')
        .insert([{ auth_user_id: user.id, email, nombre: user.email.split('@')[0] }])
        .select('*')
        .maybeSingle()

      if (created) setCliente(created)
    }

    ensureCliente()
  }, [user])

  useEffect(() => {
    if (!user?.email) {
      setSolicitudes([])
      setTecnicosById({})
      return
    }

    const loadData = async () => {
      const { data: solicitudesData } = await supabase
        .from('solicitudes')
        .select('*')
        .eq('cliente_email', user.email)
        .order('created_at', { ascending: false })

      const list = solicitudesData || []
      setSolicitudes(list)

      const tecnicoIds = [...new Set(list.map(s => s.tecnico_id).filter(Boolean))]
      if (tecnicoIds.length === 0) {
        setTecnicosById({})
        return
      }

      const { data: tecnicosData } = await supabase.from('tecnicos').select('id,nombre,telefono,ciudad,foto_perfil_url').in('id', tecnicoIds)
      const byId = (tecnicosData || []).reduce((acc, tec) => {
        acc[tec.id] = tec
        return acc
      }, {})
      setTecnicosById(byId)
    }

    loadData()
  }, [user])

  const cancelarSolicitud = async (id) => {
    const { error } = await supabase
      .from('solicitudes')
      .update({ estado: 'cancelada' })
      .eq('id', id)
      .eq('cliente_email', user.email)
      .in('estado', ['pendiente', 'asignada'])

    if (!error) {
      setSolicitudes(prev => prev.map(s => (s.id === id ? { ...s, estado: 'cancelada' } : s)))
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const totalSolicitudes = useMemo(() => solicitudes.length, [solicitudes])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#071A14] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin block" />
      </div>
    )
  }

  if (!user) return <AuthScreen onSuccess={setUser} forcedError={accessError} />

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar view={view} setView={setView} user={user} onLogout={logout} totalSolicitudes={totalSolicitudes} />
      <ClienteBottomNav view={view} setView={setView} totalSolicitudes={totalSolicitudes} />
      {/* pt-14 mobile: space for fixed header. pb-24 mobile: space for bottom nav */}
      <main className="flex-1 min-h-screen overflow-auto pt-14 pb-24 md:pt-0 md:pb-0">
        {view === 'dashboard' && <DashboardView user={user} solicitudes={solicitudes} setView={setView} />}
        {view === 'solicitudes' && <SolicitudesView solicitudes={solicitudes} tecnicosById={tecnicosById} onCancelar={cancelarSolicitud} />}
        {view === 'perfil' && <PerfilView user={user} cliente={cliente} />}
        <PanelFooter role="cliente" />
      </main>
    </div>
  )
}
