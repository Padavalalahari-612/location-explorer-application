import { motion } from "motion/react";
import { X, Cpu, Code, BookOpen, Mail, ChevronRight, Terminal, Zap, FileJson } from "lucide-react";
import { useState } from "react";

interface AboutContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

export default function AboutContactModal({ isOpen, onClose, userEmail }: AboutContactModalProps) {
  const [activeTab, setActiveTab] = useState<"project" | "local" | "api" | "future">("project");

  if (!isOpen) return null;

  const mockGeocodingResponse = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "London",
          "country": "United Kingdom",
          "city": "London",
          "postcode": "SW1A 1AA",
          "place_id": "51a3ee42a...",
          "formatted": "London, Great Britain"
        },
        "geometry": {
          "type": "Point",
          "coordinates": [-0.1278, 51.5074]
        }
      }
    ]
  };

  const mockPlacesResponse = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "Brew & Bean Cafe",
          "address_line2": "12 Baker St, London",
          "categories": ["catering.cafe", "catering.cafe.espresso"],
          "distance": 140,
          "datasource": {
            "raw": {
              "phone": "+44 20 7946 0192",
              "website": "https://example.com/brew"
            }
          }
        },
        "geometry": {
          "type": "Point",
          "coordinates": [-0.1245, 51.5091]
        }
      }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative flex flex-col w-full max-w-3xl h-[85vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden font-sans text-zinc-800 dark:text-zinc-100"
      >
        
        {/* Modal Title bar */}
        <div className="flex items-center justify-between border-b border-zinc-200/60 px-6 py-4 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-rose-500" />
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">Academic Portfolio Blueprint</h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">NEARBY PLACES FINDER — COMPUTER SCIENCE PROJECT</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-150 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Navigation Columns Tabs */}
        <div className="flex border-b border-zinc-200/60 bg-zinc-50/50 dark:border-zinc-800/60 dark:bg-zinc-950/30">
          {(
            [
              { id: "project", label: "Project Overview", icon: BookOpen },
              { id: "local", label: "Run Locally", icon: Terminal },
              { id: "api", label: "Geoapify API Specs", icon: FileJson },
              { id: "future", label: "Future Extensions", icon: Code },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  active
                    ? "border-rose-500 text-rose-500 bg-rose-50/5 dark:border-amber-500 dark:text-amber-500"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scroll panels body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "project" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-150 bg-zinc-50/55 dark:border-zinc-800/50 dark:bg-zinc-950/35">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">CS Project Thesis Abstract</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  This application acts as a high-density GIS web platform showing how client applications coordinate with Georeferencing endpoints of external Map/Spatial provider services. Designed defensively using asynchronous concurrency primitives (<strong>async/await</strong>), the stack parses geolocation frames to fetch restaurants, cafes, hospitals, hotels, parks, and other essential public facilities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-zinc-150 rounded-xl p-4 dark:border-zinc-800/40">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-1">
                    <Zap className="h-4 w-4 text-amber-500" /> Key Engineering Patterns
                  </h4>
                  <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-2 list-none pl-0">
                    <li className="flex items-start gap-1"><ChevronRight className="h-3.5 w-3.5 mt-0.5 text-rose-500" /> <span>Unified Local Storage persistence for favorites & searches</span></li>
                    <li className="flex items-start gap-1"><ChevronRight className="h-3.5 w-3.5 mt-0.5 text-rose-500" /> <span>Direct Leaflet.js element reference integration</span></li>
                    <li className="flex items-start gap-1"><ChevronRight className="h-3.5 w-3.5 mt-0.5 text-rose-500" /> <span>Tailwind CSS dynamic class badge configuration</span></li>
                  </ul>
                </div>

                {/* Personalized student section */}
                <div className="border border-zinc-150 rounded-xl p-4 dark:border-zinc-800/40 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-1">Student / Author Node</h4>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2 font-mono">COMP-SCI ACADEMIC METADATA</p>
                    <div className="p-2 bg-rose-500/5 rounded-lg border border-rose-500/10 space-y-1 text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                      <p><strong>Candidate:</strong> CS Portfolio Student</p>
                      <p><strong>Email:</strong> {userEmail || "padavalalahari06@gmail.com"}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end">
                    <a
                      href={`mailto:${userEmail || "padavalalahari06@gmail.com"}`}
                      className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-rose-500 hover:underline"
                    >
                      Retrieve Candidate Contact <Mail className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOCAL SETUP */}
          {activeTab === "local" && (
            <div className="space-y-4 font-mono text-xs">
              <h4 className="font-bold text-zinc-900 dark:text-white font-sans text-sm">Step-by-Step Local Deployment</h4>
              
              <div className="space-y-3 bg-zinc-950 text-emerald-400 p-4 rounded-xl border border-zinc-800 overflow-x-auto text-[11px] leading-relaxed">
                <p className="text-zinc-500"># 1. Clone the repository and navigate to root</p>
                <p>git clone https://github.com/your-username/NearbyPlacesFinder.git</p>
                <p>cd NearbyPlacesFinder</p>

                <p className="text-zinc-500 mt-2.5"># 2. Install all dependencies from package.json</p>
                <p>npm install</p>

                <p className="text-zinc-500 mt-2.5"># 3. Create a local environment properties file</p>
                <p>touch .env</p>
                <p className="text-zinc-400"># Write your Geoapify secret inside .env</p>
                <p>VITE_GEOAPIFY_API_KEY="your_free_geoapify_key_here"</p>

                <p className="text-zinc-500 mt-2.5"># 4. Boot up local Vite dev server on port 3000</p>
                <p>npm run dev</p>

                <p className="text-zinc-500 mt-2.5"># 5. Build for production (outputs static bundle to dist/)</p>
                <p>npm run build</p>
              </div>

              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs leading-normal text-zinc-500 dark:text-zinc-400 font-sans">
                <strong>Local Port Info:</strong> The local setup launches in Vite development mode running under <code>http://localhost:3000</code>. All asset resolution, hot module replacement, and client storage bindings map naturally.
              </div>
            </div>
          )}

          {/* TAB 3: API SPECIFICATION */}
          {activeTab === "api" && (
            <div className="space-y-4">
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Geoapify REST Integration Schema</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Below are the raw JSON payload signatures returned from the Geoapify geocoding search and nearby places service, representing standard GeoJSON structures.
              </p>

              <div className="space-y-3.5">
                {/* Geocoding specs */}
                <div>
                  <span className="inline-flex px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded font-mono mb-2">1. GEOPRIME GEOCODING SPEC</span>
                  <pre className="p-4 bg-zinc-950 text-blue-400 border border-zinc-800 rounded-xl overflow-x-auto text-[10px] max-h-48 leading-relaxed font-mono">
                    {JSON.stringify(mockGeocodingResponse, null, 2)}
                  </pre>
                </div>

                {/* Places specs */}
                <div>
                  <span className="inline-flex px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded font-mono mb-2">2. PLACES EXTRACTION SPEC</span>
                  <pre className="p-4 bg-zinc-950 text-emerald-400 border border-zinc-800 rounded-xl overflow-x-auto text-[10px] max-h-48 leading-relaxed font-mono">
                    {JSON.stringify(mockPlacesResponse, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FUTURE ENHANCEMENTS */}
          {activeTab === "future" && (
            <div className="space-y-4">
              <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Computer Science Academic Roadmap</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                If expanding this project into a full-length graduate thesis, the following microservice and routing modules represent excellent academic pathways:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-lg border border-zinc-150 hover:bg-zinc-50/20 dark:border-zinc-800/40 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                  <h5 className="font-bold text-zinc-900 dark:text-white">1. Isoline and Routing Isochrone Map</h5>
                  <p>Implement the Geoapify Isochrone API to draw polygons on the map displaying areas of reachable walkability times (e.g. 5m, 10m, 15m isolines).</p>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-150 hover:bg-zinc-50/20 dark:border-zinc-800/40 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                  <h5 className="font-bold text-zinc-900 dark:text-white">2. Progressive Web Application (PWA) Offline-Cache Module</h5>
                  <p>Add Service Workers caching map tiles locally within IndexedDB to allow search operations even in completely disconnected internet grids.</p>
                </div>

                <div className="p-3.5 rounded-lg border border-zinc-150 hover:bg-zinc-50/20 dark:border-zinc-800/40 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                  <h5 className="font-bold text-zinc-900 dark:text-white">3. Crowd-sourced Review & Analytics Backend</h5>
                  <p>Build a secure server utilizing Express Node.js, storing user-generated star rating coordinates in a PostgreSQL database mapped using Cloud SQL.</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between bg-zinc-50 px-6 py-4 dark:bg-zinc-950/60 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-[10px] text-zinc-400 font-mono">Academic License GPLv3 — Standard Candidate Work</p>
          <button
            onClick={onClose}
            className="rounded-lg bg-rose-500 hover:bg-rose-600 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-white px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow"
          >
            Acknowledge Blueprint
          </button>
        </div>

      </motion.div>
    </div>
  );
}
