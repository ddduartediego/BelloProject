'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Typography,
  Box,
  Tabs,
  Tab,
  Chip,
  Divider,
  Alert,
  InputAdornment,
  FormGroup,
  Card,
  CardContent
} from '@mui/material'
import {
  Settings as SettingsIcon,
  AttachMoney as MoneyIcon,
  Refresh as RefreshIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Save as SaveIcon,
  RestoreFromTrash as ResetIcon
} from '@mui/icons-material'
import { DashboardConfig } from '@/types/dashboard'

// ============================================================================
// INTERFACES
// ============================================================================

interface DashboardConfiguracoesPRops {
  open: boolean
  onClose: () => void
  config: DashboardConfig
  onSave: (newConfig: DashboardConfig) => void
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

// ============================================================================
// COMPONENTE TAB PANEL
// ============================================================================

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`configuracoes-tabpanel-${index}`}
      aria-labelledby={`configuracoes-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function DashboardConfiguracoes({
  open,
  onClose,
  config,
  onSave
}: DashboardConfiguracoesPRops) {
  const [activeTab, setActiveTab] = useState(0)
  const [tempConfig, setTempConfig] = useState<DashboardConfig>(config)
  const [hasChanges, setHasChanges] = useState(false)

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const handleConfigChange = (newConfig: Partial<DashboardConfig>) => {
    setTempConfig(prev => ({ ...prev, ...newConfig }))
    setHasChanges(true)
  }

  const handleSave = () => {
    onSave(tempConfig)
    setHasChanges(false)
    onClose()
  }

  const handleReset = () => {
    const defaultConfig: DashboardConfig = {
      autoRefresh: {
        enabled: true,
        interval: 5,
        ultimaAtualizacao: new Date().toISOString()
      },
      alertas: {
        criticos: true,
        atencao: true,
        insights: true
      },
      metas: {},
      profissionais: {
        mostrarInativos: false,
        ordenacao: 'VENDAS'
      }
    }
    setTempConfig(defaultConfig)
    setHasChanges(true)
  }

  const handleClose = () => {
    if (hasChanges) {
      const confirm = window.confirm('Você tem alterações não salvas. Deseja sair mesmo assim?')
      if (!confirm) return
    }
    setTempConfig(config)
    setHasChanges(false)
    onClose()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <SettingsIcon />
        Configurações do Dashboard
        {hasChanges && (
          <Chip size="small" label="Alterações pendentes" color="warning" />
        )}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
            <Tab 
              icon={<MoneyIcon />} 
              label="Metas" 
              iconPosition="start"
            />
            <Tab 
              icon={<RefreshIcon />} 
              label="Auto-refresh" 
              iconPosition="start"
            />
            <Tab 
              icon={<NotificationsIcon />} 
              label="Alertas" 
              iconPosition="start"
            />
            <Tab 
              icon={<PaletteIcon />} 
              label="Profissionais" 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* ABA METAS */}
        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Definir Metas de Desempenho
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure suas metas diárias para acompanhar o progresso do salão.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 3 }}>
                <TextField
                  label="Meta de Vendas Diária"
                  type="number"
                  value={tempConfig.metas.vendaDiaria || ''}
                  onChange={(e) => handleConfigChange({
                    metas: {
                      ...tempConfig.metas,
                      vendaDiaria: parseFloat(e.target.value) || undefined
                    }
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  helperText="Meta de faturamento que deseja atingir por dia"
                  fullWidth
                />

                <TextField
                  label="Meta de Ticket Médio"
                  type="number"
                  value={tempConfig.metas.ticketMedio || ''}
                  onChange={(e) => handleConfigChange({
                    metas: {
                      ...tempConfig.metas,
                      ticketMedio: parseFloat(e.target.value) || undefined
                    }
                  })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                  }}
                  helperText="Valor médio ideal por comanda"
                  fullWidth
                />

                <TextField
                  label="Meta de Comandas por Dia"
                  type="number"
                  value={tempConfig.metas.comandasDia || ''}
                  onChange={(e) => handleConfigChange({
                    metas: {
                      ...tempConfig.metas,
                      comandasDia: parseInt(e.target.value) || undefined
                    }
                  })}
                  helperText="Número de comandas que deseja atender por dia"
                  fullWidth
                />

                {tempConfig.metas.vendaDiaria && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Projeção Mensal:</strong> {formatCurrency(tempConfig.metas.vendaDiaria * 30)}
                    </Typography>
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* ABA AUTO-REFRESH */}
        <TabPanel value={activeTab} index={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Atualização Automática
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure como o dashboard deve atualizar os dados automaticamente.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.autoRefresh.enabled}
                      onChange={(e) => handleConfigChange({
                        autoRefresh: {
                          ...tempConfig.autoRefresh,
                          enabled: e.target.checked
                        }
                      })}
                    />
                  }
                  label="Ativar atualização automática"
                />

                {tempConfig.autoRefresh.enabled && (
                  <Box sx={{ mt: 3 }}>
                    <Typography gutterBottom>
                      Intervalo de atualização: {tempConfig.autoRefresh.interval} minutos
                    </Typography>
                    <Slider
                      value={tempConfig.autoRefresh.interval}
                      onChange={(_, value) => handleConfigChange({
                        autoRefresh: {
                          ...tempConfig.autoRefresh,
                          interval: value as number
                        }
                      })}
                      min={1}
                      max={30}
                      step={1}
                      marks={[
                        { value: 1, label: '1min' },
                        { value: 5, label: '5min' },
                        { value: 10, label: '10min' },
                        { value: 15, label: '15min' },
                        { value: 30, label: '30min' }
                      ]}
                      valueLabelDisplay="auto"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Recomendamos entre 3-10 minutos para balancear performance e dados atualizados.
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </TabPanel>

        {/* ABA ALERTAS */}
        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sistema de Alertas
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure que tipos de alertas deseja receber no dashboard.
              </Typography>

              <FormGroup sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.alertas.criticos}
                      onChange={(e) => handleConfigChange({
                        alertas: {
                          ...tempConfig.alertas,
                          criticos: e.target.checked
                        }
                      })}
                      color="error"
                    />
                  }
                  label={
                    <Box>
                      <Typography>Alertas Críticos</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Caixa fechado, metas muito baixas, erros do sistema
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.alertas.atencao}
                      onChange={(e) => handleConfigChange({
                        alertas: {
                          ...tempConfig.alertas,
                          atencao: e.target.checked
                        }
                      })}
                      color="warning"
                    />
                  }
                  label={
                    <Box>
                      <Typography>Alertas de Atenção</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Queda de vendas, horários de pico perdidos
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.alertas.insights}
                      onChange={(e) => handleConfigChange({
                        alertas: {
                          ...tempConfig.alertas,
                          insights: e.target.checked
                        }
                      })}
                      color="info"
                    />
                  }
                  label={
                    <Box>
                      <Typography>Insights e Dicas</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Oportunidades de negócio, padrões detectados
                      </Typography>
                    </Box>
                  }
                />
              </FormGroup>
            </CardContent>
          </Card>
        </TabPanel>

        {/* ABA PROFISSIONAIS */}
        <TabPanel value={activeTab} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Visualização de Profissionais
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure como os profissionais são exibidos nas métricas.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tempConfig.profissionais.mostrarInativos}
                      onChange={(e) => handleConfigChange({
                        profissionais: {
                          ...tempConfig.profissionais,
                          mostrarInativos: e.target.checked
                        }
                      })}
                    />
                  }
                  label="Mostrar profissionais inativos"
                />

                <Divider sx={{ my: 2 }} />

                <Typography gutterBottom>
                  Ordenação padrão dos rankings:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[
                    { value: 'VENDAS', label: 'Por Vendas' },
                    { value: 'COMANDAS', label: 'Por Comandas' },
                    { value: 'TICKET_MEDIO', label: 'Por Ticket Médio' }
                  ].map((opcao) => (
                    <Chip
                      key={opcao.value}
                      label={opcao.label}
                      onClick={() => handleConfigChange({
                        profissionais: {
                          ...tempConfig.profissionais,
                          ordenacao: opcao.value as any
                        }
                      })}
                      color={tempConfig.profissionais.ordenacao === opcao.value ? 'primary' : 'default'}
                      variant={tempConfig.profissionais.ordenacao === opcao.value ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between', p: 3 }}>
        <Button
          onClick={handleReset}
          startIcon={<ResetIcon />}
          color="secondary"
        >
          Restaurar Padrões
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!hasChanges}
          >
            Salvar Configurações
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  )
} 