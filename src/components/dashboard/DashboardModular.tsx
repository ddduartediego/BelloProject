'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Backdrop
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { TabDashboard, DashboardConfig } from '@/types/dashboard'
import useDashboardModular from '@/hooks/useDashboardModular'
import CardsExecutivos from '@/components/dashboard/CardsExecutivos'
import AbaProfissionais from '@/components/dashboard/AbaProfissionais'
import AbaComparativosAvancados from '@/components/dashboard/AbaComparativosAvancados'
import AbaAlertas from '@/components/dashboard/AbaAlertas'
import DashboardConfiguracoes from '@/components/dashboard/DashboardConfiguracoes'
import NotificacaoSistema, { NotificacaoItem } from '@/components/dashboard/NotificacaoSistema'
import DashboardFiltrosAvancados, { FiltrosGerais } from '@/components/dashboard/DashboardFiltrosAvancados'
import FiltrosExecutivos from '@/components/dashboard/FiltrosExecutivos'
import FiltrosAvancados from '@/components/dashboard/FiltrosAvancados'
import { exportacaoRelatoriosService, ConfigExportacao } from '@/services/exportacaoRelatoriosService'
import { formatDistanceToNow, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
// HOOK PARA GERENCIAR NOTIFICAÇÕES
// ============================================================================

function useNotificacoesDashboard() {
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([])

  const adicionarNotificacao = useCallback((notificacao: Omit<NotificacaoItem, 'id' | 'timestamp' | 'lida'>) => {
    const novaNotificacao: NotificacaoItem = {
      ...notificacao,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      lida: false
    }

    setNotificacoes(prev => [novaNotificacao, ...prev].slice(0, 50)) // Manter apenas 50 notificações
  }, [])

  const marcarComoLida = useCallback((id: string) => {
    setNotificacoes(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, lida: true } : notif
      )
    )
  }, [])

  const removerNotificacao = useCallback((id: string) => {
    setNotificacoes(prev => prev.filter(notif => notif.id !== id))
  }, [])

  const criarNotificacaoDeAlerta = useCallback((alerta: any) => {
    adicionarNotificacao({
      tipo: alerta.tipo === 'CRITICO' ? 'error' : 
            alerta.tipo === 'ATENCAO' ? 'warning' : 'info',
      titulo: alerta.titulo,
      mensagem: alerta.descricao,
      categoria: alerta.categoria as NotificacaoItem['categoria'],
      prioridade: alerta.tipo === 'CRITICO' ? 'CRITICA' : 
                 alerta.tipo === 'ATENCAO' ? 'ALTA' : 'MEDIA',
      acao: alerta.acao ? {
        texto: 'Abrir',
        callback: () => {
          if (alerta.acao.tipo === 'NAVEGACAO') {
            window.location.href = alerta.acao.destino
          }
        }
      } : undefined,
      autoHide: alerta.tipo !== 'CRITICO',
      duracao: alerta.tipo === 'CRITICO' ? 10000 : 6000
    })
  }, [adicionarNotificacao])

  return {
    notificacoes,
    adicionarNotificacao,
    marcarComoLida,
    removerNotificacao,
    criarNotificacaoDeAlerta
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function DashboardModular({ 
  initialTab = 'visao-geral' 
}: DashboardModularProps) {
  // Estados
  const [activeTab, setActiveTab] = useState<TabDashboard['id']>(initialTab)
  const [configuracoesOpen, setConfiguracoesOpen] = useState(false)
  
  // Novos estados para filtros e exportação
  const [filtrosAvancados, setFiltrosAvancados] = useState<FiltrosGerais>({
    periodo: {
      preset: 'hoje',
      dataInicio: new Date(),
      dataFim: new Date()
    },
    profissionais: {
      selecionados: [],
      incluirInativos: false,
      apenasComVendas: false,
      ordenarPor: 'nome'
    },
    analise: {
      metricas: ['vendas', 'comandas'],
      agruparPor: 'dia',
      incluirProjecoes: false,
      mostrarTendencias: true
    },
    busca: '',
    tags: []
  })
  const [presetsDisponiveis, setPresetsDisponiveis] = useState<Array<{ nome: string; filtros: FiltrosGerais }>>([
    {
      nome: 'Visão Geral',
      filtros: {
        periodo: { preset: 'hoje', dataInicio: new Date(), dataFim: new Date() },
        profissionais: { selecionados: [], incluirInativos: false, apenasComVendas: false, ordenarPor: 'vendas' },
        analise: { metricas: ['vendas', 'comandas', 'profissionais'], agruparPor: 'dia', incluirProjecoes: false, mostrarTendencias: true },
        busca: '', tags: []
      }
    },
    {
      nome: 'Performance Semanal',
      filtros: {
        periodo: { preset: 'semana', dataInicio: new Date(), dataFim: new Date() },
        profissionais: { selecionados: [], incluirInativos: false, apenasComVendas: true, ordenarPor: 'vendas' },
        analise: { metricas: ['vendas', 'comandas', 'clientes'], agruparPor: 'dia', incluirProjecoes: true, mostrarTendencias: true },
        busca: '', tags: []
      }
    }
  ])
  const [profissionaisDisponiveis] = useState([
    { id: '1', nome: 'Ana Silva', ativo: true },
    { id: '2', nome: 'Carlos Santos', ativo: true },
    { id: '3', nome: 'Maria Oliveira', ativo: true },
    { id: '4', nome: 'João Costa', ativo: false }
  ])
  
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
    updateFiltros,
    filtrosExecutivos,
    updateFiltrosExecutivos,
    updateMetaDiaria
  } = useDashboardModular()

  // Hook de notificações
  const {
    notificacoes,
    marcarComoLida,
    removerNotificacao,
    criarNotificacaoDeAlerta
  } = useNotificacoesDashboard()

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const getTabIcon = (iconName: string) => {
    switch (iconName) {
      case 'dashboard': return <DashboardIcon />
      case 'people': return <PeopleIcon />
      case 'analytics': return <AnalyticsIcon />
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
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: ptBR
      })
    } catch {
      return 'agora'
    }
  }

  // Função para mapear loading da aba para loading das métricas
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
  // NOVOS HANDLERS PARA FILTROS E EXPORTAÇÃO
  // ============================================================================

  const handleFiltrosChange = useCallback((novosFiltros: FiltrosGerais) => {
    setFiltrosAvancados(novosFiltros)
    
    // Recarregar dados com novos filtros
    // TODO: Implementar filtros no hook useDashboardModular
    console.log('Filtros aplicados:', novosFiltros)
    
    // Adicionar notificação de filtros aplicados
    if (metrics) {
      // Implementar lógica de filtros aqui
    }
  }, [metrics])

  const handleSalvarPreset = useCallback((nome: string, filtros: FiltrosGerais) => {
    const novoPreset = { nome, filtros }
    setPresetsDisponiveis(prev => [...prev, novoPreset])
    
    // Salvar no localStorage para persistência
    try {
      const presetsAtualizados = [...presetsDisponiveis, novoPreset]
      localStorage.setItem('dashboard_presets', JSON.stringify(presetsAtualizados))
    } catch (error) {
      console.warn('Erro ao salvar preset:', error)
    }
  }, [presetsDisponiveis])

  const handleExportar = useCallback(async (formato: 'pdf' | 'excel' | 'csv') => {
    if (!metrics) {
      console.warn('Nenhuma métrica disponível para exportação')
      return
    }

    try {
      const configExportacao: ConfigExportacao = {
        incluirGraficos: true,
        incluirDetalhamento: true,
        incluirInsights: true,
        incluirRecomendacoes: true,
        formatoData: 'completo',
        idioma: 'pt-BR'
      }

      const dados = exportacaoRelatoriosService.gerarDadosRelatorio(
        metrics,
        filtrosAvancados,
        configExportacao
      )

      switch (formato) {
        case 'pdf':
          await exportacaoRelatoriosService.exportarPDF(dados, configExportacao)
          break
        case 'excel':
          await exportacaoRelatoriosService.exportarExcel(dados, configExportacao)
          break
        case 'csv':
          await exportacaoRelatoriosService.exportarCSV(dados, configExportacao)
          break
      }

      // Adicionar notificação de sucesso
      // TODO: Implementar através do sistema de notificações
      console.log(`Relatório ${formato.toUpperCase()} exportado com sucesso`)

    } catch (error) {
      console.error('Erro na exportação:', error)
      // TODO: Implementar notificação de erro
    }
  }, [metrics, filtrosAvancados])

  // ============================================================================
  // EFEITO PARA CARREGAR PRESETS SALVOS
  // ============================================================================

  useEffect(() => {
    try {
      const presetsSalvos = localStorage.getItem('dashboard_presets')
      if (presetsSalvos) {
        const presets = JSON.parse(presetsSalvos)
        setPresetsDisponiveis(prev => [...prev, ...presets.filter((p: any) => 
          !prev.some(existing => existing.nome === p.nome)
        )])
      }
    } catch (error) {
      console.warn('Erro ao carregar presets salvos:', error)
    }
  }, [])

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
            {/* Filtros Executivos para Visão Geral */}
            <FiltrosExecutivos
              periodo={filtrosExecutivos || { inicio: new Date().toISOString(), fim: new Date().toISOString() }}
              metaDiaria={config.metas?.vendaDiaria}
              config={config}
              onPeriodoChange={updateFiltrosExecutivos || (() => {})}
              onMetaChange={updateMetaDiaria || (() => {})}
              onConfigChange={updateConfig}
              loading={loading.executivas}
            />
            
            {/* Cards Executivos */}
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
      {/* Sistema de Notificações */}
      <NotificacaoSistema
        notificacoes={notificacoes}
        onNotificacaoLida={marcarComoLida}
        onNotificacaoRemovida={removerNotificacao}
        maxNotificacoesVisiveis={3}
        posicao="top-right"
      />

      {/* Filtros Avançados */}
      <DashboardFiltrosAvancados
        filtros={filtrosAvancados}
        onFiltrosChange={handleFiltrosChange}
        onExportar={handleExportar}
        onSalvarPreset={handleSalvarPreset}
        presetsDisponiveis={presetsDisponiveis}
        profissionaisDisponiveis={profissionaisDisponiveis}
        loading={loading.geral}
      />

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

      {/* Backdrop para loading geral */}
      <Backdrop 
        open={loading.geral && !metrics} 
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress color="inherit" size={60} />
        <Typography variant="h6">
          Carregando dashboard...
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Buscando dados reais do sistema
        </Typography>
      </Backdrop>

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