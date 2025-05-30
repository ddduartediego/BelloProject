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

  // Buscar dados complementares do usuário na tabela 'usuario'
  const fetchUsuario = useCallback(async () => {
    if (!user) {
      setUsuario(null)
      return
    }

    try {
      // Primeiro, tentar com RLS bypass usando service role se disponível
      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('id', user.id)
        .maybeSingle() // Use maybeSingle instead of single to handle 0 rows gracefully

      if (error) {
        console.error('Erro ao buscar dados do usuário:', {
          message: error.message,
          code: error.code
        })
        
        // Se erro é de RLS/permissões, criar usuário automaticamente
        if (error.code === 'PGRST116' || error.message.includes('406') || error.message.includes('RLS')) {
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
              console.error('Erro ao criar usuário:', createError)
              setUsuario(null)
              return
            }

            setUsuario(newUser)
            return
          } catch (createErr) {
            console.error('Erro inesperado ao criar usuário:', createErr)
            setUsuario(null)
            return
          }
        }
        
        setUsuario(null)
        return
      }

      // Se não há erro mas também não há dados, usuário não existe
      if (!data) {
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
            console.error('Erro ao criar usuário (sem erro prévio):', createError)
            setUsuario(null)
            return
          }

          setUsuario(newUser)
          return
        } catch (createErr) {
          console.error('Erro inesperado ao criar usuário (sem erro prévio):', createErr)
          setUsuario(null)
          return
        }
      }

      setUsuario(data || null)
    } catch (err) {
      console.error('Erro inesperado ao buscar usuário:', err)
      setUsuario(null)
    }
  }, [user, supabase])

  // Função de login com email/senha
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (err) {
      console.error('Erro inesperado no signIn:', err)
      return { error: 'Erro inesperado durante o login' }
    }
  }

  // Função de login com Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (err) {
      console.error('Erro inesperado no signInWithGoogle:', err)
      return { error: 'Erro inesperado durante o login com Google' }
    }
  }

  // Função de logout
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setUsuario(null)
      setSession(null)
    } catch (error) {
      console.error('Erro durante logout:', error)
    }
  }

  // Verificações de permissão
  const isAdmin = () => {
    return usuario?.tipo_usuario === 'ADMINISTRADOR'
  }

  const isProfissional = () => {
    return usuario?.tipo_usuario === 'PROFISSIONAL'
  }

  const isAuthenticated = () => {
    return user !== null && session !== null
  }

  // Monitorar mudanças no estado de autenticação
  useEffect(() => {
    // Pegar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (event === 'SIGNED_OUT') {
        setUsuario(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Buscar dados do usuário quando user muda
  useEffect(() => {
    if (user) {
      fetchUsuario()
    }
  }, [user, fetchUsuario])

  // Marcar loading como false após verificações iniciais
  useEffect(() => {
    if (user !== null || session === null) {
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