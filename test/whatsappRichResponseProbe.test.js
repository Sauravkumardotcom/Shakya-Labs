import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import {
  PROBE_LIMITS,
  SAFE_FIELDS,
  createProbeLifecycle,
  installBrowserProbe,
  restoreBrowserProbe,
  sanitizeProbeReport
} from '../whatsappRichResponseProbeCore.js'
import { initializeClientUntilReady, runIfExplicitlyEnabled, STARTUP_CLEANUP_TIMEOUT_MS, STARTUP_TIMEOUT_MS } from '../whatsappRichResponseProbeRuntime.js'

const makeSummary = (overrides = {}) => ({
  type: 'object',
  visitedNodes: 1,
  arrayItemsVisited: 0,
  totalArrayLength: 0,
  maximumDepth: 0,
  anyHttpUrl: false,
  urlLikeStringCount: 0,
  stringCount: 0,
  totalStringLength: 0,
  maximumStringLength: 0,
  truncated: false,
  safeFieldPresence: Object.fromEntries(SAFE_FIELDS.map((field) => [field, false])),
  ...overrides
})

const makeReport = (overrides = {}) => ({
  status: 'captured',
  internalModel: makeSummary(),
  serializedMessage: makeSummary(),
  safeFieldPresence: Object.fromEntries(SAFE_FIELDS.map((field) => [field, false])),
  ...overrides
})

const withBrowser = async (original, operation) => {
  const previousWindow = globalThis.window
  globalThis.window = { WWebJS: { getMessageModel: original } }
  try {
    return await operation(globalThis.window.WWebJS)
  } finally {
    if (previousWindow === undefined) delete globalThis.window
    else globalThis.window = previousWindow
  }
}

const matchingMessage = (fields = {}) => ({
  type: 'rich_response',
  from: 'configured-source',
  ...fields
})

const evaluateInBrowser = (operation, ...args) => runInNewContext(
  `(${operation.toString()})`,
  { window: globalThis.window }
)(...args)

test('callback sanitizer discards malicious unknown fields and sensitive strings', () => {
  const hostile = makeReport({
    messageText: 'private message',
    chatId: 'private-chat',
    arbitraryKeyName: 'credential-value'
  })
  const safe = sanitizeProbeReport(hostile)
  assert.ok(safe)
  assert.equal(JSON.stringify(safe).includes('private'), false)
  assert.equal(JSON.stringify(safe).includes('chatId'), false)
  assert.equal(JSON.stringify(safe).includes('arbitraryKeyName'), false)
  assert.deepEqual(Object.keys(safe), ['status', 'internalModel', 'serializedMessage', 'safeFieldPresence'])
})

test('diagnostic defaults to disabled and does not create or initialize a client', async () => {
  let created = 0
  let initialized = 0
  const enabled = await runIfExplicitlyEnabled(undefined, () => {
    created += 1
    return { initialize() { initialized += 1 } }
  }, (client) => client.initialize())

  assert.equal(enabled, false)
  assert.equal(created, 0)
  assert.equal(initialized, 0)
})

test('only the exact string true enables client creation', async () => {
  for (const value of ['TRUE', 'True', '1', ' true', 'true ']) {
    let created = false
    assert.equal(await runIfExplicitlyEnabled(value, () => { created = true }, () => {}), false)
    assert.equal(created, false)
  }

  let ran = false
  assert.equal(await runIfExplicitlyEnabled('true', () => ({}), () => { ran = true }), true)
  assert.equal(ran, true)
})

test('startup timeout removes client listeners and safely destroys the client', async () => {
  const client = new EventEmitter()
  let initializeCalls = 0
  let destroyCalls = 0
  client.initialize = () => {
    initializeCalls += 1
    client.emit('authenticated')
    return new Promise(() => {})
  }
  client.destroy = async () => { destroyCalls += 1 }

  const result = await initializeClientUntilReady(client, 5)

  assert.deepEqual(result, {
    ready: false,
    reason: 'startup_timeout',
    authenticated: true,
    cleanupComplete: false
  })
  assert.equal(initializeCalls, 1)
  assert.equal(destroyCalls, 1)
  for (const event of ['ready', 'qr', 'auth_failure', 'disconnected', 'error']) {
    assert.equal(client.listenerCount(event), 0)
  }
})

test('startup timeout distinguishes settled initialization from missing authentication events', async () => {
  const client = new EventEmitter()
  client.initialize = async () => {}
  client.destroy = async () => {}

  const result = await initializeClientUntilReady(client, 5, 5)

  assert.deepEqual(result, {
    ready: false,
    reason: 'startup_timeout',
    authenticated: false,
    cleanupComplete: true
  })
})

