import { db } from '../storage/db.js';

export const getFacilities = (req, res) => {
  try {
    const facilities = db.find('facilities');
    return res.json({ success: true, count: facilities.length, data: facilities });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getFacilityById = (req, res) => {
  try {
    const facility = db.findById('facilities', req.params.id);
    if (!facility) {
      return res.status(404).json({ success: false, message: `Facility ${req.params.id} not found` });
    }
    return res.json({ success: true, data: facility });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
