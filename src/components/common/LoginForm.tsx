'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Google as GoogleIcon,
  ContentCut as ScissorsIcon,
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'

// Schema de validação com Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email deve ter um formato válido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  redirectTo?: string
}

export default function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter()
  const { signIn, signInWithGoogle, loading: authLoading, user, session, isAuthenticated } = useAuth()
  
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // DEBUG: Log estados do LoginForm
  useEffect(() => {
    console.log('[DEBUG LoginForm] Estados atualizados:', {
      user: user?.id || 'null',
      session: session?.access_token ? 'exists' : 'null',
      authLoading,
      isAuthenticated: isAuthenticated(),
      currentUrl: window.location.href
    })
  }, [user, session, authLoading, isAuthenticated])

  // DEBUG: Verificar se usuário já está autenticado
  useEffect(() => {
    console.log('[DEBUG LoginForm] Verificando autenticação para redirecionamento')
    
    if (!authLoading && isAuthenticated()) {
      console.log('[DEBUG LoginForm] Usuário autenticado, redirecionando para:', redirectTo)
      router.push(redirectTo)
    } else {
      console.log('[DEBUG LoginForm] Usuário não autenticado ou ainda carregando')
    }
  }, [authLoading, isAuthenticated, router, redirectTo])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Handler para login com email/senha
  const onSubmit = async (data: LoginFormData) => {
    console.log('[DEBUG LoginForm] onSubmit iniciado para:', data.email)
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await signIn(data.email, data.password)
      
      if (error) {
        console.log('[DEBUG LoginForm] Erro no login:', error)
        setError(error)
      } else {
        console.log('[DEBUG LoginForm] Login bem-sucedido, aguardando redirecionamento automático')
        // Não fazemos router.push aqui, deixamos o useEffect handle
      }
    } catch (err) {
      console.error('[DEBUG LoginForm] Erro inesperado:', err)
      setError('Erro inesperado durante o login')
    } finally {
      setIsLoading(false)
    }
  }

  // Handler para login com Google
  const handleGoogleLogin = async () => {
    console.log('[DEBUG LoginForm] handleGoogleLogin iniciado')
    setIsGoogleLoading(true)
    setError(null)

    try {
      const { error } = await signInWithGoogle()
      
      if (error) {
        console.log('[DEBUG LoginForm] Erro no Google login:', error)
        setError(error)
        setIsGoogleLoading(false)
      } else {
        console.log('[DEBUG LoginForm] Google login redirecionamento iniciado')
        // Se sucesso, o redirecionamento será feito automaticamente pelo Supabase
      }
    } catch (err) {
      console.error('[DEBUG LoginForm] Erro inesperado no Google login:', err)
      setError('Erro inesperado durante o login com Google')
      setIsGoogleLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const isFormLoading = isLoading || isSubmitting || authLoading

  // DEBUG: Se ainda está carregando, mostrar isso
  if (authLoading) {
    console.log('[DEBUG LoginForm] Ainda carregando estado de auth')
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: 'grey.50',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.50',
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          boxShadow: 3,
        }}
      >
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScissorsIcon color="primary" />
              <Typography variant="h5" component="h1" fontWeight="bold">
                Bello System
              </Typography>
            </Box>
          }
          subheader="Faça login para acessar o sistema"
          sx={{ textAlign: 'center', pb: 2 }}
        />
        
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              {...register('email')}
              fullWidth
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={isFormLoading}
              sx={{ mb: 2 }}
            />

            <TextField
              {...register('password')}
              fullWidth
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={isFormLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="alternar visibilidade da senha"
                      onClick={togglePasswordVisibility}
                      edge="end"
                      disabled={isFormLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isFormLoading}
              sx={{ mb: 2, py: 1.5 }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Entrar'
              )}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ou
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={
              isGoogleLoading ? (
                <CircularProgress size={20} />
              ) : (
                <GoogleIcon />
              )
            }
            onClick={handleGoogleLogin}
            disabled={isFormLoading || isGoogleLoading}
            sx={{ py: 1.5 }}
          >
            {isGoogleLoading ? 'Conectando...' : 'Continuar com Google'}
          </Button>

          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 3 }}
          >
            Sistema de gestão para salões de beleza
            <br />
            © 2025 Bello System
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
} 