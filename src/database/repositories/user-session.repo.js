// @intent Repository for user_sessions table operations (session lookup, creation, revocation, activity tracking).
import BaseRepository from './base.repo.js';
import db from '../knex.client.js';

export class UserSessionRepository extends BaseRepository {
  constructor() {
    super('user_sessions', false, false);
  }

  /**
   * Find an active, valid user session by session token hash.
   * @param {string} tokenHash 
   * @returns {Promise<object|null>}
   */
  async findValidByTokenHash(tokenHash) {
    return await this.query()
      .join('users', 'user_sessions.user_id', 'users.id')
      .where('user_sessions.session_token_hash', tokenHash)
      .whereNull('user_sessions.revoked_at')
      .where('user_sessions.expires_at', '>', new Date())
      .where('users.status', 'active')
      .whereNull('users.deleted_at')
      .select(
        'user_sessions.*',
        'users.id as user_id',
        'users.email',
        'users.email_normalized',
        'users.name',
        'users.phone',
        'users.role',
        'users.status as user_status'
      )
      .first();
  }

  /**
   * Update last seen timestamp of active session.
   * @param {string} sessionId 
   */
  async updateLastSeen(sessionId) {
    const qb = db('user_sessions');
    return await qb.where({ id: sessionId }).update({ last_seen_at: new Date() });
  }

  /**
   * Revoke session by session ID or token hash.
   * @param {string} tokenHash 
   */
  async revokeByTokenHash(tokenHash) {
    const qb = db('user_sessions');
    return await qb
      .where({ session_token_hash: tokenHash })
      .whereNull('revoked_at')
      .update({ revoked_at: new Date() });
  }

  /**
   * Revoke all active sessions for a user ID.
   * @param {string} userId 
   */
  async revokeAllForUser(userId) {
    const qb = db('user_sessions');
    return await qb
      .where({ user_id: userId })
      .whereNull('revoked_at')
      .update({ revoked_at: new Date() });
  }
}

export const userSessionRepository = new UserSessionRepository();
export default userSessionRepository;
