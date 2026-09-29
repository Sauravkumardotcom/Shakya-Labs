import crypto from 'crypto'

const MAX_EVENT_ID_LENGTH = 200
const MAX_SENDER_VALUE_LENGTH = 160
const positiveSeconds = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const textValue = (value, maxLength = MAX_SENDER_VALUE_LENGTH, field = 'value') => {
  if (value === undefined || value === null) return ''
  if (!['string', 'number'].includes(typeof value)) throw new Error(`${field} must be a string or number`)
  return String(value).trim().slice(0, maxLength)
}
const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null)
const headerValue = (headers, name) => {
  const value = headers?.[name] ?? headers?.[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}
const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''))
  const rightBuffer = Buffer.from(String(right || ''))
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

const verifyHmac = (rawBody, signature, secret) => {
  const supplied = String(signature || '').replace(/^sha256=/i, '')
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqual(supplied, expected)
}

const validateReplayTimestamp = (receivedAt, { now = Date.now(), replayWindowSeconds = 300, futureSkewSeconds = 60 } = {}) => {
  if (!receivedAt) return { hasTimestamp: false }
  const timestamp = new Date(receivedAt).getTime()
  if (Number.isNaN(timestamp)) throw new Error('Webhook timestamp is invalid')
  if (now - timestamp > replayWindowSeconds * 1000) throw new Error('Webhook timestamp is too old')
  if (timestamp - now > futureSkewSeconds * 1000) throw new Error('Webhook timestamp is too far in the future')
  return { hasTimestamp: true, timestamp: new Date(timestamp).toISOString() }
}

const normalizeWebhookPayload = (payload, provider = 'mock') => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Webhook payload must be an object')
  if (payload.message !== undefined && (!payload.message || typeof payload.message !== 'object' || Array.isArray(payload.message))) throw new Error('Webhook message must be an object')
  if (payload.sender !== undefined && (!payload.sender || typeof payload.sender !== 'object' || Array.isArray(payload.sender))) throw new Error('Webhook sender must be an object')
  const message = payload.message || payload
  const sender = payload.sender || {}
  const eventId = textValue(firstDefined(payload.eventId, payload.event_id, payload.id, message.eventId), MAX_EVENT_ID_LENGTH, 'eventId')
  const messageId = textValue(firstDefined(payload.messageId, payload.message_id, message.id), MAX_EVENT_ID_LENGTH, 'messageId')
  const rawMessage = textValue(firstDefined(payload.rawMessage, payload.text, message.text, message.body), 20000, 'text')
  if (!eventId) throw new Error('Webhook event ID is required')
  if (!rawMessage) throw new Error('Webhook text message is required')

  const receivedAt = firstDefined(payload.receivedAt, payload.received_at, message.timestamp)
  const timestampText = receivedAt === undefined ? '' : textValue(receivedAt, 80, 'receivedAt')
  const parsedDate = timestampText ? new Date(timestampText) : null
  if (timestampText && Number.isNaN(parsedDate.getTime())) throw new Error('Webhook timestamp is invalid')
  const normalizedReceivedAt = parsedDate ? parsedDate.toISOString() : undefined

  return {
    provider: textValue(provider, 40) || 'mock',
    providerEventId: eventId,
    providerMessageId: messageId,
    rawMessage,
    senderName: textValue(firstDefined(payload.senderName, sender.name, sender.displayName), MAX_SENDER_VALUE_LENGTH, 'senderName'),
    senderPhone: textValue(firstDefined(payload.senderPhone, sender.phone, sender.wa_id), 40, 'senderPhone'),
    senderId: textValue(firstDefined(payload.senderId, sender.id), MAX_SENDER_VALUE_LENGTH, 'senderId'),
    receivedAt: normalizedReceivedAt,
    providerMetadata: {
      ...(payload.providerMetadata && typeof payload.providerMetadata === 'object' && !Array.isArray(payload.providerMetadata) ? payload.providerMetadata : {}),
      provider: textValue(provider, 40) || 'mock',
      eventId,
      messageId: messageId || null,
      messageType: textValue(firstDefined(payload.type, message.type, 'text'), 40, 'messageType')
    }
  }
}

const createWhatsAppProvider = ({ providerName = 'mock', webhookSecret = '', appSecret = '', replayWindowSeconds = 300, futureSkewSeconds = 60 } = {}) => ({
  name: textValue(providerName, 40, 'providerName') || 'mock',
  verifyWebhookRequest(request, rawBody) {
    if (appSecret) {
      return verifyHmac(rawBody, headerValue(request.headers, 'x-hub-signature-256') || headerValue(request.headers, 'x-whatsapp-signature'), appSecret)
    }
    if (webhookSecret) {
      return safeEqual(headerValue(request.headers, 'x-whatsapp-webhook-secret') || headerValue(request.headers, 'x-webhook-secret'), webhookSecret)
    }
    return false
  },
  verifyChallenge(request) {
    const mode = textValue(request.query?.['hub.mode'], 40)
    const token = textValue(request.query?.['hub.verify_token'], 200)
    const challenge = textValue(request.query?.['hub.challenge'], 500)
    return mode === 'subscribe' && Boolean(challenge) && Boolean(webhookSecret) && safeEqual(token, webhookSecret) ? challenge : null
  },
  normalize(payload) {
    return normalizeWebhookPayload(payload, this.name)
  },
  validateTimestamp(receivedAt) {
    return validateReplayTimestamp(receivedAt, { replayWindowSeconds: positiveSeconds(replayWindowSeconds, 300), futureSkewSeconds: positiveSeconds(futureSkewSeconds, 60) })
  }
})

export { createWhatsAppProvider, normalizeWebhookPayload, validateReplayTimestamp, verifyHmac }
