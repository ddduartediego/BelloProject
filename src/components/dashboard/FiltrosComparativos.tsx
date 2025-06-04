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
  Chip,
  Stack
} from '@mui/material'
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  Compare as CompareIcon,
  Timeline as TimelineIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material'
import { FiltroAvancado } from '@/types/dashboard'

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

interface FiltroComparativo extends FiltroAvancado {
  tipoComparacao: 'PERIODO_ANTERIOR' | 'SEMANA_PASSADA' | 'MES_PASSADO' | 'ANO_PASSADO' | 'PERSONALIZADO'
  periodoComparacao?: {
    inicio: string
    fim: string
  }
  metricas: ('vendas' | 'comandas' | 'clientes' | 'profissionais')[]
}

interface FiltrosComparativosProps {
  filtros: FiltroComparativo
  onFiltrosChange: (novosFiltros: Partial<FiltroComparativo>) => void
  loading?: boolean
}

interface PeriodoPresetComparativo {
  label: string
  icon: string
  valor: () => Partial<FiltroComparativo>
  descricao: string
}

// ============================================================================
// PERÍODOS PRÉ-DEFINIDOS PARA COMPARATIVOS
// ============================================================================

const PERIODOS_COMPARATIVOS: PeriodoPresetComparativo[] = [
  {
    label: 'Hoje vs Ontem',
    icon: '📅',
    descricao: 'Comparar dia atual com dia anterior',
    valor: () => {
      const hoje = new Date()
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)
      
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      const fimHoje = new Date(hoje)
      
      return {
        inicio: inicioHoje.toISOString(),
        fim: fimHoje.toISOString(),
        tipoComparacao: 'PERIODO_ANTERIOR'
      }
    }
  },
  {
    label: 'Esta Semana vs Anterior',
    icon: '📊',
    descricao: 'Semana atual vs semana passada',
    valor: () => {
      const hoje = new Date()
      const diaSemana = hoje.getDay()
      const inicioSemana = new Date(hoje)
      inicioSemana.setDate(hoje.getDate() - diaSemana)
      inicioSemana.setHours(0, 0, 0, 0)
      
      return {
        inicio: inicioSemana.toISOString(),
        fim: hoje.toISOString(),
        tipoComparacao: 'SEMANA_PASSADA'
      }
    }
  },
  {
    label: 'Este Mês vs Anterior',
    icon: '🗓️',
    descricao: 'Mês atual vs mês passado',
    valor: () => {
      const hoje = new Date()
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      
      return {
        inicio: inicioMes.toISOString(),
        fim: hoje.toISOString(),
        tipoComparacao: 'MES_PASSADO'
      }
    }
  },
  {
    label: 'Últimos 7 dias',
    icon: '📈',
    descricao: 'Últimos 7 dias vs 7 dias anteriores',
    valor: () => {
      const fim = new Date()
      const inicio = new Date()
      inicio.setDate(inicio.getDate() - 7)
      
      return {
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        tipoComparacao: 'PERIODO_ANTERIOR'
      }
    }
  },
  {
    label: 'Últimos 30 dias',
    icon: '📉',
    descricao: 'Últimos 30 dias vs 30 dias anteriores',
    valor: () => {
      const fim = new Date()
      const inicio = new Date()
      inicio.setDate(inicio.getDate() - 30)
      
      return {
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        tipoComparacao: 'PERIODO_ANTERIOR'
      }
    }
  },
  {
    label: 'Este Ano vs Anterior',
    icon: '🎯',
    descricao: 'Ano atual vs ano passado',
    valor: () => {
      const hoje = new Date()
      const inicioAno = new Date(hoje.getFullYear(), 0, 1)
      
      return {
        inicio: inicioAno.toISOString(),
        fim: hoje.toISOString(),
        tipoComparacao: 'ANO_PASSADO'
      }
    }
  }
]

