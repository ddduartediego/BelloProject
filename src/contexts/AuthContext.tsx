'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import { Usuario } from '@/types/database'

interface AuthContextType {
  // Estados
  user: User | null
  usuario: Usuario | null
  session: Session | null
  loading: boolean

  // Funções de autenticação
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  
  // Funções de dados do usuário
  fetchUsuario: () => Promise<void>
  
  // Verificações de permissão
  isAdmin: () => boolean
  isProfissional: () => boolean
  isAuthenticated: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // DEBUG: Log para monitorar mudanças de estado
  useEffect(() => {
    console.log('[DEBUG AuthContext] Estado atualizado:', {
      user: user?.id || 'null',
      usuario: usuario?.id || 'null', 
      session: session?.access_token ? 'exists' : 'null',
      loading
    })
  }, [user, usuario, session, loading])

  // Buscar dados complementares do usuário na tabela 'usuario'
  const fetchUsuario = useCallback(async () => {
    console.log('[DEBUG AuthContext] fetchUsuario chamado, user:', user?.id || 'null')
    
    if (!user) {
      console.log('[DEBUG AuthContext] Nenhum user, limpando usuario')
      setUsuario(null)
      return
    }

    try {
      console.log('[DEBUG AuthContext] Buscando dados do usuário:', user.id)
      
      // Primeiro, tentar com RLS bypass usando service role se disponível
      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('id', user.id)
        .maybeSingle() // Use maybeSingle instead of single to handle 0 rows gracefully

      console.log('[DEBUG AuthContext] Resposta da query:', { data, error })

      if (error) {
        console.error('[DEBUG AuthContext] Erro ao buscar dados do usuário:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        
        // Se erro é de RLS/permissões, criar usuário automaticamente
        if (error.code === 'PGRST116' || error.message.includes('406') || error.message.includes('RLS')) {
          console.log('[DEBUG AuthContext] Erro de RLS detectado, tentando criar usuário automaticamente')
          
          try {
            const { data: newUser, error: createError } = await supabase
              .from('usuario')
              .insert([
                {
                  id: user.id,
                  email: user.email,
                  nome_completo: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
                  tipo_usuario: 'ADMINISTRADOR' as const, // Default para novos usuários OAuth
                  criado_em: new Date().toISOString(),
                  atualizado_em: new Date().toISOString()
                }
              ])
              .select()
              .single()

            if (createError) {
              console.error('[DEBUG AuthContext] Erro ao criar usuário:', createError)
              setUsuario(null)
              return
            }

            console.log('[DEBUG AuthContext] Usuário criado automaticamente:', newUser)
            setUsuario(newUser)
            return
          } catch (createErr) {
            console.error('[DEBUG AuthContext] Erro inesperado ao criar usuário:', createErr)
            setUsuario(null)
            return
          }
        }
        
        setUsuario(null)
        return
      }

      console.log('[DEBUG AuthContext] Dados do usuário encontrados:', data ? 'sim' : 'não')
      setUsuario(data || null)
    } catch (err) {
      console.error('[DEBUG AuthContext] Erro inesperado ao buscar usuário:', err)
      setUsuario(null)
    }
  }, [user, supabase])

  // Função de login com email/senha
  const signIn = async (email: string, password: string) => {
    console.log('[DEBUG AuthContext] signIn iniciado para:', email)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.log('[DEBUG AuthContext] Erro no signIn:', error.message)
        return { error: error.message }
      }

      console.log('[DEBUG AuthContext] signIn bem-sucedido')
      return { error: null }
    } catch (err) {
      console.error('[DEBUG AuthContext] Erro inesperado no signIn:', err)
      return { error: 'Erro inesperado durante o login' }
    }
  }

  // Função de login com Google
  const signInWithGoogle = async () => {
    console.log('[DEBUG AuthContext] signInWithGoogle iniciado')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        console.log('[DEBUG AuthContext] Erro no signInWithGoogle:', error.message)
        return { error: error.message }
      }

      console.log('[DEBUG AuthContext] signInWithGoogle redirecionamento iniciado')
      return { error: null }
    } catch (err) {
      console.error('[DEBUG AuthContext] Erro inesperado no signInWithGoogle:', err)
      return { error: 'Erro inesperado durante o login com Google' }
    }
  }

  // Função de logout
  const signOut = async () => {
    console.log('[DEBUG AuthContext] signOut iniciado')
    
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUsuario(null)
      setSession(null)
      console.log('[DEBUG AuthContext] signOut concluído')
    } catch (error) {
      console.error('[DEBUG AuthContext] Erro durante logout:', error)
    }
  }

  // Verificações de permissão
  const isAdmin = () => {
    const result = usuario?.tipo_usuario === 'ADMINISTRADOR'
    console.log('[DEBUG AuthContext] isAdmin:', result)
    return result
  }

  const isProfissional = () => {
    const result = usuario?.tipo_usuario === 'PROFISSIONAL'
    console.log('[DEBUG AuthContext] isProfissional:', result)
    return result
  }

  const isAuthenticated = () => {
    const result = user !== null && session !== null
    console.log('[DEBUG AuthContext] isAuthenticated:', result)
    return result
  }

  // Monitorar mudanças no estado de autenticação
  useEffect(() => {
    console.log('[DEBUG AuthContext] Inicializando monitoramento de auth state')
    
    // Pegar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[DEBUG AuthContext] Sessão inicial:', session ? 'exists' : 'null')
      setSession(session)
      setUser(session?.user ?? null)
    })

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[DEBUG AuthContext] onAuthStateChange evento:', event, 'session:', session ? 'exists' : 'null')
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (event === 'SIGNED_OUT') {
        console.log('[DEBUG AuthContext] SIGNED_OUT - limpando usuario')
        setUsuario(null)
      }

      if (event === 'SIGNED_IN' && session) {
        console.log('[DEBUG AuthContext] SIGNED_IN - nova sessão detectada')
        console.log('[DEBUG AuthContext] User info:', {
          id: session.user.id,
          email: session.user.email,
          provider: session.user.app_metadata?.provider
        })
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('[DEBUG AuthContext] TOKEN_REFRESHED')
      }
    })

    return () => {
      console.log('[DEBUG AuthContext] Limpando subscription')
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Buscar dados do usuário quando user muda
  useEffect(() => {
    if (user) {
      console.log('[DEBUG AuthContext] User mudou, chamando fetchUsuario')
      fetchUsuario()
    }
  }, [user, fetchUsuario])

  // Marcar loading como false após verificações iniciais
  useEffect(() => {
    console.log('[DEBUG AuthContext] Verificando loading state, user:', user?.id || 'null', 'session:', session ? 'exists' : 'null')
    
    if (user !== null || session === null) {
      console.log('[DEBUG AuthContext] Marcando loading como false')
      setLoading(false)
    }
  }, [user, session])

  const value: AuthContextType = {
    user,
    usuario,
    session,
    loading,
    signIn,
    signInWithGoogle,
    signOut,
    fetchUsuario,
    isAdmin,
    isProfissional,
    isAuthenticated,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook personalizado para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

// Hook para verificar se está carregando
export function useAuthLoading() {
  const { loading } = useAuth()
  return loading
}

// Hook para verificar permissões específicas
export function useAuthPermissions() {
  const { isAdmin, isProfissional, isAuthenticated } = useAuth()
  return { isAdmin, isProfissional, isAuthenticated }
} 