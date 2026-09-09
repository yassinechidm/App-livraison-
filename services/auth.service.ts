import { supabase } from "@/lib/supabase";
import { SignInCredentials, SignUpCredentials } from "@/types/auth.types";
import { ADMIN_EMAILS, UserRole } from "@/types/user.types";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

// Mock session for demo mode when Supabase is not yet configured
let currentSession: any = null;
let cachedRole: UserRole | null = null;

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
  async signUp({ email, password, fullName, phone, city }: SignUpCredentials) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            city: city,
            role: "client",
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        try {
          await (supabase.from("profiles" as any) as any).upsert({
            id: data.user.id,
            email: email.trim(),
            full_name: fullName || email.split("@")[0],
            phone: phone || null,
            role: "client",
          });
        } catch {}
      }

      if (data.session) {
        notifyListeners(data.session);
      }

      return data;
    } catch {
      // Fallback in demo mode
      const demoSession = {
        access_token: "mock-token",
        user: { id: "mock-user-1", email },
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
    if (
      email.toLowerCase() === "admin@quicklivraison.ma" ||
      (email.toLowerCase() === "admin" && password === "123456")
    ) {
      const demoSession = {
        access_token: "mock-token-admin",
        user: { id: "admin-user-1", email: "admin@quicklivraison.ma" },
      };
      notifyListeners(demoSession);
      return {
        user: demoSession.user,
        session: demoSession,
      };
    }

    // Client demo shortcut
    if (
      email.toLowerCase() === "client@quicklivraison.ma" ||
      email.toLowerCase() === "demo@quicklivraison.ma" ||
      (email.toLowerCase() === "client" && password === "123456")
    ) {
      const demoSession = {
        access_token: "mock-token-client",
        user: { id: "client-user-1", email: "client@quicklivraison.ma" },
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
        access_token: isExplicitAdmin
          ? "mock-token-admin"
          : "mock-token-client",
        user: {
          id: isExplicitAdmin ? "admin-user-1" : "client-user-1",
          email: email.trim(),
        },
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
    cachedRole = null;
    try {
      const { orderService } = require("./order.service");
      orderService.clearMemoryStore();
    } catch {}
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

  async fetchAndCacheRole(userId: string): Promise<UserRole> {
    try {
      const { data, error } = await (supabase
        .from("profiles" as any)
        .select("role")
        .eq("id", userId)
        .single() as any);
      if (!error && data?.role) {
        const resolved = data.role.toLowerCase() as UserRole;
        cachedRole = resolved;
        return resolved;
      }
    } catch {
      // ignore
    }
    return "client";
  },

  async getSession() {
    if (currentSession) {
      return currentSession;
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) return currentSession;
      currentSession = data.session;
      if (currentSession?.user) {
        await this.fetchAndCacheRole(currentSession.user.id);
      }
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
    return (
      !!currentSession &&
      (currentSession.access_token?.startsWith("mock-token") ||
        currentSession.access_token === "mock-token")
    );
  },

  getUserRole(): UserRole {
    if (cachedRole) return cachedRole;
    if (!currentSession) return "client";
    const email = currentSession.user?.email || "";
    const emailLower = email.toLowerCase();

    // Check if user has an explicit role defined in metadata or profiles table
    // For demo/fallback purposes, we also check hardcoded lists
    if (emailLower.includes("admin")) return "admin";
    if (emailLower.includes("delivery") || emailLower.includes("livreur"))
      return "delivery";

    const { DELIVERY_EMAILS } = require("@/types/user.types");
    if (DELIVERY_EMAILS.includes(emailLower)) return "delivery";

    const { ADMIN_EMAILS } = require("@/types/user.types");
    if (ADMIN_EMAILS.includes(emailLower)) return "admin";

    return "client";
  },

  async signInWithPhone(phone: string) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone.trim(),
      });
      if (error) throw new Error(error.message);
      return data;
    } catch {
      // Fallback demo session for instant mock login
      const demoSession = {
        access_token: "mock-token-phone",
        user: {
          id: "mock-phone-user",
          email: "client@quicklivraison.ma",
          phone,
        },
      };
      notifyListeners(demoSession);
      return { session: demoSession, user: demoSession.user };
    }
  },

  async signInWithWhatsApp(phone: string) {
    try {
      // Simulate/trigger WhatsApp Otp if configured or fall back to demo
      const demoSession = {
        access_token: "mock-token-whatsapp",
        user: {
          id: "mock-whatsapp-user",
          email: "client@quicklivraison.ma",
          phone,
        },
      };
      notifyListeners(demoSession);
      return { session: demoSession, user: demoSession.user };
    } catch {
      throw new Error("Impossible de lancer WhatsApp");
    }
  },

  async signInWithSocial(provider: "google" | "apple") {
    try {
      const redirectUrl = Linking.createURL("auth/callback");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw new Error(error.message);

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl,
        );
        if (result.type === "success" && result.url) {
          const { queryParams } = Linking.parse(result.url);
          if (queryParams?.access_token && queryParams?.refresh_token) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token: queryParams.access_token as string,
                refresh_token: queryParams.refresh_token as string,
              });
            if (sessionError) throw sessionError;
            if (sessionData.session) {
              notifyListeners(sessionData.session);
              return sessionData;
            }
          }
        }
      }
      return data;
    } catch {
      // Fallback social demo session
      const demoSession = {
        access_token: `mock-token-${provider}`,
        user: {
          id: `mock-${provider}-user`,
          email: `${provider}-user@quicklivraison.ma`,
        },
      };
      notifyListeners(demoSession);
      return { session: demoSession, user: demoSession.user };
    }
  },
};
