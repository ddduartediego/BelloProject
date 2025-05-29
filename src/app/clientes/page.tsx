'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Button,
} from '@mui/material'
import { 
  Add as AddIcon,
  People as PeopleIcon,
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/common/Layout'
import LoadingScreen from '@/components/common/LoadingScreen'

export default function ClientesPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return <LoadingScreen message="Carregando clientes..." />
  }

  if (!isAuthenticated()) {
    return null
  }

  return (
    <Layout>
      <Box>
        {/* Header da página */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Clientes
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Gerencie sua base de clientes
            </Typography>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            sx={{ borderRadius: 2 }}
          >
            Novo Cliente
          </Button>
        </Box>

        {/* Conteúdo principal */}
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <PeopleIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Funcionalidade em Desenvolvimento
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              A gestão de clientes será implementada na FASE 5 do desenvolvimento.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Esta página incluirá:
              <br />• Listagem completa de clientes
              <br />• Busca e filtros avançados
              <br />• Cadastro e edição de clientes
              <br />• Histórico de atendimentos
              <br />• Informações de contato e preferências
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  )
} 