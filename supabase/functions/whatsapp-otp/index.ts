// @ts-nocheck
// Supabase Edge Function: whatsapp-otp
// Deno TypeScript environment
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "https://srgzjplfzunkgjqmgtub.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "sb_publishable_ihTjncryndmrkOToVzhJIQ_8v-089sF";
const OPENWA_BASE_URL = Deno.env.get("OPENWA_BASE_URL") ?? "";
const OPENWA_API_KEY = Deno.env.get("OPENWA_API_KEY") ?? "";
const OPENWA_SESSION_ID = Deno.env.get("OPENWA_SESSION_ID") ?? "default";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Strict Moroccan & E.164 phone normalization and validation
function validateAndNormalizePhone(raw: string): { e164: string; chatId: string } | null {
  if (!raw || typeof raw !== "string") return null;

  // Strip all non-digit and non-plus characters
  const clean = raw.replace(/[\s\-\(\)\.]/g, "").trim();

  // Moroccan numbers:
  // Local format: 06XXXXXXXX or 07XXXXXXXX (10 digits)
  if (/^0[67]\d{8}$/.test(clean)) {
    const digits = "212" + clean.substring(1);
    return { e164: "+" + digits, chatId: digits + "@c.us" };
  }

  // Without leading +: 2126XXXXXXXX or 2127XXXXXXXX (12 digits)
  if (/^212[67]\d{8}$/.test(clean)) {
    return { e164: "+" + clean, chatId: clean + "@c.us" };
  }

  // With leading 00: 002126XXXXXXXX
  if (/^00212[67]\d{8}$/.test(clean)) {
    const digits = clean.substring(2);
    return { e164: "+" + digits, chatId: digits + "@c.us" };
  }

  // Full international format: +2126XXXXXXXX
  if (/^\+212[67]\d{8}$/.test(clean)) {
    const digits = clean.substring(1);
    return { e164: clean, chatId: digits + "@c.us" };
  }

  // General international mobile format: +[country_code][number] (between 8 and 15 digits)
  if (/^\+[1-9]\d{7,14}$/.test(clean)) {
    const digits = clean.substring(1);
    return { e164: clean, chatId: digits + "@c.us" };
  }

  return null;
}

