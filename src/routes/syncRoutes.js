import express from 'express';
import { authRequired } from '../middlewares/auth.js';
import { syncAllAttendanceConfigs } from '../services/attendanceService.js';

export const syncRouter = express.Router();

syncRouter.post('/attendance/all', authRequired, async (req, res) => {
  try {
    await syncAllAttendanceConfigs();
    res.json({ message: 'Sincronización completada' });
  } catch (err) {
    console.error('Error sync:', err);
    res.status(500).json({ error: 'Error sincronizando desde Moodle' });
  }
});
