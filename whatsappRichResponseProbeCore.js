export const SAFE_FIELDS = Object.freeze([
  'attributes',
  'richResponse',
  'unifiedResponse',
  'unifiedResponseRawData'
])

export const PROBE_LIMITS = Object.freeze({
  maximumDepth: 8,
  maximumVisitedNodes: 128,
  maximumArrayLength: 32,
  maximumInspectionSteps: 512,
  maximumCounter: 1_000_000,
  timeoutMs: 60_000
})

const SUMMARY_TYPES = new Set([
  'null', 'object', 'array', 'string', 'number', 'boolean',
  'undefined', 'function', 'symbol', 'bigint'
])
const SUMMARY_INTEGER_LIMITS = Object.freeze({
  visitedNodes: PROBE_LIMITS.maximumVisitedNodes,
  arrayItemsVisited: PROBE_LIMITS.maximumInspectionSteps,
  totalArrayLength: PROBE_LIMITS.maximumCounter,
  maximumDepth: PROBE_LIMITS.maximumDepth,
  urlLikeStringCount: PROBE_LIMITS.maximumVisitedNodes,
  stringCount: PROBE_LIMITS.maximumVisitedNodes,
  totalStringLength: PROBE_LIMITS.maximumCounter,
  maximumStringLength: PROBE_LIMITS.maximumCounter
})

const ownDataProperty = (value, property) => {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return null
  const descriptor = Object.getOwnPropertyDescriptor(value, property)
  if (!descriptor) return null
  if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) return { accessor: true }
  return { value: descriptor.value }
}

const sanitizeFlags = (value) => {
  const flags = {}
  for (const field of SAFE_FIELDS) {
    const property = ownDataProperty(value, field)
    if (!property || property.accessor || typeof property.value !== 'boolean') return null
    flags[field] = property.value
  }
  return flags
}

const sanitizeSummary = (value) => {
  const typeProperty = ownDataProperty(value, 'type')
  if (!typeProperty || typeProperty.accessor || !SUMMARY_TYPES.has(typeProperty.value)) return null

  const summary = { type: typeProperty.value }
  for (const [field, maximum] of Object.entries(SUMMARY_INTEGER_LIMITS)) {
    const property = ownDataProperty(value, field)
    if (!property || property.accessor || !Number.isSafeInteger(property.value) || property.value < 0 || property.value > maximum) return null
    summary[field] = property.value
  }

  for (const field of ['anyHttpUrl', 'truncated']) {
    const property = ownDataProperty(value, field)
    if (!property || property.accessor || typeof property.value !== 'boolean') return null
    summary[field] = property.value
  }

  const presenceProperty = ownDataProperty(value, 'safeFieldPresence')
  if (!presenceProperty || presenceProperty.accessor) return null
  summary.safeFieldPresence = sanitizeFlags(presenceProperty.value)
  return summary.safeFieldPresence ? summary : null
}

export const sanitizeProbeReport = (input) => {
  try {
    const statusProperty = ownDataProperty(input, 'status')
    if (!statusProperty || statusProperty.accessor) return null
    const status = statusProperty.value
    if (status === 'timeout' || status === 'probe_error' || status === 'inspection_error') return { status }
    if (status !== 'captured') return null

    const modelProperty = ownDataProperty(input, 'internalModel')
    const serializedProperty = ownDataProperty(input, 'serializedMessage')
    const presenceProperty = ownDataProperty(input, 'safeFieldPresence')
    if (!modelProperty || modelProperty.accessor || !serializedProperty || serializedProperty.accessor || !presenceProperty || presenceProperty.accessor) return null

    const internalModel = sanitizeSummary(modelProperty.value)
    const serializedMessage = sanitizeSummary(serializedProperty.value)
    const safeFieldPresence = sanitizeFlags(presenceProperty.value)
    if (!internalModel || !serializedMessage || !safeFieldPresence) return null
    return { status, internalModel, serializedMessage, safeFieldPresence }
  } catch {
    return null
  }
}

