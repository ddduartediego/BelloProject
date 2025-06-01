'use client'

import React, { useState, useEffect } from 'react'
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
  CircularProgress,
  Backdrop,
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
import { 
  caixaService, 
  movimentacoesCaixaService
} from '@/services'
import type { Caixa, MovimentacaoCaixa } from '@/types/database'
import { useClientSide } from '@/hooks/useClientSide'
import { formatDate, formatDateTime, formatTime } from '@/utils/dateFormat'

export default function CaixaPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isClientSide = useClientSide()
  
  const [caixaAtivo, setCaixaAtivo] = useState<Caixa | null>(null)
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoCaixa[]>([])
  const [estatisticas, setEstatisticas] = useState({
    totalEntradas: 0,
    totalSaidas: 0,
    totalVendas: 0,
    totalMovimentacoes: 0
  })
  
  const [abrirCaixaOpen, setAbrirCaixaOpen] = useState(false)
  const [fecharCaixaOpen, setFecharCaixaOpen] = useState(false)
  const [movimentacaoOpen, setMovimentacaoOpen] = useState(false)
  const [tipoMovimentacao, setTipoMovimentacao] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Carregamento inicial
  useEffect(() => {
    carregarDadosCaixa()
  }, [])

  // Carregar dados do caixa ativo e movimentações
  const carregarDadosCaixa = async () => {
    try {
      setInitialLoading(true)
      
      // Carregar caixa ativo
      const { data: caixa, error: caixaError } = await caixaService.getCaixaAtivo()
      
      if (caixaError && !caixaError.includes('Nenhum caixa ativo')) {
        console.error('Erro ao carregar caixa:', caixaError)
        showSnackbar('Erro ao carregar dados do caixa: ' + caixaError, 'error')
        return
      }
      
      setCaixaAtivo(caixa || null)
      
      if (caixa) {
        // Carregar movimentações do caixa ativo
        await carregarMovimentacoes(caixa.id)
        
        // Carregar estatísticas
        await carregarEstatisticas(caixa.id)
      } else {
        // Limpar dados se não há caixa ativo
        setMovimentacoes([])
        setEstatisticas({
          totalEntradas: 0,
          totalSaidas: 0,
          totalVendas: 0,
          totalMovimentacoes: 0
        })
      }
      
    } catch (err) {
      console.error('Erro no carregamento:', err)
      showSnackbar('Erro inesperado ao carregar dados', 'error')
    } finally {
      setInitialLoading(false)
    }
  }

  // Carregar movimentações de um caixa específico
  const carregarMovimentacoes = async (caixaId: string) => {
    try {
      const { data, error } = await movimentacoesCaixaService.getByCaixa(caixaId)
      
      if (error) {
        console.error('Erro ao carregar movimentações:', error)
        return
      }
      
      setMovimentacoes(data || [])
      
    } catch (err) {
      console.error('Erro ao carregar movimentações:', err)
    }
  }

  // Carregar estatísticas do caixa
  const carregarEstatisticas = async (caixaId: string) => {
    try {
      // Buscar todas as movimentações do caixa, não apenas do dia atual
      const { data, error } = await movimentacoesCaixaService.getByCaixa(caixaId)
      
      if (error) {
        console.error('Erro ao carregar estatísticas:', error)
        return
      }
      
      if (data) {
        // Calcular estatísticas com base em todas as movimentações
        const totalEntradas = data
          .filter(mov => mov.tipo_movimentacao === 'ENTRADA' || mov.tipo_movimentacao === 'REFORCO')
          .reduce((total, mov) => total + mov.valor, 0)
        
        const totalSaidas = data
          .filter(mov => mov.tipo_movimentacao === 'SAIDA' || mov.tipo_movimentacao === 'SANGRIA')
          .reduce((total, mov) => total + Math.abs(mov.valor), 0)
        
        const totalVendas = data
          .filter(mov => mov.tipo_movimentacao === 'ENTRADA' && mov.id_comanda)
          .reduce((total, mov) => total + mov.valor, 0)
        
        setEstatisticas({
          totalEntradas,
          totalSaidas,
          totalVendas,
          totalMovimentacoes: data.length
        })
      }
      
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err)
    }
  }

  // Função para mostrar notificação
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  // Função para fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Função para abrir caixa
  const handleAbrirCaixa = async (saldoInicial: number, observacoes?: string) => {
    setLoading(true)
    try {
      const dadosAbertura = {
        saldo_inicial: saldoInicial,
        observacoes: observacoes
      }
      
      const { data, error } = await caixaService.abrir(dadosAbertura)
      
      if (error) {
        showSnackbar('Erro ao abrir caixa: ' + error, 'error')
        return
      }
      
      setCaixaAtivo(data)
      setAbrirCaixaOpen(false)
      
      // Recarregar dados
      await carregarDadosCaixa()
      
      showSnackbar(`Caixa aberto com saldo inicial de R$ ${saldoInicial.toFixed(2).replace('.', ',')}`)
      
    } catch (err) {
      console.error('Erro ao abrir caixa:', err)
      showSnackbar('Erro inesperado ao abrir caixa', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para fechar caixa
  const handleFecharCaixa = async (observacoes?: string) => {
    if (!caixaAtivo) return
    
    setLoading(true)
    try {
      const dadosFechamento = {
        saldo_final_informado: saldoCalculado,
        observacoes: observacoes
      }
      
      const { data, error } = await caixaService.fechar(caixaAtivo.id, dadosFechamento)
      
      if (error) {
        showSnackbar('Erro ao fechar caixa: ' + error, 'error')
        return
      }
      
      setCaixaAtivo(null)
      setFecharCaixaOpen(false)
      
      // Recarregar dados
      await carregarDadosCaixa()
      
      showSnackbar('Caixa fechado com sucesso!')
      
    } catch (err) {
      console.error('Erro ao fechar caixa:', err)
      showSnackbar('Erro inesperado ao fechar caixa', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para adicionar movimentação
  const handleAdicionarMovimentacao = async (tipo: 'ENTRADA' | 'SAIDA', valor: number, descricao: string, categoria?: string) => {
    if (!caixaAtivo) return
    
    setLoading(true)
    try {
      let result
      
      if (tipo === 'ENTRADA') {
        result = await movimentacoesCaixaService.criarReforco(
          caixaAtivo.id, 
          valor, 
          descricao, 
          undefined // Sem profissional responsável por enquanto
        )
      } else {
        result = await movimentacoesCaixaService.criarSangria(
          caixaAtivo.id, 
          valor, 
          descricao, 
          undefined // Sem profissional responsável por enquanto
        )
      }
      
      const { data, error } = result
      
      if (error) {
        showSnackbar(`Erro ao registrar ${tipo.toLowerCase()}: ` + error, 'error')
        return
      }
      
      setMovimentacaoOpen(false)
      
      // Recarregar dados
      await carregarMovimentacoes(caixaAtivo.id)
      await carregarEstatisticas(caixaAtivo.id)
      
      showSnackbar(`${tipo === 'ENTRADA' ? 'Entrada' : 'Saída'} de R$ ${valor.toFixed(2).replace('.', ',')} registrada!`)
      
    } catch (err) {
      console.error('Erro ao adicionar movimentação:', err)
      showSnackbar('Erro inesperado ao registrar movimentação', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleMovimentacao = (tipo: 'ENTRADA' | 'SAIDA') => {
    setTipoMovimentacao(tipo)
    setMovimentacaoOpen(true)
  }

  // Cálculos
  const saldoCalculado = caixaAtivo ? 
    caixaAtivo.saldo_inicial + estatisticas.totalEntradas - estatisticas.totalSaidas : 0

  const getDescricaoMovimentacao = (mov: MovimentacaoCaixa) => {
    // Se for uma movimentação de comanda (venda), exibir o nome do cliente
    if (mov.id_comanda && (mov as any).comanda) {
      const comanda = (mov as any).comanda
      const nomeCliente = comanda?.cliente?.nome || comanda?.nome_cliente_avulso
      if (nomeCliente) {
        return `Venda - ${nomeCliente}`
      }
    }
    return mov.descricao
  }

  if (initialLoading) {
    return (
      <Layout>
        <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress color="inherit" />
            <Typography>Carregando dados do caixa...</Typography>
          </Box>
        </Backdrop>
      </Layout>
    )
  }

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
            {!caixaAtivo ? (
              <Button
                variant="contained"
                startIcon={<AbrirIcon />}
                onClick={() => setAbrirCaixaOpen(true)}
                color="success"
                size="large"
                disabled={loading}
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
                disabled={loading}
              >
                Fechar Caixa
              </Button>
            )}
          </Box>
        </Box>

        {/* Status do Caixa */}
        {caixaAtivo && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Status do Caixa
              </Typography>
              <Chip
                label={caixaAtivo.status === 'ABERTO' ? 'Aberto' : 'Fechado'}
                color={caixaAtivo.status === 'ABERTO' ? 'success' : 'default'}
              />
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Data de Abertura
                </Typography>
                <Typography variant="body1" fontWeight="medium" suppressHydrationWarning>
                  {formatDate(caixaAtivo.data_abertura, isClientSide)}
                </Typography>
                <Typography variant="caption" color="text.secondary" suppressHydrationWarning>
                  {formatTime(caixaAtivo.data_abertura, isClientSide)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Saldo Inicial
                </Typography>
                <Typography variant="h6" color="primary">
                  R$ {caixaAtivo.saldo_inicial.toFixed(2).replace('.', ',')}
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
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Movimentações
                </Typography>
                <Typography variant="h6" color="info.main">
                  {movimentacoes.length}
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
                      R$ {estatisticas.totalEntradas.toFixed(2).replace('.', ',')}
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
                      R$ {estatisticas.totalSaidas.toFixed(2).replace('.', ',')}
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
                      R$ {estatisticas.totalVendas.toFixed(2).replace('.', ',')}
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
                      {estatisticas.totalMovimentacoes}
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
        {caixaAtivo && (
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
                disabled={loading}
              >
                Entrada
              </Button>
              <Button
                variant="contained"
                startIcon={<RemoveIcon />}
                onClick={() => handleMovimentacao('SAIDA')}
                color="error"
                disabled={loading}
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
          
          {movimentacoes.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
              <MoneyIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                Nenhuma movimentação encontrada
              </Typography>
              <Typography variant="body2">
                {caixaAtivo 
                  ? 'As movimentações aparecerão aqui conforme forem registradas.'
                  : 'Abra o caixa para começar a registrar movimentações.'}
              </Typography>
            </Box>
          ) : (
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
                      {mov.valor > 0 ? (
                        <EntradaIcon sx={{ color: 'success.main' }} />
                      ) : (
                        <SaidaIcon sx={{ color: 'error.main' }} />
                      )}
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {getDescricaoMovimentacao(mov)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" suppressHydrationWarning>
                          {formatDateTime(mov.criado_em, isClientSide)} • {mov.tipo_movimentacao}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography 
                      variant="h6" 
                      fontWeight="bold"
                      color={mov.valor > 0 ? 'success.main' : 'error.main'}
                    >
                      {mov.valor > 0 ? '+' : '-'} R$ {Math.abs(mov.valor).toFixed(2).replace('.', ',')}
                    </Typography>
                  </Box>
                  {index < movimentacoes.length - 1 && <Divider />}
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        {/* Dialogs */}
        <AbrirCaixaDialog
          open={abrirCaixaOpen}
          onClose={() => setAbrirCaixaOpen(false)}
          onConfirm={handleAbrirCaixa}
          loading={loading}
        />

        {caixaAtivo && (
          <FecharCaixaDialog
            open={fecharCaixaOpen}
            onClose={() => setFecharCaixaOpen(false)}
            onConfirm={handleFecharCaixa}
            caixa={caixaAtivo}
            saldoCalculado={saldoCalculado}
            totalEntradas={estatisticas.totalEntradas}
            totalSaidas={estatisticas.totalSaidas}
            loading={loading}
          />
        )}

        <MovimentacaoDialog
          open={movimentacaoOpen}
          onClose={() => setMovimentacaoOpen(false)}
          onConfirm={handleAdicionarMovimentacao}
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

        {/* Loading overlay */}
        <Backdrop 
          open={loading} 
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      </Container>
    </Layout>
  )
} 