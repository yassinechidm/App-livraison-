import { supabase } from "@/lib/supabase";
import { SignInCredentials, SignUpCredentials } from "@/types/auth.types";
import { UserRole } from "@/types/user.types";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName?.trim() || "",
          phone: phone?.trim() || "",
          city: city?.trim() || "",
          role: "client",
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.session) {
      currentSession = data.session;
      if (data.user) {
        await this.fetchAndCacheRole(data.user.id);
      }
      notifyListeners(data.session);
    }

    return data;
  },

  async signIn({ email, password }: SignInCredentials) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.session) {
      currentSession = data.session;
      if (data.user) {
        await this.fetchAndCacheRole(data.user.id);
      }
      notifyListeners(data.session);
    }

    return data;
  },

  async signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore signOut errors
    }
    cachedRole = null;
    currentSession = null;
    try {
      const { orderService } = require("./order.service");
      orderService.clearMemoryStore();
    } catch {}
    notifyListeners(null);
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) throw new Error(error.message);
  },

  async fetchAndCacheRole(userId: string): Promise<UserRole> {
    try {
      const { data, error } = await (supabase.from("profiles") as any)
        .select("role")
        .eq("id", userId)
        .single();

      if (!error && data?.role) {
        const resolved = (data.role as string).toLowerCase() as UserRole;
        cachedRole = resolved;
        return resolved;
      }
    } catch {
      // ignore query errors
    }
    cachedRole = "client";
    return "client";
  },

  async getSession() {
    if (currentSession) {
      return currentSession;
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) return null;
      currentSession = data.session;
      if (currentSession?.user) {
        await this.fetchAndCacheRole(currentSession.user.id);
      }
      return currentSession;
    } catch {
      return null;
    }
  },

  onAuthStateChange(callback: AuthListener) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },

  isDemoMode() {
    return false;
  },

  getUserRole(): UserRole {
    if (cachedRole) return cachedRole;
    return "client";
  },

  async verifyOtp(
    emailOrPhone: string,
    token: string,
    type: "signup" | "email" | "sms" = "signup",
  ) {
    const isEmail = emailOrPhone.includes("@");
    const { data, error } = await supabase.auth.verifyOtp(
      isEmail
        ? {
            email: emailOrPhone.trim(),
            token: token.trim(),
            type: type as any,
          }
        : { phone: emailOrPhone.trim(), token: token.trim(), type: "sms" },
    );
    if (error) throw new Error(error.message);
    if (data.session) {
      currentSession = data.session;
      if (data.user) {
        await this.fetchAndCacheRole(data.user.id);
      }
      notifyListeners(data.session);
    }
    return data;
  },

  async signInWithPhone(phone: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone.trim(),
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async signInWithWhatsApp(phone: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone.trim(),
    });
    if (error) throw new Error(error.message);
    return data;
  },

  async signInWithSocial(provider: "google" | "apple") {
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
            currentSession = sessionData.session;
            if (sessionData.user) {
              await this.fetchAndCacheRole(sessionData.user.id);
            }
            notifyListeners(sessionData.session);
            return sessionData;
          }
        }
      }
    }
    return data;
  },
};
