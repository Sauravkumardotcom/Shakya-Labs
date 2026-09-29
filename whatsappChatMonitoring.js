import { isSafeChatId } from './whatsappGroupListenerUtils.js'

const ownDataValue = (value, key) => {
  if (!value || typeof value !== 'object') return undefined
  const descriptor = Object.getOwnPropertyDescriptor(value, key)
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ? descriptor.value
    : undefined
}

const getDiscoverableChat = (message) => {
  if (!message || ownDataValue(message, 'fromMe') === true) return null
  const chatIdValue = ownDataValue(message, 'from')
  if (typeof chatIdValue !== 'string') return null
  const chatId = chatIdValue.trim()
  if (!isSafeChatId(chatId)) return null

  const chatType = chatId.endsWith('@g.us') ? 'group' : 'personal'
  const chat = ownDataValue(message, 'chat') || ownDataValue(message, '_chat')
  const nameValue = ownDataValue(chat, 'name') || ownDataValue(chat, 'formattedTitle')
  const name = typeof nameValue === 'string' ? nameValue.slice(0, 120) : ''
  return { chatId, chatType, name }
}

const createSelectedChatMessageHandler = ({ discoverChat, processSelectedMessage }) => async (message) => {
  const chat = getDiscoverableChat(message)
  if (!chat) return { monitored: false, reason: 'invalid_chat' }

  let result
  try {
    result = await discoverChat(chat)
  } catch {
    return { monitored: false, reason: 'discovery_unavailable' }
  }
  if (result?.monitoringEnabled !== true) return { monitored: false, reason: 'not_selected' }

  await processSelectedMessage(message, chat)
  return { monitored: true }
}

export { getDiscoverableChat, createSelectedChatMessageHandler }