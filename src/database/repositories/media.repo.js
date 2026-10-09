import BaseRepository from './base.repo.js';

export class MediaAssetRepository extends BaseRepository {
  constructor() {
    super('media_assets', false, false);
  }

  async findBySha256(sha256) {
    return await this.findOneWhere({ sha256 });
  }
}

export default MediaAssetRepository;
