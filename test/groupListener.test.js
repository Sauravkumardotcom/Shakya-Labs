import assert from 'node:assert/strict'
import test from 'node:test'
import { extractHttpUrls, extractMessageLinks, extractRichResponseText, getMessageGroupContext, getDiscoverableGroupId, getDiscoverablePersonalChatId, createDiscoveryMessageHandler, createListenerLifecycleLoggers, createDiscoveryLogger, selectDiscoveryMode, isAllowedGroup, isAllowedSourceChat, isAllowedSourceContext, isSafeChatId, normalizeGroupId } from '../whatsappGroupListenerUtils.js'

const sampleMessage = `HP Technical Internship

📅 Experience: College Student / Internship
⏰ Schedule: Full Time
🆔 Requisition ID: 3169164

Apply Link: https://jobcode.in/hp-technical-internship-college-intern/`

test('extracts the HTTP URL from a WhatsApp job message', () => {
  assert.deepEqual(extractHttpUrls(sampleMessage), ['https://jobcode.in/hp-technical-internship-college-intern/'])
})

test('extracts unique HTTP and HTTPS URLs without trailing punctuation', () => {
  assert.deepEqual(extractHttpUrls('See https://example.com/job, https://example.com/job and http://example.org/apply.'), [
    'https://example.com/job',
    'http://example.org/apply'
  ])

  test('extracts an HTTPS URL surrounded by normal text', () => {
    assert.deepEqual(extractHttpUrls('Apply here: https://example.com/jobs/123 for details.'), ['https://example.com/jobs/123'])
  })

  test('extracts an HTTP URL at the end of a message', () => {
    assert.deepEqual(extractHttpUrls('Details: http://example.com/job'), ['http://example.com/job'])
  })

  test('removes trailing punctuation from a URL', () => {
    assert.deepEqual(extractHttpUrls('Apply now (https://example.com/job).'), ['https://example.com/job'])
  })
})

test('returns no URL when a message has no HTTP link', () => {
  assert.deepEqual(extractHttpUrls('Job title only with no application link'), [])
})

test('extracts valid HTTP and HTTPS links from whatsapp-web.js message.links', () => {
  assert.deepEqual(extractMessageLinks({ links: [
    { link: 'https://example.com/job', isSuspicious: false },
    { link: 'http://example.org/apply', isSuspicious: false }
  ] }), [
    { url: 'https://example.com/job', isSuspicious: false },
    { url: 'http://example.org/apply', isSuspicious: false }
  ])
})

test('extracts multiple message links and preserves suspicious metadata', () => {
  assert.deepEqual(extractMessageLinks({ links: [
    { link: 'https://example.com/job', isSuspicious: false },
    { link: 'https://example.org/apply', isSuspicious: true },
    { link: 'https://example.com/job', isSuspicious: false }
  ] }), [
    { url: 'https://example.com/job', isSuspicious: false },
    { url: 'https://example.org/apply', isSuspicious: true }
  ])
})

test('uses message.links when body is empty and rejects malformed or non-HTTP links', () => {
  assert.deepEqual(extractMessageLinks({ body: '', links: [
    { link: 'https://example.com/job', isSuspicious: false },
    { link: 'javascript:alert(1)', isSuspicious: false },
    { link: 'not a url', isSuspicious: false },
    { link: 42, isSuspicious: false },
    null
  ] }), [{ url: 'https://example.com/job', isSuspicious: false }])
})

test('falls back to body extraction only when message.links is unavailable', () => {
  assert.deepEqual(extractMessageLinks({ body: 'Apply: https://example.com/job.' }), [
    { url: 'https://example.com/job', isSuspicious: false }
  ])
  assert.deepEqual(extractMessageLinks({ body: 'https://example.com/job', links: [{ link: 'https://example.org/other', isSuspicious: true }] }), [
    { url: 'https://example.org/other', isSuspicious: true }
  ])
})

test('extracts text from one verified rich_response fragment', () => {
  assert.equal(extractRichResponseText({ rawData: { richResponse: { fragments: [{ type: 'text', text: 'Apply: https://example.com/job' }] } } }), 'Apply: https://example.com/job')
})

