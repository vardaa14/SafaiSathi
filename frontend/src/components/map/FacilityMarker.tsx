import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Facility } from '../../types/facility';
import type { Location } from '../../types/location';
import { formatWeightKg } from '../../utils/routeUtils';

interface FacilityMarkerProps {
  facility: Facility | Location;
  isDepot?: boolean;
}

export const FacilityMarker: React.FC<FacilityMarkerProps> = ({ facility, isDepot = false }) => {
  const isCentralDepot = isDepot || facility.type === 'DEPOT';
  const color = isCentralDepot ? '#38BDF8' : '#A855F7'; // Sky for Depot, Purple for Facility

  const customIcon = L.divIcon({
    className: 'custom-facility-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: #090d16;
        border: 2px solid ${color};
        border-radius: 10px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.6), 0 0 12px ${color}66;
        cursor: pointer;
      ">
        ${
          isCentralDepot
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 20h20"/>
                <path d="M5 20V8l5 4V4l9 7v9"/>
                <path d="M9 16h2"/>
                <path d="M14 16h2"/>
              </svg>`
        }
        <span style="
          position: absolute;
          bottom: -7px;
          background: #030712;
          color: ${color};
          font-size: 8px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 4px;
          border: 1px solid ${color};
          white-space: nowrap;
        ">${isCentralDepot ? 'DEPOT' : 'PLANT'}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22]
  });

  return (
    <Marker position={[facility.latitude, facility.longitude]} icon={customIcon}>
      <Popup className="safai-custom-popup">
        <div className="bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-700 min-w-[240px] shadow-2xl">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2">
            <span className="text-xl">{isCentralDepot ? '🏢' : '🏭'}</span>
            <div>
              <div className="font-bold text-sm text-white">{facility.name}</div>
              <span className="text-[10px] text-slate-400 uppercase font-mono">
                {isCentralDepot ? 'Central Operations Depot' : 'Solid Waste Recovery Facility'}
              </span>
            </div>
          </div>

          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Zone:</span>
              <span className="font-medium text-slate-200">{facility.zone}</span>
            </div>
            {'capacityKgDay' in facility && (
              <div className="flex justify-between">
                <span className="text-slate-400">Daily Capacity:</span>
                <span className="font-semibold text-emerald-400">
                  {formatWeightKg(facility.capacityKgDay)}/day
                </span>
              </div>
            )}
            {'currentLoadKg' in facility && (
              <div className="flex justify-between">
                <span className="text-slate-400">Intake Processed:</span>
                <span className="font-semibold text-sky-400">
                  {formatWeightKg(facility.currentLoadKg)}
                </span>
              </div>
            )}
            {'status' in facility && (
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Status:</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  {facility.status}
                </span>
              </div>
            )}
          </div>

          {facility.address && (
            <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1.5 mt-2">
              📍 {facility.address}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
};