test('startup timeout stays bounded and separate from its cleanup budget', () => {
  assert.equal(STARTUP_TIMEOUT_MS, 60_000)
  assert.equal(STARTUP_CLEANUP_TIMEOUT_MS, 5_000)
})

test('startup timeout force-closes a browser when client destroy stalls', async () => {
  const client = new EventEmitter()
  let browserCloseCalls = 0
  client.initialize = async () => {}
  client.destroy = () => new Promise(() => {})
  client.pupBrowser = { close: async () => { browserCloseCalls += 1 } }

  const result = await initializeClientUntilReady(client, 5, 5)

  assert.equal(result.reason, 'startup_timeout')
  assert.equal(result.cleanupComplete, true)
  assert.equal(browserCloseCalls, 1)
})

test('late initialization is cleaned up without a retry or lingering startup listeners', async () => {
  const client = new EventEmitter()
  let finishInitialization
  let initializeCalls = 0
  let destroyCalls = 0
  let lateDestroyComplete
  const lateCleanup = new Promise((resolve) => { lateDestroyComplete = resolve })
  client.initialize = () => {
    initializeCalls += 1
    return new Promise((resolve) => {
      finishInitialization = () => {
        client.pupBrowser = { close: async () => {} }
        resolve()
      }
    })
  }
  client.destroy = async () => {
    destroyCalls += 1
    if (destroyCalls === 2) lateDestroyComplete()
  }

  const result = await initializeClientUntilReady(client, 5, 5)
  assert.equal(result.cleanupComplete, false)
  assert.equal(initializeCalls, 1)
  assert.equal(destroyCalls, 1)
  for (const event of ['ready', 'authenticated', 'qr', 'auth_failure', 'disconnected', 'error']) {
    assert.equal(client.listenerCount(event), 0)
  }

  finishInitialization()
  await lateCleanup
  assert.equal(initializeCalls, 1)
  assert.equal(destroyCalls, 2)
})

test('callback sanitizer ignores unknown accessors without invoking them', () => {
  let getterCalled = false
  const input = makeReport()
  Object.defineProperty(input, 'unknown', { enumerable: true, get() { getterCalled = true; throw new Error('not read') } })
  assert.ok(sanitizeProbeReport(input))
  assert.equal(getterCalled, false)
})

test('callback sanitizer rejects malformed and out-of-range reports', () => {
  assert.equal(sanitizeProbeReport({ status: 'captured', messageText: 'not a report' }), null)
  assert.equal(sanitizeProbeReport(makeReport({ internalModel: makeSummary({ visitedNodes: PROBE_LIMITS.maximumVisitedNodes + 1 }) })), null)
  assert.equal(sanitizeProbeReport({ status: 'captured', get internalModel() { throw new Error('not read') } }), null)
})

test('browser inspector skips accessors and restores the original function after capture', async () => {
  let getterCalled = false
  let callbackReport
  const serialized = matchingMessage()
  Object.defineProperty(serialized, 'richResponse', { enumerable: true, get() { getterCalled = true; return 'hidden' } })
  const original = function () { return serialized }

  await withBrowser(original, (api) => {
    globalThis.window.__shakyaSafeRichResponseReport = (report) => { callbackReport = report }
    assert.equal(evaluateInBrowser(installBrowserProbe, { sourceId: 'configured-source' }), true)
    assert.equal(api.getMessageModel({ attributes: matchingMessage() }), serialized)
    assert.equal(api.getMessageModel, original)
  })

  assert.equal(getterCalled, false)
  assert.equal(sanitizeProbeReport(callbackReport)?.status, 'captured')
})

test('browser inspector handles cycles and enforces depth and node limits', async () => {
  let callbackReport
  const original = function () { return matchingMessage() }
  const cycle = {}
  cycle.richResponse = cycle
  const attributes = matchingMessage({ richResponse: cycle })
  let sharedBranch = {}
  for (let depth = 0; depth < 10; depth += 1) {
    sharedBranch = Object.fromEntries(SAFE_FIELDS.map((field) => [field, sharedBranch]))
  }
  attributes.unifiedResponse = sharedBranch

  await withBrowser(original, (api) => {
    globalThis.window.__shakyaSafeRichResponseReport = (report) => { callbackReport = report }
    assert.equal(evaluateInBrowser(installBrowserProbe, { sourceId: 'configured-source' }), true)
    api.getMessageModel({ attributes })
  })

  const safe = sanitizeProbeReport(callbackReport)
  assert.ok(safe)
  assert.equal(safe.internalModel.truncated, true)
  assert.ok(safe.internalModel.maximumDepth <= PROBE_LIMITS.maximumDepth)
  assert.ok(safe.internalModel.visitedNodes <= PROBE_LIMITS.maximumVisitedNodes)
})

