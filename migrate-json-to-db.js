import fs from 'fs'
import path from 'path'
import postgres from 'postgres'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required for JSON migration')

const sourcePath = path.join(process.cwd(), 'site-content.json')
const schemaPath = path.join(process.cwd(), 'schema.sql')
const state = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
const sql = postgres(databaseUrl, { prepare: false })

try {
  await sql.unsafe(fs.readFileSync(schemaPath, 'utf8'))
  const existing = await sql`SELECT EXISTS (SELECT 1 FROM app_state) AS present`
  if (existing[0].present) throw new Error('Database already contains app_state; refusing to overwrite existing data')
  await sql.begin(async (transaction) => {
    await transaction`INSERT INTO app_state (id, data) VALUES (TRUE, ${JSON.stringify(state)}::jsonb)`
    for (const item of state.companies || []) await transaction`INSERT INTO companies (id, slug, data) VALUES (${item.id}, ${item.slug || item.name || item.id}, ${JSON.stringify(item)}::jsonb)`
    for (const item of state.jobCategories || []) await transaction`INSERT INTO job_categories (id, slug, data) VALUES (${item.id}, ${item.slug || item.name || item.id}, ${JSON.stringify(item)}::jsonb)`
    for (const item of state.jobs || []) await transaction`INSERT INTO jobs (id, slug, company_id, status, data) VALUES (${item.id}, ${item.slug || item.id}, ${item.companyId || null}, ${item.status || 'draft'}, ${JSON.stringify(item)}::jsonb)`
    const jobIds = new Set((state.jobs || []).map((item) => item.id))
    for (const item of state.applications || []) await transaction`INSERT INTO applications (id, job_id, email, status, data) VALUES (${item.id}, ${jobIds.has(item.jobId) ? item.jobId : null}, ${item.email || ''}, ${item.status || 'new'}, ${JSON.stringify(item)}::jsonb)`
    for (const item of state.whatsappIntakes || []) await transaction`INSERT INTO whatsapp_intakes (id, job_id, status, received_at, data) VALUES (${item.id}, ${jobIds.has(item.jobId) ? item.jobId : null}, ${item.status || 'received'}, ${item.receivedAt || new Date().toISOString()}, ${JSON.stringify(item)}::jsonb)`
    for (const item of state.activity || []) await transaction`INSERT INTO activity (id, entity, created_at, data) VALUES (${item.id}, ${item.entity || 'system'}, ${item.createdAt || new Date().toISOString()}, ${JSON.stringify(item)}::jsonb)`
  })
  console.log('Migrated site-content.json into the empty durable database without overwriting existing data.')
} finally {
  await sql.end()
}
