import { Box, Typography, Button } from '@mui/material'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        px: 2
      }}
    >
      <Typography variant="h1" component="h1" sx={{ fontSize: '6rem', fontWeight: 'bold', color: 'primary.main' }}>
        404
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        Página não encontrada
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        A página que você está procurando não existe ou foi movida.
      </Typography>
      <Button
        component={Link}
        href="/dashboard"
        variant="contained"
        size="large"
      >
        Voltar ao Dashboard
      </Button>
    </Box>
  )
} 