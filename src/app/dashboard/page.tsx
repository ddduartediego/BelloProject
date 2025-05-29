'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material'
import { 
  Logout as LogoutIcon,
  ContentCut as ScissorsIcon,
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardPage() {
  const router = useRouter()
  const { user, usuario, isAuthenticated, signOut, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  if (!isAuthenticated()) {
    return null
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <ScissorsIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Bello System
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Olá, {usuario?.nome_completo || user?.email}
          </Typography>
          <IconButton
            size="large"
            aria-label="logout"
            color="inherit"
            onClick={handleLogout}
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Bem-vindo ao Sistema Bello!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Este é o MVP do sistema de gestão para salões de beleza.
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Usuário:</strong> {user?.email}
              </Typography>
              {usuario && (
                <>
                  <Typography variant="body2">
                    <strong>Nome:</strong> {usuario.nome_completo}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tipo:</strong> {usuario.tipo_usuario}
                  </Typography>
                </>
              )}
            </Box>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Próximas Funcionalidades
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Gestão de Clientes<br />
            • Agendamentos<br />
            • Comandas<br />
            • Controle de Caixa<br />
            • Relatórios
          </Typography>
        </Box>
      </Box>
    </Box>
  )
} 