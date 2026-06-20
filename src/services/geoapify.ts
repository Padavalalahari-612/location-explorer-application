import { Place, RecentSearch } from "../types";
import { CATEGORIES, getCategoryByGeoapify } from "../categories";

/**
 * Geocoding Search: Converts a textual descriptive query (e.g., "Paris", "Seattle", "Sydney")
 * into geographic coordinates [lat, lon] and returns an elegant display name.
 */
export async function searchGeocode(
  text: string,
  apiKey: string
): Promise<{ lat: number; lon: number; name: string }[]> {
  if (!apiKey || apiKey.trim() === "") {
    // If no API key is provided, return simulated coordinates for key cities to help testing
    console.warn("Geoapify API key is missing. Yielding high-fidelity mock geocoding results.");
    return mockGeocodeResults(text);
  }

  try {
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      text
    )}&limit=5&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.message || `Geocoding request failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      return [];
    }

    return data.features.map((feature: any) => {
      const lon = feature.geometry.coordinates[0];
      const lat = feature.geometry.coordinates[1];
      const properties = feature.properties || {};
      
      const parts = [
        properties.name,
        properties.street,
        properties.city,
        properties.state,
        properties.country,
      ].filter(Boolean);

      const name = parts.length > 0 ? parts.join(", ") : properties.formatted || `Location at ${lat.toFixed(4)}, ${lon.toFixed(4)}`;

      return {
        lat,
        lon,
        name,
      };
    });
  } catch (error) {
    console.error("Geocoding Error:", error);
    throw error;
  }
}

/**
 * Places Search: Fetches nearby attractions/facilities based on location lat/lon boundaries,
 * matching categories, and within the chosen radius filter (meters).
 */
export async function findNearbyPlaces(
  lat: number,
  lon: number,
  category: string, //local category ID or 'all'
  radiusInKm: number,
  apiKey: string
): Promise<Place[]> {
  if (!apiKey || apiKey.trim() === "") {
    console.warn("Geoapify API key is missing. Yielding high-fidelity mock nearby places.");
    return generateMockPlaces(lat, lon, category, radiusInKm);
  }

  try {
    const radiusMeters = radiusInKm * 1000;
    
    // Process Geoapify categories
    let categoriesParam = "";
    if (category === "all") {
      categoriesParam = CATEGORIES.map((c) => c.geoapifyCategory).join(",");
    } else {
      const matched = CATEGORIES.find((c) => c.id === category);
      categoriesParam = matched ? matched.geoapifyCategory : CATEGORIES.map((c) => c.geoapifyCategory).join(",");
    }

    // Note: Geoapify circle filter uses circle:lon,lat,radius.
    // Proximity bias uses bias=proximity:lon,lat
    const url = `https://api.geoapify.com/v2/places?categories=${categoriesParam}&filter=circle:${lon},${lat},${radiusMeters}&bias=proximity:${lon},${lat}&limit=50&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      throw new Error(errorJson.message || `Places search request failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.features) return [];

    return data.features.map((feature: any) => {
      const properties = feature.properties || {};
      const placeLon = feature.geometry.coordinates[0];
      const placeLat = feature.geometry.coordinates[1];

      // Map back to our categories
      let localCategory = "all";
      if (properties.categories && properties.categories.length > 0) {
        for (const cat of properties.categories) {
          const catMatch = getCategoryByGeoapify(cat);
          if (catMatch) {
            localCategory = catMatch.id;
            break;
          }
        }
      }
      
      if (localCategory === "all" && category !== "all") {
        localCategory = category;
      }

      return {
        id: properties.place_id || `place_${Math.random().toString(36).substr(2, 9)}`,
        name: properties.name || properties.address_line1 || `Unnamed ${localCategory.replace('_', ' ')}`,
        address: properties.address_line2 || properties.formatted || "Address unavailable",
        category: localCategory,
        lat: placeLat,
        lon: placeLon,
        distance: properties.distance || calculateHaversineDistance(lat, lon, placeLat, placeLon),
        city: properties.city || properties.suburb,
        postcode: properties.postcode,
        phone: properties.datasource?.raw?.phone || properties.contact?.phone,
        website: properties.datasource?.raw?.website || properties.contact?.website,
        openingHours: properties.datasource?.raw?.opening_hours || properties.opening_hours,
      };
    });
  } catch (error) {
    console.error("Places Fetch Error:", error);
    throw error;
  }
}

/**
 * Fallback Geocoding support: returns geographic coordinate estimates for main searched terms.
 */
