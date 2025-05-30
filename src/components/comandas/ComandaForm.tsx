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
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Receipt as ReceiptIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Comanda, Cliente } from '@/types/database'
import { clientesService, profissionaisService, type CreateComandaData } from '@/services'

// Schema de validação com Zod
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
    .min(1, 'Profissional responsável é obrigatório')
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
  const [loadingData, setLoadingData] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComandaFormData>({
    resolver: zodResolver(comandaSchema),
    defaultValues: {
      tipo_cliente: 'cadastrado',
      id_cliente: comanda?.id_cliente || '',
      nome_cliente_avulso: comanda?.nome_cliente_avulso || '',
      id_profissional_responsavel: comanda?.id_profissional_responsavel || '',
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
      // Carregar clientes e profissionais em paralelo
      const [clientesResult, profissionaisResult] = await Promise.all([
        clientesService.getAll({ page: 1, limit: 100 }),
        profissionaisService.getAll({ page: 1, limit: 50 })
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
    </Dialog>
  )
} 