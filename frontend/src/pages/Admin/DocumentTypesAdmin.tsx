import { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControlLabel,
    Switch,
    Chip,
    IconButton,
    CircularProgress,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    OutlinedInput,
    Checkbox,
    ListItemText
} from '@mui/material';
import {
    DataGrid,
    GridToolbar
} from '@mui/x-data-grid';
import type {
    GridColDef,
    GridRenderCellParams
} from '@mui/x-data-grid';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { MainLayout } from '../../layouts/MainLayout';
import { documentTypesService } from '../../services/documentTypes.service';
import type { DocumentType } from '../../services/documentTypes.service';

const ALLOWED_FORMATS_OPTIONS = [
    "PDF",
    "JPG",
    "WORD"
];

export const DocumentTypesAdmin = () => {
    const [docs, setDocs] = useState<DocumentType[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [open, setOpen] = useState(false);
    const [editingDoc, setEditingDoc] = useState<DocumentType | null>(null);

    // Form State
    const [formData, setFormData] = useState<Omit<DocumentType, 'id'>>({
        name: '',
        description: '',
        isMandatory: false,
        isActive: true, // Default active
        allowedFormats: []
    });

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const data = await documentTypesService.getAll();
            setDocs(data);
        } catch (error) {
            console.error("Error fetching document types", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocs();
    }, []);

    const handleOpen = (doc?: DocumentType) => {
        if (doc) {
            setEditingDoc(doc);
            setFormData({
                name: doc.name,
                description: doc.description,
                isMandatory: doc.isMandatory,
                isActive: doc.isActive,
                allowedFormats: doc.allowedFormats || []
            });
        } else {
            setEditingDoc(null);
            setFormData({
                name: '',
                description: '',
                isMandatory: false,
                isActive: true,
                allowedFormats: []
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setEditingDoc(null);
    };

    const handleSave = async () => {
        try {
            if (editingDoc && editingDoc.id) {
                // EDIT MODE
                await documentTypesService.update(editingDoc.id, formData);
            } else {
                // CREATE MODE
                await documentTypesService.create(formData);
            }

            // Refresh data AND close modal
            await fetchDocs();
            handleClose();
        } catch (error) {
            console.error("Error saving document type", error);
            alert("Error al guardar. Verifica la consola.");
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar este tipo de documento?")) {
            try {
                await documentTypesService.delete(id);
                fetchDocs();
            } catch (error) {
                console.error("Error deleting", error);
                alert("Error al eliminar.");
            }
        }
    };

    const columns: GridColDef[] = [
        { field: 'name', headerName: 'Tipo', width: 250, flex: 1 },
        { field: 'description', headerName: 'Descripción', width: 300, flex: 2 },
        {
            field: 'allowedFormats',
            headerName: 'Formatos',
            width: 200,
            renderCell: (params: GridRenderCellParams) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', py: 1 }}>
                    {Array.isArray(params.value) && params.value.map((fmt: string) => (
                        <Chip key={fmt} label={fmt} size="small" variant="outlined" />
                    ))}
                </Box>
            )
        },
        {
            field: 'isActive',
            headerName: 'Estado',
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                params.value ?
                    <Chip label="Activo" color="success" size="small" variant="filled" /> :
                    <Chip label="Inactivo" color="default" size="small" variant="outlined" />
            )
        },
        {
            field: 'isMandatory',
            headerName: 'Requerido',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <Checkbox checked={!!params.value} disabled size="small" />
            )
        },
        {
            field: 'actions',
            headerName: 'Acciones',
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Box>
                    <IconButton color="primary" size="small" onClick={() => handleOpen(params.row as DocumentType)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" size="small" onClick={() => handleDelete((params.row as DocumentType).id)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            )
        }
    ];

    return (
        <MainLayout>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                            Admin de Tipos de Documentos
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Gestión simplificada de documentos del sistema.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpen()}
                    >
                        Crear Nuevo
                    </Button>
                </Box>

                <Paper sx={{ flex: 1, width: '100%', p: 2, elevation: 2 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
                    ) : (
                        <DataGrid
                            rows={docs}
                            columns={columns}
                            slots={{ toolbar: GridToolbar }}
                            initialState={{
                                pagination: { paginationModel: { pageSize: 10 } },
                            }}
                            pageSizeOptions={[10, 25, 50]}
                            disableRowSelectionOnClick
                            rowHeight={70}
                        />
                    )}
                </Paper>

                {/* DIALOG FORM */}
                <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {editingDoc ? `Editar Documento` : `Nuevo Documento`}
                    </DialogTitle>
                    <DialogContent dividers>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>

                            <TextField
                                label="Nombre del Documento"
                                fullWidth
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />

                            <TextField
                                label="Descripción"
                                fullWidth
                                multiline
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />

                            <FormControl fullWidth>
                                <InputLabel>Formatos Permitidos</InputLabel>
                                <Select
                                    multiple
                                    value={formData.allowedFormats}
                                    onChange={(e) => {
                                        const { value } = e.target;
                                        setFormData({
                                            ...formData,
                                            allowedFormats: typeof value === 'string' ? value.split(',') : value,
                                        });
                                    }}
                                    input={<OutlinedInput label="Formatos Permitidos" />}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => (
                                                <Chip key={value} label={value} size="small" />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {ALLOWED_FORMATS_OPTIONS.map((name) => (
                                        <MenuItem key={name} value={name}>
                                            <Checkbox checked={formData.allowedFormats.indexOf(name) > -1} />
                                            <ListItemText primary={name} />
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Box sx={{ display: 'flex', gap: 4 }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isMandatory}
                                            onChange={(e) => setFormData({ ...formData, isMandatory: e.target.checked })}
                                        />
                                    }
                                    label="¿Es Requerido?"
                                />
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            color="success"
                                        />
                                    }
                                    label="¿Está Activo?"
                                />
                            </Box>

                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: 3 }}>
                        <Button onClick={handleClose} color="inherit">Cancelar</Button>
                        <Button onClick={handleSave} variant="contained">Guardar</Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </MainLayout>
    );
};
