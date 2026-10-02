import type { Vehicle, VehicleStatus } from '../types/vehicle';
import { SEEDED_VEHICLES } from '../data/vehicles';

class VehicleService {
  private vehicles: Vehicle[] = [...SEEDED_VEHICLES];

  public async getVehicles(): Promise<Vehicle[]> {
    return Promise.resolve([...this.vehicles]);
  }

  public async getVehicleById(id: string): Promise<Vehicle | undefined> {
    return Promise.resolve(this.vehicles.find(v => v.id === id));
  }

  public async updateVehicleStatus(id: string, status: VehicleStatus): Promise<Vehicle | null> {
    const v = this.vehicles.find(item => item.id === id);
    if (!v) return null;
    v.status = status;
    return Promise.resolve({ ...v });
  }

  public async updateVehiclePosition(
    id: string,
    latitude: number,
    longitude: number,
    speed: number = 24
  ): Promise<Vehicle | null> {
    const v = this.vehicles.find(item => item.id === id);
    if (!v) return null;
    v.latitude = latitude;
    v.longitude = longitude;
    v.speed = speed;
    return Promise.resolve({ ...v });
  }
}

export const vehicleService = new VehicleService();
