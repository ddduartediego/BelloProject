'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Compare as CompareIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'

// Hooks e serviços
import useDashboardModular from '@/hooks/useDashboardModular'

// Componentes específicos das abas
import CardsExecutivos from '@/components/dashboard/CardsExecutivos'
import AbaProfissionais from '@/components/dashboard/AbaProfissionais'
import AbaComparativosAvancados from '@/components/dashboard/AbaComparativosAvancados'
import AbaAlertas from '@/components/dashboard/AbaAlertas'

// Componentes de filtros específicos (apenas para abas que precisam)
import FiltrosAvancados from '@/components/dashboard/FiltrosAvancados'

// Componentes de configuração e notificação
import DashboardConfiguracoes from '@/components/dashboard/DashboardConfiguracoes'

// Types
import { TabDashboard, DashboardConfig } from '@/types/dashboard'

// ============================================================================
// CONFIGURAÇÃO DAS ABAS
// ============================================================================

const TABS_CONFIG: TabDashboard[] = [
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    icon: 'dashboard',
    carregada: false
  },
  {
    id: 'profissionais',
    label: 'Profissionais',
    icon: 'people',
    carregada: false
  },
  {
    id: 'comparativos',
    label: 'Comparativos',
    icon: 'analytics',
    carregada: false
  },
  {
    id: 'alertas',
    label: 'Alertas & Insights',
    icon: 'notifications',
    carregada: false
  }
]

// ============================================================================
// INTERFACE DO COMPONENTE
// ============================================================================

