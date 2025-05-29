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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material'
import {
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MonetizationOn as MoneyIcon,
  ShoppingCart as CartIcon,
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

interface RelatorioProdutosProps {
  filtros: FiltrosData
}

export default function RelatorioProdutos({ filtros }: RelatorioProdutosProps) {
  const produtos = [
    {
      id: '1',
      nome: 'Shampoo Premium',
      categoria: 'Cabelo',
      estoque: 15,
      estoqueMinimo: 20,
      precoCusto: 25.00,
      precoVenda: 45.00,
      vendas: 35,
      receita: 1575.00,
      margem: 44.4,
      status: 'baixo_estoque',
    },
    {
      id: '2',
      nome: 'Condicionador',
      categoria: 'Cabelo',
      estoque: 28,
      estoqueMinimo: 15,
      precoCusto: 22.00,
      precoVenda: 40.00,
      vendas: 28,
      receita: 1120.00,
      margem: 45.0,
      status: 'ok',
    },
    {
      id: '3',
      nome: 'Máscara Hidratante',
      categoria: 'Tratamento',
      estoque: 12,
      estoqueMinimo: 10,
      precoCusto: 35.00,
      precoVenda: 65.00,
      vendas: 18,
      receita: 1170.00,
      margem: 46.2,
      status: 'ok',
    },
    {
      id: '4',
      nome: 'Tintura Permanente',
      categoria: 'Coloração',
      estoque: 5,
      estoqueMinimo: 12,
      precoCusto: 40.00,
      precoVenda: 75.00,
      vendas: 22,
      receita: 1650.00,
      margem: 46.7,
      status: 'critico',
    },
    {
      id: '5',
      nome: 'Esmalte Rosa',
      categoria: 'Unhas',
      estoque: 45,
      estoqueMinimo: 20,
      precoCusto: 8.00,
      precoVenda: 15.00,
      vendas: 52,
      receita: 780.00,
      margem: 46.7,
      status: 'ok',
    },
    {
      id: '6',
      nome: 'Base Fortalecedora',
      categoria: 'Unhas',
      estoque: 8,
      estoqueMinimo: 15,
      precoCusto: 12.00,
      precoVenda: 22.00,
      vendas: 15,
      receita: 330.00,
      margem: 45.5,
      status: 'baixo_estoque',
    },
  ]

  const categorias = [
    { categoria: 'Cabelo', vendas: 2695.00, produtos: 2, percentual: 43.4 },
    { categoria: 'Tratamento', vendas: 1170.00, produtos: 1, percentual: 18.8 },
    { categoria: 'Coloração', vendas: 1650.00, produtos: 1, percentual: 26.6 },
    { categoria: 'Unhas', vendas: 1110.00, produtos: 2, percentual: 17.9 },
  ]

  const dadosVendas = produtos.map(prod => ({
    nome: prod.nome.split(' ')[0],
    vendas: prod.vendas,
    receita: prod.receita,
    margem: prod.margem,
  }))

  const dadosEstoque = produtos.map(prod => ({
    nome: prod.nome.split(' ')[0],
    atual: prod.estoque,
    minimo: prod.estoqueMinimo,
    percentual: (prod.estoque / prod.estoqueMinimo) * 100,
  }))

  const cores = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c62828', '#00796b']

  const resumoMetricas = {
    totalReceita: produtos.reduce((acc, prod) => acc + prod.receita, 0),
    totalVendas: produtos.reduce((acc, prod) => acc + prod.vendas, 0),
    margemMedia: produtos.reduce((acc, prod) => acc + prod.margem, 0) / produtos.length,
    produtosBaixoEstoque: produtos.filter(p => p.status !== 'ok').length,
    valorEstoque: produtos.reduce((acc, prod) => acc + (prod.estoque * prod.precoCusto), 0),
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critico':
        return 'error'
      case 'baixo_estoque':
        return 'warning'
      default:
        return 'success'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critico':
        return 'Crítico'
      case 'baixo_estoque':
        return 'Baixo Estoque'
      default:
        return 'OK'
    }
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
                entry.dataKey === 'receita' ? formatCurrency(entry.value) :
                entry.dataKey === 'margem' ? `${entry.value.toFixed(1)}%` :
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
      {/* Alertas de Estoque */}
      {resumoMetricas.produtosBaixoEstoque > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Atenção:</strong> {resumoMetricas.produtosBaixoEstoque} produto(s) com estoque baixo ou crítico.
            Recomendamos fazer a reposição.
          </Typography>
        </Alert>
      )}

      {/* Cards de Métricas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <MoneyIcon sx={{ fontSize: 32, color: 'success.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {formatCurrency(resumoMetricas.totalReceita)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Receita Total
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
                <CartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    {resumoMetricas.totalVendas}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Produtos Vendidos
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
                <TrendingUpIcon sx={{ fontSize: 32, color: 'info.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    {resumoMetricas.margemMedia.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Margem Média
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
                <InventoryIcon sx={{ fontSize: 32, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {formatCurrency(resumoMetricas.valorEstoque)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Valor em Estoque
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Vendas por Produto */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Performance de Vendas por Produto
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosVendas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="receita" fill="#1976d2" name="Receita (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Vendas por Categoria */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Vendas por Categoria
            </Typography>
            <Stack spacing={2}>
              {categorias.map((categoria, index) => (
                <Box key={index}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{categoria.categoria}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {categoria.percentual}%
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
                      width: `${categoria.percentual}%`, 
                      bgcolor: cores[index],
                      height: '100%',
                      transition: 'width 0.3s ease'
                    }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(categoria.vendas)} • {categoria.produtos} produto(s)
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabela de Produtos */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Detalhamento de Produtos
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Produto</TableCell>
                <TableCell align="center">Estoque</TableCell>
                <TableCell align="center">Vendas</TableCell>
                <TableCell align="center">Receita</TableCell>
                <TableCell align="center">Margem</TableCell>
                <TableCell align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {produtos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {produto.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {produto.categoria}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {produto.estoque}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((produto.estoque / produto.estoqueMinimo) * 100, 100)}
                        color={produto.estoque >= produto.estoqueMinimo ? 'success' : 
                               produto.estoque >= produto.estoqueMinimo * 0.5 ? 'warning' : 'error'}
                        sx={{ width: 60, mt: 0.5 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={produto.vendas}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      {formatCurrency(produto.receita)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight="medium">
                      {produto.margem.toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getStatusLabel(produto.status)}
                      size="small"
                      color={getStatusColor(produto.status) as any}
                      variant={produto.status === 'ok' ? 'outlined' : 'filled'}
                    />
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