-- ==============================================================================
-- QUICKLY LIVRAISON — ATOMIC WHATSAPP OTP & STATE LIFECYCLE REMEDIATION
-- Migration File: supabase/migrations/20260911000001_atomic_whatsapp_otp.sql
-- ==============================================================================

-- 1. EXTENSION FOR CRYPTOGRAPHIC HASHING INSIDE POSTGRES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENHANCE PROFILES PHONE INDEX FOR O(1) USER LOOKUP
CREATE INDEX IF NOT EXISTS idx_profiles_phone_lookup 
ON public.profiles(phone) 
WHERE phone IS NOT NULL AND phone <> '';

-- 3. RECREATE AUTH OTP CHALLENGES WITH STRICT STATUS ENUM AND ATOMIC CONSTRAINTS
CREATE TABLE IF NOT EXISTS public.auth_otp_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'CONSUMED', 'EXPIRED')),
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT DEFAULT 0 NOT NULL,
    max_attempts INT DEFAULT 5 NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure status column exists if table was previously created without it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'auth_otp_challenges' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.auth_otp_challenges ADD COLUMN status TEXT NOT NULL DEFAULT 'SENT';
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Drop and recreate partial index for active challenges
DROP INDEX IF EXISTS idx_otp_challenges_phone_active;
CREATE INDEX idx_otp_challenges_phone_active 
ON public.auth_otp_challenges(phone, created_at DESC) 
WHERE status = 'SENT' AND consumed_at IS NULL;

-- Strict RLS: NO client access directly
ALTER TABLE public.auth_otp_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "No client access to otp challenges" ON public.auth_otp_challenges;
CREATE POLICY "No client access to otp challenges" ON public.auth_otp_challenges
FOR ALL USING (FALSE);

-- 4. ATOMIC OTP VERIFICATION RPC (ROW-LOCKING & ATOMIC ATTEMPTS COUNTER)
CREATE OR REPLACE FUNCTION public.rpc_verify_otp_challenge(
  p_phone TEXT,
  p_otp_raw TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  error_code TEXT,
  remaining_attempts INT,
  challenge_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge public.auth_otp_challenges;
  v_computed_hash TEXT;
BEGIN
  -- 1. Atomically lock the most recent 'SENT' unconsumed challenge for this phone
  SELECT * INTO v_challenge
  FROM public.auth_otp_challenges
  WHERE phone = p_phone
    AND status = 'SENT'
    AND consumed_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE;

  -- Challenge not found or already consumed by concurrent request
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'NO_ACTIVE_CHALLENGE'::TEXT, 0, NULL::UUID;
    RETURN;
  END IF;

  -- 2. Check if expired
  IF v_challenge.expires_at < NOW() THEN
    UPDATE public.auth_otp_challenges
    SET status = 'EXPIRED'
    WHERE id = v_challenge.id;

    RETURN QUERY SELECT FALSE, 'CHALLENGE_EXPIRED'::TEXT, 0, v_challenge.id;
    RETURN;
  END IF;

  -- 3. Check if max attempts already reached
  IF v_challenge.attempts >= v_challenge.max_attempts THEN
    UPDATE public.auth_otp_challenges
    SET status = 'FAILED'
    WHERE id = v_challenge.id;

    RETURN QUERY SELECT FALSE, 'MAX_ATTEMPTS_EXCEEDED'::TEXT, 0, v_challenge.id;
    RETURN;
  END IF;

  -- 4. Compute SHA-256 hash inside Postgres using pgcrypto digest
  v_computed_hash := encode(digest(p_otp_raw || ':' || v_challenge.salt, 'sha256'), 'hex');

  -- 5. Compare hashes
  IF v_computed_hash = v_challenge.otp_hash THEN
    -- Correct OTP: atomically mark as CONSUMED
    UPDATE public.auth_otp_challenges
    SET consumed_at = NOW(),
        status = 'CONSUMED'
    WHERE id = v_challenge.id;

    RETURN QUERY SELECT TRUE, 'SUCCESS'::TEXT, (v_challenge.max_attempts - v_challenge.attempts), v_challenge.id;
    RETURN;
  ELSE
    -- Incorrect OTP: atomically increment attempt counter
    UPDATE public.auth_otp_challenges
    SET attempts = attempts + 1,
        status = CASE WHEN attempts + 1 >= max_attempts THEN 'FAILED' ELSE status END
    WHERE id = v_challenge.id;

    RETURN QUERY SELECT FALSE, 'INVALID_OTP'::TEXT, (v_challenge.max_attempts - (v_challenge.attempts + 1)), v_challenge.id;
    RETURN;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_verify_otp_challenge(TEXT, TEXT) TO service_role;
