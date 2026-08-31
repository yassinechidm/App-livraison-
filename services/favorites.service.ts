import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

type FavoritesListener = (favorites: string[]) => void;

class FavoritesManager {
  private favoriteIds: Set<string> = new Set(['resto-bnin']); // Bnin favorited by default for nice demo
  private listeners: Set<FavoritesListener> = new Set();
  private storageKey = 'quick_livraison_favorite_restaurants';

  constructor() {
    this.loadFavorites();
  }

  private async loadFavorites() {
    try {
      let saved: string | null = null;
      if (Platform.OS === 'web') {
        saved = localStorage.getItem(this.storageKey);
      } else {
        saved = await SecureStore.getItemAsync(this.storageKey);
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.favoriteIds = new Set(parsed);
          this.notify();
        }
      }
    } catch {
      // Safe fallback
    }
  }

  private async persistFavorites() {
    try {
      const data = JSON.stringify(Array.from(this.favoriteIds));
      if (Platform.OS === 'web') {
        localStorage.setItem(this.storageKey, data);
      } else {
        await SecureStore.setItemAsync(this.storageKey, data);
      }
    } catch {
      // Safe fallback
    }
  }

  private notify() {
    const list = Array.from(this.favoriteIds);
    this.listeners.forEach((listener) => {
      try {
        listener(list);
      } catch {
        // Safe fail
      }
    });
  }

  public subscribe(listener: FavoritesListener): () => void {
    this.listeners.add(listener);
    listener(Array.from(this.favoriteIds));
    return () => {
      this.listeners.delete(listener);
    };
  }

  public isFavorite(restaurantId: string): boolean {
    return this.favoriteIds.has(restaurantId);
  }

  public toggleFavorite(restaurantId: string): boolean {
    const isFav = this.favoriteIds.has(restaurantId);
    if (isFav) {
      this.favoriteIds.delete(restaurantId);
    } else {
      this.favoriteIds.add(restaurantId);
    }
    this.persistFavorites();
    this.notify();
    return !isFav;
  }

  public getFavorites(): string[] {
    return Array.from(this.favoriteIds);
  }
}

export const favoritesService = new FavoritesManager();
