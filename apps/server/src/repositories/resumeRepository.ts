import { randomUUID } from 'node:crypto';
import { loadResume, type Resume, type ResumeSummary, type TemplateId } from '@resumeforge/core';
import type { Db } from '../db';

export interface VersionSummary {
  version: number;
  label: string | null;
  createdAt: string;
}

/** Automatic snapshots are taken at most this often while a resume is being edited. */
const AUTO_VERSION_INTERVAL_MINUTES = 10;

interface ResumeRow {
  id: string;
  title: string;
  template_id: TemplateId;
  page_count: number;
  full_name: string | null;
  headline: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

const iso = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

function toSummary(row: ResumeRow): ResumeSummary {
  return {
    id: row.id,
    title: row.title,
    template: row.template_id,
    pageCount: Number(row.page_count),
    fullName: row.full_name ?? '',
    headline: row.headline ?? '',
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function parseData(data: unknown): Resume | null {
  const raw = typeof data === 'string' ? (JSON.parse(data) as unknown) : data;
  const result = loadResume(raw);
  return result.ok ? result.resume : null;
}

/**
 * Resume persistence. Every query is scoped to a user id so the same code
 * serves multiple users once authentication is in place.
 */
export class ResumeRepository {
  constructor(private readonly db: Db) {}

  async list(userId: string): Promise<ResumeSummary[]> {
    const { rows } = await this.db.query<ResumeRow>(
      `SELECT id, title, template_id, page_count,
              data->'personalInfo'->>'fullName' AS full_name,
              data->'personalInfo'->>'headline' AS headline,
              created_at, updated_at
         FROM resumes
        WHERE user_id = $1 AND deleted_at IS NULL
        ORDER BY updated_at DESC`,
      [userId],
    );
    return rows.map(toSummary);
  }

  async get(userId: string, id: string): Promise<Resume | null> {
    const { rows } = await this.db.query<{ data: unknown }>(
      'SELECT data FROM resumes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, userId],
    );
    return rows[0] ? parseData(rows[0].data) : null;
  }

  /**
   * Create or replace a resume. Returns null when the id belongs to another
   * user. A version snapshot is recorded when the last one is older than the
   * auto-version interval, giving a restorable history without a row per keystroke.
   */
  async upsert(
    userId: string,
    resume: Resume,
  ): Promise<{ created: boolean; version: number | null } | null> {
    return this.db.transaction(async (tx) => {
      const { rows } = await tx.query<{ inserted: boolean; current_version: number }>(
        `INSERT INTO resumes (id, user_id, title, template_id, schema_version, data, page_count, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE
            SET title = EXCLUDED.title,
                template_id = EXCLUDED.template_id,
                schema_version = EXCLUDED.schema_version,
                data = EXCLUDED.data,
                page_count = EXCLUDED.page_count,
                updated_at = EXCLUDED.updated_at,
                deleted_at = NULL
          WHERE resumes.user_id = EXCLUDED.user_id
         RETURNING (xmax = 0) AS inserted, current_version`,
        [
          resume.id,
          userId,
          resume.metadata.title,
          resume.template,
          resume.schemaVersion,
          JSON.stringify(resume),
          resume.metadata.pageCount,
          resume.createdAt,
          resume.updatedAt,
        ],
      );
      const row = rows[0];
      if (!row) return null;

      const { rows: recent } = await tx.query<{ count: number | string }>(
        `SELECT count(*) AS count FROM resume_versions
          WHERE resume_id = $1 AND created_at > now() - ($2 || ' minutes')::interval`,
        [resume.id, String(AUTO_VERSION_INTERVAL_MINUTES)],
      );
      let version: number | null = null;
      if (Number(recent[0]?.count ?? 0) === 0) {
        version = await this.snapshot(tx, resume.id, null);
      }
      return { created: Boolean(row.inserted), version };
    });
  }

  async softDelete(userId: string, id: string): Promise<boolean> {
    const { rows } = await this.db.query<{ id: string }>(
      `UPDATE resumes SET deleted_at = now() WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL RETURNING id`,
      [id, userId],
    );
    return rows.length > 0;
  }

  async listVersions(userId: string, id: string): Promise<VersionSummary[] | null> {
    if (!(await this.owns(userId, id))) return null;
    const { rows } = await this.db.query<{
      version: number;
      label: string | null;
      created_at: Date | string;
    }>(
      'SELECT version, label, created_at FROM resume_versions WHERE resume_id = $1 ORDER BY version DESC',
      [id],
    );
    return rows.map((r) => ({
      version: Number(r.version),
      label: r.label,
      createdAt: iso(r.created_at),
    }));
  }

  async getVersion(userId: string, id: string, version: number): Promise<Resume | null> {
    if (!(await this.owns(userId, id))) return null;
    const { rows } = await this.db.query<{ data: unknown }>(
      'SELECT data FROM resume_versions WHERE resume_id = $1 AND version = $2',
      [id, version],
    );
    return rows[0] ? parseData(rows[0].data) : null;
  }

  /** Explicit, labelled snapshot ("Sent to Acme"). */
  async createVersion(
    userId: string,
    id: string,
    label: string | null,
  ): Promise<VersionSummary | null> {
    if (!(await this.owns(userId, id))) return null;
    return this.db.transaction(async (tx) => {
      const version = await this.snapshot(tx, id, label);
      return { version, label, createdAt: new Date().toISOString() };
    });
  }

  private async snapshot(tx: Db, resumeId: string, label: string | null): Promise<number> {
    const { rows } = await tx.query<{ current_version: number }>(
      'UPDATE resumes SET current_version = current_version + 1 WHERE id = $1 RETURNING current_version',
      [resumeId],
    );
    const version = Number(rows[0]!.current_version);
    await tx.query(
      `INSERT INTO resume_versions (id, resume_id, version, label, data)
       SELECT $1, id, $2, $3, data FROM resumes WHERE id = $4`,
      [randomUUID(), version, label, resumeId],
    );
    return version;
  }

  private async owns(userId: string, id: string): Promise<boolean> {
    const { rows } = await this.db.query(
      'SELECT 1 FROM resumes WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [id, userId],
    );
    return rows.length > 0;
  }
}
