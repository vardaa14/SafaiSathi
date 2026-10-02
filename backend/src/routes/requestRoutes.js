import { Router } from 'express';
import {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  updateRequestStatus,
  submitProof
} from '../controllers/requestController.js';

const router = Router();

router.get('/', getRequests);
router.get('/:id', getRequestById);
router.post('/', createRequest);
router.put('/:id', updateRequest);
router.patch('/:id/status', updateRequestStatus);
router.post('/:id/proof', submitProof);

export default router;
