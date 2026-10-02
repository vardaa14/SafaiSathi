import type { Vehicle } from '../types/vehicle';
import type { PickupRequest } from '../types/request';
import type { Route, RouteStop } from '../types/route';
import type { Location } from '../types/location';
import { calculateDistance, calculatePathDistance, estimateTravelTime } from '../utils/geoUtils';

export interface RouteOptimizationResult {
  route: Route;
  orderedRequests: PickupRequest[];
  totalDistanceKm: number;
  estimatedTimeMin: number;
  totalLoadKg: number;
  utilizationPercentage: number;
}

/**
 * Deterministic heuristic route optimizer for SafaiSaathi.
 * Generates an efficient, priority-respecting sequence of stops starting from the vehicle's
 * current location through critical & high priority nodes to the final disposal facility/depot.
 */
export function optimizeRoute(
  vehicle: Vehicle,
  assignedRequests: PickupRequest[],
  depot: Location,
  facility?: Location
): RouteOptimizationResult {
  // If no assigned requests, create an idle route at depot
  if (assignedRequests.length === 0) {
    const idleRoute: Route = {
      routeId: `RT-${vehicle.id}-${Date.now().toString().slice(-4)}`,
      vehicleId: vehicle.id,
      driverId: `DRV-${vehicle.id}`,
      driverName: vehicle.driver,
      stopIds: [depot.id],
      stops: [
        {
          id: `STOP-${vehicle.id}-0`,
          locationId: depot.id,
          name: `${depot.name} (Idle / Base)`,
          latitude: depot.latitude,
          longitude: depot.longitude,
          stopOrder: 1,
          type: 'DEPOT',
          expectedLoadKg: 0,
          estimatedArrivalMin: 0,
          status: 'PENDING',
          address: depot.address
        }
      ],
      distanceKm: 0,
      estimatedTimeMin: 0,
      completedStops: 0,
      remainingStops: 1,
      expectedLoadKg: 0,
      utilization: 0,
      geometry: [[depot.latitude, depot.longitude]],
      status: 'OPTIMIZED',
      color: vehicle.color
    };

    return {
      route: idleRoute,
      orderedRequests: [],
      totalDistanceKm: 0,
      estimatedTimeMin: 0,
      totalLoadKg: 0,
      utilizationPercentage: 0
    };
  }

  // 1. Separate requests by priority tiers to ensure Critical and High stops are serviced early
  const unvisited = [...assignedRequests];
  const orderedRequests: PickupRequest[] = [];

  let currentLat = vehicle.latitude || depot.latitude;
  let currentLng = vehicle.longitude || depot.longitude;
  let accumulatedLoad = 0;

  // 2. Greedy Priority-Proximity Step Selection
  while (unvisited.length > 0) {
    // Check if there are any CRITICAL requests waiting
    const criticalCandidates = unvisited.filter(r => r.priority === 'CRITICAL');
    const highCandidates = unvisited.filter(r => r.priority === 'HIGH');
    
    // Choose pool of candidates: if critical exists, restrict pool to critical
    let pool = criticalCandidates.length > 0 
      ? criticalCandidates 
      : (highCandidates.length > 0 ? highCandidates : unvisited);

    // Find candidate in pool with minimum travel distance + urgency penalty
    let bestIndexInPool = 0;
    let bestHeuristicCost = Infinity;

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      const dist = calculateDistance(currentLat, currentLng, candidate.latitude, candidate.longitude);
      
      // Cost function: distance reduced by urgency & waiting time
      const urgencyBonus = (candidate.urgency || 5) * 1.5;
      const waitingBonus = (candidate.waitingTime || 0) * 0.05;
      const cost = dist - urgencyBonus - waitingBonus;

      if (cost < bestHeuristicCost) {
        bestHeuristicCost = cost;
        bestIndexInPool = i;
      }
    }

    const selected = pool[bestIndexInPool];
    orderedRequests.push(selected);
    accumulatedLoad += selected.quantityKg;

    // Remove from unvisited list
    const unvisitedIndex = unvisited.findIndex(r => r.id === selected.id);
    if (unvisitedIndex !== -1) {
      unvisited.splice(unvisitedIndex, 1);
    }

    currentLat = selected.latitude;
    currentLng = selected.longitude;
  }

  // 3. Construct Route Stops
  const stops: RouteStop[] = [];
  const geometry: [number, number][] = [];
  const stopIds: string[] = [];

  // Stop 1: Start from Depot or Vehicle Origin
  stops.push({
    id: `STOP-${vehicle.id}-01`,
    locationId: depot.id,
    name: `${depot.name} (Start)`,
    latitude: depot.latitude,
    longitude: depot.longitude,
    stopOrder: 1,
    type: 'DEPOT',
    expectedLoadKg: 0,
    estimatedArrivalMin: 0,
    status: 'PENDING',
    address: depot.address
  });
  stopIds.push(depot.id);
  geometry.push([depot.latitude, depot.longitude]);

  // Intermediate Stops: Assigned Collection Points
  let runningDistKm = 0;
  let runningLoadKg = 0;

  for (let i = 0; i < orderedRequests.length; i++) {
    const req = orderedRequests[i];
    const prevPoint = geometry[geometry.length - 1];
    const legDist = calculateDistance(prevPoint[0], prevPoint[1], req.latitude, req.longitude);
    runningDistKm += legDist;
    runningLoadKg += req.quantityKg;

    const eta = estimateTravelTime(runningDistKm, i + 2);

    stops.push({
      id: `STOP-${vehicle.id}-${String(i + 2).padStart(2, '0')}`,
      locationId: req.locationId,
      name: req.name,
      latitude: req.latitude,
      longitude: req.longitude,
      stopOrder: i + 2,
      type: req.isBin ? 'BIN' : 'PICKUP',
      requestId: req.id,
      expectedLoadKg: req.quantityKg,
      estimatedArrivalMin: eta,
      status: 'PENDING',
      wasteType: req.wasteType,
      priority: req.priority,
      address: req.address
    });
    stopIds.push(req.locationId);
    geometry.push([req.latitude, req.longitude]);
  }

  // Intermediate Final Stop: Waste Processing Facility (if applicable)
  const finalDisposal = facility || depot;
  if (finalDisposal.id !== depot.id) {
    const prevPoint = geometry[geometry.length - 1];
    const legDist = calculateDistance(prevPoint[0], prevPoint[1], finalDisposal.latitude, finalDisposal.longitude);
    runningDistKm += legDist;
    const eta = estimateTravelTime(runningDistKm, stops.length + 1);

    stops.push({
      id: `STOP-${vehicle.id}-${String(stops.length + 1).padStart(2, '0')}`,
      locationId: finalDisposal.id,
      name: `${finalDisposal.name} (Disposal)`,
      latitude: finalDisposal.latitude,
      longitude: finalDisposal.longitude,
      stopOrder: stops.length + 1,
      type: 'FACILITY',
      expectedLoadKg: 0,
      estimatedArrivalMin: eta,
      status: 'PENDING',
      address: finalDisposal.address
    });
    stopIds.push(finalDisposal.id);
    geometry.push([finalDisposal.latitude, finalDisposal.longitude]);
  }

  // Final Stop: Return to Depot
  const prevPoint = geometry[geometry.length - 1];
  const returnDist = calculateDistance(prevPoint[0], prevPoint[1], depot.latitude, depot.longitude);
  runningDistKm += returnDist;
  const finalEta = estimateTravelTime(runningDistKm, stops.length + 1);

  stops.push({
    id: `STOP-${vehicle.id}-${String(stops.length + 1).padStart(2, '0')}`,
    locationId: depot.id,
    name: `${depot.name} (Return)`,
    latitude: depot.latitude,
    longitude: depot.longitude,
    stopOrder: stops.length + 1,
    type: 'DEPOT',
    expectedLoadKg: 0,
    estimatedArrivalMin: finalEta,
    status: 'PENDING',
    address: depot.address
  });
  stopIds.push(depot.id);
  geometry.push([depot.latitude, depot.longitude]);

  const totalDistanceKm = calculatePathDistance(geometry);
  const utilizationPercentage = Math.min(
    100,
    Math.round((runningLoadKg / vehicle.capacityKg) * 100)
  );

  const route: Route = {
    routeId: `RT-${vehicle.id}-${Date.now().toString().slice(-4)}`,
    vehicleId: vehicle.id,
    driverId: `DRV-${vehicle.id}`,
    driverName: vehicle.driver,
    stopIds,
    stops,
    distanceKm: totalDistanceKm,
    estimatedTimeMin: finalEta,
    completedStops: 0,
    remainingStops: stops.length,
    expectedLoadKg: runningLoadKg,
    utilization: utilizationPercentage,
    geometry,
    status: 'OPTIMIZED',
    color: vehicle.color
  };

  return {
    route,
    orderedRequests,
    totalDistanceKm,
    estimatedTimeMin: finalEta,
    totalLoadKg: runningLoadKg,
    utilizationPercentage
  };
}
