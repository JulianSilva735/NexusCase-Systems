import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import type { UserPermissions } from '../utils/permissions';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: (keyof UserPermissions)[];
  requiredRole?: ('ADMINISTRADOR' | 'SUPERVISOR' | 'OPERADOR')[];
}

export const ProtectedRoute = ({ children, requiredPermissions = [], requiredRole = [] }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (requiredRole.length > 0 && user) {
    if (!requiredRole.includes(user.role as 'ADMINISTRADOR' | 'SUPERVISOR' | 'OPERADOR')) return <AccessDenied />;
  }

  if (requiredPermissions.length > 0 && user) {
    if (user.role === 'ADMINISTRADOR') return <>{children}</>;
    const hasAll = requiredPermissions.every((perm) => user.permissions[perm]);
    if (!hasAll) return <AccessDenied />;
  }

  return <>{children}</>;
};

const AccessDenied = () => (
  <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 100%)', p: 2 }}>
    <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
      <LockOutlined sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>Acceso Denegado</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        No tienes permisos suficientes para acceder a esta sección.<br />
        Si crees que esto es un error, contacta con tu administrador.
      </Typography>
      <Button variant="contained" color="primary" href="/dashboard" sx={{ mt: 2 }}>Volver al Dashboard</Button>
    </Box>
  </Box>
);
