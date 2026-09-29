const HTTP_URL_PATTERN = /https?:\/\/[^\s<>"']+/gi
const CHAT_ID_PATTERN = /^\d+@(g|c)\.us$/

const extractHttpUrls = (text) => [...new Set(
  String(text || '')
    .match(HTTP_URL_PATTERN)?.map((url) => url.replace(/[),.;!?]+$/, '')) || []
)]

const extractRichResponseText = (message = {}) => {
  const richResponse = message?.rawData?.richResponse
  if (!richResponse || typeof richResponse !== 'object' || Array.isArray(richResponse)) return ''
  if (!Array.isArray(richResponse.fragments)) return ''
  return richResponse.fragments
    .filter((fragment) => fragment && typeof fragment === 'object' && typeof fragment.text === 'string')
    .map((fragment) => fragment.text)
    .join('')
}

const extractMessageLinks = (message = {}) => {
  const seen = new Set()
  const links = Array.isArray(message.links) ? message.links.flatMap((entry) => {
    if (!entry || typeof entry.link !== 'string') return []
    const url = entry.link.trim()
    if (!url || seen.has(url)) return []
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return []
    } catch {
      return []
    }
    seen.add(url)
    return [{ url, isSuspicious: entry.isSuspicious === true }]
  }) : []
  if (links.length) return links

  const text = message.type === 'rich_response'
    ? extractRichResponseText(message)
    : message.body
  return extractHttpUrls(text).map((url) => ({ url, isSuspicious: false }))
}

const normalizeGroupId = (groupId) => String(groupId || '').trim()
const isSafeChatId = (chatId) => typeof chatId === 'string' && CHAT_ID_PATTERN.test(chatId.trim())
const isAllowedGroup = (groupId, sourceGroupId) => {
  const configuredGroupId = normalizeGroupId(sourceGroupId)
  return Boolean(configuredGroupId) && normalizeGroupId(groupId) === configuredGroupId
}
const isAllowedSourceChat = (chatId, sourceChatId) => isSafeChatId(chatId) && isSafeChatId(sourceChatId) && chatId.trim() === sourceChatId.trim()
const isAllowedSourceContext = (context, sourceChatId, groupOnly = false) => {
  if (!context || !isSafeChatId(context.chatId) || !['group', 'private'].includes(context.chatType)) return false
  if (groupOnly && context.chatType !== 'group') return false
  return isAllowedSourceChat(context.chatId, sourceChatId)
}
const createListenerIntakePayload = (message, context, sourceChatId, groupOnly = false) => {
  if (!isAllowedSourceContext(context, sourceChatId, groupOnly)) return null
  const sourceUrls = [...new Set(extractMessageLinks(message)
    .filter((link) => !link.isSuspicious)
    .map((link) => link.url))].slice(0, 20)
  if (!sourceUrls.length) return null
  const eventId = message?.id?._serialized || message?.id?.id
  if (typeof eventId !== 'string' || !eventId.trim()) return null
  const rawMessage = typeof message?.body === 'string' ? message.body : ''
  if (rawMessage.length > 20000) return null
  const timestamp = Number(message?.timestamp)
  return {
    sourceChatId: context.chatId,
    providerEventId: eventId,
    rawMessage,
    sourceUrls,
    receivedAt: Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp * 1000).toISOString() : undefined
  }
}
const getMessageGroupContext = (message) => {
  const chat = message?.chat || message?._chat
  const messageFrom = typeof message?.from === 'string' ? message.from.trim() : ''
  const validMessageFrom = isSafeChatId(messageFrom)
  const chatType = validMessageFrom ? (messageFrom.endsWith('@g.us') ? 'group' : 'private') : null
  const isGroup = chatType === 'group' ? true : chatType === 'private' ? false : null
  return {
    isGroup,
    chatType,
    chatId: validMessageFrom ? messageFrom : '',
    groupId: chatType === 'group' ? messageFrom : '',
    groupName: isGroup && typeof chat?.name === 'string' ? chat.name.trim().slice(0, 200) : ''
  }
}
const getDiscoverableGroupId = (message) => {
  const context = getMessageGroupContext(message)
  return context.chatType === 'group' && isSafeChatId(context.chatId) ? context.chatId : ''
}
const getDiscoverablePersonalChatId = (message) => {
  const chatId = typeof message?.from === 'string' ? message.from.trim() : ''
  return isSafeChatId(chatId) && chatId.endsWith('@c.us') ? chatId : ''
}
const selectDiscoveryMode = (groupEnabled, personalEnabled, managedEnabled = false) => {
  if (managedEnabled === true && (groupEnabled === true || personalEnabled === true)) return 'conflict'
  if (managedEnabled === true) return 'managed'
  if (groupEnabled === true && personalEnabled === true) return 'conflict'
  if (groupEnabled === true) return 'group'
  if (personalEnabled === true) return 'personal'
  return 'normal'
}
const createDiscoveryMessageHandler = (mode, onDiscovered) => {
  const seenChatIds = new Set()
  return (message) => {
    if (message?.fromMe || !['group', 'personal'].includes(mode)) return
    const chatId = mode === 'group'
      ? getDiscoverableGroupId(message)
      : getDiscoverablePersonalChatId(message)
    if (!chatId || seenChatIds.has(chatId)) return
    seenChatIds.add(chatId)
    onDiscovered(mode === 'group' ? 'group_discovered' : 'personal_chat_discovered', chatId)
  }
}
const createListenerLifecycleLoggers = (log) => ({
  initializationStarted: () => log('initialization_started'),
  initializationCompleted: () => log('initialization_completed'),
  initializationFailed: () => log('initialization_failed', { code: 'client_initialize_rejected' }),
  qrRequired: () => log('qr_required'),
  authenticated: () => log('authenticated'),
  loadingScreen: () => log('loading_screen'),
  ready: (details) => log('ready', details),
  authenticationFailed: () => log('authentication_failed', { code: 'authentication_failed' }),
  disconnected: () => log('disconnected', { code: 'client_disconnected' }),
  clientError: () => log('client_error', { code: 'client_error_event' }),
  reconnectFailed: () => log('reconnect_failed', { code: 'reconnect_initialize_rejected' })
})
const createDiscoveryLogger = (log) => (event, chatId) => {
  if (event === 'group_discovered') log(event, { chatId })
  else if (event === 'personal_chat_discovered') log(event)
}

export { extractHttpUrls, extractMessageLinks, extractRichResponseText, getMessageGroupContext, getDiscoverableGroupId, getDiscoverablePersonalChatId, selectDiscoveryMode, createDiscoveryMessageHandler, createListenerLifecycleLoggers, createDiscoveryLogger, isAllowedGroup, isAllowedSourceChat, isAllowedSourceContext, isSafeChatId, normalizeGroupId, createListenerIntakePayload }
