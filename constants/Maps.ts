import Constants from "expo-constants";

export const GOOGLE_MAPS_API_KEY = "AIzaSyDWlDCjLf_BL85fhXhdLHOqOvgVKSjVbbw";

export const getGoogleMapsApiKey = (): string => {
  return (
    Constants?.expoConfig?.android?.config?.googleMaps?.apiKey ||
    Constants?.expoConfig?.ios?.config?.googleMapsApiKey ||
    GOOGLE_MAPS_API_KEY
  );
};

export const hasGoogleMapsKey = (): boolean => {
  const key = getGoogleMapsApiKey();
  return Boolean(key) && key !== "YOUR_GOOGLE_MAPS_API_KEY";
};
