import 'dotenv/config'
import whatsappWeb from 'whatsapp-web.js'
import { createListenerIntakePayload, extractMessageLinks, getMessageGroupContext, createDiscoveryMessageHandler, createListenerLifecycleLoggers, createDiscoveryLogger, isAllowedSourceContext, isSafeChatId, normalizeGroupId, selectDiscoveryMode } from './whatsappGroupListenerUtils.js'
import { sendChatDiscovery, sendListenerIntake } from './whatsappListenerIngestion.js'
import { installInitializationDiagnostics } from './whatsappInitializationDiagnostics.js'
import { createSelectedChatMessageHandler, getDiscoverableChat } from './whatsappChatMonitoring.js'
import { createWhatsAppReconnectController } from './whatsappReconnectController.js'

const { Client, LocalAuth } = whatsappWeb

const configuredSourceChatId = normalizeGroupId(process.env.WHATSAPP_SOURCE_CHAT_ID)
const sourceChatId = isSafeChatId(configuredSourceChatId) ? configuredSourceChatId : ''
const legacySourceGroupId = normalizeGroupId(process.env.WHATSAPP_SOURCE_GROUP_ID)
const sourceGroupId = configuredSourceChatId ? '' : isSafeChatId(legacySourceGroupId) && legacySourceGroupId.endsWith('@g.us') ? legacySourceGroupId : ''
const configuredSourceId = sourceChatId || sourceGroupId
const authPath = process.env.WHATSAPP_SESSION_DATA_PATH || '.wwebjs_auth'
const clientId = process.env.WHATSAPP_SESSION_CLIENT_ID || 'shakya-labs-group-listener'
const reconnectDelayMs = Number.parseInt(process.env.WHATSAPP_LISTENER_RECONNECT_DELAY_MS || '10000', 10)
const discoveryMode = selectDiscoveryMode(
  process.env.WHATSAPP_GROUP_DISCOVERY === 'true',
  process.env.WHATSAPP_PERSONAL_CHAT_DISCOVERY === 'true',
  process.env.WHATSAPP_CHAT_MONITORING === 'true'
)
let shuttingDown = false

const safeLog = (event, details = {}) => console.log(JSON.stringify({ event, ...details }))
const lifecycle = createListenerLifecycleLoggers(safeLog)
const handleDiscoveryMessage = createDiscoveryMessageHandler(discoveryMode, createDiscoveryLogger(safeLog))
const configuredPort = Number.parseInt(process.env.PORT || '5000', 10)
const listenerPort = Number.isFinite(configuredPort) && configuredPort > 0 ? configuredPort : 5000
const discoveryUrl = process.env.WHATSAPP_CHAT_DISCOVERY_URL || `http://127.0.0.1:${listenerPort}/api/internal/whatsapp-chats/discover`
const selectedChatMessageHandler = createSelectedChatMessageHandler({
  discoverChat: (chat) => sendChatDiscovery({
    url: discoveryUrl,
    secret: process.env.WHATSAPP_LISTENER_INGEST_SECRET,
    chat
  }),
  processSelectedMessage: async (message, chat) => {
    const chatContext = getMessageGroupContext(message)
    if (chatContext.chatId !== chat.chatId) return
    const intakePayload = createListenerIntakePayload(message, chatContext, chat.chatId, chat.chatType === 'group')
    if (!intakePayload) return
    const handoff = await sendListenerIntake({
      url: process.env.WHATSAPP_LISTENER_INGEST_URL || `http://127.0.0.1:${listenerPort}/api/internal/whatsapp-intakes`,
      secret: process.env.WHATSAPP_LISTENER_INGEST_SECRET,
      payload: intakePayload
    })
    if (handoff.ok) safeLog('intake_handoff_accepted', { duplicate: handoff.duplicate, status: handoff.status })
    else safeLog('intake_handoff_failed', { ...(handoff.status ? { status: handoff.status } : {}), errorName: handoff.errorName || 'RequestError' })
  }
})
const sensitiveDiagnosticPattern = /body|phone|participant|password|secret|token|authorization|cookie|session|credential|https?:\/\/|\+?\d{7,}/i
const sanitizeDiagnosticText = (value) => String(value || '').slice(0, 500)
  .replace(/https?:\/\/\S+/gi, '[url]')
  .replace(/\+?\d[\d\s().-]{6,}\d/g, '[number]')
  .replace(/(password|secret|token|authorization|cookie|session|credential)\s*[:=]\s*\S+/gi, '$1=[redacted]')
