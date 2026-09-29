export const SHAPE_SCAN_LIMIT = 1000
export const isShapeDiagnosticEnabled = (value) => value === 'true'

const COUNT_FIELDS = Object.freeze([
  'scannedChatCount',
  'groupChatCount',
  'personalChatCount',
  'unknownChatCount',
  'malformedChatCount',
  'groupMetadataFieldCount',
  'idServerFieldCount',
  'serializedIdStringCount',
  'serializedGroupSuffixCount',
  'serializedPersonalSuffixCount',
  'isGroupBooleanCount',
  'accessorFieldCount'
])

export function scanCachedChatShapes(models) {
  return readCachedChatShapes(models)
}

export function readCachedChatShapes(models) {
  const scanLimit = 1000
  const countFields = [
    'scannedChatCount', 'groupChatCount', 'personalChatCount', 'unknownChatCount',
    'malformedChatCount', 'groupMetadataFieldCount', 'idServerFieldCount',
    'serializedIdStringCount', 'serializedGroupSuffixCount', 'serializedPersonalSuffixCount',
    'isGroupBooleanCount', 'accessorFieldCount'
  ]
  const readFixedField = (target, field) => {
    let current = target
    for (let level = 0; current && level < 5; level += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(current, field)
      if (descriptor) {
        return Object.prototype.hasOwnProperty.call(descriptor, 'value')
          ? { kind: 'data', value: descriptor.value }
          : { kind: 'accessor' }
      }
      current = Object.getPrototypeOf(current)
    }
    return { kind: 'missing' }
  }
  const unavailable = (code) => ({ status: 'unavailable', code })
  let modelsToScan = models
  if (modelsToScan === undefined) {
    if (typeof window === 'undefined') return unavailable('browser_context_unavailable')
    if (typeof window.require !== 'function') return unavailable('module_loader_missing')

    let collections
    try {
      collections = window.require('WAWebCollections')
    } catch {
      return unavailable('collections_module_unavailable')
    }
    if (!collections || typeof collections !== 'object') return unavailable('collections_api_missing')

    let chatCollection
    try {
      chatCollection = collections.Chat
    } catch {
      return unavailable('chat_collection_unavailable')
    }
    if (!chatCollection || typeof chatCollection !== 'object') return unavailable('chat_collection_missing')

    let getModelsArray
    try {
      getModelsArray = chatCollection.getModelsArray
    } catch {
      return unavailable('models_array_api_unavailable')
    }
    if (typeof getModelsArray !== 'function') return unavailable('models_array_api_missing')
    try {
      modelsToScan = getModelsArray.call(chatCollection)
    } catch {
      return unavailable('models_array_call_failed')
    }
  }

  const counts = Object.fromEntries(countFields.map((field) => [field, 0]))
  if (!Array.isArray(modelsToScan)) return unavailable('models_not_array')

  let lengthDescriptor
  try {
    lengthDescriptor = Object.getOwnPropertyDescriptor(modelsToScan, 'length')
  } catch {
    return unavailable('cache_length_unreadable')
  }
  const length = lengthDescriptor && Object.prototype.hasOwnProperty.call(lengthDescriptor, 'value')
    ? lengthDescriptor.value
    : undefined
  if (!Number.isSafeInteger(length) || length < 0) return unavailable('cache_length_invalid')

  const scanCount = Math.min(length, scanLimit)
  for (let index = 0; index < scanCount; index += 1) {
    counts.scannedChatCount += 1
    try {
      const modelDescriptor = Object.getOwnPropertyDescriptor(modelsToScan, String(index))
      const model = modelDescriptor && Object.prototype.hasOwnProperty.call(modelDescriptor, 'value')
        ? modelDescriptor.value
        : undefined
      if (!model || typeof model !== 'object' || Array.isArray(model)) {
        counts.malformedChatCount += 1
        continue
      }

      const idField = readFixedField(model, 'id')
      const metadataField = readFixedField(model, 'groupMetadata')
      const groupFlag = readFixedField(model, 'isGroup')
      if (idField.kind === 'accessor') counts.accessorFieldCount += 1
      if (metadataField.kind === 'accessor') counts.accessorFieldCount += 1
      if (groupFlag.kind === 'accessor') counts.accessorFieldCount += 1
      if (metadataField.kind !== 'missing') counts.groupMetadataFieldCount += 1
      if (groupFlag.kind === 'data' && typeof groupFlag.value === 'boolean') counts.isGroupBooleanCount += 1

      const metadataIndicatesGroup = metadataField.kind === 'data' && Boolean(metadataField.value)
      const flagIndicatesGroup = groupFlag.kind === 'data' && groupFlag.value === true
      if (idField.kind !== 'data' || !idField.value || typeof idField.value !== 'object') {
        if (metadataIndicatesGroup || flagIndicatesGroup) counts.groupChatCount += 1
        else counts.malformedChatCount += 1
        continue
      }

      const server = readFixedField(idField.value, 'server')
      const serialized = readFixedField(idField.value, '_serialized')
      if (server.kind === 'accessor') counts.accessorFieldCount += 1
      if (serialized.kind === 'accessor') counts.accessorFieldCount += 1
      if (server.kind === 'data' && typeof server.value === 'string') counts.idServerFieldCount += 1

      const serializedValue = serialized.kind === 'data' ? serialized.value : undefined
      const hasSerializedId = typeof serializedValue === 'string'
      if (hasSerializedId) {
        counts.serializedIdStringCount += 1
        if (serializedValue.endsWith('@g.us')) counts.serializedGroupSuffixCount += 1
        if (serializedValue.endsWith('@c.us')) counts.serializedPersonalSuffixCount += 1
      }

      const isGroup = flagIndicatesGroup || metadataIndicatesGroup ||
        (server.kind === 'data' && server.value === 'g.us') ||
        (hasSerializedId && serializedValue.endsWith('@g.us'))
      const isPersonal = (server.kind === 'data' && server.value === 'c.us') ||
        (hasSerializedId && serializedValue.endsWith('@c.us'))

      if (isGroup) counts.groupChatCount += 1
      else if (isPersonal) counts.personalChatCount += 1
      else counts.unknownChatCount += 1
    } catch {
      counts.malformedChatCount += 1
    }
  }

  return { status: 'ok', ...counts, truncated: length > scanCount }
}

