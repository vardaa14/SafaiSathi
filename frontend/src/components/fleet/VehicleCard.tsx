import type { Vehicle } from '../../types/vehicle';
import { getStatusBadgeClasses } from '../../utils/routeUtils';
import { Fuel, Gauge, Navigation, User } from 'lucide-react';

interface VehicleCardProps {
  vehicle: Vehicle;
  isSelected?: boolean;
  onSelect: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  isSelected = false,
  onSelect
}) => {
  const loadPercentage = Math.min(
    100,
    Math.round((vehicle.currentLoadKg / vehicle.capacityKg) * 100)
  );

  return (
    <div
      onClick={() => onSelect(vehicle)}
      className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
        isSelected
          ? 'bg-slate-800/90 border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10'
          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
      }`}
    >
      {/* Header: ID, Registration & Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: vehicle.color }}
          />
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>{vehicle.id}</span>
              <span className="text-[11px] font-mono text-slate-400 font-normal">
                {vehicle.registration}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
              <User className="w-3 h-3 text-slate-400" />
              <span>{vehicle.driver}</span>
            </div>
          </div>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono tracking-wider ${getStatusBadgeClasses(
            vehicle.status
          )}`}
        >
          {vehicle.status}
        </span>
      </div>

      {/* Payload Bar */}
      <div className="mb-2.5">
        <div className="flex justify-between text-[11px] mb-1">
          <span className="text-slate-400">Payload Load</span>
          <span className="font-semibold text-slate-200">
            {vehicle.currentLoadKg} / {vehicle.capacityKg} kg ({loadPercentage}%)
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              loadPercentage > 85
                ? 'bg-rose-500'
                : loadPercentage > 60
                ? 'bg-amber-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${loadPercentage}%` }}
          />
        </div>
      </div>

      {/* Grid Telematics */}
      <div className="grid grid-cols-3 gap-1.5 text-[11px] bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
        <div className="flex items-center gap-1 text-slate-300">
          <Fuel className="w-3 h-3 text-amber-400" />
          <span>{vehicle.fuel}%</span>
        </div>
        <div className="flex items-center gap-1 text-slate-300">
          <Gauge className="w-3 h-3 text-sky-400" />
          <span>{vehicle.speed} km/h</span>
        </div>
        <div className="flex items-center gap-1 text-slate-300">
          <Navigation className="w-3 h-3 text-indigo-400" />
          <span>
            {vehicle.completedStops}/{vehicle.completedStops + vehicle.remainingStops} stops
          </span>
        </div>
      </div>
    </div>
  );
};
