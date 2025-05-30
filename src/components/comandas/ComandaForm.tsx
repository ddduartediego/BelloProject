'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCut as ServiceIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Comanda, Cliente, Servico } from '@/types/database'
import { clientesService, profissionaisService, servicosService, type CreateComandaData } from '@/services'

// Interface para itens da comanda
interface ItemComanda {
  id_servico?: string
  nome_servico_avulso?: string
  preco_unitario: number
  quantidade: number
  servico?: Servico
}

// Schema de validação expandido
const comandaSchema = z.object({
  tipo_cliente: z.enum(['cadastrado', 'avulso'], {
    required_error: 'Tipo de cliente é obrigatório'
  }),
  id_cliente: z
    .string()
    .optional(),
  nome_cliente_avulso: z
    .string()
    .optional(),
  id_profissional_responsavel: z
    .string()
    .min(1, 'Profissional responsável é obrigatório'),
  itens: z
    .array(z.object({
      id_servico: z.string().optional(),
      nome_servico_avulso: z.string().optional(),
      preco_unitario: z.number().positive('Preço deve ser positivo'),
      quantidade: z.number().positive('Quantidade deve ser positiva').int()
    }))
    .min(1, 'Adicione pelo menos um serviço')
}).refine((data) => {
  if (data.tipo_cliente === 'cadastrado') {
    return !!data.id_cliente
  }
  if (data.tipo_cliente === 'avulso') {
    return !!data.nome_cliente_avulso && data.nome_cliente_avulso.trim().length > 0
  }
  return false
}, {
  message: 'Cliente é obrigatório',
  path: ['id_cliente']
})

type ComandaFormData = z.infer<typeof comandaSchema>

interface ComandaFormProps {
  open: boolean
  onClose: () => void
  onSave: (comanda: CreateComandaData) => void
  comanda?: Partial<Comanda>
  loading?: boolean
  error?: string | null
}

