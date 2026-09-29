import whatsappWeb from 'whatsapp-web.js'
import { isSafeChatId, normalizeGroupId } from './whatsappGroupListenerUtils.js'
import { createProbeLifecycle, installBrowserProbe, restoreBrowserProbe, sanitizeProbeReport } from './whatsappRichResponseProbeCore.js'
import { initializeClientUntilReady, runIfExplicitlyEnabled } from './whatsappRichResponseProbeRuntime.js'

const { Client, LocalAuth } = whatsappWeb
const CALLBACK_NAME = '__shakyaSafeRichResponseReport'
const logMetadata = (event, metadata = {}) => console.log(JSON.stringify({ event, ...metadata }))
const configuredChatId = normalizeGroupId(process.env.WHATSAPP_SOURCE_CHAT_ID || process.env.WHATSAPP_SOURCE_GROUP_ID)
const targetChatId = isSafeChatId(configuredChatId) ? configuredChatId : ''
let client
let lifecycle
let destroyPromise
let removeProbeListeners = () => {}

const destroyClient = () => {
  if (!destroyPromise) {
    destroyPromise = client.destroy().catch(() => { logMetadata('shutdown_failed') })
  }
  return destroyPromise
}
const shutdown = async (event) => {
  logMetadata(event)
  removeProbeListeners()
  await destroyClient()
}

const restoreWrapper = async (page) => {
  let timeout
  try {
    const restored = await Promise.race([
      page.evaluate(restoreBrowserProbe).then((result) => result === true).catch(() => false),
      new Promise((resolve) => { timeout = setTimeout(() => resolve(false), 2_000) })
    ])
    if (!restored) await destroyClient()
  } finally {
    clearTimeout(timeout)
  }
}

const attachProbe = async () => {
  const page = client.pupPage
  if (!page || !targetChatId || lifecycle) return false

  lifecycle = createProbeLifecycle({
    restore: () => restoreWrapper(page),
    onComplete: async (report) => {
      const safeReport = sanitizeProbeReport(report)
      if (!safeReport) return
      logMetadata('rich_response_probe_result', safeReport)
      await shutdown('probe_finished')
      process.exit(0)
    }
  })

  try {
    await page.exposeFunction(CALLBACK_NAME, (input) => lifecycle.finish(input))
    const installed = await page.evaluate(installBrowserProbe, { sourceId: targetChatId })
    if (!installed) await lifecycle.finish({ status: 'probe_error' })
    return installed
  } catch {
    await lifecycle.finish({ status: 'probe_error' })
    return false
  }
}

const stopProbe = (event) => {
  if (lifecycle) return lifecycle.finish({ status: 'probe_error' })
  return shutdown(event)
}

const runEnabledProbe = async () => {
  if (!targetChatId) {
    logMetadata('source_chat_not_configured')
    return
  }

  const startup = await initializeClientUntilReady(client)
  if (!startup.ready) {
    logMetadata(startup.reason)
    return
  }

  const onAuthFailure = () => { void stopProbe('authentication_failed') }
  const onDisconnected = () => { void stopProbe('disconnected') }
  const onError = () => { void stopProbe('client_error') }
  const onSigint = () => { void stopProbe('interrupted') }
  const onSigterm = () => { void stopProbe('terminated') }
  client.on('auth_failure', onAuthFailure)
  client.on('disconnected', onDisconnected)
  client.on('error', onError)
  process.once('SIGINT', onSigint)
  process.once('SIGTERM', onSigterm)
  removeProbeListeners = () => {
    client.off('auth_failure', onAuthFailure)
    client.off('disconnected', onDisconnected)
    client.off('error', onError)
    process.off('SIGINT', onSigint)
    process.off('SIGTERM', onSigterm)
  }

  await attachProbe()
}

const enabled = await runIfExplicitlyEnabled(
  process.env.WHATSAPP_RICH_PROBE_ENABLED,
  () => {
    const authPath = process.env.WHATSAPP_SESSION_DATA_PATH || '.wwebjs_auth'
    const clientId = process.env.WHATSAPP_SESSION_CLIENT_ID || 'shakya-labs-group-listener'
    client = new Client({
      authStrategy: new LocalAuth({ clientId, dataPath: authPath }),
      puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
    })
    return client
  },
  runEnabledProbe
)

if (!enabled) logMetadata('diagnostic_disabled')