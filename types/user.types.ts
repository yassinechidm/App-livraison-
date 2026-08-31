export type UserRole = 'CLIENT' | 'ADMIN' | 'client' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
}

// Admin emails — only users with these emails get admin access
export const ADMIN_EMAILS = [
  'admin@quicklivraison.ma',
];