// Métricas disponíveis para análise
const METRICAS_DISPONIVEIS = [
  { id: 'vendas', label: 'Vendas', icon: '💰' },
  { id: 'comandas', label: 'Comandas', icon: '📋' },
  { id: 'clientes', label: 'Clientes', icon: '👥' },
  { id: 'profissionais', label: 'Profissionais', icon: '👨‍💼' }
]

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const FiltrosComparativos: React.FC<FiltrosComparativosProps> = ({
  filtros,
  onFiltrosChange,
  loading = false
}) => {
  const [expandido, setExpandido] = useState(false)

  // ============================================================================
  // CÁLCULOS E FORMATAÇÃO
  // ============================================================================

  const calcularDiasPeriodo = (): number => {
    const inicio = new Date(filtros.inicio)
    const fim = new Date(filtros.fim)
    const diffTime = Math.abs(fim.getTime() - inicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const formatarDataInput = (isoString: string): string => {
    return new Date(isoString).toISOString().slice(0, 16)
  }

  const formatarPeriodoAtual = (): string => {
    const inicio = new Date(filtros.inicio)
    const fim = new Date(filtros.fim)
    const dias = calcularDiasPeriodo()
    
    const isHoje = inicio.toDateString() === new Date().toDateString() && 
                   fim.getDate() === new Date().getDate()
    
    if (isHoje) return 'Hoje'
    if (dias === 1) return inicio.toLocaleDateString('pt-BR')
    return `${dias} dias`
  }

  const getTipoComparacaoLabel = (tipo: FiltroComparativo['tipoComparacao']): string => {
    const labels = {
      'PERIODO_ANTERIOR': 'vs Período Anterior',
      'SEMANA_PASSADA': 'vs Semana Passada',
      'MES_PASSADO': 'vs Mês Passado',
      'ANO_PASSADO': 'vs Ano Passado',
      'PERSONALIZADO': 'vs Personalizado'
    }
    return labels[tipo]
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePeriodoPreset = (preset: PeriodoPresetComparativo) => {
    const novosFiltros = preset.valor()
    onFiltrosChange(novosFiltros)
  }

  const handleDataChange = (campo: 'inicio' | 'fim', valor: string) => {
    onFiltrosChange({ [campo]: new Date(valor).toISOString() })
  }

  const handleTipoComparacaoChange = (tipo: FiltroComparativo['tipoComparacao']) => {
    onFiltrosChange({ tipoComparacao: tipo })
  }

  const handleMetricasChange = (metrica: string, incluir: boolean) => {
    const novasMetricas = incluir 
      ? [...filtros.metricas, metrica as any]
      : filtros.metricas.filter(m => m !== metrica)
    
    onFiltrosChange({ metricas: novasMetricas })
  }

  const handleLimparFiltros = () => {
    // Reset para hoje vs ontem
    const preset = PERIODOS_COMPARATIVOS[0].valor()
    onFiltrosChange({
      ...preset,
      metricas: ['vendas', 'comandas']
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
          <CompareIcon color="primary" />
          <Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
              Filtros Comparativos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatarPeriodoAtual()} • {getTipoComparacaoLabel(filtros.tipoComparacao)}
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
          <Chip 
            label={`${filtros.metricas.length} métricas`}
            size="small"
            color="secondary"
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
                <TimelineIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Período de Comparação
                </Typography>
              </Box>
              
              {/* Períodos Pré-definidos */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Comparações Rápidas:
                </Typography>
                <Grid container spacing={1}>
                  {PERIODOS_COMPARATIVOS.map((preset, index) => (
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
                    value={formatarDataInput(filtros.inicio)}
                    onChange={(e) => handleDataChange('inicio', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    disabled={loading}
                    fullWidth
                  />
                  
                  <TextField
                    label="Data/Hora Fim"
                    type="datetime-local"
                    value={formatarDataInput(filtros.fim)}
                    onChange={(e) => handleDataChange('fim', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    disabled={loading}
                    fullWidth
                  />
                </Box>
              </Box>
            </Grid>

            {/* Coluna 2: Tipo de Comparação e Métricas */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Configurações de Análise
                </Typography>
              </Box>

              {/* Tipo de Comparação */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Comparar com:
                </Typography>
                <FormControl size="small" fullWidth>
                  <InputLabel>Tipo de Comparação</InputLabel>
                  <Select
                    value={filtros.tipoComparacao}
                    label="Tipo de Comparação"
                    onChange={(e) => handleTipoComparacaoChange(e.target.value as any)}
                    disabled={loading}
                  >
                    <MenuItem value="PERIODO_ANTERIOR">Período Anterior</MenuItem>
                    <MenuItem value="SEMANA_PASSADA">Semana Passada</MenuItem>
                    <MenuItem value="MES_PASSADO">Mês Passado</MenuItem>
                    <MenuItem value="ANO_PASSADO">Ano Passado</MenuItem>
                    <MenuItem value="PERSONALIZADO">Personalizado</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Métricas para Análise */}
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Métricas para Análise:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {METRICAS_DISPONIVEIS.map((metrica) => (
                    <Chip
                      key={metrica.id}
                      label={`${metrica.icon} ${metrica.label}`}
                      variant={filtros.metricas.includes(metrica.id as any) ? "filled" : "outlined"}
                      color={filtros.metricas.includes(metrica.id as any) ? "primary" : "default"}
                      onClick={() => handleMetricasChange(
                        metrica.id, 
                        !filtros.metricas.includes(metrica.id as any)
                      )}
                      disabled={loading}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
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
              startIcon={<CompareIcon />}
            >
              Aplicar Comparação
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  )
}

export default FiltrosComparativos 