import type { PickupRequest } from '../types/request';
import { LOCATIONS } from './locations';

/**
 * Initial dynamic requests dataset.
 * Default is empty so that all incoming citizen tickets from the portal are handled dynamically.
 */
export const SEEDED_REQUESTS: PickupRequest[] = [];

/**
 * Dynamic emergency incident request template for simulation testing
 */
export const SIMULATED_CRITICAL_REQUEST: PickupRequest = {
  id: 'SS-EMERGENCY-999',
  name: 'EMERGENCY: Kurla Hospital Clinical Waste Overflow',
  locationId: 'LOC_DYNAMIC_CRITICAL',
  latitude: LOCATIONS['LOC_DYNAMIC_CRITICAL'].latitude,
  longitude: LOCATIONS['LOC_DYNAMIC_CRITICAL'].longitude,
  zone: LOCATIONS['LOC_DYNAMIC_CRITICAL'].zone,
  wasteType: 'HAZARDOUS',
  quantityKg: 340,
  priority: 'CRITICAL',
  priorityScore: 99,
  urgency: 10,
  waitingTime: 12,
  status: 'PENDING_ADMIN',
  assignedVehicleId: null,
  createdAt: new Date().toISOString(),
  address: LOCATIONS['LOC_DYNAMIC_CRITICAL'].address,
  isBin: false,
  citizenName: 'Dr. Mehra (Kurla Public Hospital)',
  citizenPhone: '+91 98200 11223',
  description: 'Urgent bio-medical non-hazardous packaging overflow blocking clinic rear exit.'
};
