'use client'

import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MoneyIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as VendaIcon,
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { FiltrosData } from '@/app/relatorios/page'

interface RelatorioVendasProps {
  filtros: FiltrosData
}

export default function RelatorioVendas({ }: RelatorioVendasProps) {
  // Dados simulados baseados no período
  const dadosVendas = [
    { data: '01/12', vendas: 1250.00, comandas: 12, ticketMedio: 104.17 },
    { data: '02/12', vendas: 1580.00, comandas: 15, ticketMedio: 105.33 },
    { data: '03/12', vendas: 950.00, comandas: 8, ticketMedio: 118.75 },
    { data: '04/12', vendas: 2100.00, comandas: 18, ticketMedio: 116.67 },
    { data: '05/12', vendas: 1750.00, comandas: 14, ticketMedio: 125.00 },
    { data: '06/12', vendas: 1420.00, comandas: 11, ticketMedio: 129.09 },
    { data: '07/12', vendas: 1890.00, comandas: 16, ticketMedio: 118.13 },
  ]

  const topServicos = [
    { servico: 'Corte Feminino', quantidade: 45, valor: 2250.00, percentual: 14.3 },
    { servico: 'Escova', quantidade: 38, valor: 1520.00, percentual: 9.6 },
    { servico: 'Coloração', quantidade: 25, valor: 3750.00, percentual: 23.8 },
    { servico: 'Hidratação', quantidade: 32, valor: 1280.00, percentual: 8.1 },
    { servico: 'Manicure', quantidade: 42, valor: 1260.00, percentual: 8.0 },
  ]

  const metodosPagamento = [
    { metodo: 'Dinheiro', valor: 4250.00, percentual: 27.0 },
    { metodo: 'Cartão Débito', valor: 5100.00, percentual: 32.4 },
    { metodo: 'Cartão Crédito', valor: 5200.00, percentual: 33.0 },
    { metodo: 'PIX', valor: 1200.00, percentual: 7.6 },
  ]

  const resumoMetricas = {
    totalVendas: 15750.00,
    totalComandas: 127,
    ticketMedio: 124.02,
    crescimento: 12.5,
    maiorVenda: 350.00,
    menorVenda: 25.00,
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ 
          bgcolor: 'background.paper', 
          p: 2, 
          border: 1, 
          borderColor: 'divider',
          borderRadius: 1,
          boxShadow: 2
        }}>
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {entry.name === 'vendas' ? formatCurrency(entry.value) : entry.value}
            </Typography>
          ))}
        </Box>
      )
    }
    return null
  }

  return (
    <Box>
      {/* Cards de Métricas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <MoneyIcon sx={{ fontSize: 32, color: 'success.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {formatCurrency(resumoMetricas.totalVendas)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Vendas
                  </Typography>
                  <Chip
                    icon={<TrendingUpIcon />}
                    label={`+${resumoMetricas.crescimento}%`}
                    size="small"
                    color="success"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ReceiptIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    {resumoMetricas.totalComandas}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comandas Finalizadas
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <VendaIcon sx={{ fontSize: 32, color: 'info.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    {formatCurrency(resumoMetricas.ticketMedio)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ticket Médio
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TrendingUpIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {formatCurrency(resumoMetricas.maiorVenda)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Maior Venda
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráfico de Vendas por Período */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Evolução das Vendas
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosVendas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="#1976d2" 
                    strokeWidth={3}
                    name="Vendas (R$)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Métodos de Pagamento
            </Typography>
            <Stack spacing={2}>
              {metodosPagamento.map((metodo, index) => (
                <Box key={index}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{metodo.metodo}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {metodo.percentual}%
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: '100%', 
                    bgcolor: 'grey.200', 
                    borderRadius: 1,
                    height: 8,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${metodo.percentual}%`, 
                      bgcolor: `hsl(${index * 60}, 70%, 50%)`,
                      height: '100%',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(metodo.valor)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Top Serviços */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Serviços Mais Vendidos
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Serviço</TableCell>
                <TableCell align="center">Quantidade</TableCell>
                <TableCell align="center">Valor Total</TableCell>
                <TableCell align="center">% do Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {topServicos.map((servico, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {servico.servico}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={servico.quantidade}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(servico.valor)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">
                      {servico.percentual}%
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
} 