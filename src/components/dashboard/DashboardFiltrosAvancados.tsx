'use client'

import React, { memo, useState, useCallback, useEffect } from 'react'
import {
  Box,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Divider,
  Typography,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Autocomplete,
  Badge,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  FileDownload as ExportIcon,
  DateRange as DateIcon,
  Person as PersonIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR } from 'date-fns/locale'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from 'date-fns'

// ============================================================================
// INTERFACES
// ============================================================================

export interface FiltrosPeriodo {
  preset: 'hoje' | 'ontem' | 'semana' | 'mes' | 'trimestre' | 'personalizado'
  dataInicio?: Date
  dataFim?: Date
  compararCom?: 'periodo_anterior' | 'ano_passado' | 'mes_passado' | 'semana_passada'
}

export interface FiltrosProfissionais {
  selecionados: string[]
  incluirInativos: boolean
  apenasComVendas: boolean
  ordenarPor: 'nome' | 'vendas' | 'comandas' | 'avaliacao'
}

export interface FiltrosAnalise {
  metricas: string[]
  agruparPor: 'dia' | 'semana' | 'mes' | 'profissional' | 'servico'
  incluirProjecoes: boolean
  mostrarTendencias: boolean
  filtroValorMinimo?: number
}

export interface FiltrosGerais {
  periodo: FiltrosPeriodo
  profissionais: FiltrosProfissionais
  analise: FiltrosAnalise
  busca?: string
  tags: string[]
}

export interface DashboardFiltrosAvancadosProps {
  filtros: FiltrosGerais
  onFiltrosChange: (filtros: FiltrosGerais) => void
  onExportar: (formato: 'pdf' | 'excel' | 'csv') => void
  onSalvarPreset: (nome: string, filtros: FiltrosGerais) => void
  presetsDisponiveis: Array<{ nome: string; filtros: FiltrosGerais }>
  profissionaisDisponiveis: Array<{ id: string; nome: string; ativo: boolean }>
  loading?: boolean
}

// ============================================================================
// PRESETS DE PERÍODO
// ============================================================================

const PRESETS_PERIODO = [
  {
    value: 'hoje',
    label: 'Hoje',
    getDates: () => ({
      inicio: new Date(),
      fim: new Date()
    })
  },
  {
    value: 'ontem',
    label: 'Ontem',
    getDates: () => ({
      inicio: subDays(new Date(), 1),
      fim: subDays(new Date(), 1)
    })
  },
  {
    value: 'semana',
    label: 'Esta Semana',
    getDates: () => ({
      inicio: startOfWeek(new Date()),
      fim: endOfWeek(new Date())
    })
  },
  {
    value: 'mes',
    label: 'Este Mês',
    getDates: () => ({
      inicio: startOfMonth(new Date()),
      fim: endOfMonth(new Date())
    })
  },
  {
    value: 'trimestre',
    label: 'Trimestre',
    getDates: () => ({
      inicio: startOfMonth(subMonths(new Date(), 2)),
      fim: endOfMonth(new Date())
    })
  }
]

