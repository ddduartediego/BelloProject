import React, { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  IconButton,
  Collapse,
  Divider,
  Grid,
  InputAdornment,
  Chip
} from '@mui/material'
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  TrendingUp as MetaIcon,
  Schedule as PeriodoIcon,
  MonetizationOn as MoneyIcon
} from '@mui/icons-material'
import { FiltroAvancado, DashboardConfig } from '@/types/dashboard'

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

interface FiltrosExecutivosProps {
  periodo: FiltroAvancado
  metaDiaria?: number
  config: DashboardConfig
  onPeriodoChange: (novoPeriodo: Partial<FiltroAvancado>) => void
  onMetaChange: (meta: number) => void
  onConfigChange: (novaConfig: Partial<DashboardConfig>) => void
  loading?: boolean
}

interface PeriodoPresetExecutivo {
  label: string
  icon: string
  valor: () => FiltroAvancado
  descricao: string
}

// ============================================================================
// PERÍODOS PRÉ-DEFINIDOS EXECUTIVOS
// ============================================================================

const PERIODOS_EXECUTIVOS: PeriodoPresetExecutivo[] = [
  {
    label: 'Hoje',
    icon: '📅',
    descricao: 'Métricas do dia atual',
    valor: () => {
      const hoje = new Date()
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      return {
        inicio: inicio.toISOString(),
        fim: hoje.toISOString()
      }
    }
  },
  {
    label: 'Ontem',
    icon: '⏮️',
    descricao: 'Métricas do dia anterior',
    valor: () => {
      const ontem = new Date()
      ontem.setDate(ontem.getDate() - 1)
      const inicio = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate())
      const fim = new Date(inicio)
      fim.setHours(23, 59, 59, 999)
      return {
        inicio: inicio.toISOString(),
        fim: fim.toISOString()
      }
    }
  },
  {
    label: 'Esta semana',
    icon: '📊',
    descricao: 'Do domingo até agora',
    valor: () => {
      const hoje = new Date()
      const diaSemana = hoje.getDay()
      const inicio = new Date(hoje)
      inicio.setDate(hoje.getDate() - diaSemana)
      inicio.setHours(0, 0, 0, 0)
      return {
        inicio: inicio.toISOString(),
        fim: hoje.toISOString()
      }
    }
  },
  {
    label: 'Últimos 7 dias',
    icon: '📈',
    descricao: 'Últimos 7 dias completos',
    valor: () => {
      const fim = new Date()
      const inicio = new Date()
      inicio.setDate(inicio.getDate() - 7)
      return {
        inicio: inicio.toISOString(),
        fim: fim.toISOString()
      }
    }
  },
  {
    label: 'Este mês',
    icon: '🗓️',
    descricao: 'Do 1º dia do mês até agora',
    valor: () => {
      const hoje = new Date()
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      return {
        inicio: inicio.toISOString(),
        fim: hoje.toISOString()
      }
    }
  },
  {
    label: 'Últimos 30 dias',
    icon: '📉',
    descricao: 'Últimos 30 dias completos',
    valor: () => {
      const fim = new Date()
      const inicio = new Date()
      inicio.setDate(inicio.getDate() - 30)
      return {
        inicio: inicio.toISOString(),
        fim: fim.toISOString()
      }
    }
  }
]

