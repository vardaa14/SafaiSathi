import type { PickupRequest } from '../types/request';
import { SEEDED_REQUESTS } from './requests';

export const SEEDED_BINS: PickupRequest[] = SEEDED_REQUESTS.filter(r => r.isBin);
