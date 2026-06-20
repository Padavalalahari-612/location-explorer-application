export interface Place {
  id: string;
  name: string;
  address: string;
  category: string; // our local category id, e.g., 'restaurants'
  lat: number;
  lon: number;
  distance: number; // in meters
  city?: string;
  postcode?: string;
  phone?: string;
  website?: string;
  openingHours?: string;
}

export interface FavoritePlace extends Place {
  savedAt: number;
}

export interface RecentSearch {
  id: string;
  query: string;
  lat: number;
  lon: number;
  radius: number; // in km
  category: string; // category id, or 'all'
  timestamp: number;
}

export interface CategoryInfo {
  id: string;
  label: string;
  geoapifyCategory: string;
  iconName: string; // Lucide icon name string
  color: string; // tw color name (e.g., 'rose-500')
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
}
