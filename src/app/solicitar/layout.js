export const metadata = {
  title: 'Solicitar técnico a domicilio — Plomeros, Electricistas, Cerrajeros',
  description:
    'Solicita un técnico verificado a domicilio en minutos. Plomeros, electricistas, cerrajeros, pintores y más en Bogotá, Medellín, Cali y toda Colombia. Visita de diagnóstico desde $50.000 COP.',
  keywords: [
    'solicitar técnico a domicilio',
    'técnico domicilio Bogotá',
    'plomero urgente Bogotá',
    'electricista a domicilio Medellín',
    'cerrajero urgente Cali',
    'reparaciones hogar Colombia',
  ],
  alternates: {
    canonical: 'https://www.serviyacol.com/solicitar',
  },
  openGraph: {
    title: 'Solicitar técnico verificado — ServiYa',
    description: 'Cuéntanos qué necesitas y te conectamos con el técnico ideal en tu ciudad. Menos de 1 hora de espera.',
    url: 'https://www.serviyacol.com/solicitar',
    images: [{ url: 'https://www.serviyacol.com/og-image.png', width: 1200, height: 630 }],
  },
}

export default function SolicitarLayout({ children }) {
  return children
}
