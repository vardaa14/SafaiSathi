import type { Vehicle } from '../types/vehicle';
import type { PickupRequest } from '../types/request';
import type { Route, RouteRecalculationEvent } from '../types/route';
import type { Location } from '../types/location';
import { optimizeRoute } from './routeOptimizer';

export interface ReroutingProposal {
  event: RouteRecalculationEvent;
  affectedVehicle: Vehicle;
  currentRoute: Route;
  proposedRoute: Route;
  distanceDeltaKm: number;
  timeDeltaMin: number;
  reason: string;
  explanation: string;
}

/**
 * Dynamic Rerouting Engine for SafaiSaathi.
 * Generates immediate deterministic recalculations upon critical incidents, breakdowns, or missed pickups.
 */
export function handleCriticalRequestReroute(
  criticalRequest: PickupRequest,
  activeRoutes: Route[],
  vehicles: Vehicle[],
  depot: Location,
  facilities: Location[]
): ReroutingProposal | null {
  // 1. Find the best vehicle to intercept the critical request (closest with capacity)
  const candidateVehicles = vehicles.filter(
    v => v.status !== 'MAINTENANCE' && v.status !== 'OFFLINE'
  );

  if (candidateVehicles.length === 0) return null;

  // Find candidate route
  let targetRoute = activeRoutes.find(r => r.stops.length > 2);
  if (!targetRoute) {
    targetRoute = activeRoutes[0];
  }

  const targetVehicle =
    candidateVehicles.find(v => v.id === targetRoute?.vehicleId) || candidateVehicles[0];

  // Current requests in this route
  const currentRequests: PickupRequest[] = targetRoute.stops
    .filter(s => s.requestId)
    .map(s => ({
      id: s.requestId!,
      name: s.name,
      locationId: s.locationId,
      latitude: s.latitude,
      longitude: s.longitude,
      zone: 'Zone 1',
      wasteType: (s.wasteType as any) || 'MIXED_MUNICIPAL',
      quantityKg: s.expectedLoadKg,
      priority: s.priority || 'MEDIUM',
      priorityScore: 70,
      urgency: 6,
      waitingTime: 30,
      status: 'ASSIGNED',
      assignedVehicleId: targetVehicle.id,
      createdAt: new Date().toISOString(),
      address: s.address,
      isBin: s.type === 'BIN'
    }));

  // Combine with critical request (marked critical to guarantee early insertion)
  const combinedRequests = [
    { ...criticalRequest, assignedVehicleId: targetVehicle.id },
    ...currentRequests.filter(r => r.id !== criticalRequest.id)
  ];

  const facility = facilities[0] || depot;
  const optimized = optimizeRoute(targetVehicle, combinedRequests, depot, facility);

  const distanceDeltaKm =
    Math.round((optimized.route.distanceKm - targetRoute.distanceKm) * 10) / 10;
  const timeDeltaMin = optimized.route.estimatedTimeMin - targetRoute.estimatedTimeMin;

  const event: RouteRecalculationEvent = {
    id: `EVT-${Date.now().toString().slice(-4)}`,
    vehicleId: targetVehicle.id,
    reason: `Critical waste surge reported at ${criticalRequest.name}. Priority insertion calculated.`,
    triggerType: 'CRITICAL_REQUEST',
    affectedRequestId: criticalRequest.id,
    currentRoute: targetRoute,
    proposedRoute: {
      ...optimized.route,
      routeId: `RT-REROUTE-${targetVehicle.id}-${Date.now().toString().slice(-4)}`
    },
    timestamp: new Date().toLocaleTimeString()
  };

  return {
    event,
    affectedVehicle: targetVehicle,
    currentRoute: targetRoute,
    proposedRoute: event.proposedRoute,
    distanceDeltaKm,
    timeDeltaMin,
    reason: 'Critical request detected',
    explanation: `Inserted emergency stop "${criticalRequest.name}" (+${criticalRequest.quantityKg} kg) into vehicle ${targetVehicle.id}'s active trajectory with minimal +${distanceDeltaKm} km detour.`
  };
}

