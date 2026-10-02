import { Router } from 'express';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  updateVehicleLocation,
  updateVehicleStatus,
  deleteVehicle
} from '../controllers/vehicleController.js';

const router = Router();

router.get('/', getVehicles);
router.get('/:id', getVehicleById);
router.post('/', createVehicle);
router.put('/:id', updateVehicle);
router.patch('/:id/location', updateVehicleLocation);
router.patch('/:id/status', updateVehicleStatus);
router.delete('/:id', deleteVehicle);

export default router;
