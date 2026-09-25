import { FunctionsHttpError } from '@supabase/supabase-js'
import { isLocalMode, supabase } from '../lib/supabase'

export interface NewUser {
  email: string
  password: string
  isAdmin: boolean
}

/** Crea un usuario mediante la Edge Function `create-user` (solo administradores). */
export async function createUser(user: NewUser): Promise<{ email: string }> {
  if (isLocalMode) return { email: user.email }

  const { data, error } = await supabase!.functions.invoke('create-user', { body: user })
  if (error) {
    // La función responde { error } con el motivo; se muestra ese texto
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null)
      throw new Error(body?.error ?? 'No se pudo crear el usuario.')
    }
    throw new Error('No se pudo contactar al servidor. ¿Está desplegada la función create-user?')
  }
  return data
}
