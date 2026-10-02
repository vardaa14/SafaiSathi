import { useState } from 'react';
import type { PickupRequest } from '../../types/request';
import type { Vehicle } from '../../types/vehicle';
import {
  Truck,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  X,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import { formatWeightKg, getPriorityColor } from '../../utils/routeUtils';

interface TruckAllocationPanelProps {
  requests: PickupRequest[];
  vehicles: Vehicle[];
  isOptimizing: boolean;
  onOptimizeFleet: () => void;
  onManualAllocate: (requestId: string, vehicleId: string) => void;
  onManualDeallocate: (requestId: string) => void;
  onSelectVehicle: (vehicle: Vehicle | null) => void;
  selectedVehicleId?: string | null;
  onReset: () => void;
  onSwitchToReviewTab: () => void;
}

export const TruckAllocationPanel: React.FC<TruckAllocationPanelProps> = ({
  requests,
  vehicles,
  isOptimizing,
  onOptimizeFleet,
  onManualAllocate,
  onManualDeallocate,
  onSelectVehicle,
  selectedVehicleId,
  onReset,
  onSwitchToReviewTab
}) => {
  const [allocationFilter, setAllocationFilter] = useState<'ALL' | 'UNASSIGNED' | 'ASSIGNED'>('ALL');

  // Approved requests eligible for allocation
  const eligibleRequests = requests.filter(
    r => r.status === 'PRIORITIZED' || r.status === 'VALIDATED' || r.status === 'ASSIGNED' || r.status === 'EN_ROUTE'
  );

  const unallocatedRequests = eligibleRequests.filter(r => !r.assignedVehicleId);
  const allocatedRequests = eligibleRequests.filter(r => !!r.assignedVehicleId);

  const displayedRequests = eligibleRequests.filter(r => {
    if (allocationFilter === 'UNASSIGNED') return !r.assignedVehicleId;
    if (allocationFilter === 'ASSIGNED') return !!r.assignedVehicleId;
    return true;
  });

  const availableVehicles = vehicles.filter(
    v => v.status !== 'MAINTENANCE' && v.status !== 'OFFLINE'
  );

  const totalLoadKg = allocatedRequests.reduce((acc, r) => acc + r.quantityKg, 0);
  const totalCapacityKg = vehicles.reduce((acc, v) => acc + v.capacityKg, 0);

  return (
    <div className="space-y-4 text-left">
      {/* Action Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-base text-white">
                Section 2: Truck Allocation & Fleet Route Dispatch
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Allocate approved requests to collection trucks and generate optimized GIS routes.
            </p>
          </div>

          <button
            onClick={onSwitchToReviewTab}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span>Back to Request Review</span>
          </button>
        </div>

        {/* Primary Action Button: AUTO ALLOCATE & OPTIMIZE */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onOptimizeFleet}
            disabled={isOptimizing || eligibleRequests.length === 0}
            className="flex-1 w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isOptimizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Optimizing Fleet & Allocating Routes...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>OPTIMIZE & AUTO-ALLOCATE TRUCKS ({eligibleRequests.length} Approved Requests)</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition-colors cursor-pointer"
            title="Reset Fleet State"
          >
            <RotateCcw className="w-4 h-4 text-blue-400" />
          </button>
        </div>

        {/* Quick Fleet Capacity Progress Bar */}
        <div className="p-3.5 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Total Allocated Payload
            </span>
            <span className="font-bold text-white font-mono">
              {formatWeightKg(totalLoadKg)} / {formatWeightKg(totalCapacityKg)} (
              {totalCapacityKg > 0 ? Math.round((totalLoadKg / totalCapacityKg) * 100) : 0}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
              style={{
                width: `${totalCapacityKg > 0 ? Math.min(100, (totalLoadKg / totalCapacityKg) * 100) : 0}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Fleet Vehicles Roster Quick Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-sky-400" />
            <span>Available Municipal Fleet</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            {availableVehicles.length} of {vehicles.length} Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {vehicles.map(v => {
            const isSelected = selectedVehicleId === v.id;
            const freeCapacity = v.capacityKg - v.currentLoadKg;
            const utilPct = Math.min(100, Math.round((v.currentLoadKg / v.capacityKg) * 100));

            return (
              <div
                key={v.id}
                onClick={() => onSelectVehicle(isSelected ? null : v)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500/50 shadow-lg'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: v.color }}
                    />
                    <span>{v.id}</span>
                    <span className="text-[10px] font-normal text-slate-400">({v.driver})</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    {freeCapacity}kg free
                  </span>
                </div>

                {/* Mini Payload Bar */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden mb-1.5">
                  <div
                    className={`h-full ${
                      utilPct > 85 ? 'bg-rose-500' : utilPct > 50 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${utilPct}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>{v.currentLoadKg} / {v.capacityKg} kg</span>
                  <span>{utilPct}% full</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual / Individual Request Allocation Queue */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>Approved Collection Queue & Allocation</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Select or reassign trucks individually for approved citizen tickets.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setAllocationFilter('ALL')}
              className={`px-2.5 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
                allocationFilter === 'ALL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({eligibleRequests.length})
            </button>
            <button
              onClick={() => setAllocationFilter('UNASSIGNED')}
              className={`px-2.5 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
                allocationFilter === 'UNASSIGNED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Unallocated ({unallocatedRequests.length})
            </button>
            <button
              onClick={() => setAllocationFilter('ASSIGNED')}
              className={`px-2.5 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
                allocationFilter === 'ASSIGNED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Assigned ({allocatedRequests.length})
            </button>
          </div>
        </div>

        {displayedRequests.length === 0 ? (
          <div className="py-10 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-xs">
            <CheckCircle2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-bold">No approved requests in queue</p>
            <p className="text-slate-500 mt-0.5">
              Go to Section 1 to review and approve incoming citizen requests.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedRequests.map(req => {
              const priorityColor = getPriorityColor(req.priority);
              const assignedVehicle = req.assignedVehicleId
                ? vehicles.find(v => v.id === req.assignedVehicleId)
                : null;

              return (
                <div
                  key={`alloc-${req.id}`}
                  className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all text-xs text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 text-[11px]">
                        {req.id}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono text-black"
                        style={{ backgroundColor: priorityColor }}
                      >
                        {req.priority}
                      </span>
                      <span className="font-bold text-white text-xs truncate">
                        {req.address || req.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>{req.citizenName || 'Citizen Ticket'}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">{req.wasteType}</span>
                      <span>•</span>
                      <span className="text-white font-bold font-mono">{req.quantityKg} kg</span>
                      {assignedVehicle && (
                        <>
                          <span>•</span>
                          <span className="text-sky-400 font-semibold">Truck {assignedVehicle.id}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right allocation control */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={req.assignedVehicleId || ''}
                      onChange={e => {
                        const val = e.target.value;
                        if (val) {
                          onManualAllocate(req.id, val);
                        } else {
                          onManualDeallocate(req.id);
                        }
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs py-1.5 px-3 rounded-xl font-medium outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">-- Choose Truck --</option>
                      {availableVehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.id} ({v.driver} - {v.capacityKg - v.currentLoadKg}kg free)
                        </option>
                      ))}
                    </select>

                    {req.assignedVehicleId && (
                      <button
                        onClick={() => onManualDeallocate(req.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Unassign Truck"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
