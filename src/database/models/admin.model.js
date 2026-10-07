import argon2 from 'argon2';
import crypto from 'node:crypto';
import { AdminRepository } from '../repositories/admin.repo.js';
import { AdminSessionRepository } from '../repositories/admin-session.repo.js';
import { withTransaction } from '../db.transaction.js';

const adminRepo = new AdminRepository();
const sessionRepo = new AdminSessionRepository();

export class AdminModel {
  /**
   * Hash plain password using Argon2id
   */
  static async hashPassword(password) {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      timeCost: 3,
      memoryCost: 65536,
      parallelism: 4,
    });
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(passwordHash, password) {
    try {
      return await argon2.verify(passwordHash, password);
    } catch {
      return false;
    }
  }

  /**
   * Create new admin user (CLI / ops only)
   */
  static async createAdmin({ email, password, roleKeys = ['admin'] }) {
    const emailNormalized = email.toLowerCase().trim();
    const existing = await adminRepo.findByEmailNormalized(emailNormalized);
    if (existing) {
      throw new Error(`Admin with email ${email} already exists.`);
    }

    const passwordHash = await this.hashPassword(password);

    return await withTransaction(async (trx) => {
      const admin = await adminRepo.create(
        {
          email,
          email_normalized: emailNormalized,
          password_hash: passwordHash,
          password_algorithm: 'argon2id',
          status: 'active',
          authz_version: 1,
        },
        trx
      );

      // Find role IDs for given roleKeys
      if (roleKeys && roleKeys.length > 0) {
        const roles = await trx('roles').whereIn('key', roleKeys).select('id');
        const roleIds = roles.map((r) => r.id);
        if (roleIds.length > 0) {
          await adminRepo.assignRoles(admin.id, roleIds, trx);
        }
      }

      return admin;
    });
  }

  /**
   * Authenticate admin with email and password
   */
  static async authenticate({ email, password, deviceId, userAgent, ipAddress, maxAgeDays = 7 }) {
    const emailNormalized = email.toLowerCase().trim();
    const admin = await adminRepo.findByEmailNormalized(emailNormalized);

    if (!admin || admin.status !== 'active') {
      return { success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    const isPasswordValid = await this.verifyPassword(admin.password_hash, password);
    if (!isPasswordValid) {
      return { success: false, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' };
    }

    // Check if MFA is enabled
    if (admin.mfa_enabled) {
      return {
        success: true,
        mfaRequired: true,
        adminId: admin.id,
        message: 'MFA challenge required.',
      };
    }

    // Create session token
    const sessionResult = await this.createSession({
      adminId: admin.id,
      deviceId,
      userAgent,
      ipAddress,
      maxAgeDays,
    });

    await adminRepo.update(admin.id, { last_login_at: new Date() });

    return {
      success: true,
      mfaRequired: false,
      admin: {
        id: admin.id,
        email: admin.email,
        mfaEnabled: admin.mfa_enabled,
      },
      token: sessionResult.rawToken,
      session: sessionResult.session,
    };
  }

  /**
   * Create opaque server session
   */
  static async createSession({ adminId, deviceId, userAgent, ipAddress, maxAgeDays = 7 }) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + maxAgeDays * 24 * 60 * 60 * 1000);

    const session = await sessionRepo.create({
      admin_id: adminId,
      session_token_hash: tokenHash,
      device_id: deviceId || 'unknown',
      user_agent: userAgent,
      ip_address: ipAddress,
      expires_at: expiresAt,
    });

    return {
      rawToken,
      session,
    };
  }

  /**
   * Validate raw session token and return resolved admin + permissions
   */
  static async validateSession(rawToken) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const session = await sessionRepo.findValidByTokenHash(tokenHash);

    if (!session) {
      return null;
    }

    // Resolve permissions and roles dynamically
    const permissions = await adminRepo.getResolvedPermissions(session.admin_id);
    const adminWithRoles = await adminRepo.getAdminWithRoles(session.admin_id);
    const roles = (adminWithRoles?.roles || []).map((r) => r.key);

    // Update last seen timestamp asynchronously
    await sessionRepo.updateLastSeen(session.id);

    return {
      session,
      admin: {
        id: session.admin_id,
        email: session.email,
        authzVersion: session.authz_version,
      },
      roles,
      permissions: new Set(permissions),
    };
  }
}

export default AdminModel;
