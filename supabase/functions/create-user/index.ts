// Edge Function: crea un usuario de Supabase Auth.
// Solo la pueden usar usuarios con app_metadata.role = 'admin'.
// La service role key la inyecta Supabase en el entorno de la función; nunca llega al navegador.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  // Quién llama: se valida su token de sesión
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const { data: caller } = token ? await admin.auth.getUser(token) : { data: { user: null } }
  if (!caller.user) return json({ error: 'No autenticado' }, 401)
  if (caller.user.app_metadata?.role !== 'admin') return json({ error: 'Solo administradores' }, 403)

  let body: { email?: string; password?: string; isAdmin?: boolean }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400)
  }
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Email inválido' }, 400)
  if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400)

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: body.isAdmin ? { role: 'admin' } : {},
  })
  if (error) {
    const exists = /already been registered|already exists/i.test(error.message)
    return json({ error: exists ? 'Ya existe un usuario con ese email' : error.message }, exists ? 409 : 400)
  }

  return json({ id: data.user.id, email: data.user.email })
})
