// Edge Function: administración de usuarios de Supabase Auth.
//   GET  → lista los usuarios
//   POST → crea un usuario { email, password, name?, role: 'admin' | 'viewer' }
// Solo la pueden usar usuarios con app_metadata.role = 'admin'.
// La service role key la inyecta Supabase en el entorno de la función; nunca llega al navegador.
import { createClient, type User } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const toDto = (u: User) => ({
  id: u.id,
  email: u.email ?? '',
  name: (u.user_metadata?.name as string | undefined) ?? null,
  role: u.app_metadata?.role === 'admin' ? 'admin' : 'viewer',
  created_at: u.created_at,
  last_sign_in_at: u.last_sign_in_at ?? null,
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  // Quién llama: se valida su token de sesión y su rol
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  const { data: caller } = token ? await admin.auth.getUser(token) : { data: { user: null } }
  if (!caller.user) return json({ error: 'No autenticado' }, 401)
  if (caller.user.app_metadata?.role !== 'admin') return json({ error: 'Solo administradores' }, 403)

  if (req.method === 'GET') {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (error) return json({ error: error.message }, 500)
    return json(data.users.map(toDto))
  }

  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  let body: { email?: string; password?: string; name?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400)
  }
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ''
  const name = body.name?.trim() || undefined
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'Email inválido' }, 400)
  if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400)

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { name } : {},
    app_metadata: body.role === 'admin' ? { role: 'admin' } : {},
  })
  if (error) {
    const exists = /already been registered|already exists/i.test(error.message)
    return json({ error: exists ? 'Ya existe un usuario con ese email' : error.message }, exists ? 409 : 400)
  }

  return json(toDto(data.user), 201)
})
