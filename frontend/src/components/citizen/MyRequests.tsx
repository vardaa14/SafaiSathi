import { useState } from 'react';
import type { PickupRequest } from '../../types/request';
import {
  Clock,
  MapPin,
  Trash2,
  Scale,
  AlertTriangle,
  Search,
  CheckCircle2,
  Truck,
  FileText,
  Camera,
  Eye,
  X,
  Navigation
} from 'lucide-react';

interface MyRequestsProps {
  requests: PickupRequest[];
  onNewRequestClick: () => void;
}

export const MyRequests: React.FC<MyRequestsProps> = ({ requests, onNewRequestClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProofPhoto, setSelectedProofPhoto] = useState<string | null>(null);

  const filteredRequests = requests.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      (r.citizenName && r.citizenName.toLowerCase().includes(q)) ||
      (r.address && r.address.toLowerCase().includes(q)) ||
      r.wasteType.toLowerCase().includes(q)
    );
  });

  const getStatusStep = (status: PickupRequest['status']) => {
    switch (status) {
      case 'PENDING_ADMIN':
        return 1;
      case 'REPORTED':
      case 'VALIDATED':
      case 'PRIORITIZED':
        return 2;
      case 'ASSIGNED':
      case 'EN_ROUTE':
        return 3;
      case 'ARRIVED':
        return 4;
      case 'COLLECTED':
      case 'VERIFIED':
      case 'COMPLETED':
        return 5;
      default:
        return 1;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            My Submitted Collection Requests
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track real-time status, validation, driver arrival, and verified collection proof.
          </p>
        </div>

        <button
          onClick={onNewRequestClick}
          className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          + New Pickup Request
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search by Request ID (e.g. SS-2026), Landmark, or Waste Type..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-colors"
        />
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="py-12 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
          <Trash2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-300 font-semibold text-sm">No pickup requests found</p>
          <p className="text-xs text-slate-500 mt-1">
            {searchQuery
              ? 'Try a different search term or clear the filter.'
              : 'Submit your first garbage pickup request to see it here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const currentStep = getStatusStep(req.status);
            const isArrived = req.status === 'ARRIVED';
            const isCollected = req.status === 'COLLECTED' || req.status === 'COMPLETED';

            return (
              <div
                key={req.id}
                className={`border rounded-2xl p-4 sm:p-5 transition-all shadow-md text-left ${
                  isArrived
                    ? 'bg-amber-950/20 border-amber-500/50 ring-1 ring-amber-500/30'
                    : isCollected
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header: ID, Created Time, Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-400 text-sm bg-cyan-950/50 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                      {req.id}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(req.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide border font-mono ${
                      req.status === 'PENDING_ADMIN'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : req.status === 'ARRIVED'
                        ? 'bg-amber-500/30 text-amber-300 border-amber-500/50 animate-pulse'
                        : req.status === 'ASSIGNED' || req.status === 'EN_ROUTE'
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : isCollected
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-700/30 text-slate-300 border-slate-600/30'
                    }`}
                  >
                    {req.status === 'PENDING_ADMIN'
                      ? 'WAITING FOR ADMIN APPROVAL'
                      : req.status === 'ARRIVED'
                      ? 'TRUCK HAS ARRIVED!'
                      : req.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Arrival Alert Notice if Driver Reached */}
                {isArrived && (
                  <div className="my-3 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs text-amber-300">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-400 animate-bounce" />
                      <span>
                        <strong>Collection Truck {req.assignedVehicleId}</strong> has arrived at your location! Driver is ready for waste pickup.
                      </span>
                    </div>
                  </div>
                )}

                {/* Details Body */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3 text-xs">
                  {/* Location & Address */}
                  <div className="md:col-span-2 space-y-1.5">
                    <div className="flex items-start gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold text-white">{req.address || req.name}</span>
                    </div>
                    {req.description && (
                      <div className="text-[11px] text-slate-400 pl-5 line-clamp-2">
                        "{req.description}"
                      </div>
                    )}
                    {req.citizenName && (
                      <div className="text-[11px] text-slate-500 pl-5">
                        Reported by: <span className="text-slate-300">{req.citizenName}</span>{' '}
                        {req.citizenPhone && `(${req.citizenPhone})`}
                      </div>
                    )}
                  </div>

                  {/* Waste, Quantity & Priority Tags */}
                  <div className="flex flex-col gap-1 text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Trash2 className="w-3 h-3 text-emerald-400" />
                        Waste:
                      </span>
                      <span className="font-semibold text-emerald-300">{req.wasteType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Scale className="w-3 h-3 text-sky-400" />
                        Quantity:
                      </span>
                      <span className="font-bold text-white">{req.quantityKg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        Priority:
                      </span>
                      <span className="font-semibold text-amber-400">{req.priority}</span>
                    </div>
                    {req.assignedVehicleId && (
                      <div className="pt-1 border-t border-slate-800 flex justify-between text-sky-300">
                        <span>Assigned Vehicle:</span>
                        <strong className="font-mono">{req.assignedVehicleId}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Proof of Collection Section if Completed */}
                {req.proofImageUrl && (
                  <div className="my-3 p-3 bg-slate-900/80 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={req.proofImageUrl}
                        alt="Proof of collection"
                        className="w-14 h-14 object-cover rounded-lg border border-emerald-500/50"
                      />
                      <div>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Waste Collected & Verified by Driver
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {req.driverNotes || 'Cleaned and cleared from site.'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedProofPhoto(req.proofImageUrl || null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>View Photo</span>
                    </button>
                  </div>
                )}

                {/* 5-Step Lifecycle Tracker */}
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="grid grid-cols-5 gap-1 text-center">
                    {[
                      { step: 1, label: 'Submitted', icon: FileText },
                      { step: 2, label: 'Approved', icon: Clock },
                      { step: 3, label: 'Dispatched', icon: Truck },
                      { step: 4, label: 'Truck Arrived', icon: Navigation },
                      { step: 5, label: 'Collected', icon: CheckCircle2 }
                    ].map(st => {
                      const isComplete = currentStep >= st.step;
                      const isCurrent = currentStep === st.step;
                      const IconComponent = st.icon;

                      return (
                        <div key={st.step} className="flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1 ${
                              isComplete
                                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <span
                            className={`text-[9px] sm:text-[10px] font-medium truncate ${
                              isCurrent
                                ? 'text-emerald-400 font-bold'
                                : isComplete
                                ? 'text-slate-300'
                                : 'text-slate-600'
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proof Photo Zoom Modal */}
      {selectedProofPhoto && (
        <div
          onClick={() => setSelectedProofPhoto(null)}
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setSelectedProofPhoto(null)}
              className="absolute top-4 right-4 bg-slate-950 text-white p-2 rounded-full hover:bg-rose-600 transition-colors cursor-pointer shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              Verified Driver Proof of Waste Collection
            </h3>
            <img
              src={selectedProofPhoto}
              alt="Full Proof Photo"
              className="w-full max-h-[75vh] object-contain rounded-2xl border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};
