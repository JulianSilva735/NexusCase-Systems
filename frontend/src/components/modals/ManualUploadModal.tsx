import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface Props {
    open: boolean;
    onClose: () => void;
    onUpload: (name: string, file: File) => void;
}

export const ManualUploadModal: React.FC<Props> = ({ open, onClose, onUpload }) => {
    const [docName, setDocName] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleUpload = () => {
        if (docName && file) {
            onUpload(docName, file);
            setDocName('');
            setFile(null);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Subir Documento Adicional</DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField 
                        label="Nombre del Documento" 
                        placeholder="Ej: Historia Clínica Antigua"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        fullWidth
                    />
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CloudUpload />}
                        sx={{ p: 2, borderStyle: 'dashed' }}
                    >
                        {file ? file.name : "Seleccionar Archivo"}
                        <input type="file" hidden onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                    </Button>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancelar</Button>
                <Button onClick={handleUpload} variant="contained" disabled={!docName || !file}>Subir</Button>
            </DialogActions>
        </Dialog>
    );
};