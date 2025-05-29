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
} from '@mui/material'
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material'
import Layout from '@/components/common/Layout'
import ComandaForm from '@/components/comandas/ComandaForm'
import ComandaDetalhes from '@/components/comandas/ComandaDetalhes'
import PaymentDialog from '@/components/comandas/PaymentDialog'
import { ComandaComDetalhes, ItemComanda, MetodoPagamento } from '@/types/database'

// Dados simulados para demonstração
const comandasSimuladas: ComandaComDetalhes[] = [
  {
    id: '1',
    id_cliente: '1',
    nome_cliente_avulso: undefined,
    id_profissional_responsavel: '1',
    id_caixa: 'caixa-1',
    id_empresa: 'empresa-1',
    data_abertura: new Date().toISOString(),
    data_fechamento: undefined,
    valor_total_servicos: 125.00,
    valor_total_produtos: 77.00,
    valor_desconto: 20.00,
    valor_total_pago: 182.00,
    metodo_pagamento: undefined,
    status: 'ABERTA',
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    cliente: {
      id: '1',
      nome: 'Maria Silva Santos',
      telefone: '(11) 99999-1111',
      email: 'maria.silva@email.com',
      id_empresa: 'empresa-1',
      criado_em: '2024-01-15T10:00:00Z',
      atualizado_em: '2024-12-01T15:30:00Z',
    },
    profissional_responsavel: {
      id: '1',
      id_usuario: 'user-1',
      id_empresa: 'empresa-1',
      especialidades: ['Corte', 'Coloração'],
      criado_em: '2024-01-01T00:00:00Z',
      atualizado_em: '2024-01-01T00:00:00Z',
    },
    caixa: {
      id: 'caixa-1',
      id_empresa: 'empresa-1',
      data_abertura: new Date().toISOString(),
      saldo_inicial: 100.00,
      status: 'ABERTO',
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    },
    itens: [
      {
        id: 'item-1',
        id_comanda: '1',
        id_servico: '1',
        quantidade: 1,
        preco_unitario_registrado: 80.00,
        preco_total_item: 80.00,
        id_profissional_executante: '1',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        servico: {
          id: '1',
          id_empresa: 'empresa-1',
          nome: 'Corte Feminino',
          preco: 80.00,
          duracao_estimada_minutos: 60,
          criado_em: '2024-01-01T00:00:00Z',
          atualizado_em: '2024-01-01T00:00:00Z',
        },
      },
      {
        id: 'item-2',
        id_comanda: '1',
        id_produto: '1',
        quantidade: 2,
        preco_unitario_registrado: 35.00,
        preco_total_item: 70.00,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        produto: {
          id: '1',
          id_empresa: 'empresa-1',
          nome: 'Shampoo Premium',
          preco_venda: 35.00,
          estoque_atual: 25,
          criado_em: '2024-01-01T00:00:00Z',
          atualizado_em: '2024-01-01T00:00:00Z',
        },
      },
    ],
  },
  {
    id: '2',
    id_cliente: undefined,
    nome_cliente_avulso: 'João Silva',
    id_profissional_responsavel: '2',
    id_caixa: 'caixa-1',
    id_empresa: 'empresa-1',
    data_abertura: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
    data_fechamento: new Date(Date.now() - 82800000).toISOString(), // 1 dia atrás + 1h
    valor_total_servicos: 60.00,
    valor_total_produtos: 0.00,
    valor_desconto: 0.00,
    valor_total_pago: 60.00,
    metodo_pagamento: 'DINHEIRO',
    status: 'FECHADA',
    criado_em: new Date(Date.now() - 86400000).toISOString(),
    atualizado_em: new Date(Date.now() - 82800000).toISOString(),
    cliente: undefined,
    profissional_responsavel: {
      id: '2',
      id_usuario: 'user-2',
      id_empresa: 'empresa-1',
      especialidades: ['Barba', 'Corte Masculino'],
      criado_em: '2024-01-01T00:00:00Z',
      atualizado_em: '2024-01-01T00:00:00Z',
    },
    caixa: {
      id: 'caixa-1',
      id_empresa: 'empresa-1',
      data_abertura: new Date().toISOString(),
      saldo_inicial: 100.00,
      status: 'ABERTO',
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    },
    itens: [
      {
        id: 'item-3',
        id_comanda: '2',
        id_servico: '4',
        quantidade: 1,
        preco_unitario_registrado: 60.00,
        preco_total_item: 60.00,
        id_profissional_executante: '2',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        servico: {
          id: '4',
          id_empresa: 'empresa-1',
          nome: 'Corte Masculino + Barba',
          preco: 60.00,
          duracao_estimada_minutos: 45,
          criado_em: '2024-01-01T00:00:00Z',
          atualizado_em: '2024-01-01T00:00:00Z',
        },
      },
    ],
  },
]