const safeErrorDiagnostics = (error) => {
  const message = sanitizeDiagnosticText(error?.message || error)
  const diagnostics = {
    errorName: sanitizeDiagnosticText(error?.name || 'Error'),
    errorMessage: message
  }
  if (error?.code !== undefined && ['string', 'number'].includes(typeof error.code)) diagnostics.errorCode = sanitizeDiagnosticText(error.code)
  if (typeof error?.stack === 'string' && !sensitiveDiagnosticPattern.test(error.stack)) diagnostics.errorStack = error.stack.slice(0, 2000)
  return diagnostics
}
const messageId = (message) => message?.id?._serialized || message?.id?.id || 'unknown'
const messageTimestamp = (message) => {
  const timestamp = Number(message?.timestamp)
  return Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp * 1000).toISOString() : null
}

const client = new Client({
  authStrategy: new LocalAuth({ clientId, dataPath: authPath }),
  puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
})
let reconnectController
const initializationDiagnostics = ['group', 'personal', 'managed'].includes(discoveryMode)
  ? installInitializationDiagnostics(client, safeLog, {
      onPostReadyInjectionFailure: () => reconnectController?.requestReconnect() === true
    })
  : null

reconnectController = createWhatsAppReconnectController({
  initialize: () => client.initialize(),
  beforeRetry: async () => {
    try {
      await client.destroy()
      initializationDiagnostics?.resetSingleFlight()
      return true
    } catch {
      return false
    }
  },
  onInitializationFailure: (phase) => {
    if (phase === 'initial') lifecycle.initializationFailed()
    else lifecycle.reconnectFailed()
  },
  onRetryScheduled: ({ attempt, delayMs }) => safeLog('reconnect_scheduled', { attempt, delayMs }),
  onRetryCleanupFailed: () => safeLog('reconnect_cleanup_failed', { code: 'client_destroy_rejected' }),
  onRetriesExhausted: () => safeLog('reconnect_exhausted', { code: 'retry_limit_reached' }),
  baseDelayMs: Number.isFinite(reconnectDelayMs) && reconnectDelayMs > 0 ? reconnectDelayMs : 10000,
  maxDelayMs: 30000,
  maxRetries: 3
})

client.on('qr', lifecycle.qrRequired)

client.on('authenticated', lifecycle.authenticated)
client.on('loading_screen', lifecycle.loadingScreen)
client.on('ready', async () => {
  initializationDiagnostics?.markReady()
  reconnectController.markReady()
  lifecycle.ready({
    discoveryMode: ['group', 'personal', 'managed'].includes(discoveryMode),
    personalDiscoveryMode: discoveryMode === 'personal',
    managedChatMonitoring: discoveryMode === 'managed',
    groupAllowlistConfigured: Boolean(configuredSourceId)
  })
})

client.on('message', async (message) => {
  try {
    if (shuttingDown || message?.fromMe) return
    if (['group', 'personal'].includes(discoveryMode)) {
      handleDiscoveryMessage(message)
      return
    }
    if (discoveryMode === 'conflict') return
    if (discoveryMode === 'managed') {
      await selectedChatMessageHandler(message)
      return
    }
    const chatContext = getMessageGroupContext(message)
    if (!chatContext.chatId) {
      safeLog('message_processing_error', { errorName: 'SourceChatContextError', errorMessage: 'Incoming message did not provide a safe source chat ID' })
      return
    }
    if (!isAllowedSourceContext(chatContext, configuredSourceId, Boolean(sourceGroupId))) return
    await selectedChatMessageHandler(message)
  } catch (error) {
    if (discoveryMode === 'normal') safeLog('message_processing_error', safeErrorDiagnostics(error))
  }
})

client.on('auth_failure', () => {
  lifecycle.authenticationFailed()
  reconnectController.requestReconnect()
})
client.on('disconnected', () => {
  lifecycle.disconnected()
  reconnectController.requestReconnect()
})
client.on('error', () => {
  lifecycle.clientError()
  reconnectController.requestReconnect()
})

const shutdown = async (signal) => {
  if (shuttingDown) return
  shuttingDown = true
  reconnectController.stop()
  initializationDiagnostics?.restore()
  safeLog('shutdown', { signal })
  try { await client.destroy() } catch (error) { safeLog('shutdown_error', { error: error?.name || 'Error' }) }
}

process.once('SIGINT', () => { shutdown('SIGINT').finally(() => process.exit(0)) })
process.once('SIGTERM', () => { shutdown('SIGTERM').finally(() => process.exit(0)) })

if (discoveryMode === 'conflict') {
  safeLog('discovery_mode_conflict')
  process.exitCode = 1
} else {
  safeLog('starting', {
    discoveryMode: ['group', 'personal', 'managed'].includes(discoveryMode),
    personalDiscoveryMode: discoveryMode === 'personal',
    managedChatMonitoring: discoveryMode === 'managed',
    groupAllowlistConfigured: Boolean(configuredSourceId)
  })
  initializationDiagnostics.begin()
  lifecycle.initializationStarted()
  void reconnectController.start().then((initialized) => {
    if (initialized) lifecycle.initializationCompleted()
  })
}