test('concatenates verified rich_response text fragments in order', () => {
  assert.equal(extractRichResponseText({ rawData: { richResponse: { fragments: [
    { type: 'text', text: 'Apply at ' },
    { type: 'text', text: 'https://example.com/job' }
  ] } } }), 'Apply at https://example.com/job')
})

test('returns empty rich_response text for missing response or fragments', () => {
  assert.equal(extractRichResponseText({}), '')
  assert.equal(extractRichResponseText({ rawData: {} }), '')
  assert.equal(extractRichResponseText({ rawData: { richResponse: {} } }), '')
  assert.equal(extractRichResponseText({ rawData: { richResponse: { fragments: 'text' } } }), '')
})

test('ignores rich_response fragments without string text', () => {
  assert.equal(extractRichResponseText({ rawData: { richResponse: { fragments: [
    { type: 'text' },
    { type: 'text', text: 42 },
    null,
    { type: 'text', text: 'https://example.com/job' }
  ] } } }), 'https://example.com/job')
})

test('extracts URLs from rich_response text when message.body is empty', () => {
  assert.deepEqual(extractMessageLinks({
    type: 'rich_response',
    body: '',
    links: [],
    rawData: { richResponse: { fragments: [{ type: 'text', text: 'Apply: https://example.com/job' }] } }
  }), [{ url: 'https://example.com/job', isSuspicious: false }])
})

test('normal message body remains the URL fallback and existing link metadata remains supported', () => {
  assert.deepEqual(extractMessageLinks({ type: 'chat', body: 'https://example.com/body' }), [
    { url: 'https://example.com/body', isSuspicious: false }
  ])
  assert.deepEqual(extractMessageLinks({ type: 'rich_response', body: '', links: [{ link: 'https://example.com/link', isSuspicious: true }] }), [
    { url: 'https://example.com/link', isSuspicious: true }
  ])
})

test('allows only the configured source group', () => {
  assert.equal(normalizeGroupId(' 12345@g.us '), '12345@g.us')
  assert.equal(isAllowedGroup('12345@g.us', '12345@g.us'), true)
  assert.equal(isAllowedGroup('other@g.us', '12345@g.us'), false)
  assert.equal(isAllowedGroup('12345@g.us', ''), false)
  assert.equal(isAllowedGroup('', '12345@g.us'), false)
})

test('allows configured private and group source chats while rejecting wrong types or malformed IDs', () => {
  assert.equal(isSafeChatId('13135550002@c.us'), true)
  assert.equal(isSafeChatId('12345@g.us'), true)
  assert.equal(isSafeChatId('not-a-chat-id'), false)
  assert.equal(isAllowedSourceChat('13135550002@c.us', '13135550002@c.us'), true)
  assert.equal(isAllowedSourceChat('12345@g.us', '12345@g.us'), true)
  assert.equal(isAllowedSourceChat('other@c.us', '13135550002@c.us'), false)
  assert.equal(isAllowedSourceChat('12345@g.us', '13135550002@c.us'), false)
  assert.equal(isAllowedSourceChat('13135550002@c.us', 'malformed'), false)
})

test('configured private and group source contexts are accepted generically', () => {
  const privateContext = getMessageGroupContext({ from: '13135550002@c.us' })
  const groupContext = getMessageGroupContext({ from: '12345@g.us' })
  assert.equal(isAllowedSourceContext(privateContext, '13135550002@c.us'), true)
  assert.equal(isAllowedSourceContext(groupContext, '12345@g.us'), true)
  assert.equal(isAllowedSourceContext(privateContext, '13135550002@c.us', true), false)
  assert.equal(isAllowedSourceContext(groupContext, '12345@g.us', true), true)
  assert.equal(isAllowedSourceContext(privateContext, 'other@c.us'), false)
  assert.equal(isAllowedSourceContext({ chatId: '', chatType: 'private' }, '13135550002@c.us'), false)
})