export function sanitizeChatShapeReport(input) {
  try {
    const statusDescriptor = Object.getOwnPropertyDescriptor(input, 'status')
    const status = statusDescriptor && Object.prototype.hasOwnProperty.call(statusDescriptor, 'value')
      ? statusDescriptor.value
      : undefined
    if (status === 'unavailable') {
      const codeDescriptor = Object.getOwnPropertyDescriptor(input, 'code')
      const code = codeDescriptor && Object.prototype.hasOwnProperty.call(codeDescriptor, 'value')
        ? codeDescriptor.value
        : undefined
      const allowedCodes = [
        'browser_context_unavailable', 'module_loader_missing', 'collections_module_unavailable',
        'collections_api_missing', 'chat_collection_unavailable', 'chat_collection_missing',
        'models_array_api_unavailable', 'models_array_api_missing', 'models_array_call_failed',
        'models_not_array', 'cache_length_unreadable', 'cache_length_invalid'
      ]
      return allowedCodes.includes(code) ? { status, code } : null
    }
    if (status !== 'ok') return null

    const report = { status }
    for (const field of COUNT_FIELDS) {
      const descriptor = Object.getOwnPropertyDescriptor(input, field)
      const value = descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
        ? descriptor.value
        : undefined
      const maximum = field === 'accessorFieldCount' ? SHAPE_SCAN_LIMIT * 4 : SHAPE_SCAN_LIMIT
      if (!Number.isSafeInteger(value) || value < 0 || value > maximum) return null
      report[field] = value
    }
    const truncatedDescriptor = Object.getOwnPropertyDescriptor(input, 'truncated')
    const truncated = truncatedDescriptor && Object.prototype.hasOwnProperty.call(truncatedDescriptor, 'value')
      ? truncatedDescriptor.value
      : undefined
    if (typeof truncated !== 'boolean') return null
    report.truncated = truncated
    return report
  } catch {
    return null
  }
}

export function resolveChatShapeScanOutcome({ pageAvailable, timedOut, evaluationSucceeded, result }) {
  if (!pageAvailable) return { status: 'unavailable', code: 'page_unavailable' }
  if (timedOut) return { status: 'unavailable', code: 'scan_timeout' }
  if (!evaluationSucceeded) return { status: 'unavailable', code: 'browser_evaluation_failed' }

  const report = sanitizeChatShapeReport(result)
  if (!report) return { status: 'unavailable', code: 'report_invalid' }
  if (report.status === 'unavailable') return report
  return { status: 'ok', report }
}