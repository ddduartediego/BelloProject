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
      const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar dados do usuário:', error.message)
        return
      }

      setUsuario(data || null)
    } catch {
      console.error('Erro inesperado ao buscar usuário')
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
    } catch {
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
    } catch {
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
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Pegar sessão inicial
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)
        
        if (!session) {
          setLoading(false)
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state change:', event, session?.user?.email)
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (event === 'SIGNED_OUT') {
        setUsuario(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Buscar dados do usuário quando user muda
  useEffect(() => {
    if (user) {
      fetchUsuario()
    } else {
      setUsuario(null)
    }
  }, [user, fetchUsuario])

  // Marcar loading como false após verificações iniciais
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user === null || (user && (usuario !== null || usuario === null))) {
        setLoading(false)
      }
    }, 1000) // Aguarda 1 segundo para processos de inicialização

    return () => clearTimeout(timer)
  }, [user, usuario])

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