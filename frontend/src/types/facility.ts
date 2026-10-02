import type { Location } from './location';

export type FacilityType =
  | 'PROCESSING_PLANT'
  | 'LANDFILL'
  | 'RECYCLING_CENTER'
  | 'DEPOT'
  | 'TRANSFER_STATION';

export interface Facility extends Location {
  capacityKgDay: number;
  currentLoadKg: number;
  status: 'OPERATIONAL' | 'FULL' | 'MAINTENANCE';
}
