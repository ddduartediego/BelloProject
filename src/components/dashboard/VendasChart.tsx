'use client'

import React from 'react'
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  useTheme 
} from '@mui/material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// Dados simulados para demonstração
const dadosVendas = [
  { mes: 'Jan', vendas: 12400, meta: 15000 },
  { mes: 'Fev', vendas: 18200, meta: 15000 },
  { mes: 'Mar', vendas: 14800, meta: 15000 },
  { mes: 'Abr', vendas: 22100, meta: 20000 },
  { mes: 'Mai', vendas: 19800, meta: 20000 },
  { mes: 'Jun', vendas: 24500, meta: 22000 },
  { mes: 'Jul', vendas: 28300, meta: 25000 },
]

interface VendasChartProps {
  title?: string
}

export default function VendasChart({ title = 'Performance de Vendas' }: VendasChartProps) {
  const theme = useTheme()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

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
              {entry.name}: {formatCurrency(entry.value)}
            </Typography>
          ))}
        </Box>
      )
    }
    return null
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comparativo entre vendas realizadas e metas mensais
          </Typography>
        </Box>

        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dadosVendas}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
              <XAxis 
                dataKey="mes" 
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
                dataKey="meta"
                stroke={theme.palette.secondary.main}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: theme.palette.secondary.main, strokeWidth: 2, r: 4 }}
                name="Meta Mensal"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>

        {/* Resumo estatístico */}
        <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary" fontWeight="bold">
                {formatCurrency(dadosVendas[dadosVendas.length - 1].vendas)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Último Mês
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main" fontWeight="bold">
                +15.2%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Crescimento
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="info.main" fontWeight="bold">
                {formatCurrency(dadosVendas.reduce((acc, curr) => acc + curr.vendas, 0) / dadosVendas.length)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Média Mensal
              </Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
} 