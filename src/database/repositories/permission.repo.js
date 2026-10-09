import BaseRepository from './base.repo.js';

export class PermissionRepository extends BaseRepository {
  constructor() {
    super('permissions', false);
  }

  async findByKey(key) {
    return await this.findOneWhere({ key });
  }

  async getAllActive() {
    return await this.findWhere({ is_active: true });
  }
}

export default PermissionRepository;
