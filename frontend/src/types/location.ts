export type LocationType =
  | 'BIN'
  | 'REQUEST'
  | 'FACILITY'
  | 'DEPOT'
  | 'PROCESSING_PLANT'
  | 'LANDFILL'
  | 'RECYCLING_CENTER'
  | 'TRANSFER_STATION';

export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: LocationType;
  zone: string;
  address?: string;
  description?: string;
}
