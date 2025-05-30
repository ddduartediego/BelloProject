'use client'

import React from 'react'
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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Autocomplete,
} from '@mui/material'
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ProfissionalComUsuario } from '@/services/profissionais.service'
import { servicosService } from '@/services'

// Dias da semana
const DIAS_SEMANA = [
  { value: 'seg', label: 'Segunda' },
  { value: 'ter', label: 'Terça' },
  { value: 'qua', label: 'Quarta' },
  { value: 'qui', label: 'Quinta' },
  { value: 'sex', label: 'Sexta' },
  { value: 'sab', label: 'Sábado' },
  { value: 'dom', label: 'Domingo' },
]

// Schema de validação com Zod
const profissionalSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  telefone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone inválido'),
  email: z
    .string()
    .email('Email deve ter um formato válido')
    .min(1, 'Email é obrigatório'),
  especialidades: z
    .array(z.string())
    .min(1, 'Selecione pelo menos uma especialidade'),
  horarios_trabalho: z
    .record(z.array(z.string()))
    .optional()
})

type ProfissionalFormData = z.infer<typeof profissionalSchema>

interface ProfissionalFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    nome: string
    telefone: string
    email: string
    especialidades: string[]
    horarios_trabalho?: Record<string, string[]>
  }) => Promise<void>
  profissional?: ProfissionalComUsuario
  loading?: boolean
}

