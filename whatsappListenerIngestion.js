import crypto from 'node:crypto'
import { isSafeChatId } from './whatsappGroupListenerUtils.js'

const isLoopbackAddress = (address = '') => address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1'
const secretMatches = (provided, expected) => {
  const providedBuffer = Buffer.from(String(provided || ''))
  const expectedBuffer = Buffer.from(String(expected || ''))
  return providedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(providedBuffer, expectedBuffer)
}
const normalizeSourceUrls = (values) => [...new Set((Array.isArray(values) ? values : []).flatMap((value) => {
  if (typeof value !== 'string' || value.length > 2048) return []
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? [url.href] : []
  } catch { return [] }
}))].slice(0, 20)

const createListenerIngestionHandler = ({ secret, sourceChatId, intakeRepository, jobsRepository, chatRepository }) => async (req, res) => {
  const respond = (status, message, extra = {}) => res.status(status).json({ message, ...extra })
  if (!secret || (!isSafeChatId(sourceChatId) && !chatRepository)) return respond(503, 'Listener intake is not configured')
  if (!isLoopbackAddress(req.socket?.remoteAddress)) return respond(403, 'Local listener requests only')
  const authorization = String(req.get?.('authorization') || req.headers?.authorization || '')
  if (!authorization.startsWith('Bearer ') || !secretMatches(authorization.slice(7), secret)) return respond(401, 'Invalid listener authentication')

  const input = req.body
  if (!input || typeof input !== 'object' || Array.isArray(input)) return respond(400, 'Invalid listener payload')
  const configuredSourceAllowed = isSafeChatId(sourceChatId) && input.sourceChatId === sourceChatId
  const selectedSourceAllowed = chatRepository?.isMonitoringEnabled(input.sourceChatId) === true
  const sourceAllowed = chatRepository ? selectedSourceAllowed : configuredSourceAllowed
  if (!sourceAllowed) return respond(403, 'Source chat is not allowed')
  if (typeof input.providerEventId !== 'string' || !input.providerEventId.trim() || input.providerEventId.length > 200) return respond(400, 'Invalid listener event ID')
  if (typeof input.rawMessage !== 'string' || input.rawMessage.length > 20000) return respond(400, 'Invalid listener message')
  const sourceUrls = normalizeSourceUrls(input.sourceUrls)
  if (!sourceUrls.length) return respond(422, 'At least one trusted HTTP/HTTPS URL is required')

  try {
    const result = intakeRepository.receiveFromListener({
      providerEventId: input.providerEventId,
      rawMessage: input.rawMessage,
      sourceUrls,
      receivedAt: input.receivedAt
    }, jobsRepository.listAll(), 'whatsapp:listener')
    if (result.error) return respond(422, 'Listener intake could not be accepted')
    return res.status(result.duplicate ? 200 : 202).json({
      accepted: true,
      duplicate: Boolean(result.duplicate),
      status: result.item.status
    })
  } catch {
    return respond(500, 'Listener intake could not be saved')
  }
}

const createChatDiscoveryHandler = ({ secret, chatRepository }) => async (req, res) => {
  const respond = (status, message, extra = {}) => res.status(status).json({ message, ...extra })
  if (!secret) return respond(503, 'Chat discovery is not configured')
  if (!isLoopbackAddress(req.socket?.remoteAddress)) return respond(403, 'Local listener requests only')
  const authorization = String(req.get?.('authorization') || req.headers?.authorization || '')
  if (!authorization.startsWith('Bearer ') || !secretMatches(authorization.slice(7), secret)) return respond(401, 'Invalid listener authentication')

  const input = req.body
  if (!input || typeof input !== 'object' || Array.isArray(input)) return respond(400, 'Invalid chat metadata')
  if (typeof input.chatId !== 'string' || input.chatId.length > 64) return respond(400, 'Invalid chat metadata')
  if (input.name !== undefined && (typeof input.name !== 'string' || input.name.length > 120)) return respond(400, 'Invalid chat metadata')

  const result = chatRepository.discover({ chatId: input.chatId, name: input.name })
  if (result.error) return respond(400, 'Invalid chat metadata')
  return res.status(200).json({ monitoringEnabled: result.chat.monitoringEnabled })
}

const sendListenerIntake = async ({ url, secret, payload, fetchImpl = fetch }) => {
  if (!secret) return { ok: false, errorName: 'IngestSecretNotConfigured' }
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(payload)
    })
    if (!response.ok) return { ok: false, status: response.status }
    const result = await response.json().catch(() => ({}))
    return { ok: true, duplicate: Boolean(result.duplicate), status: result.status || 'accepted' }
  } catch (error) {
    return { ok: false, errorName: error?.name || 'Error' }
  }
}

const sendChatDiscovery = async ({ url, secret, chat, fetchImpl = fetch }) => {
  if (!secret || !chat || !isSafeChatId(chat.chatId)) return { ok: false }
  try {
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({ chatId: chat.chatId, name: typeof chat.name === 'string' ? chat.name.slice(0, 120) : '' })
    })
    if (!response.ok) return { ok: false }
    const result = await response.json().catch(() => ({}))
    return { ok: true, monitoringEnabled: result.monitoringEnabled === true }
  } catch {
    return { ok: false }
  }
}

export { createListenerIngestionHandler, createChatDiscoveryHandler, sendListenerIntake, sendChatDiscovery }
