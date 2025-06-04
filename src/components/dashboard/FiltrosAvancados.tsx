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
  Collapse
} from '@mui/material'
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { FiltroAvancado } from '@/types/dashboard'

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

interface FiltrosAvancadosProps {
  filtros: FiltroAvancado
  onFiltrosChange: (novosFiltros: Partial<FiltroAvancado>) => void
  loading?: boolean
}

interface PeriodoPreset {
  label: string
  valor: () => FiltroAvancado
}

// ============================================================================
// PERÍODOS PRÉ-DEFINIDOS
// ============================================================================

const PERIODOS_PRESET: PeriodoPreset[] = [
  {
    label: 'Hoje',
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
    label: 'Últimos 7 dias',
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
    label: 'Últimos 30 dias',
    valor: () => {
      const fim = new Date()
      const inicio = new Date()
      inicio.setDate(inicio.getDate() - 30)
      return {
        inicio: inicio.toISOString(),
        fim: fim.toISOString()
      }
    }
  },
  {
    label: 'Esta semana',
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
    label: 'Este mês',
    valor: () => {
      const hoje = new Date()
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      return {
        inicio: inicio.toISOString(),
        fim: hoje.toISOString()
      }
    }
  }
]

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const FiltrosAvancados: React.FC<FiltrosAvancadosProps> = ({
  filtros,
  onFiltrosChange,
  loading = false
}) => {
  const [expandido, setExpandido] = useState(false)
  const [filtrosLocais, setFiltrosLocais] = useState<FiltroAvancado>(filtros)

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePeriodoPreset = (preset: PeriodoPreset) => {
    const novosFiltros = preset.valor()
    setFiltrosLocais(novosFiltros)
    onFiltrosChange(novosFiltros)
  }

  const handleDataChange = (campo: 'inicio' | 'fim', valor: string) => {
    const novosFiltros = { ...filtrosLocais, [campo]: new Date(valor).toISOString() }
    setFiltrosLocais(novosFiltros)
  }

  const handleAplicarFiltros = () => {
    onFiltrosChange(filtrosLocais)
  }

  const handleLimparFiltros = () => {
    const filtrosPadrao = PERIODOS_PRESET[1].valor() // Últimos 7 dias
    setFiltrosLocais(filtrosPadrao)
    onFiltrosChange(filtrosPadrao)
  }

  // ============================================================================
  // FORMATAÇÃO DE DATAS
  // ============================================================================

  const formatarDataInput = (isoString: string): string => {
    return new Date(isoString).toISOString().slice(0, 16)
  }

  const calcularDiasPeriodo = (): number => {
    const inicio = new Date(filtrosLocais.inicio)
    const fim = new Date(filtrosLocais.fim)
    const diffTime = Math.abs(fim.getTime() - inicio.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        mb: 3, 
        borderRadius: 2,
        border: '1px solid #e0e0e0'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: expandido ? '1px solid #e0e0e0' : 'none',
          cursor: 'pointer'
        }}
        onClick={() => setExpandido(!expandido)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6" component="h3">
            Filtros Avançados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({calcularDiasPeriodo()} dias)
          </Typography>
        </Box>
        
        <IconButton size="small">
          {expandido ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Conteúdo Expandido */}
      <Collapse in={expandido}>
        <Box sx={{ p: 3 }}>
          {/* Períodos Pré-definidos */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Períodos Rápidos:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {PERIODOS_PRESET.map((preset, index) => (
                <Button
                  key={index}
                  variant="outlined"
                  size="small"
                  onClick={() => handlePeriodoPreset(preset)}
                  disabled={loading}
                >
                  {preset.label}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Período Personalizado */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Período Personalizado:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                label="Data Início"
                type="datetime-local"
                value={formatarDataInput(filtrosLocais.inicio)}
                onChange={(e) => handleDataChange('inicio', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                disabled={loading}
              />
              
              <TextField
                label="Data Fim"
                type="datetime-local"
                value={formatarDataInput(filtrosLocais.fim)}
                onChange={(e) => handleDataChange('fim', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                disabled={loading}
              />
            </Box>
          </Box>

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
              onClick={handleAplicarFiltros}
              disabled={loading}
            >
              Aplicar Filtros
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  )
}

export default FiltrosAvancados 