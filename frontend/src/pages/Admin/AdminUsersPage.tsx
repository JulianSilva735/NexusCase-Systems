import { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Chip, Dialog, DialogTitle,
    DialogContent, DialogActions, Button, TextField, FormControl,
    InputLabel, Select, MenuItem, Grid, Switch, FormControlLabel,
    InputAdornment, LinearProgress
} from '@mui/material';
import {
    Edit, Add, Search, VerifiedUser, Security, Delete
} from '@mui/icons-material';
import { MainLayout } from '../../layouts/MainLayout';
import { UserService } from '../../services/user.service';
import type { User, CreateUserPayload } from '../../types/user';

export const AdminUsersPage = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [openModal, setOpenModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // Form State (Simplified local state)
    const [formData, setFormData] = useState<Partial<CreateUserPayload>>({
        fullName: '',
        email: '',
        password: '',
        role: 'OPERADOR',
        permissions: {
            canManageTimes: false,
            canEditSurveys: false,
            canViewGlobalStats: false,
            canManageUsers: false
        }
    });

    const fetchUsers = async () => {
        setLoading(true);
        const data = await UserService.getAll();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                permissions: { ...user.permissions }
            });
        } else {
            setEditingUser(null);
            setFormData({
                fullName: '',
                email: '',
                password: '',
                role: 'OPERADOR',
                permissions: {
                    canManageTimes: false,
                    canEditSurveys: false,
                    canViewGlobalStats: false,
                    canManageUsers: false
                }
            });
        }
        setOpenModal(true);
    };

    const handleSave = async () => {
        setLoading(true);
        if (editingUser) {
            await UserService.update(editingUser.id, formData);
        } else {
            await UserService.create(formData as CreateUserPayload);
        }
        setOpenModal(false);
        await fetchUsers();
        setLoading(false);
    };

    const handlePermissionChange = (key: keyof User['permissions']) => {
        if (!formData.permissions) return;
        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                [key]: !formData.permissions[key]
            }
        });
    };

    const handleDeleteClick = (user: User) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!userToDelete) return;
        setLoading(true);
        try {
            await UserService.delete(userToDelete.id);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            await fetchUsers();
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
        } finally {
            setLoading(false);
        }
    };

    // Traductores de roles
    const getRoleName = (role: string | undefined): string => {
        const roleMap: Record<string, string> = {
            'ADMINISTRADOR': 'Administrador',
            'SUPERVISOR': 'Supervisor',
            'OPERADOR': 'Operador'
        };
        return roleMap[role || ''] || role || 'Sin rol';
    };

    // Filter Logic
    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MainLayout>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Gestión de Usuarios</Typography>
                    <Typography variant="body1" color="text.secondary">Administra el acceso y permisos del personal.</Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenModal()}>
                    Nuevo Usuario
                </Button>
            </Box>

            <Paper sx={{ mb: 3, p: 2 }}>
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Buscar por nombre o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><Search color="action" /></InputAdornment>)
                    }}
                />
            </Paper>

            <TableContainer component={Paper} elevation={2}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell>Usuario</TableCell>
                            <TableCell>Rol / Cargo</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Permisos Extra</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5}><LinearProgress /></TableCell></TableRow>
                        ) : filteredUsers.map((user) => (
                            <TableRow key={user.id} hover>
                                <TableCell>
                                    <Typography variant="subtitle2" fontWeight="bold">{user.fullName}</Typography>
                                    <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={getRoleName(user.role)}
                                        size="small"
                                        color={user.role === 'ADMINISTRADOR' ? 'primary' : 'default'}
                                        variant="outlined"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.isActive ? 'Activo' : 'Inactivo'}
                                        size="small"
                                        color={user.isActive ? 'success' : 'error'}
                                        variant="filled"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {user.permissions.canManageUsers && <VerifiedUser fontSize="small" color="primary" titleAccess="Admin Usuarios" />}
                                        {user.permissions.canEditSurveys && <VerifiedUser fontSize="small" color="info" titleAccess="Editor Encuestas" />}
                                        {user.permissions.canManageTimes && <VerifiedUser fontSize="small" color="warning" titleAccess="Gestor Tiempos" />}
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    <IconButton size="small" onClick={() => handleOpenModal(user)}>
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleDeleteClick(user)}>
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* --- MODAL --- */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Security /> {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid xs={12}>
                            <TextField
                                fullWidth label="Nombre Completo"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <TextField
                                fullWidth label="Correo Electrónico"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Grid>
                        <Grid xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Rol</InputLabel>
                                <Select
                                    label="Rol"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                >
                                    <MenuItem value="ADMINISTRADOR">Administrador</MenuItem>
                                    <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                                    <MenuItem value="OPERADOR">Operador</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {!editingUser && (
                            <Grid xs={12}>
                                <TextField
                                    fullWidth
                                    label="Contraseña Temporal"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </Grid>
                        )}

                        <Grid xs={12}>
                            <Typography variant="subtitle2" sx={{ my: 2, fontWeight: 'bold', color: 'primary.main' }}>
                                Permisos Granulares
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <FormControlLabel
                                    control={<Switch checked={formData.permissions?.canManageUsers} onChange={() => handlePermissionChange('canManageUsers')} />}
                                    label="Gestión de Usuarios (Admin)"
                                />
                                <FormControlLabel
                                    control={<Switch checked={formData.permissions?.canEditSurveys} onChange={() => handlePermissionChange('canEditSurveys')} />}
                                    label="Editar y Configurar Encuestas"
                                />
                                <FormControlLabel
                                    control={<Switch checked={formData.permissions?.canManageTimes} onChange={() => handlePermissionChange('canManageTimes')} />}
                                    label="Modificar Tiempos SLA"
                                />
                                <FormControlLabel
                                    control={<Switch checked={formData.permissions?.canViewGlobalStats} onChange={() => handlePermissionChange('canViewGlobalStats')} />}
                                    label="Ver Estadísticas Globales"
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSave} disabled={!formData.fullName || !formData.email}>
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- DIALOG DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas eliminar al usuario <strong>{userToDelete?.fullName}</strong>?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Esta acción no se puede deshacer.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteConfirm}>
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
};

