import { motion, AnimatePresence } from "motion/react";
import { Heart, History, Trash2, MapPin, Navigation, Compass, ExternalLink, X, Clock } from "lucide-react";
import { FavoritePlace, RecentSearch } from "../types";
import { CATEGORIES } from "../categories";

interface SidebarHistoryProps {
  tab: "history" | "favorites" | null;
  onClose: () => void;
  favorites: FavoritePlace[];
  history: RecentSearch[];
  onRemoveFavorite: (placeId: string) => void;
  onClearHistory: () => void;
  onReRunSearch: (search: RecentSearch) => void;
  onSelectPlace: (placeId: string, lat: number, lon: number) => void;
}

export default function SidebarHistory({
  tab,
  onClose,
  favorites,
  history,
  onRemoveFavorite,
  onClearHistory,
  onReRunSearch,
  onSelectPlace
}: SidebarHistoryProps) {
  if (!tab) return null;

  const truncateText = (text: string, len: number) => {
    return text.length > len ? text.substring(0, len) + "..." : text;
  };

  const formattedTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return "Just now";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  };

  const getCategoryLabel = (catId: string) => {
    if (catId === "all") return "All Categories";
    const found = CATEGORIES.find((c) => c.id === catId);
    return found ? found.label : catId;
  };

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 220 }}
      className="fixed top-16 right-0 bottom-0 z-30 flex w-full flex-col border-l border-zinc-200 bg-white/95 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 sm:w-85"
    >
      {/* Drawer Header Toolbar */}
      <div className="flex items-center justify-between border-b border-zinc-200/60 px-5 py-4 dark:border-zinc-800/60">
        <div className="flex items-center gap-2">
          {tab === "history" ? (
            <>
              <History className="h-5 w-5 text-rose-500 animate-pulse" />
              <h3 className="font-bold text-zinc-900 dark:text-white">Run History</h3>
            </>
          ) : (
            <>
              <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
              <h3 className="font-bold text-zinc-900 dark:text-white">Saved Places ({favorites.length})</h3>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Tab Panels Scroll Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        
        {/* RUN HISTORY LIST PANEL */}
        {tab === "history" && (
          <div className="space-y-3">
            {history.length > 0 ? (
              <>
                <div className="flex justify-between items-center text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider font-mono px-1">
                  <span>Recent Searches</span>
                  <button
                    onClick={onClearHistory}
                    className="flex items-center gap-1 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    Clear List
                  </button>
                </div>

                <div className="space-y-2">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onReRunSearch(item)}
                      className="group block rounded-xl border border-zinc-150 bg-zinc-50/50 p-3 text-left hover:border-rose-500 hover:bg-white dark:border-zinc-800/60 dark:bg-zinc-900/10 dark:hover:border-amber-500 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-bold text-zinc-950 dark:text-white group-hover:text-rose-500 dark:group-hover:text-amber-500 truncate max-w-[190px]">
                          {item.query}
                        </h4>
                        <span className="flex items-center gap-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 shrink-0">
                          <Clock className="h-3 w-3" />
                          {formattedTime(item.timestamp)}
                        </span>
                      </div>
                      
                      <div className="mt-2.5 flex items-center justify-between gap-1.5 border-t border-zinc-250/20 pt-1.5 text-[10px] text-zinc-400 font-medium">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400">
                          {getCategoryLabel(item.category)}
                        </span>
                        <span className="font-mono text-zinc-400">
                          Radius: {item.radius} km
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-400">
                <History className="h-8 w-8 text-zinc-300 mb-2" />
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">History Empty</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[180px]">Your nearby geospatial logs will compile here on scan.</p>
              </div>
            )}
          </div>
        )}

        {/* SAVED PLACES FAVORITES PANEL */}
        {tab === "favorites" && (
          <div className="space-y-3">
            {favorites.length > 0 ? (
              <div className="space-y-2.5">
                {favorites.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => onSelectPlace(place.id, place.lat, place.lon)}
                    className="group relative rounded-xl border border-zinc-150 bg-zinc-50/50 p-3 hover:border-rose-500 hover:bg-white dark:border-zinc-800/60 dark:bg-zinc-900/10 dark:hover:border-amber-500 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-950 dark:text-white group-hover:text-rose-500 dark:group-hover:text-amber-500 leading-snug">
                          {place.name}
                        </h4>
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[150px]">{truncateText(place.address, 32)}</span>
                        </p>
                      </div>

                      {/* Delete icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFavorite(place.id);
                        }}
                        className="rounded-full p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500 dark:text-zinc-600 dark:hover:bg-zinc-800 cursor-pointer shrink-0 transition-colors"
                        title="Remove Saved Spot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-2 text-[10px] flex items-center justify-between border-t border-zinc-250/20 pt-1.5">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-1 py-0.5 rounded">
                        {place.category.replace("_", " ")}
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 rounded bg-zinc-900 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-zinc-800"
                      >
                        Maps
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-400">
                <Heart className="h-8 w-8 text-zinc-300 mb-2" />
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400">No Saved Places</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 max-w-[185px]">Click the heart icon on any card to save it offline here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