export default function ComandasPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [comandas, setComandas] = useState<ComandaComDetalhes[]>(comandasSimuladas)
  const [comandaFormOpen, setComandaFormOpen] = useState(false)
  const [comandaDetalhesOpen, setComandaDetalhesOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedComanda, setSelectedComanda] = useState<ComandaComDetalhes | null>(null)
  const [loading, setLoading] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [busca, setBusca] = useState('')
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Função para mostrar notificação
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
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
  const handleSaveComanda = async (comandaData: any) => {
    setLoading(true)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (selectedComanda) {
        showSnackbar('Comanda atualizada com sucesso!')
        // Atualizar comanda existente
        setComandas(prev => prev.map(c => 
          c.id === selectedComanda.id 
            ? { ...c, ...comandaData } 
            : c
        ))
      } else {
        // Criar nova comanda
        const novaComanda: ComandaComDetalhes = {
          id: `comanda-${Date.now()}`,
          ...comandaData,
          id_caixa: 'caixa-1',
          id_empresa: 'empresa-1',
          data_abertura: new Date().toISOString(),
          valor_total_servicos: 0,
          valor_total_produtos: 0,
          valor_desconto: 0,
          valor_total_pago: 0,
          status: 'ABERTA',
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
          caixa: comandasSimuladas[0].caixa,
          itens: [],
        }
        
        setComandas(prev => [novaComanda, ...prev])
        showSnackbar('Comanda criada com sucesso!')
      }
      
      setComandaFormOpen(false)
      setSelectedComanda(null)
      
    } catch (error) {
      console.error('Erro ao salvar comanda:', error)
      showSnackbar('Erro ao salvar comanda. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para adicionar item à comanda
  const handleAddItem = async (item: Partial<ItemComanda>) => {
    if (!selectedComanda) return
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const novoItem = {
        ...item,
        id: `item-${Date.now()}`,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      }
      
      const comandaAtualizada = {
        ...selectedComanda,
        itens: [...(selectedComanda.itens || []), novoItem],
        valor_total_servicos: selectedComanda.valor_total_servicos + (item.id_servico ? item.preco_total_item || 0 : 0),
        valor_total_produtos: selectedComanda.valor_total_produtos + (item.id_produto ? item.preco_total_item || 0 : 0),
      }
      
      setSelectedComanda(comandaAtualizada as ComandaComDetalhes)
      setComandas(prev => prev.map(c => 
        c.id === selectedComanda.id ? comandaAtualizada as ComandaComDetalhes : c
      ))
      
      showSnackbar('Item adicionado com sucesso!')
    } catch (error) {
      showSnackbar('Erro ao adicionar item', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para remover item da comanda
  const handleDeleteItem = async (itemId: string) => {
    if (!selectedComanda) return
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const itemRemovido = selectedComanda.itens?.find(i => i.id === itemId)
      if (!itemRemovido) return
      
      const comandaAtualizada = {
        ...selectedComanda,
        itens: selectedComanda.itens?.filter(i => i.id !== itemId) || [],
        valor_total_servicos: selectedComanda.valor_total_servicos - (itemRemovido.id_servico ? itemRemovido.preco_total_item : 0),
        valor_total_produtos: selectedComanda.valor_total_produtos - (itemRemovido.id_produto ? itemRemovido.preco_total_item : 0),
      }
      
      setSelectedComanda(comandaAtualizada as ComandaComDetalhes)
      setComandas(prev => prev.map(c => 
        c.id === selectedComanda.id ? comandaAtualizada as ComandaComDetalhes : c
      ))
      
      showSnackbar('Item removido com sucesso!')
    } catch (error) {
      showSnackbar('Erro ao remover item', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para aplicar desconto
  const handleApplyDiscount = async (desconto: number) => {
    if (!selectedComanda) return
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const comandaAtualizada = {
        ...selectedComanda,
        valor_desconto: desconto,
      }
      
      setSelectedComanda(comandaAtualizada as ComandaComDetalhes)
      setComandas(prev => prev.map(c => 
        c.id === selectedComanda.id ? comandaAtualizada as ComandaComDetalhes : c
      ))
      
      showSnackbar(`Desconto de R$ ${desconto.toFixed(2).replace('.', ',')} aplicado!`)
    } catch (error) {
      showSnackbar('Erro ao aplicar desconto', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para abrir modal de pagamento
  const handleFinishComanda = () => {
    setPaymentDialogOpen(true)
  }

  // Função para confirmar pagamento
  const handleConfirmPayment = async (metodo: MetodoPagamento, valorPago: number) => {
    if (!selectedComanda) return
    
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const comandaAtualizada = {
        ...selectedComanda,
        status: 'FECHADA' as const,
        metodo_pagamento: metodo,
        valor_total_pago: valorPago,
        data_fechamento: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      }
      
      setSelectedComanda(comandaAtualizada)
      setComandas(prev => prev.map(c => 
        c.id === selectedComanda.id ? comandaAtualizada : c
      ))
      
      setPaymentDialogOpen(false)
      setComandaDetalhesOpen(false)
      
      showSnackbar('Pagamento processado com sucesso! Comanda finalizada.')
    } catch (error) {
      showSnackbar('Erro ao processar pagamento', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar comandas
  const comandasFiltradas = comandas.filter(comanda => {
    const matchStatus = filtroStatus === 'todos' || comanda.status === filtroStatus.toUpperCase()
    const matchBusca = busca === '' || 
      (comanda.cliente?.nome || comanda.nome_cliente_avulso || '').toLowerCase().includes(busca.toLowerCase()) ||
      comanda.id.toLowerCase().includes(busca.toLowerCase())
    
    return matchStatus && matchBusca
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return 'success'
      case 'FECHADA':
        return 'info'
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
              <TextField
                select
                fullWidth
                label="Status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="aberta">Abertas</MenuItem>
                <MenuItem value="fechada">Fechadas</MenuItem>
                <MenuItem value="cancelada">Canceladas</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Box>

        {/* Lista de Comandas */}
        <Grid container spacing={3}>
          {comandasFiltradas.length === 0 ? (
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
            comandasFiltradas.map((comanda) => (
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
          <Dialog
            open={comandaDetalhesOpen}
            onClose={() => setComandaDetalhesOpen(false)}
            maxWidth="lg"
            fullWidth
            fullScreen={isMobile}
          >
            <ComandaDetalhes
              comanda={selectedComanda}
              onAddItem={handleAddItem}
              onUpdateItem={() => {}}
              onDeleteItem={handleDeleteItem}
              onApplyDiscount={handleApplyDiscount}
              onFinishComanda={handleFinishComanda}
              onUpdateComanda={() => {}}
              onClose={() => setComandaDetalhesOpen(false)}
            />
          </Dialog>
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
      </Container>
    </Layout>
  )
} 