export function createWhatsAppReconnectController({
  initialize,
  beforeRetry = async () => true,
  onInitializationFailure = () => {},
  onRetryScheduled = () => {},
  onRetryCleanupFailed = () => {},
  onRetriesExhausted = () => {},
  baseDelayMs = 10_000,
  maxDelayMs = 30_000,
  maxRetries = 3,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout
}) {
  let stopped = false
  let ready = false
  let retryRequested = false
  let retryCount = 0
  let retryTimer
  let initializationPromise

  const scheduleRetry = () => {
    if (stopped || ready || retryTimer || initializationPromise) return
    retryRequested = false
    if (retryCount >= maxRetries) {
      onRetriesExhausted()
      return
    }

    retryCount += 1
    const delayMs = Math.min(baseDelayMs * (2 ** (retryCount - 1)), maxDelayMs)
    onRetryScheduled({ attempt: retryCount, delayMs })
    retryTimer = setTimeoutFn(() => {
      retryTimer = undefined
      void runInitialize('retry')
    }, delayMs)
  }

  const runInitialize = (phase) => {
    if (stopped || ready) return Promise.resolve(false)
    if (initializationPromise) return initializationPromise

    initializationPromise = (async () => {
      try {
        if (phase === 'retry') {
          let canRetry = false
          try { canRetry = await beforeRetry() === true } catch {}
          if (!canRetry) {
            onRetryCleanupFailed()
            onRetriesExhausted()
            return false
          }
        }
        await initialize()
        return true
      } catch {
        onInitializationFailure(phase)
        retryRequested = true
        return false
      }
    })().finally(() => {
      initializationPromise = undefined
      if (retryRequested && !stopped && !ready) scheduleRetry()
    })
    return initializationPromise
  }

  return {
    start() {
      return runInitialize('initial')
    },
    requestReconnect() {
      if (stopped) return false
      ready = false
      retryRequested = true
      scheduleRetry()
      return true
    },
    markReady() {
      if (stopped) return
      ready = true
      retryRequested = false
      retryCount = 0
      if (retryTimer) clearTimeoutFn(retryTimer)
      retryTimer = undefined
    },
    stop() {
      if (stopped) return
      stopped = true
      retryRequested = false
      if (retryTimer) clearTimeoutFn(retryTimer)
      retryTimer = undefined
    },
    state() {
      return {
        ready,
        stopped,
        retryCount,
        retryPending: Boolean(retryTimer),
        initializing: Boolean(initializationPromise)
      }
    }
  }
}