export default function ComandaForm({
  open,
  onClose,
  onSave,
  comanda,
  loading = false,
  error = null
}: ComandaFormProps) {
  const isEditing = !!comanda?.id
  
  // Estados para dados carregados
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [loadingData, setLoadingData] = useState(false)
  
  // Estados para dialog de adicionar item
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [novoItem, setNovoItem] = useState<{
    tipo: 'cadastrado' | 'avulso'
    id_servico: string
    nome_servico_avulso: string
    preco_unitario: number
    quantidade: number
  }>({
    tipo: 'cadastrado',
    id_servico: '',
    nome_servico_avulso: '',
    preco_unitario: 0,
    quantidade: 1
  })

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ComandaFormData>({
    resolver: zodResolver(comandaSchema),
    defaultValues: {
      tipo_cliente: 'cadastrado',
      id_cliente: comanda?.id_cliente || '',
      nome_cliente_avulso: comanda?.nome_cliente_avulso || '',
      id_profissional_responsavel: comanda?.id_profissional_responsavel || '',
      itens: [],
    },
  })

  const tipoCliente = watch('tipo_cliente')

  // Carregar dados quando abrir o dialog
  useEffect(() => {
    if (open) {
      carregarDados()
    }
  }, [open])

  const carregarDados = async () => {
    setLoadingData(true)
    try {
      // Carregar clientes, profissionais e servicos em paralelo
      const [clientesResult, profissionaisResult, servicosResult] = await Promise.all([
        clientesService.getAll({ page: 1, limit: 100 }),
        profissionaisService.getAll({ page: 1, limit: 50 }),
        servicosService.getAll({ page: 1, limit: 100 })
      ])

      if (clientesResult.data) {
        // Verificar se é array ou objeto paginado
        if (Array.isArray(clientesResult.data)) {
          setClientes(clientesResult.data)
        } else if (clientesResult.data && typeof clientesResult.data === 'object' && 'items' in clientesResult.data) {
          setClientes(clientesResult.data.items as Cliente[])
        }
      }

      if (profissionaisResult.data) {
        // Verificar se é array ou objeto paginado
        if (Array.isArray(profissionaisResult.data)) {
          setProfissionais(profissionaisResult.data)
        } else if (profissionaisResult.data && typeof profissionaisResult.data === 'object' && 'items' in profissionaisResult.data) {
          setProfissionais(profissionaisResult.data.items as any[])
        }
      }

      if (servicosResult.data) {
        // Verificar se é array ou objeto paginado
        if (Array.isArray(servicosResult.data)) {
          setServicos(servicosResult.data)
        } else if (servicosResult.data && typeof servicosResult.data === 'object' && 'items' in servicosResult.data) {
          setServicos(servicosResult.data.items as Servico[])
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const onSubmit = (data: ComandaFormData) => {
    const comandaData: CreateComandaData = {
      id_cliente: data.tipo_cliente === 'cadastrado' ? data.id_cliente : undefined,
      nome_cliente_avulso: data.tipo_cliente === 'avulso' ? data.nome_cliente_avulso : undefined,
      id_profissional_responsavel: data.id_profissional_responsavel,
      itens: data.itens.map((item) => ({
        id_servico: item.id_servico,
        nome_servico_avulso: item.nome_servico_avulso,
        preco_unitario: item.preco_unitario,
        quantidade: item.quantidade,
        servico: item.id_servico ? servicos.find(s => s.id === item.id_servico) : undefined,
      })),
    }
    onSave(comandaData)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  React.useEffect(() => {
    if (open && comanda) {
      reset({
        tipo_cliente: comanda.id_cliente ? 'cadastrado' : 'avulso',
        id_cliente: comanda.id_cliente || '',
        nome_cliente_avulso: comanda.nome_cliente_avulso || '',
        id_profissional_responsavel: comanda.id_profissional_responsavel || '',
        itens: [],
      })
    }
  }, [open, comanda, reset])

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {isEditing ? 'Editar Comanda' : 'Nova Comanda'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loadingData && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 2 }}>Carregando dados...</Typography>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Tipo de Cliente */}
            <Grid item xs={12}>
              <Controller
                name="tipo_cliente"
                control={control}
                render={({ field }) => (
                  <FormControl>
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Tipo de Cliente *
                    </FormLabel>
                    <RadioGroup
                      {...field}
                      row
                      sx={{ gap: 3 }}
                    >
                      <FormControlLabel 
                        value="cadastrado" 
                        control={<Radio />} 
                        label="Cliente Cadastrado" 
                      />
                      <FormControlLabel 
                        value="avulso" 
                        control={<Radio />} 
                        label="Cliente Avulso" 
                      />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Cliente Cadastrado */}
            {tipoCliente === 'cadastrado' && (
              <Grid item xs={12}>
                <Controller
                  name="id_cliente"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={clientes}
                      getOptionLabel={(option) => typeof option === 'string' ? 
                        clientes.find(c => c.id === option)?.nome || '' : 
                        option.nome
                      }
                      value={clientes.find(c => c.id === field.value) || null}
                      onChange={(_, newValue) => {
                        field.onChange(newValue?.id || '')
                      }}
                      disabled={loading || loadingData}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Cliente *"
                          error={!!errors.id_cliente}
                          helperText={errors.id_cliente?.message as string}
                          placeholder="Busque por nome, telefone ou email"
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1">{option.nome}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.telefone} {option.email && `• ${option.email}`}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      noOptionsText={loadingData ? "Carregando..." : "Nenhum cliente encontrado"}
                    />
                  )}
                />
              </Grid>
            )}

            {/* Cliente Avulso */}
            {tipoCliente === 'avulso' && (
              <Grid item xs={12}>
                <Controller
                  name="nome_cliente_avulso"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Nome do Cliente *"
                      error={!!errors.nome_cliente_avulso}
                      helperText={errors.nome_cliente_avulso?.message as string}
                      disabled={loading}
                      placeholder="Digite o nome do cliente"
                    />
                  )}
                />
              </Grid>
            )}

            {/* Profissional Responsável */}
            <Grid item xs={12}>
              <Controller
                name="id_profissional_responsavel"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.id_profissional_responsavel}>
                    <InputLabel>Profissional Responsável *</InputLabel>
                    <Select
                      {...field}
                      label="Profissional Responsável *"
                      disabled={loading || loadingData}
                    >
                      {profissionais.map((profissional) => (
                        <MenuItem key={profissional.id} value={profissional.id}>
                          <Box>
                            <Typography variant="body1">
                              {profissional.usuario?.nome || 'Nome não disponível'}
                            </Typography>
                            {profissional.especialidades && profissional.especialidades.length > 0 && (
                              <Typography variant="body2" color="text.secondary">
                                {profissional.especialidades.join(', ')}
                              </Typography>
                            )}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.id_profissional_responsavel && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        {errors.id_profissional_responsavel.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Itens da Comanda */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>
                <Chip 
                  icon={<ServiceIcon />} 
                  label="Serviços da Comanda" 
                  variant="outlined" 
                />
              </Divider>
              
              <FormControl fullWidth error={!!errors.itens}>
                {errors.itens && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.itens.message}
                  </Alert>
                )}
                
                {/* Lista de itens */}
                <Box sx={{ mb: 2 }}>
                  {watch('itens').length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4, 
                      border: '2px dashed #ddd', 
                      borderRadius: 2,
                      backgroundColor: '#fafafa'
                    }}>
                      <ServiceIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="body1" color="text.secondary" gutterBottom>
                        Nenhum serviço adicionado
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Clique em &quot;Adicionar Serviço&quot; para começar
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      {watch('itens').map((item, index) => {
                        const servicoCadastrado = item.id_servico ? servicos.find(s => s.id === item.id_servico) : null
                        const nomeServico = servicoCadastrado?.nome || item.nome_servico_avulso
                        const precoTotal = item.preco_unitario * item.quantidade
                        
                        return (
                          <ListItem key={index} divider={index < watch('itens').length - 1}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ServiceIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                                  <Typography variant="body1" fontWeight="medium">
                                    {nomeServico}
                                  </Typography>
                                  {servicoCadastrado && (
                                    <Chip 
                                      label="Cadastrado" 
                                      size="small" 
                                      color="primary" 
                                      variant="outlined" 
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {item.preco_unitario.toLocaleString('pt-BR', { 
                                      style: 'currency', 
                                      currency: 'BRL' 
                                    })} × {item.quantidade} = {precoTotal.toLocaleString('pt-BR', { 
                                      style: 'currency', 
                                      currency: 'BRL' 
                                    })}
                                  </Typography>
                                  {servicoCadastrado && (
                                    <Typography variant="caption" color="text.secondary">
                                      Duração: {servicoCadastrado.duracao_estimada_minutos}min
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => {
                                  const currentItens = getValues('itens')
                                  const newItens = currentItens.filter((_, i) => i !== index)
                                  setValue('itens', newItens)
                                }}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        )
                      })}
                    </List>
                  )}
                </Box>
                
                {/* Total */}
                {watch('itens').length > 0 && (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'primary.50', 
                    borderRadius: 1, 
                    border: '1px solid',
                    borderColor: 'primary.200',
                    mb: 2
                  }}>
                    <Typography variant="h6" color="primary.main" textAlign="center">
                      Total: {watch('itens').reduce((total, item) => 
                        total + (item.preco_unitario * item.quantidade), 0
                      ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </Typography>
                  </Box>
                )}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setItemDialogOpen(true)}
                  disabled={loading || loadingData}
                  variant="outlined"
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  Adicionar Serviço
                </Button>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={loading || loadingData}
            sx={{
              minWidth: 120,
              textTransform: 'none',
            }}
          >
            {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Comanda')}
          </Button>
        </DialogActions>
      </form>

      {/* Dialog para adicionar item */}
      <Dialog
        open={itemDialogOpen}
        onClose={() => setItemDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Adicionar Serviço
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            {/* Tipo de serviço */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 'bold' }}>
                Tipo de Serviço
              </FormLabel>
              <RadioGroup
                value={novoItem.tipo}
                onChange={(e) => setNovoItem(prev => ({ ...prev, tipo: e.target.value as 'cadastrado' | 'avulso' }))}
                row
              >
                <FormControlLabel 
                  value="cadastrado" 
                  control={<Radio />} 
                  label="Serviço Cadastrado" 
                />
                <FormControlLabel 
                  value="avulso" 
                  control={<Radio />} 
                  label="Serviço Avulso" 
                />
              </RadioGroup>
            </FormControl>

            {/* Seleção de serviço cadastrado */}
            {novoItem.tipo === 'cadastrado' && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Selecionar Serviço</InputLabel>
                <Select
                  value={novoItem.id_servico}
                  onChange={(e) => {
                    const servicoSelecionado = servicos.find(s => s.id === e.target.value)
                    setNovoItem(prev => ({
                      ...prev,
                      id_servico: e.target.value,
                      preco_unitario: servicoSelecionado?.preco || 0
                    }))
                  }}
                  label="Selecionar Serviço"
                >
                  {servicos.map((servico) => (
                    <MenuItem key={servico.id} value={servico.id}>
                      <Box>
                        <Typography variant="body1">{servico.nome}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {servico.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} • {servico.duracao_estimada_minutos}min
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Nome do serviço avulso */}
            {novoItem.tipo === 'avulso' && (
              <TextField
                fullWidth
                label="Nome do Serviço"
                value={novoItem.nome_servico_avulso}
                onChange={(e) => setNovoItem(prev => ({ ...prev, nome_servico_avulso: e.target.value }))}
                sx={{ mb: 3 }}
                placeholder="Digite o nome do serviço"
              />
            )}

            <Grid container spacing={2}>
              {/* Preço unitário */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Preço Unitário"
                  type="number"
                  value={novoItem.preco_unitario}
                  onChange={(e) => setNovoItem(prev => ({ ...prev, preco_unitario: parseFloat(e.target.value) || 0 }))}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>
                  }}
                  disabled={novoItem.tipo === 'cadastrado' && !!novoItem.id_servico}
                />
              </Grid>

              {/* Quantidade */}
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Quantidade"
                  type="number"
                  value={novoItem.quantidade}
                  onChange={(e) => setNovoItem(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                  inputProps={{ min: 1 }}
                />
              </Grid>
            </Grid>

            {/* Total do item */}
            {(novoItem.preco_unitario > 0 && novoItem.quantidade > 0) && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'success.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'success.200'
              }}>
                <Typography variant="body1" fontWeight="bold" color="success.dark">
                  Total do Item: {(novoItem.preco_unitario * novoItem.quantidade).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              // Validações
              if (novoItem.tipo === 'cadastrado' && !novoItem.id_servico) {
                alert('Selecione um serviço')
                return
              }
              if (novoItem.tipo === 'avulso' && !novoItem.nome_servico_avulso.trim()) {
                alert('Digite o nome do serviço')
                return
              }
              if (novoItem.preco_unitario <= 0) {
                alert('Digite um preço válido')
                return
              }
              if (novoItem.quantidade <= 0) {
                alert('Digite uma quantidade válida')
                return
              }

              // Adicionar item
              const newItem = {
                id_servico: novoItem.tipo === 'cadastrado' ? novoItem.id_servico : undefined,
                nome_servico_avulso: novoItem.tipo === 'avulso' ? novoItem.nome_servico_avulso : undefined,
                preco_unitario: novoItem.preco_unitario,
                quantidade: novoItem.quantidade
              }
              
              const currentItens = getValues('itens')
              setValue('itens', [...currentItens, newItem])
              
              // Reset form e fechar dialog
              setNovoItem({
                tipo: 'cadastrado',
                id_servico: '',
                nome_servico_avulso: '',
                preco_unitario: 0,
                quantidade: 1
              })
              setItemDialogOpen(false)
            }}
            variant="contained"
            disabled={
              (novoItem.tipo === 'cadastrado' && !novoItem.id_servico) ||
              (novoItem.tipo === 'avulso' && !novoItem.nome_servico_avulso.trim()) ||
              novoItem.preco_unitario <= 0 ||
              novoItem.quantidade <= 0
            }
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
} 