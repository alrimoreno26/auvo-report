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
  password: string
  name: string
  role: Role
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

async function unwrap<T>(result: { data: T; error: unknown }): Promise<T> {
  const { data, error } = result
  if (!error) return data
  // La función responde { error } con el motivo; se muestra ese texto
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null)
    throw new Error(body?.error ?? 'La operación no se pudo completar.')
  }
  throw new Error(`No se pudo contactar al servidor. ¿Está desplegada la función ${FUNCTION}?`)
}

export async function listUsers(): Promise<AppUser[]> {
  if (isLocalMode) return [...localUsers]
  return unwrap(await supabase!.functions.invoke<AppUser[]>(FUNCTION, { method: 'GET' })) as Promise<AppUser[]>
}

export async function createUser(user: NewUser): Promise<AppUser> {
  if (isLocalMode) {
    if (localUsers.some((u) => u.email === user.email.toLowerCase())) {
      throw new Error('Ya existe un usuario con ese email')
    }
    const created: AppUser = {
      id: crypto.randomUUID(),
      email: user.email.toLowerCase(),
      name: user.name || null,
      role: user.role,
      created_at: new Date().toISOString(),
      last_sign_in_at: null,
    }
    localUsers.push(created)
    return created
  }
  return unwrap(await supabase!.functions.invoke<AppUser>(FUNCTION, { method: 'POST', body: user })) as Promise<AppUser>
}
