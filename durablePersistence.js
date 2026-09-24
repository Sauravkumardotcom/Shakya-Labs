import fs from 'fs'
import path from 'path'
import postgres from 'postgres'
import { AsyncLocalStorage } from 'async_hooks'

const normalizedCollections = ['companies', 'jobCategories', 'jobs', 'applications', 'whatsappIntakes', 'activity']
const schemaPath = path.join(process.cwd(), 'schema.sql')

const createDurablePersistence = ({ defaultData, sourceDataPath, legacyRead, legacyWrite }) => {
  const databaseUrl = process.env.DATABASE_URL
  const requestStore = new AsyncLocalStorage()
  let client
  let initialized

  const readSeed = () => {
    if (fs.existsSync(sourceDataPath)) return JSON.parse(fs.readFileSync(sourceDataPath, 'utf8'))
    return JSON.parse(JSON.stringify(defaultData))
  }

  const initialize = async () => {
    if (!databaseUrl) {
      if (process.env.VERCEL === '1') throw new Error('DATABASE_URL must be configured on Vercel for durable persistence')
      return
    }
    if (initialized) return initialized
    client = postgres(databaseUrl, { max: 5, prepare: false })
    initialized = (async () => {
      await client.unsafe(fs.readFileSync(schemaPath, 'utf8'))
      const rows = await client`SELECT data FROM app_state WHERE id = TRUE`
      if (!rows.length) {
        const seed = { ...defaultData, ...readSeed() }
        await client`INSERT INTO app_state (id, data) VALUES (TRUE, ${JSON.stringify(seed)}::jsonb)`
        console.log('Initialized durable database from existing JSON data; no existing database data was overwritten.')
      }
    })()
    return initialized
  }

  const readStore = () => requestStore.getStore()?.data || legacyRead()
  const writeStore = (data) => {
    const context = requestStore.getStore()
    if (!context) return legacyWrite(data)
    context.data = data
    context.dirty = true
  }

  const hydrate = async (connection, state) => {
    const loaders = [
      ['companies', 'companies'],
      ['jobCategories', 'job_categories'],
      ['jobs', 'jobs'],
      ['applications', 'applications'],
      ['whatsappIntakes', 'whatsapp_intakes'],
      ['activity', 'activity']
    ]
    for (const [collection, table] of loaders) {
      const rows = await connection.unsafe(`SELECT data FROM ${table}`)
      if (rows.length) state[collection] = rows.map((row) => row.data)
    }
    return state
  }

  const persist = async (connection, state) => {
    await connection`UPDATE app_state SET data = ${JSON.stringify(state)}::jsonb, updated_at = NOW() WHERE id = TRUE`
    await connection`TRUNCATE TABLE applications, whatsapp_intakes, jobs, companies, job_categories, activity`
    const companies = state.companies || []
    for (const item of companies) await connection`INSERT INTO companies (id, slug, data) VALUES (${item.id}, ${item.slug || item.name || item.id}, ${JSON.stringify(item)}::jsonb)`
    const categories = state.jobCategories || []
    for (const item of categories) await connection`INSERT INTO job_categories (id, slug, data) VALUES (${item.id}, ${item.slug || item.name || item.id}, ${JSON.stringify(item)}::jsonb)`
    const jobs = state.jobs || []
    for (const item of jobs) await connection`INSERT INTO jobs (id, slug, company_id, status, data) VALUES (${item.id}, ${item.slug || item.id}, ${item.companyId || null}, ${item.status || 'draft'}, ${JSON.stringify(item)}::jsonb)`
    const jobIds = new Set(jobs.map((item) => item.id))
    for (const item of state.applications || []) await connection`INSERT INTO applications (id, job_id, email, status, data) VALUES (${item.id}, ${jobIds.has(item.jobId) ? item.jobId : null}, ${item.email || ''}, ${item.status || 'new'}, ${JSON.stringify(item)}::jsonb)`
    for (const item of state.whatsappIntakes || []) await connection`INSERT INTO whatsapp_intakes (id, job_id, status, received_at, data) VALUES (${item.id}, ${jobIds.has(item.jobId) ? item.jobId : null}, ${item.status || 'received'}, ${item.receivedAt || new Date().toISOString()}, ${JSON.stringify(item)}::jsonb)`
    for (const item of state.activity || []) await connection`INSERT INTO activity (id, entity, created_at, data) VALUES (${item.id}, ${item.entity || 'system'}, ${item.createdAt || new Date().toISOString()}, ${JSON.stringify(item)}::jsonb)`
  }

  const middleware = async (req, res, next) => {
    if (!databaseUrl) {
      if (process.env.VERCEL === '1') return next(new Error('DATABASE_URL must be configured on Vercel for durable persistence'))
      return next()
    }
    try {
      await initialize()
      const connection = await client.reserve()
      await connection`BEGIN`
      const rows = await connection`SELECT data FROM app_state WHERE id = TRUE FOR UPDATE`
      const data = await hydrate(connection, rows[0]?.data || JSON.parse(JSON.stringify(defaultData)))
      const context = { connection, data, dirty: false, finalized: false }
      const finalize = async (rollback = false) => {
        if (context.finalized) return
        context.finalized = true
        try {
          if (rollback) await connection`ROLLBACK`
          else { if (context.dirty) await persist(connection, context.data); await connection`COMMIT` }
        } finally { connection.release() }
      }
      res.once('finish', () => finalize(res.statusCode >= 400))
      res.once('close', () => finalize(true))
      requestStore.run(context, () => next())
    } catch (error) {
      next(error)
    }
  }

  return { initialize, middleware, readStore, writeStore, usingDatabase: Boolean(databaseUrl) }
}

export { createDurablePersistence }
