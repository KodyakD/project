// User roles in the application
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  FIRE_FIGHTER: 'fire_fighter',
  TECHNICIAN: 'technician',
  GUEST: 'guest',
  RESCUER: 'rescuer',
  USER: 'user',
};

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES] | 'student' | 'staff' | 'technical_expert' | 'admin' | 'guest';

export interface RolePermission {
  canViewIncidents: boolean;
  canCreateIncidents: boolean;
  canEditIncidents: boolean;
  canDeleteIncidents: boolean;
  canViewMaps: boolean;
  canEditMaps: boolean;
  canViewDevices: boolean;
  canConfigureDevices: boolean;
  canAddUsers: boolean;
  canEditUsers: boolean;
}

export const ROLE_PERMISSIONS: Record<string, RolePermission> = {
  [USER_ROLES.ADMIN]: {
    canViewIncidents: true,
    canCreateIncidents: true,
    canEditIncidents: true,
    canDeleteIncidents: true,
    canViewMaps: true,
    canEditMaps: true,
    canViewDevices: true,
    canConfigureDevices: true,
    canAddUsers: true,
    canEditUsers: true,
  },
  [USER_ROLES.TECHNICAL_EXPERT]: {
    canViewIncidents: true,
    canCreateIncidents: true,
    canEditIncidents: true,
    canDeleteIncidents: false,
    canViewMaps: true,
    canEditMaps: false,
    canViewDevices: true,
    canConfigureDevices: true,
    canAddUsers: false,
    canEditUsers: false,
  },
  'technician': {
    canViewIncidents: true,
    canCreateIncidents: true,
    canEditIncidents: true,
    canDeleteIncidents: false,
    canViewMaps: true,
    canEditMaps: false,
    canViewDevices: true,
    canConfigureDevices: true,
    canAddUsers: false,
    canEditUsers: false,
  },
  'firefighter': {
    canViewIncidents: true,
    canCreateIncidents: true,
    canEditIncidents: false,
    canDeleteIncidents: false,
    canViewMaps: true,
    canEditMaps: false,
    canViewDevices: true,
    canConfigureDevices: false,
    canAddUsers: false,
    canEditUsers: false,
  },
  [USER_ROLES.STAFF]: {
    canViewIncidents: true,
    canCreateIncidents: true,
    canEditIncidents: true,
    canDeleteIncidents: false,
    canViewMaps: true,
    canEditMaps: false,
    canViewDevices: true,
    canConfigureDevices: false,
    canAddUsers: false,
    canEditUsers: false,
  },
  [USER_ROLES.STUDENT]: {
    canViewIncidents: true,
    canCreateIncidents: true,
    canEditIncidents: false,
    canDeleteIncidents: false,
    canViewMaps: true,
    canEditMaps: false,
    canViewDevices: false,
    canConfigureDevices: false,
    canAddUsers: false,
    canEditUsers: false,
  },
  [USER_ROLES.GUEST]: {
    canViewIncidents: true,
    canCreateIncidents: false,
    canEditIncidents: false,
    canDeleteIncidents: false,
    canViewMaps: true,
    canEditMaps: false,
    canViewDevices: true,
    canConfigureDevices: false,
    canAddUsers: false,
    canEditUsers: false,
  },
};

export const getRolePermissions = (role: UserRole): RolePermission => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[USER_ROLES.GUEST];
};