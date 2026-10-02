import { useState } from 'react';
import type { PickupRequest } from '../../types/request';
import type { Vehicle } from '../../types/vehicle';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Trash2,
  Scale,
  AlertTriangle,
  Search,
  Truck,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Eye,
  X,
  Camera,
  Navigation
} from 'lucide-react';

import { formatWeightKg } from '../../utils/routeUtils';

interface RequestReviewPanelProps {
  requests: PickupRequest[];
  vehicles: Vehicle[];
  onApprove: (requestId: string) => void;
  onApproveAll: () => void;
  onReject: (requestId: string, reason?: string) => void;
  onAllocate: (requestId: string, vehicleId: string) => void;
  onDeallocate: (requestId: string) => void;
  onSwitchToAllocationTab: () => void;
}

export const RequestReviewPanel: React.FC<RequestReviewPanelProps> = ({
  requests,
  vehicles,
  onApprove,
  onApproveAll,
  onReject,
  onAllocate,
  onDeallocate,
  onSwitchToAllocationTab
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; title: string } | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Metrics count
  const pendingCount = requests.filter((r) => r.status === 'PENDING_ADMIN').length;
  const approvedCount = requests.filter(
    (r) => r.status === 'PRIORITIZED' || r.status === 'VALIDATED'
  ).length;
  const assignedCount = requests.filter(
    (r) => r.status === 'ASSIGNED' || r.status === 'EN_ROUTE' || r.status === 'ARRIVED'
  ).length;
  const collectedCount = requests.filter(
    (r) => r.status === 'COLLECTED' || r.status === 'COMPLETED'
  ).length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  const filteredRequests = requests.filter((r) => {
    // Status Filter
    if (filterStatus === 'PENDING' && r.status !== 'PENDING_ADMIN') return false;
    if (filterStatus === 'APPROVED' && r.status !== 'PRIORITIZED' && r.status !== 'VALIDATED')
      return false;
    if (
      filterStatus === 'ASSIGNED' &&
      r.status !== 'ASSIGNED' &&
      r.status !== 'EN_ROUTE' &&
      r.status !== 'ARRIVED'
    )
      return false;
    if (filterStatus === 'COLLECTED' && r.status !== 'COLLECTED' && r.status !== 'COMPLETED')
      return false;
    if (filterStatus === 'CRITICAL' && r.priority !== 'CRITICAL' && r.priority !== 'HIGH')
      return false;
    if (filterStatus === 'REJECTED' && r.status !== 'REJECTED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = r.id.toLowerCase().includes(q);
      const matchCitizen = r.citizenName && r.citizenName.toLowerCase().includes(q);
      const matchAddress = r.address && r.address.toLowerCase().includes(q);
      const matchWaste = r.wasteType.toLowerCase().includes(q);
      if (!matchId && !matchCitizen && !matchAddress && !matchWaste) return false;
    }

    return true;
  });

  const availableVehicles = vehicles.filter(
    (v) => v.status !== 'MAINTENANCE' && v.status !== 'OFFLINE'
  );

  const handleConfirmReject = (id: string) => {
    onReject(id, rejectReason || 'Ineligible waste or duplicate submission');
    setRejectingId(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-4 text-left">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Pending Approval */}
        <div
          onClick={() => setFilterStatus('PENDING')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'PENDING'
              ? 'bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/40'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pending</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-extrabold text-xl text-amber-400 font-mono flex items-center gap-1.5">
            {pendingCount}
            {pendingCount > 0 && (
              <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-bold">
                Action
              </span>
            )}
          </div>
        </div>

        {/* Approved & Prioritized */}
        <div
          onClick={() => setFilterStatus('APPROVED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'APPROVED'
              ? 'bg-emerald-500/15 border-emerald-500/50 ring-1 ring-emerald-500/40'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-extrabold text-xl text-emerald-400 font-mono">
            {approvedCount}
          </div>
        </div>

        {/* Assigned to Fleet / En Route */}
        <div
          onClick={() => setFilterStatus('ASSIGNED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'ASSIGNED'
              ? 'bg-blue-500/15 border-blue-500/50 ring-1 ring-blue-500/40'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Dispatched</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-extrabold text-xl text-blue-400 font-mono">
            {assignedCount}
          </div>
        </div>

        {/* Collected & Verified */}
        <div
          onClick={() => setFilterStatus('COLLECTED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'COLLECTED'
              ? 'bg-teal-500/15 border-teal-500/50 ring-1 ring-teal-500/40'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Collected</span>
            <Camera className="w-4 h-4 text-teal-400" />
          </div>
          <div className="font-extrabold text-xl text-teal-400 font-mono">
            {collectedCount}
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setFilterStatus('REJECTED')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'REJECTED'
              ? 'bg-rose-500/15 border-rose-500/50 ring-1 ring-rose-500/40'
              : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Rejected</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="font-extrabold text-xl text-rose-400 font-mono">
            {rejectedCount}
          </div>
        </div>
      </div>

      {/* Main Review Section Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Section Header & Batch Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white">
                Section 1: Citizen Waste Request Review & Approval
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review photo verification, geo-coordinates, driver proof photos, and approve or allocate collection trucks.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {pendingCount > 0 && (
              <button
                onClick={onApproveAll}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve All Pending ({pendingCount})</span>
              </button>
            )}

            <button
              onClick={onSwitchToAllocationTab}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Go to Section 2: Allocate Trucks</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
            {[
              { key: 'ALL', label: 'All Requests' },
              { key: 'PENDING', label: `Pending (${pendingCount})` },
              { key: 'APPROVED', label: `Approved (${approvedCount})` },
              { key: 'ASSIGNED', label: `Dispatched (${assignedCount})` },
              { key: 'COLLECTED', label: `Collected (${collectedCount})` },
              { key: 'CRITICAL', label: 'Urgent / Critical' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterStatus === tab.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search ID, citizen, landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/90 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <Trash2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-300 font-bold text-sm">No requests in this view</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              New citizen submissions created via the Citizen Portal (/user) will appear here
              instantly for admin review and approval.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => {
              const isPending = req.status === 'PENDING_ADMIN';
              const isApproved = req.status === 'PRIORITIZED' || req.status === 'VALIDATED';
              const isEnRoute = req.status === 'EN_ROUTE';
              const isArrived = req.status === 'ARRIVED';
              const isAssigned = req.status === 'ASSIGNED' || isEnRoute || isArrived;
              const isCollected = req.status === 'COLLECTED' || req.status === 'COMPLETED';
              const isRejected = req.status === 'REJECTED';

              const assignedTruck = req.assignedVehicleId
                ? vehicles.find((v) => v.id === req.assignedVehicleId)
                : null;

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition-all text-left shadow-md ${
                    isPending
                      ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/20'
                      : isArrived
                      ? 'bg-amber-950/30 border-amber-500/60 ring-2 ring-amber-500/30'
                      : isCollected
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : isAssigned
                      ? 'bg-blue-950/15 border-blue-500/30'
                      : isRejected
                      ? 'bg-rose-950/15 border-rose-500/30 opacity-70'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400 text-sm bg-cyan-950/70 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                        {req.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          req.priority === 'CRITICAL'
                            ? 'bg-rose-500 text-slate-950 font-black'
                            : req.priority === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}
                      >
                        {req.priority} PRIORITY
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {new Date(req.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono border ${
                          isPending
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                            : isArrived
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black animate-bounce'
                            : isCollected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isAssigned
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : isApproved
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {isPending
                          ? 'WAITING FOR APPROVAL'
                          : isArrived
                          ? '🚨 TRUCK HAS ARRIVED AT SITE'
                          : req.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 py-3 items-start text-xs">
                    {/* Citizen & Location Info (5 cols) */}
                    <div className="md:col-span-5 space-y-1.5">
                      <div className="flex items-start gap-1.5 text-slate-200">
                        <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-white text-xs block">
                            {req.address || req.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            GPS: {req.latitude.toFixed(4)}, {req.longitude.toFixed(4)} ({req.zone})
                          </span>
                        </div>
                      </div>

                      {req.citizenName && (
                        <div className="flex items-center gap-3 text-slate-300 text-[11px] pl-5.5 pt-0.5">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-blue-400" />
                            <strong>{req.citizenName}</strong>
                          </span>
                          {req.citizenPhone && (
                            <span className="flex items-center gap-1 font-mono text-slate-400">
                              <Phone className="w-3 h-3 text-emerald-400" />
                              {req.citizenPhone}
                            </span>
                          )}
                        </div>
                      )}

                      {req.description && (
                        <div className="p-2 bg-slate-900/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 ml-5.5">
                          "{req.description}"
                        </div>
                      )}
                    </div>

                    {/* Waste Category & Quantity (3 cols) */}
                    <div className="md:col-span-3 space-y-1.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5 text-emerald-400" />
                          Category:
                        </span>
                        <span className="font-bold text-emerald-300 uppercase">
                          {req.wasteType}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5 text-sky-400" />
                          Load:
                        </span>
                        <span className="font-bold text-white font-mono text-xs">
                          {formatWeightKg(req.quantityKg)}
                        </span>
                      </div>

                      {assignedTruck && (
                        <div className="pt-1 border-t border-slate-800 text-[11px] flex justify-between items-center">
                          <span className="text-slate-400">Truck:</span>
                          <span className="font-bold text-sky-400 flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: assignedTruck.color }}
                            />
                            {assignedTruck.id} ({assignedTruck.driver})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Photos Preview: Citizen Photo (2 cols) & Driver Proof Photo (2 cols) */}
                    <div className="md:col-span-4 flex items-center gap-2">
                      {/* 1. Citizen Report Photo */}
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400 block mb-1 font-semibold">
                          Citizen Photo:
                        </span>
                        {req.imageUrl ? (
                          <div
                            onClick={() =>
                              setSelectedPhoto({
                                url: req.imageUrl!,
                                title: `Reported Waste Photo (${req.id})`
                              })
                            }
                            className="relative group rounded-xl overflow-hidden border border-slate-700 cursor-pointer h-20 bg-slate-950"
                          >
                            <img
                              src={req.imageUrl}
                              alt="Citizen report"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white transition-opacity gap-1">
                              <Eye className="w-3 h-3" />
                              <span>Zoom</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-20 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 flex items-center justify-center text-slate-500 text-[9px] text-center p-1">
                            No Photo
                          </div>
                        )}
                      </div>

                      {/* 2. Driver Collection Proof Photo */}
                      <div className="flex-1">
                        <span className="text-[10px] text-emerald-400 block mb-1 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Driver Proof:
                        </span>
                        {req.proofImageUrl ? (
                          <div
                            onClick={() =>
                              setSelectedPhoto({
                                url: req.proofImageUrl!,
                                title: `Driver Verified Collection Proof (${req.id})`
                              })
                            }
                            className="relative group rounded-xl overflow-hidden border border-emerald-500/50 cursor-pointer h-20 bg-slate-950 shadow-md shadow-emerald-500/20"
                          >
                            <img
                              src={req.proofImageUrl}
                              alt="Driver proof"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-emerald-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white transition-opacity gap-1">
                              <Eye className="w-3 h-3" />
                              <span>Verified</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-20 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 flex flex-col items-center justify-center text-slate-600 text-[9px] text-center p-1">
                            <Camera className="w-3.5 h-3.5 mb-0.5 text-slate-700" />
                            <span>Pending Pickup</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reject Reason Input (if triggered) */}
                  {rejectingId === req.id && (
                    <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl mb-3 space-y-2 text-xs">
                      <label className="text-[11px] font-bold text-rose-300 block">
                        Reason for Rejection:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ineligible commercial hazardous chemical, Duplicate ticket..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white outline-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setRejectingId(null)}
                          className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConfirmReject(req.id)}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Toolbar */}
                  <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    {/* Status text */}
                    <div className="text-[11px] text-slate-400">
                      {isPending && (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Citizen is waiting for municipal verification
                        </span>
                      )}
                      {isApproved && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Approved! Ready for truck allocation in Section 2
                        </span>
                      )}
                      {isArrived && (
                        <span className="text-amber-300 font-bold flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5 animate-pulse" />
                          Driver reached doorstep! Loading waste into compactor.
                        </span>
                      )}
                      {isCollected && (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Waste collected & verified with photo proof by {req.assignedVehicleId}!
                        </span>
                      )}
                      {isAssigned && !isArrived && !isCollected && (
                        <span className="text-blue-400 font-semibold flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5" />
                          Assigned to {req.assignedVehicleId} — En route for collection
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <>
                          <button
                            onClick={() => setRejectingId(req.id)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-400 rounded-xl border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Reject
                          </button>

                          <button
                            onClick={() => onApprove(req.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Request</span>
                          </button>
                        </>
                      )}

                      {/* Direct Vehicle Allocation Dropdown */}
                      {(isApproved || isAssigned) && (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={req.assignedVehicleId || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                onAllocate(req.id, val);
                              } else {
                                onDeallocate(req.id);
                              }
                            }}
                            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs py-1.5 px-2.5 rounded-xl font-medium outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="">-- Assign Truck --</option>
                            {availableVehicles.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.id} ({v.driver} - {v.capacityKg - v.currentLoadKg}kg free)
                              </option>
                            ))}
                          </select>

                          {isAssigned && !isCollected && (
                            <button
                              onClick={() => onDeallocate(req.id)}
                              className="text-[11px] text-slate-400 hover:text-rose-400 p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Unassign Truck"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo Zoom Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 bg-slate-950 text-white p-2 rounded-full hover:bg-rose-600 transition-colors cursor-pointer shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>{selectedPhoto.title}</span>
            </h3>
            <img
              src={selectedPhoto.url}
              alt="Inspection Photo"
              className="w-full max-h-[75vh] object-contain rounded-2xl border border-slate-700"
            />
          </div>
        </div>
      )}
    </div>
  );
};
