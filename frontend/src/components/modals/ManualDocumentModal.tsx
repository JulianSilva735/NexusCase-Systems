import React, { useState } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, TextField, Box, Typography 
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface Props {
    open: boolean;
    onClose: () => void;
    onUpload: (name: string, file: File) => void;
}

export const ManualDocumentModal: React.FC<Props> = ({ open, onClose, onUpload }) => {
    const [docName, setDocName] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = () => {
        if (docName && file) {
            onUpload(docName, file);
            // Reset y cerrar
            setDocName('');
            setFile(null);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Subir Documento Adicional</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Cree un nuevo registro documental que no estaba contemplado en la encuesta inicial.
                    </Typography>

                    <TextField 
                        fullWidth 
                        label="Nombre del Documento" 
                        placeholder="Ej: Carta de Recomendación Extra"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        autoFocus
                    />

                    <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        sx={{ height: 50 }}
                    >
                        {file ? file.name : 'Seleccionar Archivo (PDF/IMG)'}
                        <input type="file" hidden onChange={handleFileChange} />
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button 
                    onClick={handleUpload} 
                    variant="contained" 
                    disabled={!docName || !file}
                >
                    Subir Documento
                </Button>
            </DialogActions>
        </Dialog>
    );
};