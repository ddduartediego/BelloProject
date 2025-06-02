'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  IconButton,
  Chip,
  Divider,
  Stack,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Alert,
  Backdrop,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Payment as PaymentIcon,
  LocalOffer as DiscountIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { ComandaComDetalhes, Servico, Produto } from '@/types/database'
import { 
  itensComandaService, 
  servicosService, 
  type CreateItemComandaData 
} from '@/services'
import { createClient } from '@/lib/supabase'

interface ComandaDetalhesProps {
  comanda: ComandaComDetalhes
  open: boolean
  onClose: () => void
  onFinishComanda: () => void
  onUpdateComanda: () => void
}

// Atualizar interface CreateItemComandaData para incluir serviços avulsos
interface CreateItemComandaDataLocal {
  id_comanda: string
  id_servico?: string
  id_produto?: string
  nome_servico_avulso?: string
  preco_unitario?: number
  quantidade: number
  id_profissional_executante?: string
}

// Componente para adicionar itens
interface AddItemDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (item: CreateItemComandaDataLocal) => void
  comandaId: string
  loading: boolean
}

function AddItemDialog({ open, onClose, onAdd, comandaId, loading }: AddItemDialogProps) {
  const [tipoItem, setTipoItem] = useState<'servico' | 'produto'>('servico')
  const [tipoServico, setTipoServico] = useState<'cadastrado' | 'avulso'>('cadastrado')
  const [servicos, setServicos] = useState<Servico[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [nomeServicoAvulso, setNomeServicoAvulso] = useState<string>('')
  const [precoAvulso, setPrecoAvulso] = useState<number>(0)
  const [quantidade, setQuantidade] = useState<number>(1)
  const [loadingData, setLoadingData] = useState(false)

  // Carregar serviços e produtos quando abrir o dialog
  useEffect(() => {
    if (open) {
      carregarDados()
    }
  }, [open])

  const carregarDados = async () => {
    setLoadingData(true)
    try {
      await Promise.all([
        carregarServicos(),
        carregarProdutos()
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const carregarServicos = async () => {
    try {
      const response = await servicosService.getAll(
        { page: 1, limit: 100 },
        {}
      )
      
      if (response.error) {
        console.error('Erro ao carregar serviços:', response.error)
        return
      }
      
      const data = response.data
      
      if (data) {
        // Tratar tanto array quanto objeto paginado
        if (Array.isArray(data)) {
          setServicos(data)
        } else if (data && typeof data === 'object' && 'data' in data) {
          setServicos(data.data as Servico[])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    }
  }

  const carregarProdutos = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('produto')
        .select('*')
        .order('nome')
      
      if (error) {
        console.error('Erro ao carregar produtos:', error)
        return
      }
      
      setProdutos((data || []) as Produto[])
      
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }

  const handleSubmit = () => {
    // Validações por tipo
    if (tipoItem === 'servico' && tipoServico === 'cadastrado' && !selectedItem) {
      return
    }
    if (tipoItem === 'produto' && !selectedItem) {
      return  
    }
    if (tipoItem === 'servico' && tipoServico === 'avulso' && (!nomeServicoAvulso.trim() || precoAvulso <= 0)) {
      return
    }

    const itemData: CreateItemComandaDataLocal = {
      id_comanda: comandaId,
      quantidade,
      ...(tipoItem === 'servico' && tipoServico === 'cadastrado' && { id_servico: selectedItem }),
      ...(tipoItem === 'produto' && { id_produto: selectedItem }),
      ...(tipoItem === 'servico' && tipoServico === 'avulso' && { 
        nome_servico_avulso: nomeServicoAvulso,
        preco_unitario: precoAvulso 
      })
    }

    onAdd(itemData)
    
    // Reset form
    setSelectedItem('')
    setNomeServicoAvulso('')
    setPrecoAvulso(0)
    setQuantidade(1)
    setTipoServico('cadastrado')
    onClose()
  }

  const handleClose = () => {
    setSelectedItem('')
    setNomeServicoAvulso('')
    setPrecoAvulso(0)
    setQuantidade(1)
    setTipoServico('cadastrado')
    onClose()
  }

  const itemOptions = tipoItem === 'servico' ? servicos : produtos
  const selectedItemData = useMemo(() => {
    if (tipoItem === 'servico' && tipoServico === 'cadastrado' && selectedItem) {
      return servicos.find(s => s.id === selectedItem)
    }
    if (tipoItem === 'produto' && selectedItem) {
      return produtos.find(p => p.id === selectedItem)
    }
    return null
  }, [tipoItem, tipoServico, selectedItem, servicos, produtos])

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Adicionar Item à Comanda</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Item</InputLabel>
              <Select
                value={tipoItem}
                label="Tipo de Item"
                onChange={(e) => setTipoItem(e.target.value as 'servico' | 'produto')}
              >
                <MenuItem value="servico">Serviço</MenuItem>
                <MenuItem value="produto">Produto</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Tipo de Serviço - só aparece se for serviço */}
          {tipoItem === 'servico' && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Serviço</InputLabel>
                <Select
                  value={tipoServico}
                  label="Tipo de Serviço"
                  onChange={(e) => setTipoServico(e.target.value as 'cadastrado' | 'avulso')}
                >
                  <MenuItem value="cadastrado">Serviço Cadastrado</MenuItem>
                  <MenuItem value="avulso">Serviço Avulso</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            {tipoItem === 'servico' && tipoServico === 'cadastrado' ? (
              <Autocomplete
                options={servicos}
                getOptionLabel={(option) => option.nome}
                value={servicos.find(s => s.id === selectedItem) || null}
                onChange={(_, newValue) => setSelectedItem(newValue?.id || '')}
                disabled={loadingData}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selecionar Serviço"
                    required
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">{option.nome}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          R$ {option.preco.toFixed(2).replace('.', ',')}
                        </Typography>
                      </Box>
                    </Box>
                  )
                }}
                noOptionsText={loadingData ? "Carregando..." : "Nenhum serviço encontrado"}
              />
            ) : tipoItem === 'servico' && tipoServico === 'avulso' ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nome do Serviço Avulso"
                    value={nomeServicoAvulso}
                    onChange={(e) => setNomeServicoAvulso(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Preço do Serviço Avulso"
                    type="number"
                    value={precoAvulso}
                    onChange={(e) => setPrecoAvulso(Math.max(0, parseFloat(e.target.value) || 0))}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                    }}
                    required
                  />
                </Grid>
              </Grid>
            ) : tipoItem === 'produto' ? (
              <Autocomplete
                options={produtos}
                getOptionLabel={(option) => option.nome}
                value={produtos.find(p => p.id === selectedItem) || null}
                onChange={(_, newValue) => setSelectedItem(newValue?.id || '')}
                disabled={loadingData}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selecionar Produto"
                    required
                  />
                )}
                renderOption={(props, option) => {
                  const { key, ...otherProps } = props
                  return (
                    <Box component="li" key={key} {...otherProps}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">{option.nome}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          R$ {(option as any).preco_venda?.toFixed(2).replace('.', ',')} - Estoque: {(option as any).estoque_atual}
                        </Typography>
                      </Box>
                    </Box>
                  )
                }}
                noOptionsText={loadingData ? "Carregando..." : "Nenhum produto encontrado"}
              />
            ) : null}
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Quantidade"
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1 }}
              required
            />
          </Grid>

          {/* Resumo do item - só aparece quando há dados válidos */}
          {(selectedItemData || (tipoItem === 'servico' && tipoServico === 'avulso' && nomeServicoAvulso && precoAvulso > 0)) && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  {tipoItem === 'servico' && tipoServico === 'avulso' ? nomeServicoAvulso : selectedItemData?.nome}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Preço unitário: R$ {(tipoItem === 'servico' && tipoServico === 'avulso'
                    ? precoAvulso 
                    : tipoItem === 'servico' 
                      ? (selectedItemData as Servico).preco 
                      : (selectedItemData as any).preco_venda
                  )?.toFixed(2).replace('.', ',')}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium', mt: 1 }}>
                  Total: R$ {((tipoItem === 'servico' && tipoServico === 'avulso'
                    ? precoAvulso 
                    : tipoItem === 'servico' 
                      ? (selectedItemData as Servico).preco 
                      : (selectedItemData as any).preco_venda
                  ) * quantidade).toFixed(2).replace('.', ',')}</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            (tipoItem === 'servico' && tipoServico === 'cadastrado' && !selectedItem) ||
            (tipoItem === 'produto' && !selectedItem) ||
            (tipoItem === 'servico' && tipoServico === 'avulso' && (!nomeServicoAvulso.trim() || precoAvulso <= 0)) ||
            loading || 
            loadingData
          }
          startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          {loading ? 'Adicionando...' : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Componente principal
export default function ComandaDetalhes({ 
  comanda, 
  open, 
  onClose, 
  onFinishComanda,
  onUpdateComanda 
}: ComandaDetalhesProps) {
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false)
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false)
  const [discountValue, setDiscountValue] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debug da comanda recebida
  console.log('🎯 ComandaDetalhes - Comanda recebida:', {
    id: comanda.id,
    nome: comanda.nome_cliente_avulso || comanda.cliente?.nome,
    total: comanda.valor_total_servicos + comanda.valor_total_produtos,
    itensExists: !!comanda.itens,
    itensLength: comanda.itens?.length,
    itensData: comanda.itens,
    primeiroItem: comanda.itens?.[0] ? {
      id: comanda.itens[0].id,
      nome_servico_avulso: comanda.itens[0].nome_servico_avulso,
      servico: comanda.itens[0].servico,
      produto: comanda.itens[0].produto,
      quantidade: comanda.itens[0].quantidade,
      preco_unitario: comanda.itens[0].preco_unitario_registrado,
      preco_total: comanda.itens[0].preco_total_item
    } : null
  })

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
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

  const getStatusLabel = (status: string) => {
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

  // Cálculos financeiros
  const subtotal = comanda.valor_total_servicos + comanda.valor_total_produtos
  const valorDesconto = comanda.valor_desconto || 0
  const total = subtotal - valorDesconto

  // Função para adicionar item
  const handleAddItem = async (itemData: CreateItemComandaDataLocal) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await itensComandaService.create(itemData)

      if (error) {
        setError('Erro ao adicionar item: ' + error)
        return
      }

      // Recarregar comanda
      onUpdateComanda()
      
    } catch (err) {
      console.error('Erro ao adicionar item:', err)
      setError('Erro inesperado ao adicionar item')
    } finally {
      setLoading(false)
    }
  }

  // Função para remover item
  const handleRemoveItem = async (itemId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await itensComandaService.delete(itemId)

      if (error) {
        setError('Erro ao remover item: ' + error)
        return
      }

      // Recarregar comanda
      onUpdateComanda()
      
    } catch (err) {
      console.error('Erro ao remover item:', err)
      setError('Erro inesperado ao remover item')
    } finally {
      setLoading(false)
    }
  }

  // Função para aplicar desconto
  const handleApplyDiscount = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Implementar desconto via service quando disponível
      // Por enquanto, vamos simular a aplicação do desconto
      setDiscountDialogOpen(false)
      setError('Funcionalidade de desconto será implementada em próxima versão')
      
      // TODO: Implementar quando o service de desconto estiver disponível
      // const { data, error } = await comandasService.aplicarDesconto(comanda.id, discountValue)
      // if (error) {
      //   setError('Erro ao aplicar desconto: ' + error)
      //   return
      // }
      // onUpdateComanda()
    } catch (err) {
      console.error('Erro ao aplicar desconto:', err)
      setError('Erro inesperado ao aplicar desconto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              Cliente: {comanda.cliente?.nome || comanda.nome_cliente_avulso || 'Cliente não identificado'}
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Informações da Comanda */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Informações da Comanda</Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    <strong>ID da Comanda:</strong> #{comanda.id.slice(-8).toUpperCase()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Profissional:</strong> {(comanda.profissional_responsavel as any)?.usuario_responsavel?.nome_completo || 'Profissional não identificado'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Data de Abertura:</strong> {formatDateTime(comanda.data_abertura)}
                  </Typography>
                  {comanda.data_fechamento && (
                    <Typography variant="body2">
                      <strong>Data de Fechamento:</strong> {formatDateTime(comanda.data_fechamento)}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2"><strong>Status:</strong></Typography>
                    <Chip
                      label={getStatusLabel(comanda.status)}
                      color={getStatusColor(comanda.status) as 'warning' | 'success' | 'error' | 'default'}
                      size="small"
                    />
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Resumo Financeiro</Typography>
                  {comanda.status === 'ABERTA' && (
                    <IconButton 
                      size="small" 
                      onClick={() => setDiscountDialogOpen(true)}
                      title="Aplicar desconto"
                    >
                      <DiscountIcon />
                    </IconButton>
                  )}
                </Box>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Desconto:</Typography>
                    <Typography variant="body2" color="error.main">
                      -{formatCurrency(valorDesconto)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" fontWeight="bold">Total:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main">
                      {formatCurrency(total)}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Tabela de Itens */}
          <Paper sx={{ mb: 3 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Itens da Comanda</Typography>
              {comanda.status === 'ABERTA' && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  size="small"
                  onClick={() => setAddItemDialogOpen(true)}
                  disabled={loading}
                >
                  Adicionar Item
                </Button>
              )}
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell align="center">Tipo</TableCell>
                    <TableCell align="center">Quantidade</TableCell>
                    <TableCell align="center">Preço Unit.</TableCell>
                    <TableCell align="center">Preço Total</TableCell>
                    {comanda.status === 'ABERTA' && (
                      <TableCell align="center">Ações</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comanda.itens?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {item.nome_servico_avulso || item.servico?.nome || item.produto?.nome || 'Item não identificado'}
                            </Typography>
                            {item.nome_servico_avulso && (
                              <Chip 
                                label="Avulso" 
                                size="small" 
                                color="warning" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                          {item.profissional_executante && (
                            <Typography variant="caption" color="text.secondary">
                              Executante: {(item.profissional_executante as any)?.usuario_executante?.nome_completo || 'Profissional não identificado'}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={
                            item.nome_servico_avulso 
                              ? 'Serviço Avulso' 
                              : item.servico 
                                ? 'Serviço' 
                                : 'Produto'
                          } 
                          size="small"
                          color={
                            item.nome_servico_avulso 
                              ? 'warning' 
                              : item.servico 
                                ? 'primary' 
                                : 'secondary'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">{item.quantidade}</TableCell>
                      <TableCell align="center">
                        {formatCurrency(item.preco_unitario_registrado)}
                      </TableCell>
                      <TableCell align="center">
                        {formatCurrency(item.preco_total_item || 0)}
                      </TableCell>
                      {comanda.status === 'ABERTA' && (
                        <TableCell align="center">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={loading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {(!comanda.itens || comanda.itens.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={comanda.status === 'ABERTA' ? 6 : 5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Nenhum item adicionado à comanda
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Fechar
          </Button>
          {comanda.status === 'ABERTA' && (
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={onFinishComanda}
              color="success"
              disabled={!comanda.itens || comanda.itens.length === 0 || total <= 0}
            >
              Finalizar Comanda
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog para adicionar item */}
      <AddItemDialog
        open={addItemDialogOpen}
        onClose={() => setAddItemDialogOpen(false)}
        onAdd={handleAddItem}
        comandaId={comanda.id}
        loading={loading}
      />

      {/* Dialog para aplicar desconto */}
      <Dialog open={discountDialogOpen} onClose={() => setDiscountDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aplicar Desconto</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Valor do Desconto (R$)"
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
            inputProps={{ min: 0, max: subtotal, step: 0.01 }}
            sx={{ mt: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Desconto máximo: {formatCurrency(subtotal)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiscountDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleApplyDiscount}
            variant="contained"
            disabled={discountValue < 0 || discountValue > subtotal}
          >
            Aplicar Desconto
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay */}
      <Backdrop 
        open={loading} 
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  )
}