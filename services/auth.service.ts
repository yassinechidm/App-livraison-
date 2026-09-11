import { supabase } from "@/lib/supabase";
import {
    AuthState,
    AuthStatus,
    SignInCredentials,
    SignUpCredentials,
} from "@/types/auth.types";
import { UserRole } from "@/types/user.types";
import { Session, User } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

let currentStatus: AuthStatus = "INITIALIZING";
let currentSession: Session | null = null;
let currentUser: User | null = null;
let cachedRole: UserRole | null = null;
let lastError: string | null = null;
let isInitialized = false;
let isProcessingCallback = false;

type AuthStateListener = (state: AuthState) => void;
const listeners: Set<AuthStateListener> = new Set();

function getSnapshot(): AuthState {
  return {
    status: currentStatus,
    session: currentSession,
    user: currentUser,
    role: cachedRole,
    isLoading: currentStatus === "INITIALIZING",
    isInitialized,
    error: lastError,
  };
}

function notifyListeners() {
  const snapshot = getSnapshot();
  listeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch {
      // ignore listener errors
    }
  });
}

function parseUrlParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!url) return params;

  // 1. Parse standard query params (?key=val)
  const queryIndex = url.indexOf("?");
  const hashIndex = url.indexOf("#");

  if (queryIndex !== -1) {
    const queryString =
      hashIndex !== -1 && hashIndex > queryIndex
        ? url.substring(queryIndex + 1, hashIndex)
        : url.substring(queryIndex + 1);
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  // 2. Parse hash fragment params (#key=val)
  if (hashIndex !== -1) {
    const hashString = url.substring(hashIndex + 1);
    const hashParams = new URLSearchParams(hashString);
    hashParams.forEach((val, key) => {
      params[key] = val;
    });
  }

  return params;
}

