import { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, InputAdornment } from '@mui/material';
import { PersonOutline, VpnKeyOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    try {
      const response = await api.post('/auth/login', { email, password });
      login(response.data.accessToken, response.data.user);
      navigate('/dashboard');
    } catch {
      setError(true);
    }
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg, #eff6ff 0%, #1e293b 100%)' }}>
      <Paper elevation={10} sx={{ p: 5, width: '100%', maxWidth: 400, borderRadius: 5, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
        
        <Box sx={{ mb: 1 }}>
          <Typography variant="h4" fontWeight="900" sx={{ background: 'linear-gradient(90deg, #3b82f6 0%, #1e40af 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            NexusCase
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sistema de Gestión de Casos
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ textAlign: 'left', mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Correo electrónico</Typography>
            <TextField fullWidth placeholder="usuario@empresa.com" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline /></InputAdornment>, sx: { borderRadius: 2 } }} />
          </Box>

          <Box sx={{ textAlign: 'left', mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>Contraseña</Typography>
            <TextField fullWidth type="password" placeholder="••••••••" variant="outlined" value={password} onChange={(e) => setPassword(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><VpnKeyOutlined /></InputAdornment>, sx: { borderRadius: 2 } }} />
          </Box>

          {error && <Typography color="error" variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>Correo o contraseña incorrectos.</Typography>}

          <Button type="submit" fullWidth variant="contained" sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold', borderRadius: 2, background: 'linear-gradient(90deg, #3b82f6 0%, #1e40af 100%)', '&:hover': { opacity: 0.9 } }}>
            Iniciar Sesión
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};


