'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Collapse,
  CircularProgress,
  Stack,
  Divider,
  Button,
} from '@mui/material'
import {
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  LocalAtm as CashIcon,
  Storefront as SystemIcon,
} from '@mui/icons-material'
import { alertasService } from '@/services'
import { Alerta, AlertasResumo } from '@/services/alertas.service'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AlertasImportantesProps {
  title?: string
}

export default function AlertasImportantes({ 
  title = 'Alertas Inteligentes'
}: AlertasImportantesProps) {
  const [alertas, setAlertas] = useState<AlertasResumo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandidos, setExpandidos] = useState<string[]>([])

  // Carregar alertas
  const carregarAlertas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: serviceError } = await alertasService.gerarAlertas()
      
      if (serviceError) {
        setError(serviceError)
        return
      }
      
      setAlertas(data)
    } catch (err) {
      setError('Erro inesperado ao carregar alertas')
      console.error('Erro ao carregar alertas:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarAlertas()
  }, [])

  const toggleExpanded = (alertaId: string) => {
    setExpandidos(prev => 
      prev.includes(alertaId) 
        ? prev.filter(id => id !== alertaId)
        : [...prev, alertaId]
    )
  }

  const getAlertIcon = (tipo: Alerta['tipo']) => {
    switch (tipo) {
      case 'ERROR':
        return <ErrorIcon color="error" />
      case 'WARNING':
        return <WarningIcon color="warning" />
      case 'SUCCESS':
        return <SuccessIcon color="success" />
      case 'INFO':
      default:
        return <InfoIcon color="info" />
    }
  }

  const getAlertColor = (tipo: Alerta['tipo']): 'error' | 'warning' | 'success' | 'info' => {
    switch (tipo) {
      case 'ERROR':
        return 'error'
      case 'WARNING':
        return 'warning'
      case 'SUCCESS':
        return 'success'
      case 'INFO':
      default:
        return 'info'
    }
  }

  const getCategoriaIcon = (categoria: Alerta['categoria']) => {
    switch (categoria) {
      case 'VENDAS':
        return <TrendingUpIcon fontSize="small" />
      case 'PROFISSIONAIS':
        return <PeopleIcon fontSize="small" />
      case 'AGENDAMENTOS':
        return <ScheduleIcon fontSize="small" />
      case 'CAIXA':
        return <CashIcon fontSize="small" />
      case 'SISTEMA':
        return <SystemIcon fontSize="small" />
      case 'CLIENTES':
      default:
        return <PeopleIcon fontSize="small" />
    }
  }

  const getPrioridadeColor = (prioridade: Alerta['prioridade']): 'error' | 'warning' | 'info' | 'default' => {
    switch (prioridade) {
      case 'CRITICA':
        return 'error'
      case 'ALTA':
        return 'error'
      case 'MEDIA':
        return 'warning'
      case 'BAIXA':
        return 'info'
      default:
        return 'default'
    }
  }

  const formatarTempoGerado = (dataISO: string) => {
    return format(new Date(dataISO), "HH:mm 'de hoje'", { locale: ptBR })
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          <IconButton 
            onClick={carregarAlertas}
            disabled={loading}
            size="small"
            title="Atualizar alertas"
          >
            {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          </IconButton>
        </Box>

        {/* Estado de erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Erro ao carregar alertas</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Estado de loading */}
        {loading && !alertas && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Gerando alertas inteligentes...
            </Typography>
          </Box>
        )}

        {/* Resumo dos alertas */}
        {alertas && (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              <Chip 
                label={`${alertas.total} total`}
                color="primary"
                variant="outlined"
                size="small"
              />
              {alertas.criticos > 0 && (
                <Chip 
                  label={`${alertas.criticos} críticos`}
                  color="error"
                  size="small"
                />
              )}
              {alertas.warnings > 0 && (
                <Chip 
                  label={`${alertas.warnings} avisos`}
                  color="warning"
                  size="small"
                />
              )}
              {alertas.infos > 0 && (
                <Chip 
                  label={`${alertas.infos} informativos`}
                  color="info"
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>

            {/* Lista de alertas */}
            {alertas.alertas.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <SuccessIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" gutterBottom>
                  Nenhum alerta ativo
                </Typography>
                <Typography variant="body2">
                  Sistema funcionando normalmente
                </Typography>
              </Box>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {alertas.alertas.slice(0, 10).map((alerta, index) => (
                  <React.Fragment key={alerta.id}>
                    <ListItem 
                      sx={{ 
                        px: 0,
                        '&:hover': { bgcolor: 'action.hover', borderRadius: 1 }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {getAlertIcon(alerta.tipo)}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {alerta.titulo}
                            </Typography>
                            <Chip 
                              label={alerta.categoria}
                              size="small"
                              variant="outlined"
                              icon={getCategoriaIcon(alerta.categoria)}
                              sx={{ fontSize: '0.6rem', height: 20 }}
                            />
                            <Chip 
                              label={alerta.prioridade}
                              size="small"
                              color={getPrioridadeColor(alerta.prioridade)}
                              sx={{ fontSize: '0.6rem', height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {alerta.descricao}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatarTempoGerado(alerta.geradoEm)}
                            </Typography>
                          </Box>
                        }
                      />

                      {alerta.sugestao && (
                        <IconButton
                          onClick={() => toggleExpanded(alerta.id)}
                          size="small"
                          title={expandidos.includes(alerta.id) ? 'Recolher' : 'Ver sugestão'}
                        >
                          {expandidos.includes(alerta.id) ? 
                            <ExpandLessIcon /> : 
                            <ExpandMoreIcon />
                          }
                        </IconButton>
                      )}
                    </ListItem>

                    {/* Detalhes expandidos */}
                    {alerta.sugestao && (
                      <Collapse in={expandidos.includes(alerta.id)}>
                        <Box sx={{ pl: 5, pr: 2, pb: 2 }}>
                          <Alert severity={getAlertColor(alerta.tipo)} variant="outlined">
                            <AlertTitle>Sugestão:</AlertTitle>
                            {alerta.sugestao}
                            
                            {/* Dados adicionais */}
                            {alerta.dados && Object.keys(alerta.dados).length > 0 && (
                              <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                                <Typography variant="caption" display="block" fontWeight="medium">
                                  Dados detalhados:
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                  {Object.entries(alerta.dados).map(([key, value]) => (
                                    <Chip
                                      key={key}
                                      label={`${key}: ${Array.isArray(value) ? value.length : value}`}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.6rem', height: 18 }}
                                    />
                                  ))}
                                </Stack>
                              </Box>
                            )}
                          </Alert>
                        </Box>
                      </Collapse>
                    )}

                    {index < alertas.alertas.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}

            {/* Footer com mais informações */}
            <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Alertas gerados automaticamente com base nos dados do sistema.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Última atualização: {format(new Date(), 'HH:mm:ss', { locale: ptBR })}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
} 