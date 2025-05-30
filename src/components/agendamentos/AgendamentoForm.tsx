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
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Autocomplete,
  Card,
  CardContent,
  Chip,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Event as EventIcon,
  Person as PersonIcon,
  ContentCut as ServiceIcon,
  Schedule as ScheduleIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  AccessTime as TimeIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Cliente, Servico } from '@/types/database'
import { ProfissionalComUsuario } from '@/services/profissionais.service'
import { clientesService, servicosService, profissionaisService } from '@/services'
import { AgendamentoAdapter, type AgendamentoCompleto, type AgendamentoFormData as AdapterFormData } from '@/utils/agendamento-adapter'
import ConflictChecker, { type ConflictCheckResult } from './ConflictChecker'
import TimeSlotPicker from './TimeSlotPicker'

// Schema de validação com Zod
const agendamentoSchema = z.object({
  id_cliente: z.string().min(1, 'Cliente é obrigatório'),
  id_servico: z.string().min(1, 'Serviço é obrigatório'),
  id_profissional: z.string().min(1, 'Profissional é obrigatório'),
  data_agendamento: z.string().min(1, 'Data é obrigatória'),
  hora_inicio: z.string().min(1, 'Horário é obrigatório'),
  observacoes: z.string().optional()
})

type AgendamentoFormData = z.infer<typeof agendamentoSchema>

interface AgendamentoFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: AdapterFormData) => void
  agendamento?: AgendamentoCompleto
  loading?: boolean
}

const steps = [
  'Cliente',
  'Serviço',
  'Profissional',
  'Data e Hora',
  'Confirmação'
]

