const STAGES = Object.freeze([
  'browser_launch_and_page_setup',
  'web_version_cache',
  'page_setup',
  'navigation',
  'injection'
])

export function installInitializationDiagnostics(client, log, { onPostReadyInjectionFailure = () => false } = {}) {
  const restorers = []
  const singleFlightResetters = []
  const instrumentedPages = new WeakSet()
  let currentStage = STAGES[0]
  let started = false
  let restored = false

  const record = (event, stage, code) => {
    if (code) log(event, { stage, code })
    else log(event, { stage })
  }

  const wrapStage = (target, property, stage, beforeStart, afterSuccess, afterFailure, coalesceInFlight = false) => {
    if (!target || typeof target[property] !== 'function') {
      record('startup_instrumentation_unavailable', stage, 'stage_hook_missing')
      return false
    }

    const originalDescriptor = Object.getOwnPropertyDescriptor(target, property)
    const original = target[property]
    const hadOwnProperty = Boolean(originalDescriptor)
    let inFlight
    const wrapped = function (...args) {
      if (coalesceInFlight && inFlight) return inFlight
      currentStage = stage
      if (beforeStart) beforeStart()
      record('startup_stage_started', stage)
      let result
      try {
        result = original.apply(this, args)
      } catch (error) {
        record('startup_stage_failed', stage, 'operation_rejected')
        let recovered = false
        try { recovered = afterFailure?.() === true } catch {}
        if (recovered) return undefined
        throw error
      }
      const operation = Promise.resolve(result).then((value) => {
        record('startup_stage_completed', stage)
        if (afterSuccess) afterSuccess()
        return value
      }, (error) => {
        record('startup_stage_failed', stage, 'operation_rejected')
        let recovered = false
        try { recovered = afterFailure?.() === true } catch {}
        if (recovered) return undefined
        throw error
      })
      if (!coalesceInFlight) return operation

      const trackedOperation = operation.finally(() => {
        if (inFlight === trackedOperation) inFlight = undefined
      })
      inFlight = trackedOperation
      return trackedOperation
    }

    try {
      target[property] = wrapped
      if (target[property] !== wrapped) throw new Error('stage hook assignment failed')
    } catch {
      record('startup_instrumentation_unavailable', stage, 'stage_hook_install_failed')
      return false
    }

    restorers.push(() => {
      if (target[property] !== wrapped) return
      if (hadOwnProperty) Object.defineProperty(target, property, originalDescriptor)
      else delete target[property]
    })
    if (coalesceInFlight) singleFlightResetters.push(() => { inFlight = undefined })
    return true
  }

  const instrumentPage = (page) => {
    if (!page || instrumentedPages.has(page)) return
    instrumentedPages.add(page)
    wrapStage(page, 'evaluateOnNewDocument', 'page_setup')
    wrapStage(page, 'goto', 'navigation')
  }

  const instrumentInjectionEvaluations = () => {
    const page = client.pupPage
    if (!page || typeof page.evaluate !== 'function') {
      record('startup_instrumentation_unavailable', 'injection', 'page_evaluate_hook_missing')
      return () => {}
    }

    const property = 'evaluate'
    const originalDescriptor = Object.getOwnPropertyDescriptor(page, property)
    const original = page[property]
    const hadOwnProperty = Boolean(originalDescriptor)
    let evaluationIndex = 0
    let evaluateRestored = false
    const wrapped = function (...args) {
      evaluationIndex += 1
      const index = evaluationIndex
      log('injection_evaluation_started', { index })
      let result
      try {
        result = original.apply(this, args)
      } catch (error) {
        log('injection_evaluation_failed', { index, code: 'operation_rejected' })
        throw error
      }
      return Promise.resolve(result).then((value) => {
        log('injection_evaluation_completed', { index })
        return value
      }, (error) => {
        log('injection_evaluation_failed', { index, code: 'operation_rejected' })
        throw error
      })
    }
    try {
      page[property] = wrapped
      if (page[property] !== wrapped) throw new Error('page evaluate hook assignment failed')
    } catch {
      record('startup_instrumentation_unavailable', 'injection', 'page_evaluate_hook_install_failed')
      return () => {}
    }

    const restoreEvaluate = () => {
      if (evaluateRestored) return
      evaluateRestored = true
      if (page[property] !== wrapped) return
      if (hadOwnProperty) Object.defineProperty(page, property, originalDescriptor)
      else delete page[property]
    }
    restorers.push(restoreEvaluate)
    return restoreEvaluate
  }

  wrapStage(client, 'initWebVersionCache', 'web_version_cache', () => {
    record('startup_stage_completed', STAGES[0])
    instrumentPage(client.pupPage)
  })
  let restoreInjectionEvaluations = () => {}
  let listenerReady = false
  const restoreInjectionEvaluationsOnce = () => restoreInjectionEvaluations()
  wrapStage(
    client,
    'inject',
    'injection',
    () => { restoreInjectionEvaluations = instrumentInjectionEvaluations() },
    restoreInjectionEvaluationsOnce,
    () => {
      restoreInjectionEvaluationsOnce()
      if (!listenerReady) return false
      onPostReadyInjectionFailure()
      return true
    },
    true
  )

  return {
    begin() {
      if (started || restored) return
      started = true
      record('startup_stage_started', STAGES[0])
    },
    currentStage() {
      return currentStage
    },
    markReady() {
      listenerReady = true
    },
    resetSingleFlight() {
      for (const reset of singleFlightResetters) reset()
    },
    restore() {
      if (restored) return
      restored = true
      for (const restore of restorers.reverse()) {
        try { restore() } catch {}
      }
    }
  }
}