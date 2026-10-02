import type { Vehicle } from '../../types/vehicle';
import type { Route } from '../../types/route';
import { formatWeightKg, getStatusBadgeClasses } from '../../utils/routeUtils';
import {
  Truck,
  User,
  Phone,
  Fuel,
  Gauge,
  CheckCircle2,
  Clock,
  X,
  Route as RouteIcon,
  ShieldAlert
} from 'lucide-react';

interface VehicleDetailsProps {
  vehicle: Vehicle;
  activeRoute?: Route | null;
  onClose: () => void;
  onSimulateBreakdown?: (vehicleId: string) => void;
}

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicle,
  activeRoute,
  onClose,
  onSimulateBreakdown
}) => {
  const loadPercentage = Math.min(
    100,
    Math.round((vehicle.currentLoadKg / vehicle.capacityKg) * 100)
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-left">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
            style={{
              backgroundColor: `${vehicle.color}18`,
              borderColor: `${vehicle.color}44`
            }}
          >
            <Truck className="w-5 h-5" style={{ color: vehicle.color }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white">{vehicle.id}</h3>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                {vehicle.registration}
              </span>
            </div>
            <p className="text-xs text-slate-400 capitalize">{vehicle.type.replace('_', ' ')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase font-mono tracking-wider ${getStatusBadgeClasses(
              vehicle.status
            )}`}
          >
            {vehicle.status}
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Driver Info */}
      <div className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl border border-slate-800 mb-3 text-xs">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          <div>
            <span className="text-slate-400 text-[10px] block">Assigned Driver</span>
            <span className="font-semibold text-white">{vehicle.driver}</span>
          </div>
        </div>
        {vehicle.driverPhone && (
          <div className="flex items-center gap-1.5 text-slate-300 font-mono">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{vehicle.driverPhone}</span>
          </div>
        )}
      </div>

      {/* Payload & Capacity Section */}
      <div className="mb-3.5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-slate-400">Current Payload Load</span>
          <span className="font-bold text-white">
            {formatWeightKg(vehicle.currentLoadKg)} / {formatWeightKg(vehicle.capacityKg)} ({loadPercentage}%)
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              loadPercentage > 85
                ? 'bg-rose-500'
                : loadPercentage > 60
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${loadPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-400 mt-1">
          <span>Remaining Capacity:</span>
          <span className="font-semibold text-emerald-400">
            {formatWeightKg(vehicle.remainingCapacityKg)}
          </span>
        </div>
      </div>

      {/* Real-time Telemetry Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3.5">
        <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-2.5">
          <Fuel className="w-4 h-4 text-amber-400" />
          <div>
            <span className="text-[10px] text-slate-400 block">Fuel / Battery</span>
            <span className="font-bold text-white text-sm">{vehicle.fuel}%</span>
          </div>
        </div>

        <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-2.5">
          <Gauge className="w-4 h-4 text-sky-400" />
          <div>
            <span className="text-[10px] text-slate-400 block">Telemetry Speed</span>
            <span className="font-bold text-white text-sm">{vehicle.speed} km/h</span>
          </div>
        </div>

        <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <div>
            <span className="text-[10px] text-slate-400 block">Completed Stops</span>
            <span className="font-bold text-white text-sm">{vehicle.completedStops} stops</span>
          </div>
        </div>

        <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-indigo-400" />
          <div>
            <span className="text-[10px] text-slate-400 block">Remaining Stops</span>
            <span className="font-bold text-white text-sm">{vehicle.remainingStops} stops</span>
          </div>
        </div>
      </div>

      {/* Active Route Preview */}
      {activeRoute ? (
        <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-500/30 text-xs mb-3">
          <div className="flex items-center justify-between font-semibold text-indigo-300 mb-1.5">
            <div className="flex items-center gap-1.5">
              <RouteIcon className="w-3.5 h-3.5" />
              <span>Assigned Route: {activeRoute.routeId}</span>
            </div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
              {activeRoute.distanceKm} km • {activeRoute.estimatedTimeMin} min
            </span>
          </div>
          <div className="text-[11px] text-slate-300">
            Total Stops: {activeRoute.stops.length} • Expected Waste: {activeRoute.expectedLoadKg} kg
          </div>
        </div>
      ) : (
        <div className="p-2.5 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-400 mb-3">
          Vehicle is currently waiting for assignment at Depot.
        </div>
      )}

      {/* Simulation Breakdown Trigger */}
      {onSimulateBreakdown && vehicle.status !== 'MAINTENANCE' && (
        <button
          onClick={() => onSimulateBreakdown(vehicle.id)}
          className="w-full py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Simulate Breakdown for {vehicle.id}</span>
        </button>
      )}
    </div>
  );
};
