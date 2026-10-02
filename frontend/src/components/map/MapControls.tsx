import React from 'react';
import { Layers, Truck, AlertCircle, Trash2, Route as RouteIcon, Building, Moon, Sun, LocateFixed } from 'lucide-react';

export interface MapLayerVisibility {
  vehicles: boolean;
  requests: boolean;
  bins: boolean;
  routes: boolean;
  facilities: boolean;
}

interface MapControlsProps {
  layers: MapLayerVisibility;
  onToggleLayer: (layer: keyof MapLayerVisibility) => void;
  mapTheme: 'dark' | 'standard';
  onToggleTheme: () => void;
  onRecenter: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  layers,
  onToggleLayer,
  mapTheme,
  onToggleTheme,
  onRecenter
}) => {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      {/* Layer Toggles Floating Card */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl text-xs text-slate-200 min-w-[200px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 font-semibold text-slate-300">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>GIS Map Layers</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            {Object.values(layers).filter(Boolean).length}/5
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/60 px-1.5 py-1 rounded transition-colors">
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-sky-400" />
              <span>Fleet Vehicles</span>
            </div>
            <input
              type="checkbox"
              checked={layers.vehicles}
              onChange={() => onToggleLayer('vehicles')}
              className="accent-blue-500 rounded cursor-pointer w-3.5 h-3.5"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/60 px-1.5 py-1 rounded transition-colors">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Pickup Requests</span>
            </div>
            <input
              type="checkbox"
              checked={layers.requests}
              onChange={() => onToggleLayer('requests')}
              className="accent-blue-500 rounded cursor-pointer w-3.5 h-3.5"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/60 px-1.5 py-1 rounded transition-colors">
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Smart IoT Bins</span>
            </div>
            <input
              type="checkbox"
              checked={layers.bins}
              onChange={() => onToggleLayer('bins')}
              className="accent-blue-500 rounded cursor-pointer w-3.5 h-3.5"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/60 px-1.5 py-1 rounded transition-colors">
            <div className="flex items-center gap-2">
              <RouteIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Optimized Routes</span>
            </div>
            <input
              type="checkbox"
              checked={layers.routes}
              onChange={() => onToggleLayer('routes')}
              className="accent-blue-500 rounded cursor-pointer w-3.5 h-3.5"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer hover:bg-slate-800/60 px-1.5 py-1 rounded transition-colors">
            <div className="flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-purple-400" />
              <span>Plants & Depot</span>
            </div>
            <input
              type="checkbox"
              checked={layers.facilities}
              onChange={() => onToggleLayer('facilities')}
              className="accent-blue-500 rounded cursor-pointer w-3.5 h-3.5"
            />
          </label>
        </div>
      </div>

      {/* Quick Action Utility Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onToggleTheme}
          title={mapTheme === 'dark' ? 'Switch to Standard Map' : 'Switch to Dark Map'}
          className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-800 text-slate-200 p-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          {mapTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-sky-400" />
          )}
        </button>

        <button
          onClick={onRecenter}
          title="Recenter to Mumbai Metropolitan Region"
          className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-800 text-slate-200 px-3 py-2 rounded-xl shadow-lg transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          <LocateFixed className="w-4 h-4 text-emerald-400" />
          <span>Recenter</span>
        </button>
      </div>
    </div>
  );
};
