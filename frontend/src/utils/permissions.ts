/**
 * UTILIDAD: Permisos
 * Centraliza mapeo y normalización de permisos (evita duplicación en Login, MainLayout y ProtectedRoute).
 */
export type UserPermissions = {
  canManageTimes: boolean;
  canEditSurveys: boolean;
  canViewGlobalStats: boolean;
  canManageUsers: boolean;
};

export const DEFAULT_PERMISSIONS: UserPermissions = {
  canManageTimes: false,
  canEditSurveys: false,
  canViewGlobalStats: false,
  canManageUsers: false,
};

export const PERMISSION_KEY_MAP: Record<string, keyof UserPermissions> = {
  MANAGE_TIME: 'canManageTimes',
  MANAGE_SURVEY: 'canEditSurveys',
  VIEW_ADMIN_STATS: 'canViewGlobalStats',
  MANAGE_USERS: 'canManageUsers',
};

export const normalizePermissions = (rawPermissions: unknown, role: string): UserPermissions => {
  if (role === 'ADMINISTRADOR') {
    return { canManageTimes: true, canEditSurveys: true, canViewGlobalStats: true, canManageUsers: true };
  }
  const normalized = { ...DEFAULT_PERMISSIONS };
  if (Array.isArray(rawPermissions)) {
    rawPermissions.forEach((code) => {
      const key = PERMISSION_KEY_MAP[code as string];
      if (key) normalized[key] = true;
    });
  } else if (rawPermissions && typeof rawPermissions === 'object') {
    (Object.keys(normalized) as Array<keyof UserPermissions>).forEach((key) => {
      if ((rawPermissions as Record<string, boolean>)[key]) normalized[key] = true;
    });
  }
  return normalized;
};
