export type RouteStatus =
  | 'OPTIMIZED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DEVIATED'
  | 'CANCELLED';

export type RouteStopType = 'DEPOT' | 'PICKUP' | 'BIN' | 'FACILITY';

export interface RouteStop {
  id: string;
  locationId: string;
  name: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
  type: RouteStopType;
  requestId?: string;
  expectedLoadKg: number;
  estimatedArrivalMin: number;
  status: 'PENDING' | 'REACHED' | 'COLLECTED' | 'SKIPPED' | 'MISSED';
  address?: string;
  wasteType?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface Route {
  routeId: string;
  vehicleId: string;
  driverId: string;
  driverName: string;
  stopIds: string[];
  stops: RouteStop[];
  distanceKm: number;
  estimatedTimeMin: number;
  completedStops: number;
  remainingStops: number;
  expectedLoadKg: number;
  utilization: number; // percentage (0 - 100)
  geometry: [number, number][]; // ordered [lat, lng] coordinates
  status: RouteStatus;
  color: string;
}

export interface RouteRecalculationEvent {
  id: string;
  vehicleId: string;
  reason: string;
  triggerType: 'CRITICAL_REQUEST' | 'VEHICLE_FAILURE' | 'MISSED_PICKUP' | 'TRAFFIC_ALERT';
  affectedRequestId?: string;
  currentRoute: Route;
  proposedRoute: Route;
  timestamp: string;
}
