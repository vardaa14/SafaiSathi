import type { Facility } from '../types/facility';
import { LOCATIONS } from './locations';

export const SEEDED_FACILITIES: Facility[] = [
  {
    id: 'FAC-01',
    name: LOCATIONS['FAC_DEONAR'].name,
    type: 'PROCESSING_PLANT',
    latitude: LOCATIONS['FAC_DEONAR'].latitude,
    longitude: LOCATIONS['FAC_DEONAR'].longitude,
    zone: LOCATIONS['FAC_DEONAR'].zone,
    capacityKgDay: 150000,
    currentLoadKg: 84200,
    status: 'OPERATIONAL',
    address: LOCATIONS['FAC_DEONAR'].address
  },
  {
    id: 'FAC-02',
    name: LOCATIONS['FAC_KANJURMARG'].name,
    type: 'PROCESSING_PLANT',
    latitude: LOCATIONS['FAC_KANJURMARG'].latitude,
    longitude: LOCATIONS['FAC_KANJURMARG'].longitude,
    zone: LOCATIONS['FAC_KANJURMARG'].zone,
    capacityKgDay: 120000,
    currentLoadKg: 61500,
    status: 'OPERATIONAL',
    address: LOCATIONS['FAC_KANJURMARG'].address
  },
  {
    id: 'FAC-03',
    name: LOCATIONS['FAC_DHARAVI_MRF'].name,
    type: 'RECYCLING_CENTER',
    latitude: LOCATIONS['FAC_DHARAVI_MRF'].latitude,
    longitude: LOCATIONS['FAC_DHARAVI_MRF'].longitude,
    zone: LOCATIONS['FAC_DHARAVI_MRF'].zone,
    capacityKgDay: 45000,
    currentLoadKg: 19800,
    status: 'OPERATIONAL',
    address: LOCATIONS['FAC_DHARAVI_MRF'].address
  },
  {
    id: 'DEPOT-01',
    name: LOCATIONS['DEPOT_CENTRAL'].name,
    type: 'DEPOT',
    latitude: LOCATIONS['DEPOT_CENTRAL'].latitude,
    longitude: LOCATIONS['DEPOT_CENTRAL'].longitude,
    zone: LOCATIONS['DEPOT_CENTRAL'].zone,
    capacityKgDay: 50000,
    currentLoadKg: 0,
    status: 'OPERATIONAL',
    address: LOCATIONS['DEPOT_CENTRAL'].address
  }
];
