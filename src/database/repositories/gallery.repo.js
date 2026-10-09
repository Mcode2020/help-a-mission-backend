import BaseRepository from './base.repo.js';

export class GalleryRepository extends BaseRepository {
  constructor() {
    super('gallery_items', false, false);
  }

  async findPublished({ category = null, page = 1, limit = 20 } = {}) {
    let qb = this.query()
      .join('media_assets', 'gallery_items.media_asset_id', 'media_assets.id')
      .where('gallery_items.status', 'published')
      .select(
        'gallery_items.*',
        'media_assets.public_url',
        'media_assets.mime_type',
        'media_assets.width',
        'media_assets.height'
      );

    if (category) {
      qb = qb.where('gallery_items.category', category);
    }

    const offset = (page - 1) * limit;
    const items = await qb.orderBy('gallery_items.sort_order', 'asc').limit(limit).offset(offset);

    let countQb = this.query().where({ status: 'published' });
    if (category) {
      countQb = countQb.where({ category });
    }
    const [{ count }] = await countQb.count({ count: '*' });
    const total = parseInt(count, 10);

    return {
      items,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default GalleryRepository;
