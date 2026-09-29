import assert from 'node:assert/strict'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import {
  SHAPE_SCAN_LIMIT,
  readCachedChatShapes,
  isShapeDiagnosticEnabled,
  resolveChatShapeScanOutcome,
  sanitizeChatShapeReport,
  scanCachedChatShapes
} from '../whatsappGroupCacheShapeDiagnosticCore.js'

const runBrowserScan = (models) => JSON.parse(JSON.stringify(runInNewContext(
  `(${readCachedChatShapes.toString()})()`,
  { window: { require: () => ({ Chat: { getModelsArray: () => models } }) } }
)))
const runBrowserApi = (context) => JSON.parse(JSON.stringify(runInNewContext(
  `(${readCachedChatShapes.toString()})()`,
  context
)))

test('classifies verified internal and public group model shapes without returning IDs', () => {
  const models = [
    { id: { server: 'g.us', _serialized: '123@g.us' }, groupMetadata: { participants: [] } },
    { id: { _serialized: '456@g.us' }, groupMetadata: {} },
    { id: { server: 'g.us', _serialized: '789@g.us' }, isGroup: true },
    { id: { server: 'c.us', _serialized: '15551234567@c.us' } },
    { id: { _serialized: 'opaque-cache-id' } },
    { name: 'malformed model without id' }
  ]

  const report = runBrowserScan(models)
  assert.equal(report.groupChatCount, 3)
  assert.equal(report.personalChatCount, 1)
  assert.equal(report.unknownChatCount, 1)
  assert.equal(report.malformedChatCount, 1)
  assert.equal(JSON.stringify(report).includes('123@g.us'), false)
  assert.equal(JSON.stringify(report).includes('15551234567'), false)
  assert.equal(JSON.stringify(report).includes('opaque-cache-id'), false)
})

test('shape diagnostic requires the exact explicit enable value', () => {
  assert.equal(isShapeDiagnosticEnabled(undefined), false)
  assert.equal(isShapeDiagnosticEnabled('TRUE'), false)
  assert.equal(isShapeDiagnosticEnabled('1'), false)
  assert.equal(isShapeDiagnosticEnabled('true'), true)
})

test('browser scanner returns fixed codes for missing runtime APIs', () => {
  assert.equal(runBrowserApi({}).code, 'browser_context_unavailable')
  assert.equal(runBrowserApi({ window: {} }).code, 'module_loader_missing')
  assert.equal(runBrowserApi({ window: { require() { throw new Error('hidden') } } }).code, 'collections_module_unavailable')
  assert.equal(runBrowserApi({ window: { require: () => null } }).code, 'collections_api_missing')
  assert.equal(runBrowserApi({ window: { require: () => ({}) } }).code, 'chat_collection_missing')
  assert.equal(runBrowserApi({ window: { require: () => ({ Chat: {} }) } }).code, 'models_array_api_missing')
})

test('browser scanner distinguishes thrown cache access, invalid result and invalid length', () => {
  const chatGetterThrows = { window: { require: () => Object.defineProperty({}, 'Chat', { get() { throw new Error('hidden') } }) } }
  const methodGetterThrows = { window: { require: () => ({ Chat: Object.defineProperty({}, 'getModelsArray', { get() { throw new Error('hidden') } }) }) } }
  const methodThrows = { window: { require: () => ({ Chat: { getModelsArray() { throw new Error('hidden') } } }) } }
  const nonArray = { window: { require: () => ({ Chat: { getModelsArray: () => ({}) } }) } }
  const lengthThrows = new Proxy([], { getOwnPropertyDescriptor(_target, property) {
    if (property === 'length') throw new Error('hidden')
    return Reflect.getOwnPropertyDescriptor([], property)
  } })
  const badLength = { window: { require: () => ({ Chat: { getModelsArray: () => lengthThrows } }) } }

  assert.equal(runBrowserApi(chatGetterThrows).code, 'chat_collection_unavailable')
  assert.equal(runBrowserApi(methodGetterThrows).code, 'models_array_api_unavailable')
  assert.equal(runBrowserApi(methodThrows).code, 'models_array_call_failed')
  assert.equal(runBrowserApi(nonArray).code, 'models_not_array')
  assert.equal(runBrowserApi(badLength).code, 'cache_length_unreadable')
})

