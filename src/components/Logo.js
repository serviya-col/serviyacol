/**
 * ServiYa — Componente de logo SVG profesional
 * Variantes: 'default' | 'white' | 'small'
 * Uso: <Logo /> | <Logo variant="white" /> | <Logo variant="small" />
 */
export default function Logo({ variant = 'default', className = '' }) {
  // Colores por variante
  const iconColor  = variant === 'white' ? '#ffffff' : '#059669'  // verde o blanco
  const textMain   = variant === 'white' ? '#ffffff' : '#059669'  // "Servi"
  const textAccent = variant === 'white' ? 'rgba(255,255,255,0.75)' : '#111827' // "Ya"
  const isSmall    = variant === 'small'

  const width  = isSmall ? 100 : 130
  const height = isSmall ? 28  : 36

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 130 36"
      width={width}
      height={height}
      aria-label="ServiYa logo"
      className={className}
    >
      {/* ── Icono: llave inglesa estilizada ─────────────────────────────── */}
      {/* Cuerpo de la llave */}
      <circle cx="10" cy="10" r="6.5" fill="none" stroke={iconColor} strokeWidth="2.6" strokeLinecap="round"/>
      {/* Mango de la llave */}
      <line x1="14.5" y1="14.5" x2="23" y2="27" stroke={iconColor} strokeWidth="3" strokeLinecap="round"/>
      {/* Muesca interior de la llave */}
      <circle cx="10" cy="10" r="2.8" fill={iconColor} opacity="0.35"/>

      {/* ── Chispa / estrella de check en esquina inferior derecha del icono */}
      <circle cx="22.5" cy="27.5" r="2.5" fill={iconColor} opacity="0.85"/>

      {/* ── Wordmark ─────────────────────────────────────────────────────── */}
      {/* "Servi" */}
      <text
        x="32"
        y="26"
        fontFamily="'Inter','Segoe UI',Arial,sans-serif"
        fontWeight="800"
        fontSize="22"
        fill={textMain}
        letterSpacing="-0.5"
      >
        Servi
      </text>
      {/* "Ya" */}
      <text
        x="94"
        y="26"
        fontFamily="'Inter','Segoe UI',Arial,sans-serif"
        fontWeight="800"
        fontSize="22"
        fill={textAccent}
        letterSpacing="-0.5"
      >
        Ya
      </text>

      {/* ── Línea decorativa bajo el texto ─────────────────────────────── */}
      <rect x="32" y="29.5" width="30" height="2.2" rx="1.1" fill={iconColor} opacity="0.6"/>
    </svg>
  )
}
