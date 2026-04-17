import { Inter } from 'next/font/google'
import './globals.css'
import WhatsAppButton from '@/components/WhatsAppButton'
import { Suspense } from 'react'
import MetaPixel from '@/components/MetaPixel'
import Script from 'next/script'


const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

// ─── Base URL ────────────────────────────────────────────────────────────────
const SITE_URL = 'https://www.serviyacol.com'

// ─── Viewport ────────────────────────────────────────────────────────────────
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#059669',
}

// ─── Metadata global (heredado por todas las páginas) ────────────────────────
export const metadata = {
  metadataBase: new URL(SITE_URL),

  // ── Básico
  title: {
    default: 'ServiYa — Técnicos verificados a domicilio en Colombia',
    template: '%s | ServiYa',
  },
  description:
    'Encuentra plomeros, electricistas, cerrajeros, pintores y más en tu ciudad. Técnicos verificados con antecedentes, respuesta en menos de 1 hora y garantía de satisfacción de 30 días. Servicio en Bogotá, Medellín, Cali y más ciudades de Colombia.',
  keywords: [
    'técnicos a domicilio Colombia',
    'plomeros Bogotá',
    'electricistas Medellín',
    'cerrajeros Cali',
    'técnicos verificados',
    'ServiYa',
    'servicios del hogar Colombia',
    'técnicos confiables',
    'reparaciones hogar',
    'gasfiteros',
    'fontaneros',
    'pintura a domicilio',
    'limpieza domicilio',
    'aire acondicionado',
  ],
  authors: [{ name: 'ServiYa', url: SITE_URL }],
  creator: 'ServiYa — Renting Amc Agency',
  publisher: 'ServiYa',
  category: 'Home Services',

  // ── Indexación
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Canonical
  alternates: {
    canonical: SITE_URL,
    languages: {
      'es-CO': SITE_URL,
    },
  },

  // ── Open Graph (WhatsApp, Facebook, LinkedIn)
  openGraph: {
    title: 'ServiYa — Tu técnico de confianza en menos de 1 hora',
    description:
      'Conectamos hogares y empresas con técnicos certificados en toda Colombia. Plomeros, electricistas, cerrajeros, pintores y más. Rápido, seguro y con garantía de 30 días.',
    url: SITE_URL,
    siteName: 'ServiYa',
    type: 'website',
    locale: 'es_CO',
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'ServiYa — Técnicos verificados a domicilio en Colombia',
        type: 'image/png',
      },
    ],
  },

  // ── Twitter / X Card
  twitter: {
    card: 'summary_large_image',
    site: '@serviyacol',
    creator: '@serviyacol',
    title: 'ServiYa — Técnicos verificados a domicilio en Colombia',
    description:
      'Tu técnico de confianza en menos de 1 hora. Plomeros, electricistas, cerrajeros y más en toda Colombia.',
    images: [`${SITE_URL}/og-image.png`],
  },

  // ── Favicons e íconos
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'manifest', url: '/site.webmanifest' },
    ],
  },

  // ── Verificación de consolas
  verification: {
    google: '0JaHSjKd3HF6XHvErQd3OqwN72q3aRRyuQ2wqUZQA_k',
  },
}

// ─── JSON-LD: LocalBusiness schema para Google ───────────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/#business`,
      name: 'ServiYa',
      alternateName: 'ServiyaCol',
      description:
        'Plataforma colombiana que conecta hogares con técnicos verificados a domicilio. Servicios de plomería, electricidad, cerrajería, pintura, limpieza y más en toda Colombia.',
      url: SITE_URL,
      logo: `${SITE_URL}/favicon.svg`,
      image: `${SITE_URL}/og-image.png`,
      telephone: '+573138537261',
      email: 'soporte@serviyacol.com',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'CO',
        addressRegion: 'Bogotá D.C.',
      },
      areaServed: [
        'Bogotá', 'Medellín', 'Cali', 'Barranquilla',
        'Cartagena', 'Bucaramanga', 'Pereira', 'Manizales',
        'Ibagué', 'Neiva', 'Villavicencio', 'Pasto',
      ].map((city) => ({
        '@type': 'City',
        name: city,
        addressCountry: 'CO',
      })),
      sameAs: [
        'https://www.instagram.com/serviya_col1?igsh=MWdyazIyem51N2g0dQ%3D%3D&utm_source=qr',
        'https://www.facebook.com/ServiYacol1',
        'https://wa.me/526611310397',
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Servicios técnicos a domicilio',
        itemListElement: [
          'Plomería', 'Electricidad', 'Cerrajería',
          'Pintura', 'Aire acondicionado', 'Limpieza', 'Jardinería',
        ].map((service, i) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: service,
            provider: { '@id': `${SITE_URL}/#business` },
          },
          position: i + 1,
        })),
      },
      priceRange: '$$$',
      currenciesAccepted: 'COP',
      paymentAccepted: 'Cash, Credit Card, Debit Card, PSE, Nequi',
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'ServiYa',
      description: 'Técnicos verificados a domicilio en Colombia',
      publisher: { '@id': `${SITE_URL}/#business` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_URL}/solicitar?categoria={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

// ─── Layout ──────────────────────────────────────────────────────────────────
export default function RootLayout({ children }) {
  return (
    <html lang="es" dir="ltr">
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Preconnect para performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch para servicios externos */}
        <link rel="dns-prefetch" href="https://api.resend.com" />
        <link rel="dns-prefetch" href="https://checkout.bold.co" />
      </head>
      <body className={`${inter.className} bg-white text-gray-900 antialiased overflow-x-hidden w-full`}>
        {/* Google Analytics 4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QHDZC21468"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QHDZC21468', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        {children}
        <WhatsAppButton />
      </body>

    </html>
  )
}
