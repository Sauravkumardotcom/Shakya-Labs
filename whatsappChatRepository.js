import { isSafeChatId } from './whatsappGroupListenerUtils.js'

const normalizeChat = (input = {}) => {
  const chatId = typeof input.chatId === 'string' ? input.chatId.trim() : ''
  if (!isSafeChatId(chatId)) return null
  const chatType = chatId.endsWith('@g.us') ? 'group' : 'personal'
  const name = typeof input.name === 'string'
    ? input.name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120)
    : ''
  return { chatId, chatType, name }
}

const publicChat = ({ chatId, chatType, name, monitoringEnabled, discoveredAt }) => ({
  chatId,
  chatType,
  name: name || '',
  monitoringEnabled: monitoringEnabled === true,
  discoveredAt
})

const createWhatsAppChatRepository = ({ readStore, writeStore }) => ({
  list() {
    return (readStore().whatsappChats || [])
      .map(publicChat)
      .sort((left, right) => left.chatType.localeCompare(right.chatType) || left.chatId.localeCompare(right.chatId))
  },
  discover(input) {
    const normalized = normalizeChat(input)
    if (!normalized) return { error: 'invalid_chat' }

    const store = readStore()
    if (!Array.isArray(store.whatsappChats)) store.whatsappChats = []
    const existing = store.whatsappChats.find((chat) => chat.chatId === normalized.chatId)
    if (!existing) {
      const chat = {
        ...normalized,
        monitoringEnabled: false,
        discoveredAt: new Date().toISOString()
      }
      store.whatsappChats.unshift(chat)
      writeStore(store)
      return { chat: publicChat(chat) }
    }

    const nextName = normalized.name || existing.name || ''
    if (existing.chatType !== normalized.chatType || existing.name !== nextName) {
      Object.assign(existing, { chatType: normalized.chatType, name: nextName })
      writeStore(store)
    }
    return { chat: publicChat(existing) }
  },
  setMonitoring(chatId, enabled) {
    if (!isSafeChatId(chatId) || typeof enabled !== 'boolean') return { error: 'invalid_selection' }
    const store = readStore()
    const chat = (store.whatsappChats || []).find((entry) => entry.chatId === chatId)
    if (!chat) return { error: 'chat_not_found' }
    chat.monitoringEnabled = enabled
    writeStore(store)
    return { chat: publicChat(chat) }
  },
  isMonitoringEnabled(chatId) {
    if (!isSafeChatId(chatId)) return false
    return (readStore().whatsappChats || []).some((chat) => chat.chatId === chatId && chat.monitoringEnabled === true)
  }
})

export { createWhatsAppChatRepository }