export type VehicleStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'COLLECTING'
  | 'RETURNING'
  | 'MAINTENANCE'
  | 'OFFLINE';

export type VehicleType =
  | 'COMPACTOR'
  | 'TIPPER_TRUCK'
  | 'ELECTRIC_VAN'
  | 'MINI_TRUCK';

export interface Vehicle {
  id: string;
  registration: string;
  driver: string;
  driverPhone?: string;
  type: VehicleType;
  capacityKg: number;
  currentLoadKg: number;
  remainingCapacityKg: number;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  fuel: number; // % (0 - 100)
  status: VehicleStatus;
  currentRouteId: string | null;
  completedStops: number;
  remainingStops: number;
  color: string;
}
