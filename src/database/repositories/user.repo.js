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

export default UserRepository;
