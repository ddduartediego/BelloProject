'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Stack,
  Snackbar,
  Alert,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
  Paper,
} from '@mui/material'
import {
  AccountBalance as CaixaIcon,
  MonetizationOn as MoneyIcon,
  TrendingUp as EntradaIcon,
  TrendingDown as SaidaIcon,
  PlayArrow as AbrirIcon,
  Stop as FecharIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Assessment as RelatorioIcon,
} from '@mui/icons-material'
import Layout from '@/components/common/Layout'
import AbrirCaixaDialog from '@/components/caixa/AbrirCaixaDialog'
import FecharCaixaDialog from '@/components/caixa/FecharCaixaDialog'
import MovimentacaoDialog from '@/components/caixa/MovimentacaoDialog'

export default function CaixaPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [caixaAberto, setCaixaAberto] = useState(true)
  const [abrirCaixaOpen, setAbrirCaixaOpen] = useState(false)
  const [fecharCaixaOpen, setFecharCaixaOpen] = useState(false)
  const [movimentacaoOpen, setMovimentacaoOpen] = useState(false)
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA')
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Dados simulados para demonstração
  const totalEntradas = 755.00
  const totalSaidas = 50.00
  const totalVendas = 655.00
  const saldoInicial = 200.00
  const saldoCalculado = saldoInicial + totalEntradas - totalSaidas

  // Função para mostrar notificação
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  // Função para fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Função para abrir caixa
  const handleAbrirCaixa = async (saldoInicial: number) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCaixaAberto(true)
      setAbrirCaixaOpen(false)
      showSnackbar(`Caixa aberto com saldo inicial de R$ ${saldoInicial.toFixed(2).replace('.', ',')}`)
    } catch (error) {
      showSnackbar('Erro ao abrir caixa', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para fechar caixa
  const handleFecharCaixa = async (observacoes?: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setCaixaAberto(false)
      setFecharCaixaOpen(false)
      showSnackbar('Caixa fechado com sucesso!')
    } catch (error) {
      showSnackbar('Erro ao fechar caixa', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para adicionar movimentação
  const handleAddMovimentacao = async (tipo: 'ENTRADA' | 'SAIDA', valor: number, descricao: string, categoria: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setMovimentacaoOpen(false)
      
      const tipoTexto = tipo === 'ENTRADA' ? 'entrada' : 'saída'
      showSnackbar(`${tipoTexto} de R$ ${valor.toFixed(2).replace('.', ',')} registrada!`)
    } catch (error) {
      showSnackbar('Erro ao registrar movimentação', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMovimentacao = (tipo: 'ENTRADA' | 'SAIDA') => {
    setTipoMovimentacao(tipo)
    setMovimentacaoOpen(true)
  }

  // Dados simulados de movimentações
  const movimentacoes = [
    {
      id: '1',
      tipo: 'ENTRADA' as const,
      valor: 125.00,
      descricao: 'Venda - Comanda #ABC123',
      categoria: 'VENDA',
      data: '2024-12-29T09:30:00Z',
    },
    {
      id: '2',
      tipo: 'ENTRADA' as const,
      valor: 350.00,
      descricao: 'Venda - Comanda #DEF456',
      categoria: 'VENDA',
      data: '2024-12-29T11:15:00Z',
    },
    {
      id: '3',
      tipo: 'SAIDA' as const,
      valor: 50.00,
      descricao: 'Sangria - Troco',
      categoria: 'SANGRIA',
      data: '2024-12-29T14:00:00Z',
    },
    {
      id: '4',
      tipo: 'ENTRADA' as const,
      valor: 180.00,
      descricao: 'Venda - Comanda #GHI789',
      categoria: 'VENDA',
      data: '2024-12-29T16:45:00Z',
    },
    {
      id: '5',
      tipo: 'ENTRADA' as const,
      valor: 100.00,
      descricao: 'Reforço - Dinheiro para troco',
      categoria: 'REFORCO',
      data: '2024-12-29T18:00:00Z',
    },
  ]

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header da página */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <CaixaIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Controle de Caixa
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Gerencie entradas, saídas e movimentações financeiras
              </Typography>
            </Box>
          </Box>

          {/* Ações do caixa */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {!caixaAberto ? (
              <Button
                variant="contained"
                startIcon={<AbrirIcon />}
                onClick={() => setAbrirCaixaOpen(true)}
                color="success"
                size="large"
              >
                Abrir Caixa
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<FecharIcon />}
                onClick={() => setFecharCaixaOpen(true)}
                color="error"
                size="large"
              >
                Fechar Caixa
              </Button>
            )}
          </Box>
        </Box>

        {/* Status do Caixa */}
        {caixaAberto && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Status do Caixa
              </Typography>
              <Chip
                label="Aberto"
                color="success"
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Data de Abertura
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {new Date().toLocaleDateString('pt-BR')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  08:00
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Saldo Inicial
                </Typography>
                <Typography variant="h6" color="primary">
                  R$ {saldoInicial.toFixed(2).replace('.', ',')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Saldo Atual
                </Typography>
                <Typography variant="h6" color="success.main">
                  R$ {saldoCalculado.toFixed(2).replace('.', ',')}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Cards de Estatísticas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EntradaIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      R$ {totalEntradas.toFixed(2).replace('.', ',')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total de Entradas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SaidaIcon sx={{ fontSize: 40, color: 'error.main' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="error.main">
                      R$ {totalSaidas.toFixed(2).replace('.', ',')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total de Saídas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MoneyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="primary.main">
                      R$ {totalVendas.toFixed(2).replace('.', ',')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total de Vendas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <RelatorioIcon sx={{ fontSize: 40, color: 'info.main' }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="info.main">
                      {movimentacoes.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Movimentações
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Ações de Movimentação */}
        {caixaAberto && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Movimentações
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleMovimentacao('ENTRADA')}
                color="success"
              >
                Entrada
              </Button>
              <Button
                variant="contained"
                startIcon={<RemoveIcon />}
                onClick={() => handleMovimentacao('SAIDA')}
                color="error"
              >
                Saída
              </Button>
            </Stack>
          </Paper>
        )}

        {/* Lista de Movimentações */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Histórico de Movimentações
          </Typography>
          
          <Stack spacing={1}>
            {movimentacoes.map((mov, index) => (
              <Box key={mov.id}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  py: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {mov.tipo === 'ENTRADA' ? (
                      <EntradaIcon sx={{ color: 'success.main' }} />
                    ) : (
                      <SaidaIcon sx={{ color: 'error.main' }} />
                    )}
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {mov.descricao}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(mov.data).toLocaleString('pt-BR')} • {mov.categoria}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold"
                    color={mov.tipo === 'ENTRADA' ? 'success.main' : 'error.main'}
                  >
                    {mov.tipo === 'ENTRADA' ? '+' : '-'} R$ {mov.valor.toFixed(2).replace('.', ',')}
                  </Typography>
                </Box>
                {index < movimentacoes.length - 1 && <Divider />}
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* Dialogs */}
        <AbrirCaixaDialog
          open={abrirCaixaOpen}
          onClose={() => setAbrirCaixaOpen(false)}
          onConfirm={handleAbrirCaixa}
          loading={loading}
        />

        <FecharCaixaDialog
          open={fecharCaixaOpen}
          onClose={() => setFecharCaixaOpen(false)}
          onConfirm={handleFecharCaixa}
          caixa={{
            id: 'caixa-1',
            id_empresa: 'empresa-1',
            data_abertura: new Date().toISOString(),
            saldo_inicial: saldoInicial,
            status: 'ABERTO',
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
          }}
          saldoCalculado={saldoCalculado}
          totalEntradas={totalEntradas}
          totalSaidas={totalSaidas}
          loading={loading}
        />

        <MovimentacaoDialog
          open={movimentacaoOpen}
          onClose={() => setMovimentacaoOpen(false)}
          onConfirm={handleAddMovimentacao}
          tipo={tipoMovimentacao}
          loading={loading}
        />

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  )
} 