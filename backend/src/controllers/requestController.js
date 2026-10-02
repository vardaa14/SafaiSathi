import { db } from '../storage/db.js';

export const getRequests = (req, res) => {
  try {
    const { status, priority, vehicleId } = req.query;
    let requests = db.find('requests');
    if (status) {
      requests = requests.filter((r) => r.status === status);
    }
    if (priority) {
      requests = requests.filter((r) => r.priority === priority);
    }
    if (vehicleId) {
      requests = requests.filter((r) => r.assignedVehicleId === vehicleId);
    }
    return res.json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRequestById = (req, res) => {
  try {
    const request = db.findById('requests', req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: `Request ${req.params.id} not found` });
    }
    return res.json({ success: true, data: request });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createRequest = (req, res) => {
  try {
    const {
      name,
      locationId,
      latitude,
      longitude,
      zone,
      wasteType,
      quantityKg,
      priority,
      urgency,
      address,
      citizenName,
      citizenPhone,
      description,
      imageUrl
    } = req.body;

    const newId = `REQ-${Date.now().toString().slice(-4)}`;
    const newRequest = {
      id: newId,
      name: name || `Citizen Waste Report (${wasteType || 'General'})`,
      locationId: locationId || 'LOC_DYNAMIC',
      latitude: Number(latitude) || 19.0682,
      longitude: Number(longitude) || 72.8791,
      zone: zone || 'Zone 1 - Central Hub',
      wasteType: wasteType || 'MIXED',
      quantityKg: Number(quantityKg) || 15,
      priority: priority || 'MEDIUM',
      priorityScore: priority === 'CRITICAL' ? 95 : priority === 'HIGH' ? 80 : 50,
      urgency: Number(urgency) || 5,
      waitingTime: 0,
      status: 'PENDING_ADMIN',
      assignedVehicleId: null,
      createdAt: new Date().toISOString(),
      address: address || 'Mumbai, Maharashtra',
      isBin: false,
      citizenName: citizenName || 'Citizen User',
      citizenPhone: citizenPhone || '+91 98000 00000',
      description: description || '',
      imageUrl: imageUrl || ''
    };

    db.insert('requests', newRequest);
    return res.status(201).json({ success: true, data: newRequest });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRequest = (req, res) => {
  try {
    const updated = db.update('requests', req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Request ${req.params.id} not found` });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRequestStatus = (req, res) => {
  try {
    const { status, assignedVehicleId, rejectionReason } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }
    const updates = { status };
    if (assignedVehicleId !== undefined) updates.assignedVehicleId = assignedVehicleId;
    if (rejectionReason !== undefined) updates.rejectionReason = rejectionReason;

    const updated = db.update('requests', req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Request ${req.params.id} not found` });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitProof = (req, res) => {
  try {
    const { proofImage, collectedWeightKg, driverNotes, driverId } = req.body;
    const updates = {
      status: 'COLLECTED',
      collectionProofImage: proofImage || '',
      actualQuantityKg: Number(collectedWeightKg) || 0,
      driverNotes: driverNotes || '',
      collectedAt: new Date().toISOString(),
      collectedByDriverId: driverId || ''
    };

    const updated = db.update('requests', req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Request ${req.params.id} not found` });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
