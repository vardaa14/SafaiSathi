import { CheckCircle2, Clock, MapPin, Trash2, Scale, AlertTriangle, X } from 'lucide-react';
import type { PickupRequest } from '../../types/request';

interface ConfirmationModalProps {
  request: PickupRequest;
  onClose: () => void;
  onViewMyRequests: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  request,
  onClose,
  onViewMyRequests
}) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-emerald-500/10 text-left relative transform transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon & Heading */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            REQUEST SUBMITTED
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Your waste collection ticket has been logged and queued.
          </p>
        </div>

        {/* Request Details Card */}
        <div className="my-5 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3 text-xs sm:text-sm">
          {/* Request ID */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-slate-400 font-medium">Request ID:</span>
            <span className="font-mono font-extrabold text-cyan-400 text-sm sm:text-base tracking-wider bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
              {request.id}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-400 font-medium flex items-center gap-1.5 flex-shrink-0">
              <MapPin className="w-4 h-4 text-rose-400" />
              Location:
            </span>
            <span className="text-white font-semibold text-right truncate max-w-[220px]">
              {request.address || request.name}
            </span>
          </div>

          {/* Waste Type */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-emerald-400" />
              Waste Category:
            </span>
            <span className="text-emerald-300 font-semibold uppercase">{request.wasteType}</span>
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-sky-400" />
              Quantity:
            </span>
            <span className="text-white font-bold">{request.quantityKg} kg</span>
          </div>

          {/* Priority */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Priority:
            </span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-xs uppercase font-mono ${
                request.priority === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : request.priority === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {request.priority}
            </span>
          </div>

          {/* Status Badge */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
              Current Status:
            </span>
            <span className="font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 text-xs uppercase tracking-wide">
              WAITING FOR ADMIN APPROVAL
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onClose}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition-colors cursor-pointer text-center"
          >
            Submit Another
          </button>
          <button
            onClick={onViewMyRequests}
            className="py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer text-center"
          >
            View in My Requests
          </button>
        </div>
      </div>
    </div>
  );
};
