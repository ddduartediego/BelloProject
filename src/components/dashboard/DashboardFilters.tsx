'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Button,
  Divider,
  IconButton,
  Collapse,
  Stack,
  TextField,
} from '@mui/material'
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Compare as CompareIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { ptBR } from 'date-fns/locale'
import { useDashboardFilters, PeriodoPreset, TipoMetrica, ModalizacaoComparacao } from '@/contexts/DashboardFiltersContext'
import { profissionaisService, clientesService } from '@/services'

interface Profissional {
  id: string
  nome: string
}

interface Cliente {
  id: string
  nome: string
}

interface DashboardFiltersProps {
  onFiltersChange?: () => void
  compact?: boolean
}

export default function DashboardFilters({ 
  onFiltersChange, 
  compact = false 
}: DashboardFiltersProps) {
  const {
    filters,
    updateFilters,
    resetFilters,
    getPeriodoLabel,
    getComparacaoLabel,
    isValidPeriod
  } = useDashboardFilters()

  const [expanded, setExpanded] = useState(!compact)
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loadingProfissionais, setLoadingProfissionais] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(false)

  // Carregar profissionais
  useEffect(() => {
    const carregarProfissionais = async () => {
      try {
        setLoadingProfissionais(true)
        const { data } = await profissionaisService.getAll({ page: 1, limit: 100 })
        if (data?.data) {
          setProfissionais(data.data.map(p => ({
            id: p.id,
            nome: p.usuario?.nome_completo || 'Profissional sem nome'
          })))
        }
      } catch (err) {
        console.error('Erro ao carregar profissionais:', err)
      } finally {
        setLoadingProfissionais(false)
      }
    }

    carregarProfissionais()
  }, [])

  // Carregar clientes (top 50 mais recentes)
  useEffect(() => {
    const carregarClientes = async () => {
      try {
        setLoadingClientes(true)
        const { data } = await clientesService.getAll({ page: 1, limit: 50 })
        if (data?.data) {
          setClientes(data.data.map(c => ({
            id: c.id,
            nome: c.nome
          })))
        }
      } catch (err) {
        console.error('Erro ao carregar clientes:', err)
      } finally {
        setLoadingClientes(false)
      }
    }

    carregarClientes()
  }, [])

  // Notificar mudanças nos filtros
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange()
    }
  }, [filters, onFiltersChange])

  const handlePeriodoChange = (periodo: PeriodoPreset) => {
    updateFilters({ periodoPreset: periodo })
  }

  const handleDataCustomizadaChange = (campo: 'dataInicio' | 'dataFim', data: any) => {
    if (!data) return
    
    // Converter para Date de forma segura
    let dataDate: Date
    if (data instanceof Date) {
      dataDate = data
    } else if (data && typeof data.toDate === 'function') {
      dataDate = data.toDate()
    } else if (data && typeof data === 'string') {
      dataDate = new Date(data)
    } else {
      return
    }
    
    const novoCustomizado = {
      ...filters.periodoCustomizado,
      [campo]: dataDate
    }
    
    if (isValidPeriod(novoCustomizado.dataInicio, novoCustomizado.dataFim)) {
      updateFilters({ 
        periodoPreset: 'personalizado',
        periodoCustomizado: novoCustomizado 
      })
    }
  }

  const handleProfissionalChange = (profissionalId: string) => {
    updateFilters({ 
      profissionalSelecionado: profissionalId === 'todos' ? null : profissionalId 
    })
  }

  const handleClienteChange = (clienteId: string) => {
    updateFilters({ 
      clienteSelecionado: clienteId === 'todos' ? null : clienteId 
    })
  }

  const handleTipoMetricaChange = (tipo: TipoMetrica) => {
    updateFilters({ tipoMetrica: tipo })
  }

  const handleComparacaoChange = (ativo: boolean) => {
    updateFilters({ exibirComparacao: ativo })
  }

  const handleTipoComparacaoChange = (tipo: ModalizacaoComparacao) => {
    updateFilters({ tipoComparacao: tipo })
  }

  const handleVisualizacaoChange = (campo: 'agruparPorSemana' | 'exibirTendencias', valor: boolean) => {
    updateFilters({ [campo]: valor })
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.profissionalSelecionado) count++
    if (filters.clienteSelecionado) count++
    if (filters.tipoMetrica !== 'todas') count++
    if (filters.periodoPreset !== 'este-mes') count++
    return count
  }

  const renderPeriodoCustomizado = () => (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={6}>
          <DatePicker
            label="Data Início"
            value={filters.periodoCustomizado.dataInicio}
            onChange={(data) => handleDataCustomizadaChange('dataInicio', data)}
            maxDate={new Date()}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true
              }
            }}
          />
        </Grid>
        <Grid item xs={6}>
          <DatePicker
            label="Data Fim"
            value={filters.periodoCustomizado.dataFim}
            onChange={(data) => handleDataCustomizadaChange('dataFim', data)}
            maxDate={new Date()}
            minDate={filters.periodoCustomizado.dataInicio}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: true
              }
            }}
          />
        </Grid>
      </Grid>
    </LocalizationProvider>
  )

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        {/* Header dos filtros */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Filtros do Dashboard
            </Typography>
            {getActiveFiltersCount() > 0 && (
              <Chip 
                label={`${getActiveFiltersCount()} ativos`}
                size="small"
                color="primary"
              />
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              onClick={resetFilters}
              disabled={getActiveFiltersCount() === 0}
            >
              Limpar
            </Button>
            
            {compact && (
              <IconButton
                onClick={() => setExpanded(!expanded)}
                size="small"
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Resumo do período atual */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', borderRadius: 2, color: 'primary.contrastText' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <CalendarIcon />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                Período: {getPeriodoLabel()}
              </Typography>
              {getComparacaoLabel() && (
                <Typography variant="caption">
                  Comparando com: {getComparacaoLabel()}
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        <Collapse in={expanded}>
          <Grid container spacing={3}>
            {/* Filtros de Período */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" />
                Período
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Período</InputLabel>
                <Select
                  value={filters.periodoPreset}
                  onChange={(e) => handlePeriodoChange(e.target.value as PeriodoPreset)}
                  label="Período"
                >
                  <MenuItem value="hoje">Hoje</MenuItem>
                  <MenuItem value="ontem">Ontem</MenuItem>
                  <MenuItem value="ultima-semana">Última Semana</MenuItem>
                  <MenuItem value="este-mes">Este Mês</MenuItem>
                  <MenuItem value="mes-passado">Mês Passado</MenuItem>
                  <MenuItem value="trimestre">Este Trimestre</MenuItem>
                  <MenuItem value="personalizado">Personalizado</MenuItem>
                </Select>
              </FormControl>

              {filters.periodoPreset === 'personalizado' && renderPeriodoCustomizado()}
            </Grid>

            {/* Filtros de Entidades */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon fontSize="small" />
                Entidades
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Profissional</InputLabel>
                <Select
                  value={filters.profissionalSelecionado || 'todos'}
                  onChange={(e) => handleProfissionalChange(e.target.value)}
                  label="Profissional"
                  disabled={loadingProfissionais}
                >
                  <MenuItem value="todos">Todos os Profissionais</MenuItem>
                  {profissionais.map(prof => (
                    <MenuItem key={prof.id} value={prof.id}>
                      {prof.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={filters.clienteSelecionado || 'todos'}
                  onChange={(e) => handleClienteChange(e.target.value)}
                  label="Cliente"
                  disabled={loadingClientes}
                >
                  <MenuItem value="todos">Todos os Clientes</MenuItem>
                  {clientes.map(cliente => (
                    <MenuItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Filtros de Métricas */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AnalyticsIcon fontSize="small" />
                Métricas
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Tipo de Métrica</InputLabel>
                <Select
                  value={filters.tipoMetrica}
                  onChange={(e) => handleTipoMetricaChange(e.target.value as TipoMetrica)}
                  label="Tipo de Métrica"
                >
                  <MenuItem value="todas">Todas as Métricas</MenuItem>
                  <MenuItem value="vendas">Apenas Vendas</MenuItem>
                  <MenuItem value="agendamentos">Apenas Agendamentos</MenuItem>
                  <MenuItem value="performance">Apenas Performance</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Configurações de Comparação */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CompareIcon fontSize="small" />
                Comparação
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={filters.exibirComparacao}
                    onChange={(e) => handleComparacaoChange(e.target.checked)}
                    size="small"
                  />
                }
                label="Exibir comparação"
                sx={{ mb: 1 }}
              />

              {filters.exibirComparacao && (
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Tipo de Comparação</InputLabel>
                  <Select
                    value={filters.tipoComparacao}
                    onChange={(e) => handleTipoComparacaoChange(e.target.value as ModalizacaoComparacao)}
                    label="Tipo de Comparação"
                  >
                    <MenuItem value="periodo-anterior">Período Anterior</MenuItem>
                    <MenuItem value="mesmo-periodo-ano-anterior">Mesmo Período (Ano Anterior)</MenuItem>
                    <MenuItem value="sem-comparacao">Sem Comparação</MenuItem>
                  </Select>
                </FormControl>
              )}

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={filters.agruparPorSemana}
                    onChange={(e) => handleVisualizacaoChange('agruparPorSemana', e.target.checked)}
                    size="small"
                  />
                }
                label="Agrupar por semana"
                sx={{ display: 'block', mb: 1 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={filters.exibirTendencias}
                    onChange={(e) => handleVisualizacaoChange('exibirTendencias', e.target.checked)}
                    size="small"
                  />
                }
                label="Exibir tendências"
                sx={{ display: 'block' }}
              />
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  )
} 