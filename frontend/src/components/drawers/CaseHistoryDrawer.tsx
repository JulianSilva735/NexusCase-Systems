import React, { useState } from 'react';
import { 
  Drawer, Box, Typography, List, Divider, IconButton, Paper, 
  TextField, Button, Avatar 
} from '@mui/material';
import { Close, History, Person, Send, SmartToy } from '@mui/icons-material';
import { api } from '../../api/axios'; 
import type { CaseHistory } from '../../types/case';

interface Props {
  open: boolean;
  onClose: () => void;
  history: CaseHistory[];
  caseId: string; 
    onCommentAdded: () => void | Promise<void>; 
}

// 👇 CORRECCIÓN AQUÍ: Aceptamos string | undefined
const renderTextWithMentions = (text: string | undefined) => {
    if (!text) return null;
    return text.split(' ').map((word, index) => {
        if (word.startsWith('@')) {
            return <span key={index} style={{ color: '#2563eb', fontWeight: 'bold' }}>{word} </span>;
        }
        return word + ' ';
    });
};

export const CaseHistoryDrawer: React.FC<Props> = ({ 
    open, onClose, history = [], caseId, onCommentAdded 
}) => {
  
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    
    setLoading(true);
    try {
        await api.post(`/cases/${caseId}/comment`, { comment: newComment });
        
        setNewComment('');
        await onCommentAdded(); 
    } catch (error) {
        console.error("Error enviando comentario", error);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 380, p: 3, height: '100%', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        
        {/* Encabezado */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <History color="primary" />
                <Typography variant="h6" fontWeight="bold">Bitácora del Caso</Typography>
            </Box>
            <IconButton onClick={onClose}><Close /></IconButton>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* --- ÁREA DE ESCRITURA --- */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #cbd5e1', bgcolor: 'white' }}>
            <Typography variant="caption" fontWeight="bold" sx={{ color: '#64748b', mb: 1, display: 'block' }}>
                Agregar nota o mención (@)
            </Typography>
            <TextField 
                fullWidth 
                multiline 
                rows={2}
                variant="outlined" 
                size="small"
                placeholder="Escribe aquí..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                sx={{ mb: 1, '& .MuiOutlinedInput-root': { bgcolor: '#f8fafc' } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                    variant="contained" 
                    size="small" 
                    endIcon={<Send fontSize="small"/>}
                    onClick={handleSendComment}
                    disabled={loading || !newComment.trim()}
                    sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                    Guardar
                </Button>
            </Box>
        </Paper>

        {/* Lista de Eventos */}
        <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
            <List>
            {history.length === 0 ? (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                    No hay registros en el historial aún.
                </Typography>
            ) : (
                history.map((event) => (
                    <PaperItem key={event.id} event={event} />
                ))
            )}
            </List>
        </Box>

      </Box>
    </Drawer>
  );
};

// Item Visual
const PaperItem = ({ event }: { event: CaseHistory }) => {
    
    const isComment = event.type === 'COMMENT';

    let borderColor = '#3b82f6'; 
    let icon = <SmartToy sx={{ fontSize: 18, color: '#64748b' }} />; 
    let bgColor = 'white';

    if (isComment) {
        borderColor = '#8b5cf6'; 
        icon = <Person sx={{ fontSize: 18, color: '#8b5cf6' }} />;
        bgColor = '#faf5ff'; 
    } else {
        if (event.action.includes('Cancel')) borderColor = '#ef4444'; 
        if (event.action.includes('Creado')) borderColor = '#22c55e'; 
        if (event.action.includes('Actualización')) borderColor = '#f59e0b'; 
    }

    return (
        <Paper elevation={0} sx={{ 
            p: 2, mb: 2, 
            bgcolor: bgColor, 
            border: '1px solid #e2e8f0', 
            borderLeft: `4px solid ${borderColor}`,
            borderRadius: 2
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, bgcolor: 'white', border: '1px solid #e2e8f0' }}>
                        {icon}
                    </Avatar>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1e293b' }}>
                        {event.action}
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                    {new Date(event.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </Typography>
            </Box>
            
            <Box sx={{ pl: 4 }}>
                {isComment ? (
                    <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', mb: 1 }}>
                        "{renderTextWithMentions(event.userComment)}"
                    </Typography>
                ) : (
                    <Typography variant="body2" sx={{ color: '#475569', mb: 1 }}>
                        {event.description}
                    </Typography>
                )}

                <Typography variant="caption" fontWeight="bold" sx={{ color: isComment ? '#7c3aed' : '#64748b' }}>
                    Por: {event.user?.fullName || 'Sistema'}
                </Typography>
            </Box>
        </Paper>
    );
}
