import { db } from '../storage/db.js';

export const getDrivers = (req, res) => {
  try {
    const { status, shift } = req.query;
    let drivers = db.find('drivers');
    if (status) {
      drivers = drivers.filter((d) => d.status === status.toUpperCase());
    }
    if (shift) {
      drivers = drivers.filter((d) => d.shift.toLowerCase().includes(shift.toLowerCase()));
    }
    return res.json({ success: true, count: drivers.length, data: drivers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDriverById = (req, res) => {
  try {
    const driver = db.findById('drivers', req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: `Driver ${req.params.id} not found` });
    }
    return res.json({ success: true, data: driver });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createDriver = (req, res) => {
  try {
    const {
      id,
      name,
      phone,
      email,
      licenseNumber,
      licenseType,
      assignedVehicleId,
      status,
      shift,
      experienceYears,
      emergencyContact,
      address,
      avatar
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'name and phone are required' });
    }

    const driverId = id || `DRV-${String(db.find('drivers').length + 1).padStart(2, '0')}`;
    const existing = db.findById('drivers', driverId);
    if (existing) {
      return res.status(409).json({ success: false, message: `Driver with id ${driverId} already exists` });
    }

    const newDriver = {
      id: driverId,
      name,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@safaisaathi.mumbai.gov.in`,
      licenseNumber: licenseNumber || `MH-01-2022-${Math.floor(10000 + Math.random() * 90000)}`,
      licenseType: licenseType || 'HEAVY_COMMERCIAL_VEHICLE (HCV)',
      assignedVehicleId: assignedVehicleId || null,
      status: status || 'ON_DUTY',
      shift: shift || 'MORNING (06:00 - 14:00)',
      experienceYears: Number(experienceYears) || 3,
      rating: 5.0,
      totalTripsCompleted: 0,
      totalWasteCollectedKg: 0,
      emergencyContact: emergencyContact || '',
      address: address || 'Mumbai, Maharashtra',
      joinedDate: new Date().toISOString().split('T')[0],
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
    };

    db.insert('drivers', newDriver);
    return res.status(201).json({ success: true, data: newDriver });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDriver = (req, res) => {
  try {
    const updated = db.update('drivers', req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: `Driver ${req.params.id} not found` });
    }
    return res.json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteDriver = (req, res) => {
  try {
    const deleted = db.delete('drivers', req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: `Driver ${req.params.id} not found` });
    }
    return res.json({ success: true, message: `Driver ${req.params.id} deleted successfully` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
