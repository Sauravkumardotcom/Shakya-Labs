import assert from 'node:assert/strict'
import test from 'node:test'
import { createWhatsAppReconnectController } from '../whatsappReconnectController.js'

const createFakeTimers = () => {
  const timers = []
  return {
    timers,
    setTimeoutFn(callback, delay) {
      const timer = { callback, delay, cleared: false }
      timers.push(timer)
      return timer
    },
    clearTimeoutFn(timer) { if (timer) timer.cleared = true },
    async runNext() {
      const timer = timers.shift()
      assert.ok(timer)
      if (!timer.cleared) timer.callback()
      await new Promise((resolve) => setImmediate(resolve))
    }
  }
}

test('coalesces reconnect requests while initialization is running', async () => {
  const timers = createFakeTimers()
  let resolveInitialization
  let initializeCalls = 0
  const controller = createWhatsAppReconnectController({
    initialize: () => {
      initializeCalls += 1
      return new Promise((resolve) => { resolveInitialization = resolve })
    },
    beforeRetry: async () => true,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn
  })

  const initial = controller.start()
  controller.requestReconnect()
  controller.requestReconnect()
  assert.equal(initializeCalls, 1)
  resolveInitialization()
  await initial
  assert.equal(timers.timers.length, 1)

  await timers.runNext()
  assert.equal(initializeCalls, 2)
  controller.stop()
})

test('uses bounded exponential backoff and stops at the retry limit', async () => {
  const timers = createFakeTimers()
  const delays = []
  let initializeCalls = 0
  let exhausted = 0
  const controller = createWhatsAppReconnectController({
    initialize: async () => {
      initializeCalls += 1
      throw new Error('private failure')
    },
    beforeRetry: async () => true,
    baseDelayMs: 10,
    maxDelayMs: 25,
    maxRetries: 3,
    onRetryScheduled: ({ delayMs }) => delays.push(delayMs),
    onRetriesExhausted: () => { exhausted += 1 },
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn
  })

  await controller.start()
  while (timers.timers.length) await timers.runNext()

  assert.equal(initializeCalls, 4)
  assert.deepEqual(delays, [10, 20, 25])
  assert.equal(exhausted, 1)
  assert.equal(controller.state().retryPending, false)
})

test('requires successful old-client cleanup before retrying', async () => {
  const timers = createFakeTimers()
  let initializeCalls = 0
  let cleanupFailure = 0
  const controller = createWhatsAppReconnectController({
    initialize: async () => { initializeCalls += 1; throw new Error('failure') },
    beforeRetry: async () => false,
    onRetryCleanupFailed: () => { cleanupFailure += 1 },
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn
  })

  await controller.start()
  await timers.runNext()
  assert.equal(initializeCalls, 1)
  assert.equal(cleanupFailure, 1)
  assert.equal(controller.state().retryPending, false)
})

test('ready and stop cancel pending retries and prevent additional initialization', async () => {
  const timers = createFakeTimers()
  let initializeCalls = 0
  const controller = createWhatsAppReconnectController({
    initialize: async () => { initializeCalls += 1; throw new Error('failure') },
    beforeRetry: async () => true,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn
  })

  await controller.start()
  controller.markReady()
  assert.equal(timers.timers[0].cleared, true)
  await timers.runNext()
  assert.equal(initializeCalls, 1)

  controller.stop()
  assert.equal(controller.requestReconnect(), false)
  assert.equal(initializeCalls, 1)
})

test('a disconnect after ready starts a bounded retry cycle', async () => {
  const timers = createFakeTimers()
  let initializeCalls = 0
  const controller = createWhatsAppReconnectController({
    initialize: async () => { initializeCalls += 1 },
    beforeRetry: async () => true,
    setTimeoutFn: timers.setTimeoutFn,
    clearTimeoutFn: timers.clearTimeoutFn
  })

  await controller.start()
  controller.markReady()
  assert.equal(controller.requestReconnect(), true)
  assert.equal(timers.timers.length, 1)
  await timers.runNext()
  assert.equal(initializeCalls, 2)
  assert.equal(controller.state().retryCount, 1)
  controller.stop()
})
