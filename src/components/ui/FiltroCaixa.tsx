import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Alert
} from '@mui/material'
import { CaixaFiltro } from '@/types/filtros'

interface FiltroCaixaProps {
  caixas: CaixaFiltro[]
  caixaSelecionado: CaixaFiltro | null
  onCaixaChange: (caixa: CaixaFiltro | null) => void
  loading?: boolean
  error?: string | null
  disabled?: boolean
  variant?: 'outlined' | 'filled' | 'standard'
  size?: 'small' | 'medium'
  label?: string
}

export default function FiltroCaixa({
  caixas,
  caixaSelecionado,
  onCaixaChange,
  loading = false,
  error = null,
  disabled = false,
  variant = 'outlined',
  size = 'small',
  label = 'Caixa'
}: FiltroCaixaProps) {
  
  const handleChange = (value: string) => {
    if (value === '') {
      onCaixaChange(null)
    } else {
      const caixa = caixas.find(c => c.id === value)
      onCaixaChange(caixa || null)
    }
  }

  if (error) {
    return (
      <Alert severity="error" variant="outlined" sx={{ minWidth: 250 }}>
        {error}
      </Alert>
    )
  }

  return (
    <FormControl variant={variant} size={size} sx={{ minWidth: 250 }}>
      <InputLabel id="filtro-caixa-label">{label}</InputLabel>
      <Select
        labelId="filtro-caixa-label"
        value={caixaSelecionado?.id || ''}
        onChange={(e) => handleChange(e.target.value)}
        label={label}
        disabled={disabled || loading}
        endAdornment={
          loading && (
            <Box sx={{ mr: 2 }}>
              <CircularProgress size={16} />
            </Box>
          )
        }
      >
        {/* Opção para mostrar todos os caixas */}
        <MenuItem value="">
          <em>Todos os caixas</em>
        </MenuItem>
        
        {/* Lista de caixas */}
        {caixas.map((caixa) => (
          <MenuItem key={caixa.id} value={caixa.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ fontWeight: caixa.status === 'ABERTO' ? 600 : 400 }}>
                {caixa.label}
              </Box>
            </Box>
          </MenuItem>
        ))}
        
        {/* Mensagem quando não há caixas */}
        {caixas.length === 0 && !loading && (
          <MenuItem disabled>
            <em>Nenhum caixa encontrado</em>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  )
} 