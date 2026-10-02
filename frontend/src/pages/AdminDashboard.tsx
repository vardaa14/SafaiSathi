import { useState, useEffect, useRef } from 'react';
import { FleetMap } from '../components/map/FleetMap';
import { RouteDashboard } from '../components/routes/RouteDashboard';
import { FleetDashboard } from '../components/fleet/FleetDashboard';
import { RequestReviewPanel } from '../components/admin/RequestReviewPanel';
import { TruckAllocationPanel } from '../components/admin/TruckAllocationPanel';
import { LiveAlertToast } from '../components/common/LiveAlertToast';
import type { Vehicle } from '../types/vehicle';
import type { PickupRequest } from '../types/request';
import type { Route } from '../types/route';
import type { Facility } from '../types/facility';
import type { Location } from '../types/location';
import { SEEDED_VEHICLES } from '../data/vehicles';
import { SIMULATED_CRITICAL_REQUEST } from '../data/requests';
import { SEEDED_FACILITIES } from '../data/facilities';
import { DEFAULT_DEPOT } from '../data/locations';
import { routingService } from '../services/routingService';
import { optimizeRoute } from '../engines/routeOptimizer';
import type { CapacityOptimizationSummary } from '../engines/capacityOptimizer';
import {
  handleCriticalRequestReroute,
  handleVehicleFailureReroute
} from '../engines/reroutingEngine';
import type { ReroutingProposal } from '../engines/reroutingEngine';
import { calculateFleetMetrics } from '../utils/routeUtils';
import { generateSubdividedPath } from '../utils/geoUtils';
import { requestService } from '../services/requestService';
import {
  Truck,
  Play,
  Pause,
  UserCheck,
  ShieldCheck,
  Map as MapIcon,
  RefreshCw,
  Sparkles
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateToUser?: () => void;
  onNavigateToDriver?: () => void;
  onNavigateToIntro?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateToUser,
  onNavigateToDriver,
  onNavigateToIntro
}) => {
  // Main Section Switcher: 'review' (Section 1) | 'allocate' (Section 2)
  const [activeSection, setActiveSection] = useState<'review' | 'allocate'>('review');

  // Core Entities State
  const [vehicles, setVehicles] = useState<Vehicle[]>([...SEEDED_VEHICLES]);
  const [requests, setRequests] = useState<PickupRequest[]>(() => requestService.getRequests());
  const [routes, setRoutes] = useState<Route[]>([]);
  const [facilities] = useState<Facility[]>([...SEEDED_FACILITIES]);
  const [depot] = useState<Location>(DEFAULT_DEPOT);

  // Selected State
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Sub-tab in Allocation Section: 'routes' | 'fleet'
  const [allocationSubTab, setAllocationSubTab] = useState<'allocation' | 'routes' | 'fleet'>('allocation');

  // Optimization & Dynamic Rerouting State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [capacitySummary, setCapacitySummary] = useState<CapacityOptimizationSummary | null>(null);
  const [reroutingProposal, setReroutingProposal] = useState<ReroutingProposal | null>(null);

  // Live Vehicle Tracking Simulation State
  const [isSimulatingMovement, setIsSimulatingMovement] = useState(false);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState<number>(1);
  const vehicleProgressRef = useRef<Record<string, { path: [number, number][]; step: number }>>({});

  // Sync latest requests from requestService on mount / focus
  const refreshRequests = () => {
    const list = requestService.getRequests();
    setRequests(list);
  };

  useEffect(() => {
    refreshRequests();
    const interval = setInterval(refreshRequests, 2500);
    return () => clearInterval(interval);
  }, []);


  // Recalculates routes for vehicles with assigned requests
  const recalculateVehicleRoutes = (
    currentRequests: PickupRequest[],
    currentVehicles: Vehicle[]
  ) => {
    const newRoutes: Route[] = [];
    const facility = facilities[0] || depot;

    for (const vehicle of currentVehicles) {
      const assignedReqs = currentRequests.filter(r => r.assignedVehicleId === vehicle.id);
      if (assignedReqs.length > 0) {
        const result = optimizeRoute(vehicle, assignedReqs, depot, facility);
        newRoutes.push(result.route);
      }
    }

    setRoutes(newRoutes);

    // Setup smooth tracking paths for vehicles
    const newPaths: Record<string, { path: [number, number][]; step: number }> = {};
    newRoutes.forEach(r => {
      if (r.geometry && r.geometry.length > 1) {
        newPaths[r.vehicleId] = {
          path: generateSubdividedPath(r.geometry, 15),
          step: 0
        };
      }
    });
    vehicleProgressRef.current = newPaths;
  };

  // 1. APPROVE REQUEST (Section 1)
  const handleApproveRequest = (requestId: string) => {
    requestService.approveRequest(requestId, 85);
    const updated = requestService.getRequests();
    setRequests(updated);
  };

  // 2. APPROVE ALL PENDING (Section 1)
  const handleApproveAllPending = () => {
    const updated = requestService.approveAllPending();
    setRequests(updated);
  };

  // 3. REJECT REQUEST (Section 1)
  const handleRejectRequest = (requestId: string, reason?: string) => {
    requestService.rejectRequest(requestId, reason);
    const updated = requestService.getRequests();
    setRequests(updated);
  };

  // 4. MANUAL TRUCK ALLOCATION (Section 1 & 2)
  const handleManualAllocate = (requestId: string, vehicleId: string) => {
    requestService.allocateVehicle(requestId, vehicleId);
    const updatedRequests = requestService.getRequests();
    setRequests(updatedRequests);

    // Update vehicle load
    setVehicles(prevVehicles => {
      const newVehicles = prevVehicles.map(v => {
        const assigned = updatedRequests.filter(r => r.assignedVehicleId === v.id);
        const load = assigned.reduce((acc, r) => acc + r.quantityKg, 0);
        return {
          ...v,
          currentLoadKg: load,
          remainingCapacityKg: v.capacityKg - load,
          status: assigned.length > 0 ? ('ASSIGNED' as const) : ('AVAILABLE' as const)
        };
      });
      recalculateVehicleRoutes(updatedRequests, newVehicles);
      return newVehicles;
    });
  };

  // 5. MANUAL DEALLOCATE
  const handleManualDeallocate = (requestId: string) => {
    requestService.deallocateVehicle(requestId);
    const updatedRequests = requestService.getRequests();
    setRequests(updatedRequests);

    setVehicles(prevVehicles => {
      const newVehicles = prevVehicles.map(v => {
        const assigned = updatedRequests.filter(r => r.assignedVehicleId === v.id);
        const load = assigned.reduce((acc, r) => acc + r.quantityKg, 0);
        return {
          ...v,
          currentLoadKg: load,
          remainingCapacityKg: v.capacityKg - load,
          status: assigned.length > 0 ? ('ASSIGNED' as const) : ('AVAILABLE' as const)
        };
      });
      recalculateVehicleRoutes(updatedRequests, newVehicles);
      return newVehicles;
    });
  };

  // 6. FLEET OPTIMIZATION (Section 2)
  const handleOptimizeFleet = async () => {
    setIsOptimizing(true);
    try {
      // Only optimize approved/prioritized requests
      const approvedRequests = requests.filter(
        r => r.status === 'PRIORITIZED' || r.status === 'VALIDATED' || r.status === 'ASSIGNED' || r.status === 'EN_ROUTE'
      );

      const plan = await routingService.optimizeFleet(approvedRequests, vehicles, depot, facilities);

      // Update routes & capacity summary
      setRoutes(plan.routes);
      setCapacitySummary(plan.capacitySummary);

      // Update vehicle loads & statuses based on assignments
      setVehicles(prevVehicles =>
        prevVehicles.map(v => {
          const assignedReqs = plan.assignments[v.id] || [];
          const loadKg = assignedReqs.reduce((acc, r) => acc + r.quantityKg, 0);
          const hasAssignments = assignedReqs.length > 0;
          const assignedRoute = plan.routes.find(r => r.vehicleId === v.id);

          return {
            ...v,
            currentLoadKg: loadKg,
            remainingCapacityKg: v.capacityKg - loadKg,
            status: hasAssignments ? 'ASSIGNED' : 'AVAILABLE',
            currentRouteId: assignedRoute ? assignedRoute.routeId : null,
            completedStops: 0,
            remainingStops: assignedRoute ? assignedRoute.stops.length : 0
          };
        })
      );

      // Update request statuses in requestService
      const updatedRequests = requests.map(r => {
        let isAssignedTo = '';
        for (const [vId, list] of Object.entries(plan.assignments)) {
          if (list.some(item => item.id === r.id)) {
            isAssignedTo = vId;
            break;
          }
        }

        if (isAssignedTo) {
          requestService.allocateVehicle(r.id, isAssignedTo);
          return {
            ...r,
            status: 'ASSIGNED' as const,
            assignedVehicleId: isAssignedTo
          };
        }
        return r;
      });

      setRequests(updatedRequests);

      // Setup smooth tracking paths for vehicles
      const newPaths: Record<string, { path: [number, number][]; step: number }> = {};
      plan.routes.forEach(r => {
        if (r.geometry && r.geometry.length > 1) {
          newPaths[r.vehicleId] = {
            path: generateSubdividedPath(r.geometry, 15),
            step: 0
          };
        }
      });
      vehicleProgressRef.current = newPaths;
    } finally {
      setIsOptimizing(false);
    }
  };

  // 7. SIMULATE CRITICAL REQUEST
  const handleSimulateCriticalRequest = () => {
    const exists = requests.some(r => r.id === SIMULATED_CRITICAL_REQUEST.id);
    const updatedRequests = exists
      ? requests
      : [SIMULATED_CRITICAL_REQUEST, ...requests];

    setRequests(updatedRequests);
    requestService.createRequest(SIMULATED_CRITICAL_REQUEST);

    // Trigger Dynamic Rerouting Engine
    const proposal = handleCriticalRequestReroute(
      SIMULATED_CRITICAL_REQUEST,
      routes,
      vehicles,
      depot,
      facilities
    );

    if (proposal) {
      setReroutingProposal(proposal);
      setActiveSection('allocate');
      setAllocationSubTab('routes');
    }
  };

  // 8. SIMULATE VEHICLE FAILURE
  const handleSimulateVehicleFailure = (targetVehicleId?: string) => {
    const failedId = targetVehicleId || 'V-01';

    // Mark vehicle as MAINTENANCE
    setVehicles(prev =>
      prev.map(v => (v.id === failedId ? { ...v, status: 'MAINTENANCE', speed: 0 } : v))
    );

    // Calculate failover reroute
    const proposal = handleVehicleFailureReroute(
      failedId,
      routes,
      vehicles,
      depot,
      facilities
    );

    if (proposal) {
      setReroutingProposal(proposal);
      setActiveSection('allocate');
      setAllocationSubTab('routes');
    }
  };

  // 9. SIMULATE MISSED PICKUP
  const handleSimulateMissedPickup = () => {
    const target = requests.find(r => r.status === 'ASSIGNED');
    if (!target) return;

    setRequests(prev =>
      prev.map(r => (r.id === target.id ? { ...r, status: 'MISSED', priority: 'HIGH' } : r))
    );

    handleOptimizeFleet();
  };

  // 10. APPROVE / REJECT REROUTE PROPOSALS
  const handleApproveProposal = (proposal: ReroutingProposal) => {
    setRoutes(prev =>
      prev.map(r =>
        r.vehicleId === proposal.affectedVehicle.id ? proposal.proposedRoute : r
      )
    );

    setVehicles(prev =>
      prev.map(v =>
        v.id === proposal.affectedVehicle.id
          ? {
              ...v,
              currentRouteId: proposal.proposedRoute.routeId,
              currentLoadKg: proposal.proposedRoute.expectedLoadKg,
              remainingCapacityKg: v.capacityKg - proposal.proposedRoute.expectedLoadKg,
              status: 'EN_ROUTE'
            }
          : v
      )
    );

    vehicleProgressRef.current[proposal.affectedVehicle.id] = {
      path: generateSubdividedPath(proposal.proposedRoute.geometry, 15),
      step: 0
    };

    setReroutingProposal(null);
  };

  const handleRejectProposal = () => {
    setReroutingProposal(null);
  };

  // 11. RESET DEMO
  const handleReset = () => {
    setVehicles([...SEEDED_VEHICLES]);
    setRoutes([]);
    setSelectedVehicle(null);
    setSelectedRouteId(null);
    setCapacitySummary(null);
    setReroutingProposal(null);
    setIsSimulatingMovement(false);
    vehicleProgressRef.current = {};
    refreshRequests();
  };

  // 12. CONTROLLED VEHICLE MOVEMENT LOOP
  useEffect(() => {
    if (!isSimulatingMovement) return;

    const interval = setInterval(() => {
      setVehicles(prevVehicles =>
        prevVehicles.map(vehicle => {
          const tracker = vehicleProgressRef.current[vehicle.id];
          if (!tracker || tracker.path.length === 0 || vehicle.status === 'MAINTENANCE') {
            return vehicle;
          }

          const nextStep = tracker.step + 1;
          if (nextStep >= tracker.path.length) {
            return {
              ...vehicle,
              status: 'AVAILABLE',
              speed: 0,
              completedStops: vehicle.completedStops + vehicle.remainingStops,
              remainingStops: 0
            };
          }

          tracker.step = nextStep;
          const [lat, lng] = tracker.path[nextStep];

          return {
            ...vehicle,
            latitude: lat,
            longitude: lng,
            speed: Math.round(28 * simSpeedMultiplier),
            status: 'EN_ROUTE'
          };
        })
      );
    }, 800 / simSpeedMultiplier);

    return () => clearInterval(interval);
  }, [isSimulatingMovement, simSpeedMultiplier]);

  const metrics = calculateFleetMetrics(routes, vehicles, requests);
  const pendingRequestsCount = requests.filter(r => r.status === 'PENDING_ADMIN').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Operations Header */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-50 shadow-lg">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand Logo & Operations Tag */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight text-white m-0 leading-none">
                    SafaiSaathi
                  </h1>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    Admin Operations Hub
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Two-Stage Municipal Waste Pipeline: Review & Approval → Truck Allocation & GIS Dispatch
                </p>
              </div>
            </div>

            {/* Quick KPI stats on header */}
            <div className="hidden xl:flex items-center gap-3 text-xs bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Pending Approval:</span>
                <span className="font-bold text-amber-400 font-mono">
                  {pendingRequestsCount} tickets
                </span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[10px]">Active Trucks:</span>
                <span className="font-bold text-white font-mono">{metrics.vehiclesUsed} / 5</span>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <span className="text-slate-400 block text-[10px]">Avg Utilization:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {metrics.averageFleetUtilization}%
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Section Tabs & Portal Switcher */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
            {/* Main Section Switcher Tabs */}
            <div className="flex items-center bg-slate-950/90 p-1 rounded-2xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveSection('review')}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSection === 'review'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Section 1: Review Requests</span>
                {pendingRequestsCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold font-mono">
                    {pendingRequestsCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveSection('allocate')}
                className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSection === 'allocate'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Truck className="w-4 h-4 text-sky-300" />
                <span>Section 2: Allocate Trucks</span>
                {metrics.requestsAssigned > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold font-mono">
                    {metrics.requestsAssigned}
                  </span>
                )}
              </button>
            </div>

            {/* Refresh Data Button */}
            <button
              onClick={refreshRequests}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Refresh requests from database"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Switch to Intro Simulation */}
            {onNavigateToIntro && (
              <button
                onClick={onNavigateToIntro}
                className="text-xs bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
                title="Open Intro Truck Simulation (/intro)"
              >
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Simulation Intro</span>
              </button>
            )}

            {/* Switch to Driver Portal */}
            {onNavigateToDriver && (
              <button
                onClick={onNavigateToDriver}
                className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
                title="Open Driver Terminal (/driver)"
              >
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>Driver Terminal (/driver)</span>
              </button>
            )}

            {/* Switch to Citizen Portal */}
            {onNavigateToUser && (
              <button
                onClick={onNavigateToUser}
                className="text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
                title="Open Citizen / User Portal (/user)"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Citizen Portal (/user)</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Real-time Pop-up Toast Alerts */}
      <LiveAlertToast
        portalType="ADMIN"
        onNavigateToMap={() => setActiveSection('allocate')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4">

        {/* SECTION 1: REQUEST REVIEW & APPROVAL HUB */}
        {activeSection === 'review' ? (
          <div className="max-w-5xl mx-auto">
            <RequestReviewPanel
              requests={requests}
              vehicles={vehicles}
              onApprove={handleApproveRequest}
              onApproveAll={handleApproveAllPending}
              onReject={handleRejectRequest}
              onAllocate={handleManualAllocate}
              onDeallocate={handleManualDeallocate}
              onSwitchToAllocationTab={() => setActiveSection('allocate')}
            />
          </div>
        ) : (
          /* SECTION 2: TRUCK ALLOCATION & GIS ROUTE DISPATCH */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Leaflet GIS Map with Live Moving Trucks */}
            <section className="lg:col-span-7 xl:col-span-7 h-[600px] lg:h-[calc(100vh-100px)] sticky top-[72px] space-y-2">
              {/* Map Floating Control Toolbar */}
              <div className="flex items-center justify-between bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-300 font-semibold px-2">
                  <MapIcon className="w-4 h-4 text-blue-400" />
                  <span>Mumbai Metropolitan Fleet GIS Dispatch</span>
                </div>

                {/* Live Movement Simulation Button */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsSimulatingMovement(!isSimulatingMovement)}
                    className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isSimulatingMovement
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isSimulatingMovement ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause Tracking</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Live Truck Tracking</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSimSpeedMultiplier(m => (m === 1 ? 2 : m === 2 ? 4 : 1))}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-mono font-bold transition-colors cursor-pointer"
                    title="Simulation Speed"
                  >
                    {simSpeedMultiplier}x
                  </button>
                </div>
              </div>

              {/* Map Component */}
              <div className="h-[calc(100%-48px)] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                <FleetMap
                  vehicles={vehicles}
                  requests={requests.filter(
                    r => r.status !== 'PENDING_ADMIN' && r.status !== 'REJECTED'
                  )}
                  facilities={facilities}
                  depot={depot}
                  routes={routes}
                  selectedVehicle={selectedVehicle}
                  selectedRouteId={selectedRouteId}
                  onSelectVehicle={v => {
                    setSelectedVehicle(v);
                    setSelectedRouteId(v.currentRouteId);
                  }}
                  onSelectRequest={() => {}}
                  onSelectRoute={r => setSelectedRouteId(r.routeId)}
                />
              </div>
            </section>

            {/* Right Column: Allocation Queue & Routing Dashboard */}
            <section className="lg:col-span-5 xl:col-span-5 space-y-3">
              {/* Allocation Sub-Tabs Switcher */}
              <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs">
                <button
                  onClick={() => setAllocationSubTab('allocation')}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-center ${
                    allocationSubTab === 'allocation'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Truck Allocation Queue
                </button>

                <button
                  onClick={() => setAllocationSubTab('routes')}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-center ${
                    allocationSubTab === 'routes'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Routes & Optimization
                </button>

                <button
                  onClick={() => setAllocationSubTab('fleet')}
                  className={`flex-1 py-1.5 rounded-xl font-bold transition-colors cursor-pointer text-center ${
                    allocationSubTab === 'fleet'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fleet Roster
                </button>
              </div>

              {/* Sub-tab Views */}
              {allocationSubTab === 'allocation' && (
                <TruckAllocationPanel
                  requests={requests}
                  vehicles={vehicles}
                  isOptimizing={isOptimizing}
                  onOptimizeFleet={handleOptimizeFleet}
                  onManualAllocate={handleManualAllocate}
                  onManualDeallocate={handleManualDeallocate}
                  onSelectVehicle={setSelectedVehicle}
                  selectedVehicleId={selectedVehicle?.id}
                  onReset={handleReset}
                  onSwitchToReviewTab={() => setActiveSection('review')}
                />
              )}

              {allocationSubTab === 'routes' && (
                <RouteDashboard
                  routes={routes}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={r => {
                    setSelectedRouteId(r ? r.routeId : null);
                    if (r) {
                      const v = vehicles.find(item => item.id === r.vehicleId) || null;
                      setSelectedVehicle(v);
                    }
                  }}
                  metrics={metrics}
                  reroutingProposal={reroutingProposal}
                  onApproveProposal={handleApproveProposal}
                  onRejectProposal={handleRejectProposal}
                  isOptimizing={isOptimizing}
                  onOptimizeFleet={handleOptimizeFleet}
                  onSimulateCriticalRequest={handleSimulateCriticalRequest}
                  onSimulateVehicleFailure={handleSimulateVehicleFailure}
                  onSimulateMissedPickup={handleSimulateMissedPickup}
                  onReset={handleReset}
                  capacitySummary={capacitySummary}
                />
              )}

              {allocationSubTab === 'fleet' && (
                <FleetDashboard
                  vehicles={vehicles}
                  routes={routes}
                  capacitySummary={capacitySummary}
                  selectedVehicle={selectedVehicle}
                  onSelectVehicle={setSelectedVehicle}
                  onSimulateBreakdown={handleSimulateVehicleFailure}
                />
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};
