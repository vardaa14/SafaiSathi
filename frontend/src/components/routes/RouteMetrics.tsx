import type { FleetMetrics } from '../../utils/routeUtils';
import { formatWeightKg } from '../../utils/routeUtils';
import { formatDistanceKm } from '../../utils/geoUtils';
import {
  Activity,
  Gauge,
  MapPin,
  TrendingUp,
  Truck,
  CheckCircle2,
  AlertOctagon,
  Sparkles
} from 'lucide-react';

interface RouteMetricsProps {
  metrics: FleetMetrics;
}

export const RouteMetrics: React.FC<RouteMetricsProps> = ({ metrics }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-left">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-sm text-white">Consolidated Fleet & Routing Metrics</h3>
        </div>
        <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Live Telemetry Data
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Route Distance */}
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>Total Distance</span>
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="font-bold text-base text-white">
            {formatDistanceKm(metrics.totalDistanceKm)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Avg: {metrics.avgDistancePerVehicleKm} km/truck
          </div>
        </div>

        {/* Fleet Utilization */}
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>Avg Utilization</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="font-bold text-base text-emerald-400">
            {metrics.averageFleetUtilization}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {metrics.vehiclesUsed} of {metrics.totalVehicles} trucks active
          </div>
        </div>

        {/* Total Collected Payload */}
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>Allocated Payload</span>
            <Truck className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="font-bold text-base text-white">
            {formatWeightKg(metrics.totalLoadKg)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Capacity: {formatWeightKg(metrics.totalCapacityKg)}
          </div>
        </div>

        {/* Route Efficiency */}
        <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span>Route Efficiency</span>
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="font-bold text-base text-sky-400">
            {metrics.routeEfficiency}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Collection vs Transit ratio
          </div>
        </div>
      </div>

      {/* Assignment Status Pill Row */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">
            Requests Fulfilled:{' '}
            <strong className="text-white font-mono">{metrics.requestsAssigned}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-400" />
          <span className="text-slate-300">
            Pending / Unassigned:{' '}
            <strong className="text-amber-400 font-mono">{metrics.requestsUnassigned}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
