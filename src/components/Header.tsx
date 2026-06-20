import { motion } from "motion/react";
import { Compass, Sun, Moon, Info, Heart, History, MapPin } from "lucide-react";

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onOpenAboutModal: () => void;
  onToggleSidebar: (tab: "history" | "favorites" | null) => void;
  activeSidebarTab: "history" | "favorites" | null;
  favoritesCount: number;
}

export default function Header({
  darkMode,
  onToggleTheme,
  onOpenAboutModal,
  onToggleSidebar,
  activeSidebarTab,
  favoritesCount,
}: HeaderProps) {
  return (
    <header id="app-header" className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Title */}
        <motion.div 
          onClick={() => onToggleSidebar(null)}
          className="flex cursor-pointer items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/10">
            <Compass className="h-6 w-6 animate-spin-slow text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white sm:text-lg">
              Nearby Places Finder
            </h1>
            <p className="hidden text-[10px] font-medium text-zinc-400 dark:text-zinc-500 font-mono sm:block">
              GEOAPIFY GEOSPATIAL LAB
            </p>
          </div>
        </motion.div>

        {/* Global Action Handlers */}
        <div className="flex items-center gap-3">
          
          {/* Main Action Links */}
          <nav className="hidden items-center gap-1.5 md:flex">
            <button
              onClick={() => onToggleSidebar(null)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSidebarTab === null
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-650 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              <MapPin className="h-4.5 w-4.5" />
              Main Map
            </button>

            <button
              onClick={() => onToggleSidebar("history")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSidebarTab === "history"
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-650 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              <History className="h-4.5 w-4.5" />
              History
            </button>

            <button
              onClick={() => onToggleSidebar("favorites")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors relative ${
                activeSidebarTab === "favorites"
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                  : "text-zinc-650 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              <Heart className="h-4.5 w-4.5" />
              Saved Places
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {favoritesCount}
                </span>
              )}
            </button>
          </nav>

          {/* Quick Nav Icon Buttons (Visible on Mobile) */}
          <div className="flex items-center gap-1 border-r border-zinc-200/60 pr-1.5 dark:border-zinc-800/60 md:hidden">
            <button
              onClick={() => onToggleSidebar("history")}
              className={`p-2 rounded-lg ${
                activeSidebarTab === "history" ? "text-rose-500 bg-rose-500/5" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <History className="h-5 w-5" />
            </button>
            <button
              onClick={() => onToggleSidebar("favorites")}
              className={`p-2 rounded-lg relative ${
                activeSidebarTab === "favorites" ? "text-rose-500 bg-rose-500/5" : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <Heart className="h-5 w-5" />
              {favoritesCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500"></span>
              )}
            </button>
          </div>

          {/* About / Info */}
          <button
            onClick={onOpenAboutModal}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
            title="About Geo Lab Project"
          >
            <Info className="h-5 w-5" />
          </button>

          {/* Theme Switcher Toggle */}
          <motion.button
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <motion.div
              initial={false}
              animate={{ rotate: darkMode ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-zinc-700" />}
            </motion.div>
          </motion.button>

        </div>
      </div>
    </header>
  );
}
