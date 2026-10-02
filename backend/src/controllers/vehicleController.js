import { db } from '../storage/db.js';

export const getVehicles = (req, res) => {
  try {
    const { status, type } = req.query;
    let vehicles = db.find('vehicles');
    if (status) {
      vehicles = vehicles.filter((v) => v.status === status.toUpperCase());
    }
    if (type) {
      vehicles = vehicles.filter((v) => v.type === type.toUpperCase());
    }
    return res.json({ success: true, count: vehicles.length, data: vehicles });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVehicleById = (req, res) => {
  try {
    const vehicle = db.findById('vehicles', req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: `Vehicle ${req.params.id} not found` });
    }
    return res.json({ success: true, data: vehicle });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createVehicle = (req, res) => {
  try {
    const {
      id,
      registration,
      driver,
      driverId,
      driverPhone,
      type,
      capacityKg,
      color,
      model,
      fuelType,
      latitude,
      longitude
    } = req.body;

    if (!id || !registration || !capacityKg) {
      return res.status(400).json({ success: false, message: 'id, registration, and capacityKg are required' });
    }

    const existing = db.findById('vehicles', id);
    if (existing) {
      return res.status(409).json({ success: false, message: `Vehicle with id ${id} already exists` });
    }

    const newVehicle = {
      id,
      registration,
      driverId: driverId || null,
      driver: driver || 'Unassigned',
      driverPhone: driverPhone || '',
      type: type || 'COMPACTOR',
      capacityKg: Number(capacityKg),
      currentLoadKg: 0,
      remainingCapacityKg: Number(capacityKg),
      latitude: Number(latitude) || 19.0657,
      longitude: Number(longitude) || 72.8687,
      speed: 0,
      fuel: 100,
      status: 'AVAILABLE',
      currentRouteId: null,
      completedStops: 0,
      remainingStops: 0,
      color: color || '#3B82F6',
      model: model || 'Standard Municipal Compactor',
      fuelType: fuelType || 'DIESEL'
    };

    db.insert('vehicles', newVehicle);
    return res.status(201).json({ success: true, data: newVehicle });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVehicle = (req, res) => {
  try {
    const updated = db.update('vehicles', req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Vehicle ${req.params.id} not found` });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVehicleLocation = (req, res) => {
  try {
    const { latitude, longitude, speed } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
    }
    const updated = db.update('vehicles', req.params.id, {
      latitude: Number(latitude),
      longitude: Number(longitude),
      speed: speed !== undefined ? Number(speed) : 24
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: `Vehicle ${req.params.id} not found` });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVehicleStatus = (req, res) => {
  try {
    const { status, currentRouteId, completedStops, remainingStops, currentLoadKg } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }
    const updates = { status };
    if (currentRouteId !== undefined) updates.currentRouteId = currentRouteId;
    if (completedStops !== undefined) updates.completedStops = completedStops;
    if (remainingStops !== undefined) updates.remainingStops = remainingStops;
    if (currentLoadKg !== undefined) {
      updates.currentLoadKg = currentLoadKg;
      const v = db.findById('vehicles', req.params.id);
      if (v) updates.remainingCapacityKg = v.capacityKg - currentLoadKg;
    }
    const updated = db.update('vehicles', req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Vehicle ${req.params.id} not found` });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVehicle = (req, res) => {
  try {
    const deleted = db.delete('vehicles', req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: `Vehicle ${req.params.id} not found` });
    }
    return res.json({ success: true, message: `Vehicle ${req.params.id} deleted successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
