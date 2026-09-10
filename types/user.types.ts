export type UserRole = "client" | "delivery" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  phone?: string;
}
