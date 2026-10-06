import BaseRepository from './base.repo.js';

export class AuditEventRepository extends BaseRepository {
  constructor() {
    super('audit_events', false);
  }

  async logEvent({
    requestId,
    actorType,
    actorId = null,
    action,
    entityType,
    entityId = null,
    beforeRedacted = null,
    afterRedacted = null,
    deviceId = null,
    ipAddress = null,
  }, trx = null) {
    return await this.create({
      request_id: requestId,
      actor_type: actorType,
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      before_redacted: beforeRedacted ? JSON.stringify(beforeRedacted) : null,
      after_redacted: afterRedacted ? JSON.stringify(afterRedacted) : null,
      device_id: deviceId,
      ip_address: ipAddress,
    }, trx);
  }

  async getEventsForActor(actorId, options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const items = await this.query()
      .where({ actor_id: actorId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const [{ count }] = await this.query().where({ actor_id: actorId }).count({ count: '*' });
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

export default AuditEventRepository;
