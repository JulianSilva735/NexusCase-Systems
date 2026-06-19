import React, { useState, useMemo } from 'react';
import {
    Box, Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Typography, Alert, Chip, Tooltip,
    Menu, MenuItem, ListItemIcon, ListItemText
} from '@mui/material';
import { Add, Delete, Star, Edit, Gavel, Description, Email } from '@mui/icons-material';
import { api } from '../../api/axios';
import { AddRelativeModal } from '../modals/AddRelativeModal';
import type { Case, Relative } from '../../types/case';

interface Props {
    caseData: Case;
    relatives: Relative[];
    onUpdate: () => void | Promise<void>;
}

export const RelativesTab: React.FC<Props> = ({ caseData, relatives, onUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [editingRelative, setEditingRelative] = useState<any>(null);

    // 1. OPTIMIZACIÓN: Lógica unificada para generar los "Titulares"
    const displayList = useMemo(() => {
        // Configuración para mapear los datos del Caso a la estructura de Familiar
        const virtualConfigs = [
            {
                condition: caseData.clientFatherName,
                id: 'virtual-father',
                firstName: caseData.clientFatherName,
                relationship: 'Padre (Titular)',
                // 👇 Conectamos TODOS los datos
                phone: caseData.clientFatherPhone,
                email: caseData.clientFatherEmail,
                identification: caseData.clientFatherId,   // 👈 Agregado
                age: caseData.clientFatherAge              // 👈 Agregado
            },
            {
                condition: caseData.clientMotherName,
                id: 'virtual-mother',
                firstName: caseData.clientMotherName,
                relationship: 'Madre (Titular)',
                // 👇 Conectamos TODOS los datos
                phone: caseData.clientMotherPhone,
                email: caseData.clientMotherEmail,
                identification: caseData.clientMotherId,   // 👈 Agregado
                age: caseData.clientMotherAge              // 👈 Agregado
            }
        ];

        // Generamos la lista de virtuales
        const virtualList = virtualConfigs
            .filter(cfg => cfg.condition) // Solo si existe el nombre
            .map(cfg => ({
                id: cfg.id,
                firstName: cfg.firstName,
                lastName: '',
                relationship: cfg.relationship,

                // 👇 Aquí asignamos las nuevas variables o '---' si no existen
                identification: cfg.identification || '---',
                age: cfg.age || '---',

                phone: cfg.phone || '---',
                email: cfg.email || '---',
                isVirtual: true
            }));

        const dbRelatives = Array.isArray(relatives) ? relatives : [];

        // Retornamos la fusión
        return [...virtualList, ...dbRelatives];
    }, [caseData, relatives]);

    // 2. Manejadores de Eventos
    const handleEditClick = (relative: any) => {
        if (relative.isVirtual) {
            alert("Los datos del titular (Padre/Madre principal) se editan en la pestaña 'Datos Titular'.");
            return;
        }
        setEditingRelative(relative);
        setIsModalOpen(true);
    };

    const handleSaveRelative = async (formData: any) => {
        try {
            setMsg(null);
            if (!caseData.id) return;

            // Helper para limpiar datos antes de enviar
            const cleanEmpty = (obj: any) => {
                const cleaned: Record<string, any> = {};
                Object.keys(obj).forEach(key => {
                    let value = obj[key];
                    if (typeof value === 'string') {
                        value = value.trim();
                    }
                    if (value !== null && value !== undefined && value !== '') {
                        cleaned[key] = value;
                    }
                });
                return cleaned;
            };

            const cleanedData = cleanEmpty(formData);

            if (editingRelative) {
                await api.patch(`/cases/${caseData.id}/relatives/${editingRelative.id}`, cleanedData);
                setMsg({ type: 'success', text: 'Familiar actualizado correctamente' });
            } else {
                await api.post(`/cases/${caseData.id}/relatives`, cleanedData);
                setMsg({ type: 'success', text: 'Familiar agregado correctamente' });
            }

            handleCloseModal();
            await onUpdate();
        } catch (error: any) {
            console.error("Error guardando:", error);
            const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            setMsg({ type: 'error', text: `Error al guardar: ${errorDetails}` });
        }
    };

    const handleDelete = async (id: string, isVirtual?: boolean) => {
        if (isVirtual) {
            alert("Este familiar viene de la pestaña 'Datos Titular'. Edítelo allí si es necesario.");
            return;
        }
        if (!window.confirm("¿Estás seguro de que deseas eliminar este familiar?")) return;

        try {
            await api.delete(`/cases/${caseData.id}/relatives/${id}`);
            setMsg({ type: 'success', text: 'Familiar eliminado.' });
            await onUpdate();
        } catch (error) {
            console.error("Error eliminando:", error);
            setMsg({ type: 'error', text: 'No se pudo eliminar.' });
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRelative(null);
    };

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedRelativeId, setSelectedRelativeId] = useState<string | null>(null);
    const openMenu = Boolean(anchorEl);

    // --- LÓGICA DE GENERACIÓN DE DOCUMENTOS ---
    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, relativeId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedRelativeId(relativeId);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedRelativeId(null);
    };

    const handleGenerate = async (templateType: string) => {
        if (!selectedRelativeId || !caseData.id) return;

        try {
            setMsg({ type: 'success', text: 'Generando documento... Espere.' });
            handleCloseMenu();

            // Enviamos relativeId en el body para que el backend sepa de quién rellenar datos
            await api.post(`/documents/generate/${caseData.id}/${templateType}`, {
                relativeId: selectedRelativeId
            });

            setMsg({ type: 'success', text: 'Documento generado correctamente. Revise la pestaña Documentos.' });
            await onUpdate();
        } catch (error: any) {
            console.error(error);
            const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            setMsg({ type: 'error', text: `Falló: ${errorDetails}` });
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" mb={2} alignItems="center">
                <Typography variant="h6" fontWeight="bold">Grupo Familiar</Typography>
                <Button
                    startIcon={<Add />}
                    variant="contained"
                    onClick={() => setIsModalOpen(true)}
                    size="small"
                >
                    Agregar Familiar
                </Button>
            </Box>

            {msg && <Alert severity={msg.type} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

            <TableContainer component={Paper} variant="outlined" sx={{ border: 'none' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#f8fafc' }}>
                            <TableCell><strong>Nombre Completo</strong></TableCell>
                            <TableCell><strong>Parentesco</strong></TableCell>
                            <TableCell><strong>Identificación</strong></TableCell>
                            <TableCell><strong>Teléfono</strong></TableCell>
                            <TableCell><strong>Correo</strong></TableCell>
                            <TableCell><strong>Edad</strong></TableCell>
                            <TableCell align="right"><strong>Acciones</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    No hay familiares registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            displayList.map((rel) => (
                                <TableRow key={rel.id} hover>
                                    <TableCell>
                                        {rel.firstName} {rel.lastName}
                                        {rel.isVirtual && (
                                            <Chip label="Titular" size="small" color="primary" variant="outlined" sx={{ ml: 1, height: 20, fontSize: '0.6rem' }} />
                                        )}
                                    </TableCell>
                                    <TableCell>{rel.relationship}</TableCell>
                                    <TableCell>{rel.identification || '---'}</TableCell>
                                    <TableCell>{rel.phone || '---'}</TableCell>
                                    <TableCell>{rel.email || '---'}</TableCell>
                                    <TableCell>{rel.age || '---'}</TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>

                                            {/* BOTÓN GENERAR DOCUMENTOS */}
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="info"
                                                onClick={(e) => handleOpenMenu(e, rel.id)}
                                                sx={{ textTransform: 'none', py: 0 }}
                                            >
                                                Generar Doc
                                            </Button>

                                            <Tooltip title={rel.isVirtual ? "Editar en Datos Titular" : "Editar"}>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleEditClick(rel)}
                                                        disabled={!!rel.isVirtual}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>

                                            <Tooltip title={rel.isVirtual ? "No se puede eliminar aquí" : "Eliminar"}>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        color={rel.isVirtual ? "default" : "error"}
                                                        onClick={() => handleDelete(rel.id, rel.isVirtual)}
                                                    >
                                                        {rel.isVirtual ? <Star fontSize="small" color="action" /> : <Delete />}
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MENU DE GENERACIÓN */}
            <Menu
                id="generation-menu"
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleCloseMenu}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={() => handleGenerate('PODER')}>
                    <ListItemIcon><Gavel fontSize="small" /></ListItemIcon>
                    <ListItemText>Poder de Representación</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleGenerate('CONTRATO')}>
                    <ListItemIcon><Description fontSize="small" /></ListItemIcon>
                    <ListItemText>Contrato de Mandato</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleGenerate('CARTA')}>
                    <ListItemIcon><Email fontSize="small" /></ListItemIcon>
                    <ListItemText>Carta de Presentación</ListItemText>
                </MenuItem>
            </Menu>

            <AddRelativeModal
                open={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleSaveRelative}
                initialData={editingRelative}
            />
        </Box>
    );
};
