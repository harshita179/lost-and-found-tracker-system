const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// Predefined campus locations with coordinates
const campusLocations = [
  { id: 1, name: 'Main Gate', lat: 28.7517, lng: 77.4978, zone: 'Entrance' },
  { id: 2, name: 'Library', lat: 28.7521, lng: 77.4982, zone: 'Academic' },
  { id: 3, name: 'Block A - Computer Science', lat: 28.7525, lng: 77.4985, zone: 'Academic' },
  { id: 4, name: 'Block B - Electronics', lat: 28.7528, lng: 77.4988, zone: 'Academic' },
  { id: 5, name: 'Block C - Mechanical', lat: 28.7531, lng: 77.4991, zone: 'Academic' },
  { id: 6, name: 'Block D - Civil', lat: 28.7534, lng: 77.4994, zone: 'Academic' },
  { id: 7, name: 'Cafeteria', lat: 28.7523, lng: 77.4979, zone: 'Food Court' },
  { id: 8, name: 'Sports Ground', lat: 28.7515, lng: 77.4975, zone: 'Sports' },
  { id: 9, name: 'Hostel Block 1', lat: 28.7540, lng: 77.5000, zone: 'Hostel' },
  { id: 10, name: 'Hostel Block 2', lat: 28.7543, lng: 77.5003, zone: 'Hostel' },
  { id: 11, name: 'Parking Area', lat: 28.7510, lng: 77.4970, zone: 'Parking' },
  { id: 12, name: 'Admin Block', lat: 28.7520, lng: 77.4980, zone: 'Administration' },
  { id: 13, name: 'Auditorium', lat: 28.7518, lng: 77.4976, zone: 'Events' },
  { id: 14, name: 'Laboratory Complex', lat: 28.7526, lng: 77.4990, zone: 'Academic' },
  { id: 15, name: 'Parking Lot B', lat: 28.7508, lng: 77.4968, zone: 'Parking' },
  { id: 16, name: 'Other', lat: null, lng: null, zone: 'Other' }
];

// Get all campus locations
router.get('/locations', (req, res) => {
  res.json({
    locations: campusLocations.map(loc => ({
      id: loc.id,
      name: loc.name,
      zone: loc.zone,
      coordinates: loc.lat ? { lat: loc.lat, lng: loc.lng } : null
    }))
  });
});

// Get location by ID
router.get('/locations/:id', (req, res) => {
  const location = campusLocations.find(loc => loc.id === parseInt(req.params.id));
  
  if (!location) {
    return res.status(404).json({ message: 'Location not found' });
  }

  res.json({
    id: location.id,
    name: location.name,
    zone: location.zone,
    coordinates: location.lat ? { lat: location.lat, lng: location.lng } : null
  });
});

// Search locations by name
router.get('/locations/search/:query', (req, res) => {
  const query = req.params.query.toLowerCase();
  const results = campusLocations.filter(loc => 
    loc.name.toLowerCase().includes(query) || 
    loc.zone.toLowerCase().includes(query)
  );

  res.json({
    locations: results.map(loc => ({
      id: loc.id,
      name: loc.name,
      zone: loc.zone,
      coordinates: loc.lat ? { lat: loc.lat, lng: loc.lng } : null
    }))
  });
});

module.exports = router;