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
  Chip,
  Stack,
  Autocomplete,
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { Agendamento, Cliente, Servico } from '@/types/database'

dayjs.locale('pt-br')

// Schema de validação com Zod
const agendamentoSchema = z.object({
  id_cliente: z
    .string()
    .min(1, 'Cliente é obrigatório'),
  id_profissional: z
    .string()
    .min(1, 'Profissional é obrigatório'),
  data: z
    .any()
    .refine((val) => dayjs(val).isValid(), 'Data é obrigatória'),
  hora_inicio: z
    .any()
    .refine((val) => dayjs(val).isValid(), 'Horário de início é obrigatório'),
  servicos: z
    .array(z.string())
    .min(1, 'Pelo menos um serviço deve ser selecionado'),
  observacoes: z
    .string()
    .max(500, 'Observações devem ter no máximo 500 caracteres')
    .optional()
    .or(z.literal('')),
})

type AgendamentoFormData = z.infer<typeof agendamentoSchema>

interface AgendamentoFormProps {
  open: boolean
  onClose: () => void
  onSave: (agendamento: AgendamentoFormData) => void
  agendamento?: Partial<Agendamento>
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

const servicosData: Partial<Servico>[] = [
  {
    id: '1',
    nome: 'Corte Feminino',
    duracao_estimada_minutos: 60,
    preco: 80.00,
  },
  {
    id: '2',
    nome: 'Coloração Completa',
    duracao_estimada_minutos: 180,
    preco: 350.00,
  },
  {
    id: '3',
    nome: 'Manicure e Pedicure',
    duracao_estimada_minutos: 90,
    preco: 45.00,
  },
  {
    id: '4',
    nome: 'Corte Masculino + Barba',
    duracao_estimada_minutos: 45,
    preco: 60.00,
  },
]

export default function AgendamentoForm({
  open,
  onClose,
  onSave,
  agendamento,
  loading = false,
  error = null
}: AgendamentoFormProps) {
  const isEditing = !!agendamento?.id
  const [selectedServicos, setSelectedServicos] = useState<string[]>([])

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      id_cliente: agendamento?.id_cliente || '',
      id_profissional: agendamento?.id_profissional || '',
      data: agendamento ? dayjs(agendamento.data_hora_inicio) : dayjs(),
      hora_inicio: agendamento ? dayjs(agendamento.data_hora_inicio) : dayjs().hour(9).minute(0),
      servicos: [],
      observacoes: agendamento?.observacoes || '',
    },
  })

  const watchedServicos = watch('servicos')

  // Calcular duração total e valor total dos serviços selecionados
  const servicosSelecionados = servicosData.filter(s => watchedServicos?.includes(s.id || ''))
  const duracaoTotal = servicosSelecionados.reduce((acc, s) => acc + (s.duracao_estimada_minutos || 0), 0)
  const valorTotal = servicosSelecionados.reduce((acc, s) => acc + (s.preco || 0), 0)

  const onSubmit = (data: AgendamentoFormData) => {
    const dataFormatted = {
      ...data,
      data_hora_inicio: dayjs(data.data)
        .hour(dayjs(data.hora_inicio).hour())
        .minute(dayjs(data.hora_inicio).minute())
        .toISOString(),
      data_hora_fim: dayjs(data.data)
        .hour(dayjs(data.hora_inicio).hour())
        .minute(dayjs(data.hora_inicio).minute())
        .add(duracaoTotal, 'minute')
        .toISOString(),
    }
    onSave(dataFormatted)
  }

  const handleClose = () => {
    reset()
    setSelectedServicos([])
    onClose()
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}min` : ''}`
    }
    return `${mins}min`
  }

  React.useEffect(() => {
    if (open && agendamento) {
      reset({
        id_cliente: agendamento.id_cliente || '',
        id_profissional: agendamento.id_profissional || '',
        data: agendamento.data_hora_inicio ? dayjs(agendamento.data_hora_inicio) : dayjs(),
        hora_inicio: agendamento.data_hora_inicio ? dayjs(agendamento.data_hora_inicio) : dayjs().hour(9).minute(0),
        servicos: [],
        observacoes: agendamento.observacoes || '',
      })
    }
  }, [open, agendamento, reset])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
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
              <EventIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
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
              {/* Cliente */}
              <Grid item xs={12} md={6}>
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
                          helperText={errors.id_cliente?.message}
                          disabled={loading}
                        />
                      )}
                      renderOption={(props, option) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body1">{option.nome}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {option.telefone}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    />
                  )}
                />
              </Grid>

              {/* Profissional */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="id_profissional"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.id_profissional}>
                      <InputLabel>Profissional *</InputLabel>
                      <Select
                        {...field}
                        label="Profissional *"
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
                      {errors.id_profissional && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, mx: 1.75 }}>
                          {String(errors.id_profissional.message || 'Erro de validação')}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Data */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="data"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Data *"
                      minDate={dayjs()}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.data,
                          helperText: errors.data?.message as string,
                          disabled: loading,
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Horário */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="hora_inicio"
                  control={control}
                  render={({ field }) => (
                    <TimePicker
                      {...field}
                      label="Horário de Início *"
                      ampm={false}
                      views={['hours', 'minutes']}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.hora_inicio,
                          helperText: errors.hora_inicio?.message as string,
                          disabled: loading,
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Serviços */}
              <Grid item xs={12}>
                <Controller
                  name="servicos"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.servicos}>
                      <InputLabel>Serviços *</InputLabel>
                      <Select
                        {...field}
                        multiple
                        label="Serviços *"
                        value={field.value || []}
                        onChange={(e) => {
                          const value = e.target.value as string[]
                          field.onChange(value)
                          setSelectedServicos(value)
                        }}
                        renderValue={(selected) => (
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => {
                              const servico = servicosData.find(s => s.id === value)
                              return (
                                <Chip
                                  key={value}
                                  label={servico?.nome}
                                  size="small"
                                  color="primary"
                                />
                              )
                            })}
                          </Stack>
                        )}
                        disabled={loading}
                      >
                        {servicosData.map((servico) => (
                          <MenuItem key={servico.id} value={servico.id}>
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body1">{servico.nome}</Typography>
                                <Typography variant="body2" color="primary" fontWeight="bold">
                                  R$ {servico.preco?.toFixed(2).replace('.', ',')}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                Duração: {formatTime(servico.duracao_estimada_minutos || 0)}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.servicos && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, mx: 1.75 }}>
                          {String(errors.servicos.message || 'Erro de validação')}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Resumo dos serviços selecionados */}
              {servicosSelecionados.length > 0 && (
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'primary.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.200'
                  }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      Resumo do Agendamento
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TimeIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          Duração total: {formatTime(duracaoTotal)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        Total: R$ {valorTotal.toFixed(2).replace('.', ',')}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Horário previsto de término: {
                        watch('hora_inicio') ? 
                        dayjs(watch('hora_inicio')).add(duracaoTotal, 'minute').format('HH:mm') :
                        '--:--'
                      }
                    </Typography>
                  </Box>
                </Grid>
              )}

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
                      helperText={errors.observacoes?.message as string || 'Informações adicionais sobre o agendamento'}
                      disabled={loading}
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
              disabled={loading || isSubmitting || servicosSelecionados.length === 0}
              startIcon={<SaveIcon />}
              sx={{ minWidth: 120 }}
            >
              {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Agendar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  )
} 