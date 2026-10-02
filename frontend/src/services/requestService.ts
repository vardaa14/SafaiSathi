import type { PickupRequest } from '../types/request';
import { notificationService } from './notificationService';

const STORAGE_KEY = 'safaisaathi_pickup_requests_v1';

class RequestService {
  private requests: PickupRequest[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Filter out old fake static seeds (REQ-101..105, BIN-201..205) if they exist
            this.requests = parsed.filter(
              r => !r.id.startsWith('REQ-10') && !r.id.startsWith('BIN-20')
            );
            this.persist();
            return;
          }
        } catch {
          // ignore
        }
      }
    }
    this.requests = [];
  }

  private persist() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.requests));
    }
  }

  public getRequests(): PickupRequest[] {
    return [...this.requests];
  }

  public getCitizenRequests(phone?: string): PickupRequest[] {
    if (phone) {
      return this.requests.filter(r => r.citizenPhone === phone);
    }
    return [...this.requests];
  }

  public getRequestsByVehicle(vehicleId: string): PickupRequest[] {
    return this.requests.filter(r => r.assignedVehicleId === vehicleId);
  }

  public getPendingRequests(): PickupRequest[] {
    return this.requests.filter(r => r.status === 'PENDING_ADMIN');
  }

  public getApprovedRequests(): PickupRequest[] {
    return this.requests.filter(
      r =>
        r.status === 'VALIDATED' ||
        r.status === 'PRIORITIZED' ||
        r.status === 'ASSIGNED' ||
        r.status === 'EN_ROUTE' ||
        r.status === 'ARRIVED' ||
        r.status === 'COLLECTED'
    );
  }

  public createRequest(newReq: PickupRequest): PickupRequest {
    // Check if duplicate exists
    const existingIndex = this.requests.findIndex(r => r.id === newReq.id);
    if (existingIndex >= 0) {
      this.requests[existingIndex] = newReq;
    } else {
      this.requests = [newReq, ...this.requests];
    }
    this.persist();
    return newReq;
  }

  public updateRequestStatus(
    id: string,
    status: PickupRequest['status'],
    adminNotes?: string
  ): PickupRequest | null {
    const target = this.requests.find(r => r.id === id);
    if (!target) return null;
    target.status = status;
    if (adminNotes !== undefined) {
      target.adminNotes = adminNotes;
    }
    this.persist();
    return { ...target };
  }

  public approveRequest(
    id: string,
    priorityScore: number = 85,
    adminNotes?: string
  ): PickupRequest | null {
    const target = this.requests.find(r => r.id === id);
    if (!target) return null;
    target.status = 'PRIORITIZED';
    target.priorityScore = priorityScore;
    if (adminNotes) {
      target.adminNotes = adminNotes;
    }
    this.persist();
    return { ...target };
  }

  public approveAllPending(): PickupRequest[] {
    this.requests = this.requests.map(r => {
      if (r.status === 'PENDING_ADMIN') {
        return {
          ...r,
          status: 'PRIORITIZED',
          priorityScore: r.priorityScore || 80
        };
      }
      return r;
    });
    this.persist();
    return [...this.requests];
  }

  public rejectRequest(id: string, reason?: string): PickupRequest | null {
    const target = this.requests.find(r => r.id === id);
    if (!target) return null;
    target.status = 'REJECTED';
    if (reason) {
      target.adminNotes = reason;
    }
    this.persist();
    return { ...target };
  }

  public allocateVehicle(requestId: string, vehicleId: string): PickupRequest | null {
    const target = this.requests.find(r => r.id === requestId);
    if (!target) return null;
    target.assignedVehicleId = vehicleId;
    target.status = 'ASSIGNED';
    this.persist();
    return { ...target };
  }

  public deallocateVehicle(requestId: string): PickupRequest | null {
    const target = this.requests.find(r => r.id === requestId);
    if (!target) return null;
    target.assignedVehicleId = null;
    target.status = 'PRIORITIZED';
    this.persist();
    return { ...target };
  }

  // Driver lifecycle: 1. En Route
  public markEnRoute(requestId: string, vehicleId: string, driverName: string = 'Driver'): PickupRequest | null {
    const target = this.requests.find(r => r.id === requestId);
    if (!target) return null;
    target.status = 'EN_ROUTE';
    target.assignedVehicleId = vehicleId;
    this.persist();

    notificationService.emit({
      type: 'TRIP_STARTED',
      requestId: target.id,
      vehicleId,
      driverName,
      customerName: target.citizenName,
      customerAddress: target.address || target.name,
      title: `Truck ${vehicleId} is En Route`,
      message: `Driver ${driverName} is on the way to ${target.address || target.name} for waste pickup.`
    });

    return { ...target };
  }

  // Driver lifecycle: 2. Arrived at Customer Location (Triggers POPUP to Admin & User)
  public markArrived(requestId: string, vehicleId: string, driverName: string = 'Driver', driverPhone?: string): PickupRequest | null {
    const target = this.requests.find(r => r.id === requestId);
    if (!target) return null;
    target.status = 'ARRIVED';
    target.arrivedAt = new Date().toISOString();
    this.persist();

    // Broadcast pop-up notification across all portals
    notificationService.emit({
      type: 'VEHICLE_ARRIVED',
      requestId: target.id,
      vehicleId,
      driverName,
      driverPhone,
      customerName: target.citizenName,
      customerAddress: target.address || target.name,
      title: `🚚 Truck ${vehicleId} Has Arrived!`,
      message: `Driver ${driverName} (${vehicleId}) has reached the pickup location at ${target.address || target.name}.`
    });

    return { ...target };
  }

  // Driver lifecycle: 3. Collect Trash & Upload Proof Photo
  public uploadCollectionProof(
    requestId: string,
    proofImageUrl: string,
    collectedWeightKg?: number,
    driverNotes?: string,
    vehicleId: string = 'TRUCK',
    driverName: string = 'Driver'
  ): PickupRequest | null {
    const target = this.requests.find(r => r.id === requestId);
    if (!target) return null;
    target.status = 'COLLECTED';
    target.proofImageUrl = proofImageUrl;
    target.proofTimestamp = new Date().toISOString();
    target.collectedAt = new Date().toISOString();
    if (collectedWeightKg !== undefined && collectedWeightKg > 0) {
      target.quantityKg = collectedWeightKg;
    }
    if (driverNotes) {
      target.driverNotes = driverNotes;
    }
    this.persist();

    // Broadcast collection photo proof across portals
    notificationService.emit({
      type: 'COLLECTION_COMPLETED',
      requestId: target.id,
      vehicleId,
      driverName,
      customerName: target.citizenName,
      customerAddress: target.address || target.name,
      proofImageUrl,
      title: `📸 Waste Collected & Photo Uploaded!`,
      message: `Driver ${driverName} collected ${target.quantityKg}kg of ${target.wasteType} waste and verified with photo proof.`
    });

    return { ...target };
  }

  // Driver lifecycle: 4. Complete Request & Trip
  public completeRequest(requestId: string): PickupRequest | null {
    const target = this.requests.find(r => r.id === requestId);
    if (!target) return null;
    target.status = 'COMPLETED';
    this.persist();
    return { ...target };
  }

  public deleteRequest(id: string): boolean {
    const initialLen = this.requests.length;
    this.requests = this.requests.filter(r => r.id !== id);
    if (this.requests.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public clearAllRequests(): PickupRequest[] {
    this.requests = [];
    this.persist();
    return [];
  }
}

export const requestService = new RequestService();
