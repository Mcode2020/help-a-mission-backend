import { getDb } from '../config/db.js';

/**
 * @desc   Check API Health and MongoDB Connection Status
 * @route  GET /api/health
 */
export async function getHealthStatus(req, res) {
  let dbStatus = 'disconnected';

  try {
    const db = getDb();
    const pingResult = await db.command({ ping: 1 });
    if (pingResult && pingResult.ok === 1) {
      dbStatus = 'connected';
    }
  } catch {
    dbStatus = 'disconnected';
  }

  res.status(200).json({
    status: 'success',
    message: 'Help A Mission Welfare Society API is healthy',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
}
