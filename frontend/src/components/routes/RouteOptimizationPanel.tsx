import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  AlertTriangle,
  Flame,
  Truck,
  Settings2,
  CheckCircle2
} from 'lucide-react';
import type { CapacityOptimizationSummary } from '../../engines/capacityOptimizer';
import { DEFAULT_ASSIGNMENT_WEIGHTS } from '../../engines/vehicleAssignment';
import type { AssignmentWeights } from '../../engines/vehicleAssignment';
import { formatDistanceKm } from '../../utils/geoUtils';
import { formatWeightKg } from '../../utils/routeUtils';

interface RouteOptimizationPanelProps {
  isOptimizing: boolean;
  onOptimizeFleet: () => void;
  onSimulateCriticalRequest: () => void;
  onSimulateVehicleFailure: () => void;
  onSimulateMissedPickup: () => void;
  onReset: () => void;
  capacitySummary?: CapacityOptimizationSummary | null;
  assignedCount: number;
  unassignedCount: number;
}

export const RouteOptimizationPanel: React.FC<RouteOptimizationPanelProps> = ({
  isOptimizing,
  onOptimizeFleet,
  onSimulateCriticalRequest,
  onSimulateVehicleFailure,
  onSimulateMissedPickup,
  onReset,
  capacitySummary,
  assignedCount,
  unassignedCount
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const weights: AssignmentWeights = DEFAULT_ASSIGNMENT_WEIGHTS;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-left space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Fleet Optimization & Operations</h3>
            <p className="text-[11px] text-slate-400">Deterministic Multi-Factor Routing Engine</p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Optimization Weights"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Action Button: OPTIMIZE FLEET */}
      <button
        onClick={onOptimizeFleet}
        disabled={isOptimizing}
        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isOptimizing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Calculating Deterministic Routes...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>OPTIMIZE FLEET ROUTES</span>
          </>
        )}
      </button>

      {/* Configurable Optimization Weights Drawer */}
      {showSettings && (
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">
            Active Multi-Factor Weights
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Priority Weight:</span>
              <span className="font-mono text-amber-400">{Math.round(weights.priority * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Capacity Weight:</span>
              <span className="font-mono text-emerald-400">{Math.round(weights.capacity * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Distance Weight:</span>
              <span className="font-mono text-sky-400">{Math.round(weights.distance * 100)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fleet Balance:</span>
              <span className="font-mono text-indigo-400">{Math.round(weights.fleetUtilization * 100)}%</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-slate-400">Vehicle Position Proximity:</span>
              <span className="font-mono text-purple-400">{Math.round(weights.vehiclePosition * 100)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Summary Card when generated */}
      {capacitySummary && (
        <div className="bg-slate-950/60 p-3 rounded-xl border border-emerald-500/30 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>FLEET OPTIMIZATION COMPLETE</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
            <div>
              <span className="text-slate-400">Vehicles Used:</span>{' '}
              <strong className="text-white font-mono">{capacitySummary.vehiclesUsed}</strong>
            </div>
            <div>
              <span className="text-slate-400">Average Utilization:</span>{' '}
              <strong className="text-emerald-400 font-mono">
                {capacitySummary.afterAvgUtilization}%
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Total Load:</span>{' '}
              <strong className="text-white font-mono">
                {formatWeightKg(capacitySummary.totalLoadKg)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Total Distance:</span>{' '}
              <strong className="text-sky-400 font-mono">
                {formatDistanceKm(capacitySummary.totalDistanceKm)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400">Requests Assigned:</span>{' '}
              <strong className="text-white font-mono">{assignedCount}</strong>
            </div>
            <div>
              <span className="text-slate-400">Unassigned:</span>{' '}
              <strong className="text-amber-400 font-mono">{unassignedCount}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Simulation / Demo Action Buttons */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Dynamic Incident & Event Simulator
        </span>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSimulateCriticalRequest}
            className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Critical Request</span>
          </button>

          <button
            onClick={onSimulateVehicleFailure}
            className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Vehicle Failure</span>
          </button>

          <button
            onClick={onSimulateMissedPickup}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
          >
            <Truck className="w-3.5 h-3.5 text-slate-400" />
            <span>Missed Pickup</span>
          </button>

          <button
            onClick={onReset}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
