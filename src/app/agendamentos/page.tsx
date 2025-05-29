'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Snackbar,
  Alert,
  Fab,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Add as AddIcon,
  Event as EventIcon,
} from '@mui/icons-material'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'
import Layout from '@/components/common/Layout'
import CalendarioAgendamentos from '@/components/agendamentos/CalendarioAgendamentos'
import AgendamentoForm from '@/components/agendamentos/AgendamentoForm'
import { Agendamento } from '@/types/database'

dayjs.locale('pt-br')

export default function AgendamentosPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [agendamentoFormOpen, setAgendamentoFormOpen] = useState(false)
  const [selectedAgendamento, setSelectedAgendamento] = useState<Partial<Agendamento> | null>(null)
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

  // Função para abrir formulário de novo agendamento
  const handleNovoAgendamento = () => {
    setSelectedAgendamento(null)
    setAgendamentoFormOpen(true)
  }

  // Função para editar agendamento existente
  const handleEditAgendamento = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento)
    setAgendamentoFormOpen(true)
  }

  // Função para salvar agendamento
  const handleSaveAgendamento = async (agendamentoData: any) => {
    setLoading(true)
    
    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log('Dados do agendamento:', agendamentoData)
      
      if (selectedAgendamento) {
        showSnackbar('Agendamento atualizado com sucesso!')
      } else {
        showSnackbar('Agendamento criado com sucesso!')
      }
      
      setAgendamentoFormOpen(false)
      setSelectedAgendamento(null)
      
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error)
      showSnackbar('Erro ao salvar agendamento. Tente novamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Função para selecionar data no calendário
  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
  }

  // Função para clicar em um agendamento
  const handleAgendamentoClick = (agendamento: Agendamento) => {
    handleEditAgendamento(agendamento)
  }

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header da página */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <EventIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Agendamentos
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Gerencie a agenda do seu salão de beleza
              </Typography>
            </Box>
          </Box>

          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNovoAgendamento}
              size="large"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                px: 3,
              }}
            >
              Novo Agendamento
            </Button>
          )}
        </Box>

        {/* Calendário e Lista de Agendamentos */}
        <CalendarioAgendamentos
          agendamentos={[]} // Será preenchido com dados reais
          onDateSelect={handleDateSelect}
          onAgendamentoClick={handleAgendamentoClick}
          selectedDate={selectedDate}
        />

        {/* Floating Action Button para mobile */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="novo agendamento"
            onClick={handleNovoAgendamento}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Formulário de Agendamento */}
        <AgendamentoForm
          open={agendamentoFormOpen}
          onClose={() => setAgendamentoFormOpen(false)}
          onSave={handleSaveAgendamento}
          agendamento={selectedAgendamento || undefined}
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