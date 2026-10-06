import BaseRepository from './base.repo.js';
import db from '../knex.client.js';

export class JobRepository extends BaseRepository {
  constructor() {
    super('jobs', false, false);
  }

  async enqueue(jobType, payload = {}, scheduledFor = new Date(), trx = null) {
    return await this.create(
      {
        job_type: jobType,
        payload: JSON.stringify(payload),
        status: 'pending',
        scheduled_for: scheduledFor,
        attempt_count: 0,
        max_attempts: 3,
      },
      trx
    );
  }

  async claimNextJob(workerId, jobType = null) {
    return await db.transaction(async (trx) => {
      let qb = trx('jobs')
        .where('status', 'pending')
        .where('scheduled_for', '<=', new Date())
        .orderBy('scheduled_for', 'asc')
        .limit(1)
        .forUpdate()
        .skipLocked();

      if (jobType) {
        qb = qb.where('job_type', jobType);
      }

      const rows = await qb;
      if (rows.length === 0) {
        return null;
      }

      const job = rows[0];
      const [claimed] = await trx('jobs')
        .where({ id: job.id })
        .update({
          status: 'processing',
          locked_at: new Date(),
          locked_by: workerId,
          attempt_count: job.attempt_count + 1,
        })
        .returning('*');

      return claimed;
    });
  }

  async markCompleted(jobId, trx = null) {
    const targetDb = trx || db;
    return await targetDb('jobs')
      .where({ id: jobId })
      .update({
        status: 'completed',
        completed_at: new Date(),
      });
  }

  async markFailed(jobId, error, trx = null) {
    const targetDb = trx || db;
    const errorMsg = error instanceof Error ? error.message : String(error);
    return await targetDb('jobs')
      .where({ id: jobId })
      .update({
        status: 'failed',
        last_error: errorMsg,
      });
  }
}

export default JobRepository;
