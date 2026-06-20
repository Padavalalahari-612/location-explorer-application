import React, { useState, useEffect, FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Compass, ShieldX, Key, MapPin, Sparkles, SlidersHorizontal, Info, EyeOff, Eye } from "lucide-react";

import { Place, FavoritePlace, RecentSearch } from "./types";
import { CATEGORIES, getCategoryById } from "./categories";
import { findNearbyPlaces } from "./services/geoapify";

import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import PlacesList from "./components/PlacesList";
import SidebarHistory from "./components/SidebarHistory";
import AboutContactModal from "./components/AboutContactModal";
import PlacesMap from "./components/PlacesMap";

export default function App() {
  // 1. API key resolution (reads from .env frame bias, custom override, or empty)
  const [apiKey, setApiKey] = useState<string>(() => {
    return (
      (import.meta as any).env.VITE_GEOAPIFY_API_KEY ||
      localStorage.getItem("places_geoapify_key") ||
      ""
    );
  });

  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKeyInput, setTempKeyInput] = useState(apiKey);
  const [hideKeyValue, setHideKeyValue] = useState(true);

  // 2. Theme State Manager
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("places_dark_mode");
    if (saved) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // 3. Coordinate Maps Coordinates Focus Viewports
  const [viewportCenter, setViewportCenter] = useState<[number, number]>([51.5074, -0.1278]); // Default London
  const [currentFocalLabel, setCurrentFocalLabel] = useState<string>("London, Greater London, England, United Kingdom");
  const [searchRadius, setSearchRadius] = useState<number>(3); // defaulted to 3km
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // 4. Results Core List
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // 5. Offline Cache states (Local Storage)
  const [favorites, setFavorites] = useState<FavoritePlace[]>(() => {
    const cached = localStorage.getItem("places_favorites_v1");
    return cached ? JSON.parse(cached) : [];
  });

  const [history, setHistory] = useState<RecentSearch[]>(() => {
    const cached = localStorage.getItem("places_history_v1");
    return cached ? JSON.parse(cached) : [];
  });

  // 6. Async indicators
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 7. Modals / Sidebar states
  const [activeSidebarTab, setActiveSidebarTab] = useState<"history" | "favorites" | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

  // Sync Dark mode state class list with Tailwind
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("places_dark_mode", String(darkMode));
  }, [darkMode]);

  // Sync favorites in local storage
  useEffect(() => {
    localStorage.setItem("places_favorites_v1", JSON.stringify(favorites));
  }, [favorites]);

  // Sync history in local storage
  useEffect(() => {
    localStorage.setItem("places_history_v1", JSON.stringify(history));
  }, [history]);

  // On initial load, perform an elegant anchor search so the user feels welcomed
  useEffect(() => {
    handleSearch({
      lat: 51.5074,
      lon: -0.1278,
      label: "London, Greater London, England, United Kingdom",
      radius: searchRadius,
      category: selectedCategory,
      bypassHistoryLog: true
    });
  }, []);

  // Primary API search fetch pipeline
  const handleSearch = async (searchData: {
    lat: number;
    lon: number;
    label: string;
    radius: number;
    category: string;
    bypassHistoryLog?: boolean;
  }) => {
    const { lat, lon, label, radius, category, bypassHistoryLog } = searchData;
    setIsLoading(true);
    setError(null);
    setSelectedPlaceId(null);
    setViewportCenter([lat, lon]);
    setCurrentFocalLabel(label);

    try {
      const results = await findNearbyPlaces(lat, lon, category, radius, apiKey);
      setPlaces(results);

      // Append Search item to history if not bypassed
      if (!bypassHistoryLog) {
        const newSearch: RecentSearch = {
          id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          query: label.split(",")[0], // Keep search tag succinct
          lat,
          lon,
          radius,
          category,
          timestamp: Date.now()
        };

        setHistory((prev) => {
          // Exclude duplicates of same query/category
          const filtered = prev.filter(
            (item) => !(item.query === newSearch.query && item.category === newSearch.category)
          );
          return [newSearch, ...filtered].slice(0, 15); // keep max 15
        });
      }
    } catch (err: any) {
      console.error("Critical Places Fetch Failure:", err);
      setError(
        err.message ||
          "Geospatial request rejected. Verify your internet connection or check if your customized API Key is valid."
      );
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen and sync filters changes automatically for better UX
  useEffect(() => {
    // Re-trigger search when user updates category or radius filters on active coordinates
    if (viewportCenter[0] && viewportCenter[1]) {
      handleSearch({
        lat: viewportCenter[0],
        lon: viewportCenter[1],
        label: currentFocalLabel,
        radius: searchRadius,
        category: selectedCategory,
        bypassHistoryLog: true // avoid polluting history logs with filter adjustments
      });
    }
  }, [selectedCategory, searchRadius]);

  // Favorites heart toggle dispatcher
  const handleToggleFavorite = (place: Place) => {
    setFavorites((prev) => {
      const exists = prev.some((fav) => fav.id === place.id);
      if (exists) {
        return prev.filter((fav) => fav.id !== place.id);
      } else {
        const newFavorite: FavoritePlace = {
          ...place,
          savedAt: Date.now()
        };
        return [newFavorite, ...prev];
      }
    });
  };

  // Favorites sidebar item deletion
  const handleRemoveFavorite = (placeId: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== placeId));
  };

  // Re-runs geo scan from history sidebar selection
  const handleReRunSearch = (searchItem: RecentSearch) => {
    setSearchRadius(searchItem.radius);
    setSelectedCategory(searchItem.category);
    
    // Close sidebar drawer on tablets and mobile on click
    if (window.innerWidth < 1024) {
      setActiveSidebarTab(null);
    }

    handleSearch({
      lat: searchItem.lat,
      lon: searchItem.lon,
      label: searchItem.query,
      radius: searchItem.radius,
      category: searchItem.category,
      bypassHistoryLog: false
    });
  };

  // Highlight marker and zoom on selection
  const handleSelectPlace = (placeId: string, lat?: number, lon?: number) => {
    setSelectedPlaceId(placeId);
    if (lat !== undefined && lon !== undefined) {
      setViewportCenter([lat, lon]);
    }
  };

  // Clearing history
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("places_history_v1");
  };

  // Sidebar toggler
  const handleToggleSidebar = (tab: "history" | "favorites" | null) => {
    setActiveSidebarTab((prev) => (prev === tab ? null : tab));
  };

  // Save manual api key overrides
  const handleSaveCustomKey = (e: FormEvent) => {
    e.preventDefault();
    const cleanKey = tempKeyInput.trim();
    setApiKey(cleanKey);
    localStorage.setItem("places_geoapify_key", cleanKey);
    setShowKeyInput(false);
    
    // Re-run original search with new tiles
    handleSearch({
      lat: viewportCenter[0],
      lon: viewportCenter[1],
      label: currentFocalLabel,
      radius: searchRadius,
      category: selectedCategory,
      bypassHistoryLog: true
    });
  };

  const activeCategoryLabel = selectedCategory === "all" ? "All Types" : getCategoryById(selectedCategory)?.label || selectedCategory;

  return (
    <div id="application-container" className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 font-sans">
      
      {/* 1. Navbar Navigation Header */}
      <Header
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
        onOpenAboutModal={() => setIsAboutModalOpen(true)}
        onToggleSidebar={handleToggleSidebar}
        activeSidebarTab={activeSidebarTab}
        favoritesCount={favorites.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-4 overflow-x-hidden">
        
        {/* Dynamic header row that looks extremely polished in Bento style */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/65 dark:border-slate-850 pb-3">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white font-sans">
              Discover Nearby Spaces
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instant coordinates index & Geoapify geospatial tiles renderer
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse font-sans"></span>
              API: ONLINE
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-500/5 font-mono">
              CELLS: {places.length} FOUND
            </span>
          </div>
        </div>

        {/* 3. Global Error Alerts Notification Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-950/40 text-red-800 dark:text-red-300 rounded-xl p-4 text-xs font-medium flex items-start gap-2.5 shadow-sm"
            >
              <ShieldX className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <span className="font-bold">Execution Error:</span> {error}
                <button 
                  onClick={() => setError(null)} 
                  className="mt-1 block text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                >
                  Dismiss notice
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Bento Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch min-h-[660px]">
          
          {/* Bento Cell 1: Search & Filter widgets (Left Column, col-span-3) */}
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-4">
            
            {/* Upper half: Find Places Card */}
            <div className="flex-1 min-h-[190px]">
              <SearchBar
                renderMode="search"
                apiKey={apiKey}
                onSearch={handleSearch}
                isLoading={isLoading}
                onSetError={setError}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchRadius={searchRadius}
                setSearchRadius={setSearchRadius}
                currentFocalLabel={currentFocalLabel}
              />
            </div>

            {/* Lower half: Filters Card */}
            <div className="flex-[1.5] min-h-[300px]">
              <SearchBar
                renderMode="filters"
                apiKey={apiKey}
                onSearch={handleSearch}
                isLoading={isLoading}
                onSetError={setError}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchRadius={searchRadius}
                setSearchRadius={setSearchRadius}
                currentFocalLabel={currentFocalLabel}
              />
            </div>

          </div>

          {/* Bento Cell 2: Map & Recent Activity Row (Center Column, col-span-6) */}
          <div className="col-span-1 lg:col-span-6 flex flex-col gap-4">
            
            {/* Map board layout */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-900/10 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col h-[380px] lg:h-[460px]">
              <PlacesMap
                center={viewportCenter}
                places={places}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={(id) => handleSelectPlace(id)}
                geoapifyApiKey={apiKey}
                darkMode={darkMode}
              />
            </div>

            {/* Activity/Saved places log drawer inline */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col gap-3 overflow-hidden h-[155px]">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">Recent Activity & Saved</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleSidebar("history")}
                    className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    History ({history.length})
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button 
                    onClick={() => handleToggleSidebar("favorites")}
                    className="text-[10px] text-indigo-650 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    Saved ({favorites.length})
                  </button>
                </div>
              </div>

              {/* Scrollable cards row */}
              <div className="flex gap-3 overflow-x-auto pb-1 items-center h-full">
                {history.length === 0 && favorites.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center w-full py-3">
                    No recent activity logs. Perform a search to see indices here!
                  </p>
                ) : (
                  <>
                    {/* Favorites list */}
                    {favorites.map((fav) => (
                      <div
                        key={`fav-bento-${fav.id}`}
                        onClick={() => handleSelectPlace(fav.id, fav.lat, fav.lon)}
                        className="min-w-[170px] max-w-[170px] p-2.5 rounded-xl bg-indigo-500/[0.02] hover:bg-indigo-500/[0.05] border border-indigo-500/10 cursor-pointer flex flex-col justify-between h-[85px] shrink-0 transition-colors"
                      >
                        <div>
                          <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest font-mono">My Favorite</p>
                          <h4 className="text-[11px] font-semibold text-slate-900 dark:text-white truncate mt-0.5">{fav.name}</h4>
                        </div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">{fav.address}</p>
                      </div>
                    ))}

                    {/* Searches list */}
                    {history.map((hist, index) => (
                      <div
                        key={`hist-bento-${index}`}
                        onClick={() => handleReRunSearch(hist)}
                        className="min-w-[170px] max-w-[170px] p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 cursor-pointer flex flex-col justify-between h-[85px] shrink-0 transition-all"
                      >
                        <div>
                          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Recent Search</p>
                          <h4 className="text-[11px] font-semibold text-slate-900 dark:text-white truncate mt-0.5">{hist.query}</h4>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                          <span className="truncate max-w-[90px]">{hist.category.replace("_", " ")}</span>
                          <span>{hist.radius}km</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Bento Cell 3: Results Feed list (Right Column, col-span-3) */}
          <div className="col-span-1 lg:col-span-3 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 overflow-hidden h-[540px] lg:h-[631px]">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono mb-2 shrink-0">Nearby Places</h2>
            <div className="flex-1 overflow-y-auto pr-0.5 scrollbar-thin h-full">
              <PlacesList
                places={places}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                selectedPlaceId={selectedPlaceId}
                onSelectPlace={(id) => handleSelectPlace(id)}
                isLoading={isLoading}
                activeCategoryLabel={activeCategoryLabel}
                activeRadius={searchRadius}
              />
            </div>
          </div>

        </div>

        {/* 5. Floating API Config Credentials drawer */}
        <div className="mt-4 border-t border-slate-200/60 dark:border-slate-800/60 pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1 font-semibold text-zinc-600 dark:text-zinc-400 font-mono">
              <Key className="h-3.5 w-3.5 text-rose-500" />
              GEOAPIFY KEY STATUS:
            </span>
            {apiKey ? (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/5 font-mono">
                ACTIVE COGNITION
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5 font-mono">
                SANDBOX SIMULATION
              </span>
            )}
            
            <button
              onClick={() => {
                setTempKeyInput(apiKey);
                setShowKeyInput(!showKeyInput);
              }}
              className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
            >
              {showKeyInput ? "Close Settings" : "Configure Custom API Key"}
            </button>
          </div>

          <p className="text-[11px] text-zinc-400 font-mono text-center md:text-right">
            Student CS Project Grid © {new Date().getFullYear()} — Connected to Geoapify services
          </p>
        </div>

        {/* Collapsible Key input section */}
        <AnimatePresence>
          {showKeyInput && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/60 font-sans"
            >
              <h5 className="text-xs font-bold text-zinc-800 dark:text-white mb-1.5 flex items-center gap-1">
                <SlidersHorizontal className="h-4 w-4 text-rose-500" /> Specify Your Geoapify API Key
              </h5>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-3 leading-normal">
                Don't have a custom key? Copy/paste a free key instantly from your project dashboard at{" "}
                <a
                  href="https://myprojects.geoapify.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-500 hover:underline"
                >
                  myprojects.geoapify.com
                </a>
                . Entering a key unlocks real location maps and live coordinate calculations. If left blank, the system automatically uses its high-fidelity mock simulation database.
              </p>

              <form onSubmit={handleSaveCustomKey} className="flex gap-2.5 max-w-lg">
                <div className="relative flex-1">
                  <input
                    type={hideKeyValue ? "password" : "text"}
                    placeholder="Enter your Geoapify API Key (e.g. 52ca85807fa...)"
                    value={tempKeyInput}
                    onChange={(e) => setTempKeyInput(e.target.value)}
                    className="w-full text-xs font-mono rounded bg-white border border-zinc-200 px-3 py-2 outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setHideKeyValue(!hideKeyValue)}
                    className="absolute inset-y-0 right-2 px-1 text-zinc-400 hover:text-zinc-650"
                  >
                    {hideKeyValue ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <button
                  type="submit"
                  className="rounded bg-rose-500 hover:bg-rose-600 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-bold px-3 text-xs text-white cursor-pointer"
                >
                  Save and Refresh
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* 6. Sliding Side panel drawers (History / Favorites) */}
      <AnimatePresence>
        {activeSidebarTab && (
          <>
            {/* Backdrop overlay for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveSidebarTab(null)}
              className="fixed inset-0 z-20 bg-black lg:hidden"
            />
            <SidebarHistory
              tab={activeSidebarTab}
              onClose={() => setActiveSidebarTab(null)}
              favorites={favorites}
              history={history}
              onRemoveFavorite={handleRemoveFavorite}
              onClearHistory={handleClearHistory}
              onReRunSearch={handleReRunSearch}
              onSelectPlace={(id, lat, lon) => handleSelectPlace(id, lat, lon)}
            />
          </>
        )}
      </AnimatePresence>

      {/* 7. Explanatory Deliverables academic info Modal */}
      <AboutContactModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        userEmail="padavalalahari06@gmail.com"
      />

    </div>
  );
}