test('host result resolver distinguishes page, timeout, evaluation and malformed-report failures', () => {
  assert.deepEqual(resolveChatShapeScanOutcome({ pageAvailable: false }), { status: 'unavailable', code: 'page_unavailable' })
  assert.deepEqual(resolveChatShapeScanOutcome({ pageAvailable: true, timedOut: true }), { status: 'unavailable', code: 'scan_timeout' })
  assert.deepEqual(resolveChatShapeScanOutcome({ pageAvailable: true, evaluationSucceeded: false }), { status: 'unavailable', code: 'browser_evaluation_failed' })
  assert.deepEqual(resolveChatShapeScanOutcome({ pageAvailable: true, evaluationSucceeded: true, result: { status: 'ok' } }), { status: 'unavailable', code: 'report_invalid' })
  assert.deepEqual(resolveChatShapeScanOutcome({ pageAvailable: true, evaluationSucceeded: true, result: { status: 'unavailable', code: 'models_array_api_missing' } }), { status: 'unavailable', code: 'models_array_api_missing' })
})

test('fixed-field prototype getters are not invoked and are counted as accessors', () => {
  let getterCalled = false
  const chat = Object.create({
    get groupMetadata() { getterCalled = true; throw new Error('must not run') }
  })
  chat.id = { server: 'g.us', _serialized: '123@g.us' }
  const report = scanCachedChatShapes([chat])

  assert.equal(report.groupChatCount, 1)
  assert.equal(report.accessorFieldCount, 1)
  assert.equal(getterCalled, false)
})

test('group metadata classifies a group even when its ID is accessor-backed', () => {
  const chat = { groupMetadata: {} }
  Object.defineProperty(chat, 'id', { get() { throw new Error('ID getter must not run') } })
  const report = scanCachedChatShapes([chat])

  assert.equal(report.groupChatCount, 1)
  assert.equal(report.malformedChatCount, 0)
  assert.equal(report.accessorFieldCount, 1)
})

test('aggregate diagnostic respects the scan bound', () => {
  const models = Array.from({ length: 1005 }, () => ({ id: { server: 'c.us' } }))
  const report = scanCachedChatShapes(models)
  assert.equal(report.scannedChatCount, 1000)
  assert.equal(report.personalChatCount, 1000)
  assert.equal(report.truncated, true)
})

test('host sanitizer accepts only the fixed aggregate schema', () => {
  const valid = scanCachedChatShapes([{ id: { server: 'g.us', _serialized: '123@g.us' } }])
  const sanitized = sanitizeChatShapeReport({ ...valid, arbitraryId: '123@g.us' })
  assert.equal(sanitized.groupChatCount, 1)
  assert.equal(JSON.stringify(sanitized).includes('arbitraryId'), false)
  assert.equal(JSON.stringify(sanitized).includes('123@g.us'), false)
  assert.equal(sanitizeChatShapeReport({ status: 'ok', groupChatCount: 'one' }), null)
})

test('532 cached models can exceed the old accessor counter bound without invalidating the report', () => {
  const models = Array.from({ length: 532 }, () => {
    const id = Object.create({
      get server() { throw new Error('server accessor must not run') },
      get _serialized() { throw new Error('serialized accessor must not run') }
    })
    const model = { id }
    Object.defineProperties(model, {
      groupMetadata: { get() { throw new Error('metadata accessor must not run') } },
      isGroup: { get() { throw new Error('group accessor must not run') } }
    })
    return model
  })
  const report = scanCachedChatShapes(models)

  assert.equal(report.accessorFieldCount, 532 * 4)
  const outcome = resolveChatShapeScanOutcome({ pageAvailable: true, evaluationSucceeded: true, result: report })
  assert.equal(outcome.status, 'ok')
  assert.equal(outcome.report.accessorFieldCount, 532 * 4)

  report.accessorFieldCount = SHAPE_SCAN_LIMIT * 4 + 1
  assert.equal(sanitizeChatShapeReport(report), null)
})