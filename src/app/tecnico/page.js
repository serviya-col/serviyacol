'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import PanelFooter from '@/components/PanelFooter'
import Logo from '@/components/Logo'

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL

const ESTADO_CFG = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-amber-50  text-amber-700  border border-amber-200'  },
  asignada:   { label: 'Asignada',   cls: 'bg-blue-50   text-blue-700   border border-blue-200'   },
  en_curso:   { label: 'En curso',   cls: 'bg-purple-50 text-purple-700 border border-purple-200' },
  completada: { label: 'Completada', cls: 'bg-green-50  text-green-700  border border-green-200'  },
  cancelada:  { label: 'Cancelada',  cls: 'bg-red-50    text-red-700    border border-red-200'    },
}
const SIGUIENTE_ESTADO = { asignada: 'en_curso', en_curso: 'completada' }
const CAT_ICONS = { Plomería:'🔧', Electricidad:'⚡', Cerrajería:'🔑', Pintura:'🎨', 'Aire acondicionado':'❄️', Jardinería:'🪴', Limpieza:'🧹', Otro:'🛠️' }

// GA4 helper
function trackGA4(event, params = {}) {
  if (typeof window !== 'undefined' && window.gtag) window.gtag('event', event, params)
}

function Badge({ estado }) {
  const cfg = ESTADO_CFG[estado] || { label: estado, cls: 'bg-gray-50 text-gray-600 border border-gray-200' }
  return <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
}

