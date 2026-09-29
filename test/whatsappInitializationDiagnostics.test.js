import assert from 'node:assert/strict'
import test from 'node:test'
import { installInitializationDiagnostics } from '../whatsappInitializationDiagnostics.js'

const createClient = (implementations = {}) => ({
  pupPage: {
    evaluate: implementations.evaluate || (() => Promise.resolve('evaluation')),
    evaluateOnNewDocument: implementations.evaluateOnNewDocument || (() => Promise.resolve('page setup')),
    goto: implementations.goto || (() => Promise.resolve('navigation'))
  },
  initWebVersionCache: implementations.initWebVersionCache || (() => Promise.resolve('cache')),
  inject: implementations.inject || (() => Promise.resolve('injection'))
})

const events = (records) => records.map(({ event }) => event)

 test('checkpoints web cache, page setup, navigation and injection without logging arguments', async () => {
  const records = []
  const client = createClient()
  const diagnostics = installInitializationDiagnostics(client, (event, details) => records.push({ event, details }))

  diagnostics.begin()
  await client.initWebVersionCache()
  await client.pupPage.evaluateOnNewDocument('sensitive-script-data')
  await client.pupPage.goto('https://sensitive.example/path?token=secret')
  await client.inject()

  assert.deepEqual(records, [
    { event: 'startup_stage_started', details: { stage: 'browser_launch_and_page_setup' } },
    { event: 'startup_stage_completed', details: { stage: 'browser_launch_and_page_setup' } },
    { event: 'startup_stage_started', details: { stage: 'web_version_cache' } },
    { event: 'startup_stage_completed', details: { stage: 'web_version_cache' } },
    { event: 'startup_stage_started', details: { stage: 'page_setup' } },
    { event: 'startup_stage_completed', details: { stage: 'page_setup' } },
    { event: 'startup_stage_started', details: { stage: 'navigation' } },
    { event: 'startup_stage_completed', details: { stage: 'navigation' } },
    { event: 'startup_stage_started', details: { stage: 'injection' } },
    { event: 'startup_stage_completed', details: { stage: 'injection' } }
  ])
  assert.equal(JSON.stringify(records).includes('sensitive'), false)
  assert.equal(JSON.stringify(records).includes('secret'), false)
  diagnostics.restore()
})

test('last started checkpoint identifies a navigation operation still pending', async () => {
  const records = []
  const client = createClient({ goto: () => new Promise(() => {}) })
  const diagnostics = installInitializationDiagnostics(client, (event, details) => records.push({ event, details }))
  diagnostics.begin()
  await client.initWebVersionCache()
  const pending = client.pupPage.goto('https://never-logged.example')
  assert.equal(diagnostics.currentStage(), 'navigation')
  assert.deepEqual(records.at(-1), {
    event: 'startup_stage_started',
    details: { stage: 'navigation' }
  })
  diagnostics.restore()
  void pending
})

test('startup launch and page setup remain one observable stage before web cache entry', () => {
  const records = []
  const client = createClient()
  const diagnostics = installInitializationDiagnostics(client, (event, details) => records.push({ event, details }))
  diagnostics.begin()

  assert.equal(diagnostics.currentStage(), 'browser_launch_and_page_setup')
  assert.deepEqual(records, [{
    event: 'startup_stage_started',
    details: { stage: 'browser_launch_and_page_setup' }
  }])
  diagnostics.restore()
})

test('injection page evaluations log fixed ordinals without logging function arguments', async () => {
  const records = []
  const client = createClient({
    inject: async function () {
      await this.pupPage.evaluate('private source contents')
      await this.pupPage.evaluate('another private source')
    }
  })
  const originalEvaluate = client.pupPage.evaluate
  const diagnostics = installInitializationDiagnostics(client, (event, details) => records.push({ event, details }))
  await client.initWebVersionCache()
  await client.inject()

  assert.deepEqual(records.filter((record) => record.event.startsWith('injection_evaluation_')), [
    { event: 'injection_evaluation_started', details: { index: 1 } },
    { event: 'injection_evaluation_completed', details: { index: 1 } },
    { event: 'injection_evaluation_started', details: { index: 2 } },
    { event: 'injection_evaluation_completed', details: { index: 2 } }
  ])
  assert.equal(JSON.stringify(records).includes('private source'), false)
  assert.equal(client.pupPage.evaluate, originalEvaluate)
  diagnostics.restore()
})

test('last injection evaluation checkpoint exposes an unresolved browser evaluation', async () => {
  const records = []
  const client = createClient({
    inject: function () { return this.pupPage.evaluate('never-log this argument') },
    evaluate: () => new Promise(() => {}),
    evaluateOnNewDocument: () => Promise.resolve(),
    goto: () => Promise.resolve()
  })
  const diagnostics = installInitializationDiagnostics(client, (event, details) => records.push({ event, details }))
  await client.initWebVersionCache()
  const pendingInjection = client.inject()

  assert.equal(diagnostics.currentStage(), 'injection')
  assert.deepEqual(records.at(-1), {
    event: 'injection_evaluation_started',
    details: { index: 1 }
  })
  diagnostics.restore()
  void pendingInjection
})

