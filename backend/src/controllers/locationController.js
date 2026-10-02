import { db } from '../storage/db.js';

export const getLocations = (req, res) => {
  try {
    const { type, zone } = req.query;
    let locations = db.find('locations');
    if (type) {
      locations = locations.filter((loc) => loc.type === type.toUpperCase());
    }
    if (zone) {
      locations = locations.filter((loc) => loc.zone.toLowerCase().includes(zone.toLowerCase()));
    }
    return res.json({ success: true, count: locations.length, data: locations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLocationById = (req, res) => {
  try {
    const location = db.findById('locations', req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: `Location ${req.params.id} not found` });
    }
    return res.json({ success: true, data: location });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
