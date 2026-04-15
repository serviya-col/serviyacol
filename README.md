# ServiYa — Setup Guide

## Stack
- Next.js 14 (App Router)
- Supabase (base de datos)
- Tailwind CSS (estilos)
- Vercel (deploy)

---

## 1. Instalar dependencias

```bash
npm install
```

---

## 2. Configurar Supabase

1. Ve a https://app.supabase.com y crea un proyecto nuevo llamado "serviya"
2. En el SQL Editor, ejecuta el contenido de `supabase/schema.sql`
3. Copia la URL y la anon key desde Settings → API

---

## 3. Variables de entorno

Edita `.env.local` con tus credenciales reales:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_XXXXXXXX
```

---

## 4. Correr en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000

---

## 5. Páginas del proyecto

| Ruta | Descripción |
|------|-------------|
| `/` | Home — búsqueda y listado de categorías |
| `/solicitar` | Formulario para que el cliente pida un técnico |
| `/registro-tecnico` | Formulario de registro para técnicos |
| `/admin` | Panel de administración (contraseña: serviya2026) |

---

## 6. Deploy en Vercel

```bash
npm install -g vercel
vercel
```

Agrega las variables de entorno en Vercel Dashboard → Settings → Environment Variables.

---

## 7. Cambiar contraseña del admin

En `src/app/admin/page.js` línea con `ADMIN_PASS`, cambia el valor:

```js
const ADMIN_PASS = 'tu-contraseña-segura'
```

---

## Próximos pasos (Fase 2)

- [ ] Integrar Wompi para cobro de visita
- [ ] Notificaciones por WhatsApp API cuando llega solicitud
- [ ] Listado público de técnicos por ciudad
- [ ] Sistema de reseñas post-servicio
- [ ] Autenticación de técnicos con Supabase Auth
