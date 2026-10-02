import type { Route } from '../../types/route';
import { RouteDetails } from './RouteDetails';
import { RouteMetrics } from './RouteMetrics';
import { RouteOptimizationPanel } from './RouteOptimizationPanel';
import { RouteEvent } from './RouteEvent';
import type { CapacityOptimizationSummary } from '../../engines/capacityOptimizer';
import type { ReroutingProposal } from '../../engines/reroutingEngine';
import type { FleetMetrics } from '../../utils/routeUtils';
import { formatDistanceKm, formatDurationMin } from '../../utils/geoUtils';
import { Route as RouteIcon } from 'lucide-react';

interface RouteDashboardProps {
  routes: Route[];
  selectedRouteId?: string | null;
  onSelectRoute: (route: Route | null) => void;
  metrics: FleetMetrics;
  reroutingProposal?: ReroutingProposal | null;
  onApproveProposal: (proposal: ReroutingProposal) => void;
  onRejectProposal: (proposal: ReroutingProposal) => void;
  isOptimizing: boolean;
  onOptimizeFleet: () => void;
  onSimulateCriticalRequest: () => void;
  onSimulateVehicleFailure: () => void;
  onSimulateMissedPickup: () => void;
  onReset: () => void;
  capacitySummary?: CapacityOptimizationSummary | null;
}

export const RouteDashboard: React.FC<RouteDashboardProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  metrics,
  reroutingProposal,
  onApproveProposal,
  onRejectProposal,
  isOptimizing,
  onOptimizeFleet,
  onSimulateCriticalRequest,
  onSimulateVehicleFailure,
  onSimulateMissedPickup,
  onReset,
  capacitySummary
}) => {
  const selectedRoute = routes.find(r => r.routeId === selectedRouteId) || null;

  return (
    <div className="space-y-4">
      {/* Dynamic Recalculation Alert Banner if triggered */}
      {reroutingProposal && (
        <RouteEvent
          proposal={reroutingProposal}
          onApprove={onApproveProposal}
          onReject={onRejectProposal}
        />
      )}

      {/* Optimization Control Card */}
      <RouteOptimizationPanel
        isOptimizing={isOptimizing}
        onOptimizeFleet={onOptimizeFleet}
        onSimulateCriticalRequest={onSimulateCriticalRequest}
        onSimulateVehicleFailure={onSimulateVehicleFailure}
        onSimulateMissedPickup={onSimulateMissedPickup}
        onReset={onReset}
        capacitySummary={capacitySummary}
        assignedCount={metrics.requestsAssigned}
        unassignedCount={metrics.requestsUnassigned}
      />

      {/* Fleet-level Metrics */}
      <RouteMetrics metrics={metrics} />

      {/* Selected Route Detailed View */}
      {selectedRoute && (
        <RouteDetails route={selectedRoute} onClose={() => onSelectRoute(null)} />
      )}

      {/* Routes List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-left">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-sm text-white">Active Optimized Trajectories</h3>
          </div>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {routes.filter(r => r.stops.length > 2).length} Active Routes
          </span>
        </div>

        <div className="space-y-2.5">
          {routes.map(route => {
            const isSelected = selectedRouteId === route.routeId;
            const hasStops = route.stops.length > 2;

            return (
              <div
                key={route.routeId}
                onClick={() => onSelectRoute(isSelected ? null : route)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                  isSelected
                    ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500 shadow-lg'
                    : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: route.color }}
                    />
                    <span className="font-bold text-sm text-white">{route.routeId}</span>
                    <span className="text-xs text-slate-400">({route.vehicleId})</span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                      hasStops
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {hasStops ? `${route.stops.length} Stops` : 'Idle'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60 mt-2">
                  <div>
                    <span className="text-slate-400 block">Distance</span>
                    <span className="font-semibold text-white">
                      {formatDistanceKm(route.distanceKm)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ETA</span>
                    <span className="font-semibold text-sky-400">
                      {formatDurationMin(route.estimatedTimeMin)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Load</span>
                    <span className="font-semibold text-emerald-400">
                      {route.expectedLoadKg} kg ({route.utilization}%)
                    </span>
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
