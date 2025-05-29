'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  Add as AddIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import Layout from '@/components/common/Layout'
import ClienteForm from '@/components/clientes/ClienteForm'
import ClientesList from '@/components/clientes/ClientesList'
import ConfirmDeleteDialog from '@/components/clientes/ConfirmDeleteDialog'
import { Cliente } from '@/types/database'

export default function ClientesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Função para mostrar notificação
  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  // Função para fechar snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }))
  }

  // Função para abrir formulário de novo cliente
  const handleNovoCliente = () => {
    setSelectedCliente(null)
    setFormOpen(true)
  }

  // Função para abrir formulário de edição
  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setFormOpen(true)
  }

  // Função para abrir dialog de exclusão
  const handleDeleteCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setDeleteDialogOpen(true)
  }

  // Função para salvar cliente (criar ou editar)
  const handleSaveCliente = async (clienteData: {
    nome: string
    telefone: string
    email?: string
    data_nascimento?: string
    observacoes?: string
  }) => {
    setLoading(true)
    
    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (selectedCliente) {
        // Simular edição
        showSnackbar(`Cliente ${clienteData.nome} foi atualizado com sucesso!`)
      } else {
        // Simular criação
        showSnackbar(`Cliente ${clienteData.nome} foi cadastrado com sucesso!`)
      }
      
      setFormOpen(false)
      setSelectedCliente(null)
      
      // Aqui você integraria com a API real:
      // const response = await supabase
      //   .from('cliente')
      //   .insert(clienteData) // ou .update(clienteData).eq('id', selectedCliente.id)
      
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      showSnackbar('Erro ao salvar cliente. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!selectedCliente) return
    
    setLoading(true)
    
    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showSnackbar(`Cliente ${selectedCliente.nome} foi excluído com sucesso!`)
      setDeleteDialogOpen(false)
      setSelectedCliente(null)
      
      // Aqui você integraria com a API real:
      // await supabase
      //   .from('cliente')
      //   .delete()
      //   .eq('id', selectedCliente.id)
      
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      showSnackbar('Erro ao excluir cliente. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para fechar formulário
  const handleCloseForm = () => {
    setFormOpen(false)
    setSelectedCliente(null)
  }

  // Função para fechar dialog de exclusão
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setSelectedCliente(null)
  }

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header da página */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Gestão de Clientes
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Gerencie sua base de clientes de forma eficiente
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovoCliente}
            size="large"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
            }}
          >
            Novo Cliente
          </Button>
        </Box>

        {/* Lista de clientes */}
        <ClientesList
          onEdit={handleEditCliente}
          onDelete={handleDeleteCliente}
        />

        {/* Formulário de cliente */}
        <ClienteForm
          open={formOpen}
          onClose={handleCloseForm}
          onSave={handleSaveCliente}
          cliente={selectedCliente || undefined}
          loading={loading}
        />

        {/* Dialog de confirmação de exclusão */}
        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
          cliente={selectedCliente}
          loading={loading}
        />

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  )
} 