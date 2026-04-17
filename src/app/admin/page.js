'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import PanelFooter from '@/components/PanelFooter'
import Logo from '@/components/Logo'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

const ESTADO_CFG = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-amber-50  text-amber-700  border border-amber-200'   },
  asignada:   { label: 'Asignada',   cls: 'bg-blue-50   text-blue-700   border border-blue-200'    },
  en_curso:   { label: 'En curso',   cls: 'bg-purple-50 text-purple-700 border border-purple-200'  },
  completada: { label: 'Completada', cls: 'bg-green-50  text-green-700  border border-green-200'   },
  cancelada:  { label: 'Cancelada',  cls: 'bg-red-50    text-red-700    border border-red-200'     },
}
const ESTADOS    = Object.keys(ESTADO_CFG)
const CIUDADES   = ['Bogotá','Medellín','Cali','Barranquilla','Cartagena','Bucaramanga','Pereira','Manizales','Ibagué','Neiva','Villavicencio','Pasto']
const CATEGORIAS = ['Plomería','Electricidad','Cerrajería','Pintura','Aire acondicionado','Jardinería','Limpieza','Otro']

// ─── Badge ───────────────────────────────────────────────────────────────────
function Badge({ estado }) {
  const cfg = ESTADO_CFG[estado] || { label: estado, cls: 'bg-gray-50 text-gray-600 border border-gray-200' }
  return <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}>{cfg.label}</span>
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
    if (authErr) { setLoading(false); setError('Credenciales incorrectas.'); return }
    if (data.user.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut()
      setLoading(false)
      setError('No tienes acceso de administrador.')
      return
    }
    onSuccess(data.user)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071A14] to-[#0A3D2E] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo variant="white" />
          <p className="text-white/40 text-sm mt-2 uppercase tracking-widest font-semibold">Panel de administración</p>
        </div>

        <div className="bg-white/8 backdrop-blur-md border border-white/12 rounded-3xl p-7">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="admin@serviya.co"
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
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all mt-2"
            >{loading ? 'Verificando...' : 'Ingresar al panel'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar / Mobile Nav ──────────────────────────────────────────────────────
function Sidebar({ view, setView, pendientes, sinVerificar, clientesCount, cobrosCount, email, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const nav = [
    { id: 'dashboard',   icon: '📊', label: 'Dashboard'   },
    { id: 'solicitudes', icon: '📋', label: 'Solicitudes', badge: pendientes  },
    { id: 'clientes',    icon: '🧑‍💼', label: 'Clientes',    badge: clientesCount },
    { id: 'tecnicos',    icon: '👷', label: 'Técnicos',    badge: sinVerificar },
    { id: 'cobros',      icon: '💳', label: 'Cobros',      badge: cobrosCount  },
  ]

  const handleNav = (id) => { setView(id); setMobileMenuOpen(false) }

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="hidden md:flex w-56 bg-[#0A1A14] flex-col min-h-screen sticky top-0 flex-shrink-0 border-r border-white/5">
        <div className="px-5 py-5 border-b border-white/8 flex items-center gap-2">
          <Logo variant="white" />
          <span className="text-white/25 text-xs">Admin</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(item => (
            <button key={item.id} onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                view === item.id ? 'bg-emerald-600/20 text-emerald-400' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/8 space-y-1.5">
          <p className="text-[11px] text-white/25 px-3 truncate">{email}</p>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
          ><span>🚪</span> Cerrar sesión</button>
        </div>
      </aside>

      {/* ── Mobile: sticky top header ─────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0A1A14]/95 backdrop-blur-md border-b border-white/8 flex items-center justify-between px-4 py-3">
        <span className="text-lg font-extrabold text-white"><span className="text-emerald-400">Servi</span>Ya <span className="text-white/30 text-xs font-normal">Admin</span></span>
        <div className="flex items-center gap-3">
          {/* Notif badge total */}
          {(pendientes + sinVerificar + cobrosCount) > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendientes + sinVerificar + cobrosCount}
            </span>
          )}
          <button onClick={onLogout} className="text-white/40 hover:text-red-400 transition-colors p-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>
    </>
  )
}

/* ── Mobile: bottom tab navigation (rendered outside Sidebar in AdminPage) ── */
function MobileBottomNav({ view, setView, pendientes, sinVerificar, cobrosCount }) {
  const tabs = [
    { id: 'dashboard',   icon: '📊', label: 'Panel' },
    { id: 'solicitudes', icon: '📋', label: 'Solicitudes', badge: pendientes  },
    { id: 'tecnicos',    icon: '👷', label: 'Técnicos',    badge: sinVerificar },
    { id: 'cobros',      icon: '💳', label: 'Cobros',      badge: cobrosCount  },
    { id: 'clientes',    icon: '🧑‍💼', label: 'Clientes' },
  ]
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A1A14]/95 backdrop-blur-md border-t border-white/8 flex">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setView(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 relative transition-all ${
            view === tab.id ? 'text-emerald-400' : 'text-white/30'
          }`}
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          <span className={`text-[10px] font-semibold leading-none mt-0.5 ${view === tab.id ? 'text-emerald-400' : 'text-white/30'}`}>
            {tab.label}
          </span>
          {tab.badge > 0 && (
            <span className="absolute top-1.5 right-[calc(50%-10px)] bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
              {tab.badge}
            </span>
          )}
          {view === tab.id && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-400 rounded-full" />
          )}
        </button>
      ))}
    </nav>
  )
}

// ─── CobrosView ────────────────────────────────────────────────────────────────
function CobrosView({ cobros, onMarcarPagado }) {
  const fmt = (v) => '$' + Number(v || 0).toLocaleString('es-CO')
  const ESTADO_COBRO = {
    pendiente:   { label: 'Pendiente',   cls: 'bg-amber-50  text-amber-700  border border-amber-200'  },
    pagado:      { label: 'Pagado',      cls: 'bg-green-50  text-green-700  border border-green-200'  },
    fallido:     { label: 'Fallido',     cls: 'bg-red-50    text-red-700    border border-red-200'    },
    reembolsado: { label: 'Reembolsado',cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
  }
  const pagados       = cobros.filter(c => c.estado === 'pagado')
  const totalProcess  = pagados.reduce((s, c) => s + (c.valor_total    || 0), 0)
  const totalComision = pagados.reduce((s, c) => s + (c.valor_comision || 0), 0)
  const pendPago      = pagados.filter(c => !c.pagado_tecnico).reduce((s, c) => s + (c.valor_tecnico || 0), 0)

  return (
    <div className="p-4 md:p-6 w-full max-w-6xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-extrabold text-gray-900">Cobros y pagos</h2>
        <p className="text-sm text-gray-400 mt-0.5">Historial generado por técnicos con Bold</p>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-sm">
          <div className="text-xl mb-1">💰</div>
          <div className="text-sm md:text-lg font-extrabold text-emerald-600 leading-tight">{fmt(totalProcess)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Total procesado</div>
        </div>
        <div className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-sm">
          <div className="text-xl mb-1">🏦</div>
          <div className="text-sm md:text-lg font-extrabold text-blue-600 leading-tight">{fmt(totalComision)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Comisión ServiYa</div>
        </div>
        <div className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-sm">
          <div className="text-xl mb-1">⏳</div>
          <div className="text-sm md:text-lg font-extrabold text-amber-600 leading-tight">{fmt(pendPago)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Pend. técnicos</div>
        </div>
      </div>
      {cobros.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center text-gray-400">
          <div className="text-4xl mb-3">💳</div>
          <p className="font-semibold">Aún no hay cobros</p>
          <p className="text-sm mt-1">Aparecerán aquí cuando los técnicos generen links de pago.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cobros.map(c => {
            const cfg = ESTADO_COBRO[c.estado] || { label: c.estado, cls: 'bg-gray-100 text-gray-600' }
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{c.tecnico_nombre}</p>
                    <p className="text-xs text-gray-400 truncate">→ {c.cliente_nombre}</p>
                  </div>
                  <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.cls}`}>{cfg.label}</span>
                </div>
                {c.descripcion && <p className="text-xs text-gray-500 mb-2 line-clamp-1">{c.descripcion}</p>}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-gray-400">Cliente pagó</p>
                    <p className="text-xs font-bold text-gray-800">{fmt(c.valor_total)}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-amber-600">Comisión</p>
                    <p className="text-xs font-bold text-amber-700">{fmt(c.valor_comision)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-2 text-center">
                    <p className="text-[10px] text-emerald-600">Técnico</p>
                    <p className="text-xs font-bold text-emerald-700">{fmt(c.valor_tecnico)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {c.pagado_tecnico && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">✓ Técnico pagado</span>
                  )}
                  {c.estado === 'pagado' && !c.pagado_tecnico && (
                    <button onClick={() => onMarcarPagado(c.id)}
                      className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg font-semibold transition-all">
                      Marcar técnico pagado
                    </button>
                  )}
                  {c.bold_link && (
                    <a href={c.bold_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Ver link →</a>
                  )}
                </div>
                {c.referencia && <p className="text-[10px] text-gray-300 mt-1 font-mono">{c.referencia}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardView({ solicitudes, tecnicos, clientes, setView }) {
  const hoy = new Date().toDateString()
  const kpis = [
    { icon: '📅', label: 'Hoy',        value: solicitudes.filter(s => new Date(s.created_at).toDateString() === hoy).length, color: 'text-blue-600'   },
    { icon: '📋', label: 'Total',      value: solicitudes.length,                                                             color: 'text-purple-600' },
    { icon: '⏳', label: 'Pendientes', value: solicitudes.filter(s => s.estado === 'pendiente').length,                      color: 'text-amber-600'  },
    { icon: '✅', label: 'Verificados',value: tecnicos.filter(t => t.verificado).length,                                     color: 'text-emerald-600'},
    { icon: '🧑‍💼', label: 'Clientes',  value: clientes.filter(c => c.hasCuenta).length,                              color: 'text-sky-600'   },
  ]
  return (
    <div className="p-4 md:p-6 w-full max-w-5xl mx-auto">
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-extrabold text-gray-900">Centro de operaciones</h2>
        <p className="text-sm text-gray-400 mt-0.5">Resumen de clientes, solicitudes y técnicos</p>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-5">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-3 md:p-4 border border-gray-100 shadow-sm text-center">
            <div className="text-lg md:text-xl mb-1">{k.icon}</div>
            <div className={`text-xl md:text-2xl font-extrabold ${k.color}`}>{k.value}</div>
            <div className="text-[10px] md:text-xs text-gray-400 mt-0.5 leading-tight">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Solicitudes recientes</h3>
            <button onClick={() => setView('solicitudes')} className="text-xs text-emerald-600 font-semibold">Ver →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {solicitudes.slice(0, 5).map(s => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{s.cliente_nombre}</p>
                  <p className="text-xs text-gray-400 truncate">{s.categoria} · {s.ciudad}</p>
                </div>
                <Badge estado={s.estado} />
              </div>
            ))}
            {solicitudes.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Sin solicitudes aún</p>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Clientes recientes</h3>
            <button onClick={() => setView('clientes')} className="text-xs text-emerald-600 font-semibold">Ver →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {clientes.slice(0, 5).map(c => (
              <div key={c.key} className="flex items-center gap-2.5 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center text-sky-700 font-bold text-xs flex-shrink-0">{c.nombre.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{c.nombre}</p>
                  <p className="text-xs text-gray-400 truncate">{c.email || c.telefono || 'Sin contacto'}</p>
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${c.hasCuenta ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {c.hasCuenta ? '✓' : 'Inv.'}
                </span>
              </div>
            ))}
            {clientes.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Sin clientes aún</p>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="font-bold text-gray-800 text-sm">Técnicos recientes</h3>
            <button onClick={() => setView('tecnicos')} className="text-xs text-emerald-600 font-semibold">Ver →</button>
          </div>
          <div className="divide-y divide-gray-50">
            {tecnicos.slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center gap-2.5 px-4 py-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-50 overflow-hidden flex items-center justify-center text-emerald-700 font-bold text-xs flex-shrink-0">
                  {t.foto_perfil_url ? <img src={t.foto_perfil_url} alt={t.nombre} className="w-full h-full object-cover" /> : t.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{t.nombre}</p>
                  <p className="text-xs text-gray-400 truncate">{t.categoria} · {t.ciudad}</p>
                </div>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${t.verificado ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {t.verificado ? '✓' : '⏳'}
                </span>
              </div>
            ))}
            {tecnicos.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Sin técnicos aún</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Solicitudes ──────────────────────────────────────────────────────────────────
function SolicitudesView({ solicitudes, tecnicos, onUpdateEstado, onAsignarTecnico }) {
  const [search, setSearch]   = useState('')
  const [filE, setFilE]       = useState('')
  const [filC, setFilC]       = useState('')
  const [filCat, setFilCat]   = useState('')

  const filtered = useMemo(() => solicitudes.filter(s => {
    const q = search.toLowerCase()
    if (q && !s.cliente_nombre?.toLowerCase().includes(q) && !s.cliente_telefono?.includes(q)) return false
    if (filE   && s.estado    !== filE)   return false
    if (filC   && s.ciudad    !== filC)   return false
    if (filCat && s.categoria !== filCat) return false
    return true
  }), [solicitudes, search, filE, filC, filCat])

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-extrabold text-gray-900">Solicitudes</h2>
        <p className="text-sm text-gray-400 mt-0.5">{filtered.length} de {solicitudes.length} solicitudes</p>
      </div>
      {/* Filtros */}
      <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
          className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:flex-1 sm:min-w-[160px]" />
        <select value={filE} onChange={e => setFilE(e.target.value)} className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Estado</option>
          {ESTADOS.map(e => <option key={e}>{e}</option>)}
        </select>
        <select value={filC} onChange={e => setFilC(e.target.value)} className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Ciudad</option>
          {CIUDADES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No se encontraron solicitudes</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const tecDisp = tecnicos.filter(t => t.activo && t.ciudad === s.ciudad)
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{s.cliente_nombre}</p>
                    <p className="text-xs text-gray-400">{s.cliente_telefono}</p>
                  </div>
                  <Badge estado={s.estado} />
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s.ciudad}</span>
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{s.categoria}</span>
                </div>
                {s.descripcion && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.descripcion}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  <select value={s.estado} onChange={e => onUpdateEstado(s.id, e.target.value)}
                    className="border border-gray-200 rounded-lg text-xs px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-1 min-w-[110px]">
                    {ESTADOS.map(e => <option key={e}>{e}</option>)}
                  </select>
                  <select value={s.tecnico_id || ''} onChange={e => onAsignarTecnico(s.id, e.target.value || null)}
                    className="border border-gray-200 rounded-lg text-xs px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 flex-1 min-w-[110px]">
                    <option value="">Sin asignar</option>
                    {tecDisp.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
                <p className="text-[10px] text-gray-300 mt-2">
                  {new Date(s.created_at).toLocaleDateString('es-CO', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Clientes ─────────────────────────────────────────────────────────────────

function ClientesView({ clientes }) {
  const [search, setSearch] = useState('')
  const [filtroRegistro, setFiltroRegistro] = useState('')
  const [filtroActivos, setFiltroActivos] = useState('')

  const filtered = useMemo(() => clientes.filter(c => {
    const q = search.trim().toLowerCase()
    if (q && !c.nombre.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !c.telefono.includes(q)) return false
    if (filtroRegistro === 'si' && !c.hasCuenta) return false
    if (filtroRegistro === 'no' && c.hasCuenta) return false
    if (filtroActivos === 'si' && c.solicitudesActivas === 0) return false
    if (filtroActivos === 'no' && c.solicitudesActivas > 0) return false
    return true
  }), [clientes, search, filtroRegistro, filtroActivos])

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="mb-4">
        <h2 className="text-lg md:text-xl font-extrabold text-gray-900">Clientes</h2>
        <p className="text-sm text-gray-400 mt-0.5">{filtered.length} de {clientes.length} clientes en base de datos</p>
      </div>

      {/* KPIs — 2 cols mobile */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-[10px] text-gray-400">Total clientes</p>
          <p className="text-xl font-extrabold text-gray-900 mt-0.5">{clientes.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-[10px] text-gray-400">Registrados</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-0.5">{clientes.filter(c => c.hasCuenta).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-[10px] text-gray-400">Con solicitudes activas</p>
          <p className="text-xl font-extrabold text-amber-600 mt-0.5">{clientes.filter(c => c.solicitudesActivas > 0).length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
          <p className="text-[10px] text-gray-400">Ingr. estimados</p>
          <p className="text-sm font-extrabold text-blue-600 mt-0.5">${(clientes.reduce((acc, c) => acc + c.solicitudesActivas, 0) * 50000).toLocaleString('es-CO')}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
          className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:flex-1" />
        <select value={filtroRegistro} onChange={e => setFiltroRegistro(e.target.value)} className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Todos</option>
          <option value="si">Registrados</option>
          <option value="no">Sin cuenta</option>
        </select>
        <select value={filtroActivos} onChange={e => setFiltroActivos(e.target.value)} className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Actividad</option>
          <option value="si">Con solicitudes</option>
          <option value="no">Sin solicitudes</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">No hay clientes con esos filtros</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c.key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-sky-50 flex items-center justify-center text-sky-700 font-extrabold text-sm flex-shrink-0">{c.nombre.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{c.nombre}</p>
                  <p className="text-xs text-gray-400 truncate">{c.email || 'Sin correo'}</p>
                  <p className="text-xs text-gray-400">{c.telefono || 'Sin teléfono'}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${c.hasCuenta ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {c.hasCuenta ? 'Registrado' : 'Invitado'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Total {c.totalSolicitudes}</span>
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Activas {c.solicitudesActivas}</span>
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Completadas {c.completadas}</span>
              </div>
              <p className="text-[10px] text-gray-300 mt-1">
                Última actividad: {new Date(c.ultimaActividad).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ─── Docs Modal ──────────────────────────────────────────────────────────────
function DocsModal({ tecnico, pago, onClose, onVerificar, onActivar }) {
  if (!tecnico) return null

  const tieneDocumentos = tecnico.cedula_frontal_url || tecnico.cedula_posterior_url || tecnico.cedula_numero

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* ── Header con foto de perfil ── */}
        <div className="relative bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-t-3xl px-6 py-6">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-sm transition-colors">✕</button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 overflow-hidden flex items-center justify-center text-white font-extrabold text-3xl flex-shrink-0 border-2 border-white/30">
              {tecnico.foto_perfil_url
                ? <img src={tecnico.foto_perfil_url} alt={tecnico.nombre} className="w-full h-full object-cover" />
                : tecnico.nombre?.charAt(0)
              }
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-white text-xl leading-tight">{tecnico.nombre}</h3>
              <p className="text-emerald-200 text-sm mt-0.5">{tecnico.categoria} · {tecnico.ciudad}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tecnico.verificado ? 'bg-green-400/20 text-green-200 border border-green-400/30' : 'bg-amber-400/20 text-amber-200 border border-amber-400/30'}`}>
                  {tecnico.verificado ? '✓ Verificado' : '⏳ Pendiente'}
                </span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tecnico.activo ? 'bg-blue-400/20 text-blue-200 border border-blue-400/30' : 'bg-red-400/20 text-red-200 border border-red-400/30'}`}>
                  {tecnico.activo ? '● Activo' : '○ Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* ── Información completa ── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Información del técnico</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div><p className="text-xs text-gray-400">Nombre</p><p className="font-semibold text-gray-800">{tecnico.nombre}</p></div>
              <div><p className="text-xs text-gray-400">Teléfono</p><p className="font-semibold text-gray-800">{tecnico.telefono || '—'}</p></div>
              <div className="col-span-2"><p className="text-xs text-gray-400">Email</p><p className="font-semibold text-gray-800 break-all">{tecnico.email}</p></div>
              <div><p className="text-xs text-gray-400">Ciudad</p><p className="font-semibold text-gray-800">{tecnico.ciudad}</p></div>
              <div><p className="text-xs text-gray-400">Especialidad</p><p className="font-semibold text-gray-800">{tecnico.categoria}</p></div>
              <div><p className="text-xs text-gray-400">Experiencia</p><p className="font-semibold text-gray-800">{tecnico.experiencia_anos || 0} años</p></div>
              <div><p className="text-xs text-gray-400">Tarifa visita</p><p className="font-semibold text-gray-800">${(tecnico.tarifa_visita || 50000).toLocaleString('es-CO')} COP</p></div>
              <div><p className="text-xs text-gray-400">Registrado</p><p className="font-semibold text-gray-800">{tecnico.created_at ? new Date(tecnico.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p></div>
              <div><p className="text-xs text-gray-400">ID interno</p><p className="font-mono text-xs text-gray-500 truncate">{tecnico.id}</p></div>
              {tecnico.auth_user_id && <div className="col-span-2"><p className="text-xs text-gray-400">Auth User ID</p><p className="font-mono text-xs text-gray-500 break-all">{tecnico.auth_user_id}</p></div>}
            </div>
          </div>

          {/* ── Descripción ── */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción</p>
            {tecnico.descripcion
              ? <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 leading-relaxed">{tecnico.descripcion}</p>
              : <p className="text-sm text-gray-400 italic">Sin descripción</p>
            }
          </div>

          {/* ── Datos bancarios ── */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Datos bancarios</p>
            {pago ? (
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-gray-400">Banco</p><p className="font-semibold text-gray-800">{pago.banco_nombre || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Tipo</p><p className="font-semibold text-gray-800 capitalize">{pago.tipo_cuenta || '—'}</p></div>
                <div><p className="text-xs text-gray-400">Número</p><p className="font-semibold text-gray-800 font-mono">{pago.numero_cuenta || '—'}</p></div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No ha configurado datos bancarios</p>
            )}
          </div>

          {/* ── Cédula número ── */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-1">Número de cédula</p>
            <p className="text-2xl font-extrabold text-blue-900 font-mono tracking-wider">
              {tecnico.cedula_numero || <span className="text-blue-400 font-normal text-sm">No proporcionado</span>}
            </p>
          </div>

          {/* ── Documentos ── */}
          {!tieneDocumentos && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <p className="text-2xl mb-1">📄</p>
              <p className="text-sm text-amber-700 font-semibold">Este técnico no subió documentos</p>
              <p className="text-xs text-amber-600/70 mt-0.5">Se registró antes de que se requiriera la verificación de cédula.</p>
            </div>
          )}

          {tecnico.cedula_frontal_url && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📷 Cédula — Cara frontal</p>
              <a href={tecnico.cedula_frontal_url} target="_blank" rel="noopener noreferrer">
                <img src={tecnico.cedula_frontal_url} alt="Cédula frontal" className="w-full rounded-2xl border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity" />
              </a>
              <p className="text-xs text-gray-400 text-center mt-1">Click para ver en tamaño completo</p>
            </div>
          )}

          {tecnico.cedula_posterior_url && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📷 Cédula — Cara posterior</p>
              <a href={tecnico.cedula_posterior_url} target="_blank" rel="noopener noreferrer">
                <img src={tecnico.cedula_posterior_url} alt="Cédula posterior" className="w-full rounded-2xl border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity" />
              </a>
            </div>
          )}

          {/* ── Acciones ── */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => { onVerificar(tecnico.id, !tecnico.verificado); onClose() }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                tecnico.verificado
                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {tecnico.verificado ? '✕ Quitar verificación' : '✓ Marcar como verificado'}
            </button>
            <button
              onClick={() => { onActivar(tecnico.id, !tecnico.activo); onClose() }}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                tecnico.activo
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {tecnico.activo ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Técnicos ─────────────────────────────────────────────────────────────────
function TecnicosView({ tecnicos, pagosByTecnico, onVerificar, onActivar }) {
  const [search, setSearch]       = useState('')
  const [filC, setFilC]           = useState('')
  const [filCat, setFilCat]       = useState('')
  const [filV, setFilV]           = useState('')
  const [viewingDocs, setViewDocs] = useState(null)

  const filtered = useMemo(() => tecnicos.filter(t => {
    const q = search.toLowerCase()
    if (q && !t.nombre?.toLowerCase().includes(q) && !t.telefono?.includes(q) && !t.email?.toLowerCase().includes(q)) return false
    if (filC   && t.ciudad    !== filC)   return false
    if (filCat && t.categoria !== filCat) return false
    if (filV === 'si' && !t.verificado)  return false
    if (filV === 'no' &&  t.verificado)  return false
    return true
  }), [tecnicos, search, filC, filCat, filV])

  return (
    <>
      <DocsModal tecnico={viewingDocs} pago={viewingDocs ? pagosByTecnico[viewingDocs.id] : null} onClose={() => setViewDocs(null)} onVerificar={onVerificar} onActivar={onActivar} />
      <div className="p-4 md:p-6 w-full">
        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-extrabold text-gray-900">Técnicos</h2>
          <p className="text-sm text-gray-400 mt-0.5">{filtered.length} de {tecnicos.length} técnicos</p>
        </div>
        <div className="grid grid-cols-2 sm:flex flex-wrap gap-2 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            className="col-span-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:flex-1 sm:min-w-[160px]" />
          <select value={filC} onChange={e => setFilC(e.target.value)} className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Ciudad</option>
            {CIUDADES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filCat} onChange={e => setFilCat(e.target.value)} className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Categoría</option>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filV} onChange={e => setFilV(e.target.value)} className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">Estado</option>
            <option value="si">Verificados</option>
            <option value="no">Por verificar</option>
          </select>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No hay técnicos con esos filtros</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(t => (
              <div key={t.id} className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 ${!t.activo ? 'opacity-50' : ''}`}>
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 overflow-hidden flex items-center justify-center text-emerald-700 font-extrabold text-sm flex-shrink-0">
                    {t.foto_perfil_url ? <img src={t.foto_perfil_url} alt={t.nombre} className="w-full h-full object-cover" /> : t.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm truncate">{t.nombre}</p>
                    <p className="text-xs text-gray-400">{t.categoria} · {t.ciudad}</p>
                    <p className="text-xs text-gray-400">{t.telefono} · {t.experiencia_anos || 0} años exp.</p>
                  </div>
                  {t.verificado
                    ? <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">✓ Verificado</span>
                    : <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">⏳ Pendiente</span>
                  }
                </div>
                {t.cedula_numero && (
                  <p className="text-[10px] text-gray-400 font-mono mb-2">CC: {t.cedula_numero}</p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setViewDocs(t)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold transition-colors flex-1">
                    📄 Ver cédula
                  </button>
                  <button onClick={() => onActivar(t.id, !t.activo)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors flex-1 ${t.activo ? 'border-gray-200 text-gray-500 hover:bg-gray-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}>
                    {t.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [user, setUser]         = useState(null)
  const [authLoading, setAL]    = useState(true)
  const [view, setView]         = useState('dashboard')
  const [solicitudes, setS]     = useState([])
  const [tecnicos, setT]        = useState([])
  const [pagosByTecnico, setPagosByTecnico] = useState({})
  const [clientesDb, setC]      = useState([])
  const [cobros, setCobros]     = useState([])
  const [dataLoading, setDL]    = useState(false)

  const clientes = useMemo(() => {
    const map = {}

    for (const c of clientesDb) {
      const key = c.id || c.email || `db-${c.created_at || ''}-${c.updated_at || ''}`
      map[key] = {
        key,
        id: c.id,
        auth_user_id: c.auth_user_id,
        email: (c.email || '').toLowerCase().trim(),
        nombre: (c.nombre || 'Cliente').trim(),
        telefono: (c.telefono || '').trim(),
        totalSolicitudes: 0,
        solicitudesActivas: 0,
        completadas: 0,
        ultimaActividad: c.updated_at || c.created_at || new Date().toISOString(),
        hasCuenta: Boolean(c.auth_user_id),
      }
    }

    for (const s of solicitudes) {
      const email = (s.cliente_email || '').toLowerCase().trim()
      const telefono = (s.cliente_telefono || '').trim()
      const nombre = (s.cliente_nombre || 'Cliente').trim()
      const existingKey = Object.keys(map).find(k => {
        const c = map[k]
        if (email && c.email && c.email === email) return true
        if (!email && telefono && c.telefono && c.telefono === telefono) return true
        return false
      })
      const key = existingKey || email || telefono || `anon-${nombre.toLowerCase()}`

      if (!map[key]) {
        map[key] = {
          key,
          id: null,
          auth_user_id: null,
          email,
          nombre,
          telefono,
          totalSolicitudes: 0,
          solicitudesActivas: 0,
          completadas: 0,
          ultimaActividad: s.created_at,
          hasCuenta: Boolean(email),
        }
      }

      map[key].totalSolicitudes += 1
      if (s.estado === 'pendiente' || s.estado === 'asignada' || s.estado === 'en_curso') map[key].solicitudesActivas += 1
      if (s.estado === 'completada') map[key].completadas += 1
      if ((s.created_at || '') > (map[key].ultimaActividad || '')) map[key].ultimaActividad = s.created_at
      if (s.cliente_nombre && s.cliente_nombre.length > map[key].nombre.length) map[key].nombre = s.cliente_nombre
      if (s.cliente_telefono) map[key].telefono = s.cliente_telefono
      if (email) map[key].email = email
      map[key].hasCuenta = map[key].hasCuenta || Boolean(email)
    }

    return Object.values(map)
      .sort((a, b) => new Date(b.ultimaActividad) - new Date(a.ultimaActividad))
  }, [solicitudes, clientesDb])

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email === ADMIN_EMAIL) setUser(session.user)
      setAL(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user?.email === ADMIN_EMAIL ? session.user : null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch data
  useEffect(() => {
    if (!user) return
    setDL(true)
    Promise.all([
      supabase.from('solicitudes').select('*').order('created_at', { ascending: false }),
      supabase.from('tecnicos').select('*').order('created_at', { ascending: false }),
      supabase.from('tecnico_pagos').select('*'),
      supabase.from('clientes').select('*').order('updated_at', { ascending: false }),
      supabase.from('cobros').select('*').order('created_at', { ascending: false }),
    ]).then(([{ data: s }, { data: t }, { data: pagos }, { data: c }, { data: co }]) => {
      setS(s || [])
      setT(t || [])
      const byTecnico = (pagos || []).reduce((acc, p) => {
        acc[p.tecnico_id] = p
        return acc
      }, {})
      setPagosByTecnico(byTecnico)
      setC(c || [])
      setCobros(co || [])
      setDL(false)
    })
  }, [user])

  // Actions
  const updateEstado    = async (id, estado) => {
    await supabase.from('solicitudes').update({ estado }).eq('id', id)
    setS(prev => prev.map(s => s.id === id ? { ...s, estado } : s))
  }
  const asignarTecnico  = async (sid, tid) => {
    const upd = { tecnico_id: tid, estado: tid ? 'asignada' : 'pendiente' }
    await supabase.from('solicitudes').update(upd).eq('id', sid)
    setS(prev => prev.map(s => s.id === sid ? { ...s, ...upd } : s))
    // Notificar asignación
    if (tid) {
      const sol  = solicitudes.find(s => s.id === sid)
      const tec  = tecnicos.find(t => t.id === tid)
      if (sol && tec) {
        // Usamos los datos del cliente directamente de la solicitud
        const clienteData = {
          nombre:   sol.cliente_nombre   || null,
          email:    sol.cliente_email    || null,
          telefono: sol.cliente_telefono || null,
        }
        fetch('/api/notify/asignacion', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            solicitud: { ...sol, tipo_servicio: sol.categoria },
            tecnico: tec,
            cliente: clienteData,
          }),
        }).catch(() => {})
      }
    }
  }
  const verificarTecnico = async (id, verificado) => {
    await supabase.from('tecnicos').update({ verificado }).eq('id', id)
    setT(prev => prev.map(t => t.id === id ? { ...t, verificado } : t))
  }
  const activarTecnico  = async (id, activo) => {
    await supabase.from('tecnicos').update({ activo }).eq('id', id)
    setT(prev => prev.map(t => t.id === id ? { ...t, activo } : t))
  }
  const marcarTecnicoPagado = async (id) => {
    await supabase.from('cobros').update({ pagado_tecnico: true, fecha_pago_tecnico: new Date().toISOString() }).eq('id', id)
    setCobros(prev => prev.map(c => c.id === id ? { ...c, pagado_tecnico: true } : c))
    // Notificar pago al técnico
    const cobro = cobros.find(c => c.id === id)
    const tec   = tecnicos.find(t => t.id === cobro?.tecnico_id)
    if (cobro && tec) {
      fetch('/api/notify/pago-tecnico', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tecnico: tec, cobro }),
      }).catch(() => {})
    }
  }
  const logout = async () => { await supabase.auth.signOut(); setUser(null) }

  if (authLoading) return (
    <div className="min-h-screen bg-[#071A14] flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin block" />
    </div>
  )
  if (!user) return <LoginScreen onSuccess={setUser} />

  const pendientesCount = solicitudes.filter(s => s.estado === 'pendiente').length
  const sinVerificarCount = tecnicos.filter(t => !t.verificado).length
  const cobrosCount = cobros.filter(c => c.estado === 'pagado' && !c.pagado_tecnico).length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        view={view} setView={setView}
        pendientes={pendientesCount}
        sinVerificar={sinVerificarCount}
        clientesCount={clientes.length}
        cobrosCount={cobrosCount}
        email={user.email} onLogout={logout}
      />
      {/* Mobile bottom nav */}
      <MobileBottomNav
        view={view} setView={setView}
        pendientes={pendientesCount}
        sinVerificar={sinVerificarCount}
        cobrosCount={cobrosCount}
      />
      {/* pt-14 on mobile: space for fixed header. pb-24 on mobile: space for bottom nav */}
      <main className="flex-1 min-h-screen overflow-auto pt-14 pb-24 md:pt-0 md:pb-0">
        {dataLoading ? (
          <div className="flex items-center justify-center h-64">
            <span className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin block" />
          </div>
        ) : view === 'dashboard' ? (
          <DashboardView solicitudes={solicitudes} tecnicos={tecnicos} clientes={clientes} setView={setView} />
        ) : view === 'solicitudes' ? (
          <SolicitudesView solicitudes={solicitudes} tecnicos={tecnicos} onUpdateEstado={updateEstado} onAsignarTecnico={asignarTecnico} />
        ) : view === 'clientes' ? (
          <ClientesView clientes={clientes} />
        ) : view === 'cobros' ? (
          <CobrosView cobros={cobros} onMarcarPagado={marcarTecnicoPagado} />
        ) : (
          <TecnicosView tecnicos={tecnicos} pagosByTecnico={pagosByTecnico} onVerificar={verificarTecnico} onActivar={activarTecnico} />
        )}
        <PanelFooter role="admin" />
      </main>
    </div>
  )
}
