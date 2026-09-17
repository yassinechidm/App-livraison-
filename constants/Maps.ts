import { ENV } from "@/lib/env";
import Constants from "expo-constants";

export const GOOGLE_MAPS_API_KEY =
  ENV.GOOGLE_MAPS_API_KEY ||
  Constants?.expoConfig?.android?.config?.googleMaps?.apiKey ||
  Constants?.expoConfig?.ios?.config?.googleMapsApiKey ||
  "";

export const getGoogleMapsApiKey = (): string => {
  return (
    ENV.GOOGLE_MAPS_API_KEY ||
    Constants?.expoConfig?.android?.config?.googleMaps?.apiKey ||
    Constants?.expoConfig?.ios?.config?.googleMapsApiKey ||
    ""
  );
};

export const hasGoogleMapsKey = (): boolean => {
  const key = getGoogleMapsApiKey();
  return Boolean(key && key.trim().length > 0 && !key.includes("YOUR_"));
};