// Metas pré-definidas
const METAS_SUGERIDAS = [
  { label: 'R$ 1.000', valor: 1000 },
  { label: 'R$ 2.500', valor: 2500 },
  { label: 'R$ 5.000', valor: 5000 },
  { label: 'R$ 7.500', valor: 7500 },
  { label: 'R$ 10.000', valor: 10000 },
  { label: 'R$ 15.000', valor: 15000 }
]

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const FiltrosExecutivos: React.FC<FiltrosExecutivosProps> = ({
  periodo,
  metaDiaria,
  config,
  onPeriodoChange,
  onMetaChange,
  onConfigChange,
  loading = false
}) => {
  const [expandido, setExpandido] = useState(false)
  const [metaLocal, setMetaLocal] = useState(metaDiaria?.toString() || '')

  // ============================================================================
  // CÁLCULOS E FORMATAÇÃO
  // ============================================================================

  const calcularDiasPeriodo = (): number => {
    const inicio = new Date(periodo.inicio)
    const fim = new Date(periodo.fim)
    const diffTime = Math.abs(fim.getTime() - inicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const formatarDataInput = (isoString: string): string => {
    return new Date(isoString).toISOString().slice(0, 16)
  }

  const formatarPeriodoAtual = (): string => {
    const inicio = new Date(periodo.inicio)
    const fim = new Date(periodo.fim)
    const dias = calcularDiasPeriodo()
    
    const isHoje = inicio.toDateString() === new Date().toDateString() && 
                   fim.getDate() === new Date().getDate()
    
    if (isHoje) return 'Hoje'
    if (dias === 1) return inicio.toLocaleDateString('pt-BR')
    return `${dias} dias`
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePeriodoPreset = (preset: PeriodoPresetExecutivo) => {
    const novosPeriodo = preset.valor()
    onPeriodoChange(novosPeriodo)
  }

  const handleDataChange = (campo: 'inicio' | 'fim', valor: string) => {
    onPeriodoChange({ [campo]: new Date(valor).toISOString() })
  }

  const handleMetaChange = (valor: string) => {
    setMetaLocal(valor)
    const numeroMeta = parseFloat(valor.replace(',', '.'))
    if (!isNaN(numeroMeta) && numeroMeta > 0) {
      onMetaChange(numeroMeta)
    }
  }

  const handleMetaSugerida = (valor: number) => {
    setMetaLocal(valor.toString())
    onMetaChange(valor)
  }

  const handleLimparFiltros = () => {
    // Reset para hoje
    const hoje = PERIODOS_EXECUTIVOS[0].valor()
    onPeriodoChange(hoje)
    setMetaLocal('')
    onMetaChange(0)
  }

  const handleAutoRefreshChange = (enabled: boolean) => {
    onConfigChange({
      autoRefresh: {
        ...config.autoRefresh,
        enabled
      }
    })
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        mb: 3, 
        borderRadius: 2,
        border: '1px solid #e3f2fd',
        background: 'linear-gradient(145deg, #fafafa 0%, #f5f5f5 100%)'
      }}
    >
      {/* Header Compacto */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: expandido ? '1px solid #e0e0e0' : 'none',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.04)'
          }
        }}
        onClick={() => setExpandido(!expandido)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FilterIcon color="primary" />
          <Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              Filtros Executivos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatarPeriodoAtual()} • {metaDiaria ? `Meta: R$ ${metaDiaria.toLocaleString('pt-BR')}` : 'Sem meta'}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={`${calcularDiasPeriodo()} dias`}
            size="small"
            color="primary"
            variant="outlined"
          />
          <IconButton size="small">
            {expandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Conteúdo Expandido */}
      <Collapse in={expandido}>
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            
            {/* Coluna 1: Períodos */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PeriodoIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Período de Análise
                </Typography>
              </Box>
              
              {/* Períodos Pré-definidos */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Períodos Rápidos:
                </Typography>
                <Grid container spacing={1}>
                  {PERIODOS_EXECUTIVOS.map((preset, index) => (
                    <Grid item xs={6} sm={4} key={index}>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={() => handlePeriodoPreset(preset)}
                        disabled={loading}
                        startIcon={<span>{preset.icon}</span>}
                        sx={{
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          height: 40
                        }}
                      >
                        <Box>
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {preset.label}
                          </Typography>
                        </Box>
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Período Personalizado */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Período Personalizado:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <TextField
                    label="Data/Hora Início"
                    type="datetime-local"
                    value={formatarDataInput(periodo.inicio)}
                    onChange={(e) => handleDataChange('inicio', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    disabled={loading}
                    fullWidth
                  />
                  
                  <TextField
                    label="Data/Hora Fim"
                    type="datetime-local"
                    value={formatarDataInput(periodo.fim)}
                    onChange={(e) => handleDataChange('fim', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    disabled={loading}
                    fullWidth
                  />
                </Box>
              </Box>
            </Grid>

            {/* Coluna 2: Metas e Configurações */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <MetaIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Metas e Configurações
                </Typography>
              </Box>

              {/* Meta Diária */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Meta de Vendas:
                </Typography>
                
                {/* Metas Sugeridas */}
                <Box sx={{ mb: 2 }}>
                  <Grid container spacing={1}>
                    {METAS_SUGERIDAS.map((meta, index) => (
                      <Grid item xs={4} key={index}>
                        <Button
                          variant={metaDiaria === meta.valor ? "contained" : "outlined"}
                          size="small"
                          fullWidth
                          onClick={() => handleMetaSugerida(meta.valor)}
                          disabled={loading}
                          sx={{ fontSize: '0.7rem' }}
                        >
                          {meta.label}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Meta Personalizada */}
                <TextField
                  label="Meta Personalizada"
                  type="number"
                  value={metaLocal}
                  onChange={(e) => handleMetaChange(e.target.value)}
                  size="small"
                  disabled={loading}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  placeholder="Digite o valor da meta"
                />
              </Box>

              {/* Configurações de Auto-refresh */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Atualização Automática:
                </Typography>
                <FormControl size="small" fullWidth>
                  <InputLabel>Intervalo</InputLabel>
                  <Select
                    value={config.autoRefresh.enabled ? config.autoRefresh.interval : 0}
                    label="Intervalo"
                    onChange={(e) => {
                      const interval = Number(e.target.value)
                      handleAutoRefreshChange(interval > 0)
                      if (interval > 0) {
                        onConfigChange({
                          autoRefresh: {
                            ...config.autoRefresh,
                            enabled: true,
                            interval
                          }
                        })
                      }
                    }}
                    disabled={loading}
                  >
                    <MenuItem value={0}>Desabilitado</MenuItem>
                    <MenuItem value={1}>1 minuto</MenuItem>
                    <MenuItem value={3}>3 minutos</MenuItem>
                    <MenuItem value={5}>5 minutos</MenuItem>
                    <MenuItem value={10}>10 minutos</MenuItem>
                    <MenuItem value={30}>30 minutos</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Ações */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleLimparFiltros}
              disabled={loading}
              startIcon={<RefreshIcon />}
            >
              Resetar
            </Button>
            
            <Button
              variant="contained"
              onClick={() => setExpandido(false)}
              disabled={loading}
              startIcon={<FilterIcon />}
            >
              Aplicar Filtros
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  )
}

export default FiltrosExecutivos 