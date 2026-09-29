export const STARTUP_TIMEOUT_MS = 60_000
export const STARTUP_CLEANUP_TIMEOUT_MS = 5_000

export async function runIfExplicitlyEnabled(enabledValue, createClient, runClient) {
  if (enabledValue !== 'true') return false
  const client = createClient()
  await runClient(client)
  return true
}

const destroyClientBounded = async (client, cleanupTimeoutMs) => {
  const boundedTimeout = Number.isSafeInteger(cleanupTimeoutMs) && cleanupTimeoutMs > 0
    ? Math.min(cleanupTimeoutMs, STARTUP_CLEANUP_TIMEOUT_MS)
    : STARTUP_CLEANUP_TIMEOUT_MS
  let timeout
  const waitBounded = (operation) => Promise.race([
    Promise.resolve().then(operation).then(() => true).catch(() => false),
    new Promise((resolve) => { timeout = setTimeout(() => resolve(false), boundedTimeout) })
  ]).finally(() => clearTimeout(timeout))

  if (await waitBounded(() => client.destroy())) return true
  const browser = client.pupBrowser
  if (browser && typeof browser.close === 'function' && await waitBounded(() => browser.close.call(browser))) return true
  return false
}

export function initializeClientUntilReady(client, timeoutMs = STARTUP_TIMEOUT_MS, cleanupTimeoutMs = STARTUP_CLEANUP_TIMEOUT_MS) {
  const boundedTimeout = Number.isSafeInteger(timeoutMs) && timeoutMs > 0
    ? Math.min(timeoutMs, STARTUP_TIMEOUT_MS)
    : STARTUP_TIMEOUT_MS

  return new Promise((resolve) => {
    let settled = false
    let failureSettled = false
    let initializationSettled = false
    let authenticated = false
    let timeout
    let cleanupChain = Promise.resolve(true)

    const remove = (event, listener) => {
      if (typeof client.off === 'function') client.off(event, listener)
      else client.removeListener(event, listener)
    }
    const cleanupListeners = () => {
      clearTimeout(timeout)
      remove('ready', onReady)
      remove('authenticated', onAuthenticated)
      remove('qr', onQr)
      remove('auth_failure', onAuthFailure)
      remove('disconnected', onDisconnected)
      remove('error', onError)
    }
    const cleanup = () => {
      cleanupChain = cleanupChain.then(() => destroyClientBounded(client, cleanupTimeoutMs))
      return cleanupChain
    }
    const finish = async (result) => {
      if (settled) return
      settled = true
      failureSettled = !result.ready
      cleanupListeners()
      let cleanupComplete = true
      if (!result.ready) {
        cleanupComplete = await cleanup() && initializationSettled
      }
      resolve({ ...result, ...(result.ready ? {} : { authenticated, cleanupComplete }) })
    }
    const onAuthenticated = () => { authenticated = true }
    const onReady = () => { void finish({ ready: true, reason: 'ready' }) }
    const onQr = () => { void finish({ ready: false, reason: 'qr_required' }) }
    const onAuthFailure = () => { void finish({ ready: false, reason: 'authentication_failed' }) }
    const onDisconnected = () => { void finish({ ready: false, reason: 'disconnected' }) }
    const onError = () => { void finish({ ready: false, reason: 'client_error' }) }

    client.on('ready', onReady)
    client.on('authenticated', onAuthenticated)
    client.on('qr', onQr)
    client.on('auth_failure', onAuthFailure)
    client.on('disconnected', onDisconnected)
    client.on('error', onError)
    timeout = setTimeout(() => {
      void finish({ ready: false, reason: 'startup_timeout' })
    }, boundedTimeout)

    try {
      Promise.resolve(client.initialize()).then(() => {
        initializationSettled = true
        if (failureSettled) void cleanup()
      }, () => {
        initializationSettled = true
        if (failureSettled) void cleanup()
        else void finish({ ready: false, reason: 'initialization_failed' })
      })
    } catch {
      void finish({ ready: false, reason: 'initialization_failed' })
    }
  })
}