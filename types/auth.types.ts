import { Session, User } from "@supabase/supabase-js";
import { UserRole } from "./user.types";

export type AuthStatus =
  | "INITIALIZING"
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "AUTH_ERROR";

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  isLoading: boolean;
  isInitialized: boolean;
  error?: string | null;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  city?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface WhatsAppOtpRequest {
  phone: string;
}

export interface WhatsAppOtpVerify {
  phone: string;
  otp: string;
}

export interface AuthError {
  message: string;
  status?: number;
}