interface DashboardModularProps {
  initialTab?: TabDashboard['id']
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function DashboardModular({ 
  initialTab = 'visao-geral' 
}: DashboardModularProps) {
  // Estados locais
  const [activeTab, setActiveTab] = useState<TabDashboard['id']>(initialTab)
  const [configuracoesOpen, setConfiguracoesOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // Hook principal
  const {
    metrics,
    loading,
    error,
    config,
    refreshTab,
    refreshAll,
    updateConfig,
    filtros,
    updateFiltros
  } = useDashboardModular()

  // ============================================================================
  // EFEITO PARA CONTROLAR HYDRATION
  // ============================================================================

  useEffect(() => {
    setIsClient(true)
  }, [])

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const getTabIcon = (iconName: string) => {
    switch (iconName) {
      case 'dashboard': return <DashboardIcon />
      case 'people': return <PeopleIcon />
      case 'analytics': return <CompareIcon />
      case 'notifications': return <NotificationsIcon />
      default: return <DashboardIcon />
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: TabDashboard['id']) => {
    setActiveTab(newValue)
    
    // Se a aba não foi carregada ainda, carregar
    if (metrics && !metrics[newValue as keyof typeof metrics]) {
      refreshTab(newValue)
    }
  }

  const handleRefreshTab = () => {
    refreshTab(activeTab)
  }

  const handleRefreshAll = () => {
    refreshAll()
  }

  const formatLastUpdate = (timestamp: string) => {
    if (!isClient) {
      // Durante SSR, retornar texto genérico para evitar hydration mismatch
      return 'recentemente'
    }

    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'há poucos segundos'
    if (diffInMinutes < 60) return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    
    return date.toLocaleDateString('pt-BR')
  }

  const getLoadingForTab = (tabId: TabDashboard['id']) => {
    switch (tabId) {
      case 'visao-geral': return loading.executivas
      case 'profissionais': return loading.profissionais
      case 'comparativos': return loading.comparativos
      case 'alertas': return loading.alertas
      default: return false
    }
  }

  const handleOpenConfiguracoes = () => {
    setConfiguracoesOpen(true)
  }

  const handleCloseConfiguracoes = () => {
    setConfiguracoesOpen(false)
  }

  const handleSaveConfiguracoes = (newConfig: DashboardConfig) => {
    updateConfig(newConfig)
    setConfiguracoesOpen(false)
  }

  // ============================================================================
  // RENDERIZAÇÃO DO CONTEÚDO DA ABA
  // ============================================================================

  const renderTabContent = () => {
    if (loading.geral && !metrics) {
      return (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: 400,
            flexDirection: 'column',
            gap: 2 
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" color="text.secondary">
            Carregando métricas do dashboard...
          </Typography>
        </Box>
      )
    }

    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <IconButton color="inherit" onClick={handleRefreshAll}>
              <RefreshIcon />
            </IconButton>
          }
        >
          <Typography variant="body1" fontWeight="medium">
            Erro ao carregar dashboard
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
      )
    }

    if (!metrics) {
      return (
        <Alert severity="info" sx={{ mb: 3 }}>
          Nenhuma métrica disponível no momento.
        </Alert>
      )
    }

    // Renderizar conteúdo baseado na aba ativa
    switch (activeTab) {
      case 'visao-geral':
        return (
          <Box>
            {/* Cards Executivos - sempre dados de hoje */}
            <CardsExecutivos 
              metrics={metrics.executivas}
              loading={loading.executivas}
              config={config}
            />
          </Box>
        )
      
      case 'profissionais':
        return (
          <Box>
            {/* Filtros Avançados para Profissionais */}
            <FiltrosAvancados
              filtros={filtros || { inicio: new Date().toISOString(), fim: new Date().toISOString() }}
              onFiltrosChange={updateFiltros || (() => {})}
              loading={loading.profissionais}
            />
            
            {/* Aba de Profissionais */}
            <AbaProfissionais 
              metrics={metrics.profissionais}
              loading={loading.profissionais}
              config={config}
            />
          </Box>
        )
      
      case 'comparativos':
        return (
          <AbaComparativosAvancados />
        )
      
      case 'alertas':
        return (
          <AbaAlertas 
            metrics={metrics.alertas}
            loading={loading.alertas}
            config={config}
          />
        )
      
      default:
        return null
    }
  }

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  return (
    <Box>
      {/* Header com informações e controles */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestão completa do seu salão de beleza
          </Typography>
        </Box>
        
        {/* Controles do header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Indicador de última atualização */}
          {config.autoRefresh.ultimaAtualizacao && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                Atualizado {formatLastUpdate(config.autoRefresh.ultimaAtualizacao)}
              </Typography>
            </Box>
          )}
          
          {/* Auto-refresh indicator */}
          {config.autoRefresh.enabled && (
            <Chip 
              size="small" 
              label={`Auto-refresh: ${config.autoRefresh.interval}min`}
              color="primary"
              variant="outlined"
            />
          )}
          
          {/* Botão de configurações */}
          <IconButton 
            onClick={handleOpenConfiguracoes}
            title="Configurações do Dashboard"
            color="default"
          >
            <SettingsIcon />
          </IconButton>
          
          {/* Botão de refresh */}
          <IconButton 
            onClick={handleRefreshTab}
            disabled={getLoadingForTab(activeTab)}
            title="Atualizar aba atual"
            color="primary"
          >
            {getLoadingForTab(activeTab) ? (
              <CircularProgress size={20} />
            ) : (
              <RefreshIcon />
            )}
          </IconButton>
        </Box>
      </Box>

      {/* Container principal com abas */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        {/* Sistema de abas */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500
              }
            }}
          >
            {TABS_CONFIG.map((tab) => (
              <Tab
                key={tab.id}
                value={tab.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getTabIcon(tab.icon)}
                    {tab.label}
                    {getLoadingForTab(tab.id) && (
                      <CircularProgress size={16} />
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Conteúdo da aba */}
        <Box sx={{ p: 3 }}>
          {renderTabContent()}
        </Box>
      </Paper>

      {/* Modal de Configurações */}
      <DashboardConfiguracoes
        open={configuracoesOpen}
        onClose={handleCloseConfiguracoes}
        config={config}
        onSave={handleSaveConfiguracoes}
      />
    </Box>
  )
} 