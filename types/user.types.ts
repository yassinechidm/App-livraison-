export type UserRole = "client" | "delivery" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
}

// Admin emails — only users with these emails get admin access
export const ADMIN_EMAILS = ["admin@quicklivraison.ma"];

export const DELIVERY_EMAILS = [
  "delivery@quicklivraison.ma",
  "livreur@quicklivraison.ma",
];
