import type { PickupRequest } from '../types/request';
import type { Vehicle } from '../types/vehicle';
import { calculateDistance } from '../utils/geoUtils';

export interface AssignmentWeights {
  priority: number;       // Default: 0.35 (35%)
  capacity: number;       // Default: 0.20 (20%)
  distance: number;       // Default: 0.20 (20%)
  fleetUtilization: number; // Default: 0.15 (15%)
  vehiclePosition: number;  // Default: 0.10 (10%)
}

export const DEFAULT_ASSIGNMENT_WEIGHTS: AssignmentWeights = {
  priority: 0.35,
  capacity: 0.20,
  distance: 0.20,
  fleetUtilization: 0.15,
  vehiclePosition: 0.10
};

export interface AssignmentExplanation {
  requestId: string;
  requestName: string;
  vehicleId: string;
  vehicleRegistration: string;
  distanceKm: number;
  remainingCapacityKg: number;
  reason: string;
  score: number;
}

export interface VehicleAssignmentResult {
  vehicleAssignments: Record<string, PickupRequest[]>; // vehicleId -> requests
  unassignedRequests: PickupRequest[];
  assignmentExplanations: AssignmentExplanation[];
  totalAssignedCount: number;
  totalUnassignedCount: number;
}

/**
 * Deterministic multi-factor vehicle assignment engine.
 * Matches waste requests to available trucks based on priority, remaining capacity,
 * spatial proximity, and fleet load balancing.
 */
export function assignRequestsToVehicles(
  requests: PickupRequest[],
  vehicles: Vehicle[],
  weights: AssignmentWeights = DEFAULT_ASSIGNMENT_WEIGHTS
): VehicleAssignmentResult {
  // 1. Filter usable vehicles
  const availableVehicles = vehicles.filter(
    v => v.status !== 'MAINTENANCE' && v.status !== 'OFFLINE'
  );

  // Deep clone tracking loads to avoid mutating inputs during dry run
  const vehicleState = availableVehicles.map(v => ({
    ...v,
    virtualLoadKg: v.currentLoadKg,
    assignedRequests: [] as PickupRequest[]
  }));

  // 2. Sort requests deterministically: Highest priority first, then highest urgency, then waiting time
  const sortedRequests = [...requests].sort((a, b) => {
    const priorityWeight: Record<string, number> = {
      CRITICAL: 4000,
      HIGH: 3000,
      MEDIUM: 2000,
      LOW: 1000
    };
    const scoreA = (priorityWeight[a.priority] || 0) + a.urgency * 50 + a.waitingTime;
    const scoreB = (priorityWeight[b.priority] || 0) + b.urgency * 50 + b.waitingTime;
    return scoreB - scoreA;
  });

  const unassignedRequests: PickupRequest[] = [];
  const explanations: AssignmentExplanation[] = [];

  // 3. Process each request
  for (const req of sortedRequests) {
    let bestCandidate: (typeof vehicleState)[0] | null = null;
    let highestScore = -Infinity;
    let bestDistance = 0;
    let bestExplanation = '';

    for (const v of vehicleState) {
      const remainingCapacity = v.capacityKg - v.virtualLoadKg;

      // HARD CONSTRAINT: Capacity check
      if (req.quantityKg > remainingCapacity) {
        continue;
      }

      // Proximity check: Calculate distance from vehicle's current position (or last assigned stop)
      const refLat = v.assignedRequests.length > 0 
        ? v.assignedRequests[v.assignedRequests.length - 1].latitude 
        : v.latitude;
      const refLng = v.assignedRequests.length > 0 
        ? v.assignedRequests[v.assignedRequests.length - 1].longitude 
        : v.longitude;

      const distKm = calculateDistance(refLat, refLng, req.latitude, req.longitude);

      // Max practical service radius per cluster (e.g. 25km)
      if (distKm > 35) continue;

      // 4. Calculate composite score (normalized 0 to 100)
      // Distance score: Closer is better (0 to 30km mapped to 100 down to 0)
      const distanceScore = Math.max(0, 100 - (distKm / 20) * 100);

      // Capacity fit score: Prefer vehicles that will achieve good target fill without overflowing
      const futureUtilFraction = (v.virtualLoadKg + req.quantityKg) / v.capacityKg;
      const capacityScore = Math.min(100, futureUtilFraction * 100);

      // Priority alignment: Ensure high priority requests get dedicated high capacity or dedicated trucks
      const reqPriorityScore = req.priorityScore || 50;

      // Vehicle utilization balance: slightly favor vehicles currently having fewer assignments to distribute work
      const balanceScore = Math.max(0, 100 - (v.virtualLoadKg / v.capacityKg) * 80);

      const compositeScore =
        weights.priority * reqPriorityScore +
        weights.capacity * capacityScore +
        weights.distance * distanceScore +
        weights.fleetUtilization * balanceScore +
        weights.vehiclePosition * (100 - distKm * 2);

      if (compositeScore > highestScore) {
        highestScore = compositeScore;
        bestCandidate = v;
        bestDistance = distKm;
        bestExplanation = `Assigned ${req.id} (${req.priority}) to ${v.id} (${v.driver}) because ${v.id} has ${remainingCapacity - req.quantityKg} kg remaining capacity and is ${distKm} km away.`;
      }
    }

    if (bestCandidate) {
      bestCandidate.virtualLoadKg += req.quantityKg;
      bestCandidate.assignedRequests.push({
        ...req,
        assignedVehicleId: bestCandidate.id,
        status: 'ASSIGNED'
      });

      explanations.push({
        requestId: req.id,
        requestName: req.name,
        vehicleId: bestCandidate.id,
        vehicleRegistration: bestCandidate.registration,
        distanceKm: bestDistance,
        remainingCapacityKg: bestCandidate.capacityKg - bestCandidate.virtualLoadKg,
        reason: bestExplanation,
        score: Math.round(highestScore)
      });
    } else {
      unassignedRequests.push({
        ...req,
        assignedVehicleId: null
      });
    }
  }

  // Format final assignments map
  const vehicleAssignments: Record<string, PickupRequest[]> = {};
  for (const v of vehicleState) {
    vehicleAssignments[v.id] = v.assignedRequests;
  }

  return {
    vehicleAssignments,
    unassignedRequests,
    assignmentExplanations: explanations,
    totalAssignedCount: sortedRequests.length - unassignedRequests.length,
    totalUnassignedCount: unassignedRequests.length
  };
}
