'use client'

import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Stack,
} from '@mui/material'
import {
  FilterList as FilterIcon,
  Today as HojeIcon,
  DateRange as PeriodoIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { FiltrosData, PeriodoRelatorio } from '@/app/relatorios/page'

dayjs.locale('pt-br')

interface FiltrosRelatorioProps {
  filtros: FiltrosData
  onChange: (filtros: FiltrosData) => void
}

export default function FiltrosRelatorio({ filtros, onChange }: FiltrosRelatorioProps) {

  const periodos: { value: PeriodoRelatorio; label: string; icon: React.ReactNode }[] = [
    { value: 'hoje', label: 'Hoje', icon: <HojeIcon /> },
    { value: 'ontem', label: 'Ontem', icon: <HojeIcon /> },
    { value: 'ultimos7dias', label: 'Últimos 7 dias', icon: <PeriodoIcon /> },
    { value: 'ultimos30dias', label: 'Últimos 30 dias', icon: <PeriodoIcon /> },
    { value: 'personalizado', label: 'Período personalizado', icon: <PeriodoIcon /> },
  ]

  const handlePeriodoChange = (periodo: PeriodoRelatorio) => {
    const novosFiltros: FiltrosData = {
      ...filtros,
      periodo,
    }

    // Limpar datas personalizadas se não for período personalizado
    if (periodo !== 'personalizado') {
      delete novosFiltros.dataInicio
      delete novosFiltros.dataFim
    }

    onChange(novosFiltros)
  }

  const handleDataInicioChange = (data: any) => {
    if (data) {
      const date = dayjs(data).toDate()
      onChange({
        ...filtros,
        dataInicio: date,
      })
    }
  }

  const handleDataFimChange = (data: any) => {
    if (data) {
      const date = dayjs(data).toDate()
      onChange({
        ...filtros,
        dataFim: date,
      })
    }
  }

  const handleLimparFiltros = () => {
    onChange({
      periodo: 'ultimos30dias',
    })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <FilterIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Filtros do Relatório
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="center">
          {/* Seleção de Período */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Período</InputLabel>
              <Select
                value={filtros.periodo}
                label="Período"
                onChange={(e) => handlePeriodoChange(e.target.value as PeriodoRelatorio)}
              >
                {periodos.map((periodo) => (
                  <MenuItem key={periodo.value} value={periodo.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {periodo.icon}
                      {periodo.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Datas Personalizadas */}
          {filtros.periodo === 'personalizado' && (
            <>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Data Início"
                  value={filtros.dataInicio ? dayjs(filtros.dataInicio) : null}
                  onChange={handleDataInicioChange}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <DatePicker
                  label="Data Fim"
                  value={filtros.dataFim ? dayjs(filtros.dataFim) : null}
                  onChange={handleDataFimChange}
                  format="DD/MM/YYYY"
                  minDate={filtros.dataInicio ? dayjs(filtros.dataInicio) : undefined}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />
              </Grid>
            </>
          )}

          {/* Botão Limpar Filtros */}
          <Grid item xs={12} md={filtros.periodo === 'personalizado' ? 2 : 8}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={handleLimparFiltros}
                size="medium"
              >
                Limpar Filtros
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Preview dos filtros ativos */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Filtros ativos:</strong>{' '}
            {periodos.find(p => p.value === filtros.periodo)?.label}
            {filtros.periodo === 'personalizado' && filtros.dataInicio && filtros.dataFim && (
              ` (${filtros.dataInicio.toLocaleDateString('pt-BR')} a ${filtros.dataFim.toLocaleDateString('pt-BR')})`
            )}
          </Typography>
        </Box>
      </Paper>
    </LocalizationProvider>
  )
} 