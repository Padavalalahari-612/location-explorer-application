import React, { useState, useEffect, useRef, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Navigation, Compass, ChevronDown, Check, Loader2 } from "lucide-react";
import { CATEGORIES } from "../categories";
import { searchGeocode } from "../services/geoapify";

interface SearchBarProps {
  apiKey: string;
  onSearch: (searchData: {
    lat: number;
    lon: number;
    label: string;
    radius: number;
    category: string;
  }) => void;
  isLoading: boolean;
  onSetError: (err: string | null) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchRadius: number;
  setSearchRadius: (r: number) => void;
  currentFocalLabel: string;
  renderMode?: "search" | "filters";
}

export default function SearchBar({
  apiKey,
  onSearch,
  isLoading,
  onSetError,
  selectedCategory,
  setSelectedCategory,
  searchRadius,
  setSearchRadius,
  currentFocalLabel,
  renderMode,
}: SearchBarProps) {
  const [inputText, setInputText] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<{ lat: number; lon: number; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Sync inputText with active query coordinates label
  useEffect(() => {
    if (currentFocalLabel) {
      setInputText(currentFocalLabel);
    }
  }, [currentFocalLabel]);

  // Click outside to dismiss suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch geocoding suggestion list when typed (de-bounced)
  useEffect(() => {
    if (inputText.length < 3 || inputText === currentFocalLabel) {
      setSuggestions([]);
      return;
    }

    const delayDebounceGen = setTimeout(async () => {
      try {
        setIsSearchingSuggestions(true);
        const results = await searchGeocode(inputText, apiKey);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Geocoding lookup failed:", err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 550);

    return () => clearTimeout(delayDebounceGen);
  }, [inputText, apiKey]);

  // Trigger search on recommendation click
  const handleSuggestionSelect = (suggestion: { lat: number; lon: number; name: string }) => {
    setInputText(suggestion.name);
    setShowSuggestions(false);
    onSearch({
      lat: suggestion.lat,
      lon: suggestion.lon,
      label: suggestion.name,
      radius: searchRadius,
      category: selectedCategory
    });
  };

  // Form Submit handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) {
      onSetError("Please enter a city or street location to search nearby.");
      return;
    }

    try {
      setIsSearchingSuggestions(true);
      const results = await searchGeocode(inputText, apiKey);
      if (results.length > 0) {
        const topResult = results[0];
        onSearch({
          lat: topResult.lat,
          lon: topResult.lon,
          label: topResult.name,
          radius: searchRadius,
          category: selectedCategory
        });
        setShowSuggestions(false);
      } else {
        onSetError(`Unable to geocode or recognize location phrase "${inputText}". Try searching for major cities like "Berlin", "San Francisco" or "London".`);
      }
    } catch (err: any) {
      onSetError(err.message || "An error occurred while geocoding the search term.");
    } finally {
      setIsSearchingSuggestions(false);
    }
  };

  // GPS geolocation lookup handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      onSetError("Browser Geolocation is not supported by your current browser environment.");
      return;
    }

    onSetError(null);
    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const geoLabel = `My Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        setInputText(geoLabel);
        setIsLocating(false);

        onSearch({
          lat,
          lon,
          label: geoLabel,
          radius: searchRadius,
          category: selectedCategory
        });
      },
      (error) => {
        console.error("Geolocation fetch error:", error);
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            onSetError("Location request was denied. Please allow location permissions in your browser or type a city name directly.");
            break;
          case error.POSITION_UNAVAILABLE:
            onSetError("GPS/Position details are currently unavailable. Try searching textually instead.");
            break;
          case error.TIMEOUT:
            onSetError("Connection timed out waiting for coordinates. Try searching textually instead.");
            break;
          default:
            onSetError("An unexpected error occurred while localizing via GPS.");
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  };

  const getCategoryColor = (catId: string) => CATEGORIES.find(c => c.id === catId)?.color || "indigo-500";

  if (renderMode === "search") {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-3.5 h-full">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">Find Places</h2>
        <form onSubmit={handleSubmit} className="space-y-3 flex flex-col justify-between flex-1">
          <div className="space-y-3">
            {/* Text Input with suggestions */}
            <div className="relative" ref={suggestionsRef}>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Search className="h-4.5 w-4.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search city or street..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white transition-all font-sans"
                />
                {isSearchingSuggestions && (
                  <span className="absolute inset-y-0 right-3 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  </span>
                )}
              </div>

              {/* Floating Suggestions List */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute left-0 right-0 z-[1010] mt-1.5 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-950"
                  >
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSuggestionSelect(sug)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate">{sug.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {/* GPS Locate button */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer"
            >
              {isLocating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-650" />
              ) : (
                <Navigation className="h-3.5 w-3.5 text-indigo-600" />
              )}
              GPS Locate
            </button>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Compass className="h-3.5 w-3.5" />
              )}
              Scan Spaces
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (renderMode === "filters") {
    const radiusOptions = [1, 3, 5, 10];
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-4 h-full">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono mb-1">Filters</h2>
        
        {/* Radius selector */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-2 block">
            Search Radius
          </label>
          <div className="flex justify-between gap-1.5">
            {radiusOptions.map((opt) => {
              const active = searchRadius === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSearchRadius(opt)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center ${
                    active
                      ? "bg-indigo-600 border border-indigo-600 text-white shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}
                >
                  {opt}KM
                </button>
              );
            })}
          </div>
        </div>

        {/* Categories selector */}
        <div className="flex-1 space-y-2">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono block mb-2">
            Categories
          </label>
          <div className="grid grid-cols-2 gap-1.5 overflow-y-auto max-h-[220px] pr-0.5">
            {/* "All" categories selection button */}
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200/50 text-slate-700 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${selectedCategory === "all" ? "bg-indigo-600" : "bg-slate-400"}`}></span>
              All Types
            </button>

            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              const colorHex = getCategoryColor(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] transition-all cursor-pointer ${
                    active
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200/50 text-slate-600 font-semibold dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: `var(--color-${colorHex})` }}
                  ></span>
                  <span className="truncate">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("all");
              setSearchRadius(3); // default is 3
            }}
            className="w-full flex items-center justify-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100/80 p-2.5 rounded-xl border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900 dark:text-indigo-400 transition-all cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="search-section" className="w-full">
      
      {/* Visual Hero Banner Title */}
      <div className="mb-6 text-center md:text-left">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white md:text-3xl font-sans">
          Discover Places Around You
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Enter a location or use your browser GPS, choose a category, and find the closest services.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 backdrop-blur-sm">
        
        {/* Core Search forms row */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row">
          
          {/* Text Input with suggestions */}
          <div className="relative flex-1" ref={suggestionsRef}>
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
              Search Area Point
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                <Search className="h-5 w-5" />
              </span>
              <input
                type="text"
                placeholder="Type location (e.g. London, Seattle, Paris...)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-3.5 pl-11 pr-10 text-sm font-medium text-zinc-950 shadow-inner outline-none transition-colors focus:border-rose-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-white dark:focus:border-amber-500 dark:focus:bg-zinc-950"
              />
              {isSearchingSuggestions && (
                <span className="absolute inset-y-0 right-3 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                </span>
              )}
            </div>

            {/* Floating Auto-complete Recommendations list */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute left-0 right-0 z-[1010] mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-zinc-200 bg-white/95 py-1.5 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95"
                >
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionSelect(sug)}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-xs font-medium text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <MapPin className="h-4.5 w-4.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{sug.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search Radius dropdown */}
          <div className="w-full lg:w-44">
            <label className="mb-1.5 block text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
              Search Radius
            </label>
            <div className="relative">
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full appearance-none rounded-xl border border-zinc-200 bg-zinc-50 py-3.5 pl-4 pr-10 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-rose-500 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300 dark:focus:border-amber-500"
              >
                <option value={1}>1 km (Short)</option>
                <option value={3}>3 km (Local)</option>
                <option value={5}>5 km (Medium)</option>
                <option value={10}>10 km (Extended)</option>
              </select>
              <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-zinc-400">
                <ChevronDown className="h-4 w-4" />
              </span>
            </div>
          </div>

          {/* Form Quick Buttons */}
          <div className="flex items-end gap-2.5">
            {/* GPS Locate button */}
            <motion.button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300 dark:hover:bg-zinc-900 lg:w-max shrink-0 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLocating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-rose-500" />
                  Locating GPS...
                </>
              ) : (
                <>
                  <Navigation className="h-4 w-4 text-rose-500 animate-pulse" />
                  Use My Location
                </>
              )}
            </motion.button>

            {/* Core Search submit */}
            <motion.button
              type="submit"
              disabled={isLoading || isSearchingSuggestions}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100 lg:w-max shrink-0 cursor-pointer shadow-md"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Compass className="h-4.5 w-4.5" />
                  Scan Spaces
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* Quick Horizontal Category Filters list */}
        <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-zinc-800/80">
          <label className="mb-2 block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">
            Category Filters
          </label>
          <div className="flex flex-wrap gap-2">
            {/* "All" categories item */}
            <button
              onClick={() => setSelectedCategory("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-950"
                  : "bg-zinc-100 text-zinc-650 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              All Types
            </button>

            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
              
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? `bg-${cat.color} text-white shadow-sm`
                      : `bg-zinc-100 text-zinc-650 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700`
                  }`}
                  style={isActive ? { backgroundColor: `var(--color-${cat.color})` } : undefined}
                >
                  <span className={`h-2 w-2 rounded-full ${isActive ? "bg-white" : ""}`} style={!isActive ? { backgroundColor: `var(--color-${cat.color})` } : undefined}></span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
