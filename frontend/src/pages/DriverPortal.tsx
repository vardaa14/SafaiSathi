import React, { useState, useEffect, useRef } from 'react';
import type { Vehicle } from '../types/vehicle';
import type { PickupRequest } from '../types/request';
import { SEEDED_VEHICLES } from '../data/vehicles';
import { SEEDED_FACILITIES } from '../data/facilities';
import { DEFAULT_DEPOT } from '../data/locations';
import { requestService } from '../services/requestService';
import { LiveAlertToast } from '../components/common/LiveAlertToast';
import {
  Truck,
  MapPin,
  Camera,
  CheckCircle2,
  Navigation,
  Phone,
  User,
  Radio,
  ArrowRight,
  Building2,
  LayoutDashboard,
  UserCheck,
  Upload,
  Sparkles
} from 'lucide-react';
import { formatWeightKg } from '../utils/routeUtils';

// High quality realistic proof image of collected waste in compactor
const DEFAULT_PROOF_PHOTO =
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80';

interface DriverPortalProps {
  onNavigateToAdmin?: () => void;
  onNavigateToCitizen?: () => void;
  onNavigateToIntro?: () => void;
}

export const DriverPortal: React.FC<DriverPortalProps> = ({
  onNavigateToAdmin,
  onNavigateToCitizen,
  onNavigateToIntro
}) => {
  const [vehicles] = useState<Vehicle[]>([...SEEDED_VEHICLES]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('V-05'); // default V-05 as in prompt
  const [assignedRequests, setAssignedRequests] = useState<PickupRequest[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);

  // Active stop simulation state
  const [activeStopIndex] = useState<number>(0);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [movementProgress, setMovementProgress] = useState<number>(0); // 0 to 100%

  // Collection proof form state
  const [proofImage, setProofImage] = useState<string>(DEFAULT_PROOF_PHOTO);
  const [collectedWeight, setCollectedWeight] = useState<number>(100);
  const [driverNotes, setDriverNotes] = useState<string>('Collected from doorstep. Area cleaned.');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const activeVehicle = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];
  const depot = DEFAULT_DEPOT;
  const plant = SEEDED_FACILITIES[0] || {
    id: 'PLANT_DHARAVI',
    name: 'Dharavi MRF Waste Processing Plant',
    latitude: 19.0435,
    longitude: 72.856
  };

  // Load requests assigned to selected vehicle
  const refreshAssignedRequests = () => {
    const all = requestService.getRequests();
    const assigned = all.filter((r) => r.assignedVehicleId === selectedVehicleId);
    setAssignedRequests(assigned);
  };

  useEffect(() => {
    refreshAssignedRequests();
    const interval = setInterval(refreshAssignedRequests, 2000);
    return () => clearInterval(interval);
  }, [selectedVehicleId]);

  const currentRequest: PickupRequest | undefined = assignedRequests[activeStopIndex];

  // Simulated GPS Movement Loop
  const simIntervalRef = useRef<any>(null);

  const startSimulatedMovement = (
    _destinationType: 'CUSTOMER' | 'PLANT',
    onArrival: () => void
  ) => {
    if (isMoving) return;
    setIsMoving(true);
    setCurrentSpeed(34);
    setMovementProgress(10);


    let prog = 10;
    simIntervalRef.current = setInterval(() => {
      prog += 15;
      if (prog >= 100) {
        prog = 100;
        setMovementProgress(100);
        setIsMoving(false);
        setCurrentSpeed(0);
        if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        onArrival();
      } else {
        setMovementProgress(prog);
      }
    }, 700);
  };

  // STEP 1: START JOURNEY (EN ROUTE TO CUSTOMER)
  const handleStartJourney = () => {
    if (!currentRequest) return;
    requestService.markEnRoute(currentRequest.id, activeVehicle.id, activeVehicle.driver);
    refreshAssignedRequests();

    startSimulatedMovement('CUSTOMER', () => {
      // Auto arrive when simulation reaches 100%
      handleMarkArrived();
    });
  };

  // STEP 2: ARRIVED AT CUSTOMER (Triggers pop-up across portals)
  const handleMarkArrived = () => {
    if (!currentRequest) return;
    requestService.markArrived(
      currentRequest.id,
      activeVehicle.id,
      activeVehicle.driver,
      activeVehicle.driverPhone
    );
    refreshAssignedRequests();
    setMovementProgress(100);
  };

  // STEP 3: UPLOAD PROOF & COMPLETE PICKUP
  const handleUploadProofAndCollect = () => {
    if (!currentRequest) return;
    setIsUploading(true);

    setTimeout(() => {
      requestService.uploadCollectionProof(
        currentRequest.id,
        proofImage,
        collectedWeight || currentRequest.quantityKg,
        driverNotes,
        activeVehicle.id,
        activeVehicle.driver
      );
      setIsUploading(false);
      refreshAssignedRequests();
    }, 800);
  };

  // STEP 4: DEPART CUSTOMER & HEAD TO PROCESSING PLANT
  const handleHeadToPlant = () => {
    startSimulatedMovement('PLANT', () => {
      handleCompleteAtPlant();
    });
  };

  // STEP 5: UNLOAD AT PLANT & FINISH TRIP
  const handleCompleteAtPlant = () => {
    if (currentRequest) {
      requestService.completeRequest(currentRequest.id);
    }
    refreshAssignedRequests();
    setMovementProgress(0);
  };

  const isEnRoute = currentRequest?.status === 'EN_ROUTE';
  const isArrived = currentRequest?.status === 'ARRIVED';
  const isCollected = currentRequest?.status === 'COLLECTED';
  const isCompleted = currentRequest?.status === 'COMPLETED';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Real-time Notification Popups */}
      <LiveAlertToast portalType="DRIVER" />

      {/* Driver Portal Top Bar */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 sticky top-0 z-50 shadow-xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand & Driver Header */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight text-white m-0 leading-none">
                    SafaiSaathi
                  </h1>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                    Driver Terminal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mobile Telematics, Live GPS Dispatch & Collection Proof Verification
                </p>
              </div>
            </div>

            {/* GPS Telematics Status */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-[11px] text-emerald-300 font-mono">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>GPS LIVE</span>
              </div>
            </div>
          </div>

          {/* Cross-Portal Switcher Tabs */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              {onNavigateToIntro && (
                <button
                  onClick={onNavigateToIntro}
                  className="px-3 py-1.5 rounded-lg font-semibold text-sky-400 hover:text-sky-300 hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Open Intro Truck Simulation (/intro)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                  <span>Simulation Intro</span>
                </button>
              )}

              {onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  className="px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
                  <span>Admin Hub</span>
                </button>
              )}

              {onNavigateToCitizen && (
                <button
                  onClick={onNavigateToCitizen}
                  className="px-3 py-1.5 rounded-lg font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Citizen Portal</span>
                </button>
              )}

              <div className="px-3 py-1.5 rounded-lg font-bold bg-amber-500 text-slate-950 flex items-center gap-1.5 shadow-sm">
                <Truck className="w-3.5 h-3.5" />
                <span>Driver Terminal</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 space-y-4 text-left">
        {/* Driver & Vehicle Selector Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-extrabold shadow-lg"
              style={{ backgroundColor: activeVehicle.color }}
            >
              {activeVehicle.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Active Truck:</span>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => {
                    setSelectedVehicleId(e.target.value);
                    setMovementProgress(0);
                  }}
                  className="bg-slate-950 border border-slate-700 text-white font-bold text-sm px-3 py-1 rounded-xl outline-none focus:border-amber-500 cursor-pointer"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id} — {v.driver} ({v.type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-1 font-mono">
                <span>Driver: <strong className="text-white">{activeVehicle.driver}</strong></span>
                <span>•</span>
                <span>Plate: <strong className="text-amber-400">{activeVehicle.registration}</strong></span>
              </div>
            </div>
          </div>

          {/* Telematics Quick Stats */}
          <div className="flex items-center gap-3 text-xs bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Current Payload</span>
              <span className="font-bold text-white font-mono">
                {activeVehicle.currentLoadKg} / {activeVehicle.capacityKg} kg
              </span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block">Telemetry Speed</span>
              <span className="font-bold text-emerald-400 font-mono">
                {currentSpeed} km/h
              </span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 block">Active Pickups</span>
              <span className="font-bold text-amber-400 font-mono">
                {assignedRequests.length} Ticket(s)
              </span>
            </div>
          </div>
        </div>

        {/* Active Route Mission Flow */}
        {assignedRequests.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-8 space-y-3">
            <Truck className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-200">No Active Routes Assigned to {activeVehicle.id}</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Open the <strong>Admin Operations Hub</strong> to review citizen requests and allocate them to truck {activeVehicle.id}.
            </p>
            {onNavigateToAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Go to Admin Hub & Allocate Requests</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Col: Step-by-Step Interactive Mission Card (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {currentRequest && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
                  {/* Mission Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Current Pickup Mission #{activeStopIndex + 1} of {assignedRequests.length}
                      </span>
                      <h3 className="font-extrabold text-base text-white mt-1">
                        Ticket {currentRequest.id}
                      </h3>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-3 py-1 rounded-full uppercase border ${
                        isArrived
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : isCollected
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : isEnRoute
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {currentRequest.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Customer Information Box */}
                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white block">
                          {currentRequest.address || currentRequest.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          GPS: {currentRequest.latitude.toFixed(4)}, {currentRequest.longitude.toFixed(4)} ({currentRequest.zone})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Citizen Contact:</span>
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          <User className="w-3 h-3 text-blue-400" />
                          {currentRequest.citizenName || 'Citizen'}
                        </span>
                        {currentRequest.citizenPhone && (
                          <a
                            href={`tel:${currentRequest.citizenPhone}`}
                            className="text-emerald-400 font-mono hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Phone className="w-3 h-3" />
                            {currentRequest.citizenPhone}
                          </a>
                        )}
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">Waste Details:</span>
                        <span className="font-bold text-emerald-400 uppercase">
                          {currentRequest.wasteType}
                        </span>
                        <span className="text-slate-300 block font-mono">
                          Est. Load: {formatWeightKg(currentRequest.quantityKg)}
                        </span>
                      </div>
                    </div>

                    {currentRequest.description && (
                      <div className="p-2 bg-slate-900 rounded-xl text-slate-300 text-[11px] italic">
                        "{currentRequest.description}"
                      </div>
                    )}
                  </div>

                  {/* Dynamic Progress Bar along Route */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                      <span>Trip Progress</span>
                      <span className="text-amber-400 font-bold">{movementProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${movementProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* ACTION CONTROLS STAGE 1 -> 5 */}
                  <div className="pt-2 space-y-3">
                    {/* STEP 1: START TRIP */}
                    {!isEnRoute && !isArrived && !isCollected && !isCompleted && (
                      <button
                        onClick={handleStartJourney}
                        disabled={isMoving}
                        className="w-full py-4 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Navigation className="w-5 h-5 fill-current" />
                        <span>START JOURNEY TO CUSTOMER (Simulate GPS Drive)</span>
                      </button>
                    )}

                    {/* STEP 2: EN ROUTE (DRIVING) */}
                    {isEnRoute && !isArrived && (
                      <div className="space-y-2">
                        <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-2xl flex items-center justify-between text-xs text-blue-300">
                          <span className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                            <span>Navigating to Customer Location...</span>
                          </span>
                          <span className="font-bold font-mono text-white">{currentSpeed} km/h</span>
                        </div>

                        <button
                          onClick={handleMarkArrived}
                          className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <MapPin className="w-5 h-5 fill-current" />
                          <span>MARK ARRIVED AT CUSTOMER (Send Pop-up to Admin & User)</span>
                        </button>
                      </div>
                    )}

                    {/* STEP 3: ARRIVED -> COLLECT WASTE & UPLOAD PROOF PHOTO */}
                    {isArrived && !isCollected && (
                      <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-amber-400" />
                            <span>At Customer Doorstep — Ready for Collection</span>
                          </span>
                          <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full font-mono">
                            STEP 3
                          </span>
                        </div>

                        {/* Upload / Capture Proof Widget */}
                        <div className="space-y-2 text-xs">
                          <label className="text-[11px] font-bold text-slate-300 block flex items-center gap-1">
                            <Camera className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Proof of Collection Photo:</span>
                          </label>

                          <div className="flex items-center gap-3">
                            <img
                              src={proofImage}
                              alt="Proof preview"
                              className="w-20 h-20 object-cover rounded-xl border border-emerald-500/50 shadow-md"
                            />
                            <div className="flex-1 space-y-1.5">
                              <span className="text-[11px] text-slate-400 block">
                                Real-time verification photo to be broadcast to Admin & Citizen.
                              </span>
                              <div className="flex items-center gap-2">
                                <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 cursor-pointer flex items-center gap-1.5">
                                  <Upload className="w-3 h-3 text-cyan-400" />
                                  <span>Choose Custom Photo</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                          setProofImage(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <label className="text-[10px] text-slate-400 block">Actual Load (kg):</label>
                              <input
                                type="number"
                                value={collectedWeight}
                                onChange={(e) => setCollectedWeight(Number(e.target.value))}
                                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block">Driver Notes:</label>
                              <input
                                type="text"
                                value={driverNotes}
                                onChange={(e) => setDriverNotes(e.target.value)}
                                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                              />
                            </div>
                          </div>

                          <button
                            onClick={handleUploadProofAndCollect}
                            disabled={isUploading}
                            className="w-full mt-2 py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isUploading ? (
                              <span>Broadcasting Collection Proof...</span>
                            ) : (
                              <>
                                <CheckCircle2 className="w-5 h-5" />
                                <span>SUBMIT PROOF & COMPLETE PICKUP</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: COLLECTED -> DEPART CUSTOMER & HEAD TO PROCESSING PLANT */}
                    {isCollected && (
                      <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-2xl space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Waste Collected & Photo Proof Verified!</span>
                          </span>
                        </div>

                        <p className="text-slate-300 text-xs">
                          Collection is verified. Truck payload is loaded. Now proceed to the <strong>Waste Processing Plant</strong> for disposal and recycling.
                        </p>

                        <button
                          onClick={handleHeadToPlant}
                          disabled={isMoving}
                          className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Building2 className="w-5 h-5" />
                          <span>DEPART CUSTOMER & DRIVE TO PROCESSING PLANT</span>
                        </button>
                      </div>
                    )}

                    {/* STEP 5: MISSION FINISHED */}
                    {isCompleted && (
                      <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                        <h4 className="font-bold text-sm text-white">Pickup Mission Completed</h4>
                        <p className="text-xs text-slate-400">
                          Waste unloaded at Municipal Processing Plant. Truck {activeVehicle.id} is ready for next route assignment.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Complete Route Itinerary & Telematics (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Route Waypoints Timeline Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-amber-400" />
                    <span>Complete Route Itinerary</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {assignedRequests.length + 2} Stops
                  </span>
                </div>

                {/* Vertical Step Timeline */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 text-xs">
                  {/* Stop 0: Depot */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-slate-900 flex items-center justify-center text-[8px] font-bold text-white">
                      0
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-400 font-bold uppercase">Origin Depot</span>
                      <h5 className="font-bold text-white text-xs">{depot.name}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">{depot.address}</span>
                    </div>
                  </div>

                  {/* Customer Stops */}
                  {assignedRequests.map((req, idx) => (
                    <div key={req.id} className="relative">
                      <div
                        className={`absolute -left-6 top-0 w-4 h-4 rounded-full ring-4 ring-slate-900 flex items-center justify-center text-[8px] font-bold text-black ${
                          req.status === 'COLLECTED' || req.status === 'COMPLETED'
                            ? 'bg-emerald-400'
                            : req.status === 'ARRIVED'
                            ? 'bg-amber-400 animate-ping'
                            : 'bg-amber-400'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-amber-400 font-mono font-bold">
                            Stop {idx + 1}: {req.id}
                          </span>
                          <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase">
                            {req.status}
                          </span>
                        </div>
                        <h5 className="font-bold text-white text-xs mt-0.5">{req.address || req.name}</h5>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                          <span>{req.citizenName}</span>
                          <span>{req.quantityKg} kg {req.wasteType}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Final Stop: Processing Plant */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-950">
                      ★
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">Disposal Facility</span>
                      <h5 className="font-bold text-white text-xs">{plant.name}</h5>
                      <span className="text-[10px] text-slate-400 font-mono">Municipal Recycling & Compactor Plant</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Live Telematics Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3 text-xs">
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Vehicle Telemetry & Sensor State</span>
                </h4>

                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Fuel / Battery:</span>
                    <span className="text-white font-bold">{activeVehicle.fuel}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Transmission:</span>
                    <span className="text-emerald-400 font-bold">4G TELEMATICS ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
