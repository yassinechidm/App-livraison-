import * as Location from 'expo-location';
import { OUJDA_NEIGHBORHOODS } from '@/constants/mockData';

export interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
  neighborhood: string;
  city: string;
}

export const locationService = {
  /**
   * Request permission and fetch user's live GPS location
   */
  async getCurrentLocation(): Promise<LocationResult> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        // Fallback default to Oujda Centre-Ville if permission is denied
        return {
          latitude: 34.6867,
          longitude: -1.9114,
          address: 'Boulevard Mohammed V, Centre-Ville',
          neighborhood: 'Centre-Ville (وسط المدينة)',
          city: 'Oujda',
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
        const street = item.street || item.name || 'Rue principale';
        const district = item.district || item.subregion || item.city || 'Centre-Ville';
        const city = item.city || 'Oujda';

        // Match with known Oujda neighborhoods if possible
        const matchedNeighborhood =
          OUJDA_NEIGHBORHOODS.find((n) =>
            n.toLowerCase().includes(district.toLowerCase()) ||
            district.toLowerCase().includes(n.split(' ')[0].toLowerCase())
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
        address: 'Oujda, Maroc',
        neighborhood: 'Centre-Ville (وسط المدينة)',
        city: 'Oujda',
      };
    } catch (error) {
      console.warn('Error fetching location:', error);
      return {
        latitude: 34.6867,
        longitude: -1.9114,
        address: 'Boulevard Mohammed V, Centre-Ville',
        neighborhood: 'Centre-Ville (وسط المدينة)',
        city: 'Oujda',
      };
    }
  },

  /**
   * Estimated delivery duration in minutes based on neighborhood in Oujda
   */
  getEstimatedMinutes(neighborhood: string): number {
    const n = neighborhood.toLowerCase();
    if (n.includes('centre') || n.includes('med v')) return 15;
    if (n.includes('lazaret') || n.includes('qods')) return 20;
    if (n.includes('salam') || n.includes('hikma')) return 22;
    if (n.includes('isly') || n.includes('universitaire')) return 20;
    if (n.includes('sidi yahya')) return 25;
    return 25;
  }
};
