import { initializeClientUntilReady } from './whatsappRichResponseProbeRuntime.js'
import {
  GROUP_CACHE_LIMITS,
  readCachedGroupIds,
  runIfExplicitlyEnabled,
  sanitizeCacheScanResult
} from './whatsappGroupCacheDiagnosticCore.js'

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

const enabled = await runIfExplicitlyEnabled(
  process.env.WHATSAPP_GROUP_CACHE_DIAGNOSTIC,
  async () => {
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
        log('startup_failed', { reason: startup.reason })
        return
      }
      ready = true

      const page = client.pupPage
      if (!page) {
        log('cache_scan_unavailable')
        return
      }

      let timeout
      let scan
      try {
        scan = await Promise.race([
          page.evaluate(readCachedGroupIds).catch(() => null),
          new Promise((resolve) => { timeout = setTimeout(() => resolve(null), GROUP_CACHE_LIMITS.scanTimeoutMs) })
        ])
      } finally {
        clearTimeout(timeout)
      }

      const safeScan = sanitizeCacheScanResult(scan)
      if (!safeScan || safeScan.status !== 'ok') {
        log('cache_scan_unavailable')
        return
      }

      for (const chatId of safeScan.groupIds) log('cached_group_discovered', { chatId })
      log('cache_scan_complete', {
        chatsScanned: safeScan.chatsScanned,
        groupsReported: safeScan.groupIds.length,
        truncated: safeScan.truncated
      })
    } catch {
      log('diagnostic_failed')
    } finally {
      if (ready) await destroyWithin(client)
    }
  }
)

if (!enabled) log('diagnostic_disabled')