import { useState, useEffect } from 'react';
import { RequestForm } from '../components/citizen/RequestForm';
import { MyRequests } from '../components/citizen/MyRequests';
import { ConfirmationModal } from '../components/citizen/ConfirmationModal';
import { LiveAlertToast } from '../components/common/LiveAlertToast';
import type { PickupRequest } from '../types/request';
import { requestService } from '../services/requestService';
import {
  Trash2,
  ListOrdered,
  PlusCircle,
  LayoutDashboard,
  Building2,
  Truck,
  Sparkles
} from 'lucide-react';

interface CitizenPortalProps {
  onNavigateToAdmin?: () => void;
  onNavigateToDriver?: () => void;
  onNavigateToIntro?: () => void;
}

export const CitizenPortal: React.FC<CitizenPortalProps> = ({
  onNavigateToAdmin,
  onNavigateToDriver,
  onNavigateToIntro
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'my_requests'>('create');
  const [citizenRequests, setCitizenRequests] = useState<PickupRequest[]>([]);
  const [submittedRequest, setSubmittedRequest] = useState<PickupRequest | null>(null);

  // Load existing citizen requests
  const refreshRequests = () => {
    const list = requestService.getCitizenRequests();
    setCitizenRequests(list);
  };

  useEffect(() => {
    refreshRequests();
    const interval = setInterval(refreshRequests, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestCreated = (newReq: PickupRequest) => {
    const created = requestService.createRequest(newReq);
    refreshRequests();
    setSubmittedRequest(created);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Live Real-time Arrival Alert Toast */}
      <LiveAlertToast
        portalType="CITIZEN"
        onViewRequest={() => setActiveTab('my_requests')}
      />

      {/* Citizen Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-50 shadow-lg">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight text-white m-0 leading-none">
                    SafaiSaathi
                  </h1>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    Citizen Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Direct Municipal Waste Reporting & Dynamic Pickup Dispatch
                </p>
              </div>
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Report Pickup</span>
              </button>

              <button
                onClick={() => {
                  refreshRequests();
                  setActiveTab('my_requests');
                }}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeTab === 'my_requests'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>My Requests</span>
                {citizenRequests.length > 0 && (
                  <span className="text-[10px] bg-slate-800 text-emerald-400 font-mono px-1.5 py-0.2 rounded-full font-bold">
                    {citizenRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* Switch to Intro Simulation */}
            {onNavigateToIntro && (
              <button
                onClick={onNavigateToIntro}
                className="text-xs bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
                title="Open Intro Truck Simulation (/intro)"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Simulation Intro</span>
              </button>
            )}

            {/* Switch to Driver Portal */}
            {onNavigateToDriver && (
              <button
                onClick={onNavigateToDriver}
                className="text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-semibold"
                title="Open Driver Terminal (/driver)"
              >
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>Driver Terminal</span>
              </button>
            )}

            {/* Switch to Admin Control Room */}
            {onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="text-xs bg-slate-800/90 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700/80 flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
                title="Open Admin Operations Control Room"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                <span>Admin Hub</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 my-2">
        {/* Info Banner */}
        <div className="mb-5 p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-xs text-emerald-200 text-left">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl flex-shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">Brihanmumbai Solid Waste Management</span>
            <span>
              All submissions are automatically geo-tagged, prioritized by AI routing engines, and
              dispatched to the nearest municipal compactor truck.
            </span>
          </div>
        </div>

        {activeTab === 'create' ? (
          <RequestForm onSubmitSuccess={handleRequestCreated} />
        ) : (
          <MyRequests
            requests={citizenRequests}
            onNewRequestClick={() => setActiveTab('create')}
          />
        )}
      </main>

      {/* Submission Confirmation Popup */}
      {submittedRequest && (
        <ConfirmationModal
          request={submittedRequest}
          onClose={() => setSubmittedRequest(null)}
          onViewMyRequests={() => {
            setSubmittedRequest(null);
            refreshRequests();
            setActiveTab('my_requests');
          }}
        />
      )}

      {/* Footer */}
      <footer className="py-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
        SafaiSaathi Citizen Service Portal • Mumbai Metropolitan Waste Management Initiative
      </footer>
    </div>
  );
};
