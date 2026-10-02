import { Fragment } from 'react';
import type { ReroutingProposal } from '../../engines/reroutingEngine';
import { formatDistanceKm, formatDurationMin } from '../../utils/geoUtils';
import {
  CheckCircle2,
  XCircle,
  Truck,
  ShieldAlert
} from 'lucide-react';

interface RouteEventProps {
  proposal: ReroutingProposal;
  onApprove: (proposal: ReroutingProposal) => void;
  onReject: (proposal: ReroutingProposal) => void;
}

export const RouteEvent: React.FC<RouteEventProps> = ({ proposal, onApprove, onReject }) => {
  const { event, affectedVehicle, currentRoute, proposedRoute, distanceDeltaKm, timeDeltaMin, reason, explanation } =
    proposal;

  return (
    <div className="bg-slate-900 border-2 border-rose-500/80 rounded-2xl p-4 shadow-2xl text-left animate-pulse-border mb-4">
      {/* Banner Header */}
      <div className="flex items-center justify-between pb-3 border-b border-rose-500/30 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
            <ShieldAlert className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white tracking-wide uppercase flex items-center gap-1.5">
              <span>ROUTE RECALCULATION REQUIRED</span>
            </h3>
            <p className="text-xs text-rose-300 font-medium">{reason}</p>
          </div>
        </div>
        <span className="text-[10px] bg-rose-500 text-black font-bold px-2.5 py-0.5 rounded-full uppercase font-mono">
          {event.triggerType.replace('_', ' ')}
        </span>
      </div>

      {/* Explanation Callout */}
      <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800 mb-3 text-xs text-slate-300">
        <p className="text-slate-200 leading-relaxed">{explanation}</p>
      </div>

      {/* Vehicle and Metrics Comparison Card */}
      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/60 mb-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700/50">
          <span className="text-slate-400 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-blue-400" />
            Assigned Intercept Vehicle:
          </span>
          <span className="font-bold text-white">
            {affectedVehicle.id} ({affectedVehicle.driver})
          </span>
        </div>

        {/* Distance Comparison */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Current Route Distance</span>
            <span className="font-bold text-slate-300 text-sm">
              {formatDistanceKm(currentRoute.distanceKm)}
            </span>
          </div>

          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="text-[10px] text-rose-400 block">Proposed Route Distance</span>
            <span className="font-bold text-rose-300 text-sm">
              {formatDistanceKm(proposedRoute.distanceKm)}{' '}
              <span className="text-[11px] text-rose-400 font-semibold">
                (+{distanceDeltaKm} km)
              </span>
            </span>
          </div>
        </div>

        {/* ETA Comparison */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Current Total ETA</span>
            <span className="font-bold text-slate-300 text-sm">
              {formatDurationMin(currentRoute.estimatedTimeMin)}
            </span>
          </div>

          <div className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
            <span className="text-[10px] text-rose-400 block">Proposed New ETA</span>
            <span className="font-bold text-rose-300 text-sm">
              {formatDurationMin(proposedRoute.estimatedTimeMin)}{' '}
              <span className="text-[11px] text-rose-400 font-semibold">
                (+{timeDeltaMin} min)
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Stop Sequence Delta Preview */}
      <div className="text-[11px] text-slate-400 mb-3.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800">
        <span className="font-semibold text-slate-300 block mb-1">Proposed Stop Sequence:</span>
        <div className="flex items-center flex-wrap gap-1 text-slate-200 font-mono text-[10px]">
          {proposedRoute.stops.map((stop, idx) => (
            <Fragment key={`seq-${stop.id}-${idx}`}>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  stop.priority === 'CRITICAL'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500 font-bold'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {stop.name.split(' ')[0]}
              </span>
              {idx < proposedRoute.stops.length - 1 && <span className="text-slate-500">→</span>}
            </Fragment>
          ))}
        </div>
      </div>

      {/* Action Buttons: [REJECT] / [APPROVE ROUTE] */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onReject(proposal)}
          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <XCircle className="w-4 h-4 text-slate-400" />
          <span>REJECT</span>
        </button>

        <button
          onClick={() => onApprove(proposal)}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>APPROVE ROUTE</span>
        </button>
      </div>
    </div>
  );
};
