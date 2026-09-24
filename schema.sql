CREATE TABLE IF NOT EXISTS app_state (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS companies_slug_idx ON companies (slug);

CREATE TABLE IF NOT EXISTS job_categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS job_categories_slug_idx ON job_categories (slug);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  company_id TEXT,
  status TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS jobs_slug_idx ON jobs (slug);
CREATE INDEX IF NOT EXISTS jobs_company_id_idx ON jobs (company_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status);

CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id) ON DELETE RESTRICT,
  email TEXT NOT NULL,
  status TEXT NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS applications_job_id_idx ON applications (job_id);
CREATE INDEX IF NOT EXISTS applications_email_idx ON applications (email);

CREATE TABLE IF NOT EXISTS whatsapp_intakes (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS whatsapp_intakes_status_idx ON whatsapp_intakes (status);
CREATE INDEX IF NOT EXISTS whatsapp_intakes_job_id_idx ON whatsapp_intakes (job_id);

CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS activity_entity_idx ON activity (entity);
CREATE INDEX IF NOT EXISTS activity_created_at_idx ON activity (created_at DESC);
