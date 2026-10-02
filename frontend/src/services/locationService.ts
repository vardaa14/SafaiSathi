import type { Location } from '../types/location';
import type { Facility } from '../types/facility';
import type { PickupRequest } from '../types/request';
import { ALL_LOCATIONS_ARRAY, DEFAULT_DEPOT } from '../data/locations';
import { SEEDED_FACILITIES } from '../data/facilities';
import { SEEDED_REQUESTS } from '../data/requests';

class LocationService {
  public async getLocations(): Promise<Location[]> {
    return Promise.resolve([...ALL_LOCATIONS_ARRAY]);
  }

  public async getDepot(): Promise<Location> {
    return Promise.resolve({ ...DEFAULT_DEPOT });
  }

  public async getFacilities(): Promise<Facility[]> {
    return Promise.resolve([...SEEDED_FACILITIES]);
  }

  public async getRequests(): Promise<PickupRequest[]> {
    return Promise.resolve([...SEEDED_REQUESTS]);
  }
}

export const locationService = new LocationService();
