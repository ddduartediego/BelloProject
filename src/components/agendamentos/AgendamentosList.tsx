'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Grid,
  Paper,
  Pagination,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  Check as CheckIcon,
  Cancel as CancelIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  ContentCut as ServiceIcon,
  WhatsApp as WhatsAppIcon,
  Sort as SortIcon,
} from '@mui/icons-material'
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { agendamentosService } from '@/services'
import { AgendamentoAdapter, type AgendamentoCompleto } from '@/utils/agendamento-adapter'

// Tipos e interfaces
interface AgendamentoListItem {
  id: string
  title: string
  cliente: {
    nome: string
    telefone?: string
    email?: string
  }
  profissional: string
  servico: string
  data_agendamento: string
  hora_inicio: string
  hora_fim: string
  status: 'agendado' | 'confirmado' | 'cancelado' | 'concluido'
  valor?: number
  observacoes?: string
}

interface AgendamentosListProps {
  onView: (agendamento: any) => void
  onEdit: (agendamento: any) => void
  statusFilter: string
  profissionalFilter: string
  refreshKey: number
}

type SortField = 'data' | 'cliente' | 'profissional' | 'status'
type SortOrder = 'asc' | 'desc'

export default function AgendamentosList({
  onView,
  onEdit,
  statusFilter,
  profissionalFilter,
  refreshKey,
}: AgendamentosListProps) {
  const [agendamentos, setAgendamentos] = useState<AgendamentoCompleto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('data')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoCompleto | null>(null)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dateFilter, setDateFilter] = useState<string>('todos')

  const itemsPerPage = 10

  // Carregar agendamentos usando useCallback para otimização
  const loadAgendamentos = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Preparar filtros para a API
      const filters = AgendamentoAdapter.toBackendFilters({
        statusFilter: statusFilter !== 'todos' ? statusFilter : undefined,
        profissionalFilter: profissionalFilter !== 'todos' ? profissionalFilter : undefined,
        dateFilter: dateFilter !== 'todos' ? dateFilter : undefined,
        searchTerm: searchTerm || undefined
      })

      // Mapear ordenação para formato do backend
      const orderBy = sortField === 'data' ? 'data_hora_inicio' : 
                     sortField === 'cliente' ? 'cliente.nome' :
                     sortField === 'profissional' ? 'profissional.usuario.nome_completo' :
                     'status'

      const response = await agendamentosService.getAll(
        { 
          page, 
          limit: itemsPerPage
        },
        filters,
        orderBy
      )

      if (response.data) {
        const agendamentosBackend = response.data.data
        const agendamentosFrontend = AgendamentoAdapter.toFrontendList(agendamentosBackend)
        
        // Aplicar busca por texto (frontend filter por enquanto)
        let filteredAgendamentos = agendamentosFrontend
        if (searchTerm) {
          filteredAgendamentos = agendamentosFrontend.filter(item =>
            item.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.profissional.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        setAgendamentos(filteredAgendamentos)
        setTotalPages(Math.ceil((response.data.total || 0) / itemsPerPage))
      } else {
        throw new Error(response.error || 'Erro ao carregar agendamentos')
      }
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err)
      setError('Erro ao carregar lista de agendamentos')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, profissionalFilter, page, sortField, sortOrder, dateFilter, searchTerm])

  // Carregar agendamentos
  useEffect(() => {
    loadAgendamentos()
  }, [loadAgendamentos, refreshKey])

  // Reset page quando filtros mudam
  useEffect(() => {
    setPage(1)
  }, [statusFilter, profissionalFilter, searchTerm, dateFilter])

  const getStatusColor = (status: string) => {
    const colorMap = {
      'agendado': '#2196F3',
      'confirmado': '#4CAF50',
      'cancelado': '#F44336',
      'concluido': '#9E9E9E'
    }
    return colorMap[status as keyof typeof colorMap] || '#9E9E9E'
  }

  const getStatusLabel = (status: string) => {
    const labelMap = {
      'agendado': 'Agendado',
      'confirmado': 'Confirmado',
      'cancelado': 'Cancelado',
      'concluido': 'Concluído'
    }
    return labelMap[status as keyof typeof labelMap] || status
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  const getAvatarColor = (nome: string) => {
    const colors = [
      '#1976d2', '#388e3c', '#f57c00', '#d32f2f', 
      '#7b1fa2', '#00796b', '#5d4037', '#455a64'
    ]
    const hash = nome.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const getDateLabel = (dateString: string) => {
    const date = parseISO(dateString)
    const today = new Date()
    
    if (isToday(date)) {
      return 'Hoje'
    } else if (isTomorrow(date)) {
      return 'Amanhã'
    } else {
      return format(date, 'dd/MM/yyyy', { locale: ptBR })
    }
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, agendamento: AgendamentoCompleto) => {
    event.stopPropagation()
    setSelectedAgendamento(agendamento)
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedAgendamento(null)
  }

  const handleWhatsApp = (agendamento: AgendamentoCompleto) => {
    const telefone = agendamento.cliente.telefone?.replace(/\D/g, '') || ''
    const data = format(parseISO(agendamento.data_agendamento), 'dd/MM/yyyy', { locale: ptBR })
    const mensagem = `Olá ${agendamento.cliente.nome}! Confirmando seu agendamento para ${data} às ${agendamento.hora_inicio}. Aguardo você! 😊`
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')
    handleMenuClose()
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleSearch = () => {
    setPage(1)
    loadAgendamentos()
  }

  const handleSearchKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <Card>
      <CardContent>
        {/* Header com filtros */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por cliente, profissional ou serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleSearch}>
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Período</InputLabel>
                <Select
                  value={dateFilter}
                  label="Período"
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <MenuItem value="todos">Todos os períodos</MenuItem>
                  <MenuItem value="hoje">Hoje</MenuItem>
                  <MenuItem value="amanha">Amanhã</MenuItem>
                  <MenuItem value="semana">Esta semana</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={sortField}
                  label="Ordenar por"
                  onChange={(e) => setSortField(e.target.value as SortField)}
                >
                  <MenuItem value="data">Data e Hora</MenuItem>
                  <MenuItem value="cliente">Cliente</MenuItem>
                  <MenuItem value="profissional">Profissional</MenuItem>
                  <MenuItem value="status">Status</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                size="small"
              >
                {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Estados de loading e erro */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Lista de agendamentos */}
        {!loading && !error && (
          <>
            {agendamentos.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhum agendamento encontrado
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tente ajustar os filtros ou criar um novo agendamento
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {agendamentos.map((agendamento) => (
                  <Paper
                    key={agendamento.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'primary.light'
                      }
                    }}
                    onClick={() => onView(agendamento)}
                  >
                    <Grid container spacing={2} alignItems="center">
                      {/* Avatar e Info do Cliente */}
                      <Grid item xs={12} sm={4}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: getAvatarColor(agendamento.cliente.nome),
                              width: 48,
                              height: 48,
                              fontWeight: 'bold',
                            }}
                          >
                            {getInitials(agendamento.cliente.nome)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {agendamento.cliente.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {agendamento.cliente.telefone}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Serviço e Profissional */}
                      <Grid item xs={12} sm={3}>
                        <Box>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            {agendamento.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <PersonIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {agendamento.profissional.nome}
                            </Typography>
                          </Box>
                          {agendamento.valor && (
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency(agendamento.valor)}
                            </Typography>
                          )}
                        </Box>
                      </Grid>

                      {/* Data e Hora */}
                      <Grid item xs={12} sm={2}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {getDateLabel(agendamento.data_agendamento)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {agendamento.hora_inicio} - {agendamento.hora_fim}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Status */}
                      <Grid item xs={12} sm={2}>
                        <Chip
                          label={getStatusLabel(agendamento.status)}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(agendamento.status),
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </Grid>

                      {/* Ações */}
                      <Grid item xs={12} sm={1}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, agendamento)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Box>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, newPage) => setPage(newPage)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}

        {/* Menu de ações */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { onView(selectedAgendamento); handleMenuClose() }}>
            <ListItemIcon>
              <VisibilityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver Detalhes</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => { onEdit(selectedAgendamento); handleMenuClose() }}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>

          {selectedAgendamento?.cliente.telefone && (
            <MenuItem onClick={() => selectedAgendamento && handleWhatsApp(selectedAgendamento)}>
              <ListItemIcon>
                <WhatsAppIcon fontSize="small" color="success" />
              </ListItemIcon>
              <ListItemText>WhatsApp</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </CardContent>
    </Card>
  )
} 