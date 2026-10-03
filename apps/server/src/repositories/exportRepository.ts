import { randomUUID } from 'node:crypto';
import type { Db } from '../db';

export interface ExportRecord {
  id: string;
  resumeId: string | null;
  format: 'pdf';
  pageCount: number | null;
  byteSize: number | null;
  status: 'succeeded' | 'failed';
  error: string | null;
  createdAt: string;
}

export class ExportRepository {
  constructor(private readonly db: Db) {}

  /** Record an export. Resumes that only exist in the browser are logged without a link. */
  async record(userId: string, entry: Omit<ExportRecord, 'id' | 'createdAt'>): Promise<void> {
    await this.db.query(
      `INSERT INTO export_history (id, resume_id, user_id, format, page_count, byte_size, status, error)
       VALUES ($1, (SELECT id FROM resumes WHERE id::text = $2 AND user_id = $3), $3, $4, $5, $6, $7, $8)`,
      [
        randomUUID(),
        entry.resumeId ?? '',
        userId,
        entry.format,
        entry.pageCount,
        entry.byteSize,
        entry.status,
        entry.error,
      ],
    );
  }

  async list(userId: string, resumeId?: string): Promise<ExportRecord[]> {
    const { rows } = await this.db.query<{
      id: string;
      resume_id: string | null;
      format: 'pdf';
      page_count: number | null;
      byte_size: number | null;
      status: 'succeeded' | 'failed';
      error: string | null;
      created_at: Date | string;
    }>(
      `SELECT id, resume_id, format, page_count, byte_size, status, error, created_at
         FROM export_history
        WHERE user_id = $1 AND ($2::uuid IS NULL OR resume_id = $2::uuid)
        ORDER BY created_at DESC
        LIMIT 100`,
      [userId, resumeId ?? null],
    );
    return rows.map((r) => ({
      id: r.id,
      resumeId: r.resume_id,
      format: r.format,
      pageCount: r.page_count === null ? null : Number(r.page_count),
      byteSize: r.byte_size === null ? null : Number(r.byte_size),
      status: r.status,
      error: r.error,
      createdAt: (r.created_at instanceof Date
        ? r.created_at
        : new Date(r.created_at)
      ).toISOString(),
    }));
  }
}