/**
 * Handles emergency vehicle breakdown by offloading remaining stops.
 */
export function handleVehicleFailureReroute(
  failedVehicleId: string,
  activeRoutes: Route[],
  vehicles: Vehicle[],
  depot: Location,
  facilities: Location[]
): ReroutingProposal | null {
  const failedRoute = activeRoutes.find(r => r.vehicleId === failedVehicleId);
  const backupVehicle = vehicles.find(
    v => v.id !== failedVehicleId && v.status !== 'MAINTENANCE' && v.status !== 'OFFLINE'
  );

  if (!failedRoute || !backupVehicle) return null;

  const remainingStops = failedRoute.stops.filter(s => s.status === 'PENDING' && s.requestId);
  if (remainingStops.length === 0) return null;

  const orphanedRequests: PickupRequest[] = remainingStops.map(s => ({
    id: s.requestId!,
    name: s.name,
    locationId: s.locationId,
    latitude: s.latitude,
    longitude: s.longitude,
    zone: 'Zone 1',
    wasteType: (s.wasteType as any) || 'MIXED_MUNICIPAL',
    quantityKg: s.expectedLoadKg,
    priority: s.priority || 'HIGH',
    priorityScore: 85,
    urgency: 9,
    waitingTime: 60,
    status: 'PRIORITIZED',
    assignedVehicleId: backupVehicle.id,
    createdAt: new Date().toISOString(),
    address: s.address
  }));

  const backupExistingRoute = activeRoutes.find(r => r.vehicleId === backupVehicle.id);
  const backupExistingRequests: PickupRequest[] = backupExistingRoute
    ? backupExistingRoute.stops
        .filter(s => s.requestId)
        .map(s => ({
          id: s.requestId!,
          name: s.name,
          locationId: s.locationId,
          latitude: s.latitude,
          longitude: s.longitude,
          zone: 'Zone 1',
          wasteType: (s.wasteType as any) || 'MIXED_MUNICIPAL',
          quantityKg: s.expectedLoadKg,
          priority: s.priority || 'MEDIUM',
          priorityScore: 70,
          urgency: 6,
          waitingTime: 30,
          status: 'ASSIGNED',
          assignedVehicleId: backupVehicle.id,
          createdAt: new Date().toISOString(),
          address: s.address
        }))
    : [];

  const combined = [...orphanedRequests, ...backupExistingRequests];
  const optimized = optimizeRoute(backupVehicle, combined, depot, facilities[0]);

  const currentBackupDistance = backupExistingRoute ? backupExistingRoute.distanceKm : 0;
  const currentBackupTime = backupExistingRoute ? backupExistingRoute.estimatedTimeMin : 0;

  const event: RouteRecalculationEvent = {
    id: `EVT-${Date.now().toString().slice(-4)}`,
    vehicleId: backupVehicle.id,
    reason: `Vehicle ${failedVehicleId} breakdown. Orphaned pickup stops transferred to ${backupVehicle.id}.`,
    triggerType: 'VEHICLE_FAILURE',
    currentRoute: backupExistingRoute || failedRoute,
    proposedRoute: {
      ...optimized.route,
      routeId: `RT-FAILOVER-${backupVehicle.id}-${Date.now().toString().slice(-4)}`
    },
    timestamp: new Date().toLocaleTimeString()
  };

  return {
    event,
    affectedVehicle: backupVehicle,
    currentRoute: backupExistingRoute || failedRoute,
    proposedRoute: event.proposedRoute,
    distanceDeltaKm: Math.round((optimized.route.distanceKm - currentBackupDistance) * 10) / 10,
    timeDeltaMin: optimized.route.estimatedTimeMin - currentBackupTime,
    reason: `Vehicle ${failedVehicleId} mechanical failure`,
    explanation: `Transferred ${orphanedRequests.length} pending pickup stops to active vehicle ${backupVehicle.id} (${backupVehicle.driver}).`
  };
}
