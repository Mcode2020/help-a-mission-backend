import { getDb } from '../config/db.js';
import { INITIAL_TEAM, INITIAL_IMPACT } from '../data/initialData.js';

/**
 * GET /api/team
 * Get active team members list
 */
export async function getTeam(req, res, next) {
  try {
    let team = [];
    try {
      const db = getDb();
      team = await db.collection('team').find({}).toArray();
      if (!team || team.length === 0) team = INITIAL_TEAM;
    } catch {
      team = INITIAL_TEAM;
    }

    res.json({
      status: 'success',
      count: team.length,
      data: team
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/impact
 * Get impact stories and NGO key achievements summary
 */
export async function getImpact(req, res, next) {
  try {
    let impactStories = [];
    try {
      const db = getDb();
      impactStories = await db.collection('impact_stories').find({}).toArray();
      if (!impactStories || impactStories.length === 0) impactStories = INITIAL_IMPACT;
    } catch {
      impactStories = INITIAL_IMPACT;
    }

    res.json({
      status: 'success',
      data: {
        summary: {
          livesImpacted: 25000,
          mealsServed: 120000,
          medicalCampsHeld: 45,
          scholarshipsProvided: 350,
          activeVolunteers: 180
        },
        stories: impactStories
      }
    });
  } catch (err) {
    next(err);
  }
}
