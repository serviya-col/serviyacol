'use client'
import { useState } from 'react'
import Link from 'next/link'

const SERVICIOS = [
  'Plomería', 'Electricidad', 'Cerrajería', 'Pintura',
  'Aire acondicionado', 'Jardinería', 'Limpieza',
]

// Ciudades colombianas con coordenadas aproximadas
const CITIES = [
  { name: 'Bogotá',        lat: 4.7110,  lng: -74.0721 },
  { name: 'Medellín',      lat: 6.2518,  lng: -75.5636 },
  { name: 'Cali',          lat: 3.4516,  lng: -76.5320 },
  { name: 'Barranquilla',  lat: 10.9639, lng: -74.7964 },
  { name: 'Cartagena',     lat: 10.3997, lng: -75.5144 },
  { name: 'Bucaramanga',   lat: 7.1193,  lng: -73.1227 },
  { name: 'Pereira',       lat: 4.8133,  lng: -75.6961 },
  { name: 'Manizales',     lat: 5.0703,  lng: -75.5138 },
  { name: 'Ibagué',        lat: 4.4389,  lng: -75.2322 },
  { name: 'Neiva',         lat: 2.9273,  lng: -75.2819 },
  { name: 'Villavicencio', lat: 4.1420,  lng: -73.6267 },
  { name: 'Pasto',         lat: 1.2136,  lng: -77.2811 },
]

// Fórmula Haversine para distancia entre coordenadas
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const toRad = (deg) => deg * (Math.PI / 180)
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function nearestCity(lat, lng) {
  let best = CITIES[0]
  let minDist = haversine(lat, lng, best.lat, best.lng)
  for (const city of CITIES.slice(1)) {
    const dist = haversine(lat, lng, city.lat, city.lng)
    if (dist < minDist) { minDist = dist; best = city }
  }
  return best.name
}

export default function HeroSearch() {
  const [servicio, setServicio] = useState('')
  const [ciudad, setCiudad]     = useState('')
  const [locating, setLocating] = useState(false)
  const [locMsg, setLocMsg]     = useState({ text: '', type: '' })

  // Pide permiso y detecta la ciudad más cercana
  const detectCity = () => {
    if (!navigator.geolocation) {
      setLocMsg({ text: 'Tu navegador no soporta geolocalización.', type: 'error' })
      return
    }
    setLocating(true)
    setLocMsg({ text: '', type: '' })
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const city = nearestCity(coords.latitude, coords.longitude)
        setCiudad(city)
        setLocating(false)
        setLocMsg({ text: `Ciudad detectada: ${city}`, type: 'success' })
      },
      (err) => {
        setLocating(false)
        const msg =
          err.code === 1
            ? 'Permiso denegado. Selecciona tu ciudad manualmente.'
            : 'No pudimos obtener tu ubicación. Intenta de nuevo.'
        setLocMsg({ text: msg, type: 'error' })
      },
      { timeout: 8000, maximumAge: 60000 }
    )
  }

  // Construye el href para /solicitar con parámetros opcionales
  const params = [
    servicio && `categoria=${encodeURIComponent(servicio)}`,
    ciudad   && `ciudad=${encodeURIComponent(ciudad)}`,
  ].filter(Boolean).join('&')
  const href = `/solicitar${params ? `?${params}` : ''}`

  return (
    <div className="bg-white rounded-2xl p-5 max-w-xl mx-auto shadow-xl shadow-black/25 animate-slide-up delay-300 border border-white/20">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
        Cuéntanos rápido qué necesitas
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Servicio */}
        <select
          id="hero-servicio"
          value={servicio}
          onChange={(e) => setServicio(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand transition-shadow"
        >
          <option value="">Selecciona servicio</option>
          {SERVICIOS.map((s) => <option key={s}>{s}</option>)}
        </select>

        {/* Ciudad */}
        <select
          id="hero-ciudad"
          value={ciudad}
          onChange={(e) => { setCiudad(e.target.value); setLocMsg({ text: '', type: '' }) }}
          className={`border rounded-xl px-3 py-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand transition-all ${
            ciudad ? 'border-brand/40 text-gray-800' : 'border-gray-200 text-gray-500'
          }`}
        >
          <option value="">Selecciona ciudad</option>
          {CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
      </div>

      <button
        type="button"
        id="hero-geolocate"
        onClick={detectCity}
        disabled={locating}
        className="w-full mb-3 flex items-center justify-center gap-2 border border-brand/25 hover:border-brand text-brand text-xs font-semibold py-2.5 rounded-xl hover:bg-brand-pale transition-all disabled:opacity-50 group"
      >
        {locating ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin inline-block" />
            Detectando tu ubicación...
          </>
        ) : (
          <>
            <svg
              className="w-3.5 h-3.5 group-hover:scale-110 transition-transform"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            Detectar ciudad con mi ubicación
          </>
        )}
      </button>

      {/* Mensaje de feedback */}
      {locMsg.text && (
        <div
          className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg mb-3 ${
            locMsg.type === 'success'
              ? 'bg-brand-pale text-brand'
              : 'bg-red-50 text-red-600'
          }`}
        >
          <span>{locMsg.type === 'success' ? '✓' : '⚠'}</span>
          {locMsg.text}
        </div>
      )}

      <Link
        href={href}
        id="hero-cta"
        className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-dark text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-brand/30 active:scale-[0.98]"
      >
        Buscar técnicos disponibles
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </Link>

      <p className="text-xs text-gray-500 text-center mt-3">
        Solicitud gratis · Visita desde $50.000 · Garantía de 30 días
      </p>
    </div>
  )
}
