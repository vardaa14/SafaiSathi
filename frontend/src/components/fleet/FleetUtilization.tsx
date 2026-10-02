import type { CapacityOptimizationSummary } from '../../engines/capacityOptimizer';
import { formatWeightKg } from '../../utils/routeUtils';
import { BarChart3, CheckCircle2, TrendingUp } from 'lucide-react';

interface FleetUtilizationProps {
  summary?: CapacityOptimizationSummary | null;
  vehiclesCount: number;
  totalCapacityKg: number;
  totalLoadKg: number;
}

export const FleetUtilization: React.FC<FleetUtilizationProps> = ({
  summary,
  vehiclesCount,
  totalCapacityKg,
  totalLoadKg
}) => {
  const currentAvgUtil =
    totalCapacityKg > 0 ? Math.round((totalLoadKg / totalCapacityKg) * 100) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl text-left">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">Fleet Capacity Utilization</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          {summary ? `${summary.afterAvgUtilization}% Avg Util` : `${currentAvgUtil}% Avg Util`}
        </span>
      </div>

      {/* Aggregate Metrics Header */}
      <div className="grid grid-cols-3 gap-2 text-xs mb-4">
        <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Fleet Capacity</span>
          <span className="font-bold text-white text-sm">{formatWeightKg(totalCapacityKg)}</span>
        </div>
        <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Allocated Load</span>
          <span className="font-bold text-emerald-400 text-sm">
            {formatWeightKg(summary ? summary.totalLoadKg : totalLoadKg)}
          </span>
        </div>
        <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Vehicles Active</span>
          <span className="font-bold text-sky-400 text-sm">
            {summary ? summary.vehiclesUsed : 0} / {vehiclesCount}
          </span>
        </div>
      </div>

      {/* Before vs After Optimization Comparison */}
      {summary ? (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Load Distribution (Before vs After Optimization)</span>
          </div>

          <div className="space-y-2.5">
            {summary.afterUtilizations.map((after, index) => {
              const before = summary.beforeUtilizations[index];
              const beforePct = before ? before.utilizationPercentage : 0;
              const afterPct = after.utilizationPercentage;

              return (
                <div
                  key={after.vehicleId}
                  className="p-2.5 bg-slate-800/30 rounded-xl border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{after.vehicleId}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({after.assignedLoadKg} / {after.capacityKg} kg)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      {beforePct !== afterPct ? (
                        <>
                          <span className="text-slate-400 line-through">{beforePct}%</span>
                          <span className="text-emerald-400">➔ {afterPct}%</span>
                        </>
                      ) : (
                        <span className="text-slate-200">{afterPct}%</span>
                      )}
                    </div>
                  </div>

                  {/* Dual Bar (Before ghost vs After solid) */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        afterPct > 85
                          ? 'bg-rose-500'
                          : afterPct > 55
                          ? 'bg-emerald-500'
                          : afterPct > 0
                          ? 'bg-blue-500'
                          : 'bg-slate-700'
                      }`}
                      style={{ width: `${afterPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {summary.reassignedRequestsCount > 0 && (
            <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-start gap-2 mt-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>
                Capacity balancing completed: {summary.reassignedRequestsCount} pickup stops
                reallocated to prevent truck bottlenecking and minimize carbon emissions.
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-400">
          Run <span className="font-bold text-blue-400">Optimize Fleet</span> to calculate and
          level truck capacity allocations.
        </div>
      )}
    </div>
  );
};
