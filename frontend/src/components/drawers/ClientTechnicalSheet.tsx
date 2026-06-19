import React from 'react';
import { 
  Drawer, Box, Typography, IconButton, Divider, Grid, Avatar, Chip 
} from '@mui/material';
import { Close, Fingerprint, Cake, Wc, Phone, Home } from '@mui/icons-material';
import type { Case } from '../../types/case';

interface Props {
  open: boolean;
  onClose: () => void;
  caseData: Case;
}

export const ClientTechnicalSheet: React.FC<Props> = ({ open, onClose, caseData }) => {
  
  // 🧮 Función para calcular edad real basada en la fecha de nacimiento
  const calculateAge = (dob?: string) => {
    if (!dob) return '---';
    const birthDate = new Date(dob);
    const difference = Date.now() - birthDate.getTime();
    const ageDate = new Date(difference); 
    // 1970 es el año epoch, restamos para obtener la diferencia en años
    return Math.abs(ageDate.getUTCFullYear() - 1970) + ' Años';
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: 300, sm: 450 }, p: 0, bgcolor: '#f8fafc', height: '100%' }}>
        
        {/* HEADER DEL DRAWER */}
        <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 'bold' }}>
                    {caseData.clientName?.charAt(0).toUpperCase() || 'C'}
                </Avatar>
                <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                        {caseData.clientName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip 
                            icon={<Fingerprint />} 
                            label={caseData.clientIdNumber || 'Sin ID'} 
                            size="small" 
                            sx={{ bgcolor: '#0f172a', color: 'white', fontWeight: 'bold' }} 
                        />
                        <Typography variant="caption" color="text.secondary">
                            • {calculateAge(caseData.clientDob)}
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <IconButton onClick={onClose} size="small"><Close /></IconButton>
        </Box>

        {/* CONTENIDO */}
        <Box sx={{ p: 3, overflowY: 'auto', height: 'calc(100% - 100px)' }}>
            
            {/* SECCIÓN 1: DATOS BIOGRÁFICOS */}
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, display: 'block' }}>
                Datos Biográficos
            </Typography>
            <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, border: '1px solid #e2e8f0', mb: 3 }}>
                <Grid container spacing={2}>
                    <InfoItem icon={<Wc />} label="Género" value={caseData.clientGender || 'No registrado'} />
                    <InfoItem icon={<Cake />} label="Fecha de Nacimiento" value={caseData.clientDob || 'No registrada'} />
                </Grid>
            </Box>

            {/* SECCIÓN 2: FILIACIÓN Y CONTACTO */}
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, display: 'block' }}>
                Filiación y Contacto
            </Typography>
            <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, border: '1px solid #e2e8f0', mb: 3 }}>
                <Grid container spacing={2}>
                    <InfoItem label="Nombre Padre" value={caseData.clientFatherName || 'No registrado'} fullWidth />
                    <Divider sx={{ width: '100%', my: 1 }} />
                    <InfoItem label="Nombre Madre" value={caseData.clientMotherName || 'No registrado'} fullWidth />
                    <Divider sx={{ width: '100%', my: 1 }} />
                    <InfoItem icon={<Phone />} label="Teléfono / Celular" value={caseData.clientPhone || 'No registrado'} fullWidth highlight />
                    <Divider sx={{ width: '100%', my: 1 }} />
                    <InfoItem icon={<Home />} label="Dirección Residencia" value={caseData.clientAddress || 'No registrada'} fullWidth />
                </Grid>
            </Box>

            {/* SECCIÓN 3: UBICACIÓN */}
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ textTransform: 'uppercase', mb: 2, display: 'block' }}>
                Ubicación de Origen
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
                <LocationBox 
                    label="Lugar de Nacimiento" 
                    value={caseData.clientPob || '---'} 
                    date={caseData.clientDob || ''} 
                    color="#fff7ed" 
                    borderColor="#fed7aa" 
                />
                <LocationBox 
                    label="Lugar de Expedición" 
                    value={caseData.clientExpeditionPlace || '---'} 
                    date="Fecha no disp." 
                    color="#f0f9ff" 
                    borderColor="#bae6fd" 
                />
            </Box>

        </Box>

        {/* FOOTER */}
        <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
                Código de Caso: {caseData.caseCode}
            </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

// --- COMPONENTES AUXILIARES ---

// Mantiene la sintaxis MUI v6 (Grid size)
const InfoItem = ({ icon, label, value, fullWidth, highlight }: any) => (
    <Grid xs={fullWidth ? 12 : 6}>
        <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {icon && React.cloneElement(icon, { sx: { fontSize: 14 } })} {label}
            </Typography>
            <Typography variant="body2" fontWeight={highlight ? 'bold' : 'normal'} sx={{ fontSize: highlight ? '1rem' : '0.875rem' }}>
                {value}
            </Typography>
        </Box>
    </Grid>
);

const LocationBox = ({ label, value, date, color, borderColor }: any) => (
    <Box sx={{ flex: 1, bgcolor: color, border: `1px solid ${borderColor}`, borderRadius: 2, p: 2 }}>
        <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ textTransform: 'uppercase' }}>
            {label}
        </Typography>
        <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>{value}</Typography>
        {date && <Typography variant="caption" display="block">{date}</Typography>}
    </Box>
);
