/**
 * Auth types for the application
 */

// Define all possible user roles
export type UserRole = 'admin' | 'manager' | 'technician' | 'user' | 'guest' | 'rescuer';

// Define permissions by role
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'view:all',
    'create:all',
    'edit:all',
    'delete:all',
    'manage:users',
    'manage:buildings',
    'manage:incidents',
    'view:analytics',
    'access:all-buildings',
    'create:evacuation-plans',
    'manage:system',
  ],
  manager: [
    'view:all',
    'create:incidents',
    'edit:incidents',
    'assign:incidents',
    'view:analytics',
    'manage:incidents',
    'access:assigned-buildings',
    'create:evacuation-plans',
  ],
  technician: [
    'view:assigned',
    'edit:assigned-incidents',
    'update:incident-status',
    'create:incidents',
    'access:assigned-buildings',
  ],
  user: [
    'view:own',
    'create:incidents',
    'view:public',
    'access:own-building',
  ],
  guest: [
    'view:public',
    'create:incidents',
    'access:restricted',
  ],
  rescuer: [
    'view:all',
    'create:incidents',
    'edit:incidents',
    'access:all-buildings',
    'view:victim-locations',
    'update:rescue-status',
  ],
};

// Auth state interface
export interface AuthState {
  user: AuthUser | null;
  initialized: boolean;
  loading: boolean;
  error: string | null;
}

// Auth user interface
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  providerId: string;
  role: UserRole;
  isGuest: boolean;
  metadata: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data interface
export interface RegistrationData {
  email: string;
  password: string;
  displayName: string;
}

// Auth provider types
export type AuthProvider = 'email' | 'google' | 'university-sso' | 'guest-qr';

// Guest data interface
export interface GuestData {
  displayName: string;
  expiration: string | Date;
  buildingAccess: string[];
  createdBy: string | null;
}

// Token payload interface
export interface TokenPayload {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  role?: UserRole;
  exp: number;
  iat: number;
} 