'use client'

import React, { useState } from 'react'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  LocalAtm as CashIcon,
  Inventory as InventoryIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  ContentCut as ScissorsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Work as ProfessionalsIcon,
} from '@mui/icons-material'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const drawerWidth = 280

interface NavigationItem {
  text: string
  icon: React.ReactElement
  path: string
  requireAdmin?: boolean
}

const navigationItems: NavigationItem[] = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    text: 'Clientes',
    icon: <PeopleIcon />,
    path: '/clientes',
  },
  {
    text: 'Agendamentos',
    icon: <CalendarIcon />,
    path: '/agendamentos',
  },
  {
    text: 'Serviços',
    icon: <ScissorsIcon />,
    path: '/servicos',
  },
  {
    text: 'Profissionais',
    icon: <ProfessionalsIcon />,
    path: '/profissionais',
  },
  {
    text: 'Comandas',
    icon: <ReceiptIcon />,
    path: '/comandas',
  },
  {
    text: 'Caixa',
    icon: <CashIcon />,
    path: '/caixa',
  },
  {
    text: 'Produtos',
    icon: <InventoryIcon />,
    path: '/produtos',
  },
  {
    text: 'Relatórios',
    icon: <ReportsIcon />,
    path: '/relatorios',
    requireAdmin: true,
  },
  {
    text: 'Configurações',
    icon: <SettingsIcon />,
    path: '/configuracoes',
    requireAdmin: true,
  },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const router = useRouter()
  const pathname = usePathname()
  const { usuario, user, signOut, isAdmin } = useAuth()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    handleProfileMenuClose()
    await signOut()
    router.push('/login')
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const filteredNavigationItems = navigationItems.filter(item => {
    if (item.requireAdmin && !isAdmin()) {
      return false
    }
    return true
  })

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo e título */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ScissorsIcon color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h6" component="div" fontWeight="bold">
          Bello System
        </Typography>
      </Box>
      
      <Divider />

      {/* Navegação principal */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {filteredNavigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.contrastText',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: pathname === item.path ? 600 : 400,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Informações do usuário */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Conectado como:
        </Typography>
        <Typography variant="body2" fontWeight="medium" noWrap>
          {usuario?.nome_completo || user?.email}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {usuario?.tipo_usuario}
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.08)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="abrir menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find(item => item.path === pathname)?.text || 'Dashboard'}
          </Typography>

          {/* Menu do perfil */}
          <IconButton
            size="large"
            aria-label="conta do usuário atual"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              <AccountCircleIcon />
            </Avatar>
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Meu Perfil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Sair
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Drawer para mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Melhor performance no mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Drawer para desktop */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid rgba(0, 0, 0, 0.08)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar /> {/* Espaçamento para o AppBar */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
} 