'use client'

import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material'
import {
  AccountBalance as CaixaIcon,
  TrendingUp as EntradaIcon,
  TrendingDown as SaidaIcon,
  MonetizationOn as MoneyIcon,
  Assessment as AnalysisIcon,
  SwapHoriz as MovimentacaoIcon,
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { FiltrosData } from '@/app/relatorios/page'

interface RelatorioCaixaProps {
  filtros: FiltrosData
}

export default function RelatorioCaixa({ filtros }: RelatorioCaixaProps) {
  const movimentacoesCaixa = [
    {
      id: '1',
      data: '2024-12-29',
      saldoInicial: 200.00,
      entradas: 755.00,
      saidas: 50.00,
      saldoFinal: 905.00,
      diferenca: 0.00,
      status: 'FECHADO',
    },
    {
      id: '2',
      data: '2024-12-28',
      saldoInicial: 150.00,
      entradas: 420.00,
      saidas: 30.00,
      saldoFinal: 540.00,
      diferenca: -5.00,
      status: 'FECHADO',
    },
    {
      id: '3',
      data: '2024-12-27',
      saldoInicial: 100.00,
      entradas: 680.00,
      saidas: 75.00,
      saldoFinal: 705.00,
      diferenca: 2.50,
      status: 'FECHADO',
    },
    {
      id: '4',
      data: '2024-12-26',
      saldoInicial: 180.00,
      entradas: 520.00,
      saidas: 25.00,
      saldoFinal: 675.00,
      diferenca: 0.00,
      status: 'FECHADO',
    },
  ]

  const dadosFluxo = [
    { data: '26/12', entradas: 520, saidas: 25, saldo: 675 },
    { data: '27/12', entradas: 680, saidas: 75, saldo: 705 },
    { data: '28/12', entradas: 420, saidas: 30, saldo: 540 },
    { data: '29/12', entradas: 755, saidas: 50, saldo: 905 },
  ]

  const tiposEntrada = [
    { tipo: 'Vendas', valor: 2200.00, percentual: 92.4 },
    { tipo: 'Reforços', valor: 175.00, percentual: 7.3 },
    { tipo: 'Outros', valor: 0.00, percentual: 0.3 },
  ]

  const tiposSaida = [
    { tipo: 'Sangrias', valor: 140.00, percentual: 77.8 },
    { tipo: 'Despesas', valor: 40.00, percentual: 22.2 },
    { tipo: 'Outros', valor: 0.00, percentual: 0.0 },
  ]

  const coresEntrada = ['#4caf50', '#8bc34a', '#cddc39']
  const coresSaida = ['#f44336', '#ff5722', '#ff9800']

  const resumoMetricas = {
    totalEntradas: movimentacoesCaixa.reduce((acc, mov) => acc + mov.entradas, 0),
    totalSaidas: movimentacoesCaixa.reduce((acc, mov) => acc + mov.saidas, 0),
    saldoMedio: movimentacoesCaixa.reduce((acc, mov) => acc + mov.saldoFinal, 0) / movimentacoesCaixa.length,
    totalDiferenca: movimentacoesCaixa.reduce((acc, mov) => acc + Math.abs(mov.diferenca), 0),
    diasComDiferenca: movimentacoesCaixa.filter(mov => mov.diferenca !== 0).length,
    mediaMovimentacoes: movimentacoesCaixa.length,
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusChip = (status: string) => {
    return status === 'FECHADO' 
      ? <Chip label="Fechado" size="small" color="success" />
      : <Chip label="Aberto" size="small" color="warning" />
  }

  const getDiferencaColor = (diferenca: number) => {
    if (diferenca === 0) return 'success.main'
    return diferenca > 0 ? 'warning.main' : 'error.main'
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
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
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
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
                <EntradaIcon sx={{ fontSize: 32, color: 'success.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {formatCurrency(resumoMetricas.totalEntradas)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Entradas
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
                <SaidaIcon sx={{ fontSize: 32, color: 'error.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    {formatCurrency(resumoMetricas.totalSaidas)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Saídas
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
                <CaixaIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    {formatCurrency(resumoMetricas.saldoMedio)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Saldo Médio
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
                <AnalysisIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {resumoMetricas.diasComDiferenca}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dias com Diferença
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Fluxo de Caixa */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Fluxo de Caixa Diário
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosFluxo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="entradas" 
                    stroke="#4caf50" 
                    strokeWidth={3}
                    name="Entradas (R$)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saidas" 
                    stroke="#f44336" 
                    strokeWidth={3}
                    name="Saídas (R$)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#1976d2" 
                    strokeWidth={3}
                    name="Saldo Final (R$)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Tipos de Movimentação */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Tipos de Entrada
            </Typography>
            <Stack spacing={2}>
              {tiposEntrada.map((tipo, index) => (
                <Box key={index}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{tipo.tipo}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {tipo.percentual}%
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: '100%', 
                    bgcolor: 'grey.200', 
                    borderRadius: 1,
                    height: 6,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${tipo.percentual}%`, 
                      bgcolor: coresEntrada[index],
                      height: '100%',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(tipo.valor)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Tipos de Saída
            </Typography>
            <Stack spacing={2}>
              {tiposSaida.map((tipo, index) => (
                <Box key={index}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{tipo.tipo}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {tipo.percentual}%
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    width: '100%', 
                    bgcolor: 'grey.200', 
                    borderRadius: 1,
                    height: 6,
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ 
                      width: `${tipo.percentual}%`, 
                      bgcolor: coresSaida[index],
                      height: '100%',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(tipo.valor)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabela de Movimentações */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Histórico de Fechamentos
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                <TableCell align="center">Saldo Inicial</TableCell>
                <TableCell align="center">Entradas</TableCell>
                <TableCell align="center">Saídas</TableCell>
                <TableCell align="center">Saldo Final</TableCell>
                <TableCell align="center">Diferença</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {movimentacoesCaixa.map((movimentacao) => (
                <TableRow key={movimentacao.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatDate(movimentacao.data)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatCurrency(movimentacao.saldoInicial)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      + {formatCurrency(movimentacao.entradas)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold" color="error.main">
                      - {formatCurrency(movimentacao.saidas)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {formatCurrency(movimentacao.saldoFinal)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      color={getDiferencaColor(movimentacao.diferenca)}
                    >
                      {movimentacao.diferenca === 0 ? '—' : 
                       (movimentacao.diferenca > 0 ? '+' : '') + formatCurrency(movimentacao.diferenca)
                      }
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {getStatusChip(movimentacao.status)}
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