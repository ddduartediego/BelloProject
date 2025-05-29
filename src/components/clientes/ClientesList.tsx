'use client'

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Paper,
} from '@mui/material'
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material'
import { Cliente } from '@/types/database'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Dados simulados para demonstração
const clientesData: Cliente[] = [
  {
    id: '1',
    nome: 'Maria Silva Santos',
    telefone: '(11) 99999-1111',
    email: 'maria.silva@email.com',
    data_nascimento: '1985-03-15',
    observacoes: 'Cliente VIP - Prefere atendimento pela manhã',
    id_empresa: 'empresa-1',
    criado_em: '2024-01-15T10:00:00Z',
    atualizado_em: '2024-12-01T15:30:00Z',
  },
  {
    id: '2',
    nome: 'João Carlos Oliveira',
    telefone: '(11) 99999-2222',
    email: 'joao.carlos@email.com',
    data_nascimento: '1990-07-22',
    observacoes: '',
    id_empresa: 'empresa-1',
    criado_em: '2024-02-20T14:30:00Z',
    atualizado_em: '2024-11-28T09:15:00Z',
  },
  {
    id: '3',
    nome: 'Amanda Costa Ferreira',
    telefone: '(11) 99999-3333',
    email: 'amanda.costa@email.com',
    data_nascimento: '1992-11-08',
    observacoes: 'Alérgica a alguns produtos químicos - verificar antes do procedimento',
    id_empresa: 'empresa-1',
    criado_em: '2024-03-10T11:20:00Z',
    atualizado_em: '2024-12-05T16:45:00Z',
  },
  {
    id: '4',
    nome: 'Pedro Henrique Santos',
    telefone: '(11) 99999-4444',
    email: '',
    data_nascimento: '1988-05-30',
    observacoes: 'Corte sempre no último sábado do mês',
    id_empresa: 'empresa-1',
    criado_em: '2024-04-05T16:00:00Z',
    atualizado_em: '2024-11-30T12:20:00Z',
  },
  {
    id: '5',
    nome: 'Lucia Fernanda Almeida',
    telefone: '(11) 99999-5555',
    email: 'lucia.almeida@email.com',
    data_nascimento: '1983-12-12',
    observacoes: '',
    id_empresa: 'empresa-1',
    criado_em: '2024-05-18T09:10:00Z',
    atualizado_em: '2024-12-03T14:00:00Z',
  },
]

interface ClientesListProps {
  onEdit: (cliente: Cliente) => void
  onDelete: (cliente: Cliente) => void
}

export default function ClientesList({ onEdit, onDelete }: ClientesListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('todos')
  const [page, setPage] = useState(1)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)

  const rowsPerPage = 10

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, cliente: Cliente) => {
    setAnchorEl(event.currentTarget)
    setSelectedCliente(cliente)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedCliente(null)
  }

  const handleEdit = () => {
    if (selectedCliente) {
      onEdit(selectedCliente)
    }
    handleMenuClose()
  }

  const handleDelete = () => {
    if (selectedCliente) {
      onDelete(selectedCliente)
    }
    handleMenuClose()
  }

  // Filtrar clientes baseado na busca e filtros
  const filteredClientes = clientesData.filter(cliente => {
    const matchesSearch = 
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm) ||
      (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = filterType === 'todos' || 
      (filterType === 'com_email' && cliente.email) ||
      (filterType === 'sem_email' && !cliente.email) ||
      (filterType === 'com_aniversario' && cliente.data_nascimento)

    return matchesSearch && matchesFilter
  })

  // Paginação
  const totalPages = Math.ceil(filteredClientes.length / rowsPerPage)
  const startIndex = (page - 1) * rowsPerPage
  const paginatedClientes = filteredClientes.slice(startIndex, startIndex + rowsPerPage)

  const formatDataNascimento = (data: string | undefined) => {
    if (!data) return '-'
    try {
      return format(parseISO(data), 'dd/MM/yyyy', { locale: ptBR })
    } catch {
      return '-'
    }
  }

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <Card>
      <CardContent>
        {/* Header com busca e filtros */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar por nome, telefone ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por</InputLabel>
                <Select
                  value={filterType}
                  label="Filtrar por"
                  onChange={(e) => setFilterType(e.target.value)}
                  startAdornment={<FilterIcon sx={{ mr: 1, color: 'action.active' }} />}
                >
                  <MenuItem value="todos">Todos os clientes</MenuItem>
                  <MenuItem value="com_email">Com email</MenuItem>
                  <MenuItem value="sem_email">Sem email</MenuItem>
                  <MenuItem value="com_aniversario">Com aniversário</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {filteredClientes.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {filteredClientes.length === 1 ? 'Cliente encontrado' : 'Clientes encontrados'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Tabela de clientes */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>Aniversário</TableCell>
                <TableCell>Cadastro</TableCell>
                <TableCell width={100}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedClientes.map((cliente) => (
                <TableRow key={cliente.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getInitials(cliente.nome)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="medium">
                          {cliente.nome}
                        </Typography>
                        {cliente.observacoes && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {cliente.observacoes.length > 50 
                              ? `${cliente.observacoes.substring(0, 50)}...` 
                              : cliente.observacoes
                            }
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {cliente.telefone}
                        </Typography>
                      </Box>
                      {cliente.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {cliente.email}
                          </Typography>
                        </Box>
                      )}
                      {!cliente.email && (
                        <Chip 
                          label="Sem email" 
                          size="small" 
                          variant="outlined" 
                          color="warning"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {cliente.data_nascimento ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CakeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {formatDataNascimento(cliente.data_nascimento)}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {format(parseISO(cliente.criado_em), 'dd/MM/yyyy', { locale: ptBR })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, cliente)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginação */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}

        {/* Estado vazio */}
        {filteredClientes.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <PersonIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhum cliente encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm 
                ? 'Tente alterar os termos da busca ou filtros'
                : 'Comece cadastrando seu primeiro cliente'
              }
            </Typography>
          </Box>
        )}

        {/* Menu de ações */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Editar</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Excluir</ListItemText>
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  )
} 