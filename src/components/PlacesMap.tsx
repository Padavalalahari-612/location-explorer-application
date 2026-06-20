import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Place } from "../types";
import { CATEGORIES } from "../categories";

// Raw hex codes associated with Tailwind categories for map rendering
const CATEGORY_COLORS: Record<string, string> = {
  restaurants: "#F43F5E", // rose-500
  cafes: "#F59E0B",      // amber-500
  hospitals: "#EF4444",  // red-500
  pharmacies: "#10B981", // emerald-500
  hotels: "#6366F1",     // indigo-500
  atms: "#3B82F6",       // blue-500
  parks: "#14B8A6",      // teal-500
  shopping_malls: "#8B5CF6", // violet-500
  all: "#6B7280"         // gray-500
};

// Inline SVG path helper for markers and icons in the Leaflet context
function getCategorySvgString(categoryId: string): string {
  switch (categoryId) {
    case "restaurants":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path></svg>`;
    case "cafes":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>`;
    case "hospitals":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M12 6v12M9 12h6M16 22V2a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v20H2v-6a2 2 0 0 1 2-2h4M16 12h4a2 2 0 0 1 2 2v6h-6"></path></svg>`;
    case "pharmacies":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>`;
    case "hotels":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M9 22V12h6v10"></path></svg>`;
    case "atms":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="8" cy="8" r="6"></circle><circle cx="18" cy="18" r="4"></circle><path d="M12 18a6 6 0 0 0-6-6"></path></svg>`;
    case "parks":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M10 10v12M14 10v12M4.5 13a4.5 4.5 0 0 1 3-8.5 6 6 0 0 1 9 0 4.5 4.5 0 0 1 3 8.5H19.5a5.5 5.5 0 0 1-11 0z"></path></svg>`;
    case "shopping_malls":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M6 2H18L22 6V20A2 2 0 0 1 20 22H4A2 2 0 0 1 2 20V6L6 2Z"></path><path d="M3 6H21"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>`;
  }
}

interface PlacesMapProps {
  center: [number, number]; // [lat, lon]
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  geoapifyApiKey: string;
  darkMode: boolean;
}

