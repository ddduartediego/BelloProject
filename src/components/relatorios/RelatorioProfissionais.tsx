'use client'

import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  Person as PersonIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  MonetizationOn as MoneyIcon,
} from '@mui/icons-material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { FiltrosData } from '@/app/relatorios/page'

interface RelatorioProfissionaisProps {
  filtros: FiltrosData
}

export default function RelatorioProfissionais({ filtros }: RelatorioProfissionaisProps) {
  const profissionais = [
    {
      id: '1',
      nome: 'Ana Carolina',
      avatar: 'AC',
      especialidade: 'Coloração e Cortes',
      totalVendas: 4250.00,
      totalAtendimentos: 28,
      ticketMedio: 151.79,
      avaliacaoMedia: 4.8,
      horasTrabalhadas: 160,
      comissao: 850.00,
      crescimento: 15.2,
      servicosPrincipais: ['Coloração', 'Corte Feminino'],
    },
    {
      id: '2',
      nome: 'Bruno Silva',
      avatar: 'BS',
      especialidade: 'Cortes Masculinos',
      totalVendas: 2890.00,
      totalAtendimentos: 42,
      ticketMedio: 68.81,
      avaliacaoMedia: 4.6,
      horasTrabalhadas: 155,
      comissao: 578.00,
      crescimento: 8.3,
      servicosPrincipais: ['Corte Masculino', 'Barba'],
    },
    {
      id: '3',
      nome: 'Carla Santos',
      avatar: 'CS',
      especialidade: 'Tratamentos',
      totalVendas: 3120.00,
      totalAtendimentos: 25,
      ticketMedio: 124.80,
      avaliacaoMedia: 4.9,
      horasTrabalhadas: 140,
      comissao: 624.00,
      crescimento: 12.7,
      servicosPrincipais: ['Hidratação', 'Botox Capilar'],
    },
    {
      id: '4',
      nome: 'Diana Lima',
      avatar: 'DL',
      especialidade: 'Unhas e Estética',
      totalVendas: 1980.00,
      totalAtendimentos: 35,
      ticketMedio: 56.57,
      avaliacaoMedia: 4.7,
      horasTrabalhadas: 145,
      comissao: 396.00,
      crescimento: 5.8,
      servicosPrincipais: ['Manicure', 'Pedicure'],
    },
  ]

  const dadosComparativo = profissionais.map(prof => ({
    nome: prof.nome.split(' ')[0],
    vendas: prof.totalVendas,
    atendimentos: prof.totalAtendimentos,
    ticketMedio: prof.ticketMedio,
  }))

  const dadosDistribuicao = [
    { name: 'Ana Carolina', value: 4250, color: '#1976d2' },
    { name: 'Bruno Silva', value: 2890, color: '#388e3c' },
    { name: 'Carla Santos', value: 3120, color: '#f57c00' },
    { name: 'Diana Lima', value: 1980, color: '#7b1fa2' },
  ]

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const getCorAvaliacao = (avaliacao: number) => {
    if (avaliacao >= 4.8) return 'success'
    if (avaliacao >= 4.5) return 'warning'
    return 'error'
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
              {entry.name}: {
                entry.dataKey === 'vendas' ? formatCurrency(entry.value) : 
                entry.dataKey === 'ticketMedio' ? formatCurrency(entry.value) :
                entry.value
              }
            </Typography>
          ))}
        </Box>
      )
    }
    return null
  }

  return (
    <Box>
      {/* Cards de Profissionais */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {profissionais.map((prof) => (
          <Grid item xs={12} sm={6} md={3} key={prof.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  {/* Header do Card */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                      {prof.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {prof.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {prof.especialidade}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Métricas */}
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {formatCurrency(prof.totalVendas)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vendas no período
                    </Typography>
                  </Box>

                  {/* Avaliação */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StarIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight="bold">
                      {prof.avaliacaoMedia}
                    </Typography>
                    <Chip
                      label={`${prof.totalAtendimentos} atendimentos`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {/* Ticket Médio */}
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Ticket Médio
                    </Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {formatCurrency(prof.ticketMedio)}
                    </Typography>
                  </Box>

                  {/* Crescimento */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon 
                      sx={{ 
                        color: prof.crescimento > 0 ? 'success.main' : 'error.main',
                        fontSize: 20 
                      }} 
                    />
                    <Typography 
                      variant="body2" 
                      color={prof.crescimento > 0 ? 'success.main' : 'error.main'}
                      fontWeight="bold"
                    >
                      {prof.crescimento > 0 ? '+' : ''}{prof.crescimento}%
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Gráficos Comparativos */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Vendas por Profissional */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Comparativo de Performance
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosComparativo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="vendas" fill="#1976d2" name="Vendas (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Distribuição de Vendas */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Distribuição de Vendas
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosDistribuicao}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosDistribuicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabela Detalhada */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Detalhamento por Profissional
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Profissional</TableCell>
                <TableCell align="center">Vendas</TableCell>
                <TableCell align="center">Atendimentos</TableCell>
                <TableCell align="center">Ticket Médio</TableCell>
                <TableCell align="center">Avaliação</TableCell>
                <TableCell align="center">Horas</TableCell>
                <TableCell align="center">Comissão</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profissionais.map((prof) => (
                <TableRow key={prof.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {prof.avatar}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {prof.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {prof.especialidade}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {formatCurrency(prof.totalVendas)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={prof.totalAtendimentos}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(prof.ticketMedio)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                      <StarIcon sx={{ color: 'warning.main', fontSize: 16 }} />
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={`${getCorAvaliacao(prof.avaliacaoMedia)}.main`}
                      >
                        {prof.avaliacaoMedia}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {prof.horasTrabalhadas}h
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium" color="info.main">
                      {formatCurrency(prof.comissao)}
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