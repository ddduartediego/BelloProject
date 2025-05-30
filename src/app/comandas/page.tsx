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
  Chip,
  IconButton,
  Stack,
  Snackbar,
  Alert,
  Fab,
  TextField,
  MenuItem,
  useMediaQuery,
  useTheme,
  Dialog,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Backdrop,
} from '@mui/material'
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as ClienteIcon,
  Schedule as HorarioIcon,
  MonetizationOn as MoneyIcon,
} from '@mui/icons-material'
import Layout from '@/components/common/Layout'
import ComandaForm from '@/components/comandas/ComandaForm'
import ComandaDetalhes from '@/components/comandas/ComandaDetalhes'
import PaymentDialog from '@/components/comandas/PaymentDialog'
import { 
  ComandaComDetalhes, 
  ItemComanda, 
  MetodoPagamento,
  StatusComanda
} from '@/types/database'
import { 
  comandasService, 
  itensComandaService,
  type CreateComandaData,
  type ComandaFilters,
  type FinalizarComandaData 
} from '@/services'

export default function ComandasPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [comandas, setComandas] = useState<ComandaComDetalhes[]>([])
  const [comandaFormOpen, setComandaFormOpen] = useState(false)
  const [comandaDetalhesOpen, setComandaDetalhesOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedComanda, setSelectedComanda] = useState<ComandaComDetalhes | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'warning' | 'info'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Carregar comandas na inicialização
  useEffect(() => {
    carregarComandas()
  }, [])

  // Carregar comandas do Supabase
  const carregarComandas = async () => {
    try {
      setInitialLoading(true)
      
      const response = await comandasService.getAll(
        { page: 1, limit: 100 },
        { 
          status: filtroStatus !== 'todos' ? filtroStatus.toUpperCase() as StatusComanda : undefined, 
          busca: busca || undefined 
        }
      )

      if (response.error) {
        showSnackbar('Erro ao carregar comandas: ' + response.error, 'error')
        return
      }

      const data = response.data
      
      // Verificar se data é um array ou um objeto paginado
      if (Array.isArray(data)) {
        setComandas(data)
      } else if (data && typeof data === 'object' && 'items' in data) {
        setComandas(data.items as ComandaComDetalhes[])
      } else {
        setComandas([])
      }
    } catch (err) {
      console.error('Erro na requisição:', err)
      showSnackbar('Erro inesperado ao carregar comandas', 'error')
    } finally {
      setInitialLoading(false)
    }
  }

  // Recarregar quando filtros mudarem
  useEffect(() => {
    if (!initialLoading) {
      carregarComandas()
    }
  }, [filtroStatus, busca])

  // Função para mostrar notificação
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  // Função para fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Função para abrir formulário de nova comanda
  const handleNovaComanda = () => {
    setSelectedComanda(null)
    setComandaFormOpen(true)
  }

  // Função para visualizar detalhes da comanda
  const handleViewComanda = (comanda: ComandaComDetalhes) => {
    setSelectedComanda(comanda)
    setComandaDetalhesOpen(true)
  }

  // Função para salvar comanda
  const handleSaveComanda = async (comandaData: CreateComandaData) => {
    setLoading(true)
    
    try {
      if (selectedComanda) {
        // Atualizar comanda existente
        const { data, error } = await comandasService.update({
          id: selectedComanda.id,
          ...comandaData
        })

        if (error) {
          showSnackbar('Erro ao atualizar comanda: ' + error, 'error')
          return
        }

        showSnackbar('Comanda atualizada com sucesso!')
      } else {
        // Criar nova comanda
        const { data, error } = await comandasService.create(comandaData)

        if (error) {
          showSnackbar('Erro ao criar comanda: ' + error, 'error')
          return
        }

        showSnackbar('Comanda criada com sucesso!')
      }
      
      setComandaFormOpen(false)
      setSelectedComanda(null)
      
      // Recarregar lista
      await carregarComandas()
      
    } catch (error) {
      console.error('Erro ao salvar comanda:', error)
      showSnackbar('Erro inesperado ao salvar comanda', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para adicionar item à comanda
  const handleAddItem = async (item: {
    id_servico?: string
    id_produto?: string
    quantidade: number
    id_profissional_executante?: string
  }) => {
    if (!selectedComanda) return
    
    setLoading(true)
    try {
      const { data, error } = await itensComandaService.create({
        id_comanda: selectedComanda.id,
        ...item
      })

      if (error) {
        showSnackbar('Erro ao adicionar item: ' + error, 'error')
        return
      }

      showSnackbar('Item adicionado com sucesso!')
      
      // Recarregar detalhes da comanda
      const { data: comandaAtualizada } = await comandasService.getById(selectedComanda.id)
      if (comandaAtualizada) {
        setSelectedComanda(comandaAtualizada)
        
        // Atualizar na lista também
        setComandas(prev => prev.map(c => 
          c.id === selectedComanda.id ? comandaAtualizada : c
        ))
      }
      
    } catch (error) {
      console.error('Erro ao adicionar item:', error)
      showSnackbar('Erro inesperado ao adicionar item', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para remover item da comanda
  const handleDeleteItem = async (itemId: string) => {
    if (!selectedComanda) return
    
    setLoading(true)
    try {
      const { data, error } = await itensComandaService.delete(itemId)

      if (error) {
        showSnackbar('Erro ao remover item: ' + error, 'error')
        return
      }

      showSnackbar('Item removido com sucesso!')
      
      // Recarregar detalhes da comanda
      const { data: comandaAtualizada } = await comandasService.getById(selectedComanda.id)
      if (comandaAtualizada) {
        setSelectedComanda(comandaAtualizada)
        
        // Atualizar na lista também
        setComandas(prev => prev.map(c => 
          c.id === selectedComanda.id ? comandaAtualizada : c
        ))
      }
      
    } catch (error) {
      console.error('Erro ao remover item:', error)
      showSnackbar('Erro inesperado ao remover item', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para aplicar desconto
  const handleApplyDiscount = async (desconto: number) => {
    if (!selectedComanda) return
    
    showSnackbar('Funcionalidade em desenvolvimento', 'info')
  }

  // Função para abrir modal de pagamento
  const handleFinishComanda = () => {
    setPaymentDialogOpen(true)
  }

  // Função para confirmar pagamento
  const handleConfirmPayment = async (metodo: MetodoPagamento, valorDesconto?: number) => {
    if (!selectedComanda) return
    
    setLoading(true)
    try {
      const dadosFinalizacao: FinalizarComandaData = {
        metodo_pagamento: metodo,
        valor_desconto: valorDesconto || selectedComanda.valor_desconto,
        observacoes_pagamento: `Pagamento via ${metodo}`
      }

      const { data, error } = await comandasService.finalizarComanda(
        selectedComanda.id, 
        dadosFinalizacao
      )

      if (error) {
        showSnackbar('Erro ao processar pagamento: ' + error, 'error')
        return
      }

      setPaymentDialogOpen(false)
      setComandaDetalhesOpen(false)
      
      showSnackbar('Pagamento processado com sucesso! Comanda finalizada.')
      
      // Recarregar lista
      await carregarComandas()
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
      showSnackbar('Erro inesperado ao processar pagamento', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return 'warning'
      case 'FECHADA':
        return 'success'
      case 'CANCELADA':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return 'Aberta'
      case 'FECHADA':
        return 'Fechada'
      case 'CANCELADA':
        return 'Cancelada'
      default:
        return status
    }
  }

  if (initialLoading) {
    return (
      <Layout>
        <Backdrop open={true} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress color="inherit" />
            <Typography>Carregando comandas...</Typography>
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
            <ReceiptIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Comandas
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Gerencie as vendas e atendimentos do salão
              </Typography>
            </Box>
          </Box>

          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNovaComanda}
              size="large"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                px: 3,
              }}
            >
              Nova Comanda
            </Button>
          )}
        </Box>

        {/* Filtros */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por cliente ou ID da comanda"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filtroStatus}
                  label="Status"
                  onChange={(e) => setFiltroStatus(e.target.value)}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="aberta">Abertas</MenuItem>
                  <MenuItem value="fechada">Fechadas</MenuItem>
                  <MenuItem value="cancelada">Canceladas</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Lista de Comandas */}
        <Grid container spacing={3}>
          {comandas.length === 0 ? (
            <Grid item xs={12}>
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                color: 'text.secondary'
              }}>
                <ReceiptIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  Nenhuma comanda encontrada
                </Typography>
                <Typography variant="body2">
                  {busca || filtroStatus !== 'todos' 
                    ? 'Tente ajustar os filtros ou criar uma nova comanda.' 
                    : 'Crie sua primeira comanda para começar.'}
                </Typography>
              </Box>
            </Grid>
          ) : (
            comandas.map((comanda) => (
              <Grid item xs={12} sm={6} lg={4} key={comanda.id}>
                <Card sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                  border: '1px solid',
                  borderColor: 'divider',
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          #{comanda.id.slice(-8).toUpperCase()}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {comanda.cliente?.nome || comanda.nome_cliente_avulso}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(comanda.data_abertura).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(comanda.data_abertura).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusText(comanda.status)}
                        color={getStatusColor(comanda.status) as any}
                        size="small"
                      />
                    </Box>

                    <Stack spacing={1} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Itens:</Typography>
                        <Typography variant="body2">{comanda.itens?.length || 0}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Total:</Typography>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          R$ {(comanda.valor_total_servicos + comanda.valor_total_produtos - comanda.valor_desconto).toFixed(2).replace('.', ',')}
                        </Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<ViewIcon />}
                        onClick={() => handleViewComanda(comanda)}
                        fullWidth
                      >
                        Ver Detalhes
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Floating Action Button para mobile */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="nova comanda"
            onClick={handleNovaComanda}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Formulário de Comanda */}
        <ComandaForm
          open={comandaFormOpen}
          onClose={() => setComandaFormOpen(false)}
          onSave={handleSaveComanda}
          comanda={selectedComanda || undefined}
          loading={loading}
        />

        {/* Detalhes da Comanda */}
        {selectedComanda && (
          <ComandaDetalhes
            comanda={selectedComanda}
            open={comandaDetalhesOpen}
            onClose={() => setComandaDetalhesOpen(false)}
            onFinishComanda={handleFinishComanda}
            onUpdateComanda={() => carregarComandas()}
          />
        )}

        {/* Modal de Pagamento */}
        {selectedComanda && (
          <PaymentDialog
            open={paymentDialogOpen}
            onClose={() => setPaymentDialogOpen(false)}
            onConfirm={handleConfirmPayment}
            total={selectedComanda.valor_total_servicos + selectedComanda.valor_total_produtos - selectedComanda.valor_desconto}
            loading={loading}
          />
        )}

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