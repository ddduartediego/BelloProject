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
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material'
import { 
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  LocalAtm as CashIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/common/Layout'
import LoadingScreen from '@/components/common/LoadingScreen'
import VendasChart from '@/components/dashboard/VendasChart'
import AgendaHoje from '@/components/dashboard/AgendaHoje'
import AlertasImportantes from '@/components/dashboard/AlertasImportantes'
import MetricasPerformance from '@/components/dashboard/MetricasPerformance'
import HorariosPico from '@/components/dashboard/HorariosPico'
import useDashboardMetrics from '@/hooks/useDashboardMetrics'
import { DashboardFiltersProvider, useDashboardFilters } from '@/contexts/DashboardFiltersContext'
import DashboardFilters from '@/components/dashboard/DashboardFilters'

export default function DashboardPage() {
  return (
    <DashboardFiltersProvider>
      <DashboardContent />
    </DashboardFiltersProvider>
  )
}

function DashboardContent() {
  const router = useRouter()
  const { user, usuario, isAuthenticated, loading } = useAuth()
  const { filters, periodoAtual, periodoComparacao } = useDashboardFilters()
  const { 
    metrics, 
    loading: metricsLoading, 
    error: metricsError, 
    refreshMetrics 
  } = useDashboardMetrics({
    filters,
    periodoAtual,
    periodoComparacao
  })

  // Verificar autenticação e redirecionar se necessário
  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return <LoadingScreen message="Carregando dashboard..." />
  }

  if (!isAuthenticated()) {
    return null
  }

  // Função para formatar valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <Layout>
      <Box>
        {/* Header da página */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Visão geral do seu salão de beleza
            </Typography>
          </Box>
          <IconButton 
            onClick={refreshMetrics} 
            disabled={metricsLoading}
            title="Atualizar métricas"
          >
            {metricsLoading ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Box>

        {/* Filtros do Dashboard */}
        <DashboardFilters onFiltersChange={refreshMetrics} />

        {/* Erro ao carregar métricas */}
        {metricsError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Erro ao carregar métricas: {metricsError}
          </Alert>
        )}

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
                      {metricsLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        formatCurrency(metrics?.vendas?.totalDia || 0)
                      )}
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
                      {metricsLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        metrics?.agendamentos?.hojeTotal || 0
                      )}
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
                      {metricsLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        metrics?.clientes?.total || 0
                      )}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        Status:
                      </Typography>
                      <Chip 
                        label="ABERTO" 
                        color="success" 
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>
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
            <VendasChart metrics={metrics} />
          </Grid>

          {/* Informações do usuário e métricas */}
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
                      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Tipo:</strong>
                        </Typography>
                        <Chip 
                          label={usuario.tipo_usuario} 
                          size="small" 
                          color={usuario.tipo_usuario === 'ADMINISTRADOR' ? 'primary' : 'secondary'}
                        />
                      </Box>
                    </>
                  )}
                </Box>

                {/* Métricas adicionais */}
                {metrics && (
                  <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" fontWeight="medium" gutterBottom>
                      Resumo Geral:
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" display="block">
                        • Profissionais: {metrics.profissionais.total}
                      </Typography>
                      <Typography variant="caption" display="block">
                        • Serviços: {metrics.servicos.total}
                      </Typography>
                      <Typography variant="caption" display="block">
                        • Novos clientes este mês: {metrics.clientes.novosEsseMes}
                      </Typography>
                      <Typography variant="caption" display="block">
                        • Agendamentos pendentes: {metrics.agendamentos.pendentes}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight="medium">
                    Status do Sistema:
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip label="Dashboard Ativo" color="success" size="small" sx={{ mr: 1, mb: 1 }} />
                    <Chip label="Dados Reais" color="success" size="small" sx={{ mr: 1, mb: 1 }} />
                    <Chip label="Métricas ON" color="info" size="small" sx={{ mr: 1, mb: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Nova Seção: Métricas de Performance */}
          <Grid item xs={12}>
            <MetricasPerformance metrics={metrics} />
          </Grid>

          {/* Análise de Horários de Pico */}
          <Grid item xs={12}>
            <HorariosPico metrics={metrics} />
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
                  Status da Integração Supabase
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Funcionalidades já integradas com dados reais do banco
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                      <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" fontWeight="medium">
                        Clientes
                      </Typography>
                      <Typography variant="caption">
                        ✅ INTEGRADO
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                      <CalendarIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" fontWeight="medium">
                        Agendamentos
                      </Typography>
                      <Typography variant="caption">
                        ✅ INTEGRADO
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                      <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" fontWeight="medium">
                        Comandas
                      </Typography>
                      <Typography variant="caption">
                        🔄 EM PROGRESSO
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
                      <CashIcon sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" fontWeight="medium">
                        Caixa
                      </Typography>
                      <Typography variant="caption">
                        🔄 EM PROGRESSO
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