export const authService = {
  async initialize(): Promise<AuthState> {
    if (isInitialized) {
      return getSnapshot();
    }

    try {
      // 1. Set up deep link listener for OAuth callbacks (warm starts)
      Linking.addEventListener("url", (event) => {
        if (event?.url && event.url.includes("auth/callback")) {
          this.handleOAuthCallback(event.url).catch(() => {});
        }
      });

      // 2. Check initial deep link (cold starts)
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && initialUrl.includes("auth/callback")) {
        await this.handleOAuthCallback(initialUrl);
        isInitialized = true;
        return getSnapshot();
      }

      // 3. Check existing Supabase session in storage
      const { data, error } = await supabase.auth.getSession();
      if (!error && data?.session) {
        currentSession = data.session;
        currentUser = data.session.user;
        if (currentUser) {
          await this.fetchAndCacheRole(currentUser.id);
        }
        currentStatus = "AUTHENTICATED";
        lastError = null;
      } else {
        currentSession = null;
        currentUser = null;
        cachedRole = null;
        currentStatus = "UNAUTHENTICATED";
      }
    } catch (err: any) {
      currentStatus = "UNAUTHENTICATED";
      lastError = err?.message || null;
    } finally {
      isInitialized = true;
      notifyListeners();
    }

    return getSnapshot();
  },

  async handleOAuthCallback(url: string): Promise<Session | null> {
    if (isProcessingCallback) return currentSession;
    isProcessingCallback = true;

    try {
      const params = parseUrlParams(url);

      if (params.error || params.error_description) {
        throw new Error(
          params.error_description || params.error || "OAuth error",
        );
      }

      // PKCE flow (Supabase Auth default code exchange)
      if (params.code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          params.code,
        );
        if (error) throw error;
        if (data.session) {
          currentSession = data.session;
          currentUser = data.session.user;
          await this.ensureUserProfile(data.session.user);
          await this.fetchAndCacheRole(data.session.user.id);
          currentStatus = "AUTHENTICATED";
          lastError = null;
          notifyListeners();
          return data.session;
        }
      }

      // Implicit flow tokens fallback
      if (params.access_token && params.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        if (error) throw error;
        if (data.session) {
          currentSession = data.session;
          currentUser = data.session.user;
          await this.ensureUserProfile(data.session.user);
          await this.fetchAndCacheRole(data.session.user.id);
          currentStatus = "AUTHENTICATED";
          lastError = null;
          notifyListeners();
          return data.session;
        }
      }

      return null;
    } catch (err: any) {
      lastError = err?.message || "Échec de l'authentification";
      notifyListeners();
      throw err;
    } finally {
      isProcessingCallback = false;
    }
  },

  async ensureUserProfile(user: User): Promise<UserRole> {
    if (!user || !user.id) return "client";

    try {
      // 1. Try atomic database RPC first
      const { data: rpcProfile, error: rpcError } = await (supabase.rpc as any)(
        "rpc_ensure_user_profile",
      );

      if (!rpcError && rpcProfile?.role) {
        const resolved = (rpcProfile.role as string).toLowerCase() as UserRole;
        cachedRole = resolved;
        return resolved;
      }
    } catch {
      // Fallback to direct check if RPC isn't deployed yet
    }

    try {
      // 2. Fallback direct profile query & creation
      const { data: existingProfile } = await (supabase.from("profiles") as any)
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (existingProfile?.role) {
        const resolved = (
          existingProfile.role as string
        ).toLowerCase() as UserRole;
        cachedRole = resolved;
        return resolved;
      }

      // Profile does not exist, create client profile
      const email = user.email ? user.email.trim() : null;
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        (email ? email.split("@")[0] : "Client");
      const phone = user.user_metadata?.phone || user.phone || null;

      const { data: newProfile, error: insertError } = await (
        supabase.from("profiles") as any
      )
        .insert({
          id: user.id,
          email,
          full_name: fullName,
          phone,
          role: "client",
        })
        .select("role")
        .single();

      if (!insertError && newProfile?.role) {
        const resolved = (newProfile.role as string).toLowerCase() as UserRole;
        cachedRole = resolved;
        return resolved;
      }
    } catch {
      // ignore fallback error
    }

    cachedRole = "client";
    return "client";
  },

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
      currentUser = data.user;
      if (data.user) {
        await this.ensureUserProfile(data.user);
        await this.fetchAndCacheRole(data.user.id);
      }
      currentStatus = "AUTHENTICATED";
      lastError = null;
      notifyListeners();
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
      currentUser = data.user;
      if (data.user) {
        await this.ensureUserProfile(data.user);
        await this.fetchAndCacheRole(data.user.id);
      }
      currentStatus = "AUTHENTICATED";
      lastError = null;
      notifyListeners();
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
    currentUser = null;
    currentStatus = "UNAUTHENTICATED";
    lastError = null;
    try {
      const { orderService } = require("./order.service");
      orderService.clearMemoryStore();
    } catch {}
    notifyListeners();
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

  async getSession(): Promise<Session | null> {
    if (currentSession) {
      return currentSession;
    }
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data?.session) {
        currentSession = null;
        currentUser = null;
        return null;
      }
      currentSession = data.session;
      currentUser = data.session.user;
      if (currentUser) {
        await this.fetchAndCacheRole(currentUser.id);
      }
      return currentSession;
    } catch {
      return null;
    }
  },

  onAuthStateChange(callback: AuthStateListener) {
    listeners.add(callback);
    // Emit immediate current snapshot to the subscriber
    callback(getSnapshot());
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

  getAuthStatus(): AuthStatus {
    return currentStatus;
  },

  getAuthState(): AuthState {
    return getSnapshot();
  },

  normalizePhoneNumber(raw: string): string | null {
    if (!raw || typeof raw !== "string") return null;
    const clean = raw.replace(/[\s\-\(\)\.]/g, "").trim();
    if (!clean) return null;

    // Moroccan numbers: 06XXXXXXXX or 07XXXXXXXX (10 digits)
    if (/^0[67]\d{8}$/.test(clean)) {
      return "+212" + clean.substring(1);
    }
    // 9 digits without leading 0: 6XXXXXXXX or 7XXXXXXXX
    if (/^[67]\d{8}$/.test(clean)) {
      return "+212" + clean;
    }
    // 2126XXXXXXXX or 2127XXXXXXXX (11-12 digits)
    if (/^212[67]\d{8}$/.test(clean)) {
      return "+" + clean;
    }
    // 002126XXXXXXXX
    if (/^00212[67]\d{8}$/.test(clean)) {
      return "+" + clean.substring(2);
    }
    // Full international format: +2126XXXXXXXX
    if (/^\+212[67]\d{8}$/.test(clean)) {
      return clean;
    }
    // General E.164 international: +[1-9][0-9]{7,14}
    if (/^\+[1-9]\d{7,14}$/.test(clean)) {
      return clean;
    }
    // General digits: prepend +
    if (/^\d{8,15}$/.test(clean)) {
      return "+" + clean;
    }
    return null;
  },

  async verifyOtp(
    emailOrPhone: string,
    token: string,
    type: "signup" | "email" | "sms" = "sms",
  ) {
    const isEmail = emailOrPhone.includes("@");
    let cleanTarget = emailOrPhone.trim();
    if (!isEmail) {
      const norm = this.normalizePhoneNumber(cleanTarget);
      if (norm) cleanTarget = norm;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp(
        isEmail
          ? {
              email: cleanTarget,
              token: token.trim(),
              type: type as any,
            }
          : {
              phone: cleanTarget,
              token: token.trim(),
              type: "sms",
            },
      );
      if (error) {
        throw new Error(error.message || "Code incorrect ou expiré.");
      }
      if (data.session) {
        currentSession = data.session;
        currentUser = data.user;
        if (data.user) {
          await this.ensureUserProfile(data.user);
          await this.fetchAndCacheRole(data.user.id);
        }
        currentStatus = "AUTHENTICATED";
        lastError = null;
        notifyListeners();
      }
      return data;
    } catch (err: any) {
      throw new Error(err?.message || "Code incorrect ou expiré.");
    }
  },

  async signInWithPhone(phone: string) {
    const cleanPhone = this.normalizePhoneNumber(phone);
    if (!cleanPhone) {
      throw new Error("Veuillez saisir un numéro de téléphone valide.");
    }

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: cleanPhone,
      });
      if (error) {
        throw new Error(
          error.message ||
            "Impossible d'envoyer le code SMS. Veuillez réessayer.",
        );
      }
      return data;
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("NetworkError") || msg.includes("Failed to fetch")) {
        throw new Error("Problème de connexion réseau. Veuillez réessayer.");
      }
      throw new Error(msg || "Impossible d'envoyer le code SMS.");
    }
  },

  /**
   * Request a single-use 6-digit WhatsApp OTP delivered via OpenWA
   */
  async requestWhatsAppOtp(phone: string): Promise<{
    success: boolean;
    message: string;
    cooldownSeconds?: number;
  }> {
    const cleanPhone = this.normalizePhoneNumber(phone);
    if (!cleanPhone) {
      throw new Error("Veuillez saisir un numéro de téléphone valide.");
    }

    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-otp", {
        body: {
          action: "request-otp",
          phone: cleanPhone,
        },
      });

      if (error) {
        const errMsg = error.message || "";
        if (errMsg.includes("429") || errMsg.includes("Trop de tentatives")) {
          throw new Error(
            "Trop de tentatives. Veuillez patienter un instant et réessayer.",
          );
        }
        throw new Error(
          "La vérification WhatsApp est temporairement indisponible. Veuillez essayer par SMS.",
        );
      }

      if (!data || !data.success) {
        const dataErr = data?.error || "";
        if (
          dataErr.includes("Trop de tentatives") ||
          dataErr.includes("patienter")
        ) {
          throw new Error(dataErr);
        }
        if (dataErr.includes("invalide")) {
          throw new Error("Veuillez saisir un numéro de téléphone valide.");
        }
        throw new Error(
          "La vérification WhatsApp est temporairement indisponible. Veuillez essayer par SMS.",
        );
      }

      return {
        success: true,
        message: data.message || "Code de confirmation envoyé par WhatsApp.",
        cooldownSeconds: data.cooldownSeconds || 60,
      };
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.includes("NetworkError") ||
        msg.includes("Failed to fetch") ||
        msg.includes("404") ||
        msg.includes("502") ||
        msg.includes("503") ||
        msg.includes("FunctionsFetchError") ||
        msg.includes("indisponible")
      ) {
        throw new Error(
          "La vérification WhatsApp est temporairement indisponible. Veuillez essayer par SMS.",
        );
      }
      throw err;
    }
  },

  /**
   * Verify WhatsApp OTP and establish official Supabase Auth Session
   */
  async verifyWhatsAppOtp(
    phone: string,
    otp: string,
  ): Promise<{
    success: boolean;
    session: Session | null;
    role: UserRole;
  }> {
    const cleanPhone = this.normalizePhoneNumber(phone);
    const cleanOtp = otp.trim();

    if (!cleanPhone || !cleanOtp) {
      throw new Error("Numéro de téléphone ou code manquant.");
    }

    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-otp", {
        body: {
          action: "verify-otp",
          phone: cleanPhone,
          otp: cleanOtp,
        },
      });

      if (error) {
        throw new Error(error.message || "Code incorrect ou expiré.");
      }

      if (!data || !data.success) {
        throw new Error(data?.error || "Code incorrect ou expiré.");
      }

      if (data.session?.access_token && data.session?.refresh_token) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });

        if (sessionError) throw sessionError;

        if (sessionData.session) {
          currentSession = sessionData.session;
          currentUser = sessionData.user;
          const role = await this.ensureUserProfile(sessionData.user!);
          await this.fetchAndCacheRole(sessionData.user!.id);
          currentStatus = "AUTHENTICATED";
          lastError = null;
          notifyListeners();
          return { success: true, session: sessionData.session, role };
        }
      }

      throw new Error("Session Supabase invalide.");
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.includes("NetworkError") ||
        msg.includes("Failed to fetch") ||
        msg.includes("FunctionsFetchError")
      ) {
        throw new Error(
          "Erreur réseau lors de la vérification. Veuillez réessayer.",
        );
      }
      throw err;
    }
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

      if (result.type === "cancel" || result.type === "dismiss") {
        return null;
      }

      if (result.type === "success" && result.url) {
        return await this.handleOAuthCallback(result.url);
      }
    }
    return null;
  },
};