test('array inspection is capped and skips accessor indices', async () => {
  let callbackReport
  let getterCalled = false
  const values = new Array(PROBE_LIMITS.maximumArrayLength + 5)
  Object.defineProperty(values, '0', { enumerable: true, get() { getterCalled = true; return 'hidden' } })
  const original = function () { return matchingMessage({ richResponse: values }) }

  await withBrowser(original, (api) => {
    globalThis.window.__shakyaSafeRichResponseReport = (report) => { callbackReport = report }
    evaluateInBrowser(installBrowserProbe, { sourceId: 'configured-source' })
    api.getMessageModel({ attributes: matchingMessage() })
  })

  const safe = sanitizeProbeReport(callbackReport)
  assert.ok(safe)
  assert.equal(getterCalled, false)
  assert.equal(safe.serializedMessage.arrayItemsVisited, 0)
  assert.equal(safe.serializedMessage.truncated, true)
})

test('original function errors restore the wrapper and report no error details', async () => {
  let callbackReport
  const failure = new Error('sensitive failure detail')
  const original = function () { throw failure }

  await withBrowser(original, (api) => {
    globalThis.window.__shakyaSafeRichResponseReport = (report) => { callbackReport = report }
    evaluateInBrowser(installBrowserProbe, { sourceId: 'configured-source' })
    assert.throws(() => api.getMessageModel({}), (error) => error === failure)
    assert.equal(api.getMessageModel, original)
  })

  assert.deepEqual(sanitizeProbeReport(callbackReport), { status: 'inspection_error' })
})

test('source matching descriptor errors restore the wrapper', async () => {
  let callbackReport
  const original = function () { return matchingMessage() }
  const hostileModel = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error('sensitive trap detail') } })

  await withBrowser(original, (api) => {
    globalThis.window.__shakyaSafeRichResponseReport = (report) => { callbackReport = report }
    evaluateInBrowser(installBrowserProbe, { sourceId: 'configured-source' })
    assert.throws(() => api.getMessageModel(hostileModel))
    assert.equal(api.getMessageModel, original)
  })

  assert.deepEqual(sanitizeProbeReport(callbackReport), { status: 'inspection_error' })
})

test('message-type descriptor errors restore the wrapper', async () => {
  let callbackReport
  const original = function () {
    return new Proxy({}, { getOwnPropertyDescriptor(_target, property) {
      if (property === 'type') throw new Error('sensitive type detail')
      return undefined
    } })
  }

  await withBrowser(original, (api) => {
    globalThis.window.__shakyaSafeRichResponseReport = (report) => { callbackReport = report }
    evaluateInBrowser(installBrowserProbe, { sourceId: 'configured-source' })
    assert.throws(() => api.getMessageModel({}))
    assert.equal(api.getMessageModel, original)
  })

  assert.deepEqual(sanitizeProbeReport(callbackReport), { status: 'inspection_error' })
})

test('lifecycle restores before successful completion and ignores duplicate completion', async () => {
  const events = []
  const lifecycle = createProbeLifecycle({
    timeoutMs: 1_000,
    restore: async () => { events.push('restore') },
    onComplete: async () => { events.push('complete') }
  })

  assert.equal(await lifecycle.finish(makeReport()), true)
  assert.equal(await lifecycle.finish(makeReport()), false)
  assert.deepEqual(events, ['restore', 'complete'])
})

test('timeout restores before completion and races idempotently', async () => {
  const events = []
  const original = function () { return matchingMessage() }
  await withBrowser(original, async (api) => {
    installBrowserProbe({ sourceId: 'configured-source' })
    assert.notEqual(api.getMessageModel, original)
    await new Promise((resolve) => {
      createProbeLifecycle({
        timeoutMs: 5,
        restore: async () => {
          evaluateInBrowser(restoreBrowserProbe)
          events.push(api.getMessageModel === original ? 'restore' : 'restore_failed')
        },
        onComplete: async (report) => {
          events.push(report.status)
          resolve()
        }
      })
    })
  })

  assert.deepEqual(events, ['restore', 'timeout'])
})