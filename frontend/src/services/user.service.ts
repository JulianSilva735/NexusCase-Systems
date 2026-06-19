import { api } from '../api/axios';
import type { User, CreateUserPayload, UserPermissions } from '../types/user';

/**
 * INTERFACES DEL BACKEND (DTOs)
 * Definimos cómo llegan los datos del servidor para no contaminar los tipos del Frontend.
 */
interface BackendUser {
    id: string;
    fullName: string;
    email: string;
    roles: ('ADMINISTRADOR' | 'SUPERVISOR' | 'OPERADOR')[]; // Array de roles
    isActive: boolean;
    permissions: string[]; // ['MANAGE_TIME', 'MANAGE_SURVEY', ...]
    lastLogin?: string;
    createdAt?: string;
}

/**
 * ADAPTADORES (Mappers)
 */
const PERMISSION_MAP: Record<string, keyof UserPermissions> = {
    'MANAGE_TIME': 'canManageTimes',
    'MANAGE_SURVEY': 'canEditSurveys',
    'VIEW_ADMIN_STATS': 'canViewGlobalStats',
    'MANAGE_USERS': 'canManageUsers'
};

/**
 * Convierte el usuario del Backend (Array de strings) al Frontend (Objeto de booleans)
 */
const mapBackendUserToFrontend = (backendUser: BackendUser): User => {
    const permissions: UserPermissions = {
        canManageTimes: false,
        canEditSurveys: false,
        canViewGlobalStats: false,
        canManageUsers: false
    };

    if (backendUser.permissions) {
        backendUser.permissions.forEach(p => {
            const frontendKey = PERMISSION_MAP[p];
            if (frontendKey) {
                permissions[frontendKey] = true;
            }
        });
    }

    // Extraer el primer rol del array (el backend devuelve roles: ["ADMINISTRADOR"])
    const role = backendUser.roles?.[0] || 'OPERADOR';

    return {
        id: backendUser.id,
        fullName: backendUser.fullName,
        email: backendUser.email,
        role: role,
        isActive: backendUser.isActive,
        permissions: permissions,
        lastLogin: backendUser.lastLogin
    };
};

/**
 * Convierte el payload del Frontend al formato que espera el Backend
 */
const mapFrontendToBackendPayload = (user: CreateUserPayload | Partial<User>) => {
    const payload: any = { ...user };

    // Si viene role (string), lo convertimos a roles (array)
    if (user.role) {
        payload.roles = [user.role];
        delete payload.role;
    }

    // Si viene permissions, lo enviamos como frontendPermissions
    if (user.permissions) {
        payload.frontendPermissions = user.permissions;
        delete payload.permissions;
    }

    return payload;
};

export const UserService = {
    getAll: async (): Promise<User[]> => {
        try {
            const { data } = await api.get<BackendUser[]>('/users');
            return data.map(mapBackendUserToFrontend);
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },

    create: async (user: CreateUserPayload): Promise<User> => {
        try {
            const backendPayload = mapFrontendToBackendPayload(user);
            const { data } = await api.post<BackendUser>('/users', backendPayload);
            return mapBackendUserToFrontend(data);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    update: async (id: string, user: Partial<User>): Promise<User> => {
        try {
            const backendPayload = mapFrontendToBackendPayload(user);
            const { data } = await api.patch<BackendUser>(`/users/${id}`, backendPayload);
            return mapBackendUserToFrontend(data);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            await api.delete(`/users/${id}`);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
};


