export const GROUP_CACHE_LIMITS = Object.freeze({
  maximumChatsScanned: 1000,
  maximumGroupIds: 200,
  maximumIdLength: 64,
  scanTimeoutMs: 5_000
})

const GROUP_ID_PATTERN = /^\d+@g\.us$/

const ownDataValue = (value, property) => {
  if (value === null || typeof value !== 'object') return undefined
  const descriptor = Object.getOwnPropertyDescriptor(value, property)
  return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
    ? descriptor.value
    : undefined
}

export function readCachedGroupIds() {
  const groupIdPattern = /^\d+@g\.us$/
  const ownDataValue = (value, property) => {
    if (value === null || typeof value !== 'object') return undefined
    const descriptor = Object.getOwnPropertyDescriptor(value, property)
    return descriptor && Object.prototype.hasOwnProperty.call(descriptor, 'value')
      ? descriptor.value
      : undefined
  }
  const chatCollection = window.require('WAWebCollections').Chat
  const chats = chatCollection.getModelsArray()
  if (!Array.isArray(chats)) return { status: 'unavailable' }

  const lengthValue = ownDataValue(chats, 'length')
  if (!Number.isSafeInteger(lengthValue) || lengthValue < 0) return { status: 'unavailable' }

  const groupIds = []
  const seen = new Set()
  const scanCount = Math.min(lengthValue, 1000)
  let chatsScanned = 0
  let truncated = lengthValue > scanCount

  for (let index = 0; index < scanCount && groupIds.length < 200; index += 1) {
    const chat = ownDataValue(chats, String(index))
    chatsScanned += 1
    const id = ownDataValue(chat, 'id')
    if (ownDataValue(id, 'server') !== 'g.us') continue

    const serialized = ownDataValue(id, '_serialized')
    if (typeof serialized !== 'string' || serialized.length > 64 || !groupIdPattern.test(serialized) || seen.has(serialized)) continue
    seen.add(serialized)
    groupIds.push(serialized)
  }

  if (groupIds.length === 200 && chatsScanned < lengthValue) truncated = true
  return { status: 'ok', groupIds, chatsScanned, truncated }
}

export function sanitizeCacheScanResult(input) {
  const status = ownDataValue(input, 'status')
  if (status === 'unavailable') return { status }
  if (status !== 'ok') return null

  const sourceIds = ownDataValue(input, 'groupIds')
  const chatsScanned = ownDataValue(input, 'chatsScanned')
  const truncated = ownDataValue(input, 'truncated')
  if (!Array.isArray(sourceIds) || !Number.isSafeInteger(chatsScanned) || chatsScanned < 0 || chatsScanned > GROUP_CACHE_LIMITS.maximumChatsScanned || typeof truncated !== 'boolean') return null
  const sourceLength = ownDataValue(sourceIds, 'length')
  if (!Number.isSafeInteger(sourceLength) || sourceLength < 0) return null

  const groupIds = []
  const seen = new Set()
  const count = Math.min(sourceLength, GROUP_CACHE_LIMITS.maximumGroupIds)
  for (let index = 0; index < count; index += 1) {
    const id = ownDataValue(sourceIds, String(index))
    if (typeof id === 'string' && id.length <= GROUP_CACHE_LIMITS.maximumIdLength && GROUP_ID_PATTERN.test(id) && !seen.has(id)) {
      seen.add(id)
      groupIds.push(id)
    }
  }

  return { status, groupIds, chatsScanned, truncated: truncated || sourceLength > count }
}