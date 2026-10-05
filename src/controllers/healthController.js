import { getDb } from '../config/db.js';

/**
 * @desc   Check API Health and MongoDB Connection Status
 * @route  GET /api/health
 */
export async function getHealthStatus(req, res, next) {
  try {
    const db = getDb();
    const pingResult = await db.command({ ping: 1 });

    res.json({
      status: 'success',
      message: 'Help A Mission Welfare Society API is healthy',
      database: pingResult.ok === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
}
