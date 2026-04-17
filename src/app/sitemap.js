const BASE = 'https://www.serviyacol.com'

// Servicios que queremos indexar
const SERVICIOS = [
  'Plomería',
  'Electricidad',
  'Cerrajería',
  'Pintura',
  'Aire acondicionado',
  'Jardinería',
  'Limpieza',
]

// Ciudades principales
const CIUDADES = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Pereira',
  'Manizales',
]

export default function sitemap() {
  const now = new Date()

  const staticPages = [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE}/solicitar`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE}/registro-tecnico`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/tecnico`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/cliente`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE}/terminos`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE}/privacidad`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Páginas de solicitar por servicio (long-tail SEO)
  const servicioPages = SERVICIOS.map((servicio) => ({
    url: `${BASE}/solicitar?categoria=${encodeURIComponent(servicio)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  // Opcional: combinaciones servicio + ciudad (muy potente para SEO local)
  const localPages = CIUDADES.flatMap((ciudad) =>
    SERVICIOS.slice(0, 4).map((servicio) => ({
      url: `${BASE}/solicitar?categoria=${encodeURIComponent(servicio)}&ciudad=${encodeURIComponent(ciudad)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.75,
    }))
  )

  return [...staticPages, ...servicioPages, ...localPages]
}