export default function ProfissionalForm({
  open,
  onClose,
  onSave,
  profissional,
  loading = false
}: ProfissionalFormProps) {
  const isEditing = Boolean(profissional)
  const [especialidadesDisponiveis, setEspecialidadesDisponiveis] = React.useState<string[]>([])
  const [loadingEspecialidades, setLoadingEspecialidades] = React.useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
    watch,
    trigger,
    getValues,
    setValue,
  } = useForm<ProfissionalFormData>({
    resolver: zodResolver(profissionalSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      especialidades: [],
      horarios_trabalho: {}
    },
    mode: 'onChange',
    reValidateMode: 'onChange'
  })

  // Buscar especialidades dos serviços cadastrados
  const fetchEspecialidades = React.useCallback(async () => {
    setLoadingEspecialidades(true)
    try {
      // Buscar serviços ativos
      const response = await servicosService.getAtivos()
      
      if (response.error) {
        console.error('Erro ao buscar serviços:', response.error)
        // Fallback para especialidades padrão
        setEspecialidadesDisponiveis([
          'Corte', 'Coloração', 'Manicure', 'Pedicure', 
          'Depilação', 'Estética', 'Massagem', 'Sobrancelha', 
          'Maquiagem', 'Escova', 'Hidratação', 'Relaxamento'
        ])
        return
      }

      if (response.data && response.data.length > 0) {
        // Extrair nomes únicos dos serviços como especialidades
        const especialidades = [...new Set(response.data.map(servico => servico.nome))].sort()
        setEspecialidadesDisponiveis(especialidades)
      } else {
        // Se não há serviços cadastrados, usar lista padrão
        setEspecialidadesDisponiveis([
          'Corte', 'Coloração', 'Manicure', 'Pedicure', 
          'Depilação', 'Estética', 'Massagem', 'Sobrancelha', 
          'Maquiagem', 'Escova', 'Hidratação', 'Relaxamento'
        ])
      }
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error)
      // Fallback para especialidades padrão
      setEspecialidadesDisponiveis([
        'Corte', 'Coloração', 'Manicure', 'Pedicure', 
        'Depilação', 'Estética', 'Massagem', 'Sobrancelha', 
        'Maquiagem', 'Escova', 'Hidratação', 'Relaxamento'
      ])
    } finally {
      setLoadingEspecialidades(false)
    }
  }, [])

  // Carregar especialidades quando dialog abrir
  React.useEffect(() => {
    if (open) {
      fetchEspecialidades()
    }
  }, [open, fetchEspecialidades])

  // Resetar form quando abrir/fechar ou mudar profissional
  React.useEffect(() => {
    if (open) {
      if (profissional) {
        reset({
          nome: profissional.usuario.nome_completo || '',
          telefone: '', // Telefone não está na estrutura atual
          email: profissional.usuario.email || '',
          especialidades: profissional.especialidades || [],
          horarios_trabalho: profissional.horarios_trabalho || {}
        })
      } else {
        reset({
          nome: '',
          telefone: '',
          email: '',
          especialidades: [],
          horarios_trabalho: {}
        })
      }
    }
  }, [open, profissional, reset])

  const onSubmit = async (data: ProfissionalFormData) => {
    console.log('Salvando profissional:', data.nome)
    
    try {
      await onSave(data)
      console.log('Profissional salvo com sucesso')
    } catch (error) {
      console.error('Erro ao salvar profissional:', error)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      if (cleaned.length <= 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
      } else {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      }
    }
    return value
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {isEditing ? 'Editar Profissional' : 'Novo Profissional'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose} disabled={loading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form 
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <DialogContent>
          <Grid container spacing={3}>
            {/* Informações Pessoais */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Informações Pessoais
              </Typography>
            </Grid>

            {/* Nome Completo */}
            <Grid item xs={12} md={6}>
              <Controller
                name="nome"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nome Completo"
                    fullWidth
                    error={!!errors.nome}
                    helperText={errors.nome?.message}
                    disabled={loading}
                    autoFocus
                  />
                )}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={6}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={loading}
                  />
                )}
              />
            </Grid>

            {/* Telefone */}
            <Grid item xs={12} md={6}>
              <Controller
                name="telefone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Telefone"
                    fullWidth
                    error={!!errors.telefone}
                    helperText={errors.telefone?.message || 'Ex: (11) 99999-9999'}
                    disabled={loading}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value)
                      field.onChange(formatted)
                    }}
                    inputProps={{
                      maxLength: 15
                    }}
                  />
                )}
              />
            </Grid>

            {/* Divider */}
            <Grid item xs={12}>
              <Box sx={{ my: 2, borderBottom: 1, borderColor: 'divider' }} />
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Especialidades
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {especialidadesDisponiveis.length > 0 
                  ? `Baseado nos ${especialidadesDisponiveis.length} serviços cadastrados no sistema`
                  : 'Carregando especialidades disponíveis...'
                }
              </Typography>
            </Grid>

            {/* Especialidades */}
            <Grid item xs={12}>
              <Controller
                name="especialidades"
                control={control}
                render={({ field, fieldState }) => {
                  // Calcular erro correto baseado na validação real
                  const hasError = errors.especialidades !== undefined
                  const errorMessage = errors.especialidades?.message
                  
                  return (
                    <Autocomplete
                      multiple
                      value={field.value || []}
                      onChange={(_, newValue) => {
                        field.onChange(newValue || [])
                        // Trigger validation imediatamente
                        setTimeout(() => {
                          trigger('especialidades').then((isValid) => {
                          })
                        }, 100)
                      }}
                      onBlur={(e) => {
                        field.onBlur()
                        trigger('especialidades')
                      }}
                      options={especialidadesDisponiveis}
                      loading={loadingEspecialidades}
                      isOptionEqualToValue={(option, value) => option === value}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="filled"
                            label={option}
                            {...getTagProps({ index })}
                            key={option}
                            sx={{ m: 0.5 }}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Especialidades"
                          error={hasError}
                          helperText={errorMessage || 'Selecione as especialidades do profissional'}
                          disabled={loading || loadingEspecialidades}
                          placeholder={(!field.value || field.value.length === 0) ? 'Selecione uma ou mais especialidades...' : ''}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <React.Fragment>
                                {loadingEspecialidades ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </React.Fragment>
                            ),
                          }}
                        />
                      )}
                      disabled={loading}
                      noOptionsText={loadingEspecialidades ? "Carregando..." : "Nenhuma especialidade encontrada"}
                      clearText="Limpar"
                      openText="Abrir"
                      closeText="Fechar"
                    />
                  )
                }}
              />
            </Grid>

            {/* Preview das Especialidades */}
            {watch('especialidades') && watch('especialidades').length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Especialidades Selecionadas:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {watch('especialidades').map((especialidade, index) => (
                      <Chip
                        key={index}
                        label={especialidade}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}

            {/* Alert sobre cadastro de serviços */}
            {especialidadesDisponiveis.length === 0 && !loadingEspecialidades && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Dica:</strong> As especialidades são baseadas nos serviços cadastrados. 
                    Para adicionar mais opções, cadastre novos serviços na página 
                    <strong> Menu → ✂️ Serviços</strong>.
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Divider */}
            <Grid item xs={12}>
              <Box sx={{ my: 2, borderBottom: 1, borderColor: 'divider' }} />
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                Horários de Trabalho (Opcional)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Configure os horários de trabalho para facilitar o agendamento
              </Typography>
            </Grid>

            {/* Horários - Por enquanto um campo simples */}
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Funcionalidade em desenvolvimento:</strong> A configuração detalhada de horários será implementada na próxima versão. 
                  Por enquanto, os horários podem ser configurados posteriormente.
                </Typography>
              </Alert>
            </Grid>
          </Grid>

          {/* Alert de validação */}
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Por favor, corrija os erros antes de continuar.
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
          
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !isValid}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {loading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Salvar')}
            {!isValid && ` (${Object.keys(errors).length} erro${Object.keys(errors).length !== 1 ? 's' : ''})`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
} 