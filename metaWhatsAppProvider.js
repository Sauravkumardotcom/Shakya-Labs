import { createWhatsAppProvider, normalizeWebhookPayload } from './whatsappProvider.js'

const META_PROVIDER_NAME = 'meta'
const text = (value, field) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`)
  return value.trim()
}
const optionalText = (value) => typeof value === 'string' ? value.trim() : ''
const toTimestamp = (value) => {
  const seconds = Number(value)
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('Meta message timestamp is required')
  return new Date(seconds * 1000).toISOString()
}
const getMessages = (payload) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Meta webhook payload must be an object')
  if (payload.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) throw new Error('Invalid Meta WhatsApp webhook envelope')
  const messages = []
  for (const entry of payload.entry) {
    if (!entry || typeof entry !== 'object' || !Array.isArray(entry.changes)) throw new Error('Invalid Meta WhatsApp webhook entry')
    for (const change of entry.changes) {
      if (!change || typeof change !== 'object') throw new Error('Invalid Meta WhatsApp webhook change')
      if (change.field !== 'messages') continue
      const value = change.value
      if (!value || typeof value !== 'object' || !Array.isArray(value.messages)) throw new Error('Invalid Meta messages change')
      const contacts = Array.isArray(value.contacts) ? value.contacts : []
      for (const message of value.messages) {
        if (!message || typeof message !== 'object' || message.type !== 'text') throw new Error('Unsupported Meta WhatsApp message type')
        if (!message.text || typeof message.text !== 'object' || typeof message.text.body !== 'string' || !message.text.body.trim()) throw new Error('Meta text message body is required')
        const contact = contacts.find((candidate) => candidate?.wa_id === message.from)
        const eventId = text(message.id, 'Meta message ID')
        messages.push(normalizeWebhookPayload({
          eventId,
          messageId: eventId,
          text: message.text.body,
          receivedAt: toTimestamp(message.timestamp),
          sender: { id: message.from, phone: message.from, name: contact?.profile?.name },
          providerMetadata: {
            provider: META_PROVIDER_NAME,
            eventId,
            messageId: eventId,
            messageType: message.type,
            businessAccountId: optionalText(entry.id),
            phoneNumberId: optionalText(value.metadata?.phone_number_id)
          }
        }, META_PROVIDER_NAME))
      }
    }
  }
  return messages
}

const createMetaWhatsAppProvider = ({ appSecret = '', verifyToken = '', phoneNumberId = '', businessAccountId = '', replayWindowSeconds, futureSkewSeconds } = {}) => {
  const base = createWhatsAppProvider({ providerName: META_PROVIDER_NAME, appSecret, webhookSecret: verifyToken, replayWindowSeconds, futureSkewSeconds })
  return {
    ...base,
    normalize(payload) {
      const events = getMessages(payload)
      if (phoneNumberId || businessAccountId) {
        for (const entry of payload.entry) {
          for (const change of entry.changes || []) {
            if (change.field !== 'messages') continue
            const actualPhoneNumberId = optionalText(change.value?.metadata?.phone_number_id)
            if (phoneNumberId && actualPhoneNumberId !== phoneNumberId) throw new Error('Meta phone number does not match configuration')
            if (businessAccountId && entry.id !== businessAccountId) throw new Error('Meta business account does not match configuration')
          }
        }
      }
      return events
    }
  }
}

export { createMetaWhatsAppProvider, getMessages }
