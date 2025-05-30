'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Grid,
  Paper,
  Chip,
} from '@mui/material'
import { 
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  LocalAtm as CashIcon,
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/common/Layout'
import LoadingScreen from '@/components/common/LoadingScreen'
import VendasChart from '@/components/dashboard/VendasChart'
import AgendaHoje from '@/components/dashboard/AgendaHoje'
import AlertasImportantes from '@/components/dashboard/AlertasImportantes'

export default function DashboardPage() {
  const router = useRouter()
  const { user, usuario, isAuthenticated, loading } = useAuth()

  // DEBUG: Log dos estados da página dashboard
  useEffect(() => {
    console.log('[DEBUG DashboardPage] Estados atualizados:', {
      user: user?.id || 'null',
      usuario: usuario?.id || 'null',
      isAuthenticated: isAuthenticated(),
      loading,
      currentUrl: window.location.href
    })
  }, [user, usuario, isAuthenticated, loading])

  // Verificar autenticação e redirecionar se necessário
  useEffect(() => {
    console.log('[DEBUG DashboardPage] Verificando autenticação')
    console.log('[DEBUG DashboardPage] loading:', loading, 'isAuthenticated:', isAuthenticated())
    
    if (!loading && !isAuthenticated()) {
      console.log('[DEBUG DashboardPage] Usuário não autenticado, redirecionando para login')
      router.push('/login')
    } else if (!loading && isAuthenticated()) {
      console.log('[DEBUG DashboardPage] Usuário autenticado, permanecendo no dashboard')
    }
  }, [loading, isAuthenticated, router])

  // DEBUG: Log durante renderização
  console.log('[DEBUG DashboardPage] Renderizando - loading:', loading, 'isAuthenticated:', isAuthenticated())

  if (loading) {
    console.log('[DEBUG DashboardPage] Mostrando LoadingScreen')
    return <LoadingScreen message="Carregando dashboard..." />
  }

  if (!isAuthenticated()) {
    console.log('[DEBUG DashboardPage] Não autenticado, retornando null')
    return null
  }

  console.log('[DEBUG DashboardPage] Renderizando dashboard completo')

  return (
    <Layout>
      <Box>
        {/* Header da página */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visão geral do seu salão de beleza
          </Typography>
        </Box>

        {/* Cards de resumo */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      p: 1,
                      borderRadius: 2,
                    }}
                  >
                    <TrendingUpIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      R$ 2.850,00
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vendas Hoje
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      bgcolor: 'secondary.main',
                      color: 'secondary.contrastText',
                      p: 1,
                      borderRadius: 2,
                    }}
                  >
                    <CalendarIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      12
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Agendamentos Hoje
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      bgcolor: 'success.main',
                      color: 'success.contrastText',
                      p: 1,
                      borderRadius: 2,
                    }}
                  >
                    <PeopleIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      47
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clientes Ativos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      bgcolor: 'info.main',
                      color: 'info.contrastText',
                      p: 1,
                      borderRadius: 2,
                    }}
                  >
                    <CashIcon />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      <Chip 
                        label="ABERTO" 
                        color="success" 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status do Caixa
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Conteúdo principal - Gráficos e informações */}
        <Grid container spacing={3}>
          {/* Gráfico de vendas */}
          <Grid item xs={12} lg={8}>
            <VendasChart />
          </Grid>

          {/* Informações do usuário */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Informações do Sistema
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Usuário:</strong> {user?.email}
                  </Typography>
                  {usuario && (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <strong>Nome:</strong> {usuario.nome_completo}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        <strong>Tipo:</strong> 
                        <Chip 
                          label={usuario.tipo_usuario} 
                          size="small" 
                          color={usuario.tipo_usuario === 'ADMINISTRADOR' ? 'primary' : 'secondary'}
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </>
                  )}
                </Box>

                <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Status do Sistema:
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip label="Dashboard Ativo" color="success" size="small" sx={{ mr: 1, mb: 1 }} />
                    <Chip label="Gráficos OK" color="success" size="small" sx={{ mr: 1, mb: 1 }} />
                    <Chip label="Alertas ON" color="info" size="small" sx={{ mr: 1, mb: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Agenda do dia */}
          <Grid item xs={12} md={6}>
            <AgendaHoje />
          </Grid>

          {/* Alertas importantes */}
          <Grid item xs={12} md={6}>
            <AlertasImportantes />
          </Grid>

          {/* Próximas funcionalidades */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Próximas Funcionalidades do MVP
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Funcionalidades que serão implementadas nas próximas fases do desenvolvimento
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" fontWeight="medium">
                        Gestão de Clientes
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        FASE 5
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <CalendarIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" fontWeight="medium">
                        Sistema de Agendamentos
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        FASE 7
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <TrendingUpIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" fontWeight="medium">
                        Controle de Comandas
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        FASE 8
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <CashIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" fontWeight="medium">
                        Gestão de Caixa
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        FASE 9
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  )
} 