import BaseRepository from './base.repo.js';
import db from '../knex.client.js';

export class AdminSessionRepository extends BaseRepository {
  constructor() {
    super('admin_sessions', false, false);
  }

  async findValidByTokenHash(tokenHash) {
    return await this.query()
      .join('admins', 'admin_sessions.admin_id', 'admins.id')
      .where('admin_sessions.session_token_hash', tokenHash)
      .whereNull('admin_sessions.revoked_at')
      .where('admin_sessions.expires_at', '>', new Date())
      .where('admins.status', 'active')
      .whereNull('admins.deleted_at')
      .select(
        'admin_sessions.*',
        'admins.email',
        'admins.email_normalized',
        'admins.authz_version',
        'admins.mfa_enabled',
        'admins.status as admin_status'
      )
      .first();
  }

  async findRefreshableByTokenHash(tokenHash, maxGraceMinutes = 60) {
    const graceCutoff = new Date(Date.now() - maxGraceMinutes * 60 * 1000);
    return await this.query()
      .join('admins', 'admin_sessions.admin_id', 'admins.id')
      .where('admin_sessions.session_token_hash', tokenHash)
      .whereNull('admin_sessions.revoked_at')
      .where('admin_sessions.expires_at', '>', graceCutoff)
      .where('admins.status', 'active')
      .whereNull('admins.deleted_at')
      .select(
        'admin_sessions.*',
        'admins.email',
        'admins.email_normalized',
        'admins.authz_version',
        'admins.mfa_enabled',
        'admins.status as admin_status'
      )
      .first();
  }

  async updateLastSeen(sessionId) {
    return await this.update(sessionId, { last_seen_at: new Date() });
  }

  async revokeSession(sessionId, reason = 'user_logout', trx = null) {
    const qb = trx ? trx('admin_sessions') : db('admin_sessions');
    return await qb
      .where({ id: sessionId })
      .update({
        revoked_at: new Date(),
        revocation_reason: reason,
      });
  }

  async revokeAllForAdmin(adminId, reason = 'admin_revoke_all', trx = null) {
    const qb = trx ? trx('admin_sessions') : db('admin_sessions');
    return await qb
      .where({ admin_id: adminId })
      .whereNull('revoked_at')
      .update({
        revoked_at: new Date(),
        revocation_reason: reason,
      });
  }

  async getActiveSessionsForAdmin(adminId) {
    return await this.query()
      .where({ admin_id: adminId })
      .whereNull('revoked_at')
      .where('expires_at', '>', new Date())
      .orderBy('last_seen_at', 'desc');
  }
}

export default AdminSessionRepository;