// Cryptographic hash (SHA-256)
async function hashOtp(otp: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(otp + ":" + salt);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Fail-fast environment secret validation
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Config Error] SUPABASE_SERVICE_ROLE_KEY is not configured.");
      return new Response(
        JSON.stringify({ success: false, error: "Configuration serveur incomplète." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json().catch(() => ({}));
    const { action, phone, otp } = body;

    // 2. Strict phone validation
    const normalized = validateAndNormalizePhone(phone);
    if (!normalized) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Numéro de téléphone invalide. Veuillez entrer un numéro mobile valide (ex: 06 12 34 56 78).",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { e164, chatId } = normalized;

    // ==========================================
    // ACTION 1: REQUEST OTP
    // ==========================================
    if (action === "request-otp") {
      // Check OpenWA configuration
      if (!OPENWA_BASE_URL || !OPENWA_API_KEY) {
        console.error("[Config Error] OPENWA_BASE_URL or OPENWA_API_KEY is not configured.");
        return new Response(
          JSON.stringify({
            success: false,
            error: "Le service d'envoi WhatsApp n'est pas configuré. Veuillez contacter le support.",
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Check rate limits (1 request per 60s, max 5 per hour)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data: recentChallenges, error: rateError } = await supabaseAdmin
        .from("auth_otp_challenges")
        .select("created_at")
        .eq("phone", e164)
        .gte("created_at", oneHourAgo)
        .order("created_at", { ascending: false });

      if (!rateError && recentChallenges && recentChallenges.length > 0) {
        const lastCreatedAt = new Date(recentChallenges[0].created_at).getTime();
        if (Date.now() - lastCreatedAt < 60 * 1000) {
          const remainingSec = Math.ceil((60 * 1000 - (Date.now() - lastCreatedAt)) / 1000);
          return new Response(
            JSON.stringify({
              success: false,
              error: `Veuillez patienter ${remainingSec}s avant de demander un nouveau code.`,
              cooldownSeconds: remainingSec,
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (recentChallenges.length >= 5) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Trop de tentatives. Veuillez réessayer dans une heure.",
            }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // 2. Generate cryptographically secure 6-digit random code
      const randomBytes = new Uint32Array(1);
      crypto.getRandomValues(randomBytes);
      const generatedOtp = (100000 + (randomBytes[0] % 900000)).toString();

      // 3. Salt and hash OTP
      const salt = crypto.randomUUID();
      const otpHash = await hashOtp(generatedOtp, salt);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // 4. Send message via OpenWA REST API FIRST
      const messageText = `🛵 *Quickly Livraison*\n\nVotre code de confirmation est : *${generatedOtp}*\n\nCe code est valable pendant 5 minutes. Ne le partagez avec personne.`;
      const openWaUrl = `${OPENWA_BASE_URL.replace(/\/+$/, "")}/api/sessions/${OPENWA_SESSION_ID}/messages/send-text`;

      let openWaResponse: Response;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        openWaResponse = await fetch(openWaUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": OPENWA_API_KEY,
          },
          body: JSON.stringify({
            chatId,
            text: messageText,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (networkErr: any) {
        console.error("[OpenWA Network Error]", networkErr?.message);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Impossible de joindre la passerelle WhatsApp. Veuillez réessayer plus tard.",
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!openWaResponse.ok) {
        console.error("[OpenWA HTTP Error]", openWaResponse.status, openWaResponse.statusText);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Échec de l'envoi du message WhatsApp. Veuillez vérifier votre numéro et réessayer.",
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 5. OpenWA delivery confirmed: Create active OTP challenge in database
      const { error: insertError } = await supabaseAdmin.from("auth_otp_challenges").insert({
        phone: e164,
        otp_hash: otpHash,
        salt,
        status: "SENT",
        expires_at: expiresAt,
        attempts: 0,
        max_attempts: 5,
      });

      if (insertError) {
        console.error("[DB Challenge Insert Error]", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Erreur lors de l'enregistrement du code." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Code de confirmation envoyé par WhatsApp.",
          cooldownSeconds: 60,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ==========================================
    // ACTION 2: VERIFY OTP
    // ==========================================
    if (action === "verify-otp") {
      if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
        return new Response(
          JSON.stringify({ success: false, error: "Veuillez saisir un code valide à 6 chiffres." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Atomic verification in PostgreSQL (locks row, verifies hash, updates attempts atomically)
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
        "rpc_verify_otp_challenge",
        {
          p_phone: e164,
          p_otp_raw: otp.trim(),
        }
      );

      if (rpcError) {
        console.error("[RPC Verify Error]", rpcError);
        return new Response(
          JSON.stringify({ success: false, error: "Erreur lors de la vérification du code." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const verification = Array.isArray(rpcResult) ? rpcResult[0] : rpcResult;

      if (!verification?.success) {
        const errCode = verification?.error_code;
        let userMessage = "Code incorrect ou expiré.";
        if (errCode === "NO_ACTIVE_CHALLENGE") {
          userMessage = "Aucun code actif trouvé pour ce numéro. Veuillez en demander un nouveau.";
        } else if (errCode === "CHALLENGE_EXPIRED") {
          userMessage = "Ce code a expiré. Veuillez en demander un nouveau.";
        } else if (errCode === "MAX_ATTEMPTS_EXCEEDED") {
          userMessage = "Nombre maximal de tentatives atteint. Veuillez demander un nouveau code.";
        } else if (errCode === "INVALID_OTP") {
          const remaining = verification?.remaining_attempts ?? 0;
          userMessage = `Code incorrect. ${remaining > 0 ? `${remaining} tentative(s) restante(s).` : "Nombre maximal de tentatives atteint."}`;
        }

        return new Response(
          JSON.stringify({ success: false, error: userMessage }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. OTP successfully and atomically consumed!
      // Resolve user deterministically without listUsers()
      const syntheticEmail = `${e164.replace(/\D/g, "")}@whatsapp.quickly.ma`;

      // Check if user exists in profiles (O(1) indexed lookup)
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .eq("phone", e164)
        .maybeSingle();

      let targetEmail = existingProfile?.email || syntheticEmail;

      // Ensure user exists in Supabase Auth
      if (!existingProfile) {
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          phone: e164,
          email: targetEmail,
          email_confirm: true,
          phone_confirm: true,
          user_metadata: {
            phone: e164,
            auth_provider: "whatsapp",
          },
        });

        if (createError && !createError.message?.includes("already registered")) {
          console.error("[Auth User Create Error]", createError);
        }
      }

      // 3. Mint official Supabase session via generateLink without password mutation
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: targetEmail,
      });

      if (linkError || !linkData?.properties?.hashed_token) {
        console.error("[GenerateLink Error]", linkError);
        return new Response(
          JSON.stringify({ success: false, error: "Impossible de créer la session d'authentification." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 4. Exchange hashed_token with Supabase client to obtain genuine JWT session pair
      const clientSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: sessionData, error: verifySessionError } = await clientSupabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "email",
      });

      if (verifySessionError || !sessionData?.session) {
        console.error("[Session Token Exchange Error]", verifySessionError);
        return new Response(
          JSON.stringify({ success: false, error: "Erreur lors de la génération de session." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          session: sessionData.session,
          user: sessionData.user,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Action non supportée." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[Unhandled Server Error]", err);
    return new Response(
      JSON.stringify({ success: false, error: err?.message || "Erreur interne du serveur." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
