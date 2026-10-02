import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Vehicle } from '../../types/vehicle';
import { formatWeightKg, getStatusBadgeClasses } from '../../utils/routeUtils';

interface VehicleMarkerProps {
  vehicle: Vehicle;
  isSelected?: boolean;
  onSelect?: (vehicle: Vehicle) => void;
}

export const VehicleMarker: React.FC<VehicleMarkerProps> = ({
  vehicle,
  isSelected = false,
  onSelect
}) => {
  const isMoving = vehicle.speed > 0;
  const loadPercentage = Math.min(
    100,
    Math.round((vehicle.currentLoadKg / vehicle.capacityKg) * 100)
  );

  const customIcon = L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        background: #1e293b;
        border: 2px solid ${vehicle.color};
        border-radius: 9999px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4), 0 0 12px ${vehicle.color}66;
        cursor: pointer;
        transition: transform 0.2s ease;
        ${isSelected ? 'transform: scale(1.2); ring: 3px white;' : ''}
      ">
        ${
          isMoving
            ? `<div style="
                position: absolute;
                inset: -6px;
                border-radius: 9999px;
                border: 2px solid ${vehicle.color};
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                opacity: 0.6;
              "></div>`
            : ''
        }
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${vehicle.color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18H9"/>
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
        <span style="
          position: absolute;
          bottom: -8px;
          background: #0f172a;
          color: #f8fafc;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
          border: 1px solid ${vehicle.color};
          white-space: nowrap;
        ">${vehicle.id}</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -24]
  });

  return (
    <Marker
      position={[vehicle.latitude, vehicle.longitude]}
      icon={customIcon}
      eventHandlers={{
        click: () => onSelect && onSelect(vehicle)
      }}
    >
      <Popup className="safai-custom-popup">
        <div className="bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-700 min-w-[240px] shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: vehicle.color }}
                />
                {vehicle.id} • {vehicle.registration}
              </div>
              <div className="text-xs text-slate-400">{vehicle.driver}</div>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadgeClasses(
                vehicle.status
              )}`}
            >
              {vehicle.status}
            </span>
          </div>

          {/* Load Capacity Bar */}
          <div className="mb-2.5">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Current Payload</span>
              <span className="font-semibold text-white">
                {vehicle.currentLoadKg} / {vehicle.capacityKg} kg ({loadPercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  loadPercentage > 85
                    ? 'bg-rose-500'
                    : loadPercentage > 60
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${loadPercentage}%` }}
              />
            </div>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-800/60 p-2 rounded border border-slate-700/50 mb-2">
            <div>
              <span className="text-slate-400 block">Remaining:</span>
              <span className="font-semibold text-emerald-400">
                {formatWeightKg(vehicle.remainingCapacityKg)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Fuel / Battery:</span>
              <span className="font-semibold text-sky-400">{vehicle.fuel}%</span>
            </div>
            <div>
              <span className="text-slate-400 block">Current Speed:</span>
              <span className="font-semibold text-white">{vehicle.speed} km/h</span>
            </div>
            <div>
              <span className="text-slate-400 block">Stops Done:</span>
              <span className="font-semibold text-indigo-400">
                {vehicle.completedStops} / {vehicle.completedStops + vehicle.remainingStops}
              </span>
            </div>
          </div>

          {vehicle.currentRouteId && (
            <div className="text-[11px] text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Active Route:</span>
              <span className="font-mono text-cyan-400">{vehicle.currentRouteId}</span>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};
