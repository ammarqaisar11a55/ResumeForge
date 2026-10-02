/**
 * Schema migrations, applied in order and recorded in schema_migrations.
 * Kept in TypeScript (not .sql files) so they ship inside the server bundle.
 *
 * Design notes:
 *  - Resume content lives in one JSONB document per resume. Sections are a
 *    flexible array inside it, so new section types need no schema change.
 *  - Users, templates, versions and export history are relational so they
 *    can grow (authentication, template marketplace, audit) independently.
 */
export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial schema',
    sql: `
      CREATE TABLE users (
        id uuid PRIMARY KEY,
        email text UNIQUE,
        display_name text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE templates (
        id text PRIMARY KEY,
        name text NOT NULL,
        description text NOT NULL DEFAULT '',
        version integer NOT NULL DEFAULT 1,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE resumes (
        id uuid PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        template_id text NOT NULL REFERENCES templates(id),
        schema_version integer NOT NULL,
        data jsonb NOT NULL,
        page_count integer NOT NULL DEFAULT 0,
        is_draft boolean NOT NULL DEFAULT true,
        current_version integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL,
        updated_at timestamptz NOT NULL,
        deleted_at timestamptz
      );
      CREATE INDEX resumes_user_updated_idx ON resumes (user_id, updated_at DESC) WHERE deleted_at IS NULL;

      CREATE TABLE resume_versions (
        id uuid PRIMARY KEY,
        resume_id uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
        version integer NOT NULL,
        label text,
        data jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (resume_id, version)
      );

      CREATE TABLE export_history (
        id uuid PRIMARY KEY,
        resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        format text NOT NULL,
        page_count integer,
        byte_size integer,
        status text NOT NULL CHECK (status IN ('succeeded', 'failed')),
        error text,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX export_history_resume_idx ON export_history (resume_id, created_at DESC);

      INSERT INTO templates (id, name, description) VALUES
        ('classic', 'Forge Classic', 'Dense, black-on-white and built for applicant tracking systems.'),
        ('modern', 'Forge Modern', 'Generous whitespace, a quiet accent colour and contemporary type.'),
        ('minimal', 'Forge Minimal', 'Typography does all the work. No rules, no colour, no noise.');
    `,
  },
];
