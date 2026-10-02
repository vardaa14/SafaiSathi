import type { Location } from '../types/location';

/**
 * Centralized Simulated Mumbai Locations
 * All spatial coordinates across the application reference these canonical definitions.
 * Note: These are simulated coordinates for hackathon modeling.
 */
export const LOCATIONS: Record<string, Location> = {
  // DEPOTS & MAIN HUBS
  'DEPOT_CENTRAL': {
    id: 'DEPOT_CENTRAL',
    name: 'BKC Central Fleet Operations Depot',
    latitude: 19.0657,
    longitude: 72.8687,
    type: 'DEPOT',
    zone: 'Zone 1 - Central Hub',
    address: 'G Block, Bandra Kurla Complex, Mumbai, MH 400051',
    description: 'Central vehicle dispatch, EV fast charging, and overnight maintenance yard.'
  },
  'DEPOT_WEST': {
    id: 'DEPOT_WEST',
    name: 'Bandra Reclamation Western Yard',
    latitude: 19.0485,
    longitude: 72.8320,
    type: 'DEPOT',
    zone: 'Zone 2 - West Coastal',
    address: 'Reclamation Promenade, Bandra West, Mumbai, MH 400050',
    description: 'Secondary staging depot for coastal and southern sector compactors.'
  },

  // PROCESSING & RECOVERY FACILITIES
  'FAC_DEONAR': {
    id: 'FAC_DEONAR',
    name: 'Deonar Solid Waste Processing Center',
    latitude: 19.0494,
    longitude: 72.9142,
    type: 'FACILITY',
    zone: 'Zone 3 - Eastern Industrial',
    address: 'Ghatkopar-Mankhurd Link Rd, Deonar, Mumbai, MH 400043',
    description: 'Waste-to-energy conversion and bulk municipal composting facility.'
  },
  'FAC_KANJURMARG': {
    id: 'FAC_KANJURMARG',
    name: 'Kanjurmarg Integrated Bio-Methanation Plant',
    latitude: 19.1310,
    longitude: 72.9350,
    type: 'FACILITY',
    zone: 'Zone 4 - North East',
    address: 'Eastern Express Highway, Kanjurmarg East, Mumbai, MH 400042',
    description: 'Automated sorting and high-capacity anaerobic digestion plant.'
  },
  'FAC_DHARAVI_MRF': {
    id: 'FAC_DHARAVI_MRF',
    name: 'Dharavi Clean Recyclables Hub',
    latitude: 19.0420,
    longitude: 72.8560,
    type: 'FACILITY',
    zone: 'Zone 1 - Central',
    address: 'Sion-Bandra Link Rd, Dharavi, Mumbai, MH 400017',
    description: 'Specialized dry recyclables sorting and plastic baling facility.'
  },

  // ANDHERI
  'LOC_ANDHERI_W': {
    id: 'LOC_ANDHERI_W',
    name: 'Andheri West Market Complex',
    latitude: 19.1363,
    longitude: 72.8277,
    type: 'REQUEST',
    zone: 'Zone 5 - Andheri Sub-division',
    address: 'S.V. Road, Near Andheri Station West, Mumbai, MH 400058'
  },
  'LOC_ANDHERI_MIDC': {
    id: 'LOC_ANDHERI_MIDC',
    name: 'Andheri East MIDC Commercial Hub',
    latitude: 19.1176,
    longitude: 72.8681,
    type: 'BIN',
    zone: 'Zone 5 - Andheri Sub-division',
    address: 'Central Way, Andheri East, Mumbai, MH 400093'
  },
  'LOC_ANDHERI_LOKHANDWALA': {
    id: 'LOC_ANDHERI_LOKHANDWALA',
    name: 'Lokhandwala High Street Hub',
    latitude: 19.1438,
    longitude: 72.8252,
    type: 'BIN',
    zone: 'Zone 5 - Andheri Sub-division',
    address: 'Lokhandwala Complex, Andheri West, Mumbai, MH 400053'
  },

  // BANDRA
  'LOC_BANDRA_LINKING': {
    id: 'LOC_BANDRA_LINKING',
    name: 'Bandra Linking Road Retail District',
    latitude: 19.0596,
    longitude: 72.8295,
    type: 'REQUEST',
    zone: 'Zone 2 - West Coastal',
    address: 'Linking Road, Bandra West, Mumbai, MH 400050'
  },
  'LOC_BANDRA_HILLRD': {
    id: 'LOC_BANDRA_HILLRD',
    name: 'Hill Road Commercial Strip',
    latitude: 19.0534,
    longitude: 72.8315,
    type: 'BIN',
    zone: 'Zone 2 - West Coastal',
    address: 'Hill Road, Bandra West, Mumbai, MH 400050'
  },
  'LOC_BANDRA_KALANAGAR': {
    id: 'LOC_BANDRA_KALANAGAR',
    name: 'Bandra East Kala Nagar Junction',
    latitude: 19.0580,
    longitude: 72.8520,
    type: 'REQUEST',
    zone: 'Zone 2 - West Coastal',
    address: 'Kala Nagar, Bandra East, Mumbai, MH 400051'
  },

  // BKC
  'LOC_BKC_GBURN': {
    id: 'LOC_BKC_GBURN',
    name: 'BKC Financial Center G-Block',
    latitude: 19.0688,
    longitude: 72.8690,
    type: 'BIN',
    zone: 'Zone 1 - Central Hub',
    address: 'Bandra-Kurla Complex Avenue, Mumbai, MH 400051'
  },
  'LOC_BKC_CONVENTION': {
    id: 'LOC_BKC_CONVENTION',
    name: 'Jio World Convention Center Node',
    latitude: 19.0620,
    longitude: 72.8645,
    type: 'REQUEST',
    zone: 'Zone 1 - Central Hub',
    address: 'BKC Central Avenue, Mumbai, MH 400051'
  },

  // KURLA
  'LOC_KURLA_LBS': {
    id: 'LOC_KURLA_LBS',
    name: 'Kurla West LBS Marg Junction',
    latitude: 19.0726,
    longitude: 72.8845,
    type: 'REQUEST',
    zone: 'Zone 1 - Central Hub',
    address: 'LBS Marg, Kurla West, Mumbai, MH 400070'
  },
  'LOC_KURLA_PHOENIX': {
    id: 'LOC_KURLA_PHOENIX',
    name: 'Phoenix Marketcity Waste Hub',
    latitude: 19.0865,
    longitude: 72.8885,
    type: 'BIN',
    zone: 'Zone 1 - Central Hub',
    address: 'LBS Marg, Kurla West, Mumbai, MH 400070'
  },
  'LOC_KURLA_NEHRUNAGAR': {
    id: 'LOC_KURLA_NEHRUNAGAR',
    name: 'Nehru Nagar Civic Collection Point',
    latitude: 19.0635,
    longitude: 72.8890,
    type: 'REQUEST',
    zone: 'Zone 1 - Central Hub',
    address: 'Nehru Nagar, Kurla East, Mumbai, MH 400024'
  },

  // POWAI
  'LOC_POWAI_HIRANANDANI': {
    id: 'LOC_POWAI_HIRANANDANI',
    name: 'Hiranandani Gardens Plaza',
    latitude: 19.1197,
    longitude: 72.9051,
    type: 'BIN',
    zone: 'Zone 4 - North East',
    address: 'Central Avenue, Hiranandani Gardens, Powai, Mumbai, MH 400076'
  },
  'LOC_POWAI_IIT': {
    id: 'LOC_POWAI_IIT',
    name: 'Powai IIT Main Gate Eco-Point',
    latitude: 19.1254,
    longitude: 72.9150,
    type: 'REQUEST',
    zone: 'Zone 4 - North East',
    address: 'Adi Shankaracharya Marg, Powai, Mumbai, MH 400076'
  },

  // DADAR
  'LOC_DADAR_SHIVAJIPARK': {
    id: 'LOC_DADAR_SHIVAJIPARK',
    name: 'Shivaji Park Civic Corner',
    latitude: 19.0269,
    longitude: 72.8397,
    type: 'BIN',
    zone: 'Zone 6 - South Central',
    address: 'Keluskar Road, Shivaji Park, Dadar, Mumbai, MH 400028'
  },
  'LOC_DADAR_FLOWER': {
    id: 'LOC_DADAR_FLOWER',
    name: 'Dadar Flower Market Wholesale Area',
    latitude: 19.0185,
    longitude: 72.8433,
    type: 'REQUEST',
    zone: 'Zone 6 - South Central',
    address: 'Senapati Bapat Marg, Dadar West, Mumbai, MH 400028'
  },

  // GOREGAON
  'LOC_GOREGAON_LINK': {
    id: 'LOC_GOREGAON_LINK',
    name: 'Goregaon West Link Road Station',
    latitude: 19.1645,
    longitude: 72.8360,
    type: 'REQUEST',
    zone: 'Zone 7 - Northern Corridor',
    address: 'New Link Road, Goregaon West, Mumbai, MH 400104'
  },
  'LOC_GOREGAON_NESO': {
    id: 'LOC_GOREGAON_NESO',
    name: 'Nesco Exhibition Center Waste Port',
    latitude: 19.1558,
    longitude: 72.8538,
    type: 'BIN',
    zone: 'Zone 7 - Northern Corridor',
    address: 'Western Express Highway, Goregaon East, Mumbai, MH 400063'
  },

  // BORIVALI
  'LOC_BORIVALI_SHIMPOLI': {
    id: 'LOC_BORIVALI_SHIMPOLI',
    name: 'Shimpoli Road Commercial Node',
    latitude: 19.2307,
    longitude: 72.8567,
    type: 'REQUEST',
    zone: 'Zone 7 - Northern Corridor',
    address: 'Shimpoli Road, Borivali West, Mumbai, MH 400092'
  },
  'LOC_BORIVALI_STATION': {
    id: 'LOC_BORIVALI_STATION',
    name: 'Borivali Station East Transit Hub',
    latitude: 19.2288,
    longitude: 72.8625,
    type: 'BIN',
    zone: 'Zone 7 - Northern Corridor',
    address: 'Station Road, Borivali East, Mumbai, MH 400066'
  },

  // LOWER PAREL
  'LOC_LOWERPAREL_MILLS': {
    id: 'LOC_LOWERPAREL_MILLS',
    name: 'High Street Phoenix Mills Complex',
    latitude: 19.0018,
    longitude: 72.8267,
    type: 'BIN',
    zone: 'Zone 6 - South Central',
    address: 'Senapati Bapat Marg, Lower Parel, Mumbai, MH 400013'
  },
  'LOC_LOWERPAREL_CURREY': {
    id: 'LOC_LOWERPAREL_CURREY',
    name: 'Currey Road Station East Depot Link',
    latitude: 19.0025,
    longitude: 72.8378,
    type: 'REQUEST',
    zone: 'Zone 6 - South Central',
    address: 'Dr Babasaheb Ambedkar Rd, Lower Parel East, Mumbai, MH 400012'
  },

  // SIMULATED EMERGENCY / DYNAMIC SITES
  'LOC_DYNAMIC_CRITICAL': {
    id: 'LOC_DYNAMIC_CRITICAL',
    name: 'Kurla Hospital Overflow Point (EMERGENCY)',
    latitude: 19.0780,
    longitude: 72.8790,
    type: 'REQUEST',
    zone: 'Zone 1 - Central Hub',
    address: 'Belgrami Rd, Kurla West, Mumbai, MH 400070',
    description: 'High-volume medical packaging overflow reported near public clinic.'
  }
};

export const DEFAULT_DEPOT = LOCATIONS['DEPOT_CENTRAL'];
export const ALL_LOCATIONS_ARRAY = Object.values(LOCATIONS);
