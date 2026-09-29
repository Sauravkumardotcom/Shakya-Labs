import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import {
  GROUP_CACHE_LIMITS,
  readCachedGroupIds,
  sanitizeCacheScanResult
} from '../whatsappGroupCacheDiagnosticCore.js'

const runBrowserScan = (chats) => JSON.parse(JSON.stringify(runInNewContext(
  `(${readCachedGroupIds.toString()})()`,
  { window: { require: () => ({ Chat: { getModelsArray: () => chats } }) } }
)))

test('reads only cached group IDs without touching personal chat identifiers', () => {
  let personalIdRead = false
  const chats = [
    { id: { server: 'g.us', _serialized: '12345@g.us' }, body: 'not inspected' },
    { id: { server: 'g.us', _serialized: '12345@g.us' } },
    { id: { server: 'c.us', get _serialized() { personalIdRead = true; throw new Error('must not read') } } }
  ]

  assert.deepEqual(runBrowserScan(chats), {
    status: 'ok',
    groupIds: ['12345@g.us'],
    chatsScanned: 3,
    truncated: false
  })
  assert.equal(personalIdRead, false)
})


test('skips accessors and malformed group identifiers', () => {
  let accessorRead = false
  const chats = [
    { get id() { accessorRead = true; return { server: 'g.us', _serialized: '456@g.us' } } },
    { id: { server: 'g.us', get _serialized() { accessorRead = true; return '789@g.us' } } },
    { id: { server: 'g.us', _serialized: 'not-a-group-id' } }
  ]

  assert.deepEqual(runBrowserScan(chats), {
    status: 'ok',
    groupIds: [],
    chatsScanned: 3,
    truncated: false
  })
  assert.equal(accessorRead, false)
})

test('limits cache traversal and returned group IDs', () => {
  const chats = Array.from({ length: GROUP_CACHE_LIMITS.maximumChatsScanned + 10 }, (_, index) => ({
    id: { server: 'g.us', _serialized: `${index + 1}@g.us` }
  }))
  const result = runBrowserScan(chats)

  assert.equal(result.chatsScanned, GROUP_CACHE_LIMITS.maximumGroupIds)
  assert.equal(result.groupIds.length, GROUP_CACHE_LIMITS.maximumGroupIds)
  assert.equal(result.truncated, true)
})

test('stops scanning after the configured chat limit', () => {
  const chats = Array.from({ length: GROUP_CACHE_LIMITS.maximumChatsScanned + 5 }, () => ({
    id: { server: 'c.us', get _serialized() { throw new Error('personal ID must not be read') } }
  }))
  const result = runBrowserScan(chats)

  assert.equal(result.chatsScanned, GROUP_CACHE_LIMITS.maximumChatsScanned)
  assert.deepEqual(result.groupIds, [])
  assert.equal(result.truncated, true)
})

test('host sanitizer accepts only bounded group IDs and fixed metadata', () => {
  assert.deepEqual(sanitizeCacheScanResult({
    status: 'ok',
    groupIds: ['123@g.us', '15551234567@c.us', 'private content', '123@g.us'],
    chatsScanned: 4,
    truncated: false,
    messageText: 'ignored'
  }), {
    status: 'ok',
    groupIds: ['123@g.us'],
    chatsScanned: 4,
    truncated: false
  })
  assert.equal(sanitizeCacheScanResult({ status: 'ok', groupIds: ['1@g.us'], chatsScanned: 1001, truncated: false }), null)
})