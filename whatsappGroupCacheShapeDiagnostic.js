import { initializeClientUntilReady } from './whatsappRichResponseProbeRuntime.js'
import {
  readCachedChatShapes,
  isShapeDiagnosticEnabled,
  resolveChatShapeScanOutcome
} from './whatsappGroupCacheShapeDiagnosticCore.js'

const log = (event, metadata = {}) => console.log(JSON.stringify({ event, ...metadata }))
const destroyWithin = async (client) => {
  let timeout
  try {
    const destroyed = await Promise.race([
      client.destroy().then(() => true).catch(() => false),
      new Promise((resolve) => { timeout = setTimeout(() => resolve(false), 2_000) })
    ])
    if (!destroyed) log('client_shutdown_incomplete')
  } finally {
    clearTimeout(timeout)
  }
}

const enabled = isShapeDiagnosticEnabled(process.env.WHATSAPP_GROUP_CACHE_SHAPE_DIAGNOSTIC)
if (!enabled) {
  log('diagnostic_disabled')
} else {
  const { default: whatsappWeb } = await import('whatsapp-web.js')
  const { Client, LocalAuth } = whatsappWeb
  const authPath = process.env.WHATSAPP_SESSION_DATA_PATH || '.wwebjs_auth'
  const clientId = process.env.WHATSAPP_SESSION_CLIENT_ID || 'shakya-labs-group-listener'
  const client = new Client({
    authStrategy: new LocalAuth({ clientId, dataPath: authPath }),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  })
  let ready = false

  try {
    const startup = await initializeClientUntilReady(client)
    if (!startup.ready) {
      log('startup_failed', {
        reason: startup.reason,
        authenticated: startup.authenticated,
        cleanupComplete: startup.cleanupComplete
      })
    } else {
      ready = true
      const page = client.pupPage
      let timeout
      let rawReport
      let timedOut = false
      let evaluationSucceeded = false
      try {
        if (page) {
          const outcome = await Promise.race([
            Promise.resolve().then(() => page.evaluate(readCachedChatShapes))
              .then((result) => ({ succeeded: true, result }))
              .catch(() => ({ succeeded: false })),
            new Promise((resolve) => { timeout = setTimeout(() => resolve({ timedOut: true }), 5_000) })
          ])
          timedOut = outcome.timedOut === true
          evaluationSucceeded = outcome.succeeded === true
          rawReport = outcome.result
        }
      } finally {
        clearTimeout(timeout)
      }

      const outcome = resolveChatShapeScanOutcome({
        pageAvailable: Boolean(page),
        timedOut,
        evaluationSucceeded,
        result: rawReport
      })
      if (outcome.status !== 'ok') log('cache_shape_scan_unavailable', { code: outcome.code })
      else log('cache_shape_scan_complete', outcome.report)
    }
  } catch {
    log('diagnostic_failed')
  } finally {
    if (ready) await destroyWithin(client)
  }
}