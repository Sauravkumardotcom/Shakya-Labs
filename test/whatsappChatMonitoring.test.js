import assert from 'node:assert/strict'
import test from 'node:test'
import { createWhatsAppChatRepository } from '../whatsappChatRepository.js'
import { createSelectedChatMessageHandler, getDiscoverableChat } from '../whatsappChatMonitoring.js'
import { createChatDiscoveryHandler, sendChatDiscovery } from '../whatsappListenerIngestion.js'

const createRepository = () => {
  const store = { whatsappChats: [] }
  let writes = 0
  const repository = createWhatsAppChatRepository({
    readStore: () => store,
    writeStore: (next) => { Object.assign(store, next); writes += 1 }
  })
  return { repository, store, writes: () => writes }
}

test('discovery stores validated metadata only and defaults monitoring off', () => {
  const { repository, store } = createRepository()
  const discovered = repository.discover({
    chatId: '12345@g.us',
    chatType: 'personal',
    name: '  Engineering Group  ',
    message: 'must not persist'
  })

  assert.deepEqual(discovered.chat, {
    chatId: '12345@g.us',
    chatType: 'group',
    name: 'Engineering Group',
    monitoringEnabled: false,
    discoveredAt: discovered.chat.discoveredAt
  })
  assert.equal('message' in store.whatsappChats[0], false)
  assert.equal(repository.isMonitoringEnabled('12345@g.us'), false)
})

test('local discovery endpoint authenticates and persists only chat metadata', async () => {
  const { repository, store } = createRepository()
  const handler = createChatDiscoveryHandler({ secret: 'listener-secret', chatRepository: repository })
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this }
  }
  await handler({
    socket: { remoteAddress: '127.0.0.1' },
    headers: { authorization: 'Bearer listener-secret' },
    body: { chatId: '12345@g.us', name: 'Work group', rawMessage: 'must not persist', phone: 'must not persist' }
  }, response)

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.body, { monitoringEnabled: false })
  assert.deepEqual(Object.keys(store.whatsappChats[0]).sort(), ['chatId', 'chatType', 'discoveredAt', 'monitoringEnabled', 'name'].sort())
  assert.equal(JSON.stringify(store).includes('must not persist'), false)
})

test('local discovery endpoint rejects non-loopback or unauthenticated callers', async () => {
  const { repository } = createRepository()
  const handler = createChatDiscoveryHandler({ secret: 'listener-secret', chatRepository: repository })
  const makeResponse = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this }, json(body) { this.body = body; return this } })
  const remote = makeResponse()
  await handler({ socket: { remoteAddress: '192.0.2.10' }, headers: { authorization: 'Bearer listener-secret' }, body: { chatId: '123@g.us' } }, remote)
  assert.equal(remote.statusCode, 403)
  const unauthenticated = makeResponse()
  await handler({ socket: { remoteAddress: '127.0.0.1' }, headers: {}, body: { chatId: '123@g.us' } }, unauthenticated)
  assert.equal(unauthenticated.statusCode, 401)
})

test('listener discovery sends only chat ID and optional name, then reads the selection bit', async () => {
  let request
  const result = await sendChatDiscovery({
    url: 'http://127.0.0.1/internal',
    secret: 'listener-secret',
    chat: { chatId: '12345@g.us', chatType: 'group', name: 'Work', body: 'private content' },
    fetchImpl: async (_url, options) => {
      request = options
      return { ok: true, json: async () => ({ monitoringEnabled: true, message: 'ignored' }) }
    }
  })

  assert.deepEqual(result, { ok: true, monitoringEnabled: true })
  assert.deepEqual(JSON.parse(request.body), { chatId: '12345@g.us', name: 'Work' })
})

test('discovery deduplicates stable IDs and preserves admin selection', () => {
  const { repository, writes } = createRepository()
  const first = repository.discover({ chatId: '15551234567@c.us', name: 'Contact' })
  assert.equal(repository.setMonitoring(first.chat.chatId, true).chat.monitoringEnabled, true)
  const writeCount = writes()

  const repeated = repository.discover({ chatId: '15551234567@c.us', name: 'Contact' })

  assert.equal(repeated.chat.monitoringEnabled, true)
  assert.equal(repository.list().length, 1)
  assert.equal(writes(), writeCount)
})

test('selection requires a discovered safe chat and a boolean', () => {
  const { repository } = createRepository()
  assert.deepEqual(repository.setMonitoring('123@g.us', true), { error: 'chat_not_found' })
  assert.deepEqual(repository.discover({ chatId: 'bad-id' }), { error: 'invalid_chat' })
  assert.deepEqual(repository.discover({ chatId: '123@g.us' }).chat.monitoringEnabled, false)
  assert.deepEqual(repository.setMonitoring('123@g.us', 'true'), { error: 'invalid_selection' })
  assert.equal(repository.setMonitoring('123@g.us', true).chat.monitoringEnabled, true)
  assert.equal(repository.isMonitoringEnabled('123@g.us'), true)
  assert.equal(repository.setMonitoring('123@g.us', false).chat.monitoringEnabled, false)
  assert.equal(repository.isMonitoringEnabled('123@g.us'), false)
})

test('chat discovery metadata reads only fixed ID and name fields', () => {
  let bodyRead = false
  const message = { from: '15551234567@c.us', chat: { name: 'Contact label' } }
  Object.defineProperty(message, 'body', { get() { bodyRead = true; throw new Error('body must not be read') } })

  assert.deepEqual(getDiscoverableChat(message), {
    chatId: '15551234567@c.us',
    chatType: 'personal',
    name: 'Contact label'
  })
  assert.equal(bodyRead, false)
})

test('unselected or undiscoverable chats never enter message processing', async () => {
  let processed = 0
  const handler = createSelectedChatMessageHandler({
    discoverChat: async () => ({ monitoringEnabled: false }),
    processSelectedMessage: () => { processed += 1 }
  })
  let bodyRead = false
  const message = { from: '12345@g.us' }
  Object.defineProperty(message, 'body', { get() { bodyRead = true; throw new Error('body must not be read') } })

  assert.deepEqual(await handler(message), { monitored: false, reason: 'not_selected' })
  assert.equal(processed, 0)
  assert.equal(bodyRead, false)
  assert.deepEqual(await handler({ from: 'invalid' }), { monitored: false, reason: 'invalid_chat' })
  assert.equal(processed, 0)
})

test('explicitly selected chats alone enter the existing processing callback', async () => {
  const processedIds = []
  const handler = createSelectedChatMessageHandler({
    discoverChat: async ({ chatId }) => ({ monitoringEnabled: chatId === '12345@g.us' }),
    processSelectedMessage: (_message, chat) => processedIds.push(chat.chatId)
  })

  assert.deepEqual(await handler({ from: '15551234567@c.us' }), { monitored: false, reason: 'not_selected' })
  assert.deepEqual(await handler({ from: '12345@g.us' }), { monitored: true })
  assert.deepEqual(processedIds, ['12345@g.us'])
})