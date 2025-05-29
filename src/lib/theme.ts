'use client'

import { createTheme } from '@mui/material/styles';

// Criando tema personalizado para o Bello System
const theme = createTheme({
  palette: {
    primary: {
      main: '#8B5A3C',
    },
    secondary: {
      main: '#E8A87C',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default theme; 