// Badge de tiempo transcurrido
function TiempoChip({ fecha }) {
  const mins = Math.floor((Date.now() - new Date(fecha)) / 60000)
  const label = mins < 60 ? `hace ${mins} min` : `hace ${Math.floor(mins/60)}h`
  const cls = mins < 60
    ? 'bg-emerald-100 text-emerald-700'
    : mins < 120
    ? 'bg-amber-100 text-amber-700'
    : 'bg-red-100 text-red-600'
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls} flex items-center gap-1`}>
      <span className={`w-1.5 h-1.5 rounded-full ${mins < 60 ? 'bg-emerald-400' : mins < 120 ? 'bg-amber-400' : 'bg-red-400'} animate-pulse`} />
      {label}
    </span>
  )
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
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo variant="white" />
          <p className="text-white/40 text-sm mt-2 uppercase tracking-widest font-semibold">Panel de Técnico</p>
        </div>

        <div className="bg-white/8 backdrop-blur-md border border-white/12 rounded-3xl p-7">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Correo electrónico</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="tu@correo.com"
                className="w-full input-dark bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full input-dark bg-white/8 border border-white/15 rounded-xl px-4 py-3 pr-14 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
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
function Sidebar({ view, setView, tecnico, disponiblesCount, cobrosCount, onLogout }) {
  const nav = [
    { id: 'dashboard',   icon: '🏠', label: 'Mi panel'       },
    { id: 'disponibles', icon: '📋', label: 'Disponibles', badge: disponiblesCount },
    { id: 'mias',        icon: '✅', label: 'Mis solicitudes' },
    { id: 'cobros',      icon: '💳', label: 'Mis cobros', badge: cobrosCount },
    { id: 'perfil',      icon: '👤', label: 'Mi perfil'       },
  ]
  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 bg-[#0A1A14] flex-col min-h-screen sticky top-0 flex-shrink-0 border-r border-white/5">
        <div className="px-5 py-5 border-b border-white/8 flex items-center gap-2">
          <Logo variant="white" />
          <span className="text-white/25 text-xs">Técnico</span>
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
function TecnicoBottomNav({ view, setView, disponiblesCount, cobrosCount, verificado }) {
  const tabs = [
    { id: 'dashboard',   icon: '🏠', label: 'Panel'      },
    { id: 'disponibles', icon: '📋', label: 'Disponibles', badge: disponiblesCount },
    { id: 'mias',        icon: '✅', label: 'Trabajos' },
    { id: 'cobros',      icon: '💳', label: 'Cobros',    badge: cobrosCount },
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


// ─── MisCobrosView ─────────────────────────────────────────────────────────────
function MisCobrosView({ cobros, tecnico }) {
  const fmt = (v) => '$' + Number(v || 0).toLocaleString('es-CO')
  const [filtro, setFiltro] = useState('')

  // Guard: solo técnicos verificados
  if (!tecnico?.verificado) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-10">
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-extrabold text-amber-900 mb-2">Verificación pendiente</h2>
          <p className="text-sm text-amber-700 leading-relaxed">
            El control de pagos y la generación de links Bold están disponibles
            <strong> solo para técnicos verificados</strong> con todos sus documentos aprobados.
          </p>
          <p className="text-xs text-amber-600 mt-3 bg-amber-100 rounded-xl p-3">
            💬 El equipo de ServiYa revisará tu perfil y te notificará por WhatsApp o email cuando estés activo.
          </p>
        </div>
      </div>
    )
  }

  const pagados    = cobros.filter(c => c.estado === 'pagado')
  const pendientes = cobros.filter(c => c.estado === 'pendiente')
  const fallidos   = cobros.filter(c => c.estado === 'fallido')

  const totalGanado    = pagados.reduce((s, c) => s + (c.valor_tecnico || 0), 0)
  const totalPendiente = pendientes.reduce((s, c) => s + (c.valor_tecnico || 0), 0)
  const totalRecibido  = pagados.filter(c => c.pagado_tecnico).reduce((s, c) => s + (c.valor_tecnico || 0), 0)
  const porRecibir     = pagados.filter(c => !c.pagado_tecnico).reduce((s, c) => s + (c.valor_tecnico || 0), 0)

  const ESTADO_C = {
    pendiente:   { label: 'Pendiente de pago', cls: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400',  pulse: true  },
    pagado:      { label: 'Pago confirmado',   cls: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-400',  pulse: false },
    fallido:     { label: 'Pago fallido',      cls: 'bg-red-50   text-red-700   border-red-200',     dot: 'bg-red-400',    pulse: false },
    reembolsado: { label: 'Reembolsado',       cls: 'bg-purple-50 text-purple-700 border-purple-200',dot: 'bg-purple-400', pulse: false },
  }

  const TABS = [
    { key: '',          label: 'Todos',      count: cobros.length    },
    { key: 'pendiente', label: 'Pendientes', count: pendientes.length },
    { key: 'pagado',    label: 'Pagados',    count: pagados.length   },
    { key: 'fallido',   label: 'Fallidos',   count: fallidos.length  },
  ]

  const filtrados = filtro ? cobros.filter(c => c.estado === filtro) : cobros

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold text-gray-900">Mis cobros</h2>
        <p className="text-sm text-gray-400 mt-0.5">Historial de pagos de tus servicios (ya descontada comisión 15%)</p>
      </div>

      {/* KPIs financieros */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-emerald-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💰</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-100">Total ganado</span>
          </div>
          <div className="text-2xl font-extrabold">{fmt(totalGanado)}</div>
          <div className="text-[10px] text-emerald-200 mt-0.5">{pagados.length} servicios cobrados</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">⏳</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Pendiente</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{fmt(totalPendiente)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{pendientes.length} link(s) sin pagar</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">✅</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Ya recibiste</span>
          </div>
          <div className="text-2xl font-extrabold text-blue-600">{fmt(totalRecibido)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">{pagados.filter(c => c.pagado_tecnico).length} transferidos</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🟡</span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Por recibir</span>
          </div>
          <div className="text-2xl font-extrabold text-gray-700">{fmt(porRecibir)}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">ServiYa te transferirá pronto</div>
        </div>
      </div>

      {/* Info comisión */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
        <span className="text-xl flex-shrink-0">🏦</span>
        <div>
          <p className="text-xs font-bold text-blue-800">Los montos ya incluyen el descuento del 15% de comisión ServiYa</p>
          <p className="text-xs text-blue-600/80 mt-0.5">Lo que ves en "Tú recibes" es exactamente lo que te transferimos.</p>
        </div>
      </div>

      {/* Tabs filtro */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setFiltro(tab.key)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
              filtro === tab.key
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
            }`}
          >
            {tab.label} <span className={`ml-1 ${filtro === tab.key ? 'text-white/70' : 'text-gray-400'}`}>({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="text-4xl mb-3">💳</div>
          <p className="font-semibold text-gray-500">
            {cobros.length === 0 ? 'Aún no has generado cobros' : 'No hay cobros con este filtro'}
          </p>
          {cobros.length === 0 && (
            <p className="text-xs text-gray-400 mt-2 px-6">
              Cuando completes un servicio, usa el botón "💳 Cobrar" para generar tu link de pago Bold
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(c => {
            const cfg = ESTADO_C[c.estado] || { label: c.estado, cls: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400', pulse: false }
            const minsDesde = Math.floor((Date.now() - new Date(c.created_at)) / 60000)
            const tiempoLabel = minsDesde < 60 ? `hace ${minsDesde} min` : minsDesde < 1440 ? `hace ${Math.floor(minsDesde/60)}h` : `hace ${Math.floor(minsDesde/1440)}d`
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 text-sm">{c.cliente_nombre}</p>
                    <p className="text-xs text-gray-400">{c.cliente_telefono}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
                      {cfg.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{tiempoLabel}</span>
                  </div>
                </div>
                {c.descripcion && <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{c.descripcion}</p>}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-gray-400">Cliente pagó</p>
                    <p className="text-sm font-extrabold text-gray-700">{fmt(c.valor_total)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-emerald-500">Tú recibes</p>
                    <p className="text-sm font-extrabold text-emerald-700">{fmt(c.valor_tecnico)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {c.estado === 'pagado' && (
                    c.pagado_tecnico
                      ? <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">✓ Transferencia recibida</span>
                      : <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Pago confirmado · ServiYa te transferirá pronto
                        </span>
                  )}
                  {c.estado === 'pendiente' && c.bold_link && (
                    <a href={c.bold_link} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:underline">🔗 Ver link de pago</a>
                  )}
                  {c.estado === 'fallido' && (
                    <span className="text-[10px] font-semibold text-red-600">⚠️ El pago fue rechazado</span>
                  )}
                </div>
                {c.referencia && <p className="text-[10px] text-gray-300 mt-2 font-mono truncate">{c.referencia}</p>}
              </div>
            )
          })}
        </div>
      )}

      {/* CTA nuevo cobro */}
      <div className="mt-6">
        <a href="/tecnico/cobrar"
          className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-emerald-900/20">
          💳 Generar nuevo cobro
        </a>
      </div>
    </div>
  )
}

// ─── Widget de Disponibilidad ────────────────────────────────────────────────
const DISPON_OPTS = [
  {
    value: 'disponible',
    emoji: '🟢',
    label: 'Disponible',
    desc: 'Aparezco en búsquedas de clientes',
    ringCls: 'ring-emerald-400',
    activeCls: 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30',
    inactiveCls: 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300',
  },
  {
    value: 'ocupado',
    emoji: '🟡',
    label: 'Ocupado',
    desc: 'Estoy en un trabajo en este momento',
    ringCls: 'ring-amber-400',
    activeCls: 'bg-amber-500 text-white shadow-lg shadow-amber-900/30',
    inactiveCls: 'bg-white border border-gray-200 text-gray-600 hover:border-amber-300',
  },
  {
    value: 'fuera_de_servicio',
    emoji: '🔴',
    label: 'No disponible',
    desc: 'No recibiré solicitudes por hoy',
    ringCls: 'ring-red-400',
    activeCls: 'bg-red-500 text-white shadow-lg shadow-red-900/30',
    inactiveCls: 'bg-white border border-gray-200 text-gray-600 hover:border-red-300',
  },
]

function DisponibilidadWidget({ disponibilidad, onChange, saving }) {
  const current = DISPON_OPTS.find(o => o.value === disponibilidad) || DISPON_OPTS[0]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-gray-800">Mi disponibilidad</p>
          <p className="text-xs text-gray-400 mt-0.5">Los clientes ven tu estado en tiempo real</p>
        </div>
        {saving && (
          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin block" />
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {DISPON_OPTS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
              disponibilidad === opt.value
                ? `${opt.activeCls} ring-2 ${opt.ringCls} ring-offset-1`
                : opt.inactiveCls
            }`}
          >
            <span className="text-xl">{opt.emoji}</span>
            <span className="text-xs font-bold leading-tight text-center">{opt.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center mt-3 italic">
        {current.desc}
      </p>
    </div>
  )
}

// ─── Dashboard Técnico ────────────────────────────────────────────────────────
function DashboardView({ tecnico, misSolicitudes, disponiblesCount, setView, onChangeDisponibilidad, savingDispon }) {
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
      {/* ── Widget de disponibilidad ── */}
      <DisponibilidadWidget
        disponibilidad={tecnico.disponibilidad || 'disponible'}
        onChange={onChangeDisponibilidad}
        saving={savingDispon}
      />
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

// ─── Solicitudes disponibles ─────────────────────────────────────────────────────
function DisponiblesView({ disponibles, onAceptar }) {
  const [confirmModal, setConfirmModal] = useState(null) // solicitud a confirmar
  const [accepting, setAccepting]       = useState(false)

  const handleConfirm = async () => {
    if (!confirmModal) return
    setAccepting(true)
    await onAceptar(confirmModal.id)
    // GA4: técnico acepta trabajo
    trackGA4('add_to_cart', {
      currency: 'COP',
      items: [{ item_name: confirmModal.categoria, item_category: confirmModal.ciudad }],
    })
    setAccepting(false)
    setConfirmModal(null)
  }

  return (
    <div className="p-4 md:p-6">
      {/* Modal de confirmación */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">{CAT_ICONS[confirmModal.categoria] || '🛠️'}</div>
              <h3 className="text-lg font-extrabold text-gray-900">Aceptar esta solicitud</h3>
              <p className="text-sm text-gray-500 mt-1">Confirma que puedes atender este servicio</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Servicio</span>
                <span className="font-bold text-gray-800">{confirmModal.categoria}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ciudad</span>
                <span className="font-bold text-gray-800">{confirmModal.ciudad}</span>
              </div>
              {confirmModal.direccion && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Dirección</span>
                  <span className="font-bold text-gray-800 text-right max-w-[60%]">{confirmModal.direccion}</span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed">{confirmModal.descripcion}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmModal(null)}
                className="py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all">
                Cancelar
              </button>
              <button onClick={handleConfirm} disabled={accepting}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all disabled:opacity-60 active:scale-95">
                {accepting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Aceptando...
                  </span>
                ) : '✓ Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-gray-900">Solicitudes disponibles</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {disponibles.length > 0
            ? `${disponibles.length} solicitud${disponibles.length > 1 ? 'es' : ''} esperando en tu ciudad`
            : 'Solicitudes pendientes en tu ciudad'}
        </p>
      </div>

      {disponibles.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-gray-500 font-medium">No hay solicitudes disponibles en tu ciudad por ahora.</p>
          <p className="text-sm text-gray-400 mt-1">Te notificaremos cuando llegue una nueva.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disponibles.map(s => {
            const minsEspera = Math.floor((Date.now() - new Date(s.created_at)) / 60000)
            const esUrgente  = minsEspera > 120
            return (
              <div key={s.id}
                className={`bg-white rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all ${
                  esUrgente ? 'border-red-200' : 'border-gray-100'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {CAT_ICONS[s.categoria] || '🛠️'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{s.categoria}</p>
                      <p className="text-xs text-gray-400">{s.ciudad}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <TiempoChip fecha={s.created_at} />
                    {esUrgente && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">⚠ URGENTE</span>
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-3">{s.descripcion}</p>

                {/* Detalles */}
                {s.direccion && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                    <span>📍</span>
                    <span>{s.direccion}</span>
                  </div>
                )}

                {/* Botón aceptar */}
                <button onClick={() => setConfirmModal(s)}
                  className={`w-full text-white text-sm font-bold py-3 rounded-xl transition-all active:scale-95 ${
                    esUrgente
                      ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {esUrgente ? '🚨 Aceptar urgente ✓' : 'Aceptar solicitud ✓'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Mis solicitudes ─────────────────────────────────────────────────────────────────
function MiasSolicitudesView({ solicitudes, onUpdateEstado }) {
  const [confirmComplete, setConfirmComplete] = useState(null)

  const TIMELINE = ['asignada', 'en_curso', 'completada']
  const TIMELINE_CFG = {
    asignada:   { icon: '📋', label: 'Asignada'    },
    en_curso:   { icon: '▶️',  label: 'En camino'   },
    completada: { icon: '✅',  label: 'Completada'  },
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-extrabold text-gray-900">Mis solicitudes</h2>
        <p className="text-sm text-gray-400 mt-0.5">Solicitudes que has aceptado</p>
      </div>

      {/* Modal confirmación "Completada" */}
      {confirmComplete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmComplete(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-lg font-extrabold text-gray-900">¿Marcar como completada?</h3>
              <p className="text-sm text-gray-500 mt-1">Confirma que el servicio fue realizado exitosamente</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5">
              <p className="text-sm font-bold text-emerald-800 mb-1">{confirmComplete.categoria} — {confirmComplete.ciudad}</p>
              <p className="text-xs text-emerald-700/70">{confirmComplete.descripcion?.slice(0, 80)}...</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmComplete(null)}
                className="py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={async () => {
                await onUpdateEstado(confirmComplete.id, 'completada')
                // GA4: servicio completado
                trackGA4('purchase', {
                  currency: 'COP',
                  items: [{ item_name: confirmComplete.categoria, item_category: confirmComplete.ciudad }],
                })
                setConfirmComplete(null)
              }}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all active:scale-95">
                ✓ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {solicitudes.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📫</div>
          <p className="text-gray-500 font-medium">Aún no has aceptado ninguna solicitud.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitudes.map(s => {
            const siguiente = SIGUIENTE_ESTADO[s.estado]
            const timelineStep = TIMELINE.indexOf(s.estado)

            return (
              <div key={s.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${
                s.estado === 'completada' ? 'border-green-100 opacity-80' : 'border-gray-100'
              }`}>

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {CAT_ICONS[s.categoria] || '🛠️'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{s.categoria}</p>
                      <p className="text-xs text-gray-400">{s.ciudad}</p>
                    </div>
                  </div>
                  <Badge estado={s.estado} />
                </div>

                {/* Timeline visual */}
                {s.estado !== 'cancelada' && (
                  <div className="flex items-center gap-0 mb-4 mt-1">
                    {TIMELINE.map((step, i) => {
                      const done    = i <= timelineStep
                      const current = i === timelineStep && s.estado !== 'completada'
                      return (
                        <>
                          <div key={step} className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              done ? 'bg-emerald-500 text-white shadow-md shadow-emerald-300/40' : 'bg-gray-100 text-gray-400'
                            } ${current ? 'ring-2 ring-emerald-300 ring-offset-1' : ''}`}>
                              {done ? (TIMELINE_CFG[step].icon) : (i+1)}
                            </div>
                            <span className={`text-[9px] mt-1 font-semibold ${done ? 'text-emerald-600' : 'text-gray-300'}`}>
                              {TIMELINE_CFG[step].label}
                            </span>
                          </div>
                          {i < TIMELINE.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-3 mx-1 transition-all ${i < timelineStep ? 'bg-emerald-400' : 'bg-gray-100'}`} />
                          )}
                        </>
                      )
                    })}
                  </div>
                )}

                {/* Descripción */}
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{s.descripcion}</p>

                {/* Cliente info */}
                <div className="bg-gray-50 rounded-xl p-3 mb-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                    {s.cliente_nombre?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{s.cliente_nombre}</p>
                    <a href={`tel:${s.cliente_telefono}`} className="text-sm text-emerald-600 font-bold hover:underline">{s.cliente_telefono}</a>
                  </div>
                  <a href={`https://wa.me/57${s.cliente_telefono}?text=Hola ${s.cliente_nombre}, soy tu técnico de ServiYa para ${s.categoria}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold px-3 py-2 rounded-xl transition-all flex-shrink-0">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                </div>

                {/* Acción de estado */}
                {siguiente && s.estado !== 'cancelada' && (
                  <button
                    onClick={() => siguiente === 'completada'
                      ? setConfirmComplete(s)
                      : onUpdateEstado(s.id, siguiente)
                    }
                    className={`w-full text-sm font-bold py-3 rounded-xl transition-all active:scale-95 ${
                      siguiente === 'en_curso'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                    }`}
                  >
                    {siguiente === 'en_curso' ? '▶ Estoy en camino' : '✅ Marcar como completada'}
                  </button>
                )}

                {s.estado === 'completada' && (
                  <div className="text-center py-2">
                    <p className="text-sm font-bold text-emerald-600">🎉 Servicio completado</p>
                    <Link href="/tecnico/cobrar" className="text-xs text-emerald-500 hover:underline mt-0.5 block">Cobrar este servicio →</Link>
                  </div>
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
// ─── Profile Completion Gate ────────────────────────────────────────────────────
function ProfileCompletionGate({ tecnico, pago, onDone, onUpdatePerfil, onUpdatePago }) {
  const hasFoto    = Boolean(tecnico.foto_perfil_url)
  const hasBanco   = Boolean(pago?.banco_nombre && pago?.tipo_cuenta && pago?.numero_cuenta)
  const completedCount = [hasFoto, hasBanco].filter(Boolean).length

  // Local state
  const [gateStep, setGateStep] = useState(hasFoto ? 1 : 0) // 0=foto, 1=banco
  const [fotoPerfil, setFotoPerfil]   = useState(tecnico.foto_perfil_url || '')
  const [bancoNombre, setBancoNombre] = useState(pago?.banco_nombre || '')
  const [tipoCuenta, setTipoCuenta]   = useState(pago?.tipo_cuenta || '')
  const [numeroCuenta, setNumeroCuenta] = useState(pago?.numero_cuenta || '')
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [savingBanco, setSavingBanco]     = useState(false)
  const [savedBanco, setSavedBanco]       = useState(false)
  const [errorBanco, setErrorBanco]       = useState('')

  const onUploadFoto = async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) { alert('La imagen debe pesar menos de 2 MB.'); return }
    setUploadingFoto(true)
    const ext  = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `perfiles/${tecnico.id}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('documentos-tecnicos').upload(path, file, { cacheControl: '3600', upsert: true })
    if (!uploadErr) {
      const { data } = supabase.storage.from('documentos-tecnicos').getPublicUrl(path)
      setFotoPerfil(data.publicUrl)
      await onUpdatePerfil({ foto_perfil_url: data.publicUrl })
    }
    setUploadingFoto(false)
  }

  const saveBanco = async (e) => {
    e.preventDefault()
    setErrorBanco('')
    if (!bancoNombre || !tipoCuenta || !numeroCuenta) {
      setErrorBanco('Por favor completa todos los campos bancarios.')
      return
    }
    setSavingBanco(true)
    const { error } = await onUpdatePago({ banco_nombre: bancoNombre.trim(), tipo_cuenta: tipoCuenta, numero_cuenta: numeroCuenta.trim() }) || {}
    setSavingBanco(false)
    
    if (error) {
      setErrorBanco('Error al guardar. Verifica que los datos sean correctos.')
      return
    }
    
    setSavedBanco(true)
    setTimeout(() => onDone(), 800)
  }

  const steps = [
    { id: 0, label: 'Foto de perfil',    done: hasFoto || Boolean(fotoPerfil), icon: '📸' },
    { id: 1, label: 'Datos bancarios',   done: hasBanco || savedBanco,          icon: '🏦' },
  ]
  const allDone = steps.every(s => s.done)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071A14] to-[#0A3D2E] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 items-center justify-center text-3xl mb-4">
            🧑‍🔧
          </div>
          <h1 className="text-2xl font-extrabold text-white">Completa tu perfil</h1>
          <p className="text-white/50 text-sm mt-1">Necesitamos estos datos antes de activar tu cuenta</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6 bg-white/5 rounded-2xl px-5 py-4">
          {steps.map((s, i) => (
            <>
              <button
                key={s.id}
                onClick={() => setGateStep(s.id)}
                className={`flex items-center gap-2 text-sm font-semibold transition-all ${
                  s.done ? 'text-emerald-400' : gateStep === s.id ? 'text-white' : 'text-white/30'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  s.done ? 'bg-emerald-500 text-white' : gateStep === s.id ? 'bg-white text-gray-900' : 'bg-white/10 text-white/40'
                }`}>
                  {s.done ? '✓' : i + 1}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full ${steps[i].done ? 'bg-emerald-500' : 'bg-white/10'}`} />
              )}
            </>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">

          {/* Step 0: Foto */}
          {gateStep === 0 && (
            <div className="animate-fade-in">
              <h2 className="text-lg font-extrabold text-gray-900 mb-1">📸 Tu foto de perfil</h2>
              <p className="text-sm text-gray-500 mb-5">Los clientes ven tu foto antes de elegirte. Una foto real genera más confianza.</p>

              {/* Preview */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-emerald-50 border-2 border-dashed border-emerald-200 flex items-center justify-center">
                    {fotoPerfil
                      ? <img src={fotoPerfil} alt="Foto" className="w-full h-full object-cover" />
                      : <span className="text-4xl">{tecnico.nombre?.charAt(0) || '?'}</span>
                    }
                  </div>
                  {uploadingFoto && (
                    <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center">
                      <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin block" />
                    </div>
                  )}
                </div>
              </div>

              <label className="block w-full cursor-pointer">
                <div className="w-full border-2 border-dashed border-gray-200 hover:border-emerald-400 rounded-2xl py-5 text-center transition-all">
                  <div className="text-2xl mb-1">📷</div>
                  <p className="text-sm font-semibold text-gray-700">Sube tu foto de perfil</p>
                  <p className="text-xs text-gray-400 mt-0.5">JPG, PNG o WEBP · Máx. 2 MB</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={e => onUploadFoto(e.target.files?.[0])} />
              </label>

              <button
                type="button"
                disabled={!fotoPerfil || uploadingFoto}
                onClick={() => setGateStep(1)}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all"
              >
                {fotoPerfil ? 'Continuar a datos bancarios →' : 'Primero sube tu foto'}
              </button>
              {!fotoPerfil && (
                <p className="text-xs text-center text-gray-400 mt-2">La foto es obligatoria para que los clientes te reconozcan.</p>
              )}
            </div>
          )}

          {/* Step 1: Banco */}
          {gateStep === 1 && (
            <form onSubmit={saveBanco} className="animate-fade-in space-y-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 mb-1">🏦 Datos de pago</h2>
                <p className="text-sm text-gray-500">Aquí recibirás tus pagos al completar cada servicio.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Banco</label>
                <select value={bancoNombre} onChange={e => setBancoNombre(e.target.value)} required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Selecciona tu banco</option>
                  {['Bancolombia','Davivienda','Banco de Bogotá','Banco Popular','BBVA','Scotiabank Colpatria','Banco Agrario','Nequi','Daviplata','Lulo Bank','Nubank','Banco Serfinanza','Otro'].map(b => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de cuenta</label>
                  <select value={tipoCuenta} onChange={e => setTipoCuenta(e.target.value)} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Tipo</option>
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Número de cuenta</label>
                  <input value={numeroCuenta} onChange={e => setNumeroCuenta(e.target.value)} required
                    placeholder="0000000000" type="text" inputMode="numeric"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>

              {errorBanco && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{errorBanco}</p>}

              {savedBanco ? (
                <div className="text-center py-3">
                  <div className="text-2xl mb-1">🎉</div>
                  <p className="font-bold text-emerald-700">¡Perfil completo! Entrando al panel...</p>
                </div>
              ) : (
                <button type="submit" disabled={savingBanco}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all">
                  {savingBanco ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                      Guardando...
                    </span>
                  ) : '✅ Guardar y entrar al panel'}
                </button>
              )}
              <button type="button" onClick={() => setGateStep(0)}
                className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1">← Atrás</button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-white/30 mt-5">
          Estos datos son privados y seguros. Solo los usa ServiYa para pagarte.
        </p>
      </div>
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
  const [misCobros, setMisCobros] = useState([])

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
      supabase.from('cobros').select('*')
        .eq('tecnico_id', tecnico.id)
        .order('created_at', { ascending: false }),
    ]).then(([{ data: d }, { data: m }, { data: cb }]) => {
      setDisp(d || [])
      setMisSols(m || [])
      setMisCobros(cb || [])
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
      if (accepted) {
        setMisSols(prev => [{ ...accepted, tecnico_id: tecnico.id, estado: 'asignada' }, ...prev])
        // Notificar al cliente que se le asignó un técnico
        fetch('/api/notify/asignacion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            solicitud: { ...accepted, tipo_servicio: accepted.categoria },
            tecnico: { nombre: tecnico.nombre, email: tecnico.email, telefono: tecnico.telefono, categoria: tecnico.categoria, ciudad: tecnico.ciudad },
            cliente: { nombre: accepted.cliente_nombre || null, email: accepted.cliente_email || null, telefono: accepted.cliente_telefono || null },
          }),
        }).catch(() => {})
      }
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

  const [savingDispon, setSavingDispon] = useState(false)
  const [profileGatePassed, setProfileGatePassed] = useState(false)
  const updateDisponibilidad = async (valor) => {
    if (valor === tecnico?.disponibilidad) return
    setSavingDispon(true)
    setTecnico(prev => ({ ...prev, disponibilidad: valor })) // optimistic update
    await supabase.from('tecnicos').update({ disponibilidad: valor }).eq('id', tecnico.id).eq('auth_user_id', user.id)
    setSavingDispon(false)
  }

  const updatePago = async (campos) => {
    if (!campos.banco_nombre || !campos.tipo_cuenta || !campos.numero_cuenta) return { error: { message: 'Campos incompletos' } }
    
    // Convert to lowercase to be standard, but preserve the exact type (nequi, daviplata, ahorros, corriente)
    const tc = campos.tipo_cuenta.toLowerCase()

    const payload = { tecnico_id: tecnico.id, ...campos, tipo_cuenta: tc }
    const { error } = await supabase.from('tecnico_pagos').upsert(payload, { onConflict: 'tecnico_id' })
    
    if (error) {
      console.error('Supabase upsert error:', error)
      return { error }
    }
    
    setPago(prev => ({ ...(prev || { tecnico_id: tecnico.id }), ...campos }))
    return { error: null }
  }

  const logout = async () => { await supabase.auth.signOut(); setUser(null); setTecnico(null); setPago(null) }

  if (authLoading) return (
    <div className="min-h-screen bg-[#071A14] flex items-center justify-center">
      <span className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin block" />
    </div>
  )
  if (!user || !tecnico) return <LoginScreen onSuccess={onLogin} />

  // ─ Gate: perfil incompleto ─
  const perfilCompleto = profileGatePassed ||
    (Boolean(tecnico.foto_perfil_url) && Boolean(pago?.banco_nombre && pago?.tipo_cuenta && pago?.numero_cuenta))
  if (!perfilCompleto) {
    return (
      <ProfileCompletionGate
        tecnico={tecnico}
        pago={pago}
        onUpdatePerfil={updatePerfil}
        onUpdatePago={updatePago}
        onDone={() => setProfileGatePassed(true)}
      />
    )
  }

  const cobrosCount = misCobros.filter(c => c.estado === 'pendiente').length

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar view={view} setView={setView} tecnico={tecnico} disponiblesCount={disponibles.length} cobrosCount={cobrosCount} onLogout={logout} />
      {/* Mobile bottom nav */}
      <TecnicoBottomNav view={view} setView={setView} disponiblesCount={disponibles.length} cobrosCount={cobrosCount} verificado={tecnico?.verificado} />
      {/* Floating Cobrar button — mobile only, solo verificados */}
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
        {view === 'dashboard'   && <DashboardView tecnico={tecnico} misSolicitudes={misSols} disponiblesCount={disponibles.length} setView={setView} onChangeDisponibilidad={updateDisponibilidad} savingDispon={savingDispon} />}
        {view === 'disponibles' && <DisponiblesView disponibles={disponibles} onAceptar={aceptar} />}
        {view === 'mias'        && <MiasSolicitudesView solicitudes={misSols} onUpdateEstado={updateEstado} />}
        {view === 'cobros'      && <MisCobrosView cobros={misCobros} tecnico={tecnico} />}
        {view === 'perfil'      && <PerfilView tecnico={tecnico} pago={pago} onUpdatePerfil={updatePerfil} onUpdatePago={updatePago} />}
        <PanelFooter role="tecnico" />
      </main>
    </div>
  )
}
