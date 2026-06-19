
export interface UserPermissions {
    canManageTimes: boolean;
    canEditSurveys: boolean;
    canViewGlobalStats: boolean;
    canManageUsers: boolean;
}

export interface User {
    id: string;
    fullName: string;
    email: string;
    role: 'ADMINISTRADOR' | 'SUPERVISOR' | 'OPERADOR';
    isActive: boolean;
    permissions: UserPermissions;
    lastLogin?: string;
}

export interface CreateUserPayload {
    fullName: string;
    email: string;
    password?: string; // Opcional si el backend genera pass
    role: 'ADMINISTRADOR' | 'SUPERVISOR' | 'OPERADOR';
    permissions: UserPermissions;
}
