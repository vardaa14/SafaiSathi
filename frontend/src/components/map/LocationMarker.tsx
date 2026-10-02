import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { PickupRequest } from '../../types/request';
import { getPriorityColor, getStatusBadgeClasses } from '../../utils/routeUtils';

interface LocationMarkerProps {
  request: PickupRequest;
  onSelect?: (request: PickupRequest) => void;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({ request, onSelect }) => {
  const priorityColor = getPriorityColor(request.priority);
  const isCritical = request.priority === 'CRITICAL';
  const isBin = request.isBin;

  const customIcon = L.divIcon({
    className: 'custom-location-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: #0f172a;
        border: 2px solid ${priorityColor};
        border-radius: ${isBin ? '8px' : '9999px'};
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 10px ${priorityColor}88;
        cursor: pointer;
      ">
        ${
          isCritical
            ? `<div style="
                position: absolute;
                inset: -6px;
                border-radius: 9999px;
                border: 2px solid #ef4444;
                animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
                opacity: 0.75;
              "></div>`
            : ''
        }
        ${
          isBin
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${priorityColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${priorityColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>`
        }
        <span style="
          position: absolute;
          top: -7px;
          right: -7px;
          background: ${priorityColor};
          color: #000;
          font-size: 8px;
          font-weight: 800;
          padding: 0 4px;
          border-radius: 9999px;
          line-height: 14px;
        ">${request.priority[0]}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20]
  });

  return (
    <Marker
      position={[request.latitude, request.longitude]}
      icon={customIcon}
      eventHandlers={{
        click: () => onSelect && onSelect(request)
      }}
    >
      <Popup className="safai-custom-popup">
        <div className="bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-700 min-w-[250px] shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                {isBin ? 'Smart Bin Node' : 'Pickup Request'}
              </span>
              <div className="font-bold text-sm text-white">{request.name}</div>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded border text-black font-mono"
              style={{ backgroundColor: priorityColor, borderColor: priorityColor }}
            >
              {request.priority}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Request ID:</span>
              <span className="font-mono text-cyan-300">{request.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Waste Category:</span>
              <span className="font-semibold text-emerald-300">{request.wasteType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quantity / Load:</span>
              <span className="font-bold text-white">{request.quantityKg} kg</span>
            </div>
            {request.fillLevel !== undefined && (
              <div className="pt-1">
                <div className="flex justify-between text-[11px] mb-0.5">
                  <span className="text-slate-400">Bin Fill Level</span>
                  <span className="font-bold text-amber-400">{request.fillLevel}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${request.fillLevel}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Status:</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded border ${getStatusBadgeClasses(request.status)}`}>
                {request.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Assigned Truck:</span>
              <span className="font-semibold text-sky-400">
                {request.assignedVehicleId ? request.assignedVehicleId : 'Unassigned (Pending)'}
              </span>
            </div>
          </div>

          {request.address && (
            <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-2 line-clamp-2">
              📍 {request.address}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};
