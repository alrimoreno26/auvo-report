import type { Session } from '@supabase/supabase-js'
import { useEffect, useState, type ReactNode } from 'react'
import { isLocalMode, supabase } from '../lib/supabase'
import { AuthContext, type AuthUser } from './context'

// El rol se guarda en app_metadata: solo lo puede cambiar el servidor, no el propio usuario
const toUser = (session: Session | null): AuthUser | null =>
  session
    ? { email: session.user.email ?? '', isAdmin: session.user.app_metadata?.role === 'admin' }
    : null

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(!isLocalMode)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session))
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toUser(session))
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    if (isLocalMode) {
      setUser({ email, isAdmin: true })
      return
    }
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signOut() {
    if (isLocalMode) {
      setUser(null)
      return
    }
    await supabase!.auth.signOut()
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>
}
