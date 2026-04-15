import { Inter } from 'next/font/google'
import './globals.css'
import WhatsAppButton from '@/components/WhatsAppButton'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata = {
  title: 'ServiYa — Técnicos verificados a domicilio en Colombia',
  description:
    'Encuentra plomeros, electricistas, cerrajeros y más en tu ciudad. Técnicos verificados, respuesta en menos de 1 hora y garantía de satisfacción de 30 días.',
  keywords: 'técnicos a domicilio, plomeros, electricistas, cerrajeros, Colombia, Bogotá, Medellín, ServiYa',
  authors: [{ name: 'ServiYa' }],
  creator: 'ServiYa',
  metadataBase: new URL('https://serviya.co'),
  openGraph: {
    title: 'ServiYa — Tu técnico de confianza en menos de 1 hora',
    description: 'Conectamos hogares y empresas con técnicos certificados en toda Colombia. Rápido, seguro y con garantía.',
    type: 'website',
    locale: 'es_CO',
    siteName: 'ServiYa',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ServiYa — Técnicos verificados a domicilio',
    description: 'Tu técnico de confianza en menos de 1 hora.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  )
}
