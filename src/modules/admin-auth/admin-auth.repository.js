import { AdminRepository, AdminSessionRepository, RoleRepository } from '../../database/repositories/index.js';

const adminRepo = new AdminRepository();
const sessionRepo = new AdminSessionRepository();
const roleRepo = new RoleRepository();

export const adminAuthRepository = {
  async findAdminByEmail(email) {
    const normalized = email.toLowerCase().trim();
    return await adminRepo.findByEmailNormalized(normalized);
  },

  async findAdminById(adminId) {
    const adminWithRoles = await adminRepo.getAdminWithRoles(adminId);
    if (!adminWithRoles) return null;

    const permissions = await adminRepo.getResolvedPermissions(adminId);

    return {
      id: adminWithRoles.id,
      email: adminWithRoles.email,
      status: adminWithRoles.status,
      is_active: adminWithRoles.status === 'active',
      last_login_at: adminWithRoles.last_login_at,
      created_at: adminWithRoles.created_at,
      roles: adminWithRoles.roles,
      role_name: adminWithRoles.roles && adminWithRoles.roles.length > 0 ? adminWithRoles.roles[0].name : 'Admin',
      permissions,
    };
  },

  async updateAdminLastLogin(adminId) {
    return await adminRepo.update(adminId, { last_login_at: new Date() });
  },

  async createSession({ adminId, sessionTokenHash, userAgent, ipAddress, expiresAt }) {
    return await sessionRepo.create({
      admin_id: adminId,
      session_token_hash: sessionTokenHash,
      device_id: 'browser_session',
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: expiresAt,
    });
  },

  async findSessionByTokenHash(sessionTokenHash) {
    return await sessionRepo.findValidByTokenHash(sessionTokenHash);
  },

  async findSessionForRefresh(sessionTokenHash) {
    return await sessionRepo.findRefreshableByTokenHash(sessionTokenHash);
  },

  async touchSession(sessionTokenHash) {
    const session = await sessionRepo.findOneWhere({ session_token_hash: sessionTokenHash });
    if (session) {
      await sessionRepo.updateLastSeen(session.id);
    }
  },

  async refreshSession({ sessionId, newTokenHash, expiresAt, userAgent, ipAddress }) {
    const updatePayload = {
      session_token_hash: newTokenHash,
      expires_at: expiresAt,
      last_seen_at: new Date()
    };
    if (userAgent) updatePayload.user_agent = userAgent;
    if (ipAddress) updatePayload.ip_address = ipAddress;

    return await sessionRepo.update(sessionId, updatePayload);
  },

  async deleteSessionByTokenHash(sessionTokenHash) {
    const session = await sessionRepo.findOneWhere({ session_token_hash: sessionTokenHash });
    if (session) {
      await sessionRepo.revokeSession(session.id, 'user_logout');
    }
  },

  async deleteAllSessionsForAdmin(adminId) {
    await sessionRepo.revokeAllForAdmin(adminId, 'logout_all');
  },

  async findRoleByName(roleName) {
    return await roleRepo.findOneWhere({ name: roleName });
  }
};