test('identifies a group from the incoming message context without fetching chats', () => {
  assert.deepEqual(getMessageGroupContext({ from: '12345@g.us', chat: { isGroup: true, id: { _serialized: '12345@g.us' }, name: 'Jobs Group' } }), {
    isGroup: true,
    chatType: 'group',
    chatId: '12345@g.us',
    groupId: '12345@g.us',
    groupName: 'Jobs Group'
  })
  assert.deepEqual(getMessageGroupContext({ from: '12345@g.us' }), {
    isGroup: true,
    chatType: 'group',
    chatId: '12345@g.us',
    groupId: '12345@g.us',
    groupName: ''
  })
})

test('discovery accepts safe group messages and ignores personal or malformed chat IDs', () => {
  assert.equal(getDiscoverableGroupId({ from: '12345@g.us', body: 'private group contents', id: { _serialized: 'message-id' } }), '12345@g.us')
  assert.equal(getDiscoverableGroupId({ from: '15551234567@c.us', body: 'personal contents', id: { _serialized: 'message-id' } }), '')
  assert.equal(getDiscoverableGroupId({ from: 'not-a-chat-id', chat: { isGroup: true, id: { _serialized: '12345@g.us' } } }), '')
  assert.equal(getDiscoverableGroupId({}), '')
})

test('personal discovery accepts only validated @c.us identifiers', () => {
  assert.equal(getDiscoverablePersonalChatId({ from: '15551234567@c.us' }), '15551234567@c.us')
  assert.equal(getDiscoverablePersonalChatId({ from: ' 15551234567@c.us ' }), '15551234567@c.us')
  assert.equal(getDiscoverablePersonalChatId({ from: '12345@g.us' }), '')
  assert.equal(getDiscoverablePersonalChatId({ from: '15551234567@c.us.evil' }), '')
  assert.equal(getDiscoverablePersonalChatId({ from: 'not-a-chat-id' }), '')
  assert.equal(getDiscoverablePersonalChatId({ chat: { id: { _serialized: '15551234567@c.us' } } }), '')
})

test('personal discovery emits each validated ID once and reads no message or contact data', () => {
  const emitted = []
  const onDiscovered = createDiscoveryMessageHandler('personal', (event, chatId) => emitted.push({ event, chatId }))
  const message = { from: '15551234567@c.us' }
  Object.defineProperties(message, {
    body: { get() { throw new Error('body must not be read') } },
    contact: { get() { throw new Error('contact must not be read') } }
  })

  onDiscovered(message)
  onDiscovered(message)

  assert.deepEqual(emitted, [{ event: 'personal_chat_discovered', chatId: '15551234567@c.us' }])
})

test('discovery logger omits phone-shaped personal chat IDs but preserves group IDs', () => {
  const records = []
  const logDiscovery = createDiscoveryLogger((event, details) => records.push({ event, details }))
  logDiscovery('personal_chat_discovered', '15551234567@c.us')
  logDiscovery('group_discovered', '12345@g.us')

  assert.deepEqual(records, [
    { event: 'personal_chat_discovered', details: undefined },
    { event: 'group_discovered', details: { chatId: '12345@g.us' } }
  ])
  assert.equal(JSON.stringify(records).includes('15551234567'), false)
})

test('group and personal discovery processors are isolated and cannot both be enabled', () => {
  const groupEvents = []
  const personalEvents = []
  const onGroup = createDiscoveryMessageHandler('group', (event, chatId) => groupEvents.push({ event, chatId }))
  const onPersonal = createDiscoveryMessageHandler('personal', (event, chatId) => personalEvents.push({ event, chatId }))

  onGroup({ from: '15551234567@c.us' })
  onPersonal({ from: '12345@g.us' })
  onGroup({ from: '12345@g.us' })
  onPersonal({ from: '15551234567@c.us' })

  assert.deepEqual(groupEvents, [{ event: 'group_discovered', chatId: '12345@g.us' }])
  assert.deepEqual(personalEvents, [{ event: 'personal_chat_discovered', chatId: '15551234567@c.us' }])
  assert.equal(selectDiscoveryMode(true, true), 'conflict')
  assert.equal(selectDiscoveryMode(true, false), 'group')
  assert.equal(selectDiscoveryMode(false, true), 'personal')
  assert.equal(selectDiscoveryMode(false, false), 'normal')
  assert.equal(selectDiscoveryMode(false, false, true), 'managed')
  assert.equal(selectDiscoveryMode(true, false, true), 'conflict')
  assert.equal(selectDiscoveryMode('true', false), 'normal')
})

