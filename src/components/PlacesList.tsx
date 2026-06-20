import React, { useState, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, MapPin, Compass, ExternalLink, Phone, Globe, Clock, Hash, ChevronDown, ChevronUp } from "lucide-react";
import { Place, FavoritePlace } from "../types";
import { CATEGORIES } from "../categories";

interface PlacesListProps {
  places: Place[];
  favorites: FavoritePlace[];
  onToggleFavorite: (place: Place) => void;
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  isLoading: boolean;
  activeCategoryLabel: string;
  activeRadius: number;
}

export default function PlacesList({
  places,
  favorites,
  onToggleFavorite,
  selectedPlaceId,
  onSelectPlace,
  isLoading,
  activeCategoryLabel,
  activeRadius
}: PlacesListProps) {
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);

  const isFavorite = (placeId: string) => {
    return favorites.some((fav) => fav.id === placeId);
  };

  const getCategoryColor = (catId: string) => {
    const found = CATEGORIES.find((c) => c.id === catId);
    return found ? found.color : "zinc-500";
  };

  // Toggle expanded card to view Phone, Website, and Hours
  const toggleExpand = (e: MouseEvent, placeId: string) => {
    e.stopPropagation(); // prevent selecting the place on map when clicking details
    setExpandedPlaceId(prev => (prev === placeId ? null : placeId));
  };

  // Loading skeleton block
  if (isLoading) {
    return (
      <div id="places-skeleton-container" className="space-y-4">
        <div className="h-4.5 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse"></div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-100 dark:border-zinc-800/80 p-5 space-y-3 scaffold bg-white dark:bg-zinc-900/10 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="h-6 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800"></div>
              <div className="h-5 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
            </div>
            <div className="h-4.5 w-full rounded bg-zinc-150 dark:bg-zinc-800"></div>
            <div className="flex gap-2 pt-2">
              <div className="h-5 w-24 rounded bg-zinc-150 dark:bg-zinc-800"></div>
              <div className="h-5 w-16 rounded bg-zinc-150 dark:bg-zinc-800"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty Results state
  if (places.length === 0) {
    return (
      <div id="places-empty" className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-800">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50/50 dark:bg-zinc-900/50 text-rose-500 mb-4 animate-bounce">
          <Compass className="h-8 w-8" />
        </div>
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
          No Places Found
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px]">
          We couldn't detect any {activeCategoryLabel !== "All Types" ? activeCategoryLabel : "places"} matching your query within a {activeRadius} km range. Try widening the Search Radius or search in a busier area.
        </p>
      </div>
    );
  }

  return (
    <div id="places-results-list" className="space-y-4">
      
      {/* Search outcome caption header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-wider">
          Found {places.length} {places.length === 1 ? "Space" : "Spaces"} in immediate range
        </p>
        <span className="text-[10px] bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-950/30">
          Sorted by proximity
        </span>
      </div>

      {/* Place Items Containers */}
      <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
        {places.map((place) => {
          const favoriteActive = isFavorite(place.id);
          const activeCard = selectedPlaceId === place.id;
          const colorHex = getCategoryColor(place.category);
          const hasExpandedDetails = !!(place.phone || place.website || place.openingHours);
          const isCurrentlyExpanded = expandedPlaceId === place.id;

          return (
            <motion.div
              key={place.id}
              layoutId={`place-card-${place.id}`}
              onClick={() => onSelectPlace(place.id)}
              className={`group relative rounded-2xl border bg-white dark:bg-zinc-900/20 p-4 transition-all duration-200 cursor-pointer ${
                activeCard
                  ? "border-rose-500 dark:border-amber-500 bg-rose-50/5 shadow-md ring-1 ring-rose-500/10"
                  : "border-zinc-200/80 hover:border-zinc-300 dark:border-zinc-800/80 dark:hover:border-zinc-700/80 hover:shadow-xs"
              }`}
              whileHover={{ y: -1 }}
            >
              {/* Category indicator Accent Left strip */}
              <span
                className="absolute left-0 top-4 bottom-4 w-1 rounded-r-lg transition-all"
                style={{ backgroundColor: `var(--color-${colorHex})` }}
              ></span>

              <div className="pl-2">
                <div className="flex items-start justify-between gap-1.5">
                  
                  {/* Name and distance */}
                  <div>
                    <h4 className="text-sm font-bold text-zinc-950 dark:text-white group-hover:text-rose-500 dark:group-hover:text-amber-500 transition-colors leading-tight">
                      {place.name}
                    </h4>
                    <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate max-w-[210px] sm:max-w-xs">{place.address}</span>
                    </p>
                  </div>

                  {/* Favorite Toggle Switch */}
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(place);
                    }}
                    className="rounded-full p-2 text-zinc-300 hover:bg-zinc-100 hover:text-rose-500 dark:text-zinc-650 dark:hover:bg-zinc-800 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                    whileTap={{ scale: 0.8 }}
                    title={favoriteActive ? "Remove from Favorites" : "Save to Favorites"}
                  >
                    <Heart
                      className={`h-4.5 w-4.5 transition-all ${
                        favoriteActive ? "fill-rose-500 text-rose-500 scale-110" : ""
                      }`}
                    />
                  </motion.button>
                </div>

                {/* Sub Metadata Tags and Badges */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800/60 pt-2.5">
                  <div className="flex items-center gap-1.5">
                    {/* Category badge Tag */}
                    <span
                      className="inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border"
                      style={{
                        borderColor: `rgba(var(--color-${colorHex}-value), 0.2)`,
                        color: `var(--color-${colorHex})`,
                        backgroundColor: `rgba(var(--color-${colorHex}-value), 0.08)`,
                      }}
                    >
                      {place.category.replace("_", " ")}
                    </span>

                    {/* Proximity range indicator */}
                    <span className="text-[10px] font-semibold font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40 px-1.5 py-0.5 rounded border border-zinc-200/40 dark:border-zinc-800/40">
                      {(place.distance / 1000).toFixed(2)} km
                    </span>
                  </div>

                  {/* Coordinate and detail controls */}
                  <div className="flex items-center gap-1">
                    {hasExpandedDetails && (
                      <button
                        onClick={(e) => toggleExpand(e, place.id)}
                        className="inline-flex items-center gap-0.5 rounded px-1.5 py-1 text-[10px] font-bold uppercase text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                        title="View Contact and Hours Info"
                      >
                        Details
                        {isCurrentlyExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    )}

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()} // prevent centering
                      className="inline-flex items-center gap-1 rounded bg-zinc-900 px-2 py-1 text-[10px] font-bold uppercase text-white hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 transition-all pointer-events-auto shadow-sm"
                    >
                      Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Expanded Contact Lines & Hours section */}
                <AnimatePresence>
                  {isCurrentlyExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 border-t border-dashed border-zinc-100 dark:border-zinc-800/40 pt-2 space-y-1.5"
                    >
                      {place.phone && (
                        <p className="flex items-center gap-1.5 text-[11px]">
                          <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>Phone: <strong>{place.phone}</strong></span>
                        </p>
                      )}
                      {place.website && (
                        <p className="flex items-center gap-1.5 text-[11px] truncate">
                          <Globe className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span>Website: <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-rose-500 dark:text-amber-500 hover:underline inline-flex items-center gap-0.5">{place.website}</a></span>
                        </p>
                      )}
                      {place.openingHours && (
                        <p className="flex items-start gap-1.5 text-[11px]">
                          <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" />
                          <span>Hours: <code className="bg-zinc-50 dark:bg-zinc-950 px-1 py-0.5 rounded border border-zinc-200/30 font-mono text-[10px]">{place.openingHours}</code></span>
                        </p>
                      )}

                      <div className="flex gap-2 items-center text-[10px] font-mono text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/40 pt-1.5 mt-2">
                        <Hash className="h-3 w-3" />
                        <span>Lat: {place.lat.toFixed(6)}</span>
                        <span>Lon: {place.lon.toFixed(6)}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
