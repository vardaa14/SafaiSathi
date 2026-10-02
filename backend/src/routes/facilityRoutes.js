import { Router } from 'express';
import { getFacilities, getFacilityById } from '../controllers/facilityController.js';

const router = Router();

router.get('/', getFacilities);
router.get('/:id', getFacilityById);

export default router;
