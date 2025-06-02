'use client'

import React, { useState } from 'react'
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  useTheme,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Stack,
} from '@mui/material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from 'recharts'
import { DashboardMetrics } from '@/hooks/useDashboardMetrics'
import { format, parseISO, startOfWeek, eachDayOfInterval, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface VendasChartProps {
  title?: string
  metrics?: DashboardMetrics | null
}

export default function VendasChart({ 
  title = 'Performance de Vendas',
  metrics 
}: VendasChartProps) {
  const theme = useTheme()
  const [visualizacao, setVisualizacao] = useState<'vendas' | 'comandas'>('vendas')
  const [periodo, setPeriodo] = useState<'diario' | 'semanal'>('diario')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Processar dados reais ou mostrar vazio
  const getDadosGrafico = () => {
    if (!metrics?.vendaDetalhada?.porDia || metrics.vendaDetalhada.porDia.length === 0) {
      return []
    }

    const dadosPorDia = metrics.vendaDetalhada.porDia.map(item => ({
      data: format(parseISO(item.data), 'dd/MM', { locale: ptBR }),
      dataCompleta: item.data,
      vendas: item.vendas,
      comandas: item.comandas,
      ticketMedio: item.comandas > 0 ? item.vendas / item.comandas : 0
    }))

    if (periodo === 'semanal') {
      // Agrupar por semana
      const dadosPorSemana: Record<string, { vendas: number; comandas: number; dias: number }> = {}
      
      dadosPorDia.forEach(item => {
        const data = parseISO(item.dataCompleta)
        const inicioSemana = startOfWeek(data, { weekStartsOn: 0 })
        const chave = format(inicioSemana, 'yyyy-MM-dd')
        
        if (!dadosPorSemana[chave]) {
          dadosPorSemana[chave] = { vendas: 0, comandas: 0, dias: 0 }
        }
        
        dadosPorSemana[chave].vendas += item.vendas
        dadosPorSemana[chave].comandas += item.comandas
        dadosPorSemana[chave].dias++
      })

      return Object.entries(dadosPorSemana).map(([semana, dados]) => ({
        data: `Sem ${format(parseISO(semana), 'dd/MM', { locale: ptBR })}`,
        vendas: dados.vendas,
        comandas: dados.comandas,
        ticketMedio: dados.comandas > 0 ? dados.vendas / dados.comandas : 0
      }))
    }

    return dadosPorDia
  }

  const dadosGrafico = getDadosGrafico()

  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean
    payload?: Array<{
      color: string
      name: string
      value: number
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 2,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 3,
          }}
        >
          <Typography variant="body2" fontWeight="medium">
            {label}
          </Typography>
          {payload.map((entry, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {
                entry.name.includes('Vendas') || entry.name.includes('Ticket') 
                  ? formatCurrency(entry.value)
                  : entry.value
              }
            </Typography>
          ))}
        </Box>
      )
    }
    return null
  }

  // Calcular estatísticas
  const totalVendas = dadosGrafico.reduce((acc, item) => acc + item.vendas, 0)
  const totalComandas = dadosGrafico.reduce((acc, item) => acc + item.comandas, 0)
  const ticketMedioGeral = totalComandas > 0 ? totalVendas / totalComandas : 0
  const melhorDia = dadosGrafico.reduce((max, item) => 
    item.vendas > max.vendas ? item : max, 
    { data: '', vendas: 0, comandas: 0, ticketMedio: 0 }
  )

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {title}
            {(!metrics || !metrics.vendaDetalhada) && (
              <Typography component="span" variant="caption" color="warning.main" sx={{ ml: 1 }}>
                (Aguardando dados)
              </Typography>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Análise de performance baseada em dados reais de comandas
          </Typography>
        </Box>

        {/* Controles */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <ToggleButtonGroup
            value={visualizacao}
            exclusive
            onChange={(_, newValue) => newValue && setVisualizacao(newValue)}
            size="small"
          >
            <ToggleButton value="vendas">Vendas</ToggleButton>
            <ToggleButton value="comandas">Comandas</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            value={periodo}
            exclusive
            onChange={(_, newValue) => newValue && setPeriodo(newValue)}
            size="small"
          >
            <ToggleButton value="diario">Diário</ToggleButton>
            <ToggleButton value="semanal">Semanal</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {!metrics ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <CircularProgress />
          </Box>
        ) : dadosGrafico.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 300,
            color: 'text.secondary'
          }}>
            <Typography variant="h6" gutterBottom>
              Nenhuma venda registrada
            </Typography>
            <Typography variant="body2">
              Dados aparecerão aqui conforme comandas forem finalizadas
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              {visualizacao === 'vendas' ? (
                <LineChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="data" 
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                  />
                  <YAxis 
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="vendas"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    dot={{ fill: theme.palette.primary.main, strokeWidth: 2, r: 6 }}
                    name="Vendas Realizadas"
                  />
                  <Line
                    type="monotone"
                    dataKey="ticketMedio"
                    stroke={theme.palette.secondary.main}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: theme.palette.secondary.main, strokeWidth: 2, r: 4 }}
                    name="Ticket Médio"
                  />
                </LineChart>
              ) : (
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="data" 
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                  />
                  <YAxis 
                    stroke={theme.palette.text.secondary}
                    fontSize={12}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="comandas"
                    fill={theme.palette.info.main}
                    name="Comandas Fechadas"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        )}

        {/* Resumo estatístico */}
        {dadosGrafico.length > 0 && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium" gutterBottom>
              Resumo do Período:
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip 
                label={`Total: ${formatCurrency(totalVendas)}`}
                color="primary"
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`${totalComandas} comandas`}
                color="info"
                variant="outlined"
                size="small"
              />
              <Chip 
                label={`Ticket médio: ${formatCurrency(ticketMedioGeral)}`}
                color="secondary"
                variant="outlined"
                size="small"
              />
              {melhorDia.vendas > 0 && (
                <Chip 
                  label={`Melhor dia: ${melhorDia.data} (${formatCurrency(melhorDia.vendas)})`}
                  color="success"
                  variant="outlined"
                  size="small"
                />
              )}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  )
} 