export default function PlacesMap({
  center,
  places,
  selectedPlaceId,
  onSelectPlace,
  geoapifyApiKey,
  darkMode
}: PlacesMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const centerMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersMapRef = useRef<Record<string, L.Marker>>({});

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create the map instance
    const initialMap = L.map(mapContainerRef.current, {
      center: center,
      zoom: 14,
      zoomControl: false, // will reposition to bottom right for modern look
    });

    // Add modern styled zoom control in the bottom right corner
    L.control.zoom({ position: "bottomright" }).addTo(initialMap);

    // Dynamic map design tiles from Geoapify
    // Map styles we can load based on darkMode:
    // Light: osm-carto, positron, osm-bright
    // Dark: dark-matter, toners-dark
    const styleQuery = darkMode ? "dark-matter" : "osm-carto";
    const tileUrl = geoapifyApiKey
      ? `https://maps.geoapify.com/v1/styles/${styleQuery}/tile.png?apiKey=${geoapifyApiKey}`
      : `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`;

    const attribution = geoapifyApiKey
      ? 'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
      : '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors';

    const tiles = L.tileLayer(tileUrl, { attribution });
    tiles.addTo(initialMap);

    // Store layer references
    tileLayerRef.current = tiles;
    const markersLayer = L.layerGroup().addTo(initialMap);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = initialMap;

    // Trigger a window resize to ensure leaflet corrects layout
    setTimeout(() => {
      initialMap.invalidateSize();
    }, 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run on mount only

  // Track and refresh Tile style when dark mode of apiKey changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const styleQuery = darkMode ? "dark-matter" : "osm-carto";
    const tileUrl = geoapifyApiKey
      ? `https://maps.geoapify.com/v1/styles/${styleQuery}/tile.png?apiKey=${geoapifyApiKey}`
      : `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`;

    tileLayerRef.current.setUrl(tileUrl);
  }, [darkMode, geoapifyApiKey]);

  // Handle center changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Pan to new center location smoothly
    mapInstanceRef.current.setView(center, mapInstanceRef.current.getZoom(), {
      animate: true,
      duration: 0.8
    });

    // Handle Center Focal point marker (styled with beautiful pulsing user anchor)
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setLatLng(center);
    } else {
      const pulsationIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-7 w-7 animate-ping rounded-full bg-blue-400 opacity-60"></span>
            <span class="relative inline-flex rounded-full h-4.5 w-4.5 bg-blue-600 border-2 border-white shadow-md"></span>
          </div>
        `,
        className: "custom-pulse-icon",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const pulseMarker = L.marker(center, { icon: pulsationIcon }).addTo(mapInstanceRef.current);
      pulseMarker.bindTooltip("Your Anchor Point", {
        permanent: false,
        direction: "top",
        className: "bg-zinc-900 border-zinc-700 text-white font-sans text-xs rounded px-2 py-1 shadow"
      });
      centerMarkerRef.current = pulseMarker;
    }
  }, [center]);

  // Render and update markers for search results
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    // Clear previous markers
    markersLayerRef.current.clearLayers();
    markersMapRef.current = {};

    places.forEach((place) => {
      const colorHex = CATEGORY_COLORS[place.category] || CATEGORY_COLORS.all;
      const svgIcon = getCategorySvgString(place.category);
      const isSelected = selectedPlaceId === place.id;

      // Define standard modern marker pin using Tailwind inside Leaflet html L.divIcon
      const pinHtml = `
        <div class="relative flex items-center justify-center transition-all duration-300 ${isSelected ? "scale-125 z-[9999]" : "hover:scale-115 z-50"}">
          <!-- Active highlight glow -->
          ${isSelected ? `<span class="absolute -inset-1 rounded-full animate-pulse transition-all duration-300" style="background-color: ${colorHex}44"></span>` : ""}
          
          <div class="relative h-9 w-9 bg-white dark:bg-zinc-800 rounded-full shadow-lg border-2 flex items-center justify-center transition-all" style="border-color: ${colorHex}">
            <span class="text-xs shrink-0" style="color: ${colorHex}">
              ${svgIcon}
            </span>
          </div>
          <!-- Arrow pointer -->
          <div class="absolute -bottom-1 w-2.5 h-2.5 rotate-45 border-r border-b bg-white dark:bg-zinc-800" style="border-color: ${colorHex}; border-top: 0; border-left: 0;"></div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: pinHtml,
        className: `place-custom-icon-${place.id}`,
        iconSize: [36, 40],
        iconAnchor: [18, 40],
        popupAnchor: [0, -42],
      });

      const position: [number, number] = [place.lat, place.lon];
      const marker = L.marker(position, { icon: markerIcon });

      // Clean popup markup using styled HTML
      const popupContent = document.createElement("div");
      popupContent.className = "p-1.5 font-sans min-w-[200px] text-zinc-800 dark:text-zinc-100";
      popupContent.innerHTML = `
        <h4 class="font-semibold text-sm leading-tight text-zinc-950 dark:text-white mb-0.5">${place.name}</h4>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mb-2 leading-snug">${place.address}</p>
        
        <div class="flex flex-wrap gap-1.5 items-center mb-2">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border" style="border-color: ${colorHex}55; color: ${colorHex}; background-color: ${colorHex}11">
            ${place.category.toUpperCase().replace("_", " ")}
          </span>
          <span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
            ${(place.distance / 1000).toFixed(2)} km away
          </span>
        </div>

        <a href="https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}" target="_blank" rel="noopener noreferrer" 
           class="inline-flex items-center justify-center w-full px-2.5 py-1 text-xs font-medium text-white bg-zinc-900 border border-zinc-800 rounded shadow hover:bg-zinc-800 dark:bg-zinc-700 dark:border-zinc-600 dark:hover:bg-zinc-600 transition-colors pointer-events-auto" style="text-decoration:none !important">
          Open in Google Maps
        </a>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: "custom-leaflet-popup dark-leaflet-theme"
      });

      marker.on("click", () => {
        onSelectPlace(place.id);
      });

      marker.addTo(markersLayerRef.current!);
      markersMapRef.current[place.id] = marker;
    });

    // Auto-fit zoom to bounds if there are places and user hasn't explicitly selected single place
    if (places.length > 0 && !selectedPlaceId) {
      const group = L.featureGroup(Object.values(markersMapRef.current));
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.12), {
        maxZoom: 15,
        animate: true,
        duration: 0.8
      });
    }
  }, [places]);

  // Center on marker when selected place changes programmatically (e.g. from results sidebar)
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlaceId) return;

    const matchedMarker = markersMapRef.current[selectedPlaceId];
    if (matchedMarker) {
      // Pan to marker elegantly
      const latLng = matchedMarker.getLatLng();
      mapInstanceRef.current.setView(latLng, 16, {
        animate: true,
        duration: 0.6
      });
      // Fire popup
      if (!matchedMarker.isPopupOpen()) {
        matchedMarker.openPopup();
      }
    }
  }, [selectedPlaceId]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner border border-zinc-200/80 dark:border-zinc-800/80">
      {/* Background container holding the map canvas */}
      <div id="leaflet-main-map" ref={mapContainerRef} className="w-full h-full" />
      
      {/* Visual Indicator of demo mode mapped status */}
      {!geoapifyApiKey && (
        <div className="absolute top-4 left-4 z-[1000] bg-amber-50 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 font-sans text-xs px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50 shadow flex items-center gap-1.5 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span><strong>Demo Sandbox Mode:</strong> Enter an API Key for real location tiles.</span>
        </div>
      )}
    </div>
  );
}
