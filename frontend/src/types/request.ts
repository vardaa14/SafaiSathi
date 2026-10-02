export type RequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RequestStatus =
  | 'PENDING_ADMIN'
  | 'REPORTED'
  | 'VALIDATED'
  | 'PRIORITIZED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'COLLECTED'
  | 'VERIFIED'
  | 'COMPLETED'
  | 'MISSED'
  | 'REJECTED';

export type WasteType =
  | 'ORGANIC'
  | 'RECYCLABLE'
  | 'HAZARDOUS'
  | 'MIXED_MUNICIPAL'
  | 'CONSTRUCTION';

export interface PickupRequest {
  id: string;
  name: string;
  locationId: string;
  latitude: number;
  longitude: number;
  zone: string;
  wasteType: WasteType;
  quantityKg: number;
  priority: RequestPriority;
  priorityScore: number;
  urgency: number; // 1 to 10
  waitingTime: number; // in minutes
  fillLevel?: number; // percentage 0-100 for smart bins
  status: RequestStatus;
  assignedVehicleId: string | null;
  createdAt: string;
  address?: string;
  isBin?: boolean;
  citizenName?: string;
  citizenPhone?: string;
  description?: string;
  imageUrl?: string;
  adminNotes?: string;
  proofImageUrl?: string;
  proofTimestamp?: string;
  arrivedAt?: string;
  collectedAt?: string;
  driverNotes?: string;
}

