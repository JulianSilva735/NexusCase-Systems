import React, { useState } from 'react';
import {
    Card, CardContent, Typography, TextField, Button, Alert, MenuItem, Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save } from '@mui/icons-material';
import { api } from '../../api/axios';
import type { Case } from '../../types/case';

interface Props {
    caseData: Case;
    onUpdate?: () => void | Promise<void>;
}

export const GeneralDataTab = ({ caseData, onUpdate }: Props) => {

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Estado inicial con TODOS los campos (incluyendo ID y Edad de padres)
    const [formData, setFormData] = useState({
        clientName: caseData.clientName || '',
        clientIdNumber: caseData.clientIdNumber || '',
        clientPhone: caseData.clientPhone || '',
        clientEmail: caseData.clientEmail || '',

        clientAddress: caseData.clientAddress || '',
        clientGender: caseData.clientGender || '',
        clientDob: caseData.clientDob || '',
        clientPob: caseData.clientPob || '',
        clientExpeditionPlace: caseData.clientExpeditionPlace || '',

        // --- PADRE ---
        clientFatherName: caseData.clientFatherName || '',
        clientFatherId: caseData.clientFatherId || '',   // 👈 Nuevo
        clientFatherAge: caseData.clientFatherAge || '', // 👈 Nuevo
        clientFatherPhone: caseData.clientFatherPhone || '',
        clientFatherEmail: caseData.clientFatherEmail || '',

        // --- MADRE ---
        clientMotherName: caseData.clientMotherName || '',
        clientMotherId: caseData.clientMotherId || '',   // 👈 Nuevo
        clientMotherAge: caseData.clientMotherAge || '', // 👈 Nuevo
        clientMotherPhone: caseData.clientMotherPhone || '',
        clientMotherEmail: caseData.clientMotherEmail || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        setLoading(true);
        setMsg(null);
        try {
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

            await api.patch(`/cases/${caseData.id}`, cleanedData);

            setMsg({ type: 'success', text: 'Información actualizada correctamente.' });

            if (onUpdate) await onUpdate();

        } catch (error: any) {
            console.error(error);
            const errorDetails = error.response?.data ? JSON.stringify(error.response.data) : error.message;
            setMsg({ type: 'error', text: `Error al guardar: ${errorDetails}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card variant="outlined" sx={{ mt: 2, border: 'none', boxShadow: 'none' }}>
            <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Datos del Cliente Titular
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Esta información alimenta la Ficha Técnica del expediente.
                </Typography>

                {msg && <Alert severity={msg.type} sx={{ mb: 3 }}>{msg.text}</Alert>}

                <Grid container spacing={3}>

                    {/* --- SECCIÓN 1: CONTACTO --- */}
                    <Grid xs={12}>
                        <Divider textAlign="left"><Typography variant="caption" fontWeight="bold">INFORMACIÓN DE CONTACTO</Typography></Divider>
                    </Grid>

                    <Grid xs={12} md={6}>
                        <TextField fullWidth label="Nombre Completo" name="clientName" value={formData.clientName} onChange={handleChange} />
                    </Grid>
                    <Grid xs={12} md={6}>
                        <TextField fullWidth label="Cédula / ID" value={formData.clientIdNumber} disabled variant="filled" />
                    </Grid>
                    <Grid xs={12} md={6}>
                        <TextField fullWidth label="Teléfono / Celular" name="clientPhone" value={formData.clientPhone} onChange={handleChange} />
                    </Grid>
                    <Grid xs={12} md={6}>
                        <TextField fullWidth label="Correo Electrónico" name="clientEmail" value={formData.clientEmail} onChange={handleChange} />
                    </Grid>
                    <Grid xs={12}>
                        <TextField fullWidth label="Dirección de Residencia" name="clientAddress" value={formData.clientAddress} onChange={handleChange} placeholder="Ej: Calle 123 # 45-67" />
                    </Grid>

                    {/* --- SECCIÓN 2: DATOS BIOGRÁFICOS --- */}
                    <Grid xs={12} sx={{ mt: 2 }}>
                        <Divider textAlign="left"><Typography variant="caption" fontWeight="bold">DATOS BIOGRÁFICOS</Typography></Divider>
                    </Grid>

                    <Grid xs={12} md={3}>
                        <TextField
                            select
                            fullWidth
                            label="Género"
                            name="clientGender"
                            value={formData.clientGender}
                            onChange={handleChange}
                        >
                            <MenuItem value="Masculino">Masculino</MenuItem>
                            <MenuItem value="Femenino">Femenino</MenuItem>
                            <MenuItem value="Otro">Otro</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid xs={12} md={3}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Fecha Nacimiento"
                            name="clientDob"
                            value={formData.clientDob}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid xs={12} md={3}>
                        <TextField fullWidth label="Lugar Nacimiento" name="clientPob" value={formData.clientPob} onChange={handleChange} />
                    </Grid>
                    <Grid xs={12} md={3}>
                        <TextField fullWidth label="Lugar Expedición ID" name="clientExpeditionPlace" value={formData.clientExpeditionPlace} onChange={handleChange} />
                    </Grid>

                    {/* --- SECCIÓN 3: FILIACIÓN (PADRES) --- */}
                    <Grid xs={12} sx={{ mt: 2 }}>
                        <Divider textAlign="left"><Typography variant="caption" fontWeight="bold">FILIACIÓN (PADRES)</Typography></Divider>
                    </Grid>

                    {/* === PADRE === */}
                    <Grid xs={12}><Typography variant="subtitle2" color="primary">Información del Padre</Typography></Grid>

                    <Grid xs={12} md={6}>
                        <TextField fullWidth label="Nombre Completo (Padre)" name="clientFatherName" value={formData.clientFatherName} onChange={handleChange} />
                    </Grid>
                    <Grid xs={6} md={3}>
                        <TextField fullWidth label="No. Identificación" name="clientFatherId" value={formData.clientFatherId} onChange={handleChange} />
                    </Grid>
                    <Grid xs={6} md={3}>
                        <TextField fullWidth label="Edad" name="clientFatherAge" value={formData.clientFatherAge} onChange={handleChange} type="number" />
                    </Grid>
                    <Grid xs={12} md={6}>
                        <TextField fullWidth label="Teléfono / Celular" name="clientFatherPhone" value={formData.clientFatherPhone} onChange={handleChange} />
                    </Grid>
                    <Grid xs={12} md={6}>
                        <TextField fullWidth label="Correo Electrónico" name="clientFatherEmail" value={formData.clientFatherEmail} onChange={handleChange} />
                    </Grid>

                    {/* === MADRE === */}
                    <Grid xs={12} sx={{ mt: 1 }}><Typography variant="subtitle2" color="primary">Información de la Madre</Typography></Grid>

                    <Grid xs={12} md={6}>
                        <TextField fullWidth label="Nombre Completo (Madre)" name="clientMotherName" value={formData.clientMotherName} onChange={handleChange} />
                    </Grid>
                    <Grid xs={6} md={3}>
                        <TextField fullWidth label="No. Identificación" name="clientMotherId" value={formData.clientMotherId} onChange={handleChange} />
                    </Grid>
                    <Grid xs={6} md={3}>
                        <TextField fullWidth label="Edad" name="clientMotherAge" value={formData.clientMotherAge} onChange={handleChange} type="number" />
                    </Grid>
                    <Grid xs={12} md={6}>
                        <TextField fullWidth label="Teléfono / Celular" name="clientMotherPhone" value={formData.clientMotherPhone} onChange={handleChange} />
                    </Grid>
                    <Grid xs={12} md={6}>
                        <TextField fullWidth label="Correo Electrónico" name="clientMotherEmail" value={formData.clientMotherEmail} onChange={handleChange} />
                    </Grid>

                    {/* BOTÓN GUARDAR */}
                    <Grid xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                        <Button
                            variant="contained"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={loading}
                            size="large"
                        >
                            {loading ? 'Guardando...' : 'Guardar Datos del Titular'}
                        </Button>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};
