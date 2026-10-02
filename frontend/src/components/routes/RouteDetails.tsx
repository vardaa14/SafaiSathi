import type { Route } from '../../types/route';
import { getStatusBadgeClasses, getPriorityColor } from '../../utils/routeUtils';
import { formatDistanceKm, formatDurationMin } from '../../utils/geoUtils';
import {
  Route as RouteIcon,
  Truck,
  X
} from 'lucide-react';

interface RouteDetailsProps {
  route: Route;
  onClose?: () => void;
}

export const RouteDetails: React.FC<RouteDetailsProps> = ({ route, onClose }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-left">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{
              backgroundColor: `${route.color}20`,
              borderColor: `${route.color}50`
            }}
          >
            <RouteIcon className="w-5 h-5" style={{ color: route.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">{route.routeId}</h3>
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: route.color }}
              />
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Truck className="w-3 h-3 text-slate-400" />
              <span>
                {route.vehicleId} • {route.driverName}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase font-mono ${getStatusBadgeClasses(
              route.status
            )}`}
          >
            {route.status}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-2 text-xs mb-3.5 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
        <div>
          <span className="text-[10px] text-slate-400 block">Distance</span>
          <span className="font-bold text-white text-xs">
            {formatDistanceKm(route.distanceKm)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Estimated ETA</span>
          <span className="font-bold text-sky-400 text-xs">
            {formatDurationMin(route.estimatedTimeMin)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Target Load</span>
          <span className="font-bold text-emerald-400 text-xs">{route.expectedLoadKg} kg</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Utilization</span>
          <span className="font-bold text-amber-400 text-xs">{route.utilization}%</span>
        </div>
      </div>

      {/* Ordered Stop List Timeline */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
          <span>Ordered Waypoints & Stops</span>
          <span className="text-[11px] text-slate-400 font-mono">
            {route.stops.length} Total Waypoints
          </span>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {route.stops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === route.stops.length - 1;
            const priorityColor = stop.priority ? getPriorityColor(stop.priority) : '#64748B';

            return (
              <div
                key={`stop-row-${stop.id}-${index}`}
                className="flex items-start gap-2.5 p-2 bg-slate-800/30 hover:bg-slate-800/60 rounded-xl border border-slate-800/80 transition-colors text-xs"
              >
                {/* Number Badge */}
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 text-slate-900 shadow-sm mt-0.5"
                  style={{
                    backgroundColor: isFirst || isLast ? '#38BDF8' : priorityColor
                  }}
                >
                  {stop.stopOrder}
                </div>

                {/* Stop Content */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-white truncate text-xs">
                      {stop.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                      +{stop.estimatedArrivalMin} min
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-0.5">
                    <span className="capitalize">{stop.type.toLowerCase()} stop</span>
                    {stop.expectedLoadKg > 0 && (
                      <span className="font-semibold text-emerald-400">
                        +{stop.expectedLoadKg} kg
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
