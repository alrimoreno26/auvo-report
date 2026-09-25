import { FunctionsHttpError } from '@supabase/supabase-js'
import { isLocalMode, supabase } from '../lib/supabase'

export type Role = 'admin' | 'viewer'

export interface AppUser {
  id: string
  email: string
  name: string | null
  role: Role
  created_at: string
  last_sign_in_at: string | null
}

export interface NewUser {
  email: string
  name: string
  role: Role
}

/** Resultado de crear un usuario o reenviarle el acceso. */
export interface AccessResult {
  user: AppUser
  emailSent: boolean
  /** Solo si el correo no se pudo enviar: enlace para compartir a mano */
  link?: string
  emailError?: string
}

const FUNCTION = 'admin-users'

// Modo local: usuarios en memoria
const localUsers: AppUser[] = [
  {
    id: 'local-admin',
    email: 'admin@local.test',
    name: 'Administrador local',
    role: 'admin',
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    last_sign_in_at: new Date().toISOString(),
  },
]
const localLink = (email: string) =>
  `${location.origin}/crear-contrasena?token_hash=local-${encodeURIComponent(email)}&type=recovery`

async function unwrap<T>(result: { data: T | null; error: unknown }): Promise<T> {
  const { data, error } = result
  if (!error) return data as T
  // La función responde { error } con el motivo; se muestra ese texto
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null)
    throw new Error(body?.error ?? 'La operación no se pudo completar.')
  }
  throw new Error(`No se pudo contactar al servidor. ¿Está desplegada la función ${FUNCTION}?`)
}

export async function listUsers(): Promise<AppUser[]> {
  if (isLocalMode) return [...localUsers]
  return unwrap(await supabase!.functions.invoke<AppUser[]>(FUNCTION, { method: 'GET' }))
}

/** Crea el usuario y le envía el correo con el enlace para crear su contraseña. */
export async function createUser(user: NewUser): Promise<AccessResult> {
  if (isLocalMode) {
    const email = user.email.toLowerCase()
    if (localUsers.some((u) => u.email === email)) throw new Error('Ya existe un usuario con ese email')
    const created: AppUser = {
      id: crypto.randomUUID(),
      email,
      name: user.name || null,
      role: user.role,
      created_at: new Date().toISOString(),
      last_sign_in_at: null,
    }
    localUsers.push(created)
    // En modo local no hay correo: se muestra el enlace como si el envío hubiera fallado
    return { user: created, emailSent: false, link: localLink(email), emailError: 'Modo local: no se envían correos' }
  }
  return unwrap(
    await supabase!.functions.invoke<AccessResult>(FUNCTION, { method: 'POST', body: { action: 'create', ...user } }),
  )
}

/** Reenvía el correo de acceso (nuevo enlace) a un usuario existente. */
export async function resendAccess(userId: string): Promise<AccessResult> {
  if (isLocalMode) {
    const user = localUsers.find((u) => u.id === userId)
    if (!user) throw new Error('Usuario no encontrado')
    return { user, emailSent: false, link: localLink(user.email), emailError: 'Modo local: no se envían correos' }
  }
  return unwrap(
    await supabase!.functions.invoke<AccessResult>(FUNCTION, { method: 'POST', body: { action: 'resend', userId } }),
  )
}
