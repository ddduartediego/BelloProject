'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material'
import {
  Add as AddIcon,
  Event as EventIcon,
  CalendarMonth as CalendarIcon,
  List as ListIcon,
  FilterList as FilterIcon,
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon,
  AutoMode as AutoRefreshIcon,
} from '@mui/icons-material'
import { format, addDays, startOfToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Layout from '@/components/common/Layout'
import AgendamentoForm from '@/components/agendamentos/AgendamentoForm'
import AgendamentoCalendar from '@/components/agendamentos/AgendamentoCalendar'
import AgendamentosList from '@/components/agendamentos/AgendamentosList'
import AgendamentoDetails from '@/components/agendamentos/AgendamentoDetails'
import { agendamentosService, profissionaisService } from '@/services'
import { ProfissionalComUsuario } from '@/services/profissionais.service'
import { AgendamentoAdapter, type AgendamentoCompleto } from '@/utils/agendamento-adapter'
import useAutoRefresh from '@/hooks/useAutoRefresh'

type ViewMode = 'calendar' | 'list'
type StatusFilter = 'todos' | 'agendado' | 'confirmado' | 'cancelado' | 'concluido'

export default function AgendamentosPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [formOpen, setFormOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoCompleto | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [profissionais, setProfissionais] = useState<ProfissionalComUsuario[]>([])
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false)
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [profissionalFilter, setProfissionalFilter] = useState<string>('todos')
  const [currentDate, setCurrentDate] = useState(startOfToday())
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Estatísticas reais
  const [stats, setStats] = useState({
    hoje: 0,
    amanha: 0,
    semana: 0,
    confirmados: 0
  })

  // Função para mostrar notificação
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  // Função para fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Função para refresh da lista
  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1)
    if (autoRefreshEnabled) {
      showSnackbar('Dados atualizados automaticamente', 'info')
    }
  }, [autoRefreshEnabled])

  // Hook de auto-refresh
  const { isRunning } = useAutoRefresh({
    interval: 30000, // 30 segundos
    enabled: autoRefreshEnabled,
    onRefresh: refreshData
  })

  // Carregar profissionais para filtros
  useEffect(() => {
    const loadProfissionais = async () => {
      try {
        const response = await profissionaisService.getAll({ page: 1, limit: 100 })
        if (response.data) {
          setProfissionais(response.data.data)
        }
      } catch (error) {
        console.error('Erro ao carregar profissionais:', error)
      }
    }

    loadProfissionais()
  }, [])

  // Carregar estatísticas reais
  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        const response = await agendamentosService.getEstatisticas()
        
        if (response.data) {
          setStats({
            hoje: response.data.hojeTotal,
            amanha: 0, // Calculará separadamente se necessário
            semana: response.data.proximaSemana,
            confirmados: response.data.confirmados
          })
        } else {
          console.error('Erro ao carregar estatísticas:', response.error)
          showSnackbar('Erro ao carregar estatísticas', 'error')
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        showSnackbar('Erro ao carregar estatísticas', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [refreshKey])

  // Função para abrir formulário de novo agendamento
  const handleNovoAgendamento = () => {
    setSelectedAgendamento(null)
    setFormOpen(true)
  }

  // Função para abrir formulário de edição
  const handleEditAgendamento = (agendamento: AgendamentoCompleto) => {
    setSelectedAgendamento(agendamento)
    setFormOpen(true)
  }

  // Função para abrir detalhes
  const handleViewDetails = (agendamento: AgendamentoCompleto) => {
    setSelectedAgendamento(agendamento)
    setDetailsOpen(true)
  }

  // Função para salvar agendamento
  const handleSaveAgendamento = async (data: any) => {
    try {
      setLoading(true)
      
      if (selectedAgendamento) {
        // Editar agendamento existente
        const updateData = AgendamentoAdapter.toBackend(data)
        const response = await agendamentosService.update({
          id: selectedAgendamento.id,
          ...updateData
        })
        
        if (response.data) {
          showSnackbar('Agendamento atualizado com sucesso!', 'success')
          refreshData()
          setFormOpen(false)
        } else {
          throw new Error(response.error || 'Erro ao atualizar agendamento')
        }
      } else {
        // Criar novo agendamento
        const createData = AgendamentoAdapter.toBackend(data)
        const response = await agendamentosService.create(createData)
        
        if (response.data) {
          showSnackbar('Agendamento criado com sucesso!', 'success')
          refreshData()
          setFormOpen(false)
        } else {
          throw new Error(response.error || 'Erro ao criar agendamento')
        }
      }
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
      showSnackbar(
        `Erro ao ${selectedAgendamento ? 'atualizar' : 'criar'} agendamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  // Função para refresh manual
  const handleManualRefresh = () => {
    refreshData()
    showSnackbar('Dados atualizados!', 'success')
  }

  // Toggle auto-refresh
  const handleAutoRefreshToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRefreshEnabled(event.target.checked)
    if (event.target.checked) {
      showSnackbar('Refresh automático ativado (30s)', 'info')
    } else {
      showSnackbar('Refresh automático desativado', 'info')
    }
  }

  // Handlers para filtros
  const handleStatusFilterChange = (event: SelectChangeEvent<StatusFilter>) => {
    setStatusFilter(event.target.value as StatusFilter)
  }

  const handleProfissionalFilterChange = (event: SelectChangeEvent<string>) => {
    setProfissionalFilter(event.target.value)
  }

  // Handler para mudança de view
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  // Função para ir para hoje
  const handleGoToday = () => {
    setCurrentDate(startOfToday())
  }

  // Função para pular para uma data específica
  const handleDateJump = (date: Date) => {
    setCurrentDate(date)
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      'agendado': '#2196F3',
      'confirmado': '#4CAF50',
      'cancelado': '#F44336',
      'concluido': '#9E9E9E'
    }
    return colorMap[status as keyof typeof colorMap] || '#9E9E9E'
  }

  const getStatusLabel = (status: string) => {
    const labelMap = {
      'agendado': 'Agendado',
      'confirmado': 'Confirmado',
      'cancelado': 'Cancelado',
      'concluido': 'Concluído'
    }
    return labelMap[status as keyof typeof labelMap] || status
  }

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header da página */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EventIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Agenda
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Gerencie todos os agendamentos do seu salão
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<TodayIcon />}
              onClick={handleGoToday}
              sx={{ textTransform: 'none' }}
            >
              Hoje
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNovoAgendamento}
              size="large"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                px: 3,
              }}
            >
              Novo Agendamento
            </Button>
          </Box>
        </Box>

        {/* Estatísticas rápidas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TodayIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {loading ? '...' : stats.hoje}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Agendamentos hoje
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {loading ? '...' : stats.amanha}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Agendamentos amanhã
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <EventIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  {loading ? '...' : stats.semana}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Esta semana
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                  <Chip 
                    label="Confirmados" 
                    sx={{ 
                      bgcolor: getStatusColor('confirmado'),
                      color: 'white',
                      fontWeight: 'bold'
                    }} 
                  />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: getStatusColor('confirmado') }}>
                  {loading ? '...' : stats.confirmados}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Esta semana
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controles e filtros */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              {/* Toggle de visualização */}
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant={viewMode === 'calendar' ? 'contained' : 'outlined'}
                    startIcon={<CalendarIcon />}
                    onClick={() => handleViewModeChange('calendar')}
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    Calendário
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'contained' : 'outlined'}
                    startIcon={<ListIcon />}
                    onClick={() => handleViewModeChange('list')}
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    Lista
                  </Button>
                </Box>
              </Grid>

              {/* Filtros */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={handleStatusFilterChange}
                  >
                    <MenuItem value="todos">Todos os status</MenuItem>
                    <MenuItem value="agendado">Agendado</MenuItem>
                    <MenuItem value="confirmado">Confirmado</MenuItem>
                    <MenuItem value="cancelado">Cancelado</MenuItem>
                    <MenuItem value="concluido">Concluído</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Profissional</InputLabel>
                  <Select
                    value={profissionalFilter}
                    label="Profissional"
                    onChange={handleProfissionalFilterChange}
                  >
                    <MenuItem value="todos">Todos os profissionais</MenuItem>
                    {profissionais.map((profissional) => (
                      <MenuItem key={profissional.id} value={profissional.id}>
                        {profissional.usuario.nome_completo}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Conteúdo principal - Calendar ou Lista */}
        {viewMode === 'calendar' ? (
          <AgendamentoCalendar
            currentDate={currentDate}
            onDateChange={handleDateJump}
            onEventClick={handleViewDetails}
            onEventEdit={handleEditAgendamento}
            statusFilter={statusFilter}
            profissionalFilter={profissionalFilter}
            refreshKey={refreshKey}
          />
        ) : (
          <AgendamentosList
            onView={handleViewDetails}
            onEdit={handleEditAgendamento}
            statusFilter={statusFilter}
            profissionalFilter={profissionalFilter}
            refreshKey={refreshKey}
          />
        )}

        {/* Formulário de agendamento */}
        <AgendamentoForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false)
            setSelectedAgendamento(null)
          }}
          onSave={handleSaveAgendamento}
          agendamento={selectedAgendamento || undefined}
          loading={loading}
        />

        {/* Detalhes do agendamento */}
        <AgendamentoDetails
          open={detailsOpen}
          onClose={() => {
            setDetailsOpen(false)
            setSelectedAgendamento(null)
          }}
          agendamento={selectedAgendamento}
          onEdit={handleEditAgendamento}
          onRefresh={refreshData}
        />

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  )
} 