test('overlapping inject calls share one in-flight operation; later sequential injection remains allowed', async () => {
  const records = []
  let resolveInjection
  let injectCalls = 0
  const client = createClient({
    inject: () => {
      injectCalls += 1
      if (injectCalls === 1) return new Promise((resolve) => { resolveInjection = resolve })
      return Promise.resolve('later injection')
    }
  })
  const diagnostics = installInitializationDiagnostics(client, (event, details) => records.push({ event, details }))

  const first = client.inject()
  const second = client.inject()
  assert.equal(injectCalls, 1)
  assert.equal(first, second)

  resolveInjection()
  await Promise.all([first, second])
  await client.inject()
  assert.equal(injectCalls, 2)
  diagnostics.restore()
})

test('rejected injection releases the single-flight guard for a later navigation', async () => {
  const records = []
  let evaluateCalls = 0
  const failure = new Error('private evaluation failure')
  const client = createClient({
    inject: async function () {
      await this.pupPage.evaluate('sensitive evaluation argument')
    },
    evaluate: () => {
      evaluateCalls += 1
      return evaluateCalls === 1 ? Promise.reject(failure) : Promise.resolve(true)
    }
  })
  const diagnostics = installInitializationDiagnostics(client, (event, details) => records.push({ event, details }))

  const [first, overlapping] = [client.inject(), client.inject()]
  assert.equal(first, overlapping)
  await assert.rejects(first, (error) => error === failure)
  await client.inject()

  assert.equal(evaluateCalls, 2)
  assert.equal(records.filter((record) => record.event === 'startup_stage_failed' && record.details.stage === 'injection').length, 1)
  assert.equal(JSON.stringify(records).includes('private evaluation failure'), false)
  assert.equal(JSON.stringify(records).includes('sensitive evaluation argument'), false)
  diagnostics.restore()
})

test('post-ready injection rejection requests recovery and is handled for frame-navigation callbacks', async () => {
  const records = []
  let recoveryRequests = 0
  const client = createClient({ inject: () => Promise.reject(new Error('private browser error')) })
  const diagnostics = installInitializationDiagnostics(client, (event, details) => records.push({ event, details }), {
    onPostReadyInjectionFailure: () => { recoveryRequests += 1; return true }
  })
  diagnostics.markReady()

  await assert.doesNotReject(client.inject())
  assert.equal(recoveryRequests, 1)
  assert.equal(records.filter((record) => record.event === 'startup_stage_failed' && record.details.stage === 'injection').length, 1)
  assert.equal(JSON.stringify(records).includes('private browser error'), false)
  diagnostics.restore()
})

test('initial injection rejection still propagates to the startup controller', async () => {
  const failure = new Error('private startup error')
  const client = createClient({ inject: () => Promise.reject(failure) })
  const diagnostics = installInitializationDiagnostics(client, () => {}, {
    onPostReadyInjectionFailure: () => true
  })

  await assert.rejects(client.inject(), (error) => error === failure)
  diagnostics.restore()
})

test('teardown can reset a still-pending inject guard before reinitializing the same client', async () => {
  let injectCalls = 0
  const client = createClient({
    inject: () => {
      injectCalls += 1
      return new Promise(() => {})
    }
  })
  const diagnostics = installInitializationDiagnostics(client, () => {})

  void client.inject()
  void client.inject()
  assert.equal(injectCalls, 1)
  diagnostics.resetSingleFlight()
  void client.inject()
  assert.equal(injectCalls, 2)
  diagnostics.restore()
})

test('stage failures use fixed codes and preserve the original rejection', async () => {
  const records = []
  const failure = new Error('private failure detail')
  const client = createClient({ goto: () => Promise.reject(failure) })
  const diagnostics = installInitializationDiagnostics(client, (event, details) => records.push({ event, details }))
  diagnostics.begin()
  await client.initWebVersionCache()

  await assert.rejects(client.pupPage.goto('https://must-not-log.example'), (error) => error === failure)
  assert.deepEqual(records.at(-1), {
    event: 'startup_stage_failed',
    details: { stage: 'navigation', code: 'operation_rejected' }
  })
  assert.equal(JSON.stringify(records).includes('private failure detail'), false)
  diagnostics.restore()
})

test('restore is idempotent and reinstates original method references', async () => {
  const client = createClient()
  const originalCache = client.initWebVersionCache
  const originalInject = client.inject
  const diagnostics = installInitializationDiagnostics(client, () => {})
  diagnostics.restore()
  diagnostics.restore()

  assert.equal(client.initWebVersionCache, originalCache)
  assert.equal(client.inject, originalInject)
})
