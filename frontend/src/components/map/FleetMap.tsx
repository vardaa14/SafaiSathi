import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { Vehicle } from '../../types/vehicle';
import type { PickupRequest } from '../../types/request';
import type { Facility } from '../../types/facility';
import type { Location } from '../../types/location';
import type { Route } from '../../types/route';
import { VehicleMarker } from './VehicleMarker';
import { LocationMarker } from './LocationMarker';
import { FacilityMarker } from './FacilityMarker';
import { RouteLayer } from './RouteLayer';
import { MapControls } from './MapControls';
import type { MapLayerVisibility } from './MapControls';
import { MapLegend } from './MapLegend';

interface FleetMapProps {
  vehicles: Vehicle[];
  requests: PickupRequest[];
  facilities: Facility[];
  depot: Location;
  routes: Route[];
  selectedVehicle?: Vehicle | null;
  selectedRouteId?: string | null;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  onSelectRequest?: (request: PickupRequest) => void;
  onSelectRoute?: (route: Route) => void;
}

// Controller component to smoothly pan/fly when a vehicle is selected
const MapViewController: React.FC<{
  targetCoord?: [number, number] | null;
  resetTrigger?: number;
  depotCoord: [number, number];
}> = ({ targetCoord, resetTrigger, depotCoord }) => {
  const map = useMap();

  useEffect(() => {
    if (targetCoord) {
      map.flyTo(targetCoord, 14, { duration: 1.2 });
    }
  }, [targetCoord, map]);

  useEffect(() => {
    if (resetTrigger) {
      map.flyTo(depotCoord, 12, { duration: 1.2 });
    }
  }, [resetTrigger, depotCoord, map]);

  return null;
};

export const FleetMap: React.FC<FleetMapProps> = ({
  vehicles,
  requests,
  facilities,
  depot,
  routes,
  selectedVehicle,
  selectedRouteId,
  onSelectVehicle,
  onSelectRequest,
  onSelectRoute
}) => {
  const [layers, setLayers] = useState<MapLayerVisibility>({
    vehicles: true,
    requests: true,
    bins: true,
    routes: true,
    facilities: true
  });

  const [mapTheme, setMapTheme] = useState<'dark' | 'standard'>('dark');
  const [recenterCount, setRecenterCount] = useState(0);

  const toggleLayer = (key: keyof MapLayerVisibility) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTheme = () => {
    setMapTheme(prev => (prev === 'dark' ? 'standard' : 'dark'));
  };

  const handleRecenter = () => {
    setRecenterCount(c => c + 1);
  };

  const binRequests = requests.filter(r => r.isBin);
  const regularRequests = requests.filter(r => !r.isBin);

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <MapContainer
        center={[depot.latitude, depot.longitude]}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: '100%', minHeight: '540px' }}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />

        <MapViewController
          targetCoord={
            selectedVehicle ? [selectedVehicle.latitude, selectedVehicle.longitude] : null
          }
          resetTrigger={recenterCount}
          depotCoord={[depot.latitude, depot.longitude]}
        />

        {/* 1. Facilities & Central Depot Layer */}
        {layers.facilities && (
          <>
            <FacilityMarker facility={depot} isDepot={true} />
            {facilities.map(f => (
              <FacilityMarker key={`facility-${f.id}`} facility={f} />
            ))}
          </>
        )}

        {/* 2. Routes Polyline Layer */}
        {layers.routes && (
          <RouteLayer
            routes={routes}
            selectedRouteId={selectedRouteId}
            onSelectRoute={onSelectRoute}
          />
        )}

        {/* 3. Smart IoT Bins Layer */}
        {layers.bins &&
          binRequests.map(bin => (
            <LocationMarker key={`bin-${bin.id}`} request={bin} onSelect={onSelectRequest} />
          ))}

        {/* 4. On-Demand Pickup Requests Layer */}
        {layers.requests &&
          regularRequests.map(req => (
            <LocationMarker key={`req-${req.id}`} request={req} onSelect={onSelectRequest} />
          ))}

        {/* 5. Fleet Vehicles Layer */}
        {layers.vehicles &&
          vehicles.map(v => (
            <VehicleMarker
              key={`vehicle-${v.id}`}
              vehicle={v}
              isSelected={selectedVehicle?.id === v.id}
              onSelect={onSelectVehicle}
            />
          ))}
      </MapContainer>

      {/* Interactive Map Overlays */}
      <MapControls
        layers={layers}
        onToggleLayer={toggleLayer}
        mapTheme={mapTheme}
        onToggleTheme={toggleTheme}
        onRecenter={handleRecenter}
      />

      <MapLegend />
    </div>
  );
};
