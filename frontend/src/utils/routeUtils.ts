import type { Route } from '../types/route';
import type { Vehicle } from '../types/vehicle';
import type { PickupRequest } from '../types/request';

export interface FleetMetrics {
  totalDistanceKm: number;
  avgDistancePerVehicleKm: number;
  totalLoadKg: number;
  totalCapacityKg: number;
  averageFleetUtilization: number;
  vehiclesUsed: number;
  totalVehicles: number;
  requestsAssigned: number;
  requestsUnassigned: number;
  routeEfficiency: number; // percentage (useful collection distance / total route distance)
}

/**
 * Computes consolidated fleet-level metrics for dashboard and optimization reports.
 */
export function calculateFleetMetrics(
  routes: Route[],
  vehicles: Vehicle[],
  requests: PickupRequest[]
): FleetMetrics {
  const activeRoutes = routes.filter(r => r.stops.length > 2);
  const totalDistanceKm = activeRoutes.reduce((acc, r) => acc + r.distanceKm, 0);
  const totalLoadKg = activeRoutes.reduce((acc, r) => acc + r.expectedLoadKg, 0);

  const activeVehicles = vehicles.filter(v =>
    routes.some(r => r.vehicleId === v.id && r.stops.length > 2)
  );

  const totalCapacityKg = vehicles.reduce((acc, v) => acc + v.capacityKg, 0);

  const vehiclesUsed = activeVehicles.length;
  const avgDistancePerVehicleKm =
    vehiclesUsed > 0 ? Math.round((totalDistanceKm / vehiclesUsed) * 10) / 10 : 0;

  const totalUtil = activeRoutes.reduce((acc, r) => acc + r.utilization, 0);
  const averageFleetUtilization =
    vehiclesUsed > 0 ? Math.round(totalUtil / vehiclesUsed) : 0;

  const assignedCount = requests.filter(r => r.assignedVehicleId !== null).length;
  const unassignedCount = requests.filter(r => r.assignedVehicleId === null).length;

  // Efficiency: Estimated useful collection leg ratio vs deadhead / return transit
  // Hackathon formula: 1 - (depot-transit overhead ratio)
  const deadheadEstimate = vehiclesUsed * 6.5; // avg return/depot overhead
  const usefulDistance = Math.max(0, totalDistanceKm - deadheadEstimate);
  const routeEfficiency =
    totalDistanceKm > 0
      ? Math.min(96, Math.max(45, Math.round((usefulDistance / totalDistanceKm) * 100)))
      : 0;

  return {
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    avgDistancePerVehicleKm,
    totalLoadKg,
    totalCapacityKg,
    averageFleetUtilization,
    vehiclesUsed,
    totalVehicles: vehicles.length,
    requestsAssigned: assignedCount,
    requestsUnassigned: unassignedCount,
    routeEfficiency
  };
}

export function formatWeightKg(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(2)} tonnes (${kg} kg)`;
  }
  return `${kg} kg`;
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'CRITICAL':
      return '#EF4444'; // Red
    case 'HIGH':
      return '#F97316'; // Orange
    case 'MEDIUM':
      return '#EAB308'; // Yellow
    case 'LOW':
    default:
      return '#10B981'; // Green
  }
}

export function getStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'AVAILABLE':
    case 'OPTIMIZED':
    case 'OPERATIONAL':
    case 'COMPLETED':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'EN_ROUTE':
    case 'ASSIGNED':
    case 'IN_PROGRESS':
    case 'COLLECTING':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'PRIORITIZED':
    case 'PENDING_ADMIN':
    case 'DEVIATED':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'CRITICAL':
    case 'MAINTENANCE':
    case 'MISSED':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    case 'OFFLINE':
    default:
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  }
}
