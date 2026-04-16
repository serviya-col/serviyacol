import { Inter } from 'next/font/google'
import './globals.css'
import WhatsAppButton from '@/components/WhatsAppButton'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#071A14',
}

export const metadata = {
  title: 'ServiYa — Técnicos verificados a domicilio en Colombia',
  description:
    'Encuentra plomeros, electricistas, cerrajeros y más en tu ciudad. Técnicos verificados, respuesta en menos de 1 hora y garantía de satisfacción de 30 días.',
  keywords: 'técnicos a domicilio, plomeros, electricistas, cerrajeros, Colombia, Bogotá, Medellín, ServiYa',
  authors: [{ name: 'ServiYa' }],
  creator: 'ServiYa',
  metadataBase: new URL('https://www.serviyacol.com'),
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

import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1519964529696340');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>
      <body className={`${inter.className} bg-white text-gray-900 antialiased overflow-x-hidden w-full`}>
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }} src="https://www.facebook.com/tr?id=1519964529696340&ev=PageView&noscript=1" alt="" />
        </noscript>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  )
}
