import { OUJDA_NEIGHBORHOODS } from "@/constants/mockData";
import * as Location from "expo-location";

export interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
  neighborhood: string;
  city: string;
}

type LocationListener = (
  address: string,
  coords: { latitude: number; longitude: number },
) => void;

class LocationStore {
  private currentAddress: string = "Rue Ziri Ibn Atia, 35";
  private currentCoords: { latitude: number; longitude: number } = {
    latitude: 34.6867,
    longitude: -1.9114,
  };
  private listeners: Set<LocationListener> = new Set();

  public getAddress(): string {
    return this.currentAddress;
  }

  public getCoords(): { latitude: number; longitude: number } {
    return this.currentCoords;
  }

  public setAddress(
    address: string,
    coords?: { latitude: number; longitude: number },
  ) {
    if (!address) return;
    this.currentAddress = address;
    if (coords) {
      this.currentCoords = coords;
    }
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentAddress, this.currentCoords);
      } catch {}
    });
  }

  public subscribe(listener: LocationListener): () => void {
    this.listeners.add(listener);
    listener(this.currentAddress, this.currentCoords);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const locationStore = new LocationStore();

export const locationService = {
  /**
   * Request permission and fetch user's live GPS location
   */
  async getCurrentLocation(): Promise<LocationResult> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        // Fallback default to Oujda Centre-Ville if permission is denied
        return {
          latitude: 34.6867,
          longitude: -1.9114,
          address: "Boulevard Mohammed V, Centre-Ville",
          neighborhood: "Centre-Ville (وسط المدينة)",
          city: "Oujda",
        };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Reverse geocode to get human-readable street & district
      const geocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const street = item.street || item.name || "Rue principale";
        const district =
          item.district || item.subregion || item.city || "Centre-Ville";
        const city = item.city || "Oujda";

        // Match with known Oujda neighborhoods if possible
        const matchedNeighborhood =
          OUJDA_NEIGHBORHOODS.find(
            (n) =>
              n.toLowerCase().includes(district.toLowerCase()) ||
              district.toLowerCase().includes(n.split(" ")[0].toLowerCase()),
          ) || `${district}`;

        return {
          latitude,
          longitude,
          address: `${street}, ${matchedNeighborhood}`,
          neighborhood: matchedNeighborhood,
          city: city,
        };
      }

      return {
        latitude,
        longitude,
        address: "Oujda, Maroc",
        neighborhood: "Centre-Ville (وسط المدينة)",
        city: "Oujda",
      };
    } catch (error) {
      console.warn("Error fetching location:", error);
      return {
        latitude: 34.6867,
        longitude: -1.9114,
        address: "Boulevard Mohammed V, Centre-Ville",
        neighborhood: "Centre-Ville (وسط المدينة)",
        city: "Oujda",
      };
    }
  },

  /**
   * High-accuracy reverse geocoding to retrieve the exact real-world street and neighborhood
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    try {
      // 1. Try native Expo location geocoder
      const nativeGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (nativeGeocode && nativeGeocode.length > 0) {
        const item = nativeGeocode[0];
        const streetParts: string[] = [];
        if (item.streetNumber) streetParts.push(item.streetNumber);
        if (item.street) streetParts.push(item.street);
        else if (item.name) streetParts.push(item.name);

        const street = streetParts.join(" ");
        const quarter = item.district || item.subregion;
        const city = item.city || "Oujda";

        if (street && quarter) {
          return `${street}, ${quarter}, ${city}`;
        }
        if (street) {
          return `${street}, ${city}`;
        }
      }
    } catch {
      // Proceed to high-precision OSM reverse geocoder
    }

    try {
      // 2. High-precision OpenStreetMap Nominatim reverse geocode (exact Moroccan streets & quarters)
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=fr`;
      const response = await fetch(url, {
        headers: { "User-Agent": "QuicklyDeliveryApp/1.0" },
      });
      if (response.ok) {
        const data = await response.json();
        const addr = data.address || {};
        const road = addr.road || addr.pedestrian || addr.footway || addr.path;
        const quarter =
          addr.neighbourhood || addr.suburb || addr.quarter || addr.residential;
        const city = addr.city || addr.town || "Oujda";

        if (road && quarter) {
          return `${road}, ${quarter}, ${city}`;
        }
        if (road) {
          return `${road}, ${city}`;
        }
        if (quarter) {
          return `${quarter}, ${city}`;
        }
        if (data.display_name) {
          const parts = data.display_name.split(", ");
          return parts.slice(0, 3).join(", ");
        }
      }
    } catch (e) {
      console.warn("Reverse geocode fallback notice:", e);
    }

    return `Oujda (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  },

  /**
   * Estimated delivery duration in minutes based on neighborhood in Oujda
   */
  getEstimatedMinutes(neighborhood: string): number {
    const n = neighborhood.toLowerCase();
    if (n.includes("centre") || n.includes("med v")) return 15;
    if (n.includes("lazaret") || n.includes("qods")) return 20;
    if (n.includes("salam") || n.includes("hikma")) return 22;
    if (n.includes("isly") || n.includes("universitaire")) return 20;
    if (n.includes("sidi yahya")) return 25;
    return 25;
  },
};
