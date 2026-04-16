import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service_role key.
 * Solo usar en API routes (server-side). NUNCA exportar al cliente.
 * Bypasa RLS — tiene acceso completo a la base de datos.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
