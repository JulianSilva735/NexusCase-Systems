import React, { useState } from 'react';
import { 
  Box, Card, CardContent, Typography, Button, Grid,
  CircularProgress, Alert, Snackbar 
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import GavelIcon from '@mui/icons-material/Gavel';
import EmailIcon from '@mui/icons-material/Email';
import { api } from '../../api/axios'; 

const TEMPLATES = [
  { id: 'PODER', label: 'Poder de Representación', icon: <GavelIcon fontSize="large" /> },
  { id: 'CONTRATO', label: 'Contrato de Mandato', icon: <DescriptionIcon fontSize="large" /> },
  { id: 'CARTA', label: 'Carta de Presentación', icon: <EmailIcon fontSize="large" /> },
];

interface DocumentGeneratorProps {
  caseId: string;
  onDocumentGenerated: () => void;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ caseId, onDocumentGenerated }) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleGenerate = async (templateType: string) => {
    setLoading(templateType);
    try {
      await api.post(`/documents/generate/${caseId}/${templateType}`);

      setFeedback({ type: 'success', message: 'Documento generado y guardado en el expediente.' });
      onDocumentGenerated(); 
    } catch (error) {
      console.error(error);
      setFeedback({ type: 'error', message: 'Error generando el documento.' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box sx={{ mb: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#333', mb: 2, fontWeight: 600 }}>
        Generación de Plantillas
      </Typography>
      
      {/* CORRECCIÓN AQUÍ: Eliminamos 'item' y usamos 'size' */}
      <Grid container spacing={2}>
        {TEMPLATES.map((template) => (
          <Grid 
            key={template.id} 
            xs={12} sm={4} // <--- Sintaxis nueva para MUI v6
          >
            <Card variant="outlined" sx={{ '&:hover': { boxShadow: 3, borderColor: 'primary.main' }, transition: '0.2s' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 2 }}>
                <Box sx={{ color: 'primary.main' }}>
                  {template.icon}
                </Box>
                <Typography variant="subtitle2" align="center" sx={{ fontWeight: 500 }}>
                  {template.label}
                </Typography>
                
                <Button 
                  variant="contained" 
                  size="small" 
                  fullWidth
                  disabled={loading !== null}
                  onClick={() => handleGenerate(template.id)}
                  startIcon={loading === template.id ? <CircularProgress size={16} color="inherit"/> : null}
                  sx={{ mt: 1 }}
                >
                  {loading === template.id ? 'Generando...' : 'Generar'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Snackbar 
        open={!!feedback} 
        autoHideDuration={6000} 
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={feedback?.type || 'info'} onClose={() => setFeedback(null)} sx={{ width: '100%' }}>
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