test('listener lifecycle logging discards QR, exception, and disconnect payloads', () => {
  const records = []
  const logLifecycle = createListenerLifecycleLoggers((event, details) => records.push({ event, details }))
  logLifecycle.initializationStarted()
  logLifecycle.qrRequired('sensitive-qr-payload')
  logLifecycle.authenticated('session-details')
  logLifecycle.loadingScreen(42, 'WhatsApp')
  logLifecycle.initializationCompleted()
  logLifecycle.initializationFailed(new Error('secret exception text'))
  logLifecycle.disconnected('private disconnect reason')
  logLifecycle.clientError(new Error('private error details'))
  logLifecycle.reconnectFailed(new Error('private reconnect details'))

  assert.deepEqual(records, [
    { event: 'initialization_started', details: undefined },
    { event: 'qr_required', details: undefined },
    { event: 'authenticated', details: undefined },
    { event: 'loading_screen', details: undefined },
    { event: 'initialization_completed', details: undefined },
    { event: 'initialization_failed', details: { code: 'client_initialize_rejected' } },
    { event: 'disconnected', details: { code: 'client_disconnected' } },
    { event: 'client_error', details: { code: 'client_error_event' } },
    { event: 'reconnect_failed', details: { code: 'reconnect_initialize_rejected' } }
  ])
  assert.equal(JSON.stringify(records).includes('sensitive-qr-payload'), false)
  assert.equal(JSON.stringify(records).includes('secret exception text'), false)
  assert.equal(JSON.stringify(records).includes('private disconnect reason'), false)
})

test('prefers a safe message.from group ID over an arbitrary chat ID object', () => {
  assert.deepEqual(getMessageGroupContext({ from: '12345@g.us', chat: { isGroup: true, id: { user: '12345', server: 'g.us' } } }), {
    isGroup: true,
    chatType: 'group',
    chatId: '12345@g.us',
    groupId: '12345@g.us',
    groupName: ''
  })
})

test('rejects a serialized chat ID when message.from is unavailable', () => {
  assert.deepEqual(getMessageGroupContext({ chat: { isGroup: true, id: { _serialized: '12345@g.us' } } }), {
    isGroup: null,
    chatType: null,
    chatId: '',
    groupId: '',
    groupName: ''
  })
})

test('does not treat private chats or unsafe IDs as groups', () => {
  assert.equal(getMessageGroupContext({ from: '15551234567@c.us' }).isGroup, false)
  assert.deepEqual(getMessageGroupContext({ from: '15551234567@c.us' }), {
    isGroup: false,
    chatType: 'private',
    chatId: '15551234567@c.us',
    groupId: '',
    groupName: ''
  })
  assert.equal(getMessageGroupContext({ chat: { isGroup: false, id: { _serialized: '15551234567@c.us' } } }).isGroup, null)
  assert.equal(getMessageGroupContext({ from: 'not-a-chat-id', chat: { isGroup: true, id: { _serialized: '12345@g.us' } } }).chatId, '')
  assert.deepEqual(getMessageGroupContext({ chat: { isGroup: true, name: 'Unknown ID' } }), {
    isGroup: null,
    chatType: null,
    chatId: '',
    groupId: '',
    groupName: ''
  })
  assert.deepEqual(getMessageGroupContext({}), {
    isGroup: null,
    chatType: null,
    chatId: '',
    groupId: '',
    groupName: ''
  })
  assert.deepEqual(getMessageGroupContext({ chat: { isGroup: true, id: { user: '12345', server: 'g.us' } } }), {
    isGroup: null,
    chatType: null,
    chatId: '',
    groupId: '',
    groupName: ''
  })
})
