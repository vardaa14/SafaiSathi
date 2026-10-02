import type { Route } from '../types/route';
import type { PickupRequest } from '../types/request';
import type { Vehicle } from '../types/vehicle';
import type { Location } from '../types/location';
import { assignRequestsToVehicles } from '../engines/vehicleAssignment';
import type { AssignmentWeights } from '../engines/vehicleAssignment';
import { optimizeRoute } from '../engines/routeOptimizer';
import { balanceFleetCapacity } from '../engines/capacityOptimizer';
import type { CapacityOptimizationSummary } from '../engines/capacityOptimizer';
import { INITIAL_SEEDED_ROUTES } from '../data/routes';

export interface FleetOptimizationPlan {
  routes: Route[];
  assignments: Record<string, PickupRequest[]>;
  unassignedRequests: PickupRequest[];
  capacitySummary: CapacityOptimizationSummary;
  timestamp: string;
}

class RoutingService {
  private routes: Route[] = [...INITIAL_SEEDED_ROUTES];

  public async getRoutes(): Promise<Route[]> {
    return Promise.resolve([...this.routes]);
  }

  public async setRoutes(newRoutes: Route[]): Promise<Route[]> {
    this.routes = [...newRoutes];
    return Promise.resolve([...this.routes]);
  }

  /**
   * Orchestrates the complete end-to-end Fleet Optimization Pipeline:
   * Requests -> Multi-factor Assignment -> Heuristic Routing -> Capacity Balancing
   */
  public async optimizeFleet(
    requests: PickupRequest[],
    vehicles: Vehicle[],
    depot: Location,
    facilities: Location[],
    weights?: AssignmentWeights
  ): Promise<FleetOptimizationPlan> {
    // 1. Vehicle Assignment
    const assignmentResult = assignRequestsToVehicles(requests, vehicles, weights);

    // 2. Initial Route Generation per assigned vehicle
    const initialRoutes: Route[] = [];
    const facility = facilities[0] || depot;

    for (const vehicle of vehicles) {
      const assigned = assignmentResult.vehicleAssignments[vehicle.id] || [];
      const result = optimizeRoute(vehicle, assigned, depot, facility);
      initialRoutes.push(result.route);
    }

    // 3. Capacity Optimization & Load Leveling
    const capacitySummary = balanceFleetCapacity(
      assignmentResult.vehicleAssignments,
      vehicles,
      depot,
      facilities
    );

    this.routes = capacitySummary.balancedRoutes;

    return Promise.resolve({
      routes: capacitySummary.balancedRoutes,
      assignments: capacitySummary.balancedAssignments,
      unassignedRequests: assignmentResult.unassignedRequests,
      capacitySummary,
      timestamp: new Date().toLocaleTimeString()
    });
  }
}

export const routingService = new RoutingService();
