import { useEffect, useState, type ReactNode } from 'react'
import { isLocalMode, supabase } from '../lib/supabase'
import { AuthContext, type AuthUser } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(!isLocalMode)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session ? { email: data.session.user.email ?? '' } : null)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? { email: session.user.email ?? '' } : null)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    if (isLocalMode) {
      setUser({ email })
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
