'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert,
  Divider,
  Paper,
  IconButton,
  InputAdornment
} from '@mui/material'
import { 
  Visibility,
  VisibilityOff,
  Google as GoogleIcon
} from '@mui/icons-material'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/AuthContext'

interface LoginFormData {
  email: string
  password: string
}

interface LoginFormProps {
  redirectTo?: string
}

export default function LoginForm({ redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter()
  const { signIn, signInWithGoogle, isAuthenticated, loading } = useAuth()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  // Verificar se já está autenticado e redirecionar
  useEffect(() => {
    if (!loading && isAuthenticated()) {
      router.push(redirectTo)
    }
  }, [loading, isAuthenticated, router, redirectTo])

  // Função de login com email/senha
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await signIn(data.email, data.password)

      if (error) {
        setError(error)
      }
    } catch (err) {
      setError('Erro inesperado durante o login')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função de login com Google
  const handleGoogleLogin = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await signInWithGoogle()

      if (error) {
        setError(error)
      }
    } catch (err) {
      setError('Erro inesperado durante o login com Google')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  // Se já está autenticado, não mostrar o formulário
  if (isAuthenticated()) {
    return null
  }

  return (
    <Paper 
      elevation={4} 
      sx={{ 
        p: 4, 
        maxWidth: 400, 
        width: '100%',
        mx: 'auto'
      }}
    >
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Bello System
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Entre na sua conta
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          margin="normal"
          {...register('email', {
            required: 'Email é obrigatório',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email inválido',
            },
          })}
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <TextField
          fullWidth
          label="Senha"
          type={showPassword ? 'text' : 'password'}
          margin="normal"
          {...register('password', {
            required: 'Senha é obrigatória',
            minLength: {
              value: 6,
              message: 'Senha deve ter pelo menos 6 caracteres',
            },
          })}
          error={!!errors.password}
          helperText={errors.password?.message}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          size="large"
          disabled={isSubmitting}
          sx={{ mt: 3, mb: 2 }}
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          ou
        </Typography>
      </Divider>

      <Button
        fullWidth
        variant="outlined"
        size="large"
        startIcon={<GoogleIcon />}
        onClick={handleGoogleLogin}
        disabled={isSubmitting}
        sx={{ mb: 2 }}
      >
        {isSubmitting ? 'Conectando...' : 'Continuar com Google'}
      </Button>

      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Sistema para salões de beleza
        </Typography>
      </Box>
    </Paper>
  )
} 