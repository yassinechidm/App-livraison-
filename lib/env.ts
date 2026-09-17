/**
 * Quickly Livraison — Centralized Environment Variables Accessor
 * Safely loads and validates application configuration from process.env / EXPO_PUBLIC_*
 */

function getEnvVar(key: string, defaultValue = ""): string {
  const value = process.env[key];
  if (value && typeof value === "string") {
    return value.trim();
  }
  return defaultValue;
}

export const ENV = {
  // Supabase
  SUPABASE_URL: getEnvVar(
    "EXPO_PUBLIC_SUPABASE_URL",
    "https://srgzjplfzunkgjqmgtub.supabase.co"
  ),
  SUPABASE_ANON_KEY: getEnvVar(
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    "sb_publishable_ihTjncryndmrkOToVzhJIQ_8v-089sF"
  ),

  // Google Maps
  GOOGLE_MAPS_API_KEY: getEnvVar(
    "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY",
    "AIzaSyDWlDCjLf_BL85fhXhdLHOqOvgVKSjVbbw"
  ),

  // Environment mode
  IS_DEV: typeof __DEV__ !== "undefined" ? __DEV__ : process.env.NODE_ENV !== "production",
};

// Check and warn in development if environment variables are not supplied through .env
if (ENV.IS_DEV) {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    console.info(
      "[Config] EXPO_PUBLIC_SUPABASE_URL not detected in process.env, using default configured endpoint."
    );
  }
  if (!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) {
    console.info(
      "[Config] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY not detected in process.env, using default configured key."
    );
  }
}

