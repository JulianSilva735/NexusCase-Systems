import { type ReactNode, useState } from 'react';
import { AppBar, Toolbar, Typography, Box, Avatar, Button, Container, Menu, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ExitToApp, AdminPanelSettings, ArrowDropDown, Settings, BarChart } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface MainLayoutProps { children: ReactNode; }

export const MainLayout = ({ children }: MainLayoutProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const permissions = user?.permissions;
  const displayName = user?.fullName ?? 'Usuario';
  const displayRole = user?.role ?? '';

  const [anchorElAdmin, setAnchorElAdmin] = useState<null | HTMLElement>(null);
  const [anchorElConfig, setAnchorElConfig] = useState<null | HTMLElement>(null);

  const handleNavigate = (path: string) => {
    navigate(path);
    setAnchorElAdmin(null);
    setAnchorElConfig(null);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
              <Typography variant="h6" fontWeight="900" sx={{ background: 'linear-gradient(90deg, #3b82f6 0%, #1e40af 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: { xs: 'none', sm: 'block' } }}>
                NexusCase
              </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button color="inherit" onClick={() => navigate('/dashboard')}>Inicio</Button>

              {permissions?.canViewGlobalStats && (
                <Button color="inherit" startIcon={<BarChart />} onClick={() => navigate('/estadisticas')}>Estadísticas</Button>
              )}

              {displayRole !== 'OPERADOR' && (
                <>
                  {permissions?.canManageUsers && (
                    <>
                      <Button color="inherit" endIcon={<ArrowDropDown />} startIcon={<AdminPanelSettings />} onClick={(e) => setAnchorElAdmin(e.currentTarget)}>
                        Administración
                      </Button>
                      <Menu anchorEl={anchorElAdmin} open={Boolean(anchorElAdmin)} onClose={() => setAnchorElAdmin(null)}>
                        <MenuItem onClick={() => handleNavigate('/admin/users')}>Usuarios y Permisos</MenuItem>
                      </Menu>
                    </>
                  )}

                  {(permissions?.canEditSurveys || permissions?.canManageTimes || displayRole === 'ADMINISTRADOR') && (
                    <>
                      <Button color="inherit" endIcon={<ArrowDropDown />} startIcon={<Settings />} onClick={(e) => setAnchorElConfig(e.currentTarget)}>
                        Configuración
                      </Button>
                      <Menu anchorEl={anchorElConfig} open={Boolean(anchorElConfig)} onClose={() => setAnchorElConfig(null)}>
                        {permissions?.canEditSurveys && <MenuItem onClick={() => handleNavigate('/admin/survey-builder')}>Encuesta Única</MenuItem>}
                        {permissions?.canEditSurveys && <MenuItem divider />}
                        {(displayRole === 'ADMINISTRADOR' || displayRole === 'SUPERVISOR') && <MenuItem onClick={() => handleNavigate('/admin/states')}>Estados del Caso</MenuItem>}
                        {permissions?.canManageTimes && <MenuItem onClick={() => handleNavigate('/admin/times')}>Tiempos (SLA)</MenuItem>}
                        {displayRole === 'ADMINISTRADOR' && <MenuItem onClick={() => handleNavigate('/admin/document-types')}>Tipos de Documentos</MenuItem>}
                      </Menu>
                    </>
                  )}
                </>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ lineHeight: 1.2 }}>{displayName}</Typography>
              <Typography variant="caption" display="block" color="text.secondary">{displayRole}</Typography>
            </Box>
            <Avatar sx={{ bgcolor: '#0f172a', color: 'white' }}>{displayName.charAt(0).toUpperCase()}</Avatar>
            <Button variant="outlined" color="error" size="small" startIcon={<ExitToApp />} onClick={handleLogout} sx={{ textTransform: 'none', fontWeight: 'bold' }}>
              Salir
            </Button>
          </Box>

        </Toolbar>
      </AppBar>
      <Container maxWidth={false} sx={{ mt: 4, mb: 4, px: { xs: 2, md: 5 } }}>{children}</Container>
    </Box>
  );
};
