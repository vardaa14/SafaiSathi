import { useState } from 'react';
import type { Vehicle } from '../../types/vehicle';
import type { Route } from '../../types/route';
import type { CapacityOptimizationSummary } from '../../engines/capacityOptimizer';
import { VehicleCard } from './VehicleCard';
import { VehicleDetails } from './VehicleDetails';
import { FleetUtilization } from './FleetUtilization';
import { Truck } from 'lucide-react';

interface FleetDashboardProps {
  vehicles: Vehicle[];
  routes: Route[];
  capacitySummary?: CapacityOptimizationSummary | null;
  selectedVehicle?: Vehicle | null;
  onSelectVehicle: (vehicle: Vehicle | null) => void;
  onSimulateBreakdown?: (vehicleId: string) => void;
}

export const FleetDashboard: React.FC<FleetDashboardProps> = ({
  vehicles,
  routes,
  capacitySummary,
  selectedVehicle,
  onSelectVehicle,
  onSimulateBreakdown
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredVehicles = vehicles.filter(v => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'ACTIVE') return v.status === 'ASSIGNED' || v.status === 'EN_ROUTE' || v.status === 'COLLECTING';
    if (filterStatus === 'AVAILABLE') return v.status === 'AVAILABLE';
    if (filterStatus === 'MAINTENANCE') return v.status === 'MAINTENANCE' || v.status === 'OFFLINE';
    return true;
  });

  const totalCapacityKg = vehicles.reduce((acc, v) => acc + v.capacityKg, 0);
  const totalLoadKg = vehicles.reduce((acc, v) => acc + v.currentLoadKg, 0);

  const activeRoute = selectedVehicle
    ? routes.find(r => r.vehicleId === selectedVehicle.id)
    : null;

  return (
    <div className="space-y-4">
      {/* Selected Vehicle Detail Focus */}
      {selectedVehicle && (
        <VehicleDetails
          vehicle={selectedVehicle}
          activeRoute={activeRoute}
          onClose={() => onSelectVehicle(null)}
          onSimulateBreakdown={onSimulateBreakdown}
        />
      )}

      {/* Fleet Utilization Progress */}
      <FleetUtilization
        summary={capacitySummary}
        vehiclesCount={vehicles.length}
        totalCapacityKg={totalCapacityKg}
        totalLoadKg={totalLoadKg}
      />

      {/* Vehicle Grid List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-left">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm text-white">Fleet Telematics & Roster</h3>
            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {filteredVehicles.length} trucks
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
            {['ALL', 'ACTIVE', 'AVAILABLE', 'MAINTENANCE'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredVehicles.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isSelected={selectedVehicle?.id === vehicle.id}
              onSelect={onSelectVehicle}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