const METRICAS_DISPONIVEIS = [
  { value: 'vendas', label: 'Vendas', icon: '💰' },
  { value: 'comandas', label: 'Comandas', icon: '📄' },
  { value: 'clientes', label: 'Clientes', icon: '👥' },
  { value: 'profissionais', label: 'Profissionais', icon: '👨‍💼' },
  { value: 'servicos', label: 'Serviços', icon: '✂️' },
  { value: 'satisfacao', label: 'Satisfação', icon: '⭐' }
]

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const DashboardFiltrosAvancados = memo(function DashboardFiltrosAvancados({
  filtros,
  onFiltrosChange,
  onExportar,
  onSalvarPreset,
  presetsDisponiveis,
  profissionaisDisponiveis,
  loading = false
}: DashboardFiltrosAvancadosProps) {

  // Estados locais
  const [expandido, setExpandido] = useState(false)
  const [menuExport, setMenuExport] = useState<null | HTMLElement>(null)
  const [nomePreset, setNomePreset] = useState('')
  const [mostrarSalvarPreset, setMostrarSalvarPreset] = useState(false)

  // ============================================================================
  // FUNÇÕES DE ATUALIZAÇÃO
  // ============================================================================

  const updateFiltros = useCallback((updates: Partial<FiltrosGerais>) => {
    onFiltrosChange({ ...filtros, ...updates })
  }, [filtros, onFiltrosChange])

  const updatePeriodo = useCallback((updates: Partial<FiltrosPeriodo>) => {
    updateFiltros({
      periodo: { ...filtros.periodo, ...updates }
    })
  }, [filtros.periodo, updateFiltros])

  const updateProfissionais = useCallback((updates: Partial<FiltrosProfissionais>) => {
    updateFiltros({
      profissionais: { ...filtros.profissionais, ...updates }
    })
  }, [filtros.profissionais, updateFiltros])

  const updateAnalise = useCallback((updates: Partial<FiltrosAnalise>) => {
    updateFiltros({
      analise: { ...filtros.analise, ...updates }
    })
  }, [filtros.analise, updateFiltros])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handlePresetPeriodoChange = useCallback((preset: string) => {
    const presetConfig = PRESETS_PERIODO.find(p => p.value === preset)
    if (presetConfig) {
      const { inicio, fim } = presetConfig.getDates()
      updatePeriodo({
        preset: preset as FiltrosPeriodo['preset'],
        dataInicio: inicio,
        dataFim: fim
      })
    }
  }, [updatePeriodo])

  const handleLimparFiltros = useCallback(() => {
    const filtrosLimpos: FiltrosGerais = {
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
    }
    onFiltrosChange(filtrosLimpos)
  }, [onFiltrosChange])

  const handleCarregarPreset = useCallback((preset: { nome: string; filtros: FiltrosGerais }) => {
    onFiltrosChange(preset.filtros)
  }, [onFiltrosChange])

  const handleSalvarPreset = useCallback(() => {
    if (nomePreset.trim()) {
      onSalvarPreset(nomePreset.trim(), filtros)
      setNomePreset('')
      setMostrarSalvarPreset(false)
    }
  }, [nomePreset, filtros, onSalvarPreset])

  const handleExportar = useCallback((formato: 'pdf' | 'excel' | 'csv') => {
    onExportar(formato)
    setMenuExport(null)
  }, [onExportar])

  // ============================================================================
  // CONTADORES DE FILTROS ATIVOS
  // ============================================================================

  const contarFiltrosAtivos = useCallback(() => {
    let count = 0
    
    // Período customizado
    if (filtros.periodo.preset === 'personalizado') count++
    
    // Comparação ativa
    if (filtros.periodo.compararCom) count++
    
    // Profissionais selecionados
    if (filtros.profissionais.selecionados.length > 0) count++
    
    // Métricas específicas (não padrão)
    if (filtros.analise.metricas.length !== 2 || 
        !filtros.analise.metricas.includes('vendas') || 
        !filtros.analise.metricas.includes('comandas')) count++
    
    // Agrupamento diferente do padrão
    if (filtros.analise.agruparPor !== 'dia') count++
    
    // Busca ativa
    if (filtros.busca && filtros.busca.trim()) count++
    
    // Tags ativas
    if (filtros.tags.length > 0) count++

    return count
  }, [filtros])

  const filtrosAtivos = contarFiltrosAtivos()

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Paper sx={{ mb: 3 }}>
        {/* Header compacto */}
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setExpandido(!expandido)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge badgeContent={filtrosAtivos} color="primary">
              <FilterIcon />
            </Badge>
            <Typography variant="h6">
              Filtros Avançados
            </Typography>
            {filtrosAtivos > 0 && (
              <Chip 
                size="small" 
                label={`${filtrosAtivos} filtro${filtrosAtivos > 1 ? 's' : ''} ativo${filtrosAtivos > 1 ? 's' : ''}`}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Busca rápida */}
            <TextField
              size="small"
              placeholder="Buscar..."
              value={filtros.busca || ''}
              onChange={(e) => updateFiltros({ busca: e.target.value })}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              sx={{ width: 200 }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Botões de ação */}
            <Tooltip title="Exportar relatório">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuExport(e.currentTarget)
                }}
                disabled={loading}
              >
                <ExportIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Limpar filtros">
              <IconButton
                onClick={(e) => {
                  e.stopPropagation()
                  handleLimparFiltros()
                }}
                disabled={loading || filtrosAtivos === 0}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>

            <ExpandMoreIcon 
              sx={{ 
                transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }} 
            />
          </Box>
        </Box>

        {/* Conteúdo expandido */}
        {expandido && (
          <>
            <Divider />
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                
                {/* Seção de Período */}
                <Grid item xs={12} md={4}>
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DateIcon />
                        <Typography variant="subtitle1" fontWeight="medium">
                          Período
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Período</InputLabel>
                          <Select
                            value={filtros.periodo.preset}
                            onChange={(e) => handlePresetPeriodoChange(e.target.value)}
                            label="Período"
                          >
                            {PRESETS_PERIODO.map(preset => (
                              <MenuItem key={preset.value} value={preset.value}>
                                {preset.label}
                              </MenuItem>
                            ))}
                            <MenuItem value="personalizado">Personalizado</MenuItem>
                          </Select>
                        </FormControl>

                        {filtros.periodo.preset === 'personalizado' && (
                          <>
                            <DatePicker
                              label="Data Início"
                              value={filtros.periodo.dataInicio}
                              onChange={(date) => updatePeriodo({ dataInicio: date ? new Date(date.toString()) : undefined })}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                            <DatePicker
                              label="Data Fim"
                              value={filtros.periodo.dataFim}
                              onChange={(date) => updatePeriodo({ dataFim: date ? new Date(date.toString()) : undefined })}
                              slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                          </>
                        )}

                        <FormControl fullWidth size="small">
                          <InputLabel>Comparar com</InputLabel>
                          <Select
                            value={filtros.periodo.compararCom || ''}
                            onChange={(e) => updatePeriodo({ 
                              compararCom: e.target.value as FiltrosPeriodo['compararCom'] || undefined 
                            })}
                            label="Comparar com"
                          >
                            <MenuItem value="">Sem comparação</MenuItem>
                            <MenuItem value="periodo_anterior">Período anterior</MenuItem>
                            <MenuItem value="mes_passado">Mês passado</MenuItem>
                            <MenuItem value="semana_passada">Semana passada</MenuItem>
                            <MenuItem value="ano_passado">Ano passado</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                {/* Seção de Profissionais */}
                <Grid item xs={12} md={4}>
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon />
                        <Typography variant="subtitle1" fontWeight="medium">
                          Profissionais
                        </Typography>
                        {filtros.profissionais.selecionados.length > 0 && (
                          <Chip 
                            size="small" 
                            label={filtros.profissionais.selecionados.length}
                            color="primary"
                          />
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Autocomplete
                          multiple
                          size="small"
                          options={profissionaisDisponiveis}
                          getOptionLabel={(option) => option.nome}
                          value={profissionaisDisponiveis.filter(p => 
                            filtros.profissionais.selecionados.includes(p.id)
                          )}
                          onChange={(_, value) => updateProfissionais({
                            selecionados: value.map(v => v.id)
                          })}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Selecionar profissionais"
                              placeholder="Todos os profissionais"
                            />
                          )}
                          renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                              <Chip
                                variant="outlined"
                                label={option.nome}
                                size="small"
                                {...getTagProps({ index })}
                                key={option.id}
                              />
                            ))
                          }
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={filtros.profissionais.incluirInativos}
                              onChange={(e) => updateProfissionais({
                                incluirInativos: e.target.checked
                              })}
                              size="small"
                            />
                          }
                          label="Incluir inativos"
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={filtros.profissionais.apenasComVendas}
                              onChange={(e) => updateProfissionais({
                                apenasComVendas: e.target.checked
                              })}
                              size="small"
                            />
                          }
                          label="Apenas com vendas"
                        />

                        <FormControl fullWidth size="small">
                          <InputLabel>Ordenar por</InputLabel>
                          <Select
                            value={filtros.profissionais.ordenarPor}
                            onChange={(e) => updateProfissionais({
                              ordenarPor: e.target.value as FiltrosProfissionais['ordenarPor']
                            })}
                            label="Ordenar por"
                          >
                            <MenuItem value="nome">Nome</MenuItem>
                            <MenuItem value="vendas">Vendas</MenuItem>
                            <MenuItem value="comandas">Comandas</MenuItem>
                            <MenuItem value="avaliacao">Avaliação</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

                {/* Seção de Análise */}
                <Grid item xs={12} md={4}>
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AnalyticsIcon />
                        <Typography variant="subtitle1" fontWeight="medium">
                          Análise
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Autocomplete
                          multiple
                          size="small"
                          options={METRICAS_DISPONIVEIS}
                          getOptionLabel={(option) => option.label}
                          value={METRICAS_DISPONIVEIS.filter(m => 
                            filtros.analise.metricas.includes(m.value)
                          )}
                          onChange={(_, value) => updateAnalise({
                            metricas: value.map(v => v.value)
                          })}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Métricas"
                              placeholder="Selecionar métricas"
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component="li" {...props}>
                              <Box sx={{ mr: 1 }}>{option.icon}</Box>
                              {option.label}
                            </Box>
                          )}
                        />

                        <FormControl fullWidth size="small">
                          <InputLabel>Agrupar por</InputLabel>
                          <Select
                            value={filtros.analise.agruparPor}
                            onChange={(e) => updateAnalise({
                              agruparPor: e.target.value as FiltrosAnalise['agruparPor']
                            })}
                            label="Agrupar por"
                          >
                            <MenuItem value="dia">Dia</MenuItem>
                            <MenuItem value="semana">Semana</MenuItem>
                            <MenuItem value="mes">Mês</MenuItem>
                            <MenuItem value="profissional">Profissional</MenuItem>
                            <MenuItem value="servico">Serviço</MenuItem>
                          </Select>
                        </FormControl>

                        <FormControlLabel
                          control={
                            <Switch
                              checked={filtros.analise.incluirProjecoes}
                              onChange={(e) => updateAnalise({
                                incluirProjecoes: e.target.checked
                              })}
                              size="small"
                            />
                          }
                          label="Incluir projeções"
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={filtros.analise.mostrarTendencias}
                              onChange={(e) => updateAnalise({
                                mostrarTendencias: e.target.checked
                              })}
                              size="small"
                            />
                          }
                          label="Mostrar tendências"
                        />

                        <TextField
                          size="small"
                          label="Valor mínimo (R$)"
                          type="number"
                          value={filtros.analise.filtroValorMinimo || ''}
                          onChange={(e) => updateAnalise({
                            filtroValorMinimo: e.target.value ? parseFloat(e.target.value) : undefined
                          })}
                          fullWidth
                        />
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </Grid>

              </Grid>

              {/* Seção de Presets */}
              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Presets salvos:
                  </Typography>
                  {presetsDisponiveis.map((preset) => (
                    <Chip
                      key={preset.nome}
                      label={preset.nome}
                      onClick={() => handleCarregarPreset(preset)}
                      variant="outlined"
                      size="small"
                      clickable
                    />
                  ))}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {mostrarSalvarPreset ? (
                    <>
                      <TextField
                        size="small"
                        placeholder="Nome do preset"
                        value={nomePreset}
                        onChange={(e) => setNomePreset(e.target.value)}
                        sx={{ width: 150 }}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleSalvarPreset}
                        disabled={!nomePreset.trim()}
                        startIcon={<SaveIcon />}
                      >
                        Salvar
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {
                          setMostrarSalvarPreset(false)
                          setNomePreset('')
                        }}
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setMostrarSalvarPreset(true)}
                      startIcon={<SaveIcon />}
                    >
                      Salvar Preset
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </>
        )}

        {/* Menu de exportação */}
        <Menu
          anchorEl={menuExport}
          open={Boolean(menuExport)}
          onClose={() => setMenuExport(null)}
        >
          <MenuItem onClick={() => handleExportar('pdf')}>
            <ListItemIcon>
              <ExportIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>PDF</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExportar('excel')}>
            <ListItemIcon>
              <ExportIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Excel</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExportar('csv')}>
            <ListItemIcon>
              <ExportIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>CSV</ListItemText>
          </MenuItem>
        </Menu>
      </Paper>
    </LocalizationProvider>
  )
})

export default DashboardFiltrosAvancados 