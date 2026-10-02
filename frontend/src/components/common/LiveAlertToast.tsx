import React, { useState, useEffect } from 'react';
import {
  notificationService,
  type LiveNotification
} from '../../services/notificationService';
import {
  Truck,
  CheckCircle2,
  X,
  MapPin,
  Camera,
  BellRing,
  ArrowRight,
  Eye
} from 'lucide-react';

interface LiveAlertToastProps {
  portalType?: 'ADMIN' | 'CITIZEN' | 'DRIVER';
  onNavigateToMap?: () => void;
  onViewRequest?: (requestId?: string) => void;
}

export const LiveAlertToast: React.FC<LiveAlertToastProps> = ({
  portalType = 'ADMIN',
  onNavigateToMap,
  onViewRequest
}) => {
  const [activeAlerts, setActiveAlerts] = useState<LiveNotification[]>([]);
  const [zoomedProofPhoto, setZoomedProofPhoto] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      // Filter if target specified
      if (
        notification.target &&
        notification.target !== 'ALL' &&
        notification.target !== portalType
      ) {
        return;
      }

      setActiveAlerts((prev) => [notification, ...prev.slice(0, 4)]);

      // Auto dismiss after 12 seconds
      setTimeout(() => {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== notification.id));
      }, 12000);
    });

    return () => unsubscribe();
  }, [portalType]);

  const dismissAlert = (id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (activeAlerts.length === 0 && !zoomedProofPhoto) return null;

  return (
    <>
      {/* Toast Alert Stack */}
      <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {activeAlerts.map((alert) => {
          const isArrival = alert.type === 'VEHICLE_ARRIVED';
          const isCollected = alert.type === 'COLLECTION_COMPLETED';

          return (
            <div
              key={alert.id}
              className={`pointer-events-auto p-4 rounded-3xl shadow-2xl border backdrop-blur-xl transition-all duration-300 transform animate-in slide-in-from-top-4 ${
                isArrival
                  ? 'bg-amber-950/90 border-amber-500/60 ring-2 ring-amber-500/30 text-slate-100'
                  : isCollected
                  ? 'bg-emerald-950/90 border-emerald-500/60 ring-2 ring-emerald-500/30 text-slate-100'
                  : 'bg-slate-900/95 border-blue-500/50 text-slate-100'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg ${
                      isArrival
                        ? 'bg-gradient-to-tr from-amber-600 to-orange-500 animate-bounce'
                        : isCollected
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                        : 'bg-blue-600'
                    }`}
                  >
                    {isArrival ? (
                      <Truck className="w-4 h-4" />
                    ) : isCollected ? (
                      <Camera className="w-4 h-4" />
                    ) : (
                      <BellRing className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                      <span>{alert.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-white/20 rounded-md">
                        LIVE
                      </span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message */}
              <p className="text-xs text-slate-200 mb-2 leading-relaxed">{alert.message}</p>

              {/* Additional Context Details */}
              {alert.customerAddress && (
                <div className="flex items-start gap-1.5 text-[11px] text-slate-300 bg-black/30 p-2 rounded-xl mb-2 font-mono">
                  <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="truncate">{alert.customerAddress}</span>
                </div>
              )}

              {/* Proof Photo Thumbnail if present */}
              {alert.proofImageUrl && (
                <div className="flex items-center gap-2 p-2 bg-black/40 rounded-xl mb-2">
                  <img
                    src={alert.proofImageUrl}
                    alt="Proof snippet"
                    className="w-14 h-14 object-cover rounded-lg border border-emerald-500/40"
                  />
                  <div className="flex-1 text-[11px]">
                    <span className="text-emerald-400 font-bold block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Proof-of-Collection Uploaded
                    </span>
                    <span className="text-slate-400 text-[10px]">
                      Verified by Driver {alert.driverName}
                    </span>
                    <button
                      onClick={() => setZoomedProofPhoto(alert.proofImageUrl || null)}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1 mt-1 font-semibold cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect Photo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-1">
                {onNavigateToMap && (
                  <button
                    onClick={() => {
                      onNavigateToMap();
                      dismissAlert(alert.id);
                    }}
                    className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>View on GIS Map</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}

                {onViewRequest && alert.requestId && (
                  <button
                    onClick={() => {
                      onViewRequest(alert.requestId);
                      dismissAlert(alert.id);
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    View Ticket {alert.requestId}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Proof Photo Fullscreen Modal */}
      {zoomedProofPhoto && (
        <div
          onClick={() => setZoomedProofPhoto(null)}
          className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-2xl">
            <button
              onClick={() => setZoomedProofPhoto(null)}
              className="absolute top-4 right-4 bg-slate-950 text-white p-2 rounded-full hover:bg-rose-600 transition-colors cursor-pointer shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-2">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Driver Waste Collection Proof Verification
              </h3>
              <img
                src={zoomedProofPhoto}
                alt="Driver Proof"
                className="w-full max-h-[75vh] object-contain rounded-2xl border border-slate-700"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