export function installBrowserProbe(configuration) {
  const safeFields = ['attributes', 'richResponse', 'unifiedResponse', 'unifiedResponseRawData']
  const restoreProperty = '__shakyaSafeRichResponseRestore'
  const callbackProperty = '__shakyaSafeRichResponseReport'
  const ownDataProperty = (value, property) => {
    if (value === null || (typeof value !== 'object' && typeof value !== 'function')) return null
    const descriptor = Object.getOwnPropertyDescriptor(value, property)
    if (!descriptor) return null
    if (!Object.prototype.hasOwnProperty.call(descriptor, 'value')) return { accessor: true }
    return { value: descriptor.value }
  }
  const api = window.WWebJS
  if (!api || (typeof api !== 'object' && typeof api !== 'function')) return false

  const previousRestore = Object.getOwnPropertyDescriptor(api, restoreProperty)
  if (previousRestore && Object.prototype.hasOwnProperty.call(previousRestore, 'value') && typeof previousRestore.value === 'function') {
    previousRestore.value()
  }

  const originalDescriptor = Object.getOwnPropertyDescriptor(api, 'getMessageModel')
  if (!originalDescriptor || !Object.prototype.hasOwnProperty.call(originalDescriptor, 'value') || typeof originalDescriptor.value !== 'function') return false
  const original = originalDescriptor.value
  const sourceId = configuration.sourceId
  let restored = false
  let reported = false
  let wrapped

  const restore = () => {
    if (restored) return true
    try {
      let current = Object.getOwnPropertyDescriptor(api, 'getMessageModel')
      if (current && Object.prototype.hasOwnProperty.call(current, 'value') && current.value === wrapped) {
        try {
          Object.defineProperty(api, 'getMessageModel', { ...current, value: original })
        } catch {
          try { api.getMessageModel = original } catch { return false }
        }
        current = Object.getOwnPropertyDescriptor(api, 'getMessageModel')
      }
      if (current && Object.prototype.hasOwnProperty.call(current, 'value') && current.value === wrapped) return false
      restored = true
      const cleanupDescriptor = Object.getOwnPropertyDescriptor(api, restoreProperty)
      if (cleanupDescriptor && Object.prototype.hasOwnProperty.call(cleanupDescriptor, 'value') && cleanupDescriptor.value === restore) {
        try { delete api[restoreProperty] } catch {}
      }
      return true
    } catch {
      return false
    }
  }

  const readOwnValue = (value, property) => {
    const descriptor = ownDataProperty(value, property)
    return descriptor && !descriptor.accessor ? descriptor.value : undefined
  }
  const readPath = (value, path) => {
    let current = value
    for (const property of path) {
      current = readOwnValue(current, property)
      if (current === undefined || current === null) return undefined
    }
    return current
  }
  const sourceValue = (value) => typeof value === 'string' ? value : readOwnValue(value, '_serialized')
  const typeOf = (value) => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value

  const summarize = (root) => {
    const activePath = new WeakSet()
    const summary = {
      type: typeOf(root),
      visitedNodes: 0,
      arrayItemsVisited: 0,
      totalArrayLength: 0,
      maximumDepth: 0,
      anyHttpUrl: false,
      urlLikeStringCount: 0,
      stringCount: 0,
      totalStringLength: 0,
      maximumStringLength: 0,
      truncated: false,
      safeFieldPresence: Object.fromEntries(safeFields.map((field) => [field, false]))
    }
    let inspectionSteps = 0

    const takeStep = () => {
      if (inspectionSteps >= 512) {
        summary.truncated = true
        return false
      }
      inspectionSteps += 1
      return true
    }
    const addBounded = (field, amount) => {
      summary[field] = Math.min(1_000_000, summary[field] + amount)
      if (summary[field] === 1_000_000) summary.truncated = true
    }
    const descriptorFor = (value, property) => {
      if (!takeStep()) return null
      return Object.getOwnPropertyDescriptor(value, property)
    }
    const visit = (value, depth) => {
      if (!takeStep()) return
      if (summary.visitedNodes >= 128) {
        summary.truncated = true
        return
      }
      summary.visitedNodes += 1
      if (depth > 8) {
        summary.truncated = true
        return
      }
      summary.maximumDepth = Math.max(summary.maximumDepth, depth)

      const valueType = typeOf(value)
      if (valueType === 'string') {
        addBounded('stringCount', 1)
        addBounded('totalStringLength', value.length)
        summary.maximumStringLength = Math.min(1_000_000, Math.max(summary.maximumStringLength, value.length))
        if (value.length > 1_000_000) summary.truncated = true
        if (/^https?:\/\/\S+/i.test(value)) {
          summary.anyHttpUrl = true
          addBounded('urlLikeStringCount', 1)
        }
        return
      }
      if (value === null || typeof value !== 'object' || activePath.has(value)) return

      activePath.add(value)
      try {
        if (Array.isArray(value)) {
          const lengthDescriptor = descriptorFor(value, 'length')
          const length = lengthDescriptor && Object.prototype.hasOwnProperty.call(lengthDescriptor, 'value') && Number.isSafeInteger(lengthDescriptor.value)
            ? Math.max(0, lengthDescriptor.value)
            : 0
          addBounded('totalArrayLength', length)
          const inspectedLength = Math.min(length, 32)
          if (length > inspectedLength) summary.truncated = true
          for (let index = 0; index < inspectedLength && !summary.truncated; index += 1) {
            const itemDescriptor = descriptorFor(value, String(index))
            summary.arrayItemsVisited += 1
            if (itemDescriptor && Object.prototype.hasOwnProperty.call(itemDescriptor, 'value')) visit(itemDescriptor.value, depth + 1)
          }
          return
        }

        for (const field of safeFields) {
          const fieldDescriptor = descriptorFor(value, field)
          if (summary.truncated) return
          if (!fieldDescriptor) continue
          summary.safeFieldPresence[field] = true
          if (Object.prototype.hasOwnProperty.call(fieldDescriptor, 'value')) visit(fieldDescriptor.value, depth + 1)
          if (summary.truncated) return
        }
      } finally {
        activePath.delete(value)
      }
    }

    visit(root, 0)
    return summary
  }

  const reportOnce = (report) => {
    if (reported) return
    reported = true
    restore()
    try {
      const callbackDescriptor = Object.getOwnPropertyDescriptor(window, callbackProperty)
      if (callbackDescriptor && Object.prototype.hasOwnProperty.call(callbackDescriptor, 'value') && typeof callbackDescriptor.value === 'function') {
        callbackDescriptor.value(report)
      }
    } catch {
      return
    }
  }

  wrapped = function (model, ...args) {
    try {
      const serialized = original.apply(this, [model, ...args])
      const messageType = readPath(serialized, ['type']) || readPath(model, ['type']) || readPath(model, ['attributes', 'type'])
      const sourceCandidates = [
        readPath(serialized, ['from']),
        readPath(model, ['attributes', 'from']),
        readPath(model, ['id', 'remote']),
        readPath(model, ['attributes', 'id', 'remote'])
      ].map(sourceValue)

      if (messageType !== 'rich_response' || !sourceCandidates.includes(sourceId) || reported) return serialized

      let report
      try {
        const internalModel = summarize(model)
        const serializedMessage = summarize(serialized)
        report = {
          status: 'captured',
          internalModel,
          serializedMessage,
          safeFieldPresence: Object.fromEntries(safeFields.map((field) => [
            field,
            internalModel.safeFieldPresence[field] || serializedMessage.safeFieldPresence[field]
          ]))
        }
      } catch {
        report = { status: 'inspection_error' }
      }
      reportOnce(report)
      return serialized
    } catch (error) {
      reportOnce({ status: 'inspection_error' })
      throw error
    }
  }

  try {
    Object.defineProperty(api, restoreProperty, { configurable: true, enumerable: false, writable: true, value: restore })
    Object.defineProperty(api, 'getMessageModel', { ...originalDescriptor, value: wrapped })
  } catch {
    restore()
    return false
  }
  return true
}

