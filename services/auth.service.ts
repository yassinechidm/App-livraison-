import { supabase } from '@/lib/supabase';
import { SignUpCredentials, SignInCredentials } from '@/types/auth.types';
import { UserRole, ADMIN_EMAILS } from '@/types/user.types';

// Mock session for demo mode when Supabase is not yet configured
let currentSession: any = null;

type AuthListener = (session: any) => void;
const listeners: Set<AuthListener> = new Set();

function notifyListeners(session: any) {
  currentSession = session;
  listeners.forEach((listener) => {
    try {
      listener(session);
    } catch {
      // ignore listener errors
    }
  });
}

export const authService = {
  async signUp({ email, password }: SignUpCredentials) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        notifyListeners(data.session);
      }

      return data;
    } catch {
      // Fallback in demo mode
      const demoSession = {
        access_token: 'mock-token',
        user: { id: 'mock-user-1', email },
      };
      notifyListeners(demoSession);
      return {
        user: demoSession.user as any,
        session: demoSession as any,
      };
    }
  },

  async signIn({ email, password }: SignInCredentials) {
    // Admin demo shortcut
    if (email.toLowerCase() === 'admin@quicklivraison.ma' || (email.toLowerCase() === 'admin' && password === '123456')) {
      const demoSession = {
        access_token: 'mock-token-admin',
        user: { id: 'admin-user-1', email: 'admin@quicklivraison.ma' },
      };
      notifyListeners(demoSession);
      return {
        user: demoSession.user,
        session: demoSession,
      };
    }

    // Client demo shortcut
    if (email.toLowerCase() === 'client@quicklivraison.ma' || email.toLowerCase() === 'demo@quicklivraison.ma' || (email.toLowerCase() === 'client' && password === '123456')) {
      const demoSession = {
        access_token: 'mock-token-client',
        user: { id: 'client-user-1', email: 'client@quicklivraison.ma' },
      };
      notifyListeners(demoSession);
      return {
        user: demoSession.user,
        session: demoSession,
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        notifyListeners(data.session);
      }

      return data;
    } catch (err: any) {
      // Fallback demo for general client login
      const isExplicitAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
      const demoSession = {
        access_token: isExplicitAdmin ? 'mock-token-admin' : 'mock-token-client',
        user: { id: isExplicitAdmin ? 'admin-user-1' : 'client-user-1', email: email.trim() },
      };
      notifyListeners(demoSession);
      return {
        user: demoSession.user,
        session: demoSession,
      };
    }
  },

  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    notifyListeners(null);
  },

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw new Error(error.message);
    } catch {
      return;
    }
  },

  async getSession() {
    if (currentSession) {
      return currentSession;
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) return currentSession;
      currentSession = data.session;
      return currentSession;
    } catch {
      return currentSession;
    }
  },

  onAuthStateChange(callback: AuthListener) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },

  isDemoMode() {
    return !!currentSession && currentSession.access_token === 'mock-token';
  },

  getUserRole(): UserRole {
    if (!currentSession) return 'client';
    const email = currentSession.user?.email || '';
    return ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'client';
  },
};
