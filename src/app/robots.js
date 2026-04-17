export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/tecnico',
          '/cliente',
          '/api/',
          '/pago-exitoso',
          '/pago-fallido',
        ],
      },
    ],
    sitemap: 'https://www.serviyacol.com/sitemap.xml',
    host: 'https://www.serviyacol.com',
  }
}