export function restoreBrowserProbe() {
  const api = window.WWebJS
  if (!api || (typeof api !== 'object' && typeof api !== 'function')) return true
  const descriptor = Object.getOwnPropertyDescriptor(api, '__shakyaSafeRichResponseRestore')
  if (descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value') && typeof descriptor.value === 'function') {
    return descriptor.value() === true
  }
  return true
}

export function createProbeLifecycle({ restore, onComplete, timeoutMs = PROBE_LIMITS.timeoutMs }) {
  let settled = false
  let restorePromise
  const boundedTimeout = Number.isSafeInteger(timeoutMs) && timeoutMs > 0
    ? Math.min(timeoutMs, PROBE_LIMITS.timeoutMs)
    : PROBE_LIMITS.timeoutMs

  const restoreOnce = () => {
    if (!restorePromise) {
      restorePromise = Promise.resolve().then(restore).catch(() => undefined)
    }
    return restorePromise
  }

  const finish = async (input) => {
    if (settled) return false
    const report = sanitizeProbeReport(input)
    if (!report) return false
    settled = true
    clearTimeout(timeout)
    await restoreOnce()
    await onComplete(report)
    return true
  }

  const timeout = setTimeout(() => { void finish({ status: 'timeout' }) }, boundedTimeout)
  return { finish, restore: restoreOnce }
}