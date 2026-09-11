-- ==============================================================================
-- QUICKLY LIVRAISON — AUTHENTICATION HARMONIZATION: GOOGLE OAUTH & WHATSAPP
-- Migration File: supabase/migrations/20260911000000_auth_google_whatsapp.sql
-- ==============================================================================

-- 1. PROFILES TABLE CONSTRAINTS & NULLABLE EMAIL FOR PHONE AUTH
DO $$
BEGIN
    -- Drop NOT NULL constraint on email to support phone-only / WhatsApp authentication
    ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Update unique index on email so it only enforces uniqueness on non-null, non-empty emails
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_key;
    DROP INDEX IF EXISTS public.profiles_email_key;
    DROP INDEX IF EXISTS public.idx_profiles_email_unique;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique 
    ON public.profiles(LOWER(email)) 
    WHERE email IS NOT NULL AND TRIM(email) <> '';
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 2. AUTH OTP CHALLENGES (SERVER-SIDE SECURE STORAGE FOR WHATSAPP OTP)
CREATE TABLE IF NOT EXISTS public.auth_otp_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT DEFAULT 0 NOT NULL,
    max_attempts INT DEFAULT 5 NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_phone_created 
ON public.auth_otp_challenges(phone, created_at DESC);

-- Enable RLS — no direct client access allowed; only service_role and SECURITY DEFINER functions can interact
ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;

-- Drop any previous permissive policies on auth_otp_challenges
DROP POLICY IF EXISTS "No client access to otp challenges" ON public.auth_otp_challenges;
CREATE POLICY "No client access to otp challenges" ON public.auth_otp_challenges
FOR ALL USING (FALSE);

-- 3. ENHANCED USER REGISTRATION TRIGGER (GOOGLE METADATA + PHONE SUPPORT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_phone TEXT;
  v_email TEXT;
BEGIN
  -- Extract email safely
  v_email := NULLIF(TRIM(NEW.email), '');
  
  -- Extract name from metadata or fallback
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    CASE WHEN v_email IS NOT NULL THEN split_part(v_email, '@', 1) ELSE 'Client' END
  );
  
  -- Extract phone
  v_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.phone
  );

  -- Insert or update profile with client role
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    v_email,
    v_full_name,
    v_phone,
    'client'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(public.profiles.email, EXCLUDED.email),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log warning without aborting auth signup
    RAISE WARNING 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. IDEMPOTENT PROFILE RESOLUTION & ROLE FETCH RPC
CREATE OR REPLACE FUNCTION public.rpc_ensure_user_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user auth.users;
  v_profile public.profiles;
  v_full_name TEXT;
  v_phone TEXT;
  v_email TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = auth.uid();
  IF FOUND THEN
    RETURN v_profile;
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;

  v_email := NULLIF(TRIM(v_user.email), '');
  v_full_name := COALESCE(
    v_user.raw_user_meta_data->>'full_name',
    v_user.raw_user_meta_data->>'name',
    CASE WHEN v_email IS NOT NULL THEN split_part(v_email, '@', 1) ELSE 'Client' END
  );
  v_phone := COALESCE(
    v_user.raw_user_meta_data->>'phone',
    v_user.phone
  );

  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    v_user.id,
    v_email,
    v_full_name,
    v_phone,
    'client'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(public.profiles.email, EXCLUDED.email),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone)
  RETURNING * INTO v_profile;

  RETURN v_profile;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_ensure_user_profile() TO authenticated;
