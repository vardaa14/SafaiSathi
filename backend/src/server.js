import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import vehicleRoutes from './routes/vehicleRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import facilityRoutes from './routes/facilityRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import { db } from './storage/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/locations', locationRoutes);

// Health check & Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SafaiSaathi Backend API',
    version: '1.0.0',
    stats: {
      drivers: db.find('drivers').length,
      vehicles: db.find('vehicles').length,
      requests: db.find('requests').length,
      facilities: db.find('facilities').length,
      locations: db.find('locations').length
    }
  });
});

// Database Seed Reset Endpoint
app.post('/api/reset', (req, res) => {
  db.loadAll();
  res.json({ success: true, message: 'Database reloaded from storage files.' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Error Handler
app.use((err, req, res, _next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SafaiSaathi Backend Server running on port ${PORT}`);
  console.log(`📡 Base API URL: http://localhost:${PORT}/api`);
  console.log(`🚛 Vehicles Endpoint: http://localhost:${PORT}/api/vehicles`);
  console.log(`👤 Drivers Endpoint:  http://localhost:${PORT}/api/drivers`);
  console.log(`📋 Requests Endpoint: http://localhost:${PORT}/api/requests`);
  console.log(`🏥 Health Check:     http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

export default app;