export default function AgendamentoForm({
  open,
  onClose,
  onSave,
  agendamento,
  loading = false
}: AgendamentoFormProps) {
  const [activeStep, setActiveStep] = useState(0)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [servicos, setServicos] = useState<Servico[]>([])
  const [profissionais, setProfissionais] = useState<ProfissionalComUsuario[]>([])
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [selectedServico, setSelectedServico] = useState<Servico | null>(null)
  const [selectedProfissional, setSelectedProfissional] = useState<ProfissionalComUsuario | null>(null)
  const [timeSelectionMode, setTimeSelectionMode] = useState<'manual' | 'picker'>('picker')
  const [conflictCheckResult, setConflictCheckResult] = useState<ConflictCheckResult | null>(null)

  const isEditing = Boolean(agendamento)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid },
    setValue,
    watch,
    trigger
  } = useForm<AgendamentoFormData>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      id_cliente: '',
      id_servico: '',
      id_profissional: '',
      data_agendamento: format(new Date(), 'yyyy-MM-dd'),
      hora_inicio: '09:00',
      observacoes: ''
    },
    mode: 'onChange'
  })

  // Observar mudanças no formulário
  const formData = watch()

  // Carregar dados iniciais
  useEffect(() => {
    if (open) {
      loadClientes()
      loadServicos()
      loadProfissionais()
    }
  }, [open])

  // Resetar form quando abrir/fechar
  useEffect(() => {
    if (open) {
      setActiveStep(0)
      if (agendamento) {
        // Preencher formulário com dados do agendamento existente
        reset({
          id_cliente: agendamento.cliente.id || '',
          id_servico: agendamento.servico.id || '',
          id_profissional: agendamento.profissional.id || '',
          data_agendamento: agendamento.data_agendamento,
          hora_inicio: agendamento.hora_inicio,
          observacoes: agendamento.observacoes || ''
        })
        
        // Definir seleções para os autocompletes
        setSelectedCliente({
          id: agendamento.cliente.id || '',
          nome: agendamento.cliente.nome,
          telefone: agendamento.cliente.telefone || '',
          email: agendamento.cliente.email || ''
        } as Cliente)
        
        if (agendamento.servico.id) {
          setSelectedServico({
            id: agendamento.servico.id,
            nome: agendamento.servico.nome,
            preco: agendamento.servico.preco || 0,
            duracao_estimada_minutos: agendamento.servico.duracao || 60
          } as Servico)
        }
        
        setSelectedProfissional({
          id: agendamento.profissional.id,
          usuario: {
            nome_completo: agendamento.profissional.nome
          }
        } as ProfissionalComUsuario)
      } else {
        reset({
          id_cliente: '',
          id_servico: '',
          id_profissional: '',
          data_agendamento: format(new Date(), 'yyyy-MM-dd'),
          hora_inicio: '09:00',
          observacoes: ''
        })
        setSelectedCliente(null)
        setSelectedServico(null)
        setSelectedProfissional(null)
      }
    }
  }, [open, agendamento, reset])

  const loadClientes = async () => {
    try {
      const response = await clientesService.getAll({ page: 1, limit: 100 })
      if (response.data) {
        setClientes(response.data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    }
  }

  const loadServicos = async () => {
    try {
      const response = await servicosService.getAll({ page: 1, limit: 100 })
      if (response.data) {
        setServicos(response.data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
    }
  }

  const loadProfissionais = async () => {
    try {
      const response = await profissionaisService.getAll({ page: 1, limit: 100 })
      if (response.data) {
        setProfissionais(response.data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error)
    }
  }

  const onSubmit = async (data: AgendamentoFormData) => {
    try {
      // Converter para formato do AgendamentoAdapter
      const formData: AdapterFormData = {
        id_cliente: data.id_cliente,
        id_servico: data.id_servico,
        id_profissional: data.id_profissional,
        data_agendamento: data.data_agendamento,
        hora_inicio: data.hora_inicio,
        observacoes: data.observacoes
      }
      
      await onSave(formData)
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
    }
  }

  const handleClose = () => {
    reset()
    setActiveStep(0)
    setSelectedCliente(null)
    setSelectedServico(null)
    setSelectedProfissional(null)
    onClose()
  }

  const handleNext = async () => {
    const fieldsToValidate = getFieldsForStep(activeStep)
    const isStepValid = await trigger(fieldsToValidate)
    
    if (isStepValid && canProceedToNext()) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const getFieldsForStep = (step: number): (keyof AgendamentoFormData)[] => {
    switch (step) {
      case 0: return ['id_cliente']
      case 1: return ['id_servico']
      case 2: return ['id_profissional']
      case 3: return ['data_agendamento', 'hora_inicio']
      case 4: return [] // Confirmação
      default: return []
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Obter duração do serviço selecionado
  const getServiceDuration = () => {
    return selectedServico?.duracao_estimada_minutos || 60
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: // Cliente
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              Selecionar Cliente
            </Typography>
            
            <Controller
              name="id_cliente"
              control={control}
              render={({ field, fieldState }) => (
                <Autocomplete
                  {...field}
                  options={clientes}
                  getOptionLabel={(option) => option.nome}
                  value={selectedCliente}
                  onChange={(_, newValue) => {
                    setSelectedCliente(newValue)
                    setValue('id_cliente', newValue?.id || '')
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Cliente"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="subtitle1">{option.nome}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.telefone} • {option.email}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              )}
            />

            {selectedCliente && (
              <Card sx={{ mt: 2 }} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Cliente Selecionado
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedCliente.nome}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedCliente.telefone}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedCliente.email}</Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        )

      case 1: // Serviço
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ServiceIcon color="primary" />
              Selecionar Serviço
            </Typography>
            
            <Controller
              name="id_servico"
              control={control}
              render={({ field, fieldState }) => (
                <Autocomplete
                  {...field}
                  options={servicos}
                  getOptionLabel={(option) => option.nome}
                  value={selectedServico}
                  onChange={(_, newValue) => {
                    setSelectedServico(newValue)
                    setValue('id_servico', newValue?.id || '')
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Serviço"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">{option.nome}</Typography>
                          <Typography variant="subtitle2" color="primary" fontWeight="bold">
                            {formatCurrency(option.preco)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Duração: {option.duracao_estimada_minutos} min
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              )}
            />

            {selectedServico && (
              <Card sx={{ mt: 2 }} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Serviço Selecionado
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedServico.nome}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Duração: {selectedServico.duracao_estimada_minutos} minutos
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatCurrency(selectedServico.preco)}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        )

      case 2: // Profissional
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon color="primary" />
              Selecionar Profissional
            </Typography>
            
            <Controller
              name="id_profissional"
              control={control}
              render={({ field, fieldState }) => (
                <Autocomplete
                  {...field}
                  options={profissionais}
                  getOptionLabel={(option) => option.usuario.nome_completo}
                  value={selectedProfissional}
                  onChange={(_, newValue) => {
                    setSelectedProfissional(newValue)
                    setValue('id_profissional', newValue?.id || '')
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Profissional"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="subtitle1">{option.usuario.nome_completo}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.especialidades?.join(', ') || 'Especialidades não informadas'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              )}
            />

            {selectedProfissional && (
              <Card sx={{ mt: 2 }} variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Profissional Selecionado
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {selectedProfissional.usuario.nome_completo}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedProfissional.especialidades?.join(', ') || 'Especialidades não informadas'}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        )

      case 3: // Data e Hora
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon color="primary" />
              Data e Horário
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Controller
                  name="data_agendamento"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Data do Agendamento"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                      inputProps={{
                        min: format(new Date(), 'yyyy-MM-dd'), // Não permitir datas passadas
                      }}
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Modo de Seleção de Horário
                  </Typography>
                  <ToggleButtonGroup
                    value={timeSelectionMode}
                    exclusive
                    onChange={(_, newMode) => newMode && setTimeSelectionMode(newMode)}
                    size="small"
                    fullWidth
                  >
                    <ToggleButton value="picker">
                      <CalendarIcon sx={{ mr: 1 }} />
                      Seletor Visual
                    </ToggleButton>
                    <ToggleButton value="manual">
                      <TimeIcon sx={{ mr: 1 }} />
                      Manual
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Grid>
            </Grid>

            {/* Seleção de horário */}
            <Box sx={{ mt: 3 }}>
              {timeSelectionMode === 'manual' ? (
                <Controller
                  name="hora_inicio"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="time"
                      label="Horário de Início"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      fullWidth
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{ maxWidth: 200 }}
                    />
                  )}
                />
              ) : (
                formData.data_agendamento && selectedProfissional ? (
                  <TimeSlotPicker
                    selectedDate={formData.data_agendamento}
                    selectedProfissional={{
                      id: selectedProfissional.id,
                      nome: selectedProfissional.usuario.nome_completo
                    }}
                    servicoDuracao={getServiceDuration()}
                    onTimeSelect={(time) => setValue('hora_inicio', time)}
                    selectedTime={formData.hora_inicio}
                    agendamentoId={agendamento?.id}
                  />
                ) : (
                  <Alert severity="info">
                    Selecione uma data e profissional para ver os horários disponíveis
                  </Alert>
                )
              )}
            </Box>

            {/* Verificação de conflitos em tempo real */}
            {formData.data_agendamento && formData.hora_inicio && selectedProfissional && (
              <ConflictChecker
                novoAgendamento={{
                  profissional_id: selectedProfissional.id,
                  profissional_nome: selectedProfissional.usuario.nome_completo,
                  data_agendamento: formData.data_agendamento,
                  hora_inicio: formData.hora_inicio,
                  duracao_minutos: getServiceDuration(),
                  servico: selectedServico?.nome,
                  agendamento_id: agendamento?.id
                }}
                realTimeCheck={true}
                onConflictCheck={(result) => setConflictCheckResult(result)}
              />
            )}

            <Controller
              name="observacoes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Observações (opcional)"
                  multiline
                  rows={3}
                  fullWidth
                  sx={{ mt: 2 }}
                  placeholder="Informações adicionais sobre o agendamento..."
                />
              )}
            />
          </Box>
        )

      case 4: // Confirmação
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon color="primary" />
              Confirmar Agendamento
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Verifique os dados antes de confirmar o agendamento.
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Cliente
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedCliente?.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCliente?.telefone}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Profissional
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {selectedProfissional?.usuario.nome_completo}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Serviço
                    </Typography>
                    <Typography variant="body1" fontWeight="medium" gutterBottom>
                      {selectedServico?.nome}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Duração: {selectedServico?.duracao_estimada_minutos} min
                      </Typography>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        {selectedServico && formatCurrency(selectedServico.preco)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Data
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formData.data_agendamento && format(new Date(formData.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Horário
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {formData.hora_inicio}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {formData.observacoes && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        Observações
                      </Typography>
                      <Typography variant="body2">
                        {formData.observacoes}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        )

      default:
        return <Typography>Passo desconhecido</Typography>
    }
  }

  // Verificar se pode avançar para próximo step
  const canProceedToNext = () => {
    // No step 3 (data/hora), verificar se não há conflitos
    if (activeStep === 3 && conflictCheckResult?.hasConflicts) {
      return false
    }
    return true
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            {isEditing ? 'Editar Agendamento' : 'Novo Agendamento'}
          </Typography>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}

          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Por favor, preencha todos os campos obrigatórios.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading}
            variant="outlined"
          >
            Cancelar
          </Button>
          
          <Box sx={{ flex: 1 }} />

          {activeStep > 0 && (
            <Button
              onClick={handleBack}
              disabled={loading}
              startIcon={<BackIcon />}
              sx={{ mr: 1 }}
            >
              Voltar
            </Button>
          )}

          {activeStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={loading}
              variant="contained"
              endIcon={<NextIcon />}
            >
              Próximo
            </Button>
          ) : (
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !isValid}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar Agendamento')}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  )
} 