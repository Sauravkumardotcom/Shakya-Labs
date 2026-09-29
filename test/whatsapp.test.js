import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { createServer } from 'node:http'
import test from 'node:test'
import { createMetaWhatsAppProvider } from '../metaWhatsAppProvider.js'
import { createWhatsAppProvider, normalizeWebhookPayload, validateReplayTimestamp } from '../whatsappProvider.js'
import { createChatDiscoveryHandler, createListenerIngestionHandler } from '../whatsappListenerIngestion.js'
import { createWhatsappIntakeRepository, extractJob } from '../whatsappIntakeRepository.js'
import { createJobsRepository, publicJob } from '../jobsRepository.js'
import { createLocalWebhookRateLimiter, configuredRateLimit } from '../webhookRateLimiter.js'
import { createListenerIntakePayload, getMessageGroupContext } from '../whatsappGroupListenerUtils.js'

const validMessage = `Title: Backend Engineer
Company: Example Co
Location: Remote
Work mode: Remote
Employment type: Full-time
Description: Build reliable services for a growing product team.
Skills: Node.js, PostgreSQL
Application email: hiring@example.com`
const metaPayload = (overrides = {}) => ({
  object: 'whatsapp_business_account',
  entry: [{ id: 'waba-1', changes: [{ field: 'messages', value: { metadata: { phone_number_id: 'phone-1' }, contacts: [{ wa_id: '15551234567', profile: { name: 'Job Sender' } }], messages: [{ from: '15551234567', id: 'wamid-1', timestamp: '1790251200', type: 'text', text: { body: validMessage } }] } }] }],
  ...overrides
})

const createRepositories = (jobs = []) => {
  const store = { jobs, whatsappIntakes: [], activity: [] }
  const readStore = () => store
  const writeStore = (next) => Object.assign(store, next)
  const logActivity = () => {}
  return {
    store,
    jobsRepository: createJobsRepository({ readStore, writeStore, logActivity }),
    intakeRepository: createWhatsappIntakeRepository({ readStore, writeStore, logActivity })
  }
}

test('normalizes a valid inbound text job message without inventing fields', () => {
  const provider = createWhatsAppProvider({ providerName: 'mock', webhookSecret: 'test-secret' })
  const normalized = provider.normalize({ eventId: 'evt-1', sender: { id: 'sender-1', phone: '+1234' }, text: validMessage })
  assert.equal(normalized.provider, 'mock')
  assert.equal(normalized.providerEventId, 'evt-1')
  assert.equal(normalized.rawMessage, validMessage)
  assert.equal(normalized.senderId, 'sender-1')
  assert.equal(normalized.senderPhone, '+1234')
  assert.equal(extractJob(normalized.rawMessage).draft.salaryMin, null)
})

test('flags missing fields instead of inventing them', () => {
  const extraction = extractJob('Title: Designer\nCompany: Example Co\nDescription: Create thoughtful product experiences.')
  assert.deepEqual(extraction.missingFields.sort(), ['employmentType', 'location', 'workMode'])
  assert.equal(extraction.draft.location, '')
  assert.equal(extraction.draft.workMode, '')
})

test('rejects malformed and incomplete provider payloads', () => {
  assert.throws(() => normalizeWebhookPayload(null), /payload must be an object/)
  assert.throws(() => normalizeWebhookPayload({ eventId: 'evt-2' }), /text message is required/)
  assert.throws(() => normalizeWebhookPayload({ eventId: 'evt-2', text: {}, sender: [] }), /Webhook sender must be an object/)
})

test('enforces replay timestamp bounds while allowing missing timestamps', () => {
  const now = Date.parse('2026-09-24T12:00:00.000Z')
  assert.throws(() => validateReplayTimestamp('2026-09-24T11:50:00.000Z', { now, replayWindowSeconds: 300 }), /too old/)
  assert.throws(() => validateReplayTimestamp('2026-09-24T12:02:00.000Z', { now, futureSkewSeconds: 30 }), /future/)
  assert.equal(validateReplayTimestamp('2026-09-24T11:59:00.000Z', { now, replayWindowSeconds: 300 }).hasTimestamp, true)
  assert.equal(validateReplayTimestamp(undefined, { now }).hasTimestamp, false)
})

test('rejects invalid webhook authentication', () => {
  const provider = createWhatsAppProvider({ webhookSecret: 'test-secret' })
  const request = { headers: { 'x-whatsapp-webhook-secret': 'wrong-secret' } }
  assert.equal(provider.verifyWebhookRequest(request, Buffer.from('{}')), false)
  assert.equal(provider.verifyWebhookRequest({ headers: { 'x-whatsapp-webhook-secret': 'test-secret' } }, Buffer.from('{}')), true)
})

test('validates Meta signature and verification challenge', () => {
  const provider = createMetaWhatsAppProvider({ appSecret: 'app-secret', verifyToken: 'verify-token' })
  const body = JSON.stringify(metaPayload())
  const signature = `sha256=${crypto.createHmac('sha256', 'app-secret').update(body).digest('hex')}`
  assert.equal(provider.verifyWebhookRequest({ headers: { 'x-hub-signature-256': signature } }, Buffer.from(body)), true)
  assert.equal(provider.verifyWebhookRequest({ headers: { 'x-hub-signature-256': 'sha256=wrong' } }, Buffer.from(body)), false)
  assert.equal(provider.verifyChallenge({ query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'verify-token', 'hub.challenge': 'challenge-1' } }), 'challenge-1')
  assert.equal(provider.verifyChallenge({ query: { 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': 'challenge-1' } }), null)
})

test('extracts only supported Meta text messages and provider metadata', () => {
  const provider = createMetaWhatsAppProvider({ phoneNumberId: 'phone-1', businessAccountId: 'waba-1', replayWindowSeconds: 1000000000 })
  const event = provider.normalize(metaPayload())[0]
  assert.equal(event.provider, 'meta')
  assert.equal(event.providerEventId, 'wamid-1')
  assert.equal(event.senderPhone, '15551234567')
  assert.equal(event.senderName, 'Job Sender')
  assert.equal(event.providerMetadata.phoneNumberId, 'phone-1')
  assert.equal(event.providerMetadata.businessAccountId, 'waba-1')
  assert.throws(() => provider.normalize(metaPayload({ entry: [{ id: 'waba-1', changes: [{ field: 'messages', value: { messages: [{ from: '1', id: '2', timestamp: '1790251200', type: 'image' }] } }] }] })), /Unsupported Meta WhatsApp message type/)
  assert.throws(() => provider.normalize(metaPayload({ entry: [{ id: 'waba-1', changes: [{ field: 'messages', value: { messages: [{ from: '1', timestamp: '1790251200', type: 'text', text: { body: validMessage } }] } }] }] })), /Meta message ID is required/)
})

test('applies replay validation to a Meta event timestamp', () => {
  const provider = createMetaWhatsAppProvider({ replayWindowSeconds: 300, futureSkewSeconds: 30 })
  const payload = metaPayload()
  payload.entry[0].changes[0].value.messages[0].timestamp = String(Math.floor(Date.now() / 1000))
  const event = provider.normalize(payload)[0]
  assert.equal(provider.validateTimestamp(event.receivedAt).hasTimestamp, true)
  assert.throws(() => provider.validateTimestamp(new Date(Date.now() - 301000).toISOString()), /too old/)
  assert.throws(() => provider.validateTimestamp(new Date(Date.now() + 31000).toISOString()), /future/)
})

test('deduplicates repeated provider events', () => {
  const { intakeRepository } = createRepositories()
  const first = intakeRepository.receive({ provider: 'mock', providerEventId: 'evt-3', rawMessage: validMessage }, 'whatsapp:webhook')
  const second = intakeRepository.receive({ provider: 'mock', providerEventId: 'evt-3', rawMessage: validMessage }, 'whatsapp:webhook')
  assert.equal(first.duplicate, undefined)
  assert.equal(second.duplicate, true)
  assert.equal(second.item.id, first.item.id)
})

test('creates admin review data and detects duplicate jobs', () => {
  const existingJob = { title: 'Backend Engineer', companyName: 'Example Co', location: 'Remote', applicationEmail: 'hiring@example.com' }
  const { intakeRepository } = createRepositories([existingJob])
  const received = intakeRepository.receive({ provider: 'mock', providerEventId: 'evt-4', rawMessage: validMessage }, 'whatsapp:webhook')
  const processed = intakeRepository.process(received.item.id, [existingJob], 'whatsapp:webhook')
  assert.equal(processed.item.status, 'draft')
  assert.equal(processed.item.missingFields.length, 0)
  assert.equal(processed.item.duplicateCandidates.length, 1)
  assert.equal(processed.item.rawMessage, validMessage)
})

test('approval creates a draft job and never publishes it', () => {
  const { intakeRepository, jobsRepository, store } = createRepositories()
  const received = intakeRepository.receive({ provider: 'mock', providerEventId: 'evt-5', rawMessage: validMessage }, 'whatsapp:webhook')
  intakeRepository.process(received.item.id, [], 'admin@example.com')
  const approved = intakeRepository.approve(received.item.id, jobsRepository, 'admin@example.com')
  assert.equal(approved.job.status, 'draft')
  assert.equal(approved.job.source, 'whatsapp')
  assert.equal(approved.item.status, 'approved')
  assert.equal(store.jobs[0].status, 'draft')
})

test('approved intake is terminal and cannot be reprocessed, edited, or approved again', () => {
  const { intakeRepository, jobsRepository } = createRepositories()
  const received = intakeRepository.receive({ provider: 'mock', providerEventId: 'evt-terminal-approved', rawMessage: validMessage }, 'admin@example.com')
  intakeRepository.process(received.item.id, [], 'admin@example.com')
  intakeRepository.approve(received.item.id, jobsRepository, 'admin@example.com')
  assert.match(intakeRepository.process(received.item.id, [], 'admin@example.com').error, /cannot be reprocessed/)
  assert.match(intakeRepository.updateDraft(received.item.id, {}, [], 'admin@example.com').error, /cannot be edited/)
  assert.match(intakeRepository.approve(received.item.id, jobsRepository, 'admin@example.com').error, /cannot be approved/)
})

test('rejected intake is terminal and cannot be reprocessed or edited', () => {
  const { intakeRepository } = createRepositories()
  const received = intakeRepository.receive({ provider: 'mock', providerEventId: 'evt-terminal-rejected', rawMessage: validMessage }, 'admin@example.com')
  intakeRepository.reject(received.item.id, 'admin@example.com')
  assert.match(intakeRepository.process(received.item.id, [], 'admin@example.com').error, /cannot be reprocessed/)
  assert.match(intakeRepository.updateDraft(received.item.id, {}, [], 'admin@example.com').error, /cannot be edited/)
  assert.match(intakeRepository.reject(received.item.id, 'admin@example.com').error, /already rejected/)
})

test('public job projection excludes WhatsApp raw content and provider metadata', () => {
  const safe = publicJob({ id: 'job-1', title: 'Public job', source: 'whatsapp', sourceMessage: validMessage, providerMetadata: { secret: 'must-not-be-present' }, futureInternalField: 'must-not-be-present' })
  assert.equal('sourceMessage' in safe, false)
  assert.equal('providerMetadata' in safe, false)
  assert.equal('futureInternalField' in safe, false)
})

test('rate limiter is configurable and evicts inactive keys', () => {
  let now = 0
  const limiter = createLocalWebhookRateLimiter({ maxRequests: 2, windowMs: 1000, now: () => now })
  assert.equal(limiter.allow('ip-1'), true)
  assert.equal(limiter.allow('ip-1'), true)
  assert.equal(limiter.allow('ip-1'), false)
  now = 1001
  assert.equal(limiter.allow('ip-2'), true)
  assert.equal(limiter.size(), 1)
  assert.equal(configuredRateLimit({ maxRequests: '2', windowSeconds: '1' }).distributed, false)
})

test('webhook failures return safe JSON with a correlation ID', async () => {
  const previousVercel = process.env.VERCEL
  const previousDatabaseUrl = process.env.DATABASE_URL
  process.env.VERCEL = '1'
  process.env.DATABASE_URL = ''
  const { default: app } = await import(`../server.js?error-test=${Date.now()}`)
  const server = createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const address = server.address()
  const response = await fetch(`http://127.0.0.1:${address.port}/api/webhooks/whatsapp/meta`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
  const body = await response.json()
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  if (previousVercel === undefined) delete process.env.VERCEL
  else process.env.VERCEL = previousVercel
  if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = previousDatabaseUrl
  assert.equal(response.status, 500)
  assert.equal(typeof body.requestId, 'string')
  assert.equal('stack' in body, false)
})

test('existing manual job creation remains available', () => {
  const { jobsRepository } = createRepositories()
  const result = jobsRepository.save({ title: 'Manual Engineer', companyName: 'Manual Co', location: 'Hybrid', workMode: 'hybrid', employmentType: 'full-time', description: 'Maintain and improve the existing platform services.' }, null, 'admin@example.com')
  assert.equal(result.error, undefined)
  assert.equal(result.item.source, 'manual')
  assert.equal(result.item.status, 'draft')
})

test('trusted source URL creates one WhatsApp intake draft without creating a job', () => {
  const { intakeRepository, jobsRepository, store } = createRepositories()
  const message = { id: { _serialized: 'message-event-1' }, from: '13135550002@c.us', body: 'Apply at https://example.com/job', links: [{ link: 'https://example.com/job', isSuspicious: false }] }
  const payload = createListenerIntakePayload(message, getMessageGroupContext(message), '13135550002@c.us')
  const result = intakeRepository.receiveFromListener(payload, jobsRepository.listAll())
  assert.equal(store.whatsappIntakes.length, 1)
  assert.equal(store.whatsappIntakes[0].status, 'draft')
  assert.equal(store.whatsappIntakes[0].source, 'whatsapp')
  assert.deepEqual(store.whatsappIntakes[0].sourceUrls, ['https://example.com/job'])
  assert.equal(result.item.status, 'draft')
  assert.equal(store.jobs.length, 0)
})

test('authenticated listener ingestion endpoint accepts the source payload into the existing intake repository', async () => {
  const { intakeRepository, jobsRepository, store } = createRepositories()
  const secret = 'ingest-test-secret'
  const selectedChats = new Set()
  const handler = createListenerIngestionHandler({
    secret,
    sourceChatId: '13135550002@c.us',
    requireChatSelection: true,
    chatRepository: { isMonitoringEnabled: (chatId) => selectedChats.has(chatId) },
    intakeRepository,
    jobsRepository
  })
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this }
  }
  await handler({
    socket: { remoteAddress: '127.0.0.1' },
    headers: { authorization: `Bearer ${secret}` },
    body: {
      sourceChatId: '13135550002@c.us',
      providerEventId: 'listener-event-accepted',
      rawMessage: '',
      sourceUrls: ['https://example.com/job']
    }
  }, response)
  assert.equal(response.statusCode, 403)
  assert.equal(store.whatsappIntakes.length, 0)
  selectedChats.add('13135550002@c.us')
  const selectedResponse = { ...response, body: undefined, statusCode: 200 }
  await handler({
    socket: { remoteAddress: '127.0.0.1' },
    headers: { authorization: `Bearer ${secret}` },
    body: {
      sourceChatId: '13135550002@c.us',
      providerEventId: 'listener-event-selected',
      rawMessage: '',
      sourceUrls: ['https://example.com/job']
    }
  }, selectedResponse)
  assert.equal(selectedResponse.statusCode, 202)
  assert.equal(response.statusCode, 403)
  assert.equal(selectedResponse.body.accepted, true)
  assert.equal(store.whatsappIntakes.length, 1)
  assert.equal(store.whatsappIntakes[0].status, 'draft')
  assert.equal(store.jobs.length, 0)

  selectedChats.delete('13135550002@c.us')
  const disabledResponse = { ...response, body: undefined, statusCode: 200 }
  await handler({
    socket: { remoteAddress: '127.0.0.1' },
    headers: { authorization: `Bearer ${secret}` },
    body: {
      sourceChatId: '13135550002@c.us',
      providerEventId: 'listener-event-disabled',
      rawMessage: '',
      sourceUrls: ['https://example.com/job']
    }
  }, disabledResponse)
  assert.equal(disabledResponse.statusCode, 403)
  assert.equal(store.whatsappIntakes.length, 1)
})

test('messages without trusted URLs, including suspicious-only links, do not create an intake payload', () => {
  const context = getMessageGroupContext({ from: '13135550002@c.us' })
  assert.equal(createListenerIntakePayload({ id: { _serialized: 'no-url' }, from: '13135550002@c.us', body: 'No link' }, context, '13135550002@c.us'), null)
  assert.equal(createListenerIntakePayload({ id: { _serialized: 'suspicious' }, from: '13135550002@c.us', body: '', links: [{ link: 'https://example.com/job', isSuspicious: true }] }, context, '13135550002@c.us'), null)
})

test('repeated WhatsApp event ID returns the existing intake instead of duplicating it', () => {
  const { intakeRepository, store } = createRepositories()
  const payload = { providerEventId: 'message-event-duplicate', rawMessage: 'Job link', sourceUrls: ['https://example.com/job'] }
  const first = intakeRepository.receiveFromListener(payload)
  const second = intakeRepository.receiveFromListener(payload)
  assert.equal(first.duplicate, undefined)
  assert.equal(second.duplicate, true)
  assert.equal(second.item.id, first.item.id)
  assert.equal(store.whatsappIntakes.length, 1)
})

test('multiple trusted URLs are retained on the intake', () => {
  const { intakeRepository, store } = createRepositories()
  const result = intakeRepository.receiveFromListener({ providerEventId: 'message-event-multiple', rawMessage: '', sourceUrls: ['https://example.com/one', 'http://example.org/two'] })
  assert.equal(result.item.status, 'draft')
  assert.deepEqual(store.whatsappIntakes[0].sourceUrls, ['https://example.com/one', 'http://example.org/two'])
})

test('listener intake reuses duplicate matching for source URLs', () => {
  const existingJob = { id: 'existing-job', title: 'Existing', companyName: 'Example', location: 'Remote', sourceUrl: 'https://example.com/job' }
  const { intakeRepository, store } = createRepositories([existingJob])
  const result = intakeRepository.receiveFromListener({ providerEventId: 'message-event-duplicate-job', rawMessage: '', sourceUrls: ['https://example.com/job'] }, [existingJob])
  assert.equal(result.item.duplicateCandidates.length, 1)
  assert.equal(result.item.duplicateCandidates[0].id, 'existing-job')
  assert.equal(store.jobs.length, 1)
})

test('listener ingestion returns a safe error if the intake repository fails', async () => {
  const handler = createListenerIngestionHandler({
    secret: 'test-secret',
    sourceChatId: '13135550002@c.us',
    intakeRepository: { receiveFromListener() { throw new Error('private message details') } },
    jobsRepository: { listAll: () => [] }
  })
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this }
  }
  await handler({
    socket: { remoteAddress: '127.0.0.1' },
    headers: { authorization: 'Bearer test-secret' },
    body: { sourceChatId: '13135550002@c.us', providerEventId: 'event-fail', rawMessage: '', sourceUrls: ['https://example.com/job'] }
  }, response)
  assert.equal(response.statusCode, 500)
  assert.equal(response.body.message, 'Listener intake could not be saved')
  assert.equal(JSON.stringify(response.body).includes('private message details'), false)
})
