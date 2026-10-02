import { Fragment } from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { Route } from '../../types/route';
import { formatDistanceKm, formatDurationMin } from '../../utils/geoUtils';

interface RouteLayerProps {
  routes: Route[];
  selectedRouteId?: string | null;
  onSelectRoute?: (route: Route) => void;
}

export const RouteLayer: React.FC<RouteLayerProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute
}) => {
  return (
    <>
      {routes.map(route => {
        if (!route.geometry || route.geometry.length < 2) return null;

        const isSelected = selectedRouteId === route.routeId;
        const color = route.color || '#3B82F6';

        return (
          <Fragment key={route.routeId}>
            {/* Outer Glow / Outline Polyline for clarity */}
            <Polyline
              positions={route.geometry}
              pathOptions={{
                color: isSelected ? '#FFFFFF' : color,
                weight: isSelected ? 8 : 6,
                opacity: isSelected ? 0.9 : 0.35,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />

            {/* Core Route Polyline */}
            <Polyline
              positions={route.geometry}
              pathOptions={{
                color: color,
                weight: isSelected ? 5 : 3.5,
                opacity: 0.95,
                dashArray: route.status === 'DEVIATED' ? '8, 8' : undefined,
                lineCap: 'round',
                lineJoin: 'round'
              }}
              eventHandlers={{
                click: () => onSelectRoute && onSelectRoute(route)
              }}
            >
              <Popup className="safai-custom-popup">
                <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg border border-slate-700 min-w-[200px]">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-white mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {route.routeId}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    Vehicle: {route.vehicleId} ({route.driverName})
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-800/80 p-1.5 rounded">
                    <div>
                      <span className="text-slate-400">Distance:</span>{' '}
                      <span className="font-semibold text-white">
                        {formatDistanceKm(route.distanceKm)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">ETA:</span>{' '}
                      <span className="font-semibold text-sky-400">
                        {formatDurationMin(route.estimatedTimeMin)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Load:</span>{' '}
                      <span className="font-semibold text-emerald-400">
                        {route.expectedLoadKg} kg
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Utilization:</span>{' '}
                      <span className="font-semibold text-amber-400">
                        {route.utilization}%
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Polyline>

            {/* Numbered Stop Sequence Waypoints along the Route */}
            {route.stops.map((stop, idx) => {
              const isStartOrEnd = idx === 0 || idx === route.stops.length - 1;
              if (isStartOrEnd) return null; // Depot markers already exist

              const waypointIcon = L.divIcon({
                className: 'route-stop-badge',
                html: `
                  <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    height: 20px;
                    background: ${color};
                    color: #0f172a;
                    font-size: 10px;
                    font-weight: 800;
                    border-radius: 9999px;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.6);
                  ">
                    ${stop.stopOrder}
                  </div>
                `,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });

              return (
                <Marker
                  key={`${route.routeId}-stop-${stop.id}`}
                  position={[stop.latitude, stop.longitude]}
                  icon={waypointIcon}
                  interactive={false}
                />
              );
            })}
          </Fragment>
        );
      })}
    </>
  );
};
