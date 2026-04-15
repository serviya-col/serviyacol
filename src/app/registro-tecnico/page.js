'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const CIUDADES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
  'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué', 'Neiva',
  'Villavicencio', 'Pasto',
]

const CATEGORIAS = [
  'Plomería', 'Electricidad', 'Cerrajería', 'Pintura',
  'Aire acondicionado', 'Jardinería', 'Limpieza', 'Otro',
]

const BENEFICIOS = [
  { icon: '💰', title: 'Más clientes garantizados',  desc: 'Recibe solicitudes de clientes verificados en tu ciudad.' },
  { icon: '⭐', title: 'Construye tu reputación',    desc: 'Acumula reseñas y aumenta tu tarifa con el tiempo.'        },
  { icon: '📱', title: 'Solicitudes por WhatsApp',   desc: 'Te contactamos directo al celular. Sin apps complicadas.'  },
  { icon: '🔒', title: 'Pagos seguros',              desc: 'Recibe tu dinero protegido directamente en tu cuenta.'     },
]

export default function RegistroTecnico() {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: '', telefono: '', email: '', password: '', confirmar_password: '',
    ciudad: '', categoria: '', experiencia_anos: '', descripcion: '',
    tarifa_visita: '50000', cedula_numero: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const [showPass, setShowPass] = useState(false)
  const [step, setStep]        = useState(0) // 0=idle, 1=creando cuenta, 2=subiendo docs, 3=guardando perfil
  const [cedulaFrontal, setCedulaFrontal]       = useState(null) // File object
  const [cedulaPosterior, setCedulaPosterior]   = useState(null) // File object
  const [previewFrontal, setPreviewFrontal]     = useState(null)
  const [previewPosterior, setPreviewPosterior] = useState(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validaciones
    if (!form.nombre || !form.telefono || !form.email || !form.password || !form.ciudad || !form.categoria) {
      setError('Por favor completa todos los campos obligatorios (*).')
      return
    }
    if (!form.cedula_numero) {
      setError('Debes ingresar tu número de cédula para verificación.')
      return
    }
    if (!cedulaFrontal) {
      setError('Debes subir una foto de la parte frontal de tu cédula.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres.')
      return
    }
    if (form.password !== form.confirmar_password) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    setStep(1)

    // Paso 1: Crear cuenta en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre: form.nombre,
          role: 'tecnico',
        },
      },
    })

    if (authError) {
      setLoading(false)
      setStep(0)
      if (authError.message.includes('already registered') || authError.message.includes('User already registered')) {
        setError('Este correo ya tiene una cuenta. ¿Ya eres técnico? Ingresa aquí → /tecnico')
      } else {
        setError('Error al crear la cuenta: ' + authError.message)
      }
      return
    }

    if (!authData.user) {
      setLoading(false)
      setStep(0)
      setError('Revisa tu correo para confirmar tu cuenta y luego inicia sesión en /tecnico.')
      return
    }

    setStep(2)

    // Si email confirmation está habilitado, el usuario puede no tener sesión aun.
    // Hacemos signIn inmediato para obtener sesión válida antes del INSERT.
    if (!authData.session) {
      await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    }

    // Paso 2: Subir documentos a Supabase Storage
    setStep(3)
    let cedula_frontal_url = null
    let cedula_posterior_url = null
    const uid = authData.user.id

    if (cedulaFrontal) {
      const ext = cedulaFrontal.name.split('.').pop().toLowerCase()
      const path = `${uid}/cedula_frontal.${ext}`
      const { error: upErr } = await supabase.storage
        .from('documentos-tecnicos')
        .upload(path, cedulaFrontal, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('documentos-tecnicos').getPublicUrl(path)
        cedula_frontal_url = urlData.publicUrl
      }
    }

    if (cedulaPosterior) {
      const ext = cedulaPosterior.name.split('.').pop().toLowerCase()
      const path = `${uid}/cedula_posterior.${ext}`
      const { error: upErr } = await supabase.storage
        .from('documentos-tecnicos')
        .upload(path, cedulaPosterior, { upsert: true })
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('documentos-tecnicos').getPublicUrl(path)
        cedula_posterior_url = urlData.publicUrl
      }
    }

    // Paso 3: Guardar perfil en tabla tecnicos
    const { error: dbError } = await supabase.from('tecnicos').insert([{
      nombre:               form.nombre,
      telefono:             form.telefono,
      email:                form.email,
      ciudad:               form.ciudad,
      categoria:            form.categoria,
      experiencia_anos:     parseInt(form.experiencia_anos) || 0,
      descripcion:          form.descripcion || null,
      tarifa_visita:        parseInt(form.tarifa_visita) || 50000,
      auth_user_id:         uid,
      cedula_numero:        form.cedula_numero || null,
      cedula_frontal_url,
      cedula_posterior_url,
    }])

    setLoading(false)
    setStep(0)

    if (dbError) {
      setError('Tu cuenta fue creada pero hubo un error guardando el perfil: ' + dbError.message)
      return
    }

    // Éxito — redirigir al panel de técnico
    setSuccess(true)
    setTimeout(() => router.push('/tecnico'), 2500)
  }

  /* ── Progreso ── */
  const stepLabel =
    step === 1 ? 'Creando tu cuenta...' :
    step === 2 ? 'Iniciando sesión...' :
    step === 3 ? 'Subiendo documentos...' : ''

  /* ── Success ── */
  if (success) {
    return (
      <>
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="text-6xl mb-5 animate-bounce-soft">🎉</div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">¡Cuenta creada con éxito!</h1>
          <p className="text-gray-500 mb-3">
            Tu perfil está en revisión. En cuanto el equipo ServiYa te verifique,
            recibirás solicitudes de clientes.
          </p>
          <p className="text-sm text-brand font-semibold">Redirigiendo a tu panel...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#071A14] to-[#0A6E55] text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block bg-white/10 border border-white/20 text-emerald-300 text-xs font-bold px-4 py-2 rounded-full mb-5">
            Para técnicos y profesionales
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            Únete a +8.400 técnicos<br />
            <span className="text-emerald-300">que ya generan más ingresos</span>
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-10">
            Crea tu cuenta gratis. Sin cuota mensual. Sin comisión hasta que cierres tu primer servicio.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {BENEFICIOS.map((b) => (
              <div key={b.title} className="bg-white/10 border border-white/15 rounded-2xl p-4 text-center">
                <div className="text-3xl mb-2">{b.icon}</div>
                <p className="text-xs font-bold text-white mb-1">{b.title}</p>
                <p className="text-xs text-white/50 leading-tight">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Formulario ── */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-xl font-extrabold text-gray-900">Crea tu cuenta de técnico</h2>
          <p className="text-gray-500 text-sm mt-1">
            Solo toma 2 minutos. Podrás ingresar a tu panel inmediatamente.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Datos personales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre completo *</label>
              <input id="tecnico-nombre" name="nombre" value={form.nombre} onChange={handleChange}
                required placeholder="Ej: Carlos Ríos Mora"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono / WhatsApp *</label>
              <input id="tecnico-telefono" name="telefono" value={form.telefono} onChange={handleChange}
                required placeholder="Ej: 3001234567"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
              />
            </div>
          </div>

          {/* Credenciales */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-4 border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Credenciales para tu panel</p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico *</label>
              <input id="tecnico-email" name="email" type="email" value={form.email} onChange={handleChange}
                required placeholder="correo@ejemplo.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
              />
              <p className="text-xs text-gray-400 mt-1">Lo usarás para ingresar a tu panel de técnico.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña *</label>
                <div className="relative">
                  <input id="tecnico-password" name="password" type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={handleChange} required placeholder="Mínimo 6 caracteres"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-16 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-brand"
                  >
                    {showPass ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar contraseña *</label>
                <input id="tecnico-confirmar" name="confirmar_password" type="password"
                  value={form.confirmar_password} onChange={handleChange} required placeholder="Repite tu contraseña"
                  className={`w-full border rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand transition-shadow ${
                    form.confirmar_password && form.password !== form.confirmar_password
                      ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Ciudad + Especialidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ciudad *</label>
              <select id="tecnico-ciudad" name="ciudad" value={form.ciudad} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Selecciona tu ciudad</option>
                {CIUDADES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Especialidad *</label>
              <select id="tecnico-categoria" name="categoria" value={form.categoria} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="">Selecciona tu especialidad</option>
                {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Experiencia + Tarifa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Años de experiencia</label>
              <input id="tecnico-experiencia" name="experiencia_anos" type="number" min="0" max="50"
                value={form.experiencia_anos} onChange={handleChange} placeholder="Ej: 5"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tarifa de visita (COP)</label>
              <input id="tecnico-tarifa" name="tarifa_visita" type="number" min="0"
                value={form.tarifa_visita} onChange={handleChange} placeholder="50000"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Sobre ti <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea id="tecnico-descripcion" name="descripcion" rows={3}
              value={form.descripcion} onChange={handleChange}
              placeholder="Describe tu experiencia, especializaciones o lo que te diferencia..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none transition-shadow"
            />
          </div>


          {/* ── Verificación de identidad ── */}
          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">🪪</span>
              <div>
                <p className="text-sm font-bold text-blue-900">Verificación de identidad *</p>
                <p className="text-xs text-blue-700/70 mt-0.5">
                  Necesitamos tu cédula para validar tu identidad. Tus documentos son 100% confidenciales y solo los verá el equipo ServiYa.
                </p>
              </div>
            </div>

            {/* Número cédula */}
            <div>
              <label className="block text-sm font-semibold text-blue-900 mb-1">Número de cédula *</label>
              <input
                id="tecnico-cedula" name="cedula_numero" type="text"
                value={form.cedula_numero} onChange={handleChange}
                required placeholder="Ej: 1020304050"
                className="w-full border border-blue-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow font-mono"
              />
            </div>

            {/* Fotos cédula */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Frontal */}
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">Foto frontal de cédula *</label>
                <label className={`flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed cursor-pointer transition-all min-h-[120px] overflow-hidden ${
                  previewFrontal ? 'border-blue-400 p-0' : 'border-blue-300 bg-white hover:bg-blue-50 p-4'
                }`}>
                  {previewFrontal ? (
                    <img src={previewFrontal} alt="Vista previa frontal" className="w-full h-32 object-cover rounded-xl" />
                  ) : (
                    <>
                      <span className="text-2xl mb-1">📷</span>
                      <span className="text-xs text-blue-600 font-medium text-center">Click para subir foto frontal</span>
                      <span className="text-xs text-blue-400 mt-0.5">JPG, PNG o PDF</span>
                    </>
                  )}
                  <input type="file" accept="image/*,application/pdf" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (!file) return
                      setCedulaFrontal(file)
                      if (file.type.startsWith('image/')) {
                        setPreviewFrontal(URL.createObjectURL(file))
                      } else {
                        setPreviewFrontal(null)
                      }
                    }}
                  />
                </label>
                {cedulaFrontal && <p className="text-xs text-blue-600 mt-1 truncate">✓ {cedulaFrontal.name}</p>}
              </div>

              {/* Posterior */}
              <div>
                <label className="block text-sm font-semibold text-blue-900 mb-1">
                  Foto posterior <span className="text-blue-400 font-normal">(opcional)</span>
                </label>
                <label className={`flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed cursor-pointer transition-all min-h-[120px] overflow-hidden ${
                  previewPosterior ? 'border-blue-400 p-0' : 'border-blue-200 bg-white hover:bg-blue-50 p-4'
                }`}>
                  {previewPosterior ? (
                    <img src={previewPosterior} alt="Vista previa posterior" className="w-full h-32 object-cover rounded-xl" />
                  ) : (
                    <>
                      <span className="text-2xl mb-1">📷</span>
                      <span className="text-xs text-blue-500 font-medium text-center">Click para subir foto posterior</span>
                      <span className="text-xs text-blue-300 mt-0.5">Opcional</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (!file) return
                      setCedulaPosterior(file)
                      if (file.type.startsWith('image/')) {
                        setPreviewPosterior(URL.createObjectURL(file))
                      }
                    }}
                  />
                </label>
                {cedulaPosterior && <p className="text-xs text-blue-600 mt-1 truncate">✓ {cedulaPosterior.name}</p>}
              </div>
            </div>
          </div>

          {/* Info comisión */}
          <div className="bg-brand-pale rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">💰</span>
            <div>
              <p className="text-sm font-bold text-gray-800">Registro 100% gratis</p>
              <p className="text-xs text-gray-600 mt-0.5">
                ServiYa cobra solo una comisión del <strong>15%</strong> cuando cierras un servicio. Sin cuotas ni costos fijos.
              </p>
            </div>
          </div>


          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
              {error.includes('/tecnico') && (
                <Link href="/tecnico" className="ml-1 underline font-semibold">Ingresar →</Link>
              )}
            </div>
          )}

          {/* Loading step indicator */}
          {loading && stepLabel && (
            <div className="flex items-center gap-2 text-sm text-brand font-medium">
              <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin inline-block flex-shrink-0" />
              {stepLabel}
            </div>
          )}

          <button type="submit" id="tecnico-submit" disabled={loading}
            className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98]"
          >
            {loading ? 'Procesando...' : 'Crear cuenta e ingresar al panel →'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            ¿Ya tienes cuenta?{' '}
            <Link href="/tecnico" className="text-brand font-semibold hover:underline">Ingresar al panel →</Link>
          </p>

          <p className="text-xs text-gray-400 text-center">
            Al registrarte aceptas nuestros{' '}
            <a href="#" className="text-brand hover:underline">Términos y Condiciones</a>. 🔒
          </p>
        </form>
      </div>
    </>
  )
}
