'use client'

import React, { useState } from 'react'
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
    .min(1, 'Profissional responsável é obrigatório'),
  observacoes: z
    .string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
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
  onSave: (comanda: ComandaFormData) => void
  comanda?: Partial<Comanda>
  loading?: boolean
  error?: string | null
}

// Dados simulados para demonstração
const clientesData: Cliente[] = [
  {
    id: '1',
    nome: 'Maria Silva Santos',
    telefone: '(11) 99999-1111',
    email: 'maria.silva@email.com',
    id_empresa: 'empresa-1',
    criado_em: '2024-01-15T10:00:00Z',
    atualizado_em: '2024-12-01T15:30:00Z',
  },
  {
    id: '2',
    nome: 'João Carlos Oliveira',
    telefone: '(11) 99999-2222',
    email: 'joao.carlos@email.com',
    id_empresa: 'empresa-1',
    criado_em: '2024-02-20T14:30:00Z',
    atualizado_em: '2024-11-28T09:15:00Z',
  },
  {
    id: '3',
    nome: 'Amanda Costa Ferreira',
    telefone: '(11) 99999-3333',
    email: 'amanda.costa@email.com',
    id_empresa: 'empresa-1',
    criado_em: '2024-03-10T11:20:00Z',
    atualizado_em: '2024-12-05T16:45:00Z',
  },
]

const profissionaisData = [
  { id: '1', nome: 'Ana Carolina', especialidades: ['Corte', 'Coloração'] },
  { id: '2', nome: 'Roberto Silva', especialidades: ['Barba', 'Corte Masculino'] },
  { id: '3', nome: 'Carla Santos', especialidades: ['Manicure', 'Pedicure'] },
]

export default function ComandaForm({
  open,
  onClose,
  onSave,
  comanda,
  loading = false,
  error = null
}: ComandaFormProps) {
  const isEditing = !!comanda?.id

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
      observacoes: '',
    },
  })

  const tipoCliente = watch('tipo_cliente')

  const onSubmit = (data: ComandaFormData) => {
    onSave(data)
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
        observacoes: '',
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
                      options={clientesData}
                      getOptionLabel={(option) => typeof option === 'string' ? 
                        clientesData.find(c => c.id === option)?.nome || '' : 
                        option.nome
                      }
                      value={clientesData.find(c => c.id === field.value) || null}
                      onChange={(_, newValue) => {
                        field.onChange(newValue?.id || '')
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Cliente *"
                          error={!!errors.id_cliente}
                          helperText={errors.id_cliente?.message as string}
                          disabled={loading}
                          placeholder="Busque por nome, telefone ou email"
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <PersonIcon color="action" />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1">{option.nome}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {option.telefone} • {option.email}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )}
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
                      label="Nome do Cliente *"
                      fullWidth
                      error={!!errors.nome_cliente_avulso}
                      helperText={errors.nome_cliente_avulso?.message as string || 'Digite o nome do cliente avulso'}
                      disabled={loading}
                      placeholder="Ex: João da Silva"
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
                      disabled={loading}
                    >
                      {profissionaisData.map((profissional) => (
                        <MenuItem key={profissional.id} value={profissional.id}>
                          <Box>
                            <Typography variant="body1">{profissional.nome}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {profissional.especialidades.join(', ')}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.id_profissional_responsavel && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, mx: 1.75 }}>
                        {String(errors.id_profissional_responsavel.message || 'Erro de validação')}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Observações */}
            <Grid item xs={12}>
              <Controller
                name="observacoes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Observações"
                    multiline
                    rows={3}
                    fullWidth
                    error={!!errors.observacoes}
                    helperText={errors.observacoes?.message as string || 'Informações adicionais sobre a comanda'}
                    disabled={loading}
                    placeholder="Ex: Cliente preferencial, desconto especial, etc."
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || isSubmitting}
            startIcon={<SaveIcon />}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Abrindo...' : isEditing ? 'Atualizar' : 'Abrir Comanda'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 