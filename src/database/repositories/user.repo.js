// @intent UserRepository extending BaseRepository for users table CRUD, lookup by normalized email/phone, password hashing auth updates.
import BaseRepository from './base.repo.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super('users', true);
  }

  async findByEmailNormalized(emailNormalized) {
    return await this.findOneWhere({ email_normalized: emailNormalized });
  }

  async findByPhoneNormalized(phoneNormalized) {
    return await this.findOneWhere({ phone_normalized: phoneNormalized });
  }

  /**
   * Find user by email or phone normalized string.
   * @param {string} identifier 
   */
  async findByIdentifier(identifier) {
    if (!identifier) return null;
    const cleanStr = identifier.trim().toLowerCase();
    
    // Check if input resembles an email
    if (cleanStr.includes('@')) {
      return await this.findByEmailNormalized(cleanStr);
    }
    
    // Attempt exact phone normalized match
    let userByPhone = await this.findByPhoneNormalized(cleanStr);
    if (userByPhone) return userByPhone;

    const digitsOnly = cleanStr.replace(/\D/g, '');
    if (digitsOnly.length > 0) {
      // Try with leading '+'
      if (!cleanStr.startsWith('+')) {
        userByPhone = await this.findByPhoneNormalized('+' + cleanStr);
        if (userByPhone) return userByPhone;

        // Default Indian +91 prefix fallback for 10-digit inputs
        if (digitsOnly.length === 10) {
          userByPhone = await this.findByPhoneNormalized('+91' + digitsOnly);
          if (userByPhone) return userByPhone;
        }

        userByPhone = await this.findByPhoneNormalized('+' + digitsOnly);
        if (userByPhone) return userByPhone;
      }

      // Try digits only
      userByPhone = await this.findByPhoneNormalized(digitsOnly);
      if (userByPhone) return userByPhone;
    }

    // Fallback search by email in case user entered email without @ sign by mistake
    return await this.findByEmailNormalized(cleanStr);
  }


  /**
   * Create new user with password hash.
   * @param {object} params 
   */
  async createUserWithAuth({ name, email, phone, passwordHash, createdSource = 'signup' }) {
    const emailNormalized = email.toLowerCase().trim();
    const phoneNormalized = phone ? phone.trim() : null;

    return await this.create({
      name: name.trim(),
      email: email.trim(),
      email_normalized: emailNormalized,
      phone: phone ? phone.trim() : null,
      phone_normalized: phoneNormalized,
      password_hash: passwordHash,
      password_algorithm: 'argon2id',
      status: 'active',
      created_source: createdSource,
    });
  }


  /**
   * Update last_login_at timestamp for a user.
   * @param {string} userId 
   */
  async updateLastLogin(userId) {
    return await this.update(userId, { last_login_at: new Date() });
  }

  async upsertFromDonation({ email, name, phone = null }) {
    const emailNormalized = email.toLowerCase().trim();
    const phoneNormalized = phone ? phone.trim() : null;

    let user = await this.findByEmailNormalized(emailNormalized);
    if (user) {
      if (name && user.name !== name) {
        user = await this.update(user.id, { name });
      }
      return user;
    }

    return await this.create({
      email,
      email_normalized: emailNormalized,
      phone,
      phone_normalized: phoneNormalized,
      name,
      status: 'active',
      created_source: 'donation',
    });
  }
}

export const userRepository = new UserRepository();
export default UserRepository;