function mockGeocodeResults(text: string): { lat: number; lon: number; name: string }[] {
  const norm = text.toLowerCase().trim();
  const index: Record<string, { lat: number; lon: number; name: string }> = {
    london: { lat: 51.5074, lon: -0.1278, name: "London, Greater London, England, United Kingdom" },
    paris: { lat: 48.8566, lon: 2.3522, name: "Paris, Île-de-France, France" },
    "new york": { lat: 40.7128, lon: -74.0060, name: "New York City, New York, United States" },
    tokyo: { lat: 35.6762, lon: 139.6503, name: "Tokyo, Kanto, Japan" },
    sydney: { lat: -33.8688, lon: 151.2093, name: "Sydney, New South Wales, Australia" },
    bengaluru: { lat: 12.9716, lon: 77.5946, name: "Bengaluru, Karnataka, India" },
    bangalore: { lat: 12.9716, lon: 77.5946, name: "Bengaluru, Karnataka, India" },
    mumbai: { lat: 19.0760, lon: 72.8777, name: "Mumbai, Maharashtra, India" },
    delhi: { lat: 28.7041, lon: 77.1025, name: "New Delhi, Delhi, India" },
    berlin: { lat: 52.5200, lon: 13.4050, name: "Berlin, Germany" },
    "san francisco": { lat: 37.7749, lon: -122.4194, name: "San Francisco, California, United States" },
    chicago: { lat: 41.8781, lon: -87.6298, name: "Chicago, Illinois, United States" },
    toronto: { lat: 43.6532, lon: -79.3832, name: "Toronto, Ontario, Canada" },
    singapore: { lat: 1.3521, lon: 103.8198, name: "Singapore, Central Region, Singapore" },
  };

  // Check direct matches
  for (const [key, val] of Object.entries(index)) {
    if (norm.includes(key)) {
      return [val];
    }
  }

  // Fallback default coordinates of London with randomized name for the searched text
  const cleanTerm = text.replace(/[<>'"&]/g, "");
  return [
    {
      lat: 51.5074 + (Math.random() - 0.5) * 0.1,
      lon: -0.1278 + (Math.random() - 0.5) * 0.1,
      name: `${cleanTerm} (Demo Mode Coordinates, England, UK)`,
    },
    {
      lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      lon: -74.0060 + (Math.random() - 0.5) * 0.1,
      name: `${cleanTerm} (Demo Mode Coordinates, NY, USA)`,
    },
  ];
}

/**
 * Generate realistic nearby places for demo purposes using a lat/lon pivot point
 */
function generateMockPlaces(
  lat: number,
  lon: number,
  category: string,
  radiusInKm: number
): Place[] {
  const result: Place[] = [];
  const count = 15;
  
  const dummyNames: Record<string, string[]> = {
    restaurants: [
      "The Golden Fork", "Chez Bistro", "Olive & Basil Garden", "Saffron Spice", 
      "Gourmet Table", "Pizzeria Napoli", "Umami Sushi", "The Green Leaf Diner",
      "Bella Italia", "Ocean Grill house", "Steak & Co", "Urban Wok"
    ],
    cafes: [
      "Brew & Bean Cafe", "The Espresso Bar", "Central Perk", "Starlight Bakery", 
      "The Daily Grind", "Velvet Mocha", "Artisan Coffee Lab", "Java Spot",
      "Corner Bakery", "Cocoa Dreams"
    ],
    hospitals: [
      "City General Hospital", "Mercy Health Center", "Saint Jude Medical Clinic", 
      "Grace Memorial Hospital", "Community Wellness Hospital", "Valley Care Center"
    ],
    pharmacies: [
      "MediSafe Pharmacy", "Corner Druggist", "Express Care Pharmacy", "Green Cross Chemist", 
      "Rx Wellness Pharmacy", "SuperCare Drugstore"
    ],
    hotels: [
      "The Grand Plaza Hotel", "Sheraton Central", "The Cozy Inn Apartments", 
      "Aura Premium Suites", "Royal Palace Hotel", "Sunset Vista Lodge"
    ],
    atms: [
      "Global Trade Bank ATM", "Apex Premium ATM", "SafeLock Cashpoint", "Metro Bank 24h ATM", 
      "Unified Access Cash Box", "Plus ATM"
    ],
    parks: [
      "Riverfront Memorial Park", "Centennial Green Park", "Botanical Sanctuary Lanes", 
      "Meadow Woods Recreational Park", "Starlight Children play ground", "Sunset Valley Field"
    ],
    shopping_malls: [
      "Megabox Shopping Plaza", "Grand Galleria Mall", "The Pavilion Arcades", 
      "City Center Shopping Hub", "Style & Fashion Boulevard"
    ]
  };

  const categoriesToGenerate = category === "all" 
    ? CATEGORIES.map(c => c.id) 
    : [category];

  for (let i = 0; i < count; i++) {
    const chosenCat = categoriesToGenerate[Math.floor(Math.random() * categoriesToGenerate.length)];
    const namesList = dummyNames[chosenCat] || ["Local Merchant Spot"];
    const baseName = namesList[Math.floor(Math.random() * namesList.length)];
    
    // Add incrementing index to avoid name collusions
    const name = `${baseName} (Spot #${i + 1})`;

    // Generate coordinates inside the requested radius
    // Random bearing and distance
    const r = (Math.random() * radiusInKm * 0.9) / 111.32; // Latitude degree is roughly 111.32 km
    const theta = Math.random() * 2 * Math.PI;
    const itemLat = lat + r * Math.sin(theta);
    const itemLon = lon + r * Math.cos(theta) / Math.cos(lat * Math.PI / 180);

    const distance = Math.round(calculateHaversineDistance(lat, lon, itemLat, itemLon));

    result.push({
      id: `mock_place_${chosenCat}_${i}_${Math.floor(Math.random() * 10000)}`,
      name,
      address: `${Math.floor(Math.random() * 850) + 1} High Street Road, Near Town Core`,
      category: chosenCat,
      lat: itemLat,
      lon: itemLon,
      distance,
      city: "Demo City",
      postcode: "DEM0 1S7",
      phone: "+1 (555) 0192-3847",
      website: `https://www.example.com/${chosenCat}/${i}`,
      openingHours: "Mon-Sat: 09:00 AM - 10:00 PM; Sun: 10:00 AM - 06:00 PM"
    });
  }

  // Sort by distance
  return result.sort((a, b) => a.distance - b.distance);
}

/**
 * Calculatest distance between two latitudes/longitudes